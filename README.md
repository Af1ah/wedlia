# My Studios

A modern web application for wedding photographers to create, manage, and share photo galleries with their clients. Built with Next.js 16, Firebase, and Cloudflare R2.

## Features

- **Studio Dashboard** - Manage galleries, upload photos, and track client activity
- **Client Galleries** - Password-protected galleries for secure photo sharing
- **Google Drive Integration** - Import photos directly from Google Drive
- **Image Optimization** - Automatic image processing and thumbnail generation
- **Public Portfolios** - Customizable portfolio pages with subdomain support
- **Admin Panel** - Platform administration with usage statistics
- **Authentication** - Secure login with NextAuth.js and Firebase

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: NextAuth.js + Firebase Auth
- **Storage**: Cloudflare R2
- **Image Processing**: Sharp
- **External APIs**: Google Drive API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Firebase project
- Cloudflare R2 bucket
- Google Cloud project (for Drive integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/my-studios.git
cd my-studios

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ACCOUNT_ID=
R2_PUBLIC_URL=

# Google Drive
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Running the App

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
app/
├── (admin)/        # Admin dashboard pages
├── (auth)/         # Login and signup pages
├── (studio)/       # Studio dashboard and gallery management
├── api/            # API routes
│   ├── auth/       # Authentication endpoints
│   ├── drive/      # Google Drive integration
│   └── galleries/  # Gallery CRUD operations
└── p/              # Public portfolio pages

lib/                # Utility functions and integrations
contexts/           # React context providers
types/              # TypeScript type definitions
constants/          # Application constants
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm seed:admin` | Seed admin user |

## License

MIT
