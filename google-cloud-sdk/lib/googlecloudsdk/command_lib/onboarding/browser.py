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
"""Browser-launch helper shared across onboarding and express commands."""

from __future__ import annotations

import webbrowser

from googlecloudsdk.command_lib.util import check_browser
from googlecloudsdk.core import log


def OpenUrl(
    url: str,
    *,
    opened_msg: str,
    not_opened_msg: str,
    attempt_launch_browser: bool = True,
) -> bool:
  """Prints `url` and opens it in a web browser if possible.

  Args:
    url: The URL to open and display.
    opened_msg: Format string (`{url}`) printed when a browser tab is opened.
    not_opened_msg: Format string (`{url}`) printed when no browser is opened.
    attempt_launch_browser: Whether to attempt launching a browser.

  Returns:
    True if a browser tab was opened; False otherwise.
  """
  launched = False
  if check_browser.ShouldLaunchBrowser(
      attempt_launch_browser=attempt_launch_browser
  ):
    try:
      # `open_new_tab` returns False if no browser could be launched.
      launched = bool(webbrowser.open_new_tab(url))
    except (webbrowser.Error, OSError) as e:
      log.debug('Failed to open web browser: %s', e)
  message = opened_msg if launched else not_opened_msg
  log.status.Print(message.format(url=url))
  return launched
