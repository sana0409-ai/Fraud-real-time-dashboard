# Fraud-Monitoring-dashboard
# Fraud Monitoring Dashboard

A real-time fraud monitoring dashboard built with React and TypeScript. The system displays live transaction data, KPI metrics, and provides AI-assisted fraud analysis through the Analyst Copilot feature.

## Features

- **Real-time Transaction Feed**: Live streaming of fraud detection events via WebSocket
- **KPI Dashboard**: Key metrics including transactions/min, alerts, high-risk percentage, and average latency
- **Analyst Actions**: Approve, Escalate, or Block transactions with one click
- **Analyst Copilot**: AI-assisted transaction analysis with evidence scoring and explanations
- **Risk Band Indicators**: Visual color-coded risk levels (LOW/MEDIUM/HIGH)
- **Dark Theme**: Modern dark UI optimized for analyst workflows

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack React Query
- **Real-time**: WebSocket connection to backend
- **Routing**: Wouter

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
npm run dev

Databases
Production Database
28.91MB / 100GB
Development Database
29.17MB / 10GB
Billing Period
Renews monthly, Jan 14
Hours of Compute Used
0 hours
npm run dev
9m
 • 
9 minutes ago
Domains
Name	Registered With	Actions
fraud-monitoring-dashboard--sanataj0409.replit.app
N/A	
simple-portfolio-theta.vercel.app
Verifying
Unknown	
Enable "Accessible Terminal" in Workspace Settings to use a screen reader with the shell.
Add a copilot feature to assist fraud analysts with transaction analysis

2 messages & 6 actions
The Test Model Prediction panel is removed and the Live Transaction Feed now takes up the full width. All three action buttons (Approve in green, Escalate in yellow, Block in red) are visible. Let me verify the action buttons work now:
Checkpoint made
Remove prediction panel and fix transaction ID for analyst actions
Worked for 1 minute
the row i snot updating with a colored background.. also the transactions are moving too fast can we reduce the speed?


6 messages & 18 actions
I see the issues. Let me fix both: 1. **Row not updating**: The events are being processed too quickly and the state isn't persisting properly 2. **Too fast**: Need to throttle the WebSocket events
Checkpoint made
Slow down transaction feed and stabilize row updates
Worked for 2 minutes
why is the postgres database?


1 message & 2 actions
The PostgreSQL database was set up during the initial project configuration to support the Fraud Monitoring Dashboard. It's used with Drizzle ORM to store: 1. **User accounts and sessions** - For authentication if needed 2. **Fraud events data** - Local storage of transactions that come through the WebSocket 3. **Analyst actions** - Recording when analysts approve, escalate, or block transactions However, since this dashboard primarily displays **real-time data from the external fraud detection backend** (via WebSocket), the local database is mostly for persistence and session management rather than being the primary data source. Is there something specific you'd like to know about the database setup, or would you like me to check how it's currently being used?
how is it scurrently being used?


2 messages & 6 actions
Let me check how the database is currently being used:
Build a right‑side drawer panel called “Analyst Copilot” for my existing fraud monitoring dashboard (dark theme). The dashboard already has a live transaction table with three action buttons per row (approve / escalate / block). I want to add a fourth icon button (spark/brain) in the Actions column to open this drawer.

Requirements:

Keep existing layout, colors, and typography. Don’t redesign the whole dashboard.
Add a compact “Copilot” icon button to each row, aligned with the other actions.
When clicked, open a right‑side drawer that overlays on top of the dashboard.
Drawer width: 360–420px on desktop; full‑screen on mobile.
Drawer content:
Header: “Analyst Copilot” + close (X)
Mode toggle chips: Basic / Analyst
Transaction Summary card (amount, merchant, country, billing_zip, transaction_zip, timestamp)
Evidence section: list top 3 rules with scores
Explanation section: rich text paragraph
Bottom action row: Approve / Escalate / Block (same styling as existing actions)
Add a subtle gradient background in the drawer and a left border accent (teal).
Use smooth open/close animation (slide in from right, 250–300ms).
Provide clean, minimal JS to open/close the drawer and populate it with the clicked row’s data.
Ensure it works on mobile and desktop.
Data wiring (mock it in JS, but structure it for real API use):When “Copilot” opens, call POST /search with:
{
"query": "<summary>",
"transaction": {
"amount": ...,
"merchant": "...",
"country": "...",
"billing_zip": "...",
"transaction_zip": "...",
"timestamp": "..."
}
}
Also call POST /explain with:
{
"query": "<summary>",
"mode": "<basic|analyst>",
"transaction": { ... }
}Populate the drawer with:
Transaction Summary: amount, merchant, country, billing_zip, transaction_zip, timestamp
Evidence list from /search: title, description, score
Explanation from /explain: explanation
Mode chip should re‑call /explain with the selected mode.
Return updated HTML/CSS/JS in one response.


