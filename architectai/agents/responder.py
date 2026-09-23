from google.adk.agents import LlmAgent

responder_agent = LlmAgent(
    name='responder',
    model='gemini-2.0-flash-lite',
    description='Formulates the final response using research findings from state.',
    instruction=(
        'Read state["research_results"] and use those findings to write '
        'a clear, concise response for the user.'
    ),
)
