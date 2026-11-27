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
"""Stages pipeline YAML and data-model source files for `source_directory`."""

from collections.abc import Iterable
import concurrent.futures
import os
import pathlib

from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import errors
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import pipeline_loader
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import dbt
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import models
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import sdp

MAX_SOURCE_FILES = 1000
MAX_TOTAL_SOURCE_BYTES = 10 * 1024 * 1024  # 10 MiB
_MAX_HASH_WORKERS = 16


class SourcePackager:
  """Stages pipeline configuration and data-model source files for upload."""

  def __init__(
      self,
      *,
      max_files: int = MAX_SOURCE_FILES,
      max_total_bytes: int = MAX_TOTAL_SOURCE_BYTES,
  ):
    self._max_files = max_files
    self._max_total_bytes = max_total_bytes

  def Stage(
      self, loaded_pipeline: pipeline_loader.LoadedPipeline
  ) -> tuple[models.StagedFile, ...]:
    """Collects and validates source files relative to `base_dir`.

    Args:
      loaded_pipeline: The validated pipeline configuration whose config and
        data-model source files are staged.

    Returns:
      The staged source files sorted by their POSIX path relative to
      `loaded_pipeline.base_dir`.

    Raises:
      errors.PackagingError: If `base_dir` or any source file is missing, is a
        symbolic link, escapes `base_dir`, cannot be read, or if the staged
        files exceed `max_files` or `max_total_bytes`.
    """
    base_dir = loaded_pipeline.base_dir
    if base_dir.is_symlink() or not base_dir.is_dir():
      raise errors.PackagingError(
          f"Pipeline base directory '{base_dir}' must be an existing directory"
          " and not a symbolic link."
      )
    collected: dict[str, pathlib.Path] = {}
    for file_path, label in _IterSourceFiles(loaded_pipeline, base_dir):
      rel = _ValidateRelativeFile(file_path, base_dir, label)
      collected[rel.as_posix()] = file_path

    if len(collected) > self._max_files:
      raise errors.PackagingError(
          f"Source directory for pipeline '{loaded_pipeline.pipeline_id}'"
          f" contains {len(collected)} files, exceeding the maximum of"
          f" {self._max_files} files."
      )

    sorted_items = sorted(collected.items())
    total_bytes = 0
    try:
      for _, local_path in sorted_items:
        total_bytes += local_path.stat().st_size
        if total_bytes > self._max_total_bytes:
          raise errors.PackagingError(
              f"Source directory for pipeline '{loaded_pipeline.pipeline_id}'"
              " exceeds the maximum total size of"
              f" {self._max_total_bytes} bytes ({total_bytes} bytes)."
          )
      worker_count = min(_MAX_HASH_WORKERS, len(sorted_items))
      with concurrent.futures.ThreadPoolExecutor(worker_count) as executor:
        digests = list(
            executor.map(
                models.ComputeSha256, (path for _, path in sorted_items)
            )
        )
    except OSError as e:
      raise errors.PackagingError(f"Failed to read source file: {e}") from e
    return tuple(
        models.StagedFile(
            local_path=local_path, relative_path=relative_path, sha256=sha256
        )
        for (relative_path, local_path), sha256 in zip(sorted_items, digests)
    )


def _IterSourceFiles(
    loaded_pipeline: pipeline_loader.LoadedPipeline,
    base_dir: pathlib.Path,
) -> Iterable[tuple[pathlib.Path, str]]:
  """Yields `(file_path, label)` pairs for config and data-model source files."""
  pipeline_path = loaded_pipeline.pipeline_file_path or (
      base_dir / pipeline_loader.DEFAULT_PIPELINE_FILE_NAME
  )
  yield pipeline_path, f"Pipeline file '{pipeline_path}'"

  deployment_path = loaded_pipeline.deployment_file_path
  if deployment_path is not None and pathlib.Path(
      os.path.abspath(deployment_path)
  ).is_relative_to(os.path.abspath(base_dir)):
    yield deployment_path, f"Deployment file '{deployment_path}'"

  for dbt_model in loaded_pipeline.dbt_models:
    model_dir = dbt_model.project_directory
    _ValidateRelativePath(
        model_dir,
        base_dir,
        f"Data model '{dbt_model.id}': '{model_dir}'",
    )
    for file_path in dbt.CollectSourceFiles(dbt_model):
      yield file_path, f"Data model '{dbt_model.id}': '{file_path}'"

  for sdp_model in loaded_pipeline.sdp_models:
    model_dir = sdp_model.project_directory
    _ValidateRelativePath(
        model_dir,
        base_dir,
        f"Data model '{sdp_model.id}': '{model_dir}'",
    )
    for file_path in sdp.CollectSourceFiles(
        sdp_model, loaded_pipeline.template_variables
    ):
      yield file_path, f"Data model '{sdp_model.id}': '{file_path}'"


def _ValidateRelativeFile(
    path: pathlib.Path,
    base_dir: pathlib.Path,
    label: str,
) -> pathlib.Path:
  """Validates `path` is a regular file under `base_dir` and returns its relative path."""
  rel = _ValidateRelativePath(path, base_dir, label)
  if not path.is_file():
    raise errors.PackagingError(f"{label} must be an existing regular file.")
  return rel


def _ValidateRelativePath(
    path: pathlib.Path,
    base_dir: pathlib.Path,
    label: str,
) -> pathlib.Path:
  """Returns `path` relative to `base_dir`, rejecting escapes and symlinks."""
  if path.is_symlink():
    raise errors.PackagingError(f"{label} must not be a symbolic link.")
  try:
    rel = pathlib.Path(os.path.abspath(path)).relative_to(
        os.path.abspath(base_dir)
    )
  except ValueError as e:
    raise errors.PackagingError(
        f"{label} escapes the pipeline directory '{base_dir}'."
    ) from e
  if models.HasSymlinkAncestor(base_dir, rel):
    raise errors.PackagingError(f"{label} must not be under a symbolic link.")
  return rel

