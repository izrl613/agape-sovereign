# -*- coding: utf-8 -*- #
# Copyright 2017 Google LLC. All Rights Reserved.
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
"""The python hooks for IAM surface."""

import re

from googlecloudsdk.api_lib.iam import util
from googlecloudsdk.api_lib.util import apis
from googlecloudsdk.calliope import arg_parsers
from googlecloudsdk.calliope import exceptions as gcloud_exceptions
from googlecloudsdk.command_lib.iam import iam_util
from googlecloudsdk.command_lib.util.apis import arg_utils
from googlecloudsdk.core import log


def UpdateRequestWithConditionFromFile(ref, args, request):
  """Python hook to add condition from --condition-from-file to request.

  Args:
    ref: A resource ref to the parsed resource.
    args: Parsed args namespace.
    request: The apitools request message to be modified.

  Returns:
    The modified apitools request message.
  """
  del ref
  if args.IsSpecified('condition_from_file'):
    _, messages = util.GetClientAndMessages()
    condition_message = messages.Expr(
        description=args.condition_from_file.get('description'),
        title=args.condition_from_file.get('title'),
        expression=args.condition_from_file.get('expression'),
    )
    request.condition = condition_message
  return request


def _ConditionFileFormatException(filename):
  return gcloud_exceptions.InvalidArgumentException(
      'condition-from-file',
      '{filename} must be a path to a YAML or JSON file containing the '
      'condition. `expression` and `title` are required keys. `description` is '
      'optional.'.format(filename=filename),
  )


def ParseConditionFromFile(condition_from_file):
  """Read condition from YAML or JSON file."""

  condition = arg_parsers.FileContents()(condition_from_file)
  condition_dict = iam_util.ParseYamlOrJsonCondition(
      condition, _ConditionFileFormatException(condition_from_file)
  )
  return condition_dict


def EnableIamAccountConfirmation(response, args):
  del response
  if args.command_path[len(args.command_path) - 3 :] == [
      'iam',
      'service-accounts',
      'enable',
  ]:
    log.status.Print(
        'Enabled service account [{}].'.format(args.service_account)
    )


def DisableIamAccountConfirmation(response, args):
  del response
  if args.command_path[len(args.command_path) - 3 :] == [
      'iam',
      'service-accounts',
      'disable',
  ]:
    log.status.Print(
        'Disabled service account [{}].'.format(args.service_account)
    )


def EnableIamKeyConfirmation(response, args):
  del response  # Unused.
  log.status.Print(
      'Enabled key [{0}] for service account [{1}].'.format(
          args.iam_key, args.iam_account
      )
  )


def DisableIamKeyConfirmation(response, args):
  del response  # Unused.
  log.status.Print(
      'Disabled key [{0}] for service account [{1}].'.format(
          args.iam_key, args.iam_account
      )
  )


def SetServiceAccountResource(ref, unused_args, request):
  """Add service account name to request name."""

  request.name = ref.RelativeName()
  return request


def ValidateUpdateFieldMask(ref, unused_args, request):
  """Validate the field mask for an update request."""

  del ref, unused_args  # Unused.
  # Confirm update has at least one path in fieldmask.
  if not request.patchServiceAccountRequest.updateMask:
    update_fields = ['--display-name', '--description']
    raise gcloud_exceptions.OneOfArgumentsRequiredException(
        update_fields, 'Specify at least one field to update.'
    )
  return request


def UseMaxRequestedPolicyVersion(api_field):
  """Set requestedPolicyVersion to max supported in GetIamPolicy request."""

  def Process(ref, args, request):
    del ref, args  # Unused.

    arg_utils.SetFieldInMessage(
        request, api_field, iam_util.MAX_LIBRARY_IAM_SUPPORTED_VERSION
    )
    return request

  return Process


def AddVersionToUpdateMaskIfNotPresent(update_mask_path):
  """Add ',version' to update_mask if it is not present."""

  def Process(ref, args, request):
    """The implementation of Process for the hook."""
    del ref, args  # Unused.

    update_mask = arg_utils.GetFieldValueFromMessage(request, update_mask_path)
    if 'version' not in update_mask:
      if update_mask is None:
        update_mask = 'version'
      else:
        update_mask += ',version'

    arg_utils.SetFieldInMessage(request, update_mask_path, update_mask)
    return request

  return Process


def CreateFullServiceAccountNameFromId(account_id):
  if not account_id.isdigit():
    raise gcloud_exceptions.InvalidArgumentException(
        'account_id',
        'Account unique ID should be a number. Please double check your input'
        ' and try again.',
    )
  return 'projects/-/serviceAccounts/' + account_id


