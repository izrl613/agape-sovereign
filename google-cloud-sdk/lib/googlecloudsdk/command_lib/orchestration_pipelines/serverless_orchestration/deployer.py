# -*- coding: utf-8 -*- #
# Copyright 2026 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Deployer for Serverless Orchestration API pipelines."""

import argparse
import collections
from collections.abc import Iterator, Mapping, Sequence
import contextlib
import dataclasses
import datetime
import itertools
import pathlib
from typing import Any
import uuid

from googlecloudsdk.calliope import exceptions as calliope_exceptions
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import errors
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import pipeline_compiler
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import pipeline_loader
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.clients import gcs_client
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.clients import orchestration_client
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import dbt
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import models
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import sdp
from googlecloudsdk.command_lib.orchestration_pipelines.tools import yaml_processor
from googlecloudsdk.core import log
from googlecloudsdk.core import properties
from googlecloudsdk.core.util import files

# `Pipeline` fields that `pipeline_compiler.CompilePipeline` always sets; the
# update mask lists them, so that an update clears any the new body omits.
_UPDATED_PIPELINE_FIELDS = (
    "spec",
    "executionIdentity",
    "outputArtifactStorage",
)
# `Pipeline.triggers`, which the update mask only lists when the triggers of
# the pipeline YAML differ from the deployed ones.
_TRIGGERS_FIELD = "triggers"


@dataclasses.dataclass(frozen=True)
class DeployResult:
  """Result of deploying a Serverless Orchestration pipeline.

  Attributes:
    pipeline_name: `projects/*/locations/*/pipelines/*` name of the pipeline.
    version_id: Version ID of this deployment (`vYYYYmmdd-HHMMSS`).
    artifacts: `gs://` URIs of the artifacts uploaded for all data models.
    operation: Name of the create or update long-running operation, or None if
      the API response omits it.
    status: `SUCCEEDED` once the operation completed; `PENDING` with `--async`
      or when the wait was interrupted.
  """

  pipeline_name: str
  version_id: str
  artifacts: tuple[str, ...]
  operation: str | None
  status: str


def IsServerlessOrchestrationDeployment(args: argparse.Namespace) -> bool:
  """Returns True if the configured pipelines use `runner: orchestration_service`.

  Returns False when a YAML file is missing or invalid so the Cloud Composer
  flow reports the error.

  Args:
    args: The parsed command-line arguments.

  Returns:
    True if the configured pipelines use `runner: orchestration_service`.

  Raises:
    errors.PipelineLoadError: If `deployment.yaml` mixes `orchestration_service`
      with another `runner` field, or if `deployment.yaml` is absent and
      `./pipeline.yaml` is malformed.
  """
  try:
    runner_fields = _GetRunnerFieldsFromPipelineFiles(args.environment)
  except errors.PipelineLoadError as e:
    if _HasStandaloneDefaultPipelineFile():
      raise
    log.debug(
        "Routing deployment to Cloud Composer after pipeline check failed: %s",
        e,
    )
    return False
  _VerifyAllPipelinesShareSameRunnerField(runner_fields)
  return pipeline_loader.ORCHESTRATION_SERVICE_RUNNER in runner_fields


