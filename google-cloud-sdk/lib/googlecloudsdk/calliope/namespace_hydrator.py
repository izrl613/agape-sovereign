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

"""Calliope JSON argument hydration library."""

import argparse
from collections.abc import Mapping
import dataclasses
import json
from typing import Any

from googlecloudsdk.calliope import parser_extensions


@dataclasses.dataclass(frozen=True)
class Arg:
  """A parsed flag or positional argument from Go's clap parser.

  Attributes:
    name: Flag or positional argument name emitted by Go.
    value: Parsed argument value, or None when unset.
    is_set: True if the argument was explicitly supplied on the command line.
    source: Origin of value ('cli', 'default', 'unset', or None).
    seq: 1-based CLI occurrence index when set on the command line, or 0 when
      unset.
    dest: Target Namespace attribute name.
    cli_flag_name: Canonical CLI option token for this flag.
  """

  name: str
  value: Any = None
  is_set: bool = False
  _dest: str | None = None
  source: str | None = None
  seq: int = 0

  @classmethod
  def FromDict(cls, data: Mapping[str, Any]) -> 'Arg':
    return cls(
        name=data['name'],
        value=data.get('value'),
        is_set=bool(data.get('is_set', False)),
        _dest=data.get('dest'),
        source=data.get('source'),
        seq=int(data.get('seq') or 0),
    )

  @property
  def dest(self) -> str:
    return self._dest or self.name.lstrip('-').replace('-', '_')

  @property
  def cli_flag_name(self) -> str:
    return self.name if self.name.startswith('-') else f'--{self.name}'


@dataclasses.dataclass(frozen=True)
class Payload:
  """The deserialized GOCLOUD_PAYLOAD emitted by the Go CLI."""

  command_path: list[str] = dataclasses.field(default_factory=list)
  flags: tuple[Arg, ...] = ()
  args: tuple[Arg, ...] = ()
  parse_error: str | None = None

  @classmethod
  def FromJson(cls, payload_json: str) -> 'Payload':
    """Deserializes a GOCLOUD_PAYLOAD JSON string into a Payload.

    Args:
      payload_json: The raw JSON string emitted by the Go CLI.

    Returns:
      The deserialized Payload instance.

    Raises:
      ValueError: If payload_json is not valid JSON or does not match the
        expected payload schema.
    """
    try:
      data = json.loads(payload_json)
      if not isinstance(data, Mapping):
        raise ValueError(
            f'Expected a JSON object, got {type(data).__name__}'
        )
      parse_error = data.get('parse_error')
      if parse_error is not None and not isinstance(parse_error, str):
        raise ValueError(
            'Expected parse_error to be a string, got'
            f' {type(parse_error).__name__}'
        )
      return cls(
          command_path=list(data.get('command_path') or []),
          flags=tuple(Arg.FromDict(item) for item in data.get('flags') or []),
          args=tuple(Arg.FromDict(item) for item in data.get('args') or []),
          parse_error=parse_error,
      )
    except (KeyError, TypeError, ValueError) as e:
      raise ValueError(f'Invalid GOCLOUD_PAYLOAD: {e}') from e


def _ResolveFlagValue(action: Any, flag: Arg) -> Any:
  """Resolves a hydrated flag value against Calliope action metadata."""
  if action is None:
    return flag.value
  unwrapped = parser_extensions.UnwrapAction(action)
  prop, kind, prop_val = getattr(
      unwrapped, 'store_property', (None, None, None)
  )
  if (
      prop is not None
      and kind == 'bool'
      and flag.is_set
      and isinstance(flag.value, bool)
  ):
    return 'true' if flag.value else 'false'
  if prop is not None and kind == 'value':
    if flag.is_set:
      if (
          flag.value is not None
          and type(prop_val) in (bool, int, float, str, list, dict, tuple)
          and type(flag.value) is type(prop_val)
      ):
        return flag.value
      return prop_val
    return action.default
  if parser_extensions.IsValueStoreConstAction(unwrapped):
    if flag.is_set:
      return getattr(unwrapped, 'const', flag.value)
    return action.default
  if (
      not flag.is_set
      and action.default is not None
      and type(action.default) not in (bool, int, float, str, list, dict, tuple)
      and str(action.default) == flag.value
  ):
    return action.default
  return flag.value


