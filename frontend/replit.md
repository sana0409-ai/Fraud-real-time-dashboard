# Fraud Monitoring Dashboard

## Overview

A real-time fraud monitoring dashboard built as a single-page web application. The system displays live transaction data, KPI metrics, and provides fraud prediction testing capabilities. It connects to a remote backend via WebSocket for streaming updates and HTTP for prediction requests.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme configuration and CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express server
- **API Pattern**: Express acts as a proxy layer to a remote backend service
- **Real-time**: WebSocket connection proxied to remote `BACKEND_WS_URL`
- **Build**: esbuild for server bundling, Vite for client bundling

### Data Flow
- WebSocket messages come in two types: `snapshot` (initial state) and `tick` (incremental updates)
- KPIs and fraud events are streamed in real-time from the remote backend
- Prediction requests are proxied through the Express server to the remote backend

### Database
- PostgreSQL with Drizzle ORM for schema definition
- Schema includes `fraudEvents` table for event persistence
- Database connection via `DATABASE_URL` environment variable
- Migrations stored in `/migrations` directory

### Key Design Patterns
- **Shared schemas**: Zod schemas in `/shared/schema.ts` validate both client and server data
- **Route definitions**: API routes defined in `/shared/routes.ts` with input/output schemas
- **Component composition**: UI built from reusable shadcn components in `/client/src/components/ui/`

### Analyst Copilot Feature
- **Right-side drawer**: Slides in from the right when clicking the sparkle icon on any transaction row
- **Transaction Summary**: Displays real event data (risk band, decision, fraud probability, latency, source, device, payment type, timestamp)
- **Evidence Section**: Shows top 3 risk indicators with scores from `/api/copilot/search`
- **Explanation Section**: AI-generated explanation from `/api/copilot/explain` with Basic/Analyst mode toggle
- **Action Buttons**: Approve/Escalate/Block actions that integrate with existing analyst action handler
- **Responsive**: Full-width on mobile, 360-420px on desktop
- **Styling**: Dark theme with gradient background and teal accent border

## External Dependencies

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `BACKEND_HTTP_URL` - Remote backend HTTP endpoint for prediction API
- `BACKEND_WS_URL` - Remote backend WebSocket endpoint for real-time data (client-side: `VITE_BACKEND_WS_URL`)

### Third-Party Services
- **Remote Fraud Detection Backend**: External ML service providing `/predict` endpoint and WebSocket streaming
- **PostgreSQL Database**: Primary data store provisioned via Replit

### Key NPM Dependencies
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Async state management
- `recharts` - Data visualization for dashboard charts
- `ws` - WebSocket server support
- `zod` - Runtime schema validation