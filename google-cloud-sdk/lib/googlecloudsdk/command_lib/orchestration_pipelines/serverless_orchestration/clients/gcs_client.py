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
"""Cloud Storage client for uploading packaged pipeline artifacts."""

from collections.abc import Sequence
import concurrent.futures
import dataclasses
import http
import mimetypes
import pathlib
import threading
from typing import Any

from apitools.base.py import exceptions as api_exceptions
from apitools.base.py import transfer
from googlecloudsdk.api_lib.storage import storage_api
from googlecloudsdk.api_lib.storage import storage_util
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration import errors
from googlecloudsdk.command_lib.orchestration_pipelines.serverless_orchestration.packagers import models
from googlecloudsdk.command_lib.util import crc32c
from googlecloudsdk.core import log

_READ_CHUNK_SIZE = 64 * 1024
# Directory, next to the deployed versions of a pipeline, where its runs write
# their output artifacts.
_OUTPUT_ARTIFACTS_DIRECTORY = "outputs"
# Directory, under a deployed version of a pipeline, where its human-readable
# source and configuration files are uploaded for inspection.
_SOURCE_DIRECTORY = "source"
# Matches `googlecloudsdk.command_lib.storage.storage_parallel` default thread
# count to overlap HTTP round-trip latency when uploading many small files.
DEFAULT_MAX_UPLOAD_WORKERS = 16


@dataclasses.dataclass(frozen=True)
class UploadedArtifact:
  """Metadata for an artifact uploaded to Cloud Storage.

  Attributes:
    relative_path: Object name relative to the version prefix, e.g.
      `dbt_gold.tar.gz`.
    gcs_uri: Full `gs://<bucket>/<object>` URI of the uploaded artifact.
    sha256: Lowercase hex SHA-256 digest of the artifact contents.
    crc32c: Base64-encoded CRC32C checksum from Cloud Storage, or None if unset.
  """

  relative_path: str
  gcs_uri: str
  sha256: str
  crc32c: str | None = None


def BuildVersionedArtifactPrefix(
    pipeline_id: str, version_id: str, path_prefix: str = ""
) -> str:
  """Returns the GCS object prefix for `(pipeline_id, version_id)`.

  Args:
    pipeline_id: The pipeline identifier.
    version_id: The deployment version identifier.
    path_prefix: Optional leading object prefix from `deployment.yaml`.

  Returns:
    The joined GCS object prefix without leading or trailing slashes.
  """
  return _BuildPipelineObjectPrefix(pipeline_id, version_id, path_prefix)


def BuildSourceDirectoryPrefix(
    pipeline_id: str, version_id: str, path_prefix: str = ""
) -> str:
  """Returns the GCS object prefix where source files of a version are stored.

  Args:
    pipeline_id: The pipeline identifier.
    version_id: The deployment version identifier.
    path_prefix: Optional leading object prefix from `deployment.yaml`.

  Returns:
    The joined GCS object prefix without leading or trailing slashes.
  """
  version_prefix = BuildVersionedArtifactPrefix(
      pipeline_id, version_id, path_prefix
  )
  return f"{version_prefix}/{_SOURCE_DIRECTORY}"


def BuildOutputArtifactPrefix(pipeline_id: str, path_prefix: str = "") -> str:
  """Returns the GCS object prefix where runs of `pipeline_id` write outputs.

  Args:
    pipeline_id: The pipeline identifier.
    path_prefix: Optional leading object prefix from `deployment.yaml`.

  Returns:
    The joined GCS object prefix without leading or trailing slashes.
  """
  return _BuildPipelineObjectPrefix(
      pipeline_id, _OUTPUT_ARTIFACTS_DIRECTORY, path_prefix
  )


