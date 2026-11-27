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
"""Command for updating DHCP options configs."""

from googlecloudsdk.api_lib.compute import base_classes
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.compute import scope as compute_scope
from googlecloudsdk.command_lib.compute.dhcp_options_configs import flags


def _ApplyField(kwargs, update_mask, value, clear, field_name):
  """Applies one field's value or clear flag to the PATCH request.

  The field is set in the request resource only when a replacement value is
  given, and it is listed in the update mask whenever either the value flag or
  the matching --clear-* flag is passed. A clear therefore omits the field from
  the payload while still masking it.

  Args:
    kwargs: Dict of fields to populate on the DhcpOptionsConfig resource.
    update_mask: List of camelCase API field names to include in updateMask.
    value: The replacement value from the field's value flag, or None.
    clear: Whether the field's --clear-* flag was passed.
    field_name: The camelCase API field name.
  """
  if value is not None:
    kwargs[field_name] = value
  if clear or value is not None:
    update_mask.append(field_name)


@base.DefaultUniverseOnly
@base.ReleaseTracks(base.ReleaseTrack.BETA)
class UpdateBeta(base.UpdateCommand):
  """Update a Google Compute Engine DHCP options configuration."""

  _support_add_dns_server_addresses = False

  detailed_help = {
      'brief': 'Update a Google Compute Engine DHCP options configuration.',
      'DESCRIPTION': (
          """\
      *{command}* is used to update fields of a regional DHCP options configuration.
      """
      ),
      'EXAMPLES': (
          """\
      To update the domain name of a DHCP options config in us-central1, run:

        $ {command} my-dhcp-config --region=us-central1 --domain-name=new.example.com

      To add a new VPC network association or update an existing one without affecting other associations, run:

        $ {command} my-dhcp-config --region=us-central1 --update-associations=my-assoc=my-vpc

      To remove an association from a DHCP options config, run:

        $ {command} my-dhcp-config --region=us-central1 --remove-associations=my-assoc

      To clear all VPC network associations from a DHCP options config, run:

        $ {command} my-dhcp-config --region=us-central1 --clear-associations

      To clear domain search paths, run:

        $ {command} my-dhcp-config --region=us-central1 --clear-dns-search-paths
      """
      ),
  }

  DHCP_OPTIONS_CONFIG_ARG = None

  @classmethod
  def Args(cls, parser):
    """Register flags for this command."""
    cls.DHCP_OPTIONS_CONFIG_ARG = flags.DhcpOptionsConfigArgument()
    cls.DHCP_OPTIONS_CONFIG_ARG.AddArgument(parser, operation_type='update')

    parser.display_info.AddFormat(flags.DEFAULT_LIST_FORMAT)

    desc_group = parser.add_mutually_exclusive_group()
    flags.AddDescription(desc_group)
    flags.AddClearDescription(desc_group)

    lease_group = parser.add_mutually_exclusive_group()
    flags.AddLeaseTime(lease_group)
    flags.AddClearLeaseTime(lease_group)

    domain_group = parser.add_mutually_exclusive_group()
    flags.AddDomainName(domain_group)
    flags.AddClearDomainName(domain_group)

    if cls._support_add_dns_server_addresses:
      dns_v4_group = parser.add_mutually_exclusive_group()
      flags.AddDnsServerIpv4Addresses(dns_v4_group)
      flags.AddClearDnsServerIpv4Addresses(dns_v4_group)

      dns_v6_group = parser.add_mutually_exclusive_group()
      flags.AddDnsServerIpv6Addresses(dns_v6_group)
      flags.AddClearDnsServerIpv6Addresses(dns_v6_group)

    dns_search_group = parser.add_mutually_exclusive_group()
    flags.AddDnsSearchPaths(dns_search_group)
    flags.AddClearDnsSearchPaths(dns_search_group)

    ntp_v4_group = parser.add_mutually_exclusive_group()
    flags.AddNtpServerIpv4Addresses(ntp_v4_group)
    flags.AddClearNtpServerIpv4Addresses(ntp_v4_group)

    ntp_v6_group = parser.add_mutually_exclusive_group()
    flags.AddNtpServerIpv6Addresses(ntp_v6_group)
    flags.AddClearNtpServerIpv6Addresses(ntp_v6_group)

    tftp_name_group = parser.add_mutually_exclusive_group()
    flags.AddTftpServerName(tftp_name_group)
    flags.AddClearTftpServerName(tftp_name_group)

    tftp_v4_group = parser.add_mutually_exclusive_group()
    flags.AddTftpServerIpv4Addresses(tftp_v4_group)
    flags.AddClearTftpServerIpv4Addresses(tftp_v4_group)

    boot_name_group = parser.add_mutually_exclusive_group()
    flags.AddBootFileName(boot_name_group)
    flags.AddClearBootFileName(boot_name_group)

    boot_url_group = parser.add_mutually_exclusive_group()
    flags.AddBootFileUrl(boot_url_group)
    flags.AddClearBootFileUrl(boot_url_group)

    boot_params_group = parser.add_mutually_exclusive_group()
    flags.AddBootFileParams(boot_params_group)
    flags.AddClearBootFileParams(boot_params_group)

    flags.AddUpdateAssociations(parser)
    remove_assoc_group = parser.add_mutually_exclusive_group()
    flags.AddClearAssociations(remove_assoc_group)
    flags.AddRemoveAssociations(remove_assoc_group)

  def _GetAssociationsUpdate(self, args, client, holder, dhcp_config_ref):
    """Computes the updated AssociationsValue for the request."""
    # Handle association replacement (clear + update).
    # Because GCE PATCH uses merge semantics, replacing the full set of
    # associations requires fetching the existing resource, tombstoning existing
    # keys that are not updated, and applying the new updates.
    # TODO(b/555898982): Support ETag for optimistic concurrency control once
    # backend support is added in CLH.
    if args.clear_associations and args.IsSpecified('update_associations'):
      get_request = client.messages.ComputeDhcpOptionsConfigsGetRequest(
          project=dhcp_config_ref.project,
          region=dhcp_config_ref.region,
          dhcpOptionsConfig=dhcp_config_ref.Name(),
      )
      existing_config = client.MakeRequests(
          [(client.apitools_client.dhcpOptionsConfigs, 'Get', get_request)]
      )[0]

      assoc_dict = {}
      # Mark all pre-existing association keys as empty tombstones.
      if (
          existing_config.associations
          and existing_config.associations.additionalProperties
      ):
        for existing_assoc in existing_config.associations.additionalProperties:
          assoc_dict[existing_assoc.key] = (
              client.messages.DhcpOptionsConfigAssociation()
          )

      # Apply updated associations (overwriting any previous tombstones).
      for assoc_name, network_str in args.update_associations.items():
        network_ref = holder.resources.Parse(
            network_str,
            params={'project': dhcp_config_ref.project},
            collection='compute.networks',
        )
        assoc_dict[assoc_name] = client.messages.DhcpOptionsConfigAssociation(
            network=network_ref.SelfLink()
        )

      return client.messages.DhcpOptionsConfig.AssociationsValue(
          additionalProperties=[
              client.messages.DhcpOptionsConfig.AssociationsValue.AdditionalProperty(
                  key=k, value=v
              )
              for k, v in sorted(assoc_dict.items())
          ]
      )

    # Handle delta updates and removals when clear is not requested.
    if args.IsSpecified('update_associations') or args.IsSpecified(
        'remove_associations'
    ):
      assoc_dict = {}
      # Removals: mark specified keys as empty tombstones.
      if args.IsSpecified('remove_associations'):
        for assoc_name in args.remove_associations:
          assoc_dict[assoc_name] = (
              client.messages.DhcpOptionsConfigAssociation()
          )

      # Updates: upsert specified keys with their network reference.
      if args.IsSpecified('update_associations'):
        for assoc_name, network_str in args.update_associations.items():
          network_ref = holder.resources.Parse(
              network_str,
              params={'project': dhcp_config_ref.project},
              collection='compute.networks',
          )
          assoc_dict[assoc_name] = client.messages.DhcpOptionsConfigAssociation(
              network=network_ref.SelfLink()
          )

      return client.messages.DhcpOptionsConfig.AssociationsValue(
          additionalProperties=[
              client.messages.DhcpOptionsConfig.AssociationsValue.AdditionalProperty(
                  key=k, value=v
              )
              for k, v in sorted(assoc_dict.items())
          ]
      )

    # Handle clear-only: the caller records the root `associations` path in
    # the update mask and omits the field from the payload.
    return None

  def Run(self, args):
    """Issue a DhcpOptionsConfig PATCH request."""
    holder = base_classes.ComputeApiHolder(self.ReleaseTrack())
    client = holder.client
    dhcp_config_ref = self.DHCP_OPTIONS_CONFIG_ARG.ResolveAsResource(
        args, holder.resources, default_scope=compute_scope.ScopeEnum.REGION
    )

    associations_val = self._GetAssociationsUpdate(
        args, client, holder, dhcp_config_ref
    )

    kwargs = {}
    update_mask = []

    # Associations are handled separately because updates emit per-key mask
    # paths while a clear masks the root `associations` field.
    if associations_val is not None:
      kwargs['associations'] = associations_val
    if args.clear_associations:
      update_mask.append('associations')
    elif associations_val is not None:
      for prop in associations_val.additionalProperties:
        if prop.value.network:
          update_mask.append(f'associations.{prop.key}.network')
        else:
          update_mask.append(f'associations.{prop.key}')

    _ApplyField(
        kwargs,
        update_mask,
        args.description,
        args.clear_description,
        'description',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.lease_time,
        args.clear_lease_time,
        'leaseTimeSec',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.domain_name,
        args.clear_domain_name,
        'domainName',
    )
    if self._support_add_dns_server_addresses:
      _ApplyField(
          kwargs,
          update_mask,
          args.dns_server_ipv4_addresses,
          args.clear_dns_server_ipv4_addresses,
          'dnsServerIpv4Addresses',
      )
      _ApplyField(
          kwargs,
          update_mask,
          args.dns_server_ipv6_addresses,
          args.clear_dns_server_ipv6_addresses,
          'dnsServerIpv6Addresses',
      )
    _ApplyField(
        kwargs,
        update_mask,
        args.dns_search_paths,
        args.clear_dns_search_paths,
        'dnsSearchPaths',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.ntp_server_ipv4_addresses,
        args.clear_ntp_server_ipv4_addresses,
        'ntpServerIpv4Addresses',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.ntp_server_ipv6_addresses,
        args.clear_ntp_server_ipv6_addresses,
        'ntpServerIpv6Addresses',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.tftp_server_name,
        args.clear_tftp_server_name,
        'tftpServerIpv4Name',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.tftp_server_ipv4_addresses,
        args.clear_tftp_server_ipv4_addresses,
        'tftpServerIpv4Addresses',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.boot_file_name,
        args.clear_boot_file_name,
        'bootFileIpv4Name',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.boot_file_url,
        args.clear_boot_file_url,
        'bootFileIpv6Url',
    )
    _ApplyField(
        kwargs,
        update_mask,
        args.boot_file_params,
        args.clear_boot_file_params,
        'bootFileIpv6Parameters',
    )

    dhcp_options_config = client.messages.DhcpOptionsConfig(**kwargs)

    request = client.messages.ComputeDhcpOptionsConfigsPatchRequest(
        project=dhcp_config_ref.project,
        region=dhcp_config_ref.region,
        dhcpOptionsConfig=dhcp_config_ref.Name(),
        dhcpOptionsConfigResource=dhcp_options_config,
        updateMask=','.join(sorted(update_mask)) if update_mask else None,
    )

    collection = client.apitools_client.dhcpOptionsConfigs
    return client.MakeRequests([(collection, 'Patch', request)])


@base.DefaultUniverseOnly
@base.ReleaseTracks(base.ReleaseTrack.ALPHA)
class UpdateAlpha(UpdateBeta):
  """Update a Google Compute Engine DHCP options configuration."""

  _support_add_dns_server_addresses = True