def GeneratePublicKeyDataFromFile(path):
  """Generate public key data from a path.

  Args:
    path: (bytes) the public key file path given by the command.

  Raises:
    InvalidArgumentException: if the public key file path provided does not
                              exist or is too large.
  Returns:
    A public key encoded using the UTF-8 charset.
  """
  try:
    public_key_data = arg_parsers.FileContents()(path).strip()
  except arg_parsers.ArgumentTypeError as e:
    raise gcloud_exceptions.InvalidArgumentException(
        'public_key_file',
        '{}. Please double check your input and try again.'.format(e),
    )
  return public_key_data.encode('utf-8')


def AddCreateExtendedAttributesConfigToRequest(ref, args, request):
  """Add ExtendedAttributesOAuth2Client fields to create requests.

  This hook adds fields to workforcePoolProvider requests.

  Args:
    ref: A resource ref to the parsed resource.
    args: Parsed args namespace.
    request: The apitools request message to be modified.

  Returns:
    The modified apitools request message.
  """

  del ref
  messages = apis.GetMessagesModule('iam', 'v1')
  SetExtendedAttributesOauth2ClientFields(request, args, messages)
  return request


def AddClearableExtendedAttributesConfigToRequest(ref, args, request):
  """Adds or clears ExtraAttributesOAuth2Client fields in update requests."""
  del ref
  messages = apis.GetMessagesModule('iam', 'v1')
  if (
      args.clear_extended_attributes_config is not None
      and args.clear_extended_attributes_config
  ):
    arg_utils.SetFieldInMessage(
        request,
        'workforcePoolProvider.extendedAttributesOauth2Client',
        None,
    )
  else:
    SetExtendedAttributesOauth2ClientFields(request, args, messages)

  return request


def SetExtendedAttributesOauth2ClientFields(request, args, messages):
  """Set ExtendedAttributesOauth2Client fields in the request."""
  if args.extended_attributes_type is not None:
    response_type = (
        messages.GoogleIamAdminV1WorkforcePoolProviderExtraAttributesOAuth2Client.AttributesTypeValueValuesEnum
    )
    if 'azure-ad-groups-id' in args.extended_attributes_type:
      arg_utils.SetFieldInMessage(
          request,
          'workforcePoolProvider.extendedAttributesOauth2Client.attributesType',
          response_type.AZURE_AD_GROUPS_ID,
      )
  if args.extended_attributes_client_id is not None:
    arg_utils.SetFieldInMessage(
        request,
        'workforcePoolProvider.extendedAttributesOauth2Client.clientId',
        args.extended_attributes_client_id,
    )
  if args.extended_attributes_client_secret_value is not None:
    arg_utils.SetFieldInMessage(
        request,
        'workforcePoolProvider.extendedAttributesOauth2Client.clientSecret.value.plainText',
        args.extended_attributes_client_secret_value,
    )
  if args.extended_attributes_issuer_uri is not None:
    arg_utils.SetFieldInMessage(
        request,
        'workforcePoolProvider.extendedAttributesOauth2Client.issuerUri',
        args.extended_attributes_issuer_uri,
    )
  if args.extended_attributes_filter is not None:
    arg_utils.SetFieldInMessage(
        request,
        'workforcePoolProvider.extendedAttributesOauth2Client.queryParameters.filter',
        args.extended_attributes_filter,
    )


def AddExtendedAttributesConfigFieldMask(unused_ref, args, request):
  """Adds ExtendedAttributesOauth2Client specific fieldmask entries to the update workforcePoolProvider request."""
  mask_fields = []
  if request.updateMask:
    mask_fields = request.updateMask.split(',')
  if (
      args.clear_extended_attributes_config is not None
      and args.clear_extended_attributes_config
  ):
    mask_fields.append('extendedAttributesOauth2Client')
  if args.extended_attributes_type is not None:
    mask_fields.append('extendedAttributesOauth2Client.attributesType')
  if args.extended_attributes_client_id is not None:
    mask_fields.append('extendedAttributesOauth2Client.clientId')
  if args.extended_attributes_client_secret_value is not None:
    mask_fields.append(
        'extendedAttributesOauth2Client.clientSecret.value.plainText'
    )
  if args.extended_attributes_issuer_uri is not None:
    mask_fields.append('extendedAttributesOauth2Client.issuerUri')
  if args.extended_attributes_filter is not None:
    mask_fields.append('extendedAttributesOauth2Client.queryParameters.filter')
  if mask_fields:
    request.updateMask = ','.join(mask_fields)
  return request


def ClearFlag(args):
  """Clear the value for a flag."""
  del args
  return None


def ModifyHardDeleteFlagInRequest(ref, args, request):
  """Remove the flag from the request when it is not specified."""
  del ref
  if not args.hard_delete:
    arg_utils.SetFieldInMessage(
        request,
        'hardDelete',
        None,
    )
  return request


