# ResearchAI — Autonomous Research & Competitor Tracking Agent

## 👥 Team Members
- Aayan Shaikh
- Shreeraj Gaware
- Saish Deshmukh
- Sarthak Kahandal
- Sarthak Sarode

## 📌 Problem Statement
Organizations, startups, and research institutions need to stay updated on research trends, competitor strategies, and industry developments. Manually monitoring multiple information sources is time-consuming and can lead to missed opportunities.

ResearchAI addresses this problem by using an autonomous multi-agent system to collect evidence from multiple sources, analyze it, handle uncertainty and tool failures, and provide actionable insights.

## 🎯 Theme
**Research & Competitor Tracking**

## 💡 Project Description
ResearchAI is a multi-agent research system that processes a user's query, collects evidence from web and research sources, and analyzes the available evidence to generate a final grounded result.

The system uses two specialized agents:

### 🔎 Agent 1 — Evidence Collection Agent
- Collects web evidence using Hacker News API
- Collects research evidence using OpenAlex API
- Uses Crossref as a research fallback
- Handles partial tool failures

### 🧠 Agent 2 — Compliance Analysis Agent
- Analyzes collected evidence
- Checks source coverage and agreement
- Identifies uncertainty
- Classifies results as:
  - Supported
  - Partially Supported
  - Not Supported
  - Insufficient Evidence

## 🔄 Workflow
User Query  
↓  
Intent Analysis & Dynamic Planning  
↓  
Evidence Collection Agent  
↓  
Web Search + Research Search  
↓  
Conditional Routing  
↓  
Compliance Analysis Agent  
↓  
Confidence & Uncertainty Analysis  
↓  
Final Intelligence Report

## 🛠️ Technologies Used
- HTML5
- CSS3
- JavaScript
- Node.js
- Express.js
- Hacker News API
- OpenAlex API
- Crossref API
- Git & GitHub

## ✨ Features
- 🤖 Multi-agent architecture
- 🔎 Web and research evidence collection
- 🧠 Dynamic task planning
- 🔄 Agent-to-agent collaboration
- ⚠️ Uncertainty detection
- 📊 Confidence-based classification
- 🛡️ Tool failure recovery
- ❌ Refusal of unsupported conclusions
- 🧠 Context and task memory
- 📋 Live investigation timeline
- 🔗 Clickable evidence source links
- 💻 Modern AI command-center interface

## 🛡️ Failure Recovery
The system was tested with a simulated web-search failure. Even when the web tool failed, the research tool successfully returned evidence and the multi-agent workflow continued.

Example:

Web Search: Failed  
Research Search: Success  
Failure Recovered: true  
Final Result: Partially Supported

This demonstrates that the system can recover from partial tool failures instead of stopping completely.

## 🧪 Evaluation — Task 6
The system was tested across multiple scenarios:

| Scenario | Result |
|---|---|
| Normal Query | Passed |
| Ambiguous / Broad Query | Passed |
| No Evidence / Unsupported Query | Passed |
| Limited Evidence | Passed |
| Tool Failure | Recovered |
| Adversarial Failure Test | Passed |
| Repeated Runs | Tested |
| Uncertainty Detection | Passed |

### Evaluation Results
- Valid queries collected evidence from web and research sources.
- A normal test produced **10 evidence items** and a **Supported** result.
- A nonexistent query produced **0 evidence items** and **Not Supported**.
- A simulated tool failure was recovered using an independent research source.
- When evidence was available from only one source type, the system returned **Partially Supported** with **Medium Uncertainty** and recommended additional evidence.

This demonstrates accuracy, groundedness, failure recovery, uncertainty awareness, robustness, and refusal of unsupported conclusions.