def Deploy(
    args: argparse.Namespace,
    *,
    dbt_packager: dbt.DbtPackager | None = None,
    sdp_packager: sdp.SdpPackager | None = None,
    storage_client: gcs_client.GcsClient | None = None,
    api_client: orchestration_client.OrchestrationClient | None = None,
) -> dict[str, Any]:
  """Packages the data models, uploads them, and deploys the pipeline.

  Args:
    args: The parsed command-line arguments.
    dbt_packager: Optional dbt data model packager (injected in tests).
    sdp_packager: Optional SDP data model packager (injected in tests).
    storage_client: Optional Cloud Storage client (injected in tests).
    api_client: Optional Orchestration service client (injected in tests).

  Returns:
    The deployment result as a dict (see `DeployResult`).

  Raises:
    calliope_exceptions.InvalidArgumentException: If a Cloud Composer-only
      `deploy` flag is set.
    errors.PipelineLoadError: If the pipeline YAML cannot be loaded.
    errors.PackagingError: If a dbt project or SDP data model cannot be
      packaged.
    errors.UploadError: If an artifact upload fails.
    errors.OrchestrationApiError: If an Orchestration API call fails.
    errors.PipelineCompileError: If pipeline compilation fails.
  """
  _VerifyComposerOnlyFlagsAreUnset(args)
  loaded_pipeline = pipeline_loader.LoadPipeline(args)
  with _UseProjectForApiCalls(loaded_pipeline.project):
    return _DeployLoadedPipeline(
        args,
        loaded_pipeline,
        dbt_packager or dbt.DbtPackager(),
        sdp_packager or sdp.SdpPackager(),
        storage_client or gcs_client.GcsClient(),
        api_client or orchestration_client.OrchestrationClient(),
    )


def _GetRunnerFieldsFromPipelineFiles(
    environment_name: str | None,
) -> list[Any]:
  """Returns the `runner` field of each configured pipeline YAML."""
  pipeline_file_paths = pipeline_loader.GetPipelineFilePaths(environment_name)
  return [
      pipeline_loader.LoadRawYamlMapping(pipeline_file_path).get("runner")
      for pipeline_file_path in pipeline_file_paths
  ]


def _HasStandaloneDefaultPipelineFile() -> bool:
  """Returns True if `./pipeline.yaml` exists without `./deployment.yaml`."""
  working_directory = pathlib.Path.cwd()
  return (
      not (working_directory / yaml_processor.DEPLOYMENT_FILE_NAME).is_file()
      and (
          working_directory / pipeline_loader.DEFAULT_PIPELINE_FILE_NAME
      ).is_file()
  )


def _VerifyAllPipelinesShareSameRunnerField(
    runner_fields: Sequence[Any],
) -> None:
  """Verifies no other `runner` field is mixed with `orchestration_service`."""
  if pipeline_loader.ORCHESTRATION_SERVICE_RUNNER in runner_fields and any(
      runner_field != pipeline_loader.ORCHESTRATION_SERVICE_RUNNER
      for runner_field in runner_fields
  ):
    raise errors.PipelineLoadError(
        "Cannot mix `runner: orchestration_service` with other runners in"
        " `deployment.yaml`."
    )


def _VerifyComposerOnlyFlagsAreUnset(args: argparse.Namespace) -> None:
  """Verifies no Cloud Composer-only `deploy` flag is set."""
  composer_only_flag_values = {
      "--validate": args.validate,
      "--rollback": args.rollback,
      "--version": args.version,
      "--local": args.local,
      # `--no-paused` sets `paused` to False, so only None means it is unset.
      "--paused": args.paused is not None,
  }
  for flag_name, flag_value in composer_only_flag_values.items():
    if flag_value:
      raise calliope_exceptions.InvalidArgumentException(
          flag_name,
          "This flag is not supported for `runner: orchestration_service`"
          " pipelines.",
      )


@contextlib.contextmanager
def _UseProjectForApiCalls(project: str) -> Iterator[None]:
  """Sets `core/project` to `project` inside the block, over `--project`."""
  # An invocation value outranks `--project`, whereas `Property.Set()` only
  # sets an environment variable. `billing/quota_project` is left as is: its
  # `CURRENT_PROJECT` default already makes `core/project` the quota project
  # for user credentials, and an explicit `--billing-project` still applies.
  properties.VALUES.PushInvocationValues()
  try:
    properties.VALUES.SetInvocationValue(
        properties.VALUES.core.project, project, None
    )
    yield
  finally:
    properties.VALUES.PopInvocationValues()


