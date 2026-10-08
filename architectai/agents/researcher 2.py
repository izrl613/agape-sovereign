from google.adk.agents import LlmAgent

researcher_agent = LlmAgent(
    name='researcher',
    model='gemini-2.0-flash-lite',
    description='Researches the topic and stores findings in session state.',
    instruction=(
        'Analyze the user request thoroughly. '
        'Store key findings in state["research_results"] for the next agent to use.'
    ),
    output_key='research_results',
)
