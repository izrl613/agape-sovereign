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
"""Packages a Spark Declarative Pipelines (SDP) data model for deployment."""

import ast
from collections.abc import Mapping, Sequence
import glob
import pathlib
import re
from typing import Any
import zipfile

from googlecloudsdk.api_lib.storage import storage_util
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import errors
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import pipeline_loader
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import models
from googlecloudsdk.core import yaml

BUNDLE_ARCHIVE_NAME = "sdp_bundle.zip"
EFFECTIVE_SPEC_FILE_NAME = "spark-pipeline.yml"

# Top-level keys accepted by `pyspark.pipelines.cli.unpack_pipeline_spec`.
_ALLOWED_SPEC_FIELDS = frozenset({
    "name",
    "storage",
    "catalog",
    "database",
    "schema",
    "configuration",
    "libraries",
})
_OPTIONAL_STRING_SPEC_FIELDS = ("name", "catalog", "database", "schema")

_ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
_ZIP_CREATE_SYSTEM_UNIX = 3
_ZIP_FILE_EXTERNAL_ATTR = 0o100644 << 16
_ZIP_DIR_EXTERNAL_ATTR = (0o040755 << 16) | 0x10

_SECRET_MANAGER_RE = re.compile(
    r"(^projects/[^/]+/secrets/|^secretManager:)", re.IGNORECASE
)

_IGNORED_GLOB_DIR_NAMES = frozenset({
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
})
_IGNORED_GLOB_FILE_NAMES = frozenset({".DS_Store"})
_IGNORED_GLOB_SUFFIXES = frozenset({".pyc", ".pyo"})
_ALLOWED_LIBRARY_SUFFIXES = frozenset({".py", ".sql"})

_HARD_BLOCKED_SPARK_PROPERTIES = frozenset({
    "spark.master",
    "spark.submit.deployMode",
    "spark.jars.ivy",
    "spark.executor.extraClassPath",
    "spark.driver.extraClassPath",
})
_DEDICATED_FIELD_SPARK_PROPERTIES = {
    "spark.jars": "`executionConfig.jarUris`",
}
_LAUNCH_TIME_SPARK_PROPERTIES = frozenset({
    "spark.jars.packages",
    "spark.submit.pyFiles",
    "spark.files",
    "spark.archives",
    "spark.driver.memory",
    "spark.driver.cores",
    "spark.executor.memory",
    "spark.executor.cores",
    "spark.executor.instances",
})
_LAUNCH_TIME_SPARK_PREFIXES = ("spark.dynamicAllocation.",)


class SdpPackager:
  """Validates and packages an `SdpModelSpec` into deterministic archives."""

  def Package(
      self,
      model: pipeline_loader.SdpModelSpec,
      context: models.PackagingContext,
  ) -> models.PackagedArtifact:
    """Validates `model` and stages its `sdp_bundle.zip`."""
    source_description = f"Data model '{model.id}'"

    model_staging_dir = context.staging_dir / model.id
    try:
      model_staging_dir.mkdir(parents=True, exist_ok=True)
    except OSError as e:
      raise errors.PackagingError(
          f"{source_description}: failed to create staging directory"
          f" '{model_staging_dir}': {e}"
      ) from e

    effective_spec, spec_configuration = _LoadAndMergeEffectiveSpec(
        model, context.template_variables, source_description
    )
    _VerifyNoSecretManagerReferences(model, effective_spec, source_description)
    _VerifySparkProperties(
        spec_configuration,
        model.execution_config.properties,
        source_description,
    )
    library_files = _ResolveAndValidateLibraries(
        effective_spec, model.project_directory, source_description
    )
    bundle_staged_file = _CreateSdpBundleZip(
        model,
        model_staging_dir,
        effective_spec,
        library_files,
        source_description,
    )
    return models.PackagedArtifact(
        model_id=model.id, files=(bundle_staged_file,)
    )


def CollectSourceFiles(
    model: pipeline_loader.SdpModelSpec,
    template_variables: models.TemplateVariables,
) -> list[pathlib.Path]:
  """Returns `model.spec_path` and its validated library file paths."""
  source_description = f"Data model '{model.id}'"
  effective_spec = _LoadRawSdpSpec(
      model, template_variables, source_description
  )
  library_files = _ResolveAndValidateLibraries(
      effective_spec, model.project_directory, source_description
  )
  return [model.spec_path, *library_files]


