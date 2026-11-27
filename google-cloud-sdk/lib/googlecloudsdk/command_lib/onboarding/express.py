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
"""Shared helpers and constants for express onboarding gcloud commands."""

from __future__ import annotations

from apitools.base.py import exceptions as apitools_exceptions
from googlecloudsdk.api_lib.util import exceptions as api_exceptions
from googlecloudsdk.generated_clients.apis.useronboarding.v1alpha import useronboarding_v1alpha_messages as onboarding_messages

# Experience ID for getting or provisioning a starter-tier project.
STARTER_TIER_XP_ID = 'de8dd731-c5da-4669-87e2-318c6142e112'

_EXPERIENCE_DISABLED_ERROR = 'Onboarding experience is disabled'
FEATURE_DISABLED_MESSAGE = (
    'This feature is in private preview for allowlisted accounts only and is'
    ' not enabled for this account. To create or select a project, use'
    ' `gcloud projects` commands or visit the Google Cloud Console'
    ' (https://console.cloud.google.com)'
)


def IsExperienceDisabledError(error: apitools_exceptions.HttpError) -> bool:
  """Returns whether `error` means the onboarding experience is disabled.

  Args:
    error: The HTTP error raised by an onboarding API call.

  Returns:
    True if `error` is a 500 FAILED_PRECONDITION caused by the onboarding
    experience being disabled; False otherwise.
  """
  payload = api_exceptions.HttpErrorPayload(error)
  content = str(payload.content)
  return (
      payload.status_code == 500
      and 'FAILED_PRECONDITION' in content
      and _EXPERIENCE_DISABLED_ERROR in content
  )


def GetProject(session: onboarding_messages.Session | None) -> str | None:
  """Extracts the project resource name from a session object.

  Args:
    session: The onboarding session message, or None.

  Returns:
    The project resource name in `projects/<id>` format, or None if `session`
    has no project.
  """
  if not session or not session.project:
    return None
  project = session.project
  name = project if isinstance(project, str) else getattr(project, 'name', None)
  if not name:
    return None
  if not name.startswith('projects/'):
    return f'projects/{name}'
  return name
