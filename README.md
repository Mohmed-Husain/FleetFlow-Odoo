# 🚛 FleetFlow — Modular Fleet & Logistics Management System

FleetFlow is a full-stack fleet management application built for dispatchers, fleet managers, and admins to track vehicles, drivers, trips, maintenance, expenses, and real-time analytics — all from a single dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Authentication & Roles](#authentication--roles)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [License](#license)

---

## Features

| Module | Capabilities |
|--------|-------------|
| **Vehicle Registry** | Add, edit, filter, and sort fleet vehicles by status, type, make, and fuel type |
| **Trip Dispatcher** | Create trips, assign vehicles & drivers, track origin → destination, view statuses |
| **Maintenance Logs** | Schedule and track service logs per vehicle with cost tracking |
| **Expense Tracker** | Log trip-related expenses (fuel, tolls, fines, parking) with category filters |
| **Driver Performance** | View driver stats — completion rate, safety score, complaints, license status |
| **Analytics Dashboard** | Real-time KPIs, fuel efficiency trends, top costliest vehicles, monthly financials |
| **Role-Based Auth** | JWT-based login/register with 5 user roles and route-level protection |

---

## Tech Stack

### Frontend
- **Next.js 16.1.6** (App Router) with **React 19.2**
- **Tailwind CSS 4** for styling
- **Recharts 3.7** for data visualization (line charts, bar charts)
- Custom dark theme UI inspired by modern dashboards

### Backend
- **FastAPI** with async route handlers
- **Pydantic v2** for request/response validation
- **python-jose** + **passlib** for JWT auth & password hashing
- **Supabase Python SDK** for database operations

### Database
- **PostgreSQL** (hosted on Supabase)
- Normalized (3NF) schema — 9 tables, 13 enums, 6 triggers, 4 views
- Pre-computed analytics views for dashboard KPIs

---

## Project Structure

```
FleetFlow-Odoo/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint with CORS & router mounting
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (Supabase URL, JWT secret)
│   ├── auth/
│   │   ├── dependencies.py      # Auth dependency injection (role-based guards)
│   │   ├── jwt.py               # JWT token creation & verification
│   │   ├── models.py            # Auth schemas (Login, Register, Token)
│   │   └── router.py            # /auth endpoints (login, register, refresh, me)
│   ├── db/
│   │   ├── supabase.py          # Supabase client singleton
│   │   └── users.py             # User DB queries
│   ├── models/
│   │   ├── enums.py             # Python enums matching DB enum types
│   │   ├── vehicles.py          # Vehicle schemas
│   │   ├── drivers.py           # Driver schemas
│   │   ├── trips.py             # Trip schemas (TripCreate, TripDetailResponse)
│   │   ├── maintenance.py       # Maintenance log schemas
│   │   ├── expenses.py          # Expense schemas
│   │   ├── fuel_logs.py         # Fuel log schemas
│   │   └── analytics.py         # Analytics schemas (KPIs, cost summaries)
│   └── routes/
│       ├── vehicles.py          # /vehicles CRUD
│       ├── drivers.py           # /drivers CRUD
│       ├── trips.py             # /trips CRUD with joined vehicle/driver data
│       ├── maintenance.py       # /maintenance CRUD
│       ├── expenses.py          # /expenses CRUD
│       ├── fuel_logs.py         # /fuel-logs CRUD
│       └── analytics.py         # /analytics (KPIs, cost summary, financials)
│
├── frontend/
│   ├── package.json
│   ├── next.config.mjs
│   ├── postcss.config.mjs
│   ├── src/
│   │   ├── lib/
│   │   │   └── api.js           # Centralized API client (all endpoint calls)
│   │   ├── hooks/
│   │   │   └── useApi.js        # React hooks (useApi, useFetch, useMutation)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Auth state (login, register, logout, token)
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx  # Route guard for authenticated pages
│   │   │   ├── Providers.jsx    # Client-side AuthProvider wrapper
│   │   │   ├── dashboard/
│   │   │   │   ├── Sidebar.jsx         # Navigation sidebar with user info
│   │   │   │   ├── Topbar.jsx          # Top action bar (search, filter, sort)
│   │   │   │   ├── StatCard.jsx        # Dashboard stat cards
│   │   │   │   ├── VehicleTable.jsx    # Vehicle registry table (API-connected)
│   │   │   │   ├── TripTable.jsx       # Trip dispatcher table
│   │   │   │   └── NewVehicleModal.jsx # Add vehicle form modal
│   │   │   ├── trips/
│   │   │   │   └── NewTripForm.jsx     # Create trip form
│   │   │   ├── maintenance/
│   │   │   │   ├── MaintenanceTable.jsx
│   │   │   │   └── NewServiceForm.jsx
│   │   │   ├── expenses/
│   │   │   │   ├── ExpenseTable.jsx
│   │   │   │   └── NewExpenseForm.jsx
│   │   │   ├── performance/
│   │   │   │   └── PerformanceTable.jsx
│   │   │   └── analytics/
│   │   │       └── AnalyticsDashboard.jsx  # Charts, KPIs, financial table
│   │   └── app/
│   │       ├── layout.js        # Root layout with AuthProvider
│   │       ├── page.js          # Root redirect (→ login or dashboard)
│   │       ├── globals.css      # Global styles
│   │       ├── login/page.jsx   # Sign In / Register page
│   │       ├── dashboard/page.jsx
│   │       ├── trips/page.jsx
│   │       ├── maintenance/page.jsx
│   │       ├── expenses/page.jsx
│   │       ├── performance/page.jsx
│   │       └── analytics/page.jsx
│   └── public/
│
├── database/
│   ├── schema.sql               # Full PostgreSQL DDL (tables, enums, triggers, views)
│   └── DATABASE_SCHEMA.md       # Detailed schema documentation
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Supabase** account (or any PostgreSQL instance)

### Database Setup

1. Create a project on [Supabase](https://supabase.com) (or set up a local PostgreSQL instance).
2. Run the DDL script to create all tables, enums, triggers, and views:

```sql
-- Execute in the Supabase SQL Editor or psql
\i database/schema.sql
```

3. Note your **Supabase URL** and **Service Role Key** for the backend `.env`.

### Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:3000
```

Start the API server:

```bash
uvicorn main:app --reload --port 8000
```

The API docs will be available at **http://localhost:8000/docs** (Swagger UI).

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (optional — defaults to localhost:8000)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## API Reference

All endpoints are documented at `/docs` (Swagger) when the backend is running.

| Group | Endpoint | Methods | Auth |
|-------|----------|---------|------|
| **Auth** | `/auth/register` | POST | Public |
| | `/auth/login` | POST | Public |
| | `/auth/refresh` | POST | Public |
| | `/auth/me` | GET | Any authenticated |
| **Vehicles** | `/vehicles` | GET, POST | Dispatcher+ |
| | `/vehicles/{id}` | GET, PUT, DELETE | Dispatcher+ |
| | `/vehicles/options` | GET | Any authenticated |
| **Drivers** | `/drivers` | GET, POST | Dispatcher+ |
| | `/drivers/{id}` | GET, PUT, DELETE | Dispatcher+ |
| | `/drivers/options` | GET | Any authenticated |
| **Trips** | `/trips` | GET, POST | Dispatcher+ |
| | `/trips/{id}` | GET, PUT, DELETE | Dispatcher+ |
| | `/trips/{id}/status` | PATCH | Dispatcher+ |
| **Maintenance** | `/maintenance` | GET, POST | Dispatcher+ |
| | `/maintenance/{id}` | GET, PUT, DELETE | Dispatcher+ |
| **Expenses** | `/expenses` | GET, POST | Dispatcher+ |
| | `/expenses/{id}` | GET, PUT, DELETE | Dispatcher+ |
| **Fuel Logs** | `/fuel-logs` | GET, POST | Dispatcher+ |
| | `/fuel-logs/{id}` | GET, PUT, DELETE | Dispatcher+ |
| **Analytics** | `/analytics/dashboard/kpis` | GET | Any authenticated |
| | `/analytics/vehicles/cost-summary` | GET | Dispatcher+ |
| | `/analytics/drivers/performance` | GET | Dispatcher+ |
| | `/analytics/financial/monthly` | GET | Dispatcher+ |
| | `/analytics/fleet/stats` | GET | Any authenticated |
| | `/analytics/summary` | GET | Dispatcher+ |
| **Health** | `/health` | GET | Public |

All list endpoints return paginated responses: `{ "data": [...], "total": N }`

---

## Authentication & Roles

FleetFlow uses **JWT Bearer tokens** with access + refresh token flow.

| Role | Level | Permissions |
|------|-------|-------------|
| `admin` | 5 | Full access — manage users, all CRUD operations |
| `manager` | 4 | Fleet management, analytics, all CRUD except user management |
| `dispatcher` | 3 | Trip dispatch, vehicle/driver assignment, maintenance & expense logging |
| `driver` | 2 | View own trips, limited read access |
| `viewer` | 1 | Read-only dashboard and analytics access |

**Auth flow:**
1. Register via `/auth/register` → returns JWT tokens
2. Login via `/auth/login` → returns `access_token` + `refresh_token`
3. Include `Authorization: Bearer <access_token>` on all protected requests
4. Refresh expired tokens via `/auth/refresh`

---

## Database Schema

The PostgreSQL schema follows **3rd Normal Form (3NF)** with pre-computed views for analytics.

### Tables (9)

| Table | Purpose |
|-------|---------|
| `users` | Authentication & authorization |
| `vehicles` | Fleet registry (plate, make, model, status, capacity) |
| `drivers` | Driver profiles linked to users (license, safety score) |
| `trips` | Trip records (origin, destination, cargo, revenue, status) |
| `maintenance_logs` | Vehicle service logs (type, cost, dates) |
| `expenses` | Trip-related expenses (fuel, tolls, fines) |
| `fuel_logs` | Fuel fill-up records (liters, cost, odometer) |
| `vehicle_documents` | Insurance, permits, certificates with expiry tracking |
| `driver_complaints` | Driver complaint records with severity & resolution |

### Analytics Views (4)

| View | Contents |
|------|----------|
| `vw_dashboard_kpis` | Active fleet count, maintenance alerts, utilization rate, pending cargo |
| `vw_vehicle_cost_summary` | Per-vehicle fuel cost, maintenance cost, revenue, net profit, km/L |
| `vw_driver_performance` | Per-driver trip stats, completion rate, safety score, complaints |
| `vw_monthly_financial_summary` | Monthly revenue, fuel cost, maintenance cost, net profit |

> Full schema documentation: [`database/DATABASE_SCHEMA.md`](database/DATABASE_SCHEMA.md)

---

## Screenshots

| Dashboard | Trip Dispatcher | Analytics |
|-----------|----------------|-----------|
| Vehicle registry with stat cards & filters | Trip list with origin/destination & status badges | KPI cards, fuel efficiency trend, cost charts, financial table |

---

## License

This project was built for the **Odoo Hackathon**. All rights reserved.
