# Safar Mitra - Backend API

A Node.js/Express backend for the Safar Mitra taxi/car rental platform.

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Firebase Project (for phone authentication)
- AWS S3 Bucket (for file storage)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd safarmitra-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your credentials
```

### Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE safarmitra;"

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Run Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

Server will start at `http://localhost:3000`

---

## 📁 Project Structure

```
safarmitra-backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route handlers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validators
│   └── app.js           # Express app setup
├── migrations/          # Database migrations
├── seeders/             # Database seeders
├── docs/                # Documentation
├── server.js            # Entry point
└── package.json
```

---

## 🔌 API Endpoints (8 total)

### Auth (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login/Register |
| POST | `/api/v1/auth/select-role` | Select role |
| POST | `/api/v1/auth/logout` | Logout |

### User (3 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get my profile |
| PUT | `/api/v1/users/me` | Update my profile |
| GET | `/api/v1/users/profile/:id` | Get user by ID |

### KYC (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/kyc/status` | Get KYC status |
| POST | `/api/v1/kyc/submit` | Submit/Update KYC |

📖 **Full API Documentation:** [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## 🗄️ Database

### Tables
- `roles` - User roles (DRIVER, OPERATOR, ADMIN)
- `users` - User accounts
- `user_identity` - KYC documents
- `cars` - Car listings
- `car_images` - Car images
- `booking_requests` - Booking requests

### Commands
```bash
npm run db:migrate        # Run migrations
npm run db:migrate:undo   # Undo last migration
npm run db:seed           # Run seeders
npm run db:seed:undo      # Undo seeders
```

---

## ⚙️ Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=safarmitra
DB_USER=postgres
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=
```

---

## 🔐 Authentication Flow

1. Flutter app handles phone OTP via Firebase
2. Flutter sends Firebase ID Token + FCM Token to backend
3. Backend verifies token, extracts phone, issues JWT
4. JWT used for all subsequent requests

---

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server
npm run db:migrate # Run database migrations
npm run db:seed    # Run database seeders
```

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication:** Firebase + JWT
- **File Storage:** AWS S3
- **Validation:** Joi

---

## 📄 License

ISC
