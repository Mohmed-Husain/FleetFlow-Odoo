-- ============================================================
-- FleetFlow: Modular Fleet & Logistics Management System
-- Database Schema (PostgreSQL)
-- Version: 1.0
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'admin',
    'manager',
    'dispatcher',
    'driver',
    'viewer'
);

CREATE TYPE vehicle_status AS ENUM (
    'idle',
    'on_trip',
    'in_shop',
    'retired'
);

CREATE TYPE vehicle_type AS ENUM (
    'truck',
    'trailer',
    'van',
    'mini',
    'tanker',
    'refrigerated',
    'flatbed',
    'other'
);

CREATE TYPE fuel_type AS ENUM (
    'diesel',
    'petrol',
    'cng',
    'electric',
    'hybrid'
);

CREATE TYPE trip_status AS ENUM (
    'scheduled',
    'in_transit',
    'delivered',
    'cancelled'
);

CREATE TYPE maintenance_status AS ENUM (
    'new',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE service_type AS ENUM (
    'oil_change',
    'tire_replacement',
    'engine_repair',
    'brake_service',
    'general_inspection',
    'electrical',
    'body_work',
    'other'
);

CREATE TYPE expense_type AS ENUM (
    'fuel',
    'toll',
    'parking',
    'maintenance',
    'fine',
    'loading_unloading',
    'misc'
);

CREATE TYPE duty_status AS ENUM (
    'on_duty',
    'off_duty',
    'on_break',
    'suspended'
);

CREATE TYPE complaint_type AS ENUM (
    'late_delivery',
    'reckless_driving',
    'cargo_damage',
    'misconduct',
    'vehicle_misuse',
    'other'
);

CREATE TYPE severity_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE complaint_status AS ENUM (
    'open',
    'investigating',
    'resolved',
    'dismissed'
);

CREATE TYPE document_type AS ENUM (
    'insurance',
    'registration',
    'fitness_certificate',
    'permit',
    'pollution_certificate'
);


-- ============================================================
-- 1. USERS TABLE
-- Core authentication & authorization
-- ============================================================

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL DEFAULT 'viewer',
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);


-- ============================================================
-- 2. VEHICLES TABLE
-- Vehicle registry / Asset management
-- ============================================================

CREATE TABLE vehicles (
    id                      SERIAL PRIMARY KEY,
    license_plate           VARCHAR(20)     NOT NULL UNIQUE,
    make                    VARCHAR(100)    NOT NULL,              -- e.g. TATA, Ashok Leyland
    model                   VARCHAR(100)    NOT NULL,              -- e.g. Prima 4928
    year                    INTEGER         NOT NULL CHECK (year >= 1900 AND year <= 2100),
    vehicle_type            vehicle_type    NOT NULL,
    fuel_type               fuel_type       NOT NULL DEFAULT 'diesel',
    max_load_capacity_kg    DECIMAL(10,2)   NOT NULL CHECK (max_load_capacity_kg > 0),
    current_odometer_km     DECIMAL(12,2)   NOT NULL DEFAULT 0 CHECK (current_odometer_km >= 0),
    status                  vehicle_status  NOT NULL DEFAULT 'idle',
    color                   VARCHAR(30),
    vin_number              VARCHAR(50)     UNIQUE,                -- Vehicle Identification Number
    registration_date       DATE,
    insurance_expiry        DATE,
    purchase_date           DATE,
    purchase_price          DECIMAL(14,2),
    notes                   TEXT,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);


-- ============================================================
-- 3. DRIVERS TABLE
-- Driver profiles linked to user accounts
-- ============================================================

