# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production 
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

### Development Environment  
- `npm run dev:full` - Run both frontend dev server and backend server concurrently
- `npm run server` - Run backend Express server only (for API proxying)

### Database Development
- Supabase migrations are in `supabase/migrations/` 
- Database functions for anonymous account claiming: `transfer_anonymous_data()`, `claim_anonymous_account()`
- Apply migrations through Supabase Dashboard or CLI

## Project Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system (dark theme with neon accents)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with comprehensive validation
- **State Management**: Zustand stores (`authStore`, `projectStore`)
- **Routing**: React Router DOM with protected routes
- **UI**: Lucide React icons, react-beautiful-dnd for drag & drop

### Core Application Structure

#### Authentication & Routing
- Unauthenticated users see landing page (`Landing.tsx`)
- Authenticated users access the main app through `AppLayout.tsx`
- Return URL handling for post-login redirects stored in sessionStorage

#### Main Application Flow
1. **Dashboard** (`/`) - User project overview with active/archived project management
2. **Community** (`/community`) - Social features, posts, and tips sharing with voting/commenting
3. **Kickoff Flow** (`/kickoff/:projectId`) - AI-powered project setup generating PRDs, roadmaps, and tasks
4. **Workspace** (`/workspace/:projectId`) - Main project workspace with modular grid layout
5. **Settings** (`/settings`) - User profile management and account claiming for anonymous users

#### Workspace Module System
The workspace uses a grid-based layout (12 columns, 8 rows, 16px gap) with modular components accessed via nested routes:
- `PRD` (`/workspace/:projectId/prd`) - Product Requirements Documents with full version control and comparison
- `Roadmap` (`/workspace/:projectId/roadmap`) - Project roadmap and milestone tracking with phase management
- `Tasks` (`/workspace/:projectId/tasks`) - Task management with drag & drop priority ordering
- `Scratchpad` (`/workspace/:projectId/scratchpad`) - Flexible note-taking with tagging and search
- `Prompts` (`/workspace/:projectId/prompts`) - AI prompt library and templates with categories
- `Secrets` (`/workspace/:projectId/secrets`) - Encrypted credential storage (values never retrieved in SELECT queries)
- `Design` (`/workspace/:projectId/design`) - Design documentation and assets
- `Deployment` (`/workspace/:projectId/deployment`) - Deployment checklists and configurations

### Database Layer & API Integration

#### Supabase Integration (`src/lib/supabase.ts`)
- Comprehensive timeout handling (10 second default)
- Performance timing and logging for all operations
- Structured helpers for auth, projects, and all module data
- PRD versioning system with comparison functionality

#### Key Database Tables
- `profiles` - User profile information with anonymous account support
- `projects` - Project containers with workspace layouts and active/archived states
- `prds` / `prd_versions` - PRD documents with full version control and comparison functionality
- `tasks`, `roadmap_items`, `prompts`, `scratchpad_notes` - Module-specific data with project relationships
- `secrets` - Encrypted storage (values not retrieved in SELECT queries, server-side decryption only)
- `deployment_items` - Deployment checklists and configuration tracking
- Community tables: `posts`, `comments`, `votes` for social features

### State Management Architecture

#### Auth Store (`src/stores/authStore.ts`)
- Comprehensive email/password validation with regex patterns
- Supabase error mapping to user-friendly messages with detailed client-side validation
- Handles email confirmation flow and session management
- Anonymous user support with account claiming functionality
- Data transfer system for converting anonymous users to registered accounts
- Auto-clears project data on logout and handles invalid session cleanup

#### Project Store (`src/stores/projectStore.ts`)
- Manages active/archived project separation with proper CRUD operations
- Default workspace layout with 5 core modules (PRD, Roadmap, Tasks, Deployment, Scratchpad)
- Grid-based layout system (12 columns, 8 rows, 16px gap) with customizable module positioning
- Real-time state synchronization with database and automatic error handling
- Project lifecycle management (create, update, archive, restore, permanent delete)

### AI Integration
- OpenAI integration for project ideation and content generation
- AI-powered kickoff flow for transforming ideas into structured workspaces (PRD → Roadmap → Tasks)
- Supabase Edge Functions handle API proxying (`supabase/functions/`)
- Backend Express server provides additional AI endpoints and CORS handling

### Security Implementation
- Row Level Security (RLS) on all tables
- CSP implementation documented in `docs/CSP_IMPLEMENTATION.md`
- Comprehensive security audit report in `docs/SECURITY_AUDIT_REPORT.md`
- Encrypted secrets storage with server-side decryption only

### Error Handling & Performance
- Global ErrorBoundary wrapping the application (`src/components/ErrorBoundary/ErrorBoundary.tsx`)
- Timeout wrappers for all database operations (10 second default via `withTimeout` utility)
- Performance timing logs for debugging with `withTiming` utility
- Comprehensive validation on both client and server sides
- Return URL handling for seamless post-authentication redirects

## Development Notes

### Component Organization
- `src/components/` - Organized by feature area (Auth, Community, Kickoff, etc.)
- `src/pages/` - Top-level route components with nested module views
- `src/lib/` - Utility libraries including API integrations
- Custom design system with neon green accent color (`#00ff9f`)

### Environment Variables Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `VITE_GA_MEASUREMENT_ID` - Google Analytics measurement ID for page tracking (optional)

### Testing & Quality
- ESLint configuration for code quality checks (`npm run lint`)
- TypeScript for type safety across all components
- Comprehensive input validation and error handling throughout the application
- No formal test suite currently implemented

### Key Development Patterns
- All database operations wrapped with timeout and timing utilities
- Modular component architecture with feature-based organization  
- Comprehensive error boundary and state management
- Anonymous user experience with seamless account claiming
- Real-time data synchronization with optimistic updates