class GcsClient:
  """Uploads staged artifacts to Cloud Storage without overwriting objects."""

  def __init__(
      self,
      storage_client: storage_api.StorageClient | None = None,
      *,
      max_workers: int = DEFAULT_MAX_UPLOAD_WORKERS,
  ):
    """Initializes the instance.

    Args:
      storage_client: Optional Cloud Storage API client; created lazily per
        thread using default credentials if None. Supplying `storage_client`
        forces single-threaded uploads regardless of `max_workers`.
      max_workers: Maximum number of worker threads used when uploading multiple
        files with default thread-local clients.

    Raises:
      ValueError: If `max_workers` is less than 1.
    """
    if max_workers < 1:
      raise ValueError(f"max_workers must be >= 1, got {max_workers}.")
    # Initialize on the main thread so worker threads do not race in guess_type.
    if not mimetypes.inited:
      mimetypes.init()
    self._storage_client = storage_client
    self._max_workers = max_workers
    self._thread_local = threading.local()
    self._client_lock = threading.Lock()
    self._created_clients: list[storage_api.StorageClient] = []

  def UploadWithPrefix(
      self,
      entries: Sequence[models.StagedFile],
      bucket: str,
      prefix: str,
  ) -> tuple[UploadedArtifact, ...]:
    """Uploads staged files under `prefix`, skipping identical existing objects.

    Args:
      entries: Staged files and their object names relative to `prefix`.
      bucket: Destination bucket name (with or without `gs://`).
      prefix: Object prefix, e.g. `pipelines/<pipeline_id>/<version_id>`.

    Returns:
      One `UploadedArtifact` per entry, in input order.

    Raises:
      errors.UploadError: If the destination URI is invalid, duplicate
        destinations are present, an existing object has different content, or
        an upload fails.
    """
    bucket_name = bucket.strip().removeprefix("gs://").strip("/")
    clean_prefix = prefix.strip("/")
    targets: list[tuple[models.StagedFile, storage_util.ObjectReference]] = []
    seen_urls: set[str] = set()
    for entry in entries:
      relative_path = entry.relative_path.lstrip("/")
      object_name = (
          f"{clean_prefix}/{relative_path}" if clean_prefix else relative_path
      )
      object_ref = _ParseGcsUri(f"gs://{bucket_name}/{object_name}")
      target_url = object_ref.ToUrl()
      if target_url in seen_urls:
        raise errors.UploadError(
            f"Duplicate destination Cloud Storage URI '{target_url}'."
        )
      seen_urls.add(target_url)
      targets.append((entry, object_ref))

    if not targets:
      return ()
    if (
        len(targets) == 1
        or self._max_workers == 1
        or self._storage_client is not None
    ):
      return tuple(
          self._UploadEntry(entry, object_ref) for entry, object_ref in targets
      )

    # Warm default credentials on the main thread before spawning workers so
    # worker threads do not race on SQLite credential store initialization.
    self._GetStorageClient()
    cancel_event = threading.Event()

    def _UploadTarget(
        target: tuple[models.StagedFile, storage_util.ObjectReference],
    ) -> UploadedArtifact | None:
      if cancel_event.is_set():
        return None
      entry, object_ref = target
      try:
        return self._UploadEntry(entry, object_ref)
      except Exception:
        cancel_event.set()
        raise

    worker_count = min(self._max_workers, len(targets))
    try:
      with concurrent.futures.ThreadPoolExecutor(worker_count) as executor:
        uploaded = list(executor.map(_UploadTarget, targets))
    finally:
      self._CloseCreatedClients()
    # Entries only return None after another entry failed, which raises above.
    return tuple(artifact for artifact in uploaded if artifact is not None)

  def _UploadEntry(
      self,
      entry: models.StagedFile,
      object_ref: storage_util.ObjectReference,
  ) -> UploadedArtifact:
    """Uploads one `entry` to `object_ref` and returns its artifact metadata."""
    gcs_object = self._UploadIfAbsent(entry.local_path, object_ref)
    return UploadedArtifact(
        relative_path=entry.relative_path,
        gcs_uri=object_ref.ToUrl(),
        sha256=entry.sha256,
        crc32c=gcs_object.crc32c,
    )

  def _UploadIfAbsent(
      self,
      local_path: pathlib.Path,
      object_ref: storage_util.ObjectReference,
  ) -> Any:
    """Uploads `local_path` with `ifGenerationMatch=0` or checks existing."""
    gcs_uri = object_ref.ToUrl()
    storage = self._GetStorageClient()
    request = _BuildCreateOnlyObjectInsertRequest(storage.messages, object_ref)
    upload = _OpenFileForUpload(local_path)
    log.info("Uploading '%s' to %s", local_path, gcs_uri)
    try:
      return storage.client.objects.Insert(request, upload=upload)
    except api_exceptions.HttpError as e:
      if e.status_code != http.HTTPStatus.PRECONDITION_FAILED:
        raise errors.UploadError(
            f"Failed to upload '{local_path}' to {gcs_uri}: {e}"
        ) from e
    finally:
      upload.stream.close()

    return self._VerifyExistingObject(local_path, object_ref)

  def _GetStorageClient(self) -> storage_api.StorageClient:
    """Returns the configured or per-thread `StorageClient` instance."""
    if self._storage_client is not None:
      return self._storage_client
    client = getattr(self._thread_local, "storage_client", None)
    if client is None:
      with self._client_lock:
        client = storage_api.StorageClient()
        self._created_clients.append(client)
      self._thread_local.storage_client = client
    return client

  def _CloseCreatedClients(self) -> None:
    """Closes HTTP sessions for thread-local `StorageClient` instances."""
    with self._client_lock:
      clients = list(self._created_clients)
      self._created_clients.clear()
      # Replace the container on self so no thread reuses a closed client.
      self._thread_local = threading.local()
    for client in clients:
      # StorageClient and apitools BaseApiClient have no public close() API.
      client.client.http.session.close()

  def _VerifyExistingObject(
      self,
      local_path: pathlib.Path,
      object_ref: storage_util.ObjectReference,
  ) -> Any:
    """Verifies an existing object at `object_ref` has the same CRC32C."""
    gcs_uri = object_ref.ToUrl()
    expected_crc32c = _ComputeFileCrc32c(local_path)
    try:
      existing = self._GetStorageClient().GetObject(object_ref)
    except api_exceptions.HttpError as e:
      raise errors.UploadError(
          f"{gcs_uri} already exists and could not be read: {e}"
      ) from e
    if existing.crc32c != expected_crc32c:
      raise errors.UploadError(
          f"{gcs_uri} already exists with different content (crc32c"
          f" {existing.crc32c} on Cloud Storage, {expected_crc32c} locally);"
          " deploy a new version instead."
      )
    log.info("Skipping %s: it already exists with the same content.", gcs_uri)
    return existing