CREATE TABLE drivers (
    id                      SERIAL PRIMARY KEY,
    user_id                 INTEGER         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    license_number          VARCHAR(50)     NOT NULL UNIQUE,
    license_expiry          DATE            NOT NULL,
    date_of_birth           DATE,
    safety_score            DECIMAL(5,2)    NOT NULL DEFAULT 100.00 CHECK (safety_score >= 0 AND safety_score <= 100),
    completion_rate         DECIMAL(5,2)    NOT NULL DEFAULT 100.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    total_trips             INTEGER         NOT NULL DEFAULT 0 CHECK (total_trips >= 0),
    total_complaints        INTEGER         NOT NULL DEFAULT 0 CHECK (total_complaints >= 0),
    duty_status             duty_status     NOT NULL DEFAULT 'off_duty',
    is_available            BOOLEAN         NOT NULL DEFAULT TRUE,
    emergency_contact_name  VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    address                 TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_user ON drivers(user_id);
CREATE INDEX idx_drivers_license ON drivers(license_number);
CREATE INDEX idx_drivers_duty ON drivers(duty_status);
CREATE INDEX idx_drivers_available ON drivers(is_available);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry);


-- ============================================================
-- 4. TRIPS TABLE
-- Trip dispatching & tracking
-- ============================================================

CREATE TABLE trips (
    id                      SERIAL PRIMARY KEY,
    vehicle_id              INTEGER         NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id               INTEGER         NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    cargo_weight_kg         DECIMAL(10,2)   NOT NULL CHECK (cargo_weight_kg > 0),
    cargo_description       TEXT,
    origin_address          VARCHAR(500)    NOT NULL,
    destination_address     VARCHAR(500)    NOT NULL,
    distance_km             DECIMAL(10,2)   CHECK (distance_km >= 0),
    estimated_fuel_cost     DECIMAL(12,2)   DEFAULT 0 CHECK (estimated_fuel_cost >= 0),
    actual_fuel_cost        DECIMAL(12,2)   CHECK (actual_fuel_cost >= 0),
    revenue                 DECIMAL(14,2)   DEFAULT 0 CHECK (revenue >= 0),
    status                  trip_status     NOT NULL DEFAULT 'scheduled',
    scheduled_departure     TIMESTAMPTZ     NOT NULL,
    actual_departure        TIMESTAMPTZ,
    estimated_arrival       TIMESTAMPTZ,
    actual_arrival          TIMESTAMPTZ,
    notes                   TEXT,
    created_by              INTEGER         REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Ensure cargo doesn't exceed vehicle capacity (enforced via trigger)
    CONSTRAINT chk_trip_dates CHECK (
        scheduled_departure IS NOT NULL
    )
);

CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_departure ON trips(scheduled_departure);
CREATE INDEX idx_trips_created_by ON trips(created_by);
CREATE INDEX idx_trips_created_at ON trips(created_at);


-- ============================================================
-- 5. MAINTENANCE_LOGS TABLE
-- Vehicle maintenance & service records
-- ============================================================

CREATE TABLE maintenance_logs (
    id                  SERIAL PRIMARY KEY,
    vehicle_id          INTEGER             NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type        service_type        NOT NULL,
    description         TEXT                NOT NULL,
    reported_date       DATE                NOT NULL DEFAULT CURRENT_DATE,
    start_date          DATE,
    completion_date     DATE,
    cost                DECIMAL(12,2)       DEFAULT 0 CHECK (cost >= 0),
    status              maintenance_status  NOT NULL DEFAULT 'new',
    vendor_name         VARCHAR(200),
    vendor_contact      VARCHAR(50),
    notes               TEXT,
    created_by          INTEGER             REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_maintenance_dates CHECK (
        completion_date IS NULL OR start_date IS NULL OR completion_date >= start_date
    )
);

CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX idx_maintenance_reported ON maintenance_logs(reported_date);
CREATE INDEX idx_maintenance_service_type ON maintenance_logs(service_type);


-- ============================================================
-- 6. EXPENSES TABLE
-- Trip & operational expenses
-- ============================================================

