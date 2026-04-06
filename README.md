# Zorvyn — Financial Management API

A secure, role-based financial management REST API built with **Node.js**, **Express 5**, **TypeScript**, **Prisma**, and **PostgreSQL**.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| Auth | JWT (access + refresh tokens via HTTP-only cookies) |
| Validation | Zod |
| Docs | Swagger / OpenAPI 3.0 |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database (local or hosted)

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd Zorvyn

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# 4. Run Prisma migrations & generate client
npx prisma migrate dev
npx prisma generate

# 5. Start the development server
npm run dev
```

The server starts at **http://localhost:3000**.  
API documentation is available at **http://localhost:3000/api/docs**.

---

## Project Structure

```
src/
├── config/          # Swagger/OpenAPI spec
├── controllers/     # Request handlers (business logic)
├── lib/             # Prisma client singleton
├── middlewares/      # Auth, validation, error handling
├── routes/          # Route declarations (thin)
├── schemas/         # Zod validation schemas
├── utils/           # Cookie helpers
└── index.ts         # App bootstrap & middleware wiring
```

**Design philosophy:** Routes are kept thin — they only declare endpoints and wire up middlewares. Business logic lives in controllers, and validation schemas are defined separately with Zod.

---

## Authentication

The API uses a **two-cookie JWT strategy**:

| Cookie | Lifetime | Purpose |
|---|---|---|
| `accessToken` | 10 minutes | Carries user identity & role for fast auth |
| `refreshToken` | 7 days | Used to silently rotate expired access tokens |

Both cookies are **HTTP-only**, **Strict SameSite**, and **Secure in production**.

**How it works:**
1. On login/register, both cookies are set automatically.
2. When the access token expires, the `requireAuth` middleware transparently uses the refresh token to issue a new pair (**token rotation**).
3. Refresh tokens are stored in the database — logging out instantly revokes the session.
4. If the refresh token is also expired or revoked, the user must log in again.

---

## Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| **ADMIN** | Full access — manage users, create/update/delete records, view dashboard |
| **ANALYST** | Read-only — view records and dashboard analytics |
| **VIEWER** | Minimal — authenticated but no access to protected resources |

New users default to `VIEWER`. An admin can upgrade roles via `PUT /api/users/:id/role`.

> **Note:** During registration, any user can self-assign a role (including `ADMIN`) by passing the `role` field in the request body. This is intentional for ease of testing and evaluation. In a production system, self-registration would be restricted to `VIEWER`, and only existing admins could promote users.

---

## API Endpoints

### Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Server health check |

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Log in (sets auth cookies) |
| POST | `/api/auth/logout` | — | Log out (revokes refresh token) |

### Users (Admin only)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List all users (paginated) |
| PUT | `/api/users/:id/role` | Admin | Update a user's role |
| PUT | `/api/users/:id/status` | Admin | Activate / deactivate a user |

### Financial Records
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/records` | Analyst, Admin | List records (paginated, filterable by type & category) |
| GET | `/api/records/:id` | Analyst, Admin | Get a single record |
| POST | `/api/records` | Admin | Create a new record |
| PUT | `/api/records/:id` | Admin | Update a record |
| PATCH | `/api/records/:id` | Admin | Soft-delete a record |

### Dashboard Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Analyst, Admin | Total income, expenses, net balance |
| GET | `/api/dashboard/category-totals` | Analyst, Admin | Totals grouped by category & type |
| GET | `/api/dashboard/trends` | Analyst, Admin | Monthly income vs. expense trends |

> **Interactive docs:** Visit `/api/docs` for a full Swagger UI where you can explore and test every endpoint.
>
> **Postman collection:** Import the `zorvyn-postman-collection.json` file included in this repository to test the endpoints in Postman.

---

## Assumptions & Design Decisions

| Decision | Rationale |
|---|---|
| **Cookie-based auth** over Bearer tokens | More secure for browser-based clients — HTTP-only cookies are immune to XSS token theft |
| **Token rotation** on refresh | Limits the blast radius of a stolen refresh token — each token is single-use |
| **DB-backed refresh tokens** | Enables instant session revocation (logout invalidates the token server-side) |
| **Soft deletes** for financial records | Financial data should never be permanently lost — `deletedAt` preserves audit history |
| **Pagination capped at 100** | Prevents clients from requesting excessively large pages that could slow the database |
| **Rate limiting** (50 req/min) | Basic protection against brute-force and abuse |
| **Zod for validation** | Provides type-safe runtime validation with excellent error messages — schemas are colocated and reusable |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with auto-reload (nodemon + tsx) |
| `npm start` | Start production server (tsx) |

---

## Environment Variables

See [`.env.example`](./.env.example) for the full template.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ACCESS_JWT_SECRET` | ✅ | Secret for signing access tokens |
| `REFRESH_JWT_SECRET` | ✅ | Secret for signing refresh tokens |
| `PORT` | — | Server port (default: 3000) |
| `NODE_ENV` | — | `development` or `production` |