1 message & 1 action
This is a great feature addition! I'll create an Analyst Copilot drawer that integrates seamlessly with your existing dashboard. Here's my approach: **Approach:** 1. Add a Copilot icon button (spark/brain icon) to each row in the EventsTable 2. Create a new `AnalystCopilot` drawer component with slide-in animation, dark theme styling, gradient background, and teal accent border 3. Build the drawer content: header, mode toggle chips, transaction summary, evidence list, explanation section, and action buttons 4. Wire up API calls to `/search` and `/explain` endpoints (mocked for now but structured for real use) 5. Handle mode switching to re-fetch explanation 6. Ensure mobile responsiveness (full-screen on small screens)
Start building
Checkpoint made
•
Free
Transitioned from Plan to Build mode

15 messages & 59 actions
Let me start building the Analyst Copilot feature. First, I'll read the existing components to understand the current structure:
Checkpoint made
Add analyst copilot feature to fraud monitoring dashboard
Worked for 8 minutes
Want users to get these changes? Republish this App.
Checkpoint made
•
Free
•
Publish
Published your App

1 action
this is my repo url i want to push this project in this git hub repo folder frontend https://github.com/sana0409-ai/Fraud-real-time-dashboard/tree/main/frontend


1 message & 4 actions
To push your project to the GitHub `frontend` folder, you'll need to connect your GitHub account and use the Git pane or shell. Here's what you can do: **Option 1: Use the Git Pane (Easier)** 1. Click on the **Git** icon in the left sidebar (version control) 2. Connect your GitHub account if not already connected 3. Link this Replit project to your repository **Option 2: Use Shell Commands** Since you want to push to a subfolder (`frontend`) in an existing repo, you'll need to: 1. First, generate a **GitHub Personal Access Token** (PAT) with repo permissions from GitHub Settings > Developer Settings > Personal Access Tokens 2. Store the token as a secret in Replit (I can request this from you) 3. Then run commands in the shell to add your files to the existing repo Would you like me to help you set this up? I'll need you to: 1. Create a GitHub Personal Access Token with `repo` permissions 2. Share it with me as a secret so we can push to your repository Let me know and I can guide you through the process!
Checkpoint made
Add a copilot feature to assist fraud analysts with transaction analysis
Worked for 49 seconds
my PAT is ready


4 messages & 5 actions
Please add your GitHub Personal Access Token as a secret called GITHUB_PAT. This will be stored securely and used to push your code to GitHub.
lets do this


2 messages & 10 actions
Let me try a different approach - I'll clone your target repository, copy the files into the frontend folder, and push:
Checkpoint made
Add a copilot feature to assist fraud analysts with transaction analysis
Worked for 1 minute
can you give me ready to paste readme file for my front end

Here's a ready-to-paste README for your frontend:

# Fraud Monitoring Dashboard
A real-time fraud monitoring dashboard built with React and TypeScript. The system displays live transaction data, KPI metrics, and provides AI-assisted fraud analysis through the Analyst Copilot feature.
## Features
- **Real-time Transaction Feed**: Live streaming of fraud detection events via WebSocket
- **KPI Dashboard**: Key metrics including transactions/min, alerts, high-risk percentage, and average latency
- **Analyst Actions**: Approve, Escalate, or Block transactions with one click
- **Analyst Copilot**: AI-assisted transaction analysis with evidence scoring and explanations
- **Risk Band Indicators**: Visual color-coded risk levels (LOW/MEDIUM/HIGH)
- **Dark Theme**: Modern dark UI optimized for analyst workflows
## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack React Query
- **Real-time**: WebSocket connection to backend
- **Routing**: Wouter
## Getting Started
### Prerequisites
- Node.js 18+
- npm or yarn
### Installation
```bash
npm install
Environment Variables
Create a .env file with:

VITE_BACKEND_WS_URL=wss://your-backend-url/ws
BACKEND_HTTP_URL=https://your-backend-url
BACKEND_WS_URL=wss://your-backend-url/ws
DATABASE_URL=postgresql://...
Development
npm run dev
The app runs on http://localhost:5000
Analyst Copilot Feature
The Analyst Copilot provides AI-assisted analysis for each transaction:

Transaction Summary: Risk band, decision, fraud probability, latency, source, device, payment type
Evidence Section: Top 3 risk indicators with confidence scores
Explanation: Contextual analysis in Basic or Analyst mode
Quick Actions: Approve, Escalate, or Block directly from the drawer
API Endpoints

Endpoint	Method	Description
/api/copilot/search	POST	Get evidence for a transaction
/api/copilot/explain	POST	Get AI explanation for a transaction
/api/analyst/action	POST	Submit analyst action (approve/escala