CREATE TABLE expenses (
    id                  SERIAL PRIMARY KEY,
    trip_id             INTEGER         REFERENCES trips(id) ON DELETE SET NULL,
    vehicle_id          INTEGER         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id           INTEGER         REFERENCES drivers(id) ON DELETE SET NULL,
    expense_type        expense_type    NOT NULL,
    amount              DECIMAL(12,2)   NOT NULL CHECK (amount > 0),
    description         VARCHAR(500),
    receipt_url         VARCHAR(500),
    expense_date        DATE            NOT NULL DEFAULT CURRENT_DATE,
    created_by          INTEGER         REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_driver ON expenses(driver_id);
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_expenses_date ON expenses(expense_date);


-- ============================================================
-- 7. FUEL_LOGS TABLE
-- Detailed fuel fill-up records
-- ============================================================

CREATE TABLE fuel_logs (
    id                  SERIAL PRIMARY KEY,
    vehicle_id          INTEGER         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id           INTEGER         REFERENCES drivers(id) ON DELETE SET NULL,
    trip_id             INTEGER         REFERENCES trips(id) ON DELETE SET NULL,
    liters              DECIMAL(8,2)    NOT NULL CHECK (liters > 0),
    cost_per_liter      DECIMAL(8,2)    NOT NULL CHECK (cost_per_liter > 0),
    total_cost          DECIMAL(12,2)   NOT NULL GENERATED ALWAYS AS (liters * cost_per_liter) STORED,
    odometer_at_fill    DECIMAL(12,2)   NOT NULL CHECK (odometer_at_fill >= 0),
    fuel_station        VARCHAR(200),
    fuel_date           DATE            NOT NULL DEFAULT CURRENT_DATE,
    created_by          INTEGER         REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_driver ON fuel_logs(driver_id);
CREATE INDEX idx_fuel_trip ON fuel_logs(trip_id);
CREATE INDEX idx_fuel_date ON fuel_logs(fuel_date);


-- ============================================================
-- 8. DRIVER_COMPLAINTS TABLE
-- Track complaints against drivers
-- ============================================================

CREATE TABLE driver_complaints (
    id                  SERIAL PRIMARY KEY,
    driver_id           INTEGER             NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    trip_id             INTEGER             REFERENCES trips(id) ON DELETE SET NULL,
    complaint_type      complaint_type      NOT NULL,
    description         TEXT                NOT NULL,
    severity            severity_level      NOT NULL DEFAULT 'medium',
    status              complaint_status    NOT NULL DEFAULT 'open',
    reported_by         INTEGER             REFERENCES users(id) ON DELETE SET NULL,
    resolved_at         TIMESTAMPTZ,
    resolution_notes    TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_driver ON driver_complaints(driver_id);
CREATE INDEX idx_complaints_trip ON driver_complaints(trip_id);
CREATE INDEX idx_complaints_status ON driver_complaints(status);
CREATE INDEX idx_complaints_severity ON driver_complaints(severity);


-- ============================================================
-- 9. VEHICLE_DOCUMENTS TABLE
-- Insurance, registration & compliance docs
-- ============================================================

CREATE TABLE vehicle_documents (
    id                  SERIAL PRIMARY KEY,
    vehicle_id          INTEGER         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type       document_type   NOT NULL,
    document_number     VARCHAR(100)    NOT NULL,
    issue_date          DATE            NOT NULL,
    expiry_date         DATE            NOT NULL,
    document_url        VARCHAR(500),
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_doc_dates CHECK (expiry_date >= issue_date),
    CONSTRAINT uq_vehicle_doc_type UNIQUE (vehicle_id, document_type, document_number)
);

CREATE INDEX idx_vdocs_vehicle ON vehicle_documents(vehicle_id);
CREATE INDEX idx_vdocs_expiry ON vehicle_documents(expiry_date);
CREATE INDEX idx_vdocs_type ON vehicle_documents(document_type);


-- ============================================================
-- 10. AUDIT_LOG TABLE
-- System-wide action tracking for accountability
-- ============================================================

CREATE TABLE audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             INTEGER         REFERENCES users(id) ON DELETE SET NULL,
    action              VARCHAR(100)    NOT NULL,             -- e.g. 'CREATE_TRIP', 'UPDATE_VEHICLE'
    entity_type         VARCHAR(50)     NOT NULL,             -- e.g. 'trip', 'vehicle', 'driver'
    entity_id           INTEGER,
    old_values          JSONB,
    new_values          JSONB,
    ip_address          INET,
    user_agent          VARCHAR(500),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);


-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- ---------------------------------------------------------
-- Auto-update `updated_at` on any row change
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated       BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_vehicles_updated    BEFORE UPDATE ON vehicles          FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_drivers_updated     BEFORE UPDATE ON drivers           FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_trips_updated       BEFORE UPDATE ON trips             FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_maintenance_updated BEFORE UPDATE ON maintenance_logs  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_expenses_updated    BEFORE UPDATE ON expenses          FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_complaints_updated  BEFORE UPDATE ON driver_complaints FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_vdocs_updated       BEFORE UPDATE ON vehicle_documents FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- ---------------------------------------------------------
-- Prevent cargo overload: block trip if cargo > vehicle capacity
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_cargo_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity DECIMAL(10,2);
BEGIN
    SELECT max_load_capacity_kg INTO v_capacity
    FROM vehicles WHERE id = NEW.vehicle_id;

    IF NEW.cargo_weight_kg > v_capacity THEN
        RAISE EXCEPTION 'Cargo weight (% kg) exceeds vehicle max capacity (% kg)',
            NEW.cargo_weight_kg, v_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_cargo_capacity
    BEFORE INSERT OR UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_cargo_capacity();


-- ---------------------------------------------------------
-- Auto-set vehicle to 'in_shop' when maintenance is created
-- Auto-set vehicle back to 'idle' when maintenance is completed
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_maintenance_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new maintenance record is created or set to in_progress
    IF (TG_OP = 'INSERT' AND NEW.status IN ('new', 'in_progress'))
       OR (TG_OP = 'UPDATE' AND NEW.status IN ('new', 'in_progress') AND OLD.status NOT IN ('new', 'in_progress'))
    THEN
        UPDATE vehicles SET status = 'in_shop' WHERE id = NEW.vehicle_id;
    END IF;

    -- When maintenance is completed or cancelled, set vehicle back to idle
    IF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'cancelled')
       AND OLD.status IN ('new', 'in_progress')
    THEN
        UPDATE vehicles SET status = 'idle' WHERE id = NEW.vehicle_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_vehicle_status
    AFTER INSERT OR UPDATE ON maintenance_logs
    FOR EACH ROW
    EXECUTE FUNCTION fn_maintenance_vehicle_status();


-- ---------------------------------------------------------
-- Auto-update vehicle status on trip status change
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_trip_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When trip goes to in_transit, set vehicle to on_trip
    IF NEW.status = 'in_transit' AND (OLD IS NULL OR OLD.status != 'in_transit') THEN
        UPDATE vehicles SET status = 'on_trip' WHERE id = NEW.vehicle_id;
        UPDATE drivers SET duty_status = 'on_duty', is_available = FALSE WHERE id = NEW.driver_id;
    END IF;

    -- When trip is delivered or cancelled, free up vehicle and driver
    IF NEW.status IN ('delivered', 'cancelled') AND OLD.status = 'in_transit' THEN
        UPDATE vehicles SET status = 'idle' WHERE id = NEW.vehicle_id;
        UPDATE drivers SET duty_status = 'off_duty', is_available = TRUE WHERE id = NEW.driver_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trip_vehicle_status
    AFTER INSERT OR UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION fn_trip_vehicle_status();


-- ---------------------------------------------------------
-- Block trip assignment if driver's license is expired
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_driver_license()
RETURNS TRIGGER AS $$
DECLARE
    v_license_expiry DATE;
    v_duty_status    duty_status;
BEGIN
    SELECT license_expiry, duty_status INTO v_license_expiry, v_duty_status
    FROM drivers WHERE id = NEW.driver_id;

    IF v_license_expiry < CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot assign trip: Driver license expired on %', v_license_expiry;
    END IF;

    IF v_duty_status = 'suspended' THEN
        RAISE EXCEPTION 'Cannot assign trip: Driver is currently suspended';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_driver_license
    BEFORE INSERT OR UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_driver_license();


-- ---------------------------------------------------------
-- Block trip if vehicle is not idle (prevent double-booking)
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_check_vehicle_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_status vehicle_status;
BEGIN
    -- Only check on new trip creation or when vehicle_id changes
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.vehicle_id != OLD.vehicle_id) THEN
        SELECT status INTO v_status FROM vehicles WHERE id = NEW.vehicle_id;

        IF v_status != 'idle' THEN
            RAISE EXCEPTION 'Cannot assign trip: Vehicle is currently "%". Only idle vehicles can be dispatched.',
                v_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_vehicle_availability
    BEFORE INSERT OR UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_vehicle_availability();


