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
"""Compiles a loaded pipeline and its uploaded artifacts into an API body."""

from collections.abc import Mapping, Sequence
import dataclasses
from typing import Any

from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import errors
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import pipeline_loader
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.clients import gcs_client
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import dbt
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import sdp


@dataclasses.dataclass(frozen=True)
class CompiledPipeline:
  """Compiled Orchestration API `Pipeline` resource and request payload.

  Attributes:
    parent: Parent location resource name (`projects/*/locations/*`).
    pipeline_id: Pipeline identifier under `parent`.
    body: `Pipeline` resource fields sent in the create or update request, keyed
      by their JSON (camelCase) names. `triggers` is only set when the pipeline
      YAML defines triggers.
    version_id: Deployment version identifier.
  """

  parent: str
  pipeline_id: str
  body: Mapping[str, Any]
  version_id: str

  @property
  def name(self) -> str:
    """Full resource name of the pipeline."""
    return f"{self.parent}/pipelines/{self.pipeline_id}"


def BuildPipelineResourceName(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
) -> str:
  """Returns the `projects/*/locations/*/pipelines/*` name of the pipeline.

  Args:
    loaded_pipeline: The validated pipeline and environment model.

  Returns:
    The full resource name of the pipeline being deployed.
  """
  return (
      f"{_BuildParentResourceName(loaded_pipeline)}"
      f"/pipelines/{loaded_pipeline.pipeline_id}"
  )


def CompilePipeline(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    uploaded_artifacts_by_model: Mapping[
        str, Sequence[gcs_client.UploadedArtifact]
    ],
    version_id: str,
) -> CompiledPipeline:
  """Builds the Orchestration API `Pipeline` payload for `loaded_pipeline`.

  Every dbt data model and every SDP data model becomes a `DataModel` of one
  `DataPipeline`. A dbt data model runs the uploaded archive of its project on
  the Google-managed dbt runtime; an SDP data model runs the uploaded
  `sdp_bundle.zip` on Serverless Spark with its `executionConfig`. Both run as
  the service account of the pipeline and write their output artifacts to the
  pipeline's `outputArtifactStorage.gcs.uri`, or by default to the `outputs`
  directory next to the uploaded versions of the pipeline. The pipeline's
  triggers, which start runs on cron schedules, become `Pipeline.triggers`.

  Args:
    loaded_pipeline: The validated pipeline and environment model.
    uploaded_artifacts_by_model: Uploaded GCS artifacts keyed by data model ID.
    version_id: The deployment version identifier. It is not part of the body
      because the Orchestration service rejects `Pipeline.version_id`.

  Returns:
    The compiled `Pipeline` resource and identity.

  Raises:
    errors.NotImplementedYetError: If the pipeline defines `spec.task`, which
      can't be deployed yet.
    errors.PipelineCompileError: If a data model does not have exactly one
      uploaded archive, or Cloud Storage reported no CRC32C checksum for it.
  """
  if loaded_pipeline.task is not None:
    raise errors.NotImplementedYetError(
        "Deploying a pipeline with `spec.task` is not supported yet."
    )
  return CompiledPipeline(
      parent=_BuildParentResourceName(loaded_pipeline),
      pipeline_id=loaded_pipeline.pipeline_id,
      body=_BuildPipelineBody(loaded_pipeline, uploaded_artifacts_by_model),
      version_id=version_id,
  )


def _BuildParentResourceName(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
) -> str:
  """Returns the `projects/*/locations/*` parent of the pipeline."""
  return (
      f"projects/{loaded_pipeline.project}/locations/{loaded_pipeline.location}"
  )


def _BuildPipelineBody(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    uploaded_artifacts_by_model: Mapping[
        str, Sequence[gcs_client.UploadedArtifact]
    ],
) -> dict[str, Any]:
  """Returns the `Pipeline` fields that the pipeline YAML defines."""
  body = {
      "spec": {
          "dataPipeline": _BuildDataPipeline(
              loaded_pipeline, uploaded_artifacts_by_model
          ),
      },
      "executionIdentity": _BuildExecutionIdentity(loaded_pipeline),
      "outputArtifactStorage": _BuildOutputArtifactStorage(loaded_pipeline),
  }
  if loaded_pipeline.triggers:
    body["triggers"] = [
        _BuildPipelineTrigger(trigger) for trigger in loaded_pipeline.triggers
    ]
  return body


def _BuildDataPipeline(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    uploaded_artifacts_by_model: Mapping[
        str, Sequence[gcs_client.UploadedArtifact]
    ],
) -> dict[str, Any]:
  """Returns a `DataPipeline` with a `DataModel` per dbt and SDP data model."""
  data_models = [
      _BuildDbtDataModel(
          dbt_model,
          _GetExecutionArchive(dbt_model.id, uploaded_artifacts_by_model),
      )
      for dbt_model in loaded_pipeline.dbt_models
  ]
  data_models.extend(
      _BuildSdpDataModel(
          sdp_model,
          _GetExecutionArchive(sdp_model.id, uploaded_artifacts_by_model),
      )
      for sdp_model in loaded_pipeline.sdp_models
  )
  return {"dataModels": data_models}


