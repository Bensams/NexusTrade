# NexusTrade

A full-stack e-commerce marketplace built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### Core Features
- 🔐 **Authentication** - Email/Password + Google OAuth
- 🛒 **Listings Management** - Buy & sell items/services
- 💳 **Payment Processing** - Receipt upload with admin approval
- 📦 **Order Management** - Full order lifecycle tracking
- 💰 **Wallet System** - Cash-in, withdrawals, and balance management
- 💵 **Cash-In Requests** - User deposits with admin approval workflow
- 🔔 **Notification System** - Real-time notifications for all events
- 💬 **Real-time Messaging** - Socket.IO powered chat with transaction context
- 🔍 **Advanced Search** - Filter by game, price range, and listing type
- 👤 **User Profiles** - Public seller profiles with reviews and listings
- ⭐ **Review System** - Rate and review completed transactions
- 🎫 **Support Center** - FAQ and help resources

### Admin & Moderation
- 👨‍💼 **Admin Dashboard** - Comprehensive management panel
- 🛡️ **Role-Based Access Control (RBAC)** - Super Admin, Admin, Moderator, and User roles
- 🚫 **User Moderation** - Ban/unban users with IP and device fingerprint tracking
- 📝 **Listing Moderation** - Hide/show listings, content policing
- 📊 **Audit Logging** - Track all user actions for compliance
- 📈 **Analytics Dashboard** - Site visits, user stats, and transaction metrics
- ⚙️ **Platform Settings** - Configure transaction fees, social links, and support info

### CMS (Content Management)
- 🎮 **Game Management** - Add/edit/remove supported games
- 🏷️ **Item Type Management** - Configure listing categories
- 🔗 **Site Settings** - Social links (Discord, Twitter, Instagram) and contact info

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 16+ (if running locally without Docker)

## Getting Started

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd NexusTrade
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**
   Edit `.env` file with your values:
   ```env
   DATABASE_URL=postgresql://nexustrade:nexustrade123@db:5432/nexustrade?schema=public
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Run the system**

   **For Production (Deploying):**
   Run your standard command. It will use the new, faster Dockerfile.
   ```bash
   docker compose up --build
   ```

   **For Development (Coding):**
   Run this command. It will start the Next.js dev server with Hot Reloading.
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

5. **Run database migrations** (First time setup)
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

6. **Generate Prisma Client** (if needed)
   ```bash
   docker-compose exec app npx prisma generate
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Database: localhost:5432

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local database URL and secrets
   ```

3. **Set up database**
   ```bash
   # Start PostgreSQL (or use Docker for just the DB)
   docker-compose up -d db
   
   # Run migrations
   npx prisma migrate dev
   
   # Generate Prisma Client
   npx prisma generate
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000

## Docker Commands

```bash
# Production: Build and start containers (uses optimized Dockerfile)
docker compose up --build

# Development: Start with Hot Reloading (uses docker-compose.dev.yml)
docker compose -f docker-compose.dev.yml up

# Stop all services
docker-compose down

# View logs
docker-compose logs -f app

# Access app container shell
docker-compose exec app sh

# Run Prisma commands
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate
```

## Development Workflow

For the fastest development experience with hot reloading, use the database in Docker while running the app locally:

```bash
# Start development (hot reload) - runs app locally with Docker database
npm run dev

# When ready to test production build
docker-compose up --build -d

# Stop Docker app but keep database running
docker-compose stop app

# Stop everything (including database)
docker-compose down

# View database with Prisma Studio GUI
npx prisma studio
```

### Recommended Development Flow

| Phase | Command | Description |
|-------|---------|-------------|
| **Daily Development** | `npm run dev` | Fast hot reload, instant changes |
| **Database Only** | `docker-compose up -d db` | Just PostgreSQL in Docker |
| **Production Test** | `docker-compose up --build -d` | Full containerized build |
| **Deployment** | `docker-compose up --build -d` | Same as production test |


## Database Management

