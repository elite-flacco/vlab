# VLab - AI-Powered Vibe Coder Workspace

VLab is a minimalist workspace platform purpose built for vibe coders. It provides an integrated environment for project ideation, planning, and development tracking.

## Features

### Core Modules
- **PRD (Product Requirements Documents)** - Create and manage detailed product specifications with AI assistance
- **Roadmap** - Visual project planning with phase management
- **Tasks** - Minimalistic task management with priorities, and progress tracking
- **Scratchpad** - Flexible note-taking and idea capture with tagging and organization
- **Prompts** - AI prompt library for consistent and effective AI interactions

### Key Features
- **AI-Powered Kick-off Flow** - Transform ideas into structured workspaces with AI assistance
- **Version Control for PRDs** - Complete version history, comparison
- **Community Hub** - Share tools, prompts, and knowledge with other vibe coders

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **Drag & Drop**: react-beautiful-dnd
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd viber
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

4. Run database migrations:
```bash
# Apply the migrations in your Supabase dashboard or using the CLI
```

5. Start the development server:
```bash
npm run dev
```

## Database Schema

### Core Tables
- `profiles` - User profile information
- `projects` - Project containers
- `prds` - Product Requirements Documents with versioning
- `prd_versions` - Complete version history for PRDs
- `tasks` - Task management with dependencies and priorities
- `roadmap_items` - Project roadmap and milestone tracking
- `scratchpad_notes` - Flexible note-taking system
- `prompts` - AI prompt library and templates
- `secrets` - Encrypted storage for sensitive data

### Version Control System

The PRD versioning system provides:
- **Automatic Version Tracking** - Every PRD update creates a new version
- **Complete History** - Full content and metadata for each version
- **Version Comparison** - Side-by-side comparison of any two versions
- **Change Descriptions** - Optional descriptions for each version update

#### Database Functions
- `create_prd_version()` - Automatically creates version snapshots
- `get_prd_version_comparison()` - Returns comparison data for two versions

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Kickoff/        # AI-powered project setup
│   ├── Layout/         # App layout components
│   ├── PRD/            # PRD-specific components (including versioning)
│   ├── Projects/       # Project management components
│   ├── Workspace/      # Workspace module components
│   └── common/         # Shared utility components
├── lib/                # Utility libraries
│   ├── openai.ts       # OpenAI API integration
│   ├── supabase.ts     # Database operations
│   └── utils.ts        # General utilities
├── pages/              # Main application pages
│   ├── modules/        # Individual module detail views
│   ├── Community.tsx   # Community hub
│   ├── Dashboard.tsx   # User dashboard
│   ├── KickoffFlow.tsx # AI-powered project setup
│   ├── Workspace.tsx   # Main workspace view
│   └── Settings.tsx    # User settings
├── stores/             # State management
│   ├── authStore.ts    # Authentication state
│   └── projectStore.ts # Project management state
└── types/              # TypeScript type definitions
```

## API Integration

### OpenAI Integration
VLab integrates with OpenAI for:
- Idea refinement and PRD generation
- Roadmap creation from PRDs
- Task breakdown from roadmaps
- Prompt suggestions and optimization

### Supabase Integration
- Real-time data synchronization
- Row Level Security for multi-tenant data isolation
- Automatic user profile creation
- Encrypted secret storage

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

## Deployment

The application is designed to be deployed on modern hosting platforms:

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider
3. Ensure environment variables are configured in your hosting environment
4. Set up your Supabase database with the provided migrations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Join our community discussions

---

Built with ❤️ for the vibe coder community.