def _LoadAndMergeEffectiveSpec(
    model: pipeline_loader.SdpModelSpec,
    template_variables: models.TemplateVariables,
    source_description: str,
) -> tuple[dict[str, Any], dict[str, str]]:
  """Loads the SDP spec from `specPath` and validates its fields."""
  effective_spec = _LoadRawSdpSpec(
      model, template_variables, source_description
  )
  _VerifyAllowedSpecFields(effective_spec, source_description)
  _VerifyOptionalSpecStringFields(effective_spec, source_description)
  if "name" not in effective_spec:
    effective_spec["name"] = model.id

  configuration = _NormalizeSpecConfiguration(
      effective_spec, source_description
  )
  _VerifyDatabaseAndSchemaCompatible(effective_spec, source_description)
  effective_spec["storage"] = _VerifyStorageUri(
      effective_spec.get("storage"), source_description
  )
  return effective_spec, configuration


def _LoadRawSdpSpec(
    model: pipeline_loader.SdpModelSpec,
    template_variables: models.TemplateVariables,
    source_description: str,
) -> dict[str, Any]:
  """Loads `model.spec_path` with its `{{ variable }}` template tags resolved.

  The spec goes through the same path as `pipeline.yaml`: the tags are masked
  before the YAML is parsed and resolved afterwards, so a variable value cannot
  add structure to the spec. A value that is exactly one tag takes the
  variable's value, with its type; tags inside a longer string or a mapping key
  are rendered as text.

  Args:
    model: The SDP data model whose `spec_path` to load.
    template_variables: The pipeline's template variables.
    source_description: Describes the data model for error messages.

  Returns:
    The resolved spec mapping.

  Raises:
    errors.PackagingError: If the spec cannot be loaded, a tag cannot be
      resolved, or two keys of a mapping resolve to the same key.
  """
  if model.spec_path.is_symlink() or not model.spec_path.is_file():
    raise errors.PackagingError(
        f"{source_description}: `specPath` '{model.spec_path}' must be an"
        " existing regular file."
    )
  try:
    raw_spec = pipeline_loader.LoadRawYamlMapping(model.spec_path)
    resolved_spec = pipeline_loader.ResolveTemplateTags(
        raw_spec,
        template_variables,
        f"{source_description} spec '{model.spec_path}'",
    )
  except errors.PipelineLoadError as e:
    raise errors.PackagingError(f"{source_description}: {e}") from e
  return dict(resolved_spec)


def _VerifyAllowedSpecFields(
    effective_spec: Mapping[Any, Any], source_description: str
) -> None:
  """Verifies `effective_spec` only defines supported top-level keys."""
  # `pyspark.pipelines.cli` rejects unknown top-level keys, so fail at deploy
  # time rather than on the cluster. Sort with `key=str` because YAML 1.1
  # parses unquoted keys such as `on:` as booleans.
  unknown_keys = sorted(set(effective_spec) - _ALLOWED_SPEC_FIELDS, key=str)
  if unknown_keys:
    raise errors.PackagingError(
        f"{source_description}: unsupported `spark-pipeline.yml` field(s)"
        f" {[str(key) for key in unknown_keys]}; allowed:"
        f" {sorted(_ALLOWED_SPEC_FIELDS)}."
    )


def _VerifyOptionalSpecStringFields(
    effective_spec: Mapping[str, Any], source_description: str
) -> None:
  """Verifies optional string fields in `effective_spec` when present."""
  for field in _OPTIONAL_STRING_SPEC_FIELDS:
    if field not in effective_spec:
      continue
    value = effective_spec[field]
    if not isinstance(value, str) or not value.strip():
      raise errors.PackagingError(
          f"{source_description}: `{field}` in `spark-pipeline.yml` must be a"
          " non-empty string."
      )