### Run Migrations
```bash
# With Docker
docker-compose exec app npx prisma migrate deploy

# Local development
npx prisma migrate dev
```

### Prisma Studio (Database GUI)
```bash
# With Docker
docker-compose exec app npx prisma studio

# Local development
npx prisma studio
```

## Project Structure

```
NexusTrade/
├── prisma/
│   └── schema.prisma          # Database schema
├── pages/
│   └── api/
│       └── socketio.ts        # Socket.IO server endpoint
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── messages/          # Messaging pages
│   │   ├── wallet/            # Wallet management
│   │   ├── support/           # Support center
│   │   ├── profile/           # User profiles
│   │   └── ...                # Other pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities (auth, db, socket, wallet)
│   └── types/                 # TypeScript types
├── public/
│   └── uploads/               # User uploaded files
├── docker-compose.yml         # Production Docker config
├── docker-compose.dev.yml     # Development Docker config
├── Dockerfile                 # App container definition
└── package.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `NEXTAUTH_SECRET` | Secret key for JWT signing | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `NODE_ENV` | Environment (development/production) | Yes |

## Notification System

The application includes a comprehensive notification system covering:

### Buyer Notifications
- Payment approved/declined
- Order delivered
- Order completed

### Seller Notifications
- New order received
- Payout approved/rejected

### Admin Notifications
- Payment review required
- Delivery review required
- Payout request submitted

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Listings
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create listing
- `GET /api/listings/[id]` - Get listing details
- `GET /api/listings/my` - Get user's listings

### Orders
- `GET /api/orders` - Get user's orders (buyer)
- `POST /api/orders` - Create order
- `GET /api/orders/seller` - Get seller's orders

### Payments
- `POST /api/payments/upload` - Upload payment receipt
- `POST /api/payments/delivery` - Upload delivery proof

### Notifications
- `GET /api/notifications` - Get user's notifications
- `PATCH /api/notifications` - Mark notifications as read

### Admin - Orders & Finance
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders` - Approve/reject orders
- `GET /api/admin/withdrawals` - Get all withdrawals
- `PATCH /api/admin/withdrawals` - Process withdrawals
- `GET /api/admin/cashin` - Get pending cash-in requests
- `PATCH /api/admin/cashin` - Approve/reject cash-in requests

### Admin - User Management
- `GET /api/admin/users` - List all users with filters
- `PATCH /api/admin/users` - Ban/unban users, update roles
- `GET /api/admin/users/[id]` - Get user details

### Admin - Content Management
- `GET/POST /api/admin/games` - Manage supported games
- `PATCH/DELETE /api/admin/games/[id]` - Update/delete games
- `GET/POST /api/admin/item-types` - Manage item categories
- `PATCH/DELETE /api/admin/item-types/[id]` - Update/delete item types
- `GET/PATCH /api/admin/listings/[id]` - Moderate listings (ban/unban)

### Admin - Settings & Analytics
- `GET/PATCH /api/admin/settings` - Platform fee configuration
- `GET/PATCH /api/admin/site-settings` - Social links and contact info
- `GET /api/admin/stats` - Dashboard analytics and metrics
- `GET /api/admin/audit-logs` - User activity audit logs

### Public Configuration
- `GET /api/games` - Get active games list
- `GET /api/item-types` - Get active item types
- `GET /api/site-settings` - Get public site settings
- `GET /api/platform-fee` - Get current platform fee
- `GET /api/check-ban` - Check if user is banned
- `POST /api/track-visit` - Track site visits

### Wallet
- `GET /api/wallet/balance` - Get user wallet balance
- `POST /api/wallet/cashin` - Submit cash-in request
- `GET /api/wallet/transactions` - Get transaction history

### Messages
- `GET /api/messages/unread-count` - Get unread message count
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/[id]` - Get conversation messages

### Users
- `GET /api/users/[id]` - Get user public profile

### Support
- `GET /api/support/tickets` - Get user support tickets
- `POST /api/support/tickets` - Create support ticket

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on GitHub.

