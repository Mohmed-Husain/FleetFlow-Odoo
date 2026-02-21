# FleetFlow Database Schema Documentation

## Overview

The FleetFlow database is designed for a **Modular Fleet & Logistics Management System**. It covers authentication, vehicle management, trip dispatching, maintenance tracking, expense/fuel logging, driver performance, and operational analytics.

**Database:** PostgreSQL  
**Tables:** 10 core tables  
**Views:** 4 analytics views  
**Triggers:** 12 automatic business-rule triggers

---

## Entity-Relationship Diagram (Text)

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  users   │──1:1──│ drivers  │──1:N──│  trips   │
└──────────┘       └──────────┘       └──────────┘
     │                   │                 │  │  │
     │                   │                 │  │  │
     │              1:N  │            1:N  │  │  │ 1:N
     │                   ▼                 │  │  ▼
     │         ┌──────────────────┐        │  │ ┌───────────┐
     │         │driver_complaints │◄───────┘  │ │ expenses  │
     │         └──────────────────┘           │ └───────────┘
     │                                        │       │
     │                                   1:N  │       │
     │              ┌──────────┐              ▼       │
     │         N:1  │ vehicles │──1:N──► ┌──────────┐ │
     │              └──────────┘         │fuel_logs │◄┘
     │                   │               └──────────┘
     │              1:N  │
     │                   ▼
     │         ┌──────────────────┐
     │         │maintenance_logs  │
     │         └──────────────────┘
     │                   
     │              1:N
     │                   ▼
     │         ┌──────────────────┐
     │         │vehicle_documents │
     │         └──────────────────┘
     │
     │         ┌──────────────────┐
     └────────►│   audit_log      │
               └──────────────────┘
