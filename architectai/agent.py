from google.adk.agents import SequentialAgent
from .agents.researcher import researcher_agent
from .agents.responder import responder_agent

root_agent = SequentialAgent(
    name='architectai',
    description='A multi-agent pipeline: researcher gathers information, responder formulates the reply.',
    sub_agents=[researcher_agent, responder_agent],
)