def _NormalizeSpecConfiguration(
    effective_spec: dict[str, Any], source_description: str
) -> dict[str, str]:
  """Validates and stringifies `configuration` in `effective_spec`."""
  raw_configuration = effective_spec.get("configuration")
  if raw_configuration is None:
    effective_spec.pop("configuration", None)
    return {}
  if not isinstance(raw_configuration, Mapping):
    raise errors.PackagingError(
        f"{source_description}: `configuration` in `spark-pipeline.yml` must"
        " be a mapping."
    )
  configuration: dict[str, str] = {}
  for key, value in raw_configuration.items():
    if not isinstance(key, str) or not key.strip():
      raise errors.PackagingError(
          f"{source_description}: `configuration` keys in `spark-pipeline.yml`"
          " must be non-empty strings."
      )
    if value is None:
      raise errors.PackagingError(
          f"{source_description}: `configuration.{key}` in"
          " `spark-pipeline.yml` must not be empty."
      )
    if not isinstance(value, (str, int, float, bool)):
      raise errors.PackagingError(
          f"{source_description}: `configuration.{key}` in"
          " `spark-pipeline.yml` must be a scalar value."
      )
    configuration[key] = _StringifyConfigValue(value)
  if configuration:
    effective_spec["configuration"] = configuration
  else:
    effective_spec.pop("configuration", None)
  return configuration


def _StringifyConfigValue(value: str | int | float | bool) -> str:
  """Renders a scalar configuration value the way Spark expects it."""
  if isinstance(value, bool):
    return str(value).lower()
  return str(value)


def _VerifyDatabaseAndSchemaCompatible(
    effective_spec: Mapping[str, Any], source_description: str
) -> None:
  """Verifies `database` and `schema` in `effective_spec` do not conflict."""
  has_database = effective_spec.get("database") is not None
  has_schema = effective_spec.get("schema") is not None
  if (
      has_database
      and has_schema
      and effective_spec["database"] != effective_spec["schema"]
  ):
    raise errors.PackagingError(
        f"{source_description}: conflicting `database`"
        f" ('{effective_spec['database']}') and `schema`"
        f" ('{effective_spec['schema']}') in `spark-pipeline.yml`."
    )


def _VerifyStorageUri(storage: Any, source_description: str) -> str:
  """Verifies `storage` is a `gs://` bucket or object URI; returns it stripped.

  Bucket and object names are checked with `storage_util`, which applies the
  Cloud Storage naming rules.

  Args:
    storage: The `storage` value of `spark-pipeline.yml`.
    source_description: Describes the data model for error messages.

  Returns:
    The stripped URI.

  Raises:
    errors.PackagingError: If `storage` is not a string or not a valid `gs://`
      URI.
  """
  storage_uri = storage.strip() if isinstance(storage, str) else ""
  try:
    object_ref = storage_util.ObjectReference.FromUrl(
        storage_uri, allow_empty_object=True
    )
    storage_util.ValidateBucketUrl(object_ref.bucket)
  except ValueError as e:
    raise errors.PackagingError(
        f"{source_description}: `spark-pipeline.yml` must set `storage` to a"
        f" valid `gs://` URI (got '{storage}'): {e}"
    ) from e
  return storage_uri


def _VerifyNoSecretManagerReferences(
    model: pipeline_loader.SdpModelSpec,
    effective_spec: Mapping[str, Any],
    source_description: str,
) -> None:
  """Rejects Secret Manager resource strings in `model` and its spec."""
  values_to_scan: list[str] = []
  _CollectStrings(model.execution_config.properties, values_to_scan)
  _CollectStrings(effective_spec, values_to_scan)
  for val in values_to_scan:
    if _SECRET_MANAGER_RE.search(val.strip()):
      raise errors.PackagingError(
          f"{source_description}: Secret Manager references ('{val}') are not"
          " supported in SDP."
      )


def _CollectStrings(value: Any, out: list[str]) -> None:
  """Recursively appends string values from `value` into `out`."""
  if isinstance(value, str):
    out.append(value)
  elif isinstance(value, Mapping):
    for v in value.values():
      _CollectStrings(v, out)
  elif isinstance(value, (list, tuple)):
    for item in value:
      _CollectStrings(item, out)