def EraseProjectHook(unused_ref, unused_args, request):
  """Hook to erase the project identifier from the request.

  Args:
    unused_ref: The resource reference of the response.
    unused_args: The arguments of the command.
    request: The request of the command.

  Returns:
    The modified apitools request message.
  """
  request.name = re.sub('projects/[^/]+/', 'projects/-/', request.name)
  return request


def ClearScimUsage(
    flag_value: bool,
) -> 'apis.GetMessagesModule("iam", "v1").WorkforcePoolProvider.ScimUsageValueValuesEnum | None':
  """Clears the SCIM usage by explicitly setting it to SCIM_USAGE_UNSPECIFIED.

  Args:
    flag_value: bool, if True, returns SCIM_USAGE_UNSPECIFIED enum.

  Returns:
    SCIM_USAGE_UNSPECIFIED if flag_value is True, else None.
  """
  if flag_value:
    messages = apis.GetMessagesModule('iam', 'v1')
    return (
        messages.WorkforcePoolProvider.ScimUsageValueValuesEnum.SCIM_USAGE_UNSPECIFIED
    )
  return None


def CreateCustomClaimsList(
    claims: list[str] | None,
) -> 'apis.GetMessagesModule("iam", "v1").CustomClaimsList | None':
  """Wraps the parsed --allowed-custom-claims values in a CustomClaimsList.

  The flag maps to the `allowedCustomClaims` field (a member of the
  `custom_claims_config` oneof) rather than to `allowedCustomClaims.claims`, so
  that the update mask names the oneof member itself. Masking the nested
  `claims` sub-field is not applied by the server when the OAuth client has no
  allowed custom claims configured yet.

  Args:
    claims: list of custom claim keys parsed from the flag, or None.

  Returns:
    A CustomClaimsList message containing the claims, or None if no claims were
    specified.
  """
  if claims is None:
    return None
  messages = apis.GetMessagesModule('iam', 'v1')
  return messages.CustomClaimsList(claims=claims)


def ClearUserType(
    flag_value: bool,
) -> 'apis.GetMessagesModule("iam", "v1").OauthClient.UserTypeValueValuesEnum | None':
  """Clears the OAuth client user type by setting it to USER_TYPE_UNSPECIFIED.

  Args:
    flag_value: bool, if True, returns the USER_TYPE_UNSPECIFIED enum.

  Returns:
    USER_TYPE_UNSPECIFIED if flag_value is True, else None.
  """
  if flag_value:
    messages = apis.GetMessagesModule('iam', 'v1')
    return messages.OauthClient.UserTypeValueValuesEnum.USER_TYPE_UNSPECIFIED
  return None


def ArgList(
    min_length: int | str = 0, max_length: int | str | None = None
) -> arg_parsers.ArgList:
  """Returns an ArgList type with length bounds for use in declarative YAML.

  Arguments given to a YAML type hook
  (`type: ...hooks:ArgList:min_length=1,max_length=100`) are passed as strings,
  while arg_parsers.ArgList expects integers.

  Args:
    min_length: The minimum number of list elements.
    max_length: The maximum number of list elements, or None for no limit.

  Returns:
    An arg_parsers.ArgList that rejects lists outside the given bounds.
  """
  return arg_parsers.ArgList(
      min_length=int(min_length),
      max_length=int(max_length) if max_length is not None else None,
  )


class _CustomSchemaAttributeArgObject(arg_parsers.ArgObject):
  """ArgObject for the custom SCIM attribute flags.

  Used by --custom-{user,group}-attribute (create) and
  --add-custom-{user,group}-attribute (update). Each object is one custom SCIM
  attribute (`name=NAME`); several attributes are given by repeating the flag, a
  JSON list or the bracketed shorthand `[name=A,name=B]`.
  """

  def _ParseArgDict(self, arg_value):
    # ArgObject._ParseArgDict splits a `[...]` list and calls this method again
    # for each element, so every shorthand object is checked on its own, also
    # inside lists. JSON values never reach this method. ArgDict keeps only the
    # last value of a repeated key, so `name=a,name=b` would silently drop `a`.
    stripped = arg_value.strip()
    is_list = stripped.startswith('[') and stripped.endswith(']')
    if not is_list and len(re.findall(r'\bname\s*=', stripped)) > 1:
      raise arg_parsers.ArgumentTypeError(
          'Give one attribute (name=NAME) per value. To add more, repeat the'
          ' flag or use [name=A,name=B].'
      )
    return super(_CustomSchemaAttributeArgObject, self)._ParseArgDict(arg_value)

  def __call__(self, arg_value):
    value = super(_CustomSchemaAttributeArgObject, self).__call__(arg_value)
    # An empty list (for example '[]') would otherwise look like the flag was
    # not given.
    if not value:
      raise arg_parsers.ArgumentTypeError(
          'At least one custom attribute must be given.'
      )
    return value


