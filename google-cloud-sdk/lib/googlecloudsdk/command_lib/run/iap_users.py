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
"""Utilities for managing the principals with IAP access to a service."""

import dataclasses

from apitools.base.py import exceptions as api_exceptions
from googlecloudsdk.api_lib.util import apis
from googlecloudsdk.command_lib.iam import iam_util

# Role that grants access to a Cloud Run service through IAP.
IAP_USER_ROLE = 'roles/iap.httpsResourceAccessor'

_IAP_API_NAME = 'iap'
_IAP_API_VERSION = 'v1'

# Number of attempts to update the IAM policy if it is modified concurrently.
_MAX_POLICY_UPDATE_ATTEMPTS = 3


@dataclasses.dataclass(frozen=True)
class IapUsersChange:
  """Principals to grant or revoke access to a service through IAP.

  Attributes:
    to_add: Principals to grant access to.
    to_remove: Principals to revoke access from.
  """

  to_add: tuple[str, ...] = ()
  to_remove: tuple[str, ...] = ()


def GetIapWebServiceResourceName(project_number, region, service_name):
  """Returns the name of the IAP resource of a Cloud Run service.

  Args:
    project_number: str, number of the project of the service.
    region: str, region of the service.
    service_name: str, name of the service.

  Returns:
    str, the relative name of the IAP resource.
  """
  return (
      f'projects/{project_number}/iap_web/cloud_run-{region}/services/'
      f'{service_name}'
  )


def UpdateIapUsers(project_number, region, service_name, iap_users_change):
  """Grants and revokes access to a Cloud Run service through IAP.

  All changes are applied to the unconditional `roles/iap.httpsResourceAccessor`
  binding of the IAP resource of the service, in a single read-modify-write of
  its IAM policy. Conditional bindings and bindings of other roles are never
  modified. The update is retried if the policy is modified concurrently.

  Args:
    project_number: str, number of the project of the service.
    region: str, region of the service.
    service_name: str, name of the service.
    iap_users_change: IapUsersChange, the principals to grant or revoke access.

  Returns:
    list[str], warnings to show to the user.

  Raises:
    apitools.base.py.exceptions.HttpError: if the IAM policy could not be read
      or updated.
  """
  client = apis.GetClientInstance(_IAP_API_NAME, _IAP_API_VERSION)
  resource_name = GetIapWebServiceResourceName(
      project_number, region, service_name
  )
  attempts_left = _MAX_POLICY_UPDATE_ATTEMPTS
  while True:
    attempts_left -= 1
    try:
      result = _UpdateIamPolicy(client, resource_name, iap_users_change)
      break
    except api_exceptions.HttpConflictError:
      # The policy was modified after it was read (etag mismatch).
      if not attempts_left:
        raise
  return _GetWarnings(result, service_name, region)


@dataclasses.dataclass(frozen=True)
class _PolicyChangeResult:
  """Outcome of applying an IapUsersChange to an IAM policy.

  Attributes:
    changed: Whether the policy was modified.
    not_found: Principals to remove that have no IAP access to the service.
    conditional_access: Principals to remove that still have IAP access to the
      service through conditional bindings, which are not modified.
  """

  changed: bool
  not_found: tuple[str, ...]
  conditional_access: tuple[str, ...]


def _UpdateIamPolicy(client, resource_name, iap_users_change):
  """Reads, modifies, and writes the IAM policy of an IAP resource."""
  messages = client.MESSAGES_MODULE
  policy = client.v1.GetIamPolicy(
      messages.IapGetIamPolicyRequest(
          resource=resource_name,
          getIamPolicyRequest=messages.GetIamPolicyRequest(
              options=messages.GetPolicyOptions(
                  requestedPolicyVersion=(
                      iam_util.MAX_LIBRARY_IAM_SUPPORTED_VERSION
                  )
              )
          ),
      )
  )
  result = _ApplyIapUsersChange(messages.Binding, policy, iap_users_change)
  if result.changed:
    # The etag of the policy that was read is sent back, so the update fails
    # with HTTP 409 if the policy was modified in the meantime.
    policy.version = iam_util.MAX_LIBRARY_IAM_SUPPORTED_VERSION
    client.v1.SetIamPolicy(
        messages.IapSetIamPolicyRequest(
            resource=resource_name,
            setIamPolicyRequest=messages.SetIamPolicyRequest(policy=policy),
        )
    )
  return result


def _ApplyIapUsersChange(binding_message_type, policy, iap_users_change):
  """Applies an IapUsersChange to an IAM policy, in place.

  Principals are removed before principals are added. Only the unconditional
  bindings of the IAP user role are modified.

  Args:
    binding_message_type: The Binding message class of the IAP API.
    policy: The IAM policy to modify.
    iap_users_change: IapUsersChange, the principals to grant or revoke access.

  Returns:
    _PolicyChangeResult, the outcome of the change.
  """
  unconditional_bindings = [
      binding
      for binding in policy.bindings
      if binding.role == IAP_USER_ROLE and binding.condition is None
  ]
  conditional_members = set()
  for binding in policy.bindings:
    if binding.role == IAP_USER_ROLE and binding.condition is not None:
      conditional_members.update(binding.members)
  changed = False
  not_found = []
  conditional_access = []
  # Each principal is processed once, so that a duplicate is not reported as
  # missing after its first occurrence was removed.
  for member in dict.fromkeys(iap_users_change.to_remove):
    removed = False
    # A policy can contain several bindings with the same role.
    for binding in unconditional_bindings:
      while member in binding.members:
        binding.members.remove(member)
        removed = True
    changed = changed or removed
    if member in conditional_members:
      conditional_access.append(member)
    elif not removed:
      not_found.append(member)

  for member in iap_users_change.to_add:
    if any(member in binding.members for binding in unconditional_bindings):
      continue
    if not unconditional_bindings:
      binding = binding_message_type(role=IAP_USER_ROLE, members=[])
      policy.bindings.append(binding)
      unconditional_bindings.append(binding)
    unconditional_bindings[0].members.append(member)
    changed = True

  # Drop the bindings left without members.
  policy.bindings[:] = [
      binding for binding in policy.bindings if binding.members
  ]
  return _PolicyChangeResult(
      changed=changed,
      not_found=tuple(not_found),
      conditional_access=tuple(conditional_access),
  )


def _GetWarnings(result, service_name, region):
  """Returns the warnings to show to the user for a policy change."""
  warnings = []
  if result.not_found:
    warnings.append(
        'The following principals were not removed because they do not have'
        f' IAP access to service [{service_name}] in region [{region}]:'
        f' {", ".join(result.not_found)}.'
    )
  if result.conditional_access:
    warnings.append(
        'The following principals still have IAP access to service'
        f' [{service_name}] in region [{region}] through conditional role'
        ' bindings, which are not modified:'
        f' {", ".join(result.conditional_access)}. To remove conditional role'
        ' bindings, use `gcloud iap web remove-iam-policy-binding`.'
    )
  return warnings
