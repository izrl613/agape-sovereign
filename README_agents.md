# Orchestrator Agent Workflow

This workspace now contains an orchestrator agent and a runnable entrypoint for the attached sovereign workflow document.

## Files
- agents/orchestrator.py — orchestrator implementation and extraction/synthesis/audit logic
- run_orchestrator.py — CLI entrypoint that runs the workflow against a markdown source file
- workspace_outputs/workflow_report.json — generated workflow report
- workspace_outputs/executive_briefing.md — generated executive briefing

## Run
```bash
cd /Users/aarondavid/Documents/agape-sovereign
python3 run_orchestrator.py --input '/Users/aarondavid/Desktop/Sovereign Data Pipeline Defined - 2026-07-15 21.46.md'
```
