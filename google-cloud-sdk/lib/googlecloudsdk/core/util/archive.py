# -*- coding: utf-8 -*- #
# Copyright 2015 Google LLC. All Rights Reserved.
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

"""Set of utilities for dealing with archives."""


import os
import zipfile
from googlecloudsdk.core import log
import six

try:
  # pylint: disable=unused-import
  # pylint: disable=g-import-not-at-top
  import zlib
  _ZIP_COMPRESSION = zipfile.ZIP_DEFLATED
except ImportError:
  _ZIP_COMPRESSION = zipfile.ZIP_STORED


def MakeZipFromDir(dest_zip_file, src_dir, predicate=None):
  """Create a ZIP archive from a directory.

  This is similar to shutil.make_archive, but additionally supports filtering
  the archived paths with a predicate.

  Examples:
    Filesystem:
    /tmp/a/
    /tmp/b/B

    >>> MakeZipFromDir('my.zip', '/tmp')
    Creates zip with content:
    a/
    b/B

  Note this is caller responsibility to use appropriate platform-dependent
  path separator.

  Note filenames containing path separator are supported.

  Args:
    dest_zip_file: str, filesystem path to the zip file to be created. Note that
      directory should already exist for destination zip file.
    src_dir: str, filesystem path to the directory to zip up
    predicate: callable, takes one argument (file path). File will be included
               in the zip if and only if the predicate(file_path). Defaults to
               always true.
  """

  if predicate is None:
    predicate = lambda x: True
  # We need strict_timestamps=False to support files/dirs with pre-1980 mtimes.
  zip_file = zipfile.ZipFile(
      dest_zip_file, 'w', _ZIP_COMPRESSION, strict_timestamps=False
  )
  try:
    for root, _, filelist in os.walk(six.text_type(src_dir)):
      dir_path = os.path.normpath(os.path.relpath(root, src_dir))
      if not predicate(dir_path):
        continue
      # Directories are added as entries (without contents) so that empty
      # directories are preserved.
      rel_paths = [dir_path] if dir_path != os.curdir else []
      for file_name in filelist:
        file_path = os.path.join(dir_path, file_name)
        if predicate(file_path):
          rel_paths.append(file_path)
      for rel_path in rel_paths:
        full_path = os.path.join(src_dir, rel_path)
        try:
          zip_file.write(full_path, rel_path)
        except FileNotFoundError:
          log.warning('Skipping non-existent path: %s', full_path)
  finally:
    zip_file.close()