def _DeployLoadedPipeline(
    args: argparse.Namespace,
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    dbt_packager: dbt.DbtPackager,
    sdp_packager: sdp.SdpPackager,
    storage_client: gcs_client.GcsClient,
    api_client: orchestration_client.OrchestrationClient,
) -> dict[str, Any]:
  """Packages and uploads `loaded_pipeline`, then creates or updates it."""
  pipeline_name = pipeline_compiler.BuildPipelineResourceName(loaded_pipeline)
  # Looked up first so auth and IAM errors surface before anything is uploaded.
  existing_pipeline = api_client.GetPipeline(pipeline_name)
  version_id = _GenerateVersionId()
  uploaded_artifacts_by_model = _PackageAndUploadDataModels(
      loaded_pipeline, version_id, dbt_packager, sdp_packager, storage_client
  )
  compiled_pipeline = pipeline_compiler.CompilePipeline(
      loaded_pipeline, uploaded_artifacts_by_model, version_id
  )
  operation = _CreateOrUpdatePipeline(
      api_client, compiled_pipeline, existing_pipeline
  )
  status = _WaitForDeployment(
      api_client, compiled_pipeline.pipeline_id, operation, args.async_
  )
  return _BuildDeployResult(
      compiled_pipeline, uploaded_artifacts_by_model, operation, status
  )


def _GenerateVersionId() -> str:
  """Generates a UTC timestamp version ID (`vYYYYmmdd-HHMMSS`)."""
  return datetime.datetime.now(datetime.timezone.utc).strftime("v%Y%m%d-%H%M%S")


def _PackageAndUploadDataModels(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    version_id: str,
    dbt_packager: dbt.DbtPackager,
    sdp_packager: sdp.SdpPackager,
    storage_client: gcs_client.GcsClient,
) -> dict[str, tuple[gcs_client.UploadedArtifact, ...]]:
  """Packages all data models, then uploads their files to Cloud Storage."""
  with files.TemporaryDirectory() as staging_directory:
    packaged_artifacts = _PackageDataModels(
        loaded_pipeline,
        dbt_packager,
        sdp_packager,
        pathlib.Path(staging_directory),
    )
    return _UploadPackagedArtifacts(
        loaded_pipeline, version_id, packaged_artifacts, storage_client
    )


def _PackageDataModels(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    dbt_packager: dbt.DbtPackager,
    sdp_packager: sdp.SdpPackager,
    staging_directory: pathlib.Path,
) -> list[models.PackagedArtifact]:
  """Packages each data model into its own staging subdirectory.

  The subdirectories of `staging_directory` are named after the position of
  the data model, not its ID: IDs that differ only in case would otherwise
  share staged files on case-insensitive file systems.

  Args:
    loaded_pipeline: The pipeline whose data models are packaged.
    dbt_packager: Packages one dbt data model.
    sdp_packager: Packages one SDP data model.
    staging_directory: Empty directory that receives the staged files.

  Returns:
    The packaged artifact of each data model: the dbt data models in
    `dbt_models` order, then the SDP data models in `sdp_models` order.
  """
  packaged_artifacts = []
  for index, dbt_model in enumerate(loaded_pipeline.dbt_models):
    log.status.Print(f"Packaging data model '{dbt_model.id}'...")
    packaged_artifacts.append(
        dbt_packager.Package(
            dbt_model,
            _CreatePackagingContext(loaded_pipeline, staging_directory, index),
        )
    )
  for index, sdp_model in enumerate(
      loaded_pipeline.sdp_models, start=len(loaded_pipeline.dbt_models)
  ):
    log.status.Print(f"Packaging data model '{sdp_model.id}'...")
    packaged_artifacts.append(
        sdp_packager.Package(
            sdp_model,
            _CreatePackagingContext(loaded_pipeline, staging_directory, index),
        )
    )
  return packaged_artifacts


def _CreatePackagingContext(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    staging_directory: pathlib.Path,
    index: int,
) -> models.PackagingContext:
  """Returns the context that packages the `index`-th data model."""
  model_staging_directory = staging_directory / str(index)
  model_staging_directory.mkdir()
  return models.PackagingContext(
      pipeline_id=loaded_pipeline.pipeline_id,
      target=loaded_pipeline.target,
      staging_dir=model_staging_directory,
      template_variables=loaded_pipeline.template_variables,
  )


