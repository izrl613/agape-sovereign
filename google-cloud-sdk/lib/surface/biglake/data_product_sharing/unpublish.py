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
"""The unpublish command for Data Product Sharing."""

import textwrap

from googlecloudsdk.api_lib.util import apis
from googlecloudsdk.calliope import base
from googlecloudsdk.calliope.concepts import concepts
from googlecloudsdk.command_lib.util.concepts import concept_parsers
from googlecloudsdk.command_lib.util.concepts import presentation_specs
from googlecloudsdk.core import log

help_text = textwrap.dedent("""\
    To unpublish a share `my-share` from the connection catalog `my-catalog`, run:

      $ {command} --connection-catalog=my-catalog --share=my-share
    """)

_API_VERSION_MAP = {
    base.ReleaseTrack.ALPHA: 'data_product_sharing_v1alpha',
    base.ReleaseTrack.GA: 'data_product_sharing_v1',
}

_COLLECTION_MAP = {
    base.ReleaseTrack.ALPHA: (
        'biglake.dataproductsharing.v1alpha.projects.catalogs'
    ),
    base.ReleaseTrack.GA: 'biglake.dataproductsharing.v1.projects.catalogs',
}


@base.ReleaseTracks(base.ReleaseTrack.ALPHA, base.ReleaseTrack.GA)
@base.DefaultUniverseOnly
class UnpublishDataProduct(base.Command):
  """Unpublish a Knowledge Catalog Data Product or BigLake tables from external partners."""

  detailed_help = {
      'EXAMPLES': help_text,
  }

  @classmethod
  def Args(cls, parser):
    release_track = cls.ReleaseTrack()

    def GetCatalogResourceSpec():
      return concepts.ResourceSpec(
          _COLLECTION_MAP[release_track],
          resource_name='catalog',
          projectsId=concepts.DEFAULT_PROJECT_ATTRIBUTE_CONFIG,
          catalogsId=concepts.ResourceParameterAttributeConfig('catalog'),
          api_version=_API_VERSION_MAP[release_track],
      )

    delta_sharing_catalog_resource = presentation_specs.ResourcePresentationSpec(
        '--connection-catalog',
        GetCatalogResourceSpec(),
        'The delta sharing catalog that contains information about where the '
        'data product is published.',
        prefixes=True,
        required=True,
    )
    concept_parsers.ConceptParser(
        [delta_sharing_catalog_resource]
    ).AddToParser(parser)
    parser.add_argument(
        '--share',
        help='Name of the Share to unpublish from external partners.',
        required=True,
    )

  def Run(self, args):
    release_track = self.ReleaseTrack()
    client = apis.GetClientInstance('biglake', _API_VERSION_MAP[release_track])
    messages = client.MESSAGES_MODULE
    if release_track == base.ReleaseTrack.ALPHA:
      service = client.dataproductsharing_v1alpha_projects_catalogs
      request_cls = (
          messages.BiglakeDataproductsharingV1alphaProjectsCatalogsUnpublishDataProductRequest
      )
    else:
      service = client.dataproductsharing_v1_projects_catalogs
      request_cls = (
          messages.BiglakeDataproductsharingV1ProjectsCatalogsUnpublishDataProductRequest
      )
    response = service.UnpublishDataProduct(
        request_cls(
            connectionCatalog=args.CONCEPTS.connection_catalog.Parse().RelativeName(),
            unpublishDataProductRequest=messages.UnpublishDataProductRequest(
                share=args.share,
            ),
        )
    )
    log.status.Print('Successfully unpublished share [{0}].'.format(args.share))
    return response