-- ---------------------------------------------------------
-- Auto-update driver stats on complaint
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_update_driver_complaint_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE drivers
        SET total_complaints = total_complaints + 1
        WHERE id = NEW.driver_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE drivers
        SET total_complaints = GREATEST(total_complaints - 1, 0)
        WHERE id = OLD.driver_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_driver_complaints
    AFTER INSERT OR DELETE ON driver_complaints
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_driver_complaint_count();


-- ---------------------------------------------------------
-- Auto-update vehicle odometer from fuel logs
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_update_odometer_from_fuel()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicles
    SET current_odometer_km = GREATEST(current_odometer_km, NEW.odometer_at_fill)
    WHERE id = NEW.vehicle_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_odometer
    AFTER INSERT ON fuel_logs
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_odometer_from_fuel();


-- ============================================================
-- VIEWS (for Dashboard & Analytics)
-- ============================================================

-- ---------------------------------------------------------
-- Dashboard KPIs
-- ---------------------------------------------------------

CREATE VIEW vw_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM vehicles WHERE status = 'on_trip' AND is_active = TRUE)
        AS active_fleet,
    (SELECT COUNT(*) FROM vehicles WHERE status = 'in_shop' AND is_active = TRUE)
        AS maintenance_alerts,
    (SELECT
        CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
                COUNT(*) FILTER (WHERE status IN ('on_trip')) * 100.0 / COUNT(*),
                1
            )
        END
     FROM vehicles WHERE is_active = TRUE AND status != 'retired')
        AS utilization_rate,
    (SELECT COUNT(*) FROM trips WHERE status = 'scheduled')
        AS pending_cargo;


