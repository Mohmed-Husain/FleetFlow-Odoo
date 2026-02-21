# FleetFlow Database Schema Documentation

## Overview

Normalized (3NF) PostgreSQL schema for **FleetFlow: Modular Fleet & Logistics Management System**.

| Metric | Count |
|--------|-------|
| Tables | **9** |
| Enums | 13 |
| Trigger functions | 7 |
| Views | 4 |

### Normalization Decisions

| What was removed/moved | Why |
|------------------------|-----|
| `drivers.total_trips`, `completion_rate`, `total_complaints` | **3NF violation** — derivable from `trips` and `driver_complaints` tables; now computed in `vw_driver_performance` |
| `drivers.is_available` | Derivable from `duty_status NOT IN ('on_duty','suspended')` |
| `trips.actual_fuel_cost`, `estimated_fuel_cost` | Derivable from `SUM(fuel_logs.total_cost)` per trip; avoids double-source of truth |
| `vehicles.registration_date`, `insurance_expiry` | Already stored in `vehicle_documents` (with proper issue/expiry dates) |
| `vehicles.color`, `vin_number`, `purchase_date`, `purchase_price` | Non-operational; not needed for fleet dispatching |
| `audit_log` table | Removed entirely — not core for hackathon scope; add back if needed |
| All `notes` columns | Removed across all tables — reduces nullable bloat |
| `users.avatar_url`, `last_login_at` | Cosmetic / session-layer concerns |
| `drivers.date_of_birth`, `emergency_contact_*`, `address` | Not business-critical for fleet ops |
| `expenses.driver_id` | Derivable via `trip_id → trips.driver_id` |
| `fuel_logs.fuel_station`, `created_by` | Non-critical; `driver_id` suffices for accountability |
| `driver_complaints.resolution_notes` | `status` + `resolved_at` sufficient |
| `vehicle_documents.document_url` | File storage is an app-layer concern |

---

## Entity-Relationship Diagram

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  users   │──1:1──│ drivers  │──1:N──│  trips   │
└──────────┘       └──────────┘       └──────────┘
     │                   │                 │  │  │
     │              1:N  │            1:N  │  │  │ 1:N
     │                   ▼                 │  │  ▼
     │         ┌──────────────────┐        │  │ ┌───────────┐
     │         │driver_complaints │◄───────┘  │ │ expenses  │
     │         └──────────────────┘           │ └───────────┘
     │                                        │
     │              ┌──────────┐         1:N  │
     │              │ vehicles │──────────────┘
     │              └──────────┘
     │                   │ 1:N             1:N
     │                   ├──────► maintenance_logs
     │                   ├──────► fuel_logs
     │                   └──────► vehicle_documents
     │
     └────► (created_by FK on trips, maintenance, expenses, complaints)
```

---

## Tables

### 1. `users`

> Authentication & authorization. Every person who logs in.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash |
| `role` | user_role | NOT NULL, DEFAULT 'viewer' | `admin`, `manager`, `dispatcher`, `driver`, `viewer` |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `phone` | VARCHAR(20) | | Contact phone |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update |

**Relationships:** 1:1 → `drivers` | Referenced as `created_by` on trips, maintenance, expenses, complaints

---

### 2. `vehicles`

> Fleet registry. Every company vehicle.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `license_plate` | VARCHAR(20) | UNIQUE, NOT NULL | Plate number (unique identifier) |
<!-- | `make` | VARCHAR(100) | NOT NULL | Manufacturer |
| `model` | VARCHAR(100) | NOT NULL | Model name | -->
| `year` | SMALLINT | NOT NULL, 1900–2100 | Manufacturing year |
| `vehicle_type` | vehicle_type | NOT NULL | truck, van, tanker, etc. |
| `fuel_type` | fuel_type | DEFAULT 'diesel' | diesel, petrol, cng, etc. |
| `max_load_capacity_kg` | DECIMAL(10,2) | NOT NULL, > 0 | Max cargo weight |
| `current_odometer_km` | DECIMAL(12,2) | DEFAULT 0, >= 0 | Current mileage (auto-synced from fuel_logs) |
| `status` | vehicle_status | DEFAULT 'idle' | `idle`, `on_trip`, `in_shop`, `retired` |
<!-- | `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete | -->
<!-- | `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update | -->

**Relationships:** 1:N → `trips`, `maintenance_logs`, `fuel_logs`, `expenses`, `vehicle_documents`

**Auto-managed status:** `idle` ↔ `on_trip` (via trip trigger) | `idle` ↔ `in_shop` (via maintenance trigger)

---

### 3. `drivers`

> Driver profile extending a user. Lean — derived stats live in `vw_driver_performance`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `user_id` | INTEGER | FK → users, UNIQUE | 1:1 link to user account |
| `license_number` | VARCHAR(50) | UNIQUE, NOT NULL | License ID |
| `license_expiry` | DATE | NOT NULL | Expiry date (enforced by trigger) |
| `safety_score` | DECIMAL(5,2) | DEFAULT 100, 0–100 | App-maintained safety rating |
| `duty_status` | duty_status | DEFAULT 'off_duty' | `on_duty`, `off_duty`, `on_break`, `suspended` |
<!-- | `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update | -->

