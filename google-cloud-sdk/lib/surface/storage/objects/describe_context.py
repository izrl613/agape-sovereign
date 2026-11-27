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
"""Implementation of objects describe-context command."""

import collections

from googlecloudsdk.api_lib.storage import api_factory
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.storage import errors
from googlecloudsdk.command_lib.storage import errors_util
from googlecloudsdk.command_lib.storage import flags
from googlecloudsdk.command_lib.storage import storage_url
from googlecloudsdk.command_lib.storage import wildcard_iterator
from googlecloudsdk.command_lib.storage.resources import resource_util

# Determines the fields displayed for a GcsObjectFullContextResource.
ObjectFullContextDisplayTitlesAndDefaults = collections.namedtuple(
    'ObjectFullContextDisplayTitlesAndDefaults',
    (
        'create_time',
        'extended_data',
        'key',
        'type',
        'update_time',
        'value',
    ),
)


@base.Hidden
@base.UniverseCompatible
@base.ReleaseTracks(base.ReleaseTrack.ALPHA)
class DescribeContext(base.DescribeCommand):
  """Describe a context of a Cloud Storage object."""

  hints = base.CommandHint(read_only=True)

  detailed_help = {
      'DESCRIPTION': """
      *{command}* shows one context of an object, including the context's
      extended data. *{parent_command} describe* shows the keys and values of
      all contexts of an object, but not their extended data.
      """,
      'EXAMPLES': """
      To describe the context with key KEY of OBJECT in BUCKET:

        $ {command} gs://BUCKET/OBJECT --key=KEY

      To describe the context of a specific generation of OBJECT:

        $ {command} gs://BUCKET/OBJECT#GENERATION --key=KEY

      To output only the extended data of the context as JSON:

        $ {command} gs://BUCKET/OBJECT --key=KEY --format="json(extended_data)"
      """,
  }

  @staticmethod
  def Args(parser):
    parser.add_argument(
        'url', help='URL of the object that has the context.'
    )
    parser.add_argument(
        '--key', required=True, help='Key of the context to describe.'
    )
    flags.add_additional_headers_flag(parser)
    flags.add_raw_display_flag(parser)

  def Run(self, args):
    if wildcard_iterator.contains_wildcard(args.url):
      raise errors.InvalidUrlError(
          'Describe-context does not accept wildcards because it describes a'
          ' context of a single object.'
      )

    url = storage_url.storage_url_from_string(args.url)
    errors_util.raise_error_if_not_cloud_object(args.command_path, url)
    errors_util.raise_error_if_not_gcs(
        args.command_path, url, example='gs://bucket/object.txt'
    )
    resource = api_factory.get_api(url.scheme).view_object_full_context(
        url.bucket_name,
        url.resource_name,
        args.key,
        generation=url.generation,
    )
    return resource_util.get_display_dict_for_resource(
        resource,
        ObjectFullContextDisplayTitlesAndDefaults,
        display_raw_keys=args.raw,
    )