def _VerifySparkProperties(
    spec_configuration: Mapping[str, str],
    serverless_properties: Mapping[str, str],
    source_description: str,
) -> None:
  """Enforces the two-tier Spark property blocklist across spec and batch."""
  for key in spec_configuration:
    if key in _HARD_BLOCKED_SPARK_PROPERTIES:
      raise errors.PackagingError(
          f"{source_description}: Spark property `{key}` is managed by"
          " Serverless Spark and cannot be overridden."
      )
    if key in _DEDICATED_FIELD_SPARK_PROPERTIES:
      field_hint = _DEDICATED_FIELD_SPARK_PROPERTIES[key]
      raise errors.PackagingError(
          f"{source_description}: `{key}` is not allowed in"
          f" `spark-pipeline.yml` `configuration`; use {field_hint} on the"
          " dataModel instead."
      )
    if key in _LAUNCH_TIME_SPARK_PROPERTIES or key.startswith(
        _LAUNCH_TIME_SPARK_PREFIXES
    ):
      raise errors.PackagingError(
          f"{source_description}: launch-time Spark property `{key}` in"
          " `spark-pipeline.yml` `configuration` has no effect after JVM"
          " startup; move it to `executionConfig.properties`."
      )

  for key in serverless_properties:
    if key in _HARD_BLOCKED_SPARK_PROPERTIES:
      raise errors.PackagingError(
          f"{source_description}: Spark property `{key}` in"
          " `executionConfig.properties` is managed by Serverless Spark and"
          " cannot be overridden."
      )
    if key in _DEDICATED_FIELD_SPARK_PROPERTIES:
      field_hint = _DEDICATED_FIELD_SPARK_PROPERTIES[key]
      raise errors.PackagingError(
          f"{source_description}: `{key}` is not allowed in"
          f" `executionConfig.properties`; use {field_hint} on the dataModel"
          " instead."
      )


def _ResolveAndValidateLibraries(
    effective_spec: dict[str, Any],
    project_directory: pathlib.Path,
    source_description: str,
) -> list[pathlib.Path]:
  """Resolves `libraries` globs in `effective_spec` and validates `.py`/`.sql`.

  Requires each entry to use the canonical `{"glob": {"include": <pattern>}}`
  shape accepted by `pyspark.pipelines.cli`, and matches files the way the
  runtime does (see `_NormalizeLibraryPattern`).

  Args:
    effective_spec: The merged spec mapping; mutated in place.
    project_directory: Directory that glob patterns are resolved against.
    source_description: Human-readable model description for error messages.

  Returns:
    The sorted, de-duplicated list of matched library files.

  Raises:
    errors.PackagingError: If `libraries` is missing/empty, an entry has an
      unsupported shape, a pattern is empty, uses backslashes, is absolute,
      traverses upward, or is not a form the runtime accepts, matches no files,
      matches a symlink (or file under a symlinked directory) or a
      non-`.py`/`.sql` file, or a `.py` file has a syntax error.
  """
  raw_libraries = effective_spec.get("libraries")
  if not isinstance(raw_libraries, list) or not raw_libraries:
    raise errors.PackagingError(
        f"{source_description}: `spark-pipeline.yml` must define a non-empty"
        " `libraries` list."
    )
  resolved_project_dir = project_directory.resolve()
  matched_files: set[pathlib.Path] = set()
  canonical_libraries: list[dict[str, Any]] = []
  for entry in raw_libraries:
    pattern = _GetLibraryPattern(entry, source_description)
    canonical_libraries.append({"glob": {"include": pattern}})
    runtime_pattern = _NormalizeLibraryPattern(pattern, source_description)
    matches = [
        p
        for p in project_directory.glob(runtime_pattern)
        if (p.is_symlink() or p.is_file())
        and not _IsIgnoredGlobArtifact(p.relative_to(project_directory))
    ]
    if not matches:
      raise errors.PackagingError(
          f"{source_description}: `libraries` pattern '{pattern}' matched 0"
          f" files in '{project_directory}'."
      )
    for match_path in matches:
      _VerifyMatchedLibraryFile(
          match_path,
          pattern,
          project_directory,
          resolved_project_dir,
          source_description,
      )
      matched_files.add(match_path)
  effective_spec["libraries"] = canonical_libraries
  return sorted(
      matched_files,
      key=lambda p: p.relative_to(project_directory).as_posix(),
  )


