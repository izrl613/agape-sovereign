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

"""Verification engine for Go gcloud migration.

This module hydrates a Calliope Namespace from the Go payload (passed via
GOCLOUD_PAYLOAD env var), compares it against the Python parser Namespace,
and reports mismatches.
"""

import os

from googlecloudsdk.calliope import namespace_hydrator
from googlecloudsdk.calliope import namespace_serializer
from googlecloudsdk.core import log
from googlecloudsdk.core.util import encoding

# If this environment variable is '1', a parity mismatch fails the command.
_STRICT_PARITY_ENV = 'GOCLOUD_STRICT_PARITY'

# If this environment variable is '1', None and empty containers ('', [], {})
# are compared strictly instead of being treated as equivalent.
_STRICT_EMPTY_ENV = 'GOCLOUD_STRICT_EMPTY'

# Tracks whether Verify() ran inside the active VerificationScope so runtime
# SystemExit errors raised after parsing are not mistaken for parse failures.
_active_scope_verified = False


class ParityMismatchError(Exception):
  """Go and Python parsed the arguments of a command differently."""


class VerificationScope:
  """Context manager for GOCLOUD_PARSER=verify around CLI.Execute().

  Verifies parse-failure symmetry when CLI.Execute() exits with a non-zero
  SystemExit before reaching Verify() (e.g. Python parse_args rejected the CLI
  arguments), without modifying CLI.Execute() itself.
  """

  def __init__(self, go_payload_json):
    self._go_payload_json = go_payload_json
    self._prev_verified = False

  def __enter__(self):
    global _active_scope_verified
    self._prev_verified = _active_scope_verified
    _active_scope_verified = False
    return self

  def __exit__(self, exc_type, exc_val, exc_tb):
    global _active_scope_verified
    was_verified = _active_scope_verified
    _active_scope_verified = self._prev_verified
    if encoding.GetEncodedValue(os.environ, 'GOCLOUD_PAYLOAD') is not None:
      encoding.SetEncodedValue(os.environ, 'GOCLOUD_PAYLOAD', None)
    if (
        exc_type is not None
        and issubclass(exc_type, SystemExit)
        and exc_val.code not in (None, 0)
        and not was_verified
        and '_ARGCOMPLETE' not in os.environ
    ):
      # Python exited before Verify() ran (i.e. Python's parser rejected the
      # arguments). Check accept/reject symmetry against Go's shadow result,
      # then return False so Python's original SystemExit still propagates.
      try:
        VerifyParseFailure(
            'exit code {}'.format(exc_val.code), self._go_payload_json
        )
      except Exception as e:  # pylint: disable=broad-except
        if IsStrictParity():
          raise
        log.debug('Go verification failed: %s', e)
    return False


def IsStrictParity():
  """Returns True if a parity mismatch must fail the command."""
  return encoding.GetEncodedValue(os.environ, _STRICT_PARITY_ENV) == '1'


def IsStrictEmpty():
  """Returns True if None and empty containers should be compared strictly."""
  return encoding.GetEncodedValue(os.environ, _STRICT_EMPTY_ENV) == '1'


def Verify(py_namespace, go_payload_json):
  """Compares the Python namespace with the Go namespace from the payload.

  Logs the mismatches at debug level.

  Args:
    py_namespace: The namespace that the Python parser made.
    go_payload_json: str, The GOCLOUD_PAYLOAD JSON that Go sent.

  Raises:
    ParityMismatchError: If there are mismatches and IsStrictParity() is True.
  """
  global _active_scope_verified
  _active_scope_verified = True

  payload = _ParseGoPayload(go_payload_json)
  if payload is None:
    return
  # Accept/reject symmetry check (Go rejected, Python accepted): we check
  # whether both parsers agree on accepting vs rejecting the invocation rather
  # than comparing exact error strings, since Go and argparse format usage
  # diagnostics differently.
  if payload.parse_error is not None:
    msg = (
        'GOCLOUD ARG PARITY MISMATCH: Go parser rejected arguments '
        '({}), but Python parser succeeded'.format(payload.parse_error)
    )
    log.debug(msg)
    if IsStrictParity():
      raise ParityMismatchError(msg)
    return

  calliope_command = py_namespace._GetCommand()  # pylint: disable=protected-access
  if getattr(calliope_command, '_parser', None) is None:
    calliope_command._parser = py_namespace._GetParser()  # pylint: disable=protected-access

  py_cmd_path = calliope_command.GetPath()
  go_cmd_path = payload.command_path
  mismatches = []

  # 1. Compare Command Path (Routing)
  _VerifyCommandPath(py_cmd_path, go_cmd_path, mismatches)

  # 2. Hydrate Go Namespace and Compare Namespace-to-Namespace
  go_namespace = namespace_hydrator.HydrateNamespace(calliope_command, payload)

  _VerifySpecifiedArgs(
      list(py_namespace.GetSpecifiedArgNames()),
      list(go_namespace.GetSpecifiedArgNames()),
      mismatches,
  )

  _VerifyNamespaceValues(py_namespace, go_namespace, mismatches)

  if mismatches:
    _ReportMismatches(py_cmd_path, mismatches)
    if IsStrictParity():
      raise ParityMismatchError(
          'GOCLOUD ARG PARITY MISMATCH for command [{}]: {}'.format(
              ' '.join(py_cmd_path), mismatches
          )
      )


