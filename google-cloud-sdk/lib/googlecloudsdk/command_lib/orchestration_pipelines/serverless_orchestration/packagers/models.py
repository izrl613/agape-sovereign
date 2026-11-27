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
"""Data models for locally packaged pipeline artifacts."""

from collections.abc import Mapping
import dataclasses
import hashlib
import pathlib
from typing import TypeAlias

HASH_CHUNK_SIZE = 1024 * 1024

# Deploy-time template variables of the pipeline (`deployment.yaml` built-ins,
# `variables` and substitutions), keyed by name; the values are YAML scalars.
TemplateVariables: TypeAlias = Mapping[str, str | int | float | bool]


@dataclasses.dataclass(frozen=True)
class PackagingContext:
  """Pipeline and environment settings for packaging a data model."""

  pipeline_id: str
  # The deployment environment; also the dbt target name.
  target: str
  staging_dir: pathlib.Path
  # Resolves the `{{ }}` tags of a data model's own files, such as
  # `spark-pipeline.yml`, the way they were resolved in `pipeline.yaml`.
  template_variables: TemplateVariables = dataclasses.field(
      default_factory=dict
  )


@dataclasses.dataclass(frozen=True)
class StagedFile:
  """Local file staged for upload to Cloud Storage."""

  # Local path to the packaged .tar.gz file on disk.
  local_path: pathlib.Path
  # Object name relative to the version prefix, e.g. `dbt_gold.tar.gz`.
  relative_path: str
  sha256: str


@dataclasses.dataclass(frozen=True)
class PackagedArtifact:
  """Staged files produced by packaging a data model."""

  model_id: str
  files: tuple[StagedFile, ...]


def ComputeSha256(path: pathlib.Path) -> str:
  """Returns the hex SHA-256 digest of `path`."""
  digest = hashlib.sha256()
  with path.open("rb") as stream:
    while chunk := stream.read(HASH_CHUNK_SIZE):
      digest.update(chunk)
  return digest.hexdigest()


def HasSymlinkAncestor(
    root_dir: pathlib.Path, relative_path: pathlib.Path
) -> bool:
  """Returns True if any parent directory of `relative_path` is a symlink."""
  return any(
      (root_dir / parent).is_symlink()
      for parent in relative_path.parents
      if parent != pathlib.Path(".")
  )