def _GetLibraryPattern(entry: Any, source_description: str) -> str:
  """Returns the pattern from a `{glob: {include: <pattern>}}` entry."""
  pattern: Any = None
  if isinstance(entry, Mapping) and set(entry) == {"glob"}:
    glob_value = entry.get("glob")
    if isinstance(glob_value, Mapping) and set(glob_value) == {"include"}:
      pattern = glob_value.get("include")
  if not isinstance(pattern, str):
    raise errors.PackagingError(
        f"{source_description}: unsupported `libraries` entry '{entry}' in"
        " `spark-pipeline.yml`; expected `{glob: {include: <pattern>}}`."
    )
  pattern = pattern.strip()
  if not pattern:
    raise errors.PackagingError(
        f"{source_description}: `libraries` pattern must not be empty."
    )
  return pattern


def _NormalizeLibraryPattern(pattern: str, source_description: str) -> str:
  """Returns the pattern `pyspark.pipelines` globs with, or raises.

  Mirrors `pyspark.pipelines.cli.validate_patch_glob_pattern` (Spark 4.1): a
  pattern is either a literal file path (no wildcards) or a literal directory
  followed by `/**`, which the runtime rewrites to `<dir>/**/*`. Globbing the
  rewritten pattern also sidesteps the Python 3.13 change that made a trailing
  `**` match files, so the CLI matches the same files on every supported
  Python version.

  Args:
    pattern: The `libraries[].glob.include` pattern as written by the user.
    source_description: Human-readable model description for error messages.

  Returns:
    The relative pattern to pass to `pathlib.Path.glob`.

  Raises:
    errors.PackagingError: If the pattern uses backslashes, is absolute,
      traverses upward, or is not one of the two forms the runtime accepts.
  """
  if "\\" in pattern:
    raise errors.PackagingError(
        f"{source_description}: `libraries` pattern '{pattern}' must use"
        " forward slashes (`/`), not backslashes (`\\`)."
    )
  posix_path = pathlib.PurePosixPath(pattern)
  windows_path = pathlib.PureWindowsPath(posix_path.as_posix())
  if posix_path.is_absolute() or bool(windows_path.drive):
    raise errors.PackagingError(
        f"{source_description}: `libraries` pattern '{pattern}' must be"
        " relative to the directory of `spark-pipeline.yml`."
    )
  if ".." in posix_path.parts:
    raise errors.PackagingError(
        f"{source_description}: `libraries` pattern '{pattern}' must not"
        " contain `..` path traversal."
    )
  if posix_path.parts and not pattern.endswith("/"):
    relative_pattern = posix_path.as_posix()
    if not glob.has_magic(relative_pattern):
      return relative_pattern
    if relative_pattern.endswith("/**") and not glob.has_magic(
        relative_pattern[: -len("/**")]
    ):
      return relative_pattern + "/*"
  raise errors.PackagingError(
      f"{source_description}: `libraries` pattern '{pattern}' is not supported"
      " by `pyspark.pipelines`; use a file path or a directory followed by"
      " `/**` (for example `transformations/**`)."
  )


def _IsIgnoredGlobArtifact(relative_path: pathlib.Path) -> bool:
  """Returns True if `relative_path` is a bytecode/cache artifact."""
  if _IGNORED_GLOB_DIR_NAMES.intersection(relative_path.parts):
    return True
  if relative_path.name in _IGNORED_GLOB_FILE_NAMES:
    return True
  return relative_path.suffix in _IGNORED_GLOB_SUFFIXES


def _VerifyMatchedLibraryFile(
    match_path: pathlib.Path,
    pattern: str,
    project_directory: pathlib.Path,
    resolved_project_dir: pathlib.Path,
    source_description: str,
) -> None:
  """Validates a single library file matched by `pattern`."""
  relative_path = match_path.relative_to(project_directory)
  if match_path.is_symlink() or models.HasSymlinkAncestor(
      project_directory, relative_path
  ):
    raise errors.PackagingError(
        f"{source_description}: library file '{match_path}' must not be a"
        " symlink or inside a symlinked directory."
    )
  try:
    match_path.resolve().relative_to(resolved_project_dir)
  except ValueError as e:
    raise errors.PackagingError(
        f"{source_description}: library file '{match_path}' escapes"
        f" '{project_directory}'."
    ) from e
  if match_path.suffix not in _ALLOWED_LIBRARY_SUFFIXES:
    raise errors.PackagingError(
        f"{source_description}: library file '{match_path.name}' matched"
        f" by '{pattern}' has unsupported extension '{match_path.suffix}';"
        " only `.py` and `.sql` files are allowed in `libraries`."
    )
  if match_path.suffix == ".py":
    _VerifyPythonSyntax(match_path, source_description)


