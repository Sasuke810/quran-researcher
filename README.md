# Quran Researcher

A Next.js application for Quran study with AI-powered features, semantic search, and tafsir integration.

## Prerequisites

- **Docker Desktop** - [Download and install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Node.js 20+** (for local development without Docker)
- **Yarn** (package manager)

## Quick Start with Docker

### 1. Ensure Docker is Running

Make sure Docker Desktop is running on your machine. You can start it via:
- **macOS**: Open Docker Desktop from Applications
- **Command line**: `open -a Docker` (macOS)
- **Windows**: Start Docker Desktop from the Start menu
- **Linux**: `sudo service docker start`

Verify Docker is running:
```bash
docker info
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd quran.arabic.tech

# Copy environment file (if exists)
cp .env.example .env
```

### 3. Start All Services

```bash
# Build and start all containers (PostgreSQL + Next.js app)
docker-compose up -d --build
```

This will:
- Pull the `pgvector/pgvector:pg16` PostgreSQL image
- Build the Next.js application
- Run database migrations automatically
- Start the app on port **3000**
- Start PostgreSQL on port **5434**

### 4. Access the Application

- **Web App**: http://localhost:3000
- **PostgreSQL**: `localhost:5434`
  - Database: `quran` (or value from `DB_NAME`)
  - User: `app` (or value from `DB_USER`)
  - Password: `secret` (or value from `DB_PASSWORD`)

### 5. Check Status

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# View database logs only
docker-compose logs -f postgres
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DB_USER=app
DB_PASSWORD=secret
DB_NAME=quran
DB_PORT=5434

# Application Port
APP_PORT=3000

# API Keys (optional, for AI features)
OPENROUTER_API_KEY=your_openrouter_key
OPENAI_API_KEY=your_openai_key

# Node Environment
NODE_ENV=production
```

## Database Migrations

Migrations run automatically when the PostgreSQL container is first initialized. The migration system:

- Creates a `schema_migrations` table to track executed migrations
- Runs all migration files from `database/migrations/` in order
- Skips already-executed migrations on subsequent starts
- Includes Quran text data and surah information

To verify migrations:
```bash
docker exec quran-postgres psql -U app -d quran -c "SELECT id, name, executed_at FROM schema_migrations ORDER BY id;"
```

## Development Commands

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (Fresh Start)
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
docker-compose up -d --build
```

### Clean Start from Scratch
```bash
# Remove all containers and volumes
docker-compose down -v

# Remove orphan containers
docker ps -a --filter "name=quran" --format "{{.Names}}" | xargs docker rm -f

# Start fresh
docker-compose up -d --build
```

## Local Development (Without Docker)

If you prefer to run the app locally without Docker:

```bash
# Install dependencies
yarn install

# Start PostgreSQL separately (via Docker or local installation)
# Make sure it's running on port 5432 or update DB_PORT in .env

# Run migrations
yarn migrate

# Start development server
yarn dev
```

The app will be available at http://localhost:3000 (or port specified in package.json)


## Troubleshooting

### Docker daemon not running
```bash
# macOS
open -a Docker

# Windows
Start-Service docker

# Linux
sudo systemctl start docker

# Wait for Docker to start, then retry
docker-compose up -d
```

### Port already in use
If port 3000 or 5434 is already in use, modify the ports in `.env`:
```bash
APP_PORT=3001
DB_PORT=5435
```

### Build failures
```bash
# Clean Docker cache and rebuild
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Database connection issues
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```
