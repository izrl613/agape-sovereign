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
"""Flags for App Lifecycle Manager commands."""

from googlecloudsdk.api_lib.util import apis
from googlecloudsdk.calliope import exceptions
from googlecloudsdk.calliope.concepts import concepts
from googlecloudsdk.command_lib.util.apis import yaml_data
from googlecloudsdk.command_lib.util.concepts import concept_parsers


def HandleDefaultEvaluation(unused_ref, args, request):
  """Request hook to handle use of --with-default-evaluation flag.

  Args:
    unused_ref: A resource ref to the parsed resource.
    args: Parsed args namespace containing the flags.
    request: The request message to be modified.

  Returns:
    The modified request message.

  Raises:
    exceptions.ConflictingArgumentsException: If --with-default-evaluation is
      specified together with --variants or --evaluation-spec.
    exceptions.InvalidArgumentException: If --with-default-evaluation is
      specified for a non-boolean flag.
  """
  if (
      not args.IsKnownAndSpecified('with_default_evaluation')
      or not args.with_default_evaluation
  ):
    return request

  conflicting_args = [
      flag
      for name, flag in (
          ('variants', '--variants'),
          ('evaluation_spec', '--evaluation-spec'),
      )
      if args.IsSpecified(name)
  ]
  if conflicting_args:
    raise exceptions.ConflictingArgumentsException(
        '--with-default-evaluation', *conflicting_args
    )

  messages = apis.GetMessagesModule('saasservicemgmt', 'v1beta1')
  if (
      request.flag.flagValueType
      != messages.Flag.FlagValueTypeValueValuesEnum.FLAG_VALUE_TYPE_BOOLEAN
  ):
    raise exceptions.InvalidArgumentException(
        '--with-default-evaluation',
        'Default evaluation is only supported for boolean flags'
        ' (--flag-value-type=bool).',
    )

  request.flag.variants = [
      messages.FlagVariant(id='Enabled', booleanValue=True),
      messages.FlagVariant(id='Disabled', booleanValue=False),
  ]
  request.flag.evaluationSpec = messages.EvaluationSpec(
      defaultVariant='Disabled'
  )
  return request


def AddUnitKindArgToParser(parser, required=True, help_text='UnitKind.'):
  """Sets up the UnitKind argument for the command."""
  unit_kind_data = yaml_data.ResourceYAMLData.FromPath('saas_runtime.unit_kind')
  return concept_parsers.ConceptParser.ForResource(
      '--unit-kind',
      concepts.ResourceSpec.FromYaml(unit_kind_data.GetData()),
      help_text,
      required=required,
  ).AddToParser(parser)


def AddProjectLocationArgToParser(parser, required=True, help_text='location.'):
  """Sets up the location argument for the command."""
  project_location_data = yaml_data.ResourceYAMLData.FromPath(
      'saas_runtime.project_location'
  )
  return concept_parsers.ConceptParser.ForResource(
      '--project-location',
      concepts.ResourceSpec.FromYaml(project_location_data.GetData()),
      help_text,
      required=required,
  ).AddToParser(parser)