def _BuildDbtDataModel(
    dbt_model: pipeline_loader.DbtModelSpec,
    execution_archive: gcs_client.UploadedArtifact,
) -> dict[str, Any]:
  """Returns the `DataModel` that runs `dbt_model` from `execution_archive`."""
  return {
      "id": dbt_model.id,
      "dbt": {
          # The packager stores the dbt project under this top-level directory
          # of the archive.
          "sourcePath": dbt.ARCHIVE_ROOT_DIR,
          "executionArchive": _BuildExecutionArchive(execution_archive),
          "managedRuntime": {"dbtVersion": dbt_model.dbt_version},
      },
  }


def _BuildSdpDataModel(
    sdp_model: pipeline_loader.SdpModelSpec,
    execution_archive: gcs_client.UploadedArtifact,
) -> dict[str, Any]:
  """Returns the `DataModel` that runs `sdp_model` from `execution_archive`."""
  sdp_data_model: dict[str, Any] = {
      # The packager writes the effective spec under this name at the root of
      # the bundle.
      "specPath": sdp.EFFECTIVE_SPEC_FILE_NAME,
      "executionArchive": _BuildExecutionArchive(execution_archive),
  }
  execution_config = _BuildSdpExecutionConfig(sdp_model.execution_config)
  if execution_config:
    sdp_data_model["executionConfig"] = execution_config
  return {"id": sdp_model.id, "sdp": sdp_data_model}


def _BuildExecutionArchive(
    execution_archive: gcs_client.UploadedArtifact,
) -> dict[str, Any]:
  """Returns the `SourceArchive` that points at `execution_archive`."""
  return {
      "gcs": {
          "uri": execution_archive.gcs_uri,
          "crc32c": execution_archive.crc32c,
      },
  }


def _BuildSdpExecutionConfig(
    execution_config: pipeline_loader.SdpExecutionConfig,
) -> dict[str, Any]:
  """Returns the `SdpExecutionConfig` of a model; empty when nothing is set."""
  config: dict[str, Any] = {}
  if execution_config.properties:
    config["properties"] = dict(execution_config.properties)
  if execution_config.jar_uris:
    config["jarUris"] = list(execution_config.jar_uris)
  if execution_config.subnetwork:
    config["subnetwork"] = execution_config.subnetwork
  return config


def _GetExecutionArchive(
    model_id: str,
    uploaded_artifacts_by_model: Mapping[
        str, Sequence[gcs_client.UploadedArtifact]
    ],
) -> gcs_client.UploadedArtifact:
  """Returns the single archive uploaded for the data model `model_id`.

  Args:
    model_id: ID of the dbt or SDP data model.
    uploaded_artifacts_by_model: Uploaded GCS artifacts keyed by data model ID.

  Returns:
    The uploaded archive of the data model, which has a CRC32C checksum.

  Raises:
    errors.PipelineCompileError: If the data model does not have exactly one
      uploaded archive, or Cloud Storage reported no CRC32C checksum for it.
  """
  uploaded_artifacts = uploaded_artifacts_by_model.get(model_id, ())
  if len(uploaded_artifacts) != 1:
    raise errors.PipelineCompileError(
        f"Expected exactly one uploaded archive for data model '{model_id}',"
        f" got {len(uploaded_artifacts)}."
    )
  execution_archive = uploaded_artifacts[0]
  # The Orchestration service requires the checksum to verify the archive.
  if not execution_archive.crc32c:
    raise errors.PipelineCompileError(
        "Cloud Storage reported no CRC32C checksum for"
        f" {execution_archive.gcs_uri}."
    )
  return execution_archive


def _BuildExecutionIdentity(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
) -> dict[str, Any]:
  """Returns the `ExecutionIdentity` that runs of the pipeline use."""
  return {"serviceAccount": {"email": loaded_pipeline.service_account}}


def _BuildOutputArtifactStorage(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
) -> dict[str, Any]:
  """Returns the `ArtifactStorage` where runs of the pipeline write outputs."""
  if loaded_pipeline.output_artifact_storage_uri:
    return {"gcs": {"uri": loaded_pipeline.output_artifact_storage_uri}}
  output_prefix = gcs_client.BuildOutputArtifactPrefix(
      loaded_pipeline.pipeline_id, loaded_pipeline.artifact_path_prefix
  )
  # No trailing slash: the service appends subdirectories such as `/compile`
  # to the URI.
  output_uri = f"gs://{loaded_pipeline.artifact_bucket}/{output_prefix}"
  return {"gcs": {"uri": output_uri}}


def _BuildPipelineTrigger(
    trigger: pipeline_loader.PipelineTrigger,
) -> dict[str, Any]:
  """Returns the `PipelineTrigger` for `trigger`, without its unset fields."""
  inline_trigger: dict[str, Any] = {
      "eventSources": [
          {"cron": _BuildCronSource(cron_source)}
          for cron_source in trigger.cron_sources
      ],
  }
  if trigger.start_time is not None:
    inline_trigger["startTime"] = trigger.start_time
  if trigger.end_time is not None:
    inline_trigger["endTime"] = trigger.end_time
  pipeline_trigger: dict[str, Any] = {"inlineTrigger": inline_trigger}
  if trigger.activation_mode is not None:
    pipeline_trigger["activationMode"] = trigger.activation_mode
  return pipeline_trigger


def _BuildCronSource(cron_source: pipeline_loader.CronSource) -> dict[str, Any]:
  """Returns the `CronSource` for `cron_source`, without an unset time zone."""
  cron: dict[str, Any] = {"schedule": cron_source.schedule}
  if cron_source.time_zone is not None:
    cron["timeZone"] = cron_source.time_zone
  return cron