def _BuildPipelineObjectPrefix(
    pipeline_id: str, directory: str, path_prefix: str
) -> str:
  """Joins `[<path_prefix>/]pipelines/<pipeline_id>/<directory>`."""
  prefix_segments = (
      path_prefix.strip("/"),
      "pipelines",
      pipeline_id,
      directory,
  )
  return "/".join(segment for segment in prefix_segments if segment)


def _ParseGcsUri(gcs_uri: str) -> storage_util.ObjectReference:
  """Parses and validates a `gs://<bucket>/<object>` URI."""
  try:
    return storage_util.ObjectReference.FromUrl(gcs_uri.strip())
  except (storage_util.InvalidNameError, ValueError) as e:
    raise errors.UploadError(
        f"Invalid Cloud Storage URI '{gcs_uri}': must be of the form"
        " 'gs://<bucket>/<object>'."
    ) from e


def _BuildCreateOnlyObjectInsertRequest(
    messages: Any,
    object_ref: storage_util.ObjectReference,
) -> Any:
  """Builds a create-only `StorageObjectsInsertRequest` for `object_ref`."""
  return messages.StorageObjectsInsertRequest(
      bucket=object_ref.bucket,
      name=object_ref.name,
      object=messages.Object(name=object_ref.name),
      ifGenerationMatch=0,
  )


def _OpenFileForUpload(local_path: pathlib.Path) -> transfer.Upload:
  """Opens `local_path` as a streaming `transfer.Upload`."""
  mime_type, _ = mimetypes.guess_type(local_path.name)
  try:
    return transfer.Upload.FromFile(
        str(local_path),
        mime_type=mime_type or "application/octet-stream",
    )
  except (OSError, api_exceptions.Error) as e:
    raise errors.UploadError(f"Failed to read '{local_path}': {e}") from e


def _ComputeFileCrc32c(local_path: pathlib.Path) -> str:
  """Returns the base64-encoded CRC32C checksum of `local_path`."""
  hasher = crc32c.get_crc32c()
  try:
    with local_path.open("rb") as stream:
      while chunk := stream.read(_READ_CHUNK_SIZE):
        hasher.update(chunk)
  except OSError as e:
    raise errors.UploadError(f"Failed to read '{local_path}': {e}") from e
  return crc32c.get_hash(hasher)
