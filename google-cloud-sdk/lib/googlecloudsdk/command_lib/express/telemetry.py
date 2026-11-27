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
"""Telemetry helpers for `gcloud alpha express` commands."""

from __future__ import annotations

from googlecloudsdk.command_lib.onboarding import telemetry as onboarding_telemetry

STEP_KEY = 'express_step'
FILE_KEY = 'express_file'
ADD_BILLING_URL_SOURCE_KEY = 'express_add_billing_url_source'

FILE_CREATED = 'created'
FILE_UPDATED = 'updated'
FILE_UNCHANGED = 'unchanged'

URL_SOURCE_SERVER = 'server'
URL_SOURCE_DEFAULT = 'default'


def RecordStep(step_name: str, status: str) -> None:
  """Records the outcome of a pipeline step (`<step>:<status>`)."""
  onboarding_telemetry.RecordEvent(STEP_KEY, f'{step_name}:{status}')


def RecordExpressFile(status: str) -> None:
  """Records whether `cloud-express.yaml` was created, updated, or unchanged."""
  onboarding_telemetry.RecordEvent(FILE_KEY, status)


def RecordAddBillingUrlSource(source: str) -> None:
  """Records the source (`server` or `default`) of the add-billing URL."""
  onboarding_telemetry.RecordEvent(ADD_BILLING_URL_SOURCE_KEY, source)