**Relationships:** N:1 → `users` | 1:N → `trips`, `fuel_logs`, `driver_complaints`

**Derived in view:** `total_trips`, `completion_rate`, `total_complaints`, `is_available`

---

### 4. `trips`

> Dispatching & delivery tracking. Central operational table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Assigned vehicle |
| `driver_id` | INTEGER | FK → drivers, NOT NULL | Assigned driver |
| `cargo_weight_kg` | DECIMAL(10,2) | NOT NULL, > 0 | Cargo weight (validated vs vehicle capacity) |
| `origin` | VARCHAR(500) | NOT NULL | Pickup address |
| `destination` | VARCHAR(500) | NOT NULL | Drop-off address |
| `distance_km` | DECIMAL(10,2) | >= 0 | Trip distance |
| `revenue` | DECIMAL(14,2) | DEFAULT 0, >= 0 | Trip earnings |
| `status` | trip_status | DEFAULT 'scheduled' | `scheduled` → `in_transit` → `delivered` / `cancelled` |
| `scheduled_departure` | TIMESTAMPTZ | NOT NULL | Planned departure |
| `scheduled_arrival` | TIMESTAMPTZ | NOT NULL | Planned departure |

<!-- | `actual_departure` | TIMESTAMPTZ | | When it actually left | -->
<!-- | `actual_arrival` | TIMESTAMPTZ | | When it actually arrived | -->
<!-- | `created_by` | INTEGER | FK → users | Who dispatched this |
| `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update | -->

**Relationships:** N:1 → `vehicles`, `drivers`, `users` | 1:N → `expenses`, `fuel_logs`, `driver_complaints`

**Trigger guards:** cargo overload check, driver license/suspension check, vehicle idle check

---

### 5. `maintenance_logs`

> Vehicle service & repair records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Serviced vehicle |
| `service_type` | service_type | NOT NULL | oil_change, tire_replacement, etc. |
| `description` | TEXT | NOT NULL | Issue/service details |
| `start_date` | DATE | | Work start |
| `completion_date` | DATE | | Work end (must be >= start_date) |
| `cost` | DECIMAL(12,2) | DEFAULT 0, >= 0 | Service cost |
| `status` | maintenance_status | DEFAULT 'new' | `new`, `in_progress`, `completed`, `cancelled` |

<!-- | `created_by` | INTEGER | FK → users | Who logged this |
| `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update | -->

**Relationships:** N:1 → `vehicles`, `users`

**Trigger:** Auto-sets vehicle to `in_shop` on create; back to `idle` on complete/cancel

---

### 6. `expenses`

