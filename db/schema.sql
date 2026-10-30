-- ============================================================================
--  SENTINEL — PostgreSQL schema (Week #5 schema + Week #6 auth refinement)
--  Group: Bluish Pinkies Coco Puff
--  Run:   psql -U postgres -d sentinel -f db/schema.sql
-- ============================================================================

DROP TABLE IF EXISTS Watchlist;
DROP TABLE IF EXISTS EmergencyContact;
DROP TABLE IF EXISTS SafetyAlert;
DROP TABLE IF EXISTS Destination;
DROP TABLE IF EXISTS Users;

-- 1. Users ------------------------------------------------------------------
CREATE TABLE Users (
    user_id       SERIAL        PRIMARY KEY,
    email         VARCHAR(254)  NOT NULL UNIQUE,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL DEFAULT '',
    user_role     VARCHAR(20)   NOT NULL CHECK (user_role IN ('TRAVELER', 'ADMINISTRATOR')),
    -- Week #6 refinement: credential attribute required by UC-5 Login
    password_hash VARCHAR(255)  NOT NULL
);
CREATE UNIQUE INDEX idx_users_email_lower ON Users (LOWER(email));

-- 2. Destination ------------------------------------------------------------
CREATE TABLE Destination (
    country_id       SERIAL       PRIMARY KEY,
    country_name     VARCHAR(100) NOT NULL,
    iso_alpha_3_code CHAR(3)      NOT NULL UNIQUE,
    is_whitelisted   BOOLEAN      NOT NULL DEFAULT FALSE,
    risk_category    VARCHAR(10)  NOT NULL CHECK (risk_category IN ('LOW', 'ELEVATED', 'CRITICAL')),
    general_info     TEXT
);

-- 3. SafetyAlert ------------------------------------------------------------
CREATE TABLE SafetyAlert (
    alert_id               SERIAL       PRIMARY KEY,
    destination_country_id INT          NOT NULL REFERENCES Destination(country_id) ON DELETE CASCADE,
    risk_level             SMALLINT     NOT NULL CHECK (risk_level BETWEEN 1 AND 4),
    title                  VARCHAR(200) NOT NULL,
    detail                 TEXT         NOT NULL,
    is_active              BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 4. EmergencyContact -------------------------------------------------------
CREATE TABLE EmergencyContact (
    contact_id             SERIAL       PRIMARY KEY,
    destination_country_id INT          NOT NULL REFERENCES Destination(country_id) ON DELETE CASCADE,
    mission_name           VARCHAR(200) NOT NULL,
    hotline                VARCHAR(50)  NOT NULL,
    email                  VARCHAR(254)
);

-- 5. Watchlist (association User ↔ Destination) -----------------------------
CREATE TABLE Watchlist (
    watchlist_id           SERIAL      PRIMARY KEY,
    user_id                INT         NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    destination_country_id INT         NOT NULL REFERENCES Destination(country_id) ON DELETE CASCADE,
    reminder_note          VARCHAR(255),
    saved_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_watchlist_user_destination UNIQUE (user_id, destination_country_id)
);