def _VerifyPythonSyntax(
    file_path: pathlib.Path, source_description: str
) -> None:
  """Parses `file_path` with `ast.parse` to catch syntax errors pre-flight."""
  try:
    source_bytes = file_path.read_bytes()
  except OSError as e:
    raise errors.PackagingError(
        f"{source_description}: failed to read library file '{file_path}': {e}"
    ) from e
  try:
    ast.parse(source_bytes, filename=str(file_path))
  except (SyntaxError, ValueError) as e:
    raise errors.PackagingError(
        f"{source_description}: Python syntax error in '{file_path}': {e}"
    ) from e


def _CreateSdpBundleZip(
    model: pipeline_loader.SdpModelSpec,
    model_staging_dir: pathlib.Path,
    effective_spec: Mapping[str, Any],
    library_files: Sequence[pathlib.Path],
    source_description: str,
) -> models.StagedFile:
  """Writes the deterministic `sdp_bundle.zip` archive."""
  bundle_path = model_staging_dir / BUNDLE_ARCHIVE_NAME

  # `yaml.dump` uses YAML 1.2 while `pyspark.pipelines.cli` loads YAML 1.1;
  # quoting every scalar (all normalized spec scalars are `str`) keeps values
  # like `"no"`, `"on"`, or `"12:00"` from being coerced to `bool` or `int`.
  spec_bytes = yaml.dump(dict(effective_spec), default_style='"').encode(
      "utf-8"
  )
  entries: list[tuple[str, bytes]] = [(EFFECTIVE_SPEC_FILE_NAME, spec_bytes)]
  try:
    for file_path in library_files:
      rel_posix = file_path.relative_to(model.project_directory).as_posix()
      entries.append((rel_posix, file_path.read_bytes()))
    _WriteDeterministicZip(bundle_path, entries, source_description)
    sha256 = models.ComputeSha256(bundle_path)
  except OSError as e:
    raise errors.PackagingError(
        f"{source_description}: failed to package '{model.project_directory}'"
        f" into '{bundle_path}': {e}"
    ) from e
  # `relative_path` is relative to the model's prefix: the deployer uploads
  # every staged file under `<version_prefix>/<model>/`.
  return models.StagedFile(
      local_path=bundle_path,
      relative_path=BUNDLE_ARCHIVE_NAME,
      sha256=sha256,
  )


def _WriteDeterministicZip(
    zip_path: pathlib.Path,
    entries: Sequence[tuple[str, bytes]],
    source_description: str,
) -> None:
  """Writes `entries` and parent dirs into `zip_path` deterministically."""
  all_entries: dict[str, bytes] = {}
  for arcname, data in entries:
    if arcname in all_entries:
      raise errors.PackagingError(
          f"{source_description}: duplicate archive entry '{arcname}' in"
          f" `{BUNDLE_ARCHIVE_NAME}`."
      )
    all_entries[arcname] = data
    for parent in pathlib.PurePosixPath(arcname).parents:
      if parent != pathlib.PurePosixPath("."):
        all_entries.setdefault(f"{parent.as_posix()}/", b"")

  with zipfile.ZipFile(zip_path, mode="w") as zf:
    for arcname, data in sorted(all_entries.items()):
      info = zipfile.ZipInfo(filename=arcname, date_time=_ZIP_TIMESTAMP)
      info.create_system = _ZIP_CREATE_SYSTEM_UNIX
      info.compress_type = zipfile.ZIP_STORED
      info.external_attr = (
          _ZIP_DIR_EXTERNAL_ATTR
          if arcname.endswith("/")
          else _ZIP_FILE_EXTERNAL_ATTR
      )
      zf.writestr(info, data)