def _UploadPackagedArtifacts(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    version_id: str,
    packaged_artifacts: Sequence[models.PackagedArtifact],
    storage_client: gcs_client.GcsClient,
) -> dict[str, tuple[gcs_client.UploadedArtifact, ...]]:
  """Uploads each data model's packaged files to `<version_prefix>/<id>`."""
  artifact_prefix = gcs_client.BuildVersionedArtifactPrefix(
      loaded_pipeline.pipeline_id,
      version_id,
      loaded_pipeline.artifact_path_prefix,
  )
  uploaded_artifacts_by_model = {}
  for packaged_artifact in packaged_artifacts:
    model_prefix = f"{artifact_prefix}/{packaged_artifact.model_id}"
    log.status.Print(
        f"Uploading artifacts of data model '{packaged_artifact.model_id}' to"
        f" gs://{loaded_pipeline.artifact_bucket}/{model_prefix}/..."
    )
    uploaded_artifacts_by_model[packaged_artifact.model_id] = (
        storage_client.UploadWithPrefix(
            packaged_artifact.files,
            loaded_pipeline.artifact_bucket,
            model_prefix,
        )
    )
  return uploaded_artifacts_by_model


def _CreateOrUpdatePipeline(
    api_client: orchestration_client.OrchestrationClient,
    compiled_pipeline: pipeline_compiler.CompiledPipeline,
    existing_pipeline: Mapping[str, Any] | None,
) -> Mapping[str, Any]:
  """Creates `compiled_pipeline`, or updates `existing_pipeline` to it.

  Args:
    api_client: The Orchestration service client.
    compiled_pipeline: The pipeline to deploy.
    existing_pipeline: The deployed pipeline, or None if it does not exist.

  Returns:
    The create or update long-running operation.
  """
  log.status.Print(f"Deploying pipeline '{compiled_pipeline.pipeline_id}'...")
  # Lets the API ignore a duplicate of this request if the first one timed out.
  request_id = str(uuid.uuid4())
  if existing_pipeline is not None:
    body, update_mask = _BuildPipelineUpdate(
        compiled_pipeline.body, existing_pipeline
    )
    return api_client.UpdatePipeline(
        name=compiled_pipeline.name,
        body=body,
        update_mask=update_mask,
        request_id=request_id,
    )
  return api_client.CreatePipeline(
      parent=compiled_pipeline.parent,
      pipeline_id=compiled_pipeline.pipeline_id,
      body=compiled_pipeline.body,
      request_id=request_id,
  )


def _BuildPipelineUpdate(
    compiled_body: Mapping[str, Any], existing_pipeline: Mapping[str, Any]
) -> tuple[dict[str, Any], str]:
  """Returns the body and update mask that update `existing_pipeline`.

  The mask lists `triggers` only when the compiled triggers differ from the
  deployed ones, so that redeploying a pipeline with unchanged triggers works
  while the Orchestration service rejects updates of `triggers`.

  Args:
    compiled_body: The `Pipeline` fields of the compiled pipeline.
    existing_pipeline: The deployed pipeline.

  Returns:
    `(body, update_mask)`: the fields that the update mask lists, and the mask.
  """
  body = dict(compiled_body)
  triggers = body.pop(_TRIGGERS_FIELD, [])
  update_fields = list(_UPDATED_PIPELINE_FIELDS)
  # TODO(b/567530656): Always list `triggers` once the Orchestration service
  # updates them.
  if _TriggersDiffer(triggers, existing_pipeline.get(_TRIGGERS_FIELD, [])):
    # With `triggers` in the mask, an empty list, which the request omits,
    # removes the deployed triggers.
    body[_TRIGGERS_FIELD] = triggers
    update_fields.append(_TRIGGERS_FIELD)
  return body, ",".join(update_fields)