> Trip & operational costs (tolls, parking, fines, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `trip_id` | INTEGER | FK → trips | Related trip (nullable for standalone expenses) |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Related vehicle |
| `expense_type` | expense_type | NOT NULL | fuel, toll, parking, maintenance, fine, misc, etc. |
| `amount` | DECIMAL(12,2) | NOT NULL, > 0 | Amount |
| `description` | VARCHAR(500) | | Details |
| `expense_date` | DATE | DEFAULT TODAY | When incurred |

<!-- | `created_by` | INTEGER | FK → users | Who recorded | -->
<!-- | `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update | -->

**Relationships:** N:1 → `trips`, `vehicles`, `users`

---

### 7. `fuel_logs`

> Fuel fill-up records for efficiency analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Fueled vehicle |
| `driver_id` | INTEGER | FK → drivers | Who filled up |
| `trip_id` | INTEGER | FK → trips | During which trip |
| `liters` | DECIMAL(8,2) | NOT NULL, > 0 | Quantity |
| `cost_per_liter` | DECIMAL(8,2) | NOT NULL, > 0 | Unit price |
| `total_cost` | DECIMAL(12,2) | **GENERATED** (liters × cost_per_liter) | Auto-calculated |
| `odometer_at_fill` | DECIMAL(12,2) | NOT NULL, >= 0 | Odometer reading |
| `fuel_date` | DATE | DEFAULT TODAY | Fill-up date |
<!-- | `created_at` | TIMESTAMPTZ | NOT NULL | Record creation | -->

**Relationships:** N:1 → `vehicles`, `drivers`, `trips`

**Trigger:** Auto-updates `vehicles.current_odometer_km` to highest reading

---

### 8. `driver_complaints`

> Complaints & incidents against drivers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `driver_id` | INTEGER | FK → drivers, NOT NULL | Target driver |
| `trip_id` | INTEGER | FK → trips | Related trip |
| `complaint_type` | complaint_type | NOT NULL | late_delivery, reckless_driving, cargo_damage, etc. |
| `description` | TEXT | NOT NULL | Full details |
| `severity` | severity_level | DEFAULT 'medium' | low, medium, high, critical |
| `status` | complaint_status | DEFAULT 'open' | open, investigating, resolved, dismissed |
| `reported_by` | INTEGER | FK → users | Filed by |
| `resolved_at` | TIMESTAMPTZ | | Resolution timestamp |

<!-- | `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update | -->

**Relationships:** N:1 → `drivers`, `trips`, `users`

---

### 9. `vehicle_documents`

> Compliance docs (insurance, registration, permits).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PK | Primary key |
| `vehicle_id` | INTEGER | FK → vehicles, NOT NULL | Owner vehicle |
| `document_type` | document_type | NOT NULL | insurance, registration, permit, etc. |
| `document_number` | VARCHAR(100) | NOT NULL | Document ID |
| `issue_date` | DATE | NOT NULL | Issued on |
| `expiry_date` | DATE | NOT NULL, >= issue_date | Expires on |
<!-- | `created_at` | TIMESTAMPTZ | NOT NULL | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update | -->

**Constraints:** UNIQUE on `(vehicle_id, document_type, document_number)`

**Relationships:** N:1 → `vehicles`

---

## Enum Types

| Enum | Values |
|------|--------|
| `user_role` | admin, manager, dispatcher, driver, viewer |
| `vehicle_status` | idle, on_trip, in_shop, retired |
| `vehicle_type` | truck, trailer, van, mini, tanker, refrigerated, flatbed, other |
| `fuel_type` | diesel, petrol, cng, electric, hybrid |
| `trip_status` | scheduled, in_transit, delivered, cancelled |
| `maintenance_status` | new, in_progress, completed, cancelled |
| `service_type` | oil_change, tire_replacement, engine_repair, brake_service, general_inspection, electrical, body_work, other |
| `expense_type` | fuel, toll, parking, maintenance, fine, loading_unloading, misc |
| `duty_status` | on_duty, off_duty, on_break, suspended |
| `complaint_type` | late_delivery, reckless_driving, cargo_damage, misconduct, vehicle_misuse, other |
| `severity_level` | low, medium, high, critical |
| `complaint_status` | open, investigating, resolved, dismissed |
| `document_type` | insurance, registration, fitness_certificate, permit, pollution_certificate |

---

## Triggers & Business Rules

| # | Trigger | Table | What It Does |
|---|---------|-------|-------------|
| 1 | `trg_*_updated` | All 8 mutable tables | Auto-sets `updated_at` = NOW() |
| 2 | `trg_check_cargo` | trips | **Blocks** if `cargo_weight_kg` > vehicle capacity |
| 3 | `trg_check_driver` | trips | **Blocks** if driver license expired or suspended |
| 4 | `trg_check_vehicle` | trips | **Blocks** if vehicle status ≠ idle |
| 5 | `trg_trip_status_sync` | trips | Sets vehicle → `on_trip`, driver → `on_duty` on transit; resets on delivery/cancel |
| 6 | `trg_maintenance_status` | maintenance_logs | Sets vehicle → `in_shop` on create; → `idle` on complete/cancel |
| 7 | `trg_sync_odometer` | fuel_logs | Updates `vehicles.current_odometer_km` to highest reading |

---

## Views

### `vw_dashboard_kpis`
Single row: `active_fleet`, `maintenance_alerts`, `utilization_rate` (%), `pending_cargo`

### `vw_vehicle_cost_summary`
Per vehicle: fuel cost, maintenance cost, total cost, revenue, net profit, km/liter

### `vw_driver_performance`
Per driver: name, license info, `license_expired` flag, safety score, duty status, **computed** `is_available`, `total_trips`, `completed_trips`, `cancelled_trips`, `completion_rate`, `total_complaints`

### `vw_monthly_financial_summary`
Per month: total revenue, fuel cost, maintenance cost, net profit

---

## Module → Table Mapping

| Module | Primary Tables | Views |
|--------|---------------|-------|
| 1. Authentication | `users` | — |
| 2. Dashboard | — | `vw_dashboard_kpis` |
| 3. Vehicle Registry | `vehicles`, `vehicle_documents` | — |
| 4. Trip Dispatcher | `trips`, `vehicles`, `drivers` | — |
| 5. Maintenance Logs | `maintenance_logs`, `vehicles` | — |
| 6. Expense & Fuel | `expenses`, `fuel_logs` | — |
| 7. Driver Performance | `drivers`, `driver_complaints` | `vw_driver_performance` |
| 8. Analytics | — | `vw_vehicle_cost_summary`, `vw_monthly_financial_summary` |

---

## Key Design Decisions

1. **3NF Compliance** — Derived fields (`total_trips`, `completion_rate`, `total_complaints`, `is_available`, `actual_fuel_cost`) removed from base tables and computed in views at query time.

2. **Denormalization kept for `current_odometer_km`** — Practical tradeoff: avoids scanning `fuel_logs` on every vehicle read; kept consistent via trigger.

3. **Soft Deletes** — `is_active` on `users` and `vehicles` preserves referential integrity.

4. **RESTRICT on Trip FKs** — Prevents deleting vehicles/drivers with trip history.

5. **Generated Column** — `fuel_logs.total_cost` is `GENERATED ALWAYS AS (liters * cost_per_liter) STORED`.

6. **Database-level enforcement** — Cargo overload, license expiry, vehicle availability checked via triggers (can't be bypassed by API bugs).

7. **No audit_log** — Deferred for hackathon scope; can be added as a separate migration.