def HydrateNamespace(calliope_command, payload: Payload):
  """Constructs and populates a Calliope Namespace from a Go payload.

  Args:
    calliope_command: calliope.backend.Command, The resolved Calliope command.
    payload: Payload, The parsed Go payload.

  Returns:
    parser_extensions.Namespace, The populated Calliope namespace object.
  """
  # NOTE: To avoid loading parent commands or configuring/parsing ancestor args
  # in Python, gocloud (Go) should:
  # 1. Supply the target argparse `dest` attribute on each flag/arg item.
  # 2. Pass property overrides via standard `CLOUDSDK_<SECTION>_<PROPERTY>`
  #    environment variables (which `properties.VALUES` reads natively).
  parser = calliope_command._parser  # pylint: disable=protected-access
  parser._calliope_command = calliope_command  # pylint: disable=protected-access
  ns = parser_extensions.Namespace()
  ns._SetParser(parser)  # pylint: disable=protected-access
  # Mirror Command.__init__ parser defaults so commands that inspect
  # args.calliope_command or args.command_path (e.g. base.TopicCommand.Run)
  # see the same attributes as a Python-parsed namespace.
  ns.calliope_command = calliope_command
  command_path = (
      calliope_command.GetPath()
      if hasattr(calliope_command, 'GetPath')
      else None
  )
  if not isinstance(command_path, (list, tuple)):
    command_path = payload.command_path
  ns.command_path = list(command_path)

  option_actions = getattr(parser, '_option_string_actions', None)
  if not isinstance(option_actions, dict):
    option_actions = {}
  raw_actions = getattr(parser, '_actions', None)
  pos_actions = {
      a.dest: a
      for a in (raw_actions if isinstance(raw_actions, (list, tuple)) else ())
      if isinstance(a, argparse.Action) and not a.option_strings
  }

  specified_args = ns.GetSpecifiedArgsDict()
  dest_seqs: dict[str, int] = {}
  dest_sources: dict[str, str | None] = {}

  for flag in payload.flags:
    action = option_actions.get(flag.cli_flag_name)
    value = _ResolveFlagValue(action, flag)
    if flag.is_set:
      if flag.dest not in specified_args or flag.seq >= dest_seqs.get(
          flag.dest, 0
      ):
        setattr(ns, flag.dest, value)
        cli_name = flag.cli_flag_name
        if action and action.option_strings:
          cli_name = action.option_strings[0]
        specified_args[flag.dest] = cli_name
        dest_seqs[flag.dest] = flag.seq
        dest_sources[flag.dest] = 'cli'
    elif not hasattr(ns, flag.dest) or (
        flag.dest not in specified_args
        and (
            (
                dest_sources.get(flag.dest) == 'unset'
                and flag.source == 'default'
            )
            or (getattr(ns, flag.dest) is None and value is not None)
        )
    ):
      setattr(ns, flag.dest, value)
      dest_sources[flag.dest] = flag.source

  for arg in payload.args:
    pos_action = pos_actions.get(arg.dest)
    if arg.is_set:
      if arg.dest not in specified_args or arg.seq >= dest_seqs.get(
          arg.dest, 0
      ):
        setattr(ns, arg.dest, arg.value)
        specified_args[arg.dest] = arg.name
        dest_seqs[arg.dest] = arg.seq
        dest_sources[arg.dest] = 'cli'
    elif pos_action is not None and pos_action.nargs in ('?', '*'):
      zero_val = (
          []
          if (pos_action.nargs == '*' and pos_action.default is None)
          else arg.value
      )
      setattr(ns, arg.dest, zero_val)
      dest_sources[arg.dest] = arg.source
    elif not hasattr(ns, arg.dest) or (
        arg.dest not in specified_args
        and dest_sources.get(arg.dest) == 'unset'
        and arg.source == 'default'
    ):
      setattr(ns, arg.dest, arg.value)
      dest_sources[arg.dest] = arg.source

  return ns
