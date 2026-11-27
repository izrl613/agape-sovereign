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
"""Get or provision a Starter Tier project for onboarding."""

from apitools.base.py import exceptions as apitools_exceptions
from googlecloudsdk.api_lib.onboarding import session_orchestration
from googlecloudsdk.api_lib.util import apis
from googlecloudsdk.calliope import arg_parsers
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.onboarding import api_keys
from googlecloudsdk.command_lib.onboarding import exceptions as onboarding_exceptions
from googlecloudsdk.command_lib.onboarding import express
from googlecloudsdk.command_lib.onboarding import user_inputs
from googlecloudsdk.core import log


@base.ReleaseTracks(base.ReleaseTrack.ALPHA)
@base.UniverseCompatible
class GetProject(base.Command):
  """Get or provision a Starter Tier project for onboarding.

  This command starts an interactive session to onboard the user to Google
  Cloud Platform Starter Tier by guiding them through required setup steps.
  """

  @staticmethod
  def Args(parser):
    parser.display_info.AddFormat('none')
    valid_tos = ', '.join(user_inputs.VALID_TOS_IDS)
    parser.add_argument(
        '--auto-accept-tos-ids',
        type=arg_parsers.ArgList(),
        metavar='TOS_ID',
        help=(
            'List of Terms of Service IDs to automatically accept without'
            f' prompting. Valid values are: {valid_tos}.'
        ),
    )
    parser.add_argument(
        user_inputs.REGION_FLAG,
        metavar='REGION',
        help=(
            'Google Cloud region (for example, `us-east1`) where resources'
            ' associated with the project will be provisioned. Use this to'
            ' select a region without prompting. Ignored if no region'
            ' selection is required. If a region selection is required, this'
            ' flag is not specified, and prompts are disabled (for example,'
            ' with `--quiet` or in a non-interactive session), the available'
            ' regions are listed and the command fails.'
        ),
    )

  def Run(self, args):
    with base.WithLegacyQuota():
      client = apis.GetClientInstance('useronboarding', 'v1alpha')
      messages = apis.GetMessagesModule('useronboarding', 'v1alpha')

      intent = messages.OnboardingIntent(
          xpId=express.STARTER_TIER_XP_ID,
      )

      try:
        session = session_orchestration.ResolveAndOrchestrateSession(
            intent=intent,
            client=client,
            messages=messages,
            auto_accept_tos_ids=args.auto_accept_tos_ids,
            selected_region_name=args.region,
        )
      except apitools_exceptions.HttpError as e:
        if express.IsExperienceDisabledError(e):
          raise onboarding_exceptions.ExperienceDisabledError(
              express.FEATURE_DISABLED_MESSAGE
          ) from e
        raise
      project_id = express.GetProject(session)
      if not project_id:
        raise onboarding_exceptions.SessionProtocolError(
            'Session completed successfully, but no project was returned.'
        )
      log.status.Print(
          f'Project ready: {user_inputs.FormatProject(session.project)}.'
      )
      api_keys.PrintMapsDemoApiKeys(project_id)
      return project_id
