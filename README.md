# Law Firm SMS App

A comprehensive web application for the 24th Judicial Circuit Public Defender's Office in Alabama to manage client court appearances and send automated SMS reminders.

## Features

- **Public Homepage**: Rotating courthouse images and mission-focused content
- **Admin Dashboard**: Enhanced dashboard with courts, dockets, clients, and campaigns management
- **Courts Management**: Add, edit, and manage court information
- **Dockets Management**: Schedule dockets and assign clients
- **Clients Management**: Manage client information and docket assignments
- **SMS Campaigns**: Create and manage bulk SMS campaigns (when Twilio is configured)

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Next.js API Routes
- **Authentication**: Supabase Auth
- **Deployment**: Vercel Ready

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `env.example`)
4. Run the development server: `npm run dev`

## Deployment

See `VERCEL-DEPLOYMENT-GUIDE.md` for detailed deployment instructions.

## Documentation

- `PROGRESS-REPORT.md` - Complete project status
- `VERCEL-DEPLOYMENT-GUIDE.md` - Deployment guide
- `SETUP-INSTRUCTIONS.md` - Local development setup
