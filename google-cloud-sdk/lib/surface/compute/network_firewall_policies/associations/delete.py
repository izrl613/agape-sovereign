# -*- coding: utf-8 -*- #
# Copyright 2021 Google LLC. All Rights Reserved.
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
"""Command for deleting network firewall policy associations."""


from googlecloudsdk.api_lib.compute import base_classes
from googlecloudsdk.api_lib.compute.network_firewall_policies import client
from googlecloudsdk.api_lib.compute.network_firewall_policies import region_client
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.compute.network_firewall_policies import flags


@base.UniverseCompatible
class Delete(base.CreateCommand):
  r"""Delete a new association between a firewall policy and an network or folder resource.

  *{command}* is used to delete network firewall policy associations. An
  network firewall policy is a set of rules that controls access to various
  resources.
  """
  NEWORK_FIREWALL_POLICY_ARG = None

  @classmethod
  def Args(cls, parser):
    cls.NETWORK_FIREWALL_POLICY_ARG = (
        flags.NetworkFirewallPolicyAssociationArgument(
            required=True,
            operation='delete',
            short_help=(
                'Name of the network firewall policy from which to delete the'
                ' association. This value explicitly identifies the target'
                ' network firewall policy whose link to a resource, such as a'
                ' VPC network, is being removed (for example, `my-policy`).'
            ),
            region_help_text=(
                'Google Cloud region string (for example, `us-central1`) of'
                ' the network firewall policy whose association is being'
                ' deleted. This value explicitly identifies the geographic'
                ' location of the firewall policy and overrides any default'
                ' `compute/region` property value configured for this command'
                ' invocation.'
            ),
            global_help_text=(
                'Indicate that the referenced network firewall policy is global'
                ' in scope. When specified, the command targets and deletes the'
                ' association from a global network firewall policy rather than'
                ' a regional one. This flag is mutually exclusive with'
                ' `--firewall-policy-region`.'
            ),
        )
    )
    cls.NETWORK_FIREWALL_POLICY_ARG.AddArgument(parser, operation_type='delete')
    flags.AddArgsDeleteAssociation(parser)
    parser.display_info.AddCacheUpdater(flags.NetworkFirewallPoliciesCompleter)

  def Run(self, args):
    holder = base_classes.ComputeApiHolder(self.ReleaseTrack())
    ref = self.NETWORK_FIREWALL_POLICY_ARG.ResolveAsResource(
        args, holder.resources)

    network_firewall_policy = client.NetworkFirewallPolicy(
        ref, compute_client=holder.client)
    if hasattr(ref, 'region'):
      network_firewall_policy = region_client.RegionNetworkFirewallPolicy(
          ref, compute_client=holder.client)

    return network_firewall_policy.DeleteAssociation(
        firewall_policy=args.firewall_policy,
        name=args.name,
        only_generate_request=False)


Delete.detailed_help = {
    'EXAMPLES':
        """\
    To delete an association from a global network firewall policy with NAME
    ``my-policy'' and association name ``my-association'', run:

      $ {command}
          --firewall-policy=my-policy
          --name=my-association
          --global-firewall-policy

    To delete an association from a regional network firewall policy with NAME
    ``my-policy'' in region ``region-a'' and association name
    ``my-association'', run:

      $ {command}
          --firewall-policy=my-policy
          --name=my-association
          --firewall-policy-region=region-a
    """,
}