-- ---------------------------------------------------------
-- Vehicle cost summary (fuel + maintenance)
-- ---------------------------------------------------------

CREATE VIEW vw_vehicle_cost_summary AS
SELECT
    v.id                    AS vehicle_id,
    v.license_plate,
    v.make,
    v.model,
    COALESCE(fuel.total_fuel, 0)        AS total_fuel_cost,
    COALESCE(maint.total_maint, 0)      AS total_maintenance_cost,
    COALESCE(fuel.total_fuel, 0) + COALESCE(maint.total_maint, 0)
                                        AS total_cost,
    COALESCE(trip.total_revenue, 0)     AS total_revenue,
    COALESCE(trip.total_revenue, 0) - (COALESCE(fuel.total_fuel, 0) + COALESCE(maint.total_maint, 0))
                                        AS net_profit,
    COALESCE(trip.total_trips, 0)       AS total_trips,
    COALESCE(fuel.total_liters, 0)      AS total_fuel_liters,
    CASE
        WHEN COALESCE(fuel.total_liters, 0) > 0
        THEN ROUND(COALESCE(trip.total_distance, 0) / fuel.total_liters, 2)
        ELSE 0
    END                                 AS km_per_liter
FROM vehicles v
LEFT JOIN (
    SELECT vehicle_id,
           SUM(total_cost) AS total_fuel,
           SUM(liters)     AS total_liters
    FROM fuel_logs GROUP BY vehicle_id
) fuel ON fuel.vehicle_id = v.id
LEFT JOIN (
    SELECT vehicle_id,
           SUM(cost) AS total_maint
    FROM maintenance_logs
    WHERE status = 'completed'
    GROUP BY vehicle_id
) maint ON maint.vehicle_id = v.id
LEFT JOIN (
    SELECT vehicle_id,
           SUM(revenue)     AS total_revenue,
           SUM(distance_km) AS total_distance,
           COUNT(*)         AS total_trips
    FROM trips
    WHERE status = 'delivered'
    GROUP BY vehicle_id
) trip ON trip.vehicle_id = v.id
WHERE v.is_active = TRUE;