```

---

## Tables

### 1. `users`

> Core authentication & authorization table. Every person who logs into the system has a record here.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Login username |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `role` | user_role | NOT NULL, DEFAULT 'viewer' | One of: `admin`, `manager`, `dispatcher`, `driver`, `viewer` |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `phone` | VARCHAR(20) | | Phone number |
| `avatar_url` | VARCHAR(500) | | Profile picture URL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft delete flag |
| `last_login_at` | TIMESTAMPTZ | | Last login timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Relationships:**
- **1:1** → `drivers` (a user with role='driver' has one driver profile)
- **1:N** → `audit_log` (tracks user actions)
- Referenced by `trips.created_by`, `maintenance_logs.created_by`, `expenses.created_by`, etc.

---

### 2. `vehicles`

> The digital garage — every vehicle the company owns is registered here.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `license_plate` | VARCHAR(20) | NOT NULL, UNIQUE | Unique license plate number |
| `make` | VARCHAR(100) | NOT NULL | Manufacturer (TATA, Ashok Leyland, etc.) |
| `model` | VARCHAR(100) | NOT NULL | Vehicle model name |
| `year` | INTEGER | NOT NULL, CHECK 1900-2100 | Manufacturing year |
| `vehicle_type` | vehicle_type | NOT NULL | One of: `truck`, `trailer`, `van`, `mini`, `tanker`, `refrigerated`, `flatbed`, `other` |
| `fuel_type` | fuel_type | NOT NULL, DEFAULT 'diesel' | One of: `diesel`, `petrol`, `cng`, `electric`, `hybrid` |
| `max_load_capacity_kg` | DECIMAL(10,2) | NOT NULL, > 0 | Maximum cargo weight in kilograms |
| `current_odometer_km` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Current mileage reading |
| `status` | vehicle_status | NOT NULL, DEFAULT 'idle' | One of: `idle`, `on_trip`, `in_shop`, `retired` |
| `color` | VARCHAR(30) | | Vehicle color |
| `vin_number` | VARCHAR(50) | UNIQUE | Vehicle Identification Number |
| `registration_date` | DATE | | Registration date |
| `insurance_expiry` | DATE | | Insurance expiry date |
| `purchase_date` | DATE | | When vehicle was purchased |
| `purchase_price` | DECIMAL(14,2) | | Purchase price |
| `notes` | TEXT | | General notes |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Relationships:**
- **1:N** → `trips` (vehicle is assigned to many trips over time)
- **1:N** → `maintenance_logs` (vehicle has many service records)
- **1:N** → `fuel_logs` (vehicle has many fuel fill-ups)
- **1:N** → `expenses` (costs linked to vehicle)
- **1:N** → `vehicle_documents` (insurance, permits, etc.)

**Business Rules (via triggers):**
- Status auto-changes to `in_shop` when maintenance is created
- Status auto-changes to `on_trip` when a trip goes `in_transit`
- Status auto-returns to `idle` when trip is delivered or maintenance completed
- Cannot be assigned to a trip unless status is `idle`

---

### 3. `drivers`

> Driver profile extending the user. Stores license info, performance scores, and availability.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `user_id` | INTEGER | FK → users, UNIQUE | Links to the user account |
| `license_number` | VARCHAR(50) | NOT NULL, UNIQUE | Driver license number |
| `license_expiry` | DATE | NOT NULL | License expiration date |
| `date_of_birth` | DATE | | Driver's date of birth |
| `safety_score` | DECIMAL(5,2) | DEFAULT 100, 0-100 | Calculated safety rating |
| `completion_rate` | DECIMAL(5,2) | DEFAULT 100, 0-100 | Trip completion percentage |
| `total_trips` | INTEGER | DEFAULT 0, >= 0 | Cumulative trip count |
| `total_complaints` | INTEGER | DEFAULT 0, >= 0 | Cumulative complaint count (auto-updated) |
| `duty_status` | duty_status | NOT NULL, DEFAULT 'off_duty' | One of: `on_duty`, `off_duty`, `on_break`, `suspended` |
| `is_available` | BOOLEAN | NOT NULL, DEFAULT TRUE | Can be assigned to new trips |
| `emergency_contact_name` | VARCHAR(100) | | Emergency contact name |
| `emergency_contact_phone` | VARCHAR(20) | | Emergency contact phone |
| `address` | TEXT | | Home address |
| `notes` | TEXT | | General notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Relationships:**
- **N:1** → `users` (each driver IS a user)
- **1:N** → `trips` (driver handles many trips)
- **1:N** → `fuel_logs` (driver fills up fuel)
- **1:N** → `expenses` (expenses linked to driver)
- **1:N** → `driver_complaints` (complaints filed against driver)

**Business Rules (via triggers):**
- Cannot be assigned to a trip if license is expired
- Cannot be assigned to a trip if status is `suspended`
- Duty status auto-changes to `on_duty` when trip goes `in_transit`
- Returns to `off_duty` when trip is `delivered` or `cancelled`
- `total_complaints` counter auto-increments/decrements on complaint insert/delete

---

### 4. `trips`

> The brain of the operation — handles dispatching and delivery tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Assigned vehicle |
| `driver_id` | INTEGER | FK → drivers, NOT NULL | Assigned driver |
| `cargo_weight_kg` | DECIMAL(10,2) | NOT NULL, > 0 | Weight of cargo in kg |
| `cargo_description` | TEXT | | What's being transported |
| `origin_address` | VARCHAR(500) | NOT NULL | Pickup location |
| `destination_address` | VARCHAR(500) | NOT NULL | Drop-off location |
| `distance_km` | DECIMAL(10,2) | >= 0 | Trip distance |
| `estimated_fuel_cost` | DECIMAL(12,2) | DEFAULT 0, >= 0 | Pre-calculated fuel estimate |
| `actual_fuel_cost` | DECIMAL(12,2) | >= 0 | Actual fuel spent |
| `revenue` | DECIMAL(14,2) | DEFAULT 0, >= 0 | Money earned from this trip |
| `status` | trip_status | NOT NULL, DEFAULT 'scheduled' | One of: `scheduled`, `in_transit`, `delivered`, `cancelled` |
| `scheduled_departure` | TIMESTAMPTZ | NOT NULL | Planned departure time |
| `actual_departure` | TIMESTAMPTZ | | When it actually left |
| `estimated_arrival` | TIMESTAMPTZ | | Expected arrival |
| `actual_arrival` | TIMESTAMPTZ | | When it actually arrived |
| `notes` | TEXT | | Trip notes |
| `created_by` | INTEGER | FK → users | Who created this trip |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Relationships:**
- **N:1** → `vehicles` (trip uses one vehicle)
- **N:1** → `drivers` (trip has one driver)
- **N:1** → `users` (created by a user)
- **1:N** → `expenses` (trip can have multiple expenses)
- **1:N** → `fuel_logs` (fuel fill-ups during trip)
- **1:N** → `driver_complaints` (complaints related to trip)

**Business Rules (via triggers):**
- **Cargo overload check:** Cargo weight cannot exceed vehicle's `max_load_capacity_kg`
- **Driver license check:** Cannot assign if driver's license is expired
- **Vehicle availability check:** Can only use vehicles with `idle` status
- Vehicle status auto-set to `on_trip` when trip goes `in_transit`

---

### 5. `maintenance_logs`

> Tracks every service, repair, and check-up for vehicles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Which vehicle is being serviced |
| `service_type` | service_type | NOT NULL | Type of work performed |
| `description` | TEXT | NOT NULL | Details of the issue/service |
| `reported_date` | DATE | NOT NULL, DEFAULT TODAY | When the issue was reported |
| `start_date` | DATE | | When work began |
| `completion_date` | DATE | | When work was finished |
| `cost` | DECIMAL(12,2) | DEFAULT 0, >= 0 | Service cost |
| `status` | maintenance_status | NOT NULL, DEFAULT 'new' | One of: `new`, `in_progress`, `completed`, `cancelled` |
| `vendor_name` | VARCHAR(200) | | Service provider name |
| `vendor_contact` | VARCHAR(50) | | Service provider contact |
| `notes` | TEXT | | Additional notes |
| `created_by` | INTEGER | FK → users | Who logged this service |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Relationships:**
- **N:1** → `vehicles` (service belongs to a vehicle)
- **N:1** → `users` (logged by a user)

**Business Rules (via triggers):**
- **Auto-Hide Rule:** Creating a maintenance log auto-sets the vehicle to `in_shop` — the dispatcher can no longer assign it to trips
- Completing/cancelling maintenance auto-returns vehicle to `idle`
- `completion_date` must be >= `start_date`

---

### 6. `expenses`

> All financial expenses linked to trips, vehicles, and drivers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `trip_id` | INTEGER | FK → trips (nullable) | Related trip (if any) |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Related vehicle |
| `driver_id` | INTEGER | FK → drivers (nullable) | Related driver |
| `expense_type` | expense_type | NOT NULL | One of: `fuel`, `toll`, `parking`, `maintenance`, `fine`, `loading_unloading`, `misc` |
| `amount` | DECIMAL(12,2) | NOT NULL, > 0 | Expense amount |
| `description` | VARCHAR(500) | | Details |
| `receipt_url` | VARCHAR(500) | | Uploaded receipt link |
| `expense_date` | DATE | NOT NULL, DEFAULT TODAY | When the expense occurred |
| `created_by` | INTEGER | FK → users | Who recorded this |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Relationships:**
- **N:1** → `trips` (expense may belong to a trip)
- **N:1** → `vehicles` (expense always belongs to a vehicle)
- **N:1** → `drivers` (expense may be linked to a driver)
- **N:1** → `users` (created by a user)

---

### 7. `fuel_logs`

> Detailed fuel fill-up records for calculating fuel efficiency.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Which vehicle was fueled |
| `driver_id` | INTEGER | FK → drivers (nullable) | Who filled up |
| `trip_id` | INTEGER | FK → trips (nullable) | During which trip |
| `liters` | DECIMAL(8,2) | NOT NULL, > 0 | Fuel quantity in liters |
| `cost_per_liter` | DECIMAL(8,2) | NOT NULL, > 0 | Price per liter |
| `total_cost` | DECIMAL(12,2) | **GENERATED** (liters × cost_per_liter) | Auto-calculated total |
| `odometer_at_fill` | DECIMAL(12,2) | NOT NULL, >= 0 | Odometer reading at fill-up |
| `fuel_station` | VARCHAR(200) | | Station name/location |
| `fuel_date` | DATE | NOT NULL, DEFAULT TODAY | Date of fill-up |
| `created_by` | INTEGER | FK → users | Who recorded this |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |

**Relationships:**
- **N:1** → `vehicles`
- **N:1** → `drivers`
- **N:1** → `trips`
- **N:1** → `users`

**Business Rules (via triggers):**
- Auto-updates the vehicle's `current_odometer_km` to the highest reading

---

### 8. `driver_complaints`

> Tracks complaints, incidents, and issues filed against drivers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `driver_id` | INTEGER | FK → drivers, NOT NULL | Complaint target |
| `trip_id` | INTEGER | FK → trips (nullable) | Related trip |
| `complaint_type` | complaint_type | NOT NULL | Category of complaint |
| `description` | TEXT | NOT NULL | Full details |
| `severity` | severity_level | NOT NULL, DEFAULT 'medium' | `low`, `medium`, `high`, `critical` |
| `status` | complaint_status | NOT NULL, DEFAULT 'open' | `open`, `investigating`, `resolved`, `dismissed` |
| `reported_by` | INTEGER | FK → users | Who filed this |
| `resolved_at` | TIMESTAMPTZ | | When it was resolved |
| `resolution_notes` | TEXT | | How it was resolved |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Relationships:**
- **N:1** → `drivers`
- **N:1** → `trips`
- **N:1** → `users` (reported by)

**Business Rules (via triggers):**
- Auto-increments `drivers.total_complaints` on INSERT
- Auto-decrements on DELETE

---

### 9. `vehicle_documents`

> Stores compliance documents (insurance, permits, registration, etc.)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Auto-incrementing primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Which vehicle |
| `document_type` | document_type | NOT NULL | `insurance`, `registration`, `fitness_certificate`, `permit`, `pollution_certificate` |
| `document_number` | VARCHAR(100) | NOT NULL | Document ID number |
| `issue_date` | DATE | NOT NULL | When document was issued |
| `expiry_date` | DATE | NOT NULL | When document expires |
| `document_url` | VARCHAR(500) | | Uploaded document link |
| `notes` | TEXT | | Additional notes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |

**Constraints:**
- `expiry_date >= issue_date`
- Unique on `(vehicle_id, document_type, document_number)` — no duplicate docs

**Relationships:**
- **N:1** → `vehicles`

---

### 10. `audit_log`

> Immutable record of all system actions for accountability and debugging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Auto-incrementing primary key |
| `user_id` | INTEGER | FK → users (nullable) | Who performed the action |
| `action` | VARCHAR(100) | NOT NULL | Action name (e.g., `CREATE_TRIP`, `UPDATE_VEHICLE`) |
| `entity_type` | VARCHAR(50) | NOT NULL | Table name (e.g., `trip`, `vehicle`) |
| `entity_id` | INTEGER | | PK of the affected record |
| `old_values` | JSONB | | Previous state (for updates) |
| `new_values` | JSONB | | New state (for creates/updates) |
| `ip_address` | INET | | Client IP address |
| `user_agent` | VARCHAR(500) | | Browser/client info |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When the action happened |

**Relationships:**
- **N:1** → `users` (who performed the action)

---

## Enum Types Reference

| Enum Name | Values |
|-----------|--------|
| `user_role` | `admin`, `manager`, `dispatcher`, `driver`, `viewer` |
| `vehicle_status` | `idle`, `on_trip`, `in_shop`, `retired` |
| `vehicle_type` | `truck`, `trailer`, `van`, `mini`, `tanker`, `refrigerated`, `flatbed`, `other` |
| `fuel_type` | `diesel`, `petrol`, `cng`, `electric`, `hybrid` |
| `trip_status` | `scheduled`, `in_transit`, `delivered`, `cancelled` |
| `maintenance_status` | `new`, `in_progress`, `completed`, `cancelled` |
| `service_type` | `oil_change`, `tire_replacement`, `engine_repair`, `brake_service`, `general_inspection`, `electrical`, `body_work`, `other` |
| `expense_type` | `fuel`, `toll`, `parking`, `maintenance`, `fine`, `loading_unloading`, `misc` |
| `duty_status` | `on_duty`, `off_duty`, `on_break`, `suspended` |
| `complaint_type` | `late_delivery`, `reckless_driving`, `cargo_damage`, `misconduct`, `vehicle_misuse`, `other` |
| `severity_level` | `low`, `medium`, `high`, `critical` |
| `complaint_status` | `open`, `investigating`, `resolved`, `dismissed` |
| `document_type` | `insurance`, `registration`, `fitness_certificate`, `permit`, `pollution_certificate` |

---

## Triggers & Business Rules

| # | Trigger | Event | Table | What It Does |
|---|---------|-------|-------|-------------|
| 1 | `trg_*_updated` | BEFORE UPDATE | All major tables | Auto-sets `updated_at` to current timestamp |
| 2 | `trg_check_cargo_capacity` | BEFORE INSERT/UPDATE | `trips` | **Blocks** trip if `cargo_weight_kg` > vehicle's `max_load_capacity_kg` |
| 3 | `trg_check_driver_license` | BEFORE INSERT/UPDATE | `trips` | **Blocks** trip if driver's license is expired or driver is suspended |
| 4 | `trg_check_vehicle_availability` | BEFORE INSERT/UPDATE | `trips` | **Blocks** trip if vehicle status is not `idle` |
| 5 | `trg_trip_vehicle_status` | AFTER INSERT/UPDATE | `trips` | Sets vehicle to `on_trip` & driver to `on_duty` when trip goes `in_transit`; resets to `idle`/`off_duty` on delivery/cancellation |
| 6 | `trg_maintenance_vehicle_status` | AFTER INSERT/UPDATE | `maintenance_logs` | Sets vehicle to `in_shop` when maintenance starts; resets to `idle` on completion |
| 7 | `trg_update_driver_complaints` | AFTER INSERT/DELETE | `driver_complaints` | Auto-increments/decrements `drivers.total_complaints` |
| 8 | `trg_update_odometer` | AFTER INSERT | `fuel_logs` | Auto-updates `vehicles.current_odometer_km` to the highest odometer reading |

---

## Views (Pre-built Analytics)

### `vw_dashboard_kpis`
Returns a single row with 4 values for the main dashboard:
- `active_fleet` — count of vehicles currently `on_trip`
- `maintenance_alerts` — count of vehicles `in_shop`
- `utilization_rate` — percentage of active vs total fleet
- `pending_cargo` — count of trips with `scheduled` status

### `vw_vehicle_cost_summary`
Per-vehicle financial breakdown:
- Total fuel cost, total maintenance cost, total cost
- Total revenue and net profit
- Fuel efficiency (km per liter)

### `vw_driver_performance`
Per-driver performance card:
- Name, license info, expiry status
- Safety score, completion rate
- Trip counts (completed vs cancelled)
- Complaint count and availability

### `vw_monthly_financial_summary`
Monthly P&L for the entire fleet:
- Total revenue, fuel cost, maintenance cost
- Net profit per month

---

## How Modules Map to Tables

| Module (UI Screen) | Primary Tables | Views Used |
|--------------------|---------------|------------|
| **1. Authentication** | `users` | — |
| **2. Main Dashboard** | — (reads from views) | `vw_dashboard_kpis` |
| **3. Vehicle Registry** | `vehicles`, `vehicle_documents` | — |
| **4. Trip Dispatcher** | `trips`, `vehicles`, `drivers` | — |
| **5. Maintenance Logs** | `maintenance_logs`, `vehicles` | — |
| **6. Expense & Fuel** | `expenses`, `fuel_logs` | — |
| **7. Driver Performance** | `drivers`, `driver_complaints`, `users` | `vw_driver_performance` |
| **8. Analytics & Reports** | — (reads from views) | `vw_vehicle_cost_summary`, `vw_monthly_financial_summary` |

---

## Key Design Decisions

1. **Soft Deletes** — `is_active` flag on users and vehicles instead of hard deletes to preserve referential integrity and history.

2. **RESTRICT on Trip FKs** — `trips.vehicle_id` and `trips.driver_id` use `ON DELETE RESTRICT` to prevent deleting a vehicle or driver that has trip history.

3. **Generated Column** — `fuel_logs.total_cost` is auto-computed (`liters × cost_per_liter`) using PostgreSQL `GENERATED ALWAYS AS ... STORED` to avoid calculation errors.

4. **Trigger-based Business Logic** — Critical rules (cargo overload, license expiry, vehicle availability) enforced at the database level so they can't be bypassed by any API or UI bug.

5. **Audit Log with JSONB** — `old_values` and `new_values` stored as JSONB for flexibility — no need to create a separate audit table per entity.

6. **Indexes** — Strategic indexes on all foreign keys, status columns, and date columns for fast dashboard queries and filtered list views.