def CustomSchemaAttributeArgType():
  """Returns the type of the custom SCIM attribute flags.

  The flags are --custom-*-attribute on create and --add-custom-*-attribute on
  update.

  Each value is one custom SCIM attribute given as `name=NAME`, or a JSON list
  of such objects. Future attribute options can be added as new keys in `spec`.

  Returns:
    A repeated ArgObject that accepts the `name` key.
  """
  return _CustomSchemaAttributeArgObject(
      spec={'name': str},
      required_keys=['name'],
      repeated=True,
      # File input is reserved for a future --custom-attributes-from-file flag.
      # Without this, a value like name=foo.json is read as a file path.
      enable_file_upload=False,
  )


def _BuildCustomSchemaDefinitions(messages, user_attributes, group_attributes):
  """Builds CustomSchemaDefinition messages for the given custom attributes.

  Args:
    messages: The IAM v1 apitools messages module.
    user_attributes: list of parsed custom attributes (dicts with a `name` key)
      for the User resource, or None.
    group_attributes: list of parsed custom attributes (dicts with a `name` key)
      for the Group resource, or None.

  Returns:
    A list of CustomSchemaDefinition messages, User attributes first.
  """
  resource_type = messages.CustomSchemaDefinition.ResourceTypeValueValuesEnum
  return [
      messages.CustomSchemaDefinition(
          attribute=attribute['name'], resourceType=resource_type.USER
      )
      for attribute in user_attributes or []
  ] + [
      messages.CustomSchemaDefinition(
          attribute=attribute['name'], resourceType=resource_type.GROUP
      )
      for attribute in group_attributes or []
  ]


def AddCustomSchemaDefinitionsToCreateRequest(unused_ref, args, request):
  """Adds custom SCIM attributes to a SCIM tenant create request.

  Values of --custom-user-attribute and --custom-group-attribute are set as
  the customSchemaDefinitions of the new tenant. Identical values repeated on
  the command line are merged by the flag action, and the flag type rejects bad
  syntax; all other validation (for example of duplicate or invalid names) is
  done by the server. When neither flag is given (or the release track doesn't
  have them), the list is empty and is not sent, so the request is unchanged.

  Args:
    unused_ref: A resource ref to the parsed resource.
    args: Parsed args namespace.
    request: The apitools request message to be modified.

  Returns:
    The modified apitools request message.
  """
  messages = apis.GetMessagesModule('iam', 'v1')
  # The flags only exist in some release tracks, so read them with getattr.
  # create.yaml marks --claim-mapping required: true, so the tenant message is
  # always set before this hook runs.
  request.workforcePoolProviderScimTenant.customSchemaDefinitions = (
      _BuildCustomSchemaDefinitions(
          messages,
          getattr(args, 'custom_user_attribute', None),
          getattr(args, 'custom_group_attribute', None),
      )
  )
  return request


def AddCustomSchemaDefinitionsToUpdateRequest(unused_ref, args, request):
  """Appends custom SCIM attributes to a SCIM tenant update request.

  Custom attributes are append-only on the server, so the PATCH must carry the
  full list: the existing definitions (read with a GET) followed by the values
  of --add-custom-user-attribute and --add-custom-group-attribute. The GET is
  only made when one of these flags is given, and customSchemaDefinitions is
  added to the update mask once.

  Args:
    unused_ref: A resource ref to the parsed resource.
    args: Parsed args namespace.
    request: The apitools request message to be modified.

  Returns:
    The modified apitools request message.
  """
  # The flags only exist in some release tracks, so read them with getattr.
  user_attributes = getattr(args, 'add_custom_user_attribute', None)
  group_attributes = getattr(args, 'add_custom_group_attribute', None)
  if not user_attributes and not group_attributes:
    return request
  client, messages = util.GetClientAndMessages()
  existing_tenant = client.locations_workforcePools_providers_scimTenants.Get(
      messages.IamLocationsWorkforcePoolsProvidersScimTenantsGetRequest(
          name=request.name
      )
  )
  if request.workforcePoolProviderScimTenant is None:
    request.workforcePoolProviderScimTenant = (
        messages.WorkforcePoolProviderScimTenant()
    )
  request.workforcePoolProviderScimTenant.customSchemaDefinitions = list(
      existing_tenant.customSchemaDefinitions
  ) + _BuildCustomSchemaDefinitions(messages, user_attributes, group_attributes)
  # The auto-generated mask is empty when only the custom attribute flags are
  # given (and None if the request was not built by the declarative update).
  mask_fields = [f for f in (request.updateMask or '').split(',') if f]
  if 'customSchemaDefinitions' not in mask_fields:
    mask_fields.append('customSchemaDefinitions')
  request.updateMask = ','.join(mask_fields)
  return request
