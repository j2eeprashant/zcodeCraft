# Online IDE Application

## Overview

This is a full-stack web-based IDE (Integrated Development Environment) built with React, Express, and PostgreSQL. The application provides a code editor interface with file management, project organization, and real-time code execution capabilities through WebSocket communication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Code Editor**: Monaco Editor (loaded via CDN) for syntax highlighting and code editing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **WebSocket**: ws library for real-time communication
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **Process Management**: Child processes for code execution

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Fallback Storage**: In-memory storage implementation for development

## Key Components

### Database Schema
- **Projects Table**: Stores project metadata (name, description, language, timestamps)
- **Files Table**: Manages file/folder structure with hierarchical relationships
- **Users Table**: Basic user authentication (username/password)

### Frontend Components
- **IDE Page**: Main application interface with layout management
- **File Explorer**: Tree-view file/folder navigation with CRUD operations
- **Monaco Editor**: Code editing with syntax highlighting and auto-save
- **Console Panel**: Multi-tab output display (console, debug, problems, output)

### Backend Services
- **Storage Interface**: Abstracted storage layer supporting both database and in-memory implementations
- **WebSocket Server**: Real-time communication for code execution and live updates
- **REST API**: CRUD operations for projects and files

## Data Flow

1. **Project Loading**: Application fetches projects and files via REST API
2. **File Editing**: Monaco Editor updates trigger auto-save mutations
3. **Code Execution**: WebSocket messages trigger server-side process spawning
4. **Real-time Updates**: WebSocket broadcasts execution results to console panel
5. **File Operations**: Create/update/delete operations sync with database

## External Dependencies

### Core Runtime
- **Database**: Neon PostgreSQL serverless database
- **CDN Services**: Monaco Editor loaded from jsdelivr CDN
- **WebSocket**: Native browser WebSocket API

### Development Tools
- **Replit Integration**: Replit-specific plugins for development environment
- **Build Tools**: esbuild for server bundling, Vite for client bundling

### UI Libraries
- **Radix UI**: Comprehensive primitive component library
- **Lucide React**: Icon library for consistent iconography
- **TanStack Query**: Server state synchronization and caching

## Deployment Strategy

### Development Mode
- **Client**: Vite dev server with HMR and error overlay
- **Server**: tsx for TypeScript execution with file watching
- **Database**: Development connection to Neon database

### Production Build
- **Client**: Vite build to static assets in `dist/public`
- **Server**: esbuild bundle to `dist/index.js` as ESM module
- **Deployment**: Replit autoscale deployment target
- **Port Configuration**: Internal port 5000 mapped to external port 80

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **Static Assets**: Express serves built client assets in production

## Changelog
- June 26, 2025. Initial setup
- June 26, 2025. Fixed project creation system - resolved file creation validation errors and implemented proper cache invalidation for file display
- June 26, 2025. Added project selector UI for switching between projects and viewing their files
- June 26, 2025. Enhanced file creation/editing functionality with auto-save and proper Monaco Editor integration

## Recent Changes
✓ Project creation now works correctly with all framework templates
✓ Files are properly created and displayed after project creation
✓ Added project selector dropdown in sidebar for easy project switching
✓ File creation and folder creation functionality implemented
✓ Monaco Editor properly integrated with auto-save functionality
✓ Fixed cache invalidation issues that prevented files from showing

## User Preferences

Preferred communication style: Simple, everyday language.