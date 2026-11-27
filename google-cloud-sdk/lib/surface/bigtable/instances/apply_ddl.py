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
"""Bigtable instances apply-ddl command."""

import textwrap

from googlecloudsdk.api_lib.bigtable import instances
from googlecloudsdk.api_lib.bigtable import util
from googlecloudsdk.calliope import base
from googlecloudsdk.command_lib.bigtable import arguments
from googlecloudsdk.core import log


@base.Hidden
@base.UniverseCompatible
@base.RegionalEndpointsNotSupported
@base.ReleaseTracks(base.ReleaseTrack.ALPHA, base.ReleaseTrack.BETA)
class ApplyDdl(base.UpdateCommand):
  """Apply DDL statements to a Bigtable instance."""

  detailed_help = {
      'DESCRIPTION': textwrap.dedent("""\
          Apply GoogleSQL DDL (Data Definition Language) statements to a
          Bigtable instance. Statements are executed sequentially in order. If a
          statement fails, statements that have already completed are not rolled
          back, and subsequent statements are not executed.
          """),
      'EXAMPLES': textwrap.dedent("""\
          To apply a DDL statement to an instance, run:

            $ {command} my-instance-id --ddl="CREATE TABLE Customers (customer_id STRING, profile MAP<BYTES, BYTES>, PRIMARY KEY (customer_id));"

          To apply DDL statements from a file to an instance, run:

            $ {command} my-instance-id --ddl-file=schema.sql
          """),
  }

  @staticmethod
  def Args(parser):
    """Register flags for this command."""
    arguments.AddInstanceResourceArg(
        parser, 'to apply the DDL statements to', positional=True
    )
    arguments.ArgAdder(parser).AddDdlArgs().AddAsync()

  def Run(self, args):
    """This is what gets called when the user runs this command.

    Args:
      args: an argparse namespace. All the arguments that were provided to this
        command invocation.

    Returns:
      The `response` field of the completed `Operation` if synchronous, or the
      `Operation` resource if asynchronous.
    """
    instance_ref = args.CONCEPTS.instance.Parse()
    statements = arguments.SplitDdlIntoStatements(args)
    operation = instances.ApplyDdl(instance_ref, statements)
    operation_ref = util.GetOperationRef(operation)
    if args.async_:
      log.UpdatedResource(
          operation_ref.RelativeName(),
          kind='bigtable instance {0}'.format(instance_ref.Name()),
          is_async=True,
      )
      return operation

    return util.AwaitDdl(
        operation_ref,
        'Applying DDL to bigtable instance {0}'.format(instance_ref.Name()),
    )
