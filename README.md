# VLab - AI-Powered Vibe Coder Workspace

VLab is a minimalist workspace platform purpose built for vibe coders. It provides an integrated environment for project ideation, planning, and development tracking.

## Features

### Core Modules
- **PRD (Product Requirements Documents)** - Create and manage detailed product specifications with AI assistance and full version control
- **Roadmap** - Visual project planning with phase management and milestone tracking
- **Tasks** - Minimalistic task management with priorities, progress tracking, and GitHub issue creation
- **Scratchpad** - Flexible note-taking and idea capture with tagging, search, and organization
- **Prompts** - AI prompt library for consistent and effective AI interactions with categorization
- **Design** - Design documentation, asset management, and AI-powered design task generation
- **Deployment** - Deployment checklists, configuration tracking, and platform-specific templates

### Key Features
- **AI-Powered Kick-off Flow** - Transform ideas into structured workspaces with AI assistance
- **Version Control for PRDs** - Complete version history, side-by-side comparison, and change tracking
- **GitHub Integration** - Convert tasks directly into GitHub repository issues with OAuth authentication
- **Community Hub** - Share tools, prompts, and knowledge with other vibe coders
- **Light/Dark Mode** - Comprehensive theme system with automatic persistence
- **Global Scratchpad** - Cross-project note-taking accessible from anywhere
- **Anonymous User Support** - Full functionality without registration, with seamless account claiming

### Community Features

#### Posts & Discussions
- **Create and Share** - Share your tips, tricks, and experiences with the community
- **Rich Text Formatting** - Use Markdown to format your posts with headers, lists, bold/italic text, and links
- **Image Support** - Include images in your posts to better illustrate your points
- **Tagging System** - Add tags to make your posts more discoverable

#### Engagement Tools
- **Voting System** - Upvote/downvote posts and comments to highlight valuable content
- **Comments & Replies** - Engage in threaded discussions with other community members
- **Save Posts** - Bookmark posts to easily find them later

#### Discovery & Filtering
- **Advanced Search** - Find relevant content with powerful search capabilities
- **Filter by Tools** - Browse content specific to tools like Bolt, Loveable, Replit, and V0
- **Category Filtering** - Filter by tip categories including Prompt Tricks, Integrations, Authentication, and more
- **Tag Filtering** - Discover content through topic-specific tags
- **Sorting Options** - Sort by newest, most popular, or trending content

#### User Profiles
- **Personalized Feed** - View your contributed and saved posts
- **Activity Tracking** - Keep track of your interactions and contributions
- **Profile Customization** - Personalize your community presence

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system (light/dark themes with neon accents)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with anonymous user support
- **Icons**: Lucide React
- **State Management**: Zustand with persistence
- **Form Handling**: React Hook Form
- **Drag & Drop**: react-beautiful-dnd
- **Date Handling**: date-fns
- **Markdown Rendering**: react-markdown

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vlab
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

# Optional - for GitHub integration
VITE_GITHUB_CLIENT_ID=your_github_oauth_app_client_id_here
```

### GitHub Integration Setup

To enable GitHub integration for task-to-issue creation:

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set the authorization callback URL to `{your-domain}/auth/github/callback`
3. Copy the Client ID to `VITE_GITHUB_CLIENT_ID` environment variable
4. Configure `GITHUB_CLIENT_SECRET` in your Supabase Edge Functions environment
5. Required OAuth scopes: `repo`, `user:email`

6. Run database migrations:
```bash
# Apply the migrations in your Supabase dashboard or using the CLI
```

7. Start the development server:
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
- `secrets` - Encrypted storage for sensitive data (values never retrieved in SELECT queries)
- `deployment_items` - Deployment checklists and configuration tracking
- `design_items` - Design documentation and asset management
- `github_tokens` - Encrypted GitHub OAuth tokens for user authentication
- `github_repositories` - User's connected GitHub repositories for issue creation
- `posts`, `comments`, `votes` - Community features for social interaction

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
│   ├── GitHub/         # GitHub integration components
│   ├── Kickoff/        # AI-powered project setup
│   ├── Layout/         # App layout components
│   ├── PRD/            # PRD-specific components (including versioning)
│   ├── Projects/       # Project management components
│   ├── Workspace/      # Workspace module components
│   └── common/         # Shared utility components
├── lib/                # Utility libraries
│   ├── github.ts       # GitHub API integration and OAuth
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
│   ├── projectStore.ts # Project management state
│   └── themeStore.ts   # Theme management state
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
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks
- `npm run server` - Run backend Express server only (for API proxying)
- `npm run dev:full` - Run both frontend dev server and backend server concurrently

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