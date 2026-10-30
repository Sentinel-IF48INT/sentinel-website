-- ============================================================================
--  SENTINEL — Seed data (demo accounts + sample destinations)
--  Run after schema.sql:  psql -U postgres -d sentinel -f db/seed.sql
--  Demo password for BOTH accounts:  Sentinel@2026
-- ============================================================================

INSERT INTO Users (email, username, first_name, last_name, user_role, password_hash) VALUES
('raka.pratama@email.com',  'rakapratama',  'Raka',  'Pratama', 'TRAVELER',
 'scrypt$5e4711e1a7a0b1c2d3e4f5a6b7c8d9e0$7839585252e91229bc6801c241d344a7bb47429e4548d0a30652ccd5dfa73141'),
('dimas.handoko@email.com', 'dimashandoko', 'Dimas', 'Handoko', 'ADMINISTRATOR',
 'scrypt$d1a5a0c0c0ffee00b1015000000000a1$bd4a6e5e583908abf975c60a7b070013543aa929deb524be0ffbf759e6cce8a0');

INSERT INTO Destination (country_name, iso_alpha_3_code, is_whitelisted, risk_category, general_info) VALUES
('Japan',     'JPN', TRUE, 'LOW',      'Exercise normal safety precautions.'),
('Australia', 'AUS', TRUE, 'LOW',      'Exercise normal precautions; observe biosecurity rules.'),
('France',    'FRA', TRUE, 'ELEVATED', 'Exercise increased caution (Vigipirate posture).'),
('Syria',     'SYR', TRUE, 'CRITICAL', 'DO NOT TRAVEL. Ongoing armed hostilities.');

INSERT INTO SafetyAlert (destination_country_id, risk_level, title, detail, is_active) VALUES
(1, 1, 'Seismic & Tsunami Preparedness Protocol', 'Monitor JMA advisories.', TRUE),
(3, 2, 'Vigipirate Heightened Security Posture',  'Expect armed patrols and bag checks.', TRUE),
(4, 4, 'CRITICAL: Active Armed Conflict',          'Maintain daily contact with KBRI Damascus.', TRUE);

INSERT INTO EmergencyContact (destination_country_id, mission_name, hotline, email) VALUES
(1, 'KBRI Tokyo',     '+81-3-0000-0101 [DEMO]',   'consular.tokyo@demo-sentinel.id'),
(2, 'KBRI Canberra',  '+61-2-0000-0104 [DEMO]',   'consular.canberra@demo-sentinel.id'),
(3, 'KBRI Paris',     '+33-1-0000-0201 [DEMO]',   'consular.paris@demo-sentinel.id'),
(4, 'KBRI Damaskus',  '+963-11-000-0403 [DEMO]',  'sos.damascus@demo-sentinel.id');

INSERT INTO Watchlist (user_id, destination_country_id, reminder_note) VALUES
(1, 1, 'Check JR Pass validity before departure'),
(1, 2, 'Declare food items at customs');