def _TriggersDiffer(
    triggers: Sequence[Mapping[str, Any]],
    deployed_triggers: Sequence[Mapping[str, Any]],
) -> bool:
  """Returns True if a trigger was added, removed or changed.

  Like the Orchestration service, which has no IDs for triggers, compares them
  by their normalized contents, in any order.

  Args:
    triggers: The `PipelineTrigger`s of the compiled pipeline.
    deployed_triggers: The `PipelineTrigger`s of the deployed pipeline.

  Returns:
    True if the triggers are not the same as the deployed ones.
  """
  normalized_triggers = collections.Counter(map(_NormalizeTrigger, triggers))
  normalized_deployed_triggers = collections.Counter(
      map(_NormalizeTrigger, deployed_triggers)
  )
  return normalized_triggers != normalized_deployed_triggers


def _NormalizeTrigger(trigger: Mapping[str, Any]) -> tuple[Any, ...]:
  """Returns the fields of a `PipelineTrigger` that `deploy` sets, normalized.

  Applies the defaults that the Orchestration service applies when it compares
  triggers: the `ACTIVE` activation mode, the `UTC` time zone, and single
  spaces between the fields of a cron schedule. Other fields, such as any that
  the service adds to deployed triggers, are not compared.

  Args:
    trigger: A `PipelineTrigger`, keyed by its JSON field names.

  Returns:
    A hashable tuple that is equal for triggers that the service considers the
    same.
  """
  inline_trigger = trigger.get("inlineTrigger") or {}
  activation_mode = trigger.get("activationMode")
  if activation_mode in (None, "ACTIVATION_MODE_UNSPECIFIED"):
    activation_mode = "ACTIVE"
  cron_sources = tuple(
      _NormalizeCronSource(event_source.get("cron") or {})
      for event_source in inline_trigger.get("eventSources") or []
  )
  return (
      cron_sources,
      inline_trigger.get("startTime"),
      inline_trigger.get("endTime"),
      activation_mode,
  )


def _NormalizeCronSource(cron: Mapping[str, Any]) -> tuple[str, str]:
  """Returns the `(schedule, timeZone)` of a `CronSource`, normalized."""
  schedule = " ".join(cron.get("schedule", "").split())
  return schedule, cron.get("timeZone") or "UTC"


def _WaitForDeployment(
    api_client: orchestration_client.OrchestrationClient,
    pipeline_id: str,
    operation: Mapping[str, Any],
    async_: bool,
) -> str:
  """Waits for `operation` unless `async_`; returns `DeployResult.status`."""
  operation_name = operation.get("name")
  if async_:
    log.status.Print(
        f"Deployment of pipeline '{pipeline_id}' started (operation"
        f" {operation_name}). Exiting due to --async flag."
    )
    return "PENDING"
  try:
    api_client.WaitOperation(operation)
  except KeyboardInterrupt:
    log.status.Print(
        f"Interrupted; the deployment of pipeline '{pipeline_id}' continues in"
        f" the background (operation {operation_name})."
    )
    return "PENDING"
  return "SUCCEEDED"


def _BuildDeployResult(
    compiled_pipeline: pipeline_compiler.CompiledPipeline,
    uploaded_artifacts_by_model: Mapping[
        str, Sequence[gcs_client.UploadedArtifact]
    ],
    operation: Mapping[str, Any],
    status: str,
) -> dict[str, Any]:
  """Builds the `DeployResult` dict returned by the `deploy` command."""
  uploaded_artifacts = itertools.chain.from_iterable(
      uploaded_artifacts_by_model.values()
  )
  return dataclasses.asdict(
      DeployResult(
          pipeline_name=compiled_pipeline.name,
          version_id=compiled_pipeline.version_id,
          artifacts=tuple(artifact.gcs_uri for artifact in uploaded_artifacts),
          operation=operation.get("name"),
          status=status,
      )
  )