-- ---------------------------------------------------------
-- Driver performance overview
-- ---------------------------------------------------------

CREATE VIEW vw_driver_performance AS
SELECT
    d.id                    AS driver_id,
    u.first_name || ' ' || u.last_name AS driver_name,
    d.license_number,
    d.license_expiry,
    CASE WHEN d.license_expiry < CURRENT_DATE THEN TRUE ELSE FALSE END AS license_expired,
    d.safety_score,
    d.completion_rate,
    d.total_trips,
    d.total_complaints,
    d.duty_status,
    d.is_available,
    COALESCE(t.completed_trips, 0)  AS completed_trips,
    COALESCE(t.cancelled_trips, 0)  AS cancelled_trips
FROM drivers d
JOIN users u ON u.id = d.user_id
LEFT JOIN (
    SELECT driver_id,
           COUNT(*) FILTER (WHERE status = 'delivered')  AS completed_trips,
           COUNT(*) FILTER (WHERE status = 'cancelled')  AS cancelled_trips
    FROM trips GROUP BY driver_id
) t ON t.driver_id = d.id;


-- ---------------------------------------------------------
-- Monthly financial summary
-- ---------------------------------------------------------

CREATE VIEW vw_monthly_financial_summary AS
SELECT
    DATE_TRUNC('month', t.actual_arrival)::DATE     AS month,
    SUM(t.revenue)                                  AS total_revenue,
    COALESCE(SUM(fuel.fuel_cost), 0)                AS total_fuel_cost,
    COALESCE(SUM(maint.maint_cost), 0)              AS total_maintenance_cost,
    SUM(t.revenue)
        - COALESCE(SUM(fuel.fuel_cost), 0)
        - COALESCE(SUM(maint.maint_cost), 0)        AS net_profit
FROM trips t
LEFT JOIN (
    SELECT trip_id, SUM(total_cost) AS fuel_cost
    FROM fuel_logs
    WHERE trip_id IS NOT NULL
    GROUP BY trip_id
) fuel ON fuel.trip_id = t.id
LEFT JOIN (
    SELECT vehicle_id,
           DATE_TRUNC('month', completion_date) AS month,
           SUM(cost) AS maint_cost
    FROM maintenance_logs
    WHERE status = 'completed'
    GROUP BY vehicle_id, DATE_TRUNC('month', completion_date)
) maint ON maint.vehicle_id = t.vehicle_id
       AND maint.month = DATE_TRUNC('month', t.actual_arrival)
WHERE t.status = 'delivered'
  AND t.actual_arrival IS NOT NULL
GROUP BY DATE_TRUNC('month', t.actual_arrival)
ORDER BY month DESC;


-- ============================================================
-- SEED DATA (Optional - for testing)
-- ============================================================

-- Insert a default admin user (password: admin123 - bcrypt hash placeholder)
INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
VALUES ('admin', 'admin@fleetflow.com', '$2b$10$placeholder_hash_replace_me', 'admin', 'System', 'Admin', '+91-9999999999');
