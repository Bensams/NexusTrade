# NexusTrade

A full-stack e-commerce marketplace built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- 🔐 Authentication (Email/Password + Google OAuth)
- 🛒 Buy/Sell Listings Management
- 💳 Payment Processing with Receipt Upload
- 📦 Order Management System
- 💰 Seller Wallet & Withdrawal System
- 🔔 Comprehensive Notification System
- 💬 Real-time Messaging
- ⭐ Review System
- 👨‍💼 Admin Dashboard

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
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

4. **Build and start containers**
   ```bash
   docker-compose up -d --build
   ```

5. **Run database migrations**
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
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild containers
docker-compose up -d --build

# Access app container shell
docker-compose exec app sh

# Run Prisma commands
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate
```

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
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   └── ...                # Pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities (auth, db, notifications)
│   └── types/                 # TypeScript types
├── public/
│   └── uploads/               # User uploaded files
├── docker-compose.yml         # Docker services configuration
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

### Admin
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders` - Approve/reject orders
- `GET /api/admin/withdrawals` - Get all withdrawals
- `PATCH /api/admin/withdrawals` - Process withdrawals

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