def VerifyParseFailure(error_desc, go_payload_json):
  """Verifies accept/reject symmetry when Python's parse_args rejects arguments.

  Go records any shadow parse or validation failure in payload.parse_error. We
  verify that both parsers rejected the input (rather than matching exact error
  strings, which differ in wording between Go and argparse); if Go succeeded
  (payload.parse_error is None), Go falsely accepted invalid arguments.

  Args:
    error_desc: str, Description of Python's parse failure (e.g. 'exit code 2').
    go_payload_json: str, The GOCLOUD_PAYLOAD JSON that Go sent.

  Raises:
    ParityMismatchError: If Go succeeded while Python rejected the arguments
      and IsStrictParity() is True.
  """
  payload = _ParseGoPayload(go_payload_json)
  if payload is None or payload.parse_error is not None:
    return
  msg = (
      'GOCLOUD ARG PARITY MISMATCH: Python parser rejected arguments '
      '({}), but Go parser succeeded'.format(error_desc)
  )
  log.debug(msg)
  if IsStrictParity():
    raise ParityMismatchError(msg)


def _ParseGoPayload(go_payload_json):
  """Parses GOCLOUD_PAYLOAD JSON string into a namespace_hydrator.Payload."""
  try:
    return namespace_hydrator.Payload.FromJson(go_payload_json)
  except Exception as e:  # pylint: disable=broad-except
    log.debug('Failed to parse GOCLOUD_PAYLOAD JSON: %s', e)
    return None


def _VerifyCommandPath(py_cmd_path, go_cmd_path, mismatches):
  """Compares Python and Go command paths."""
  if go_cmd_path != py_cmd_path:
    mismatches.append({
        'type': 'command_path',
        'expected': py_cmd_path,
        'actual': go_cmd_path,
    })


def _VerifySpecifiedArgs(py_specified, go_specified, mismatches):
  """Compares specified argument lists between Python and Go namespaces."""
  go_spec_norm = set()
  for s in go_specified:
    norm = s.lstrip('-').replace('_', '-').lower()
    if norm.startswith('no-'):
      norm = norm[3:]
    go_spec_norm.add(norm)

  py_spec_norm = set()
  for s in py_specified:
    norm = s.lstrip('-').replace('_', '-')
    if ':' in norm:
      norm = norm.split(':', 1)[0]
    norm = norm.lower()
    if norm.startswith('no-'):
      norm = norm[3:]
    py_spec_norm.add(norm)

  if go_spec_norm != py_spec_norm:
    mismatches.append({
        'type': 'specified_args',
        'expected': sorted(list(py_spec_norm)),
        'actual': sorted(list(go_spec_norm)),
    })


def _VerifyNamespaceValues(py_namespace, go_namespace, mismatches):
  """Compares normalized attribute values between Python and Go namespaces."""
  raw_diffs = namespace_serializer.CompareArgs(
      py_namespace, go_namespace, ignore_empty=not IsStrictEmpty()
  )
  if raw_diffs:
    arg_mismatches = {
        k.rstrip('_')
        .replace('_', '-')
        .lower(): {
            'expected': diff['expected'],
            'actual': diff['actual'],
        }
        for k, diff in raw_diffs.items()
    }
    mismatches.append({'type': 'arguments', 'mismatches': arg_mismatches})


def _ReportMismatches(cmd_path, mismatches):
  """Logs warnings for all recorded mismatches."""
  cmd_str = ' '.join(cmd_path)
  log.debug('Go gcloud verification mismatch for command: %s', cmd_str)
  for m in mismatches:
    if m['type'] == 'arguments':
      for arg, diff in m['mismatches'].items():
        log.debug(
            '  Arg [%s] mismatch: Python=%s, Go=%s',
            arg,
            diff['expected'],
            diff['actual'],
        )
    else:
      log.debug(
          '  Mismatch [%s]: Python=%s, Go=%s',
          m['type'],
          m['expected'],
          m['actual'],
      )
