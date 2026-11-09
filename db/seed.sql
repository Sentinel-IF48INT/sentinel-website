-- ============================================================================
--  SENTINEL — Seed data (demo accounts + 15 whitelisted benchmark destinations)
--  Run after schema.sql:  psql -U postgres -d sentinel -f db/seed.sql
--  Demo password for BOTH accounts:  Sentinel@2026
--
--  Week #8: extended from 4 to all 15 benchmark countries (UC-1 / UC-10 / UC-2).
--  ORDER MATTERS — country_id (SERIAL) follows lib/destination-catalog.ts so the
--  PostgreSQL data source and the "demo-seed" fallback expose identical ids:
--    1 JPN | 2 AUS | 3 FRA | 4 SYR | 5 CHE | 6 SGP | 7 NZL | 8 THA
--    9 TUR | 10 BRA | 11 EGY | 12 MLI | 13 HTI | 14 YEM | 15 SOM
--  Exactly one alert and one KBRI contact per destination, inserted in the same
--  order, so alert_id = contact_id = country_id. All hotlines are DEMO values.
-- ============================================================================

INSERT INTO Users (email, username, first_name, last_name, user_role, password_hash) VALUES
('raka.pratama@email.com',  'rakapratama',  'Raka',  'Pratama', 'TRAVELER',
 'scrypt$5e4711e1a7a0b1c2d3e4f5a6b7c8d9e0$7839585252e91229bc6801c241d344a7bb47429e4548d0a30652ccd5dfa73141'),
('dimas.handoko@email.com', 'dimashandoko', 'Dimas', 'Handoko', 'ADMINISTRATOR',
 'scrypt$d1a5a0c0c0ffee00b1015000000000a1$bd4a6e5e583908abf975c60a7b070013543aa929deb524be0ffbf759e6cce8a0');

INSERT INTO Destination (country_name, iso_alpha_3_code, is_whitelisted, risk_category, general_info) VALUES
('Japan',       'JPN', TRUE, 'LOW',      'Exercise normal safety precautions. Japan maintains very low violent crime rates and high public transport reliability for WNI travelers.'),
('Australia',   'AUS', TRUE, 'LOW',      'Exercise normal precautions. Urban centers are safe; observe biosecurity rules and seasonal bushfire advisories.'),
('France',      'FRA', TRUE, 'ELEVATED', 'Exercise increased caution in France due to elevated Vigipirate security posture, urban demonstrations, and transit pickpocketing.'),
('Syria',       'SYR', TRUE, 'CRITICAL', 'DO NOT TRAVEL. Ongoing armed hostilities, airstrikes, unexploded ordnance, and severe infrastructure damage.'),
('Switzerland', 'CHE', TRUE, 'LOW',      'Exercise normal precautions. Public security and infrastructure across Swiss cantons remain highly stable.'),
('Singapore',   'SGP', TRUE, 'LOW',      'Exercise normal precautions. Singapore enforces strict public order regulations and maintains very low crime rates.'),
('New Zealand', 'NZL', TRUE, 'LOW',      'Exercise normal safety precautions. New Zealand has a stable security environment and strong emergency infrastructure.'),
('Thailand',    'THA', TRUE, 'ELEVATED', 'Exercise increased caution due to periodic rallies in Bangkok and martial law restrictions in far southern border provinces.'),
('Turkey',      'TUR', TRUE, 'ELEVATED', 'Reconsider travel to southeastern border zones and exercise increased caution nationwide due to security operations.'),
('Brazil',      'BRA', TRUE, 'ELEVATED', 'Exercise increased caution in Brazil due to high rates of urban armed robbery and gang activity in informal settlements.'),
('Egypt',       'EGY', TRUE, 'ELEVATED', 'Reconsider travel to North Sinai and Western Desert border corridors due to militant operations and military exclusion zones.'),
('Mali',        'MLI', TRUE, 'CRITICAL', 'DO NOT TRAVEL. Critical threat of armed conflict, kidnapping, and IED attacks across Mali.'),
('Haiti',       'HTI', TRUE, 'CRITICAL', 'DO NOT TRAVEL. Widespread armed gang violence, kidnapping for ransom, and severe infrastructure disruption.'),
('Yemen',       'YEM', TRUE, 'CRITICAL', 'DO NOT TRAVEL. Active military conflict, Red Sea maritime/aerial strikes, landmines, and acute humanitarian crisis.'),
('Somalia',     'SOM', TRUE, 'CRITICAL', 'DO NOT TRAVEL. Extreme threat of terrorist bombings, kidnapping, and maritime piracy off the Horn of Africa.');

INSERT INTO SafetyAlert (destination_country_id, risk_level, title, detail, is_active) VALUES
(1,  1, 'Seismic & Tsunami Preparedness Protocol',            'Monitor Japan Meteorological Agency (JMA) advisories and local ward evacuation signs.', TRUE),
(2,  1, 'Biosecurity & Coastal Rip Current Advisory',         'Declare all food/plant items at border control and swim only between patrolled beach flags.', TRUE),
(3,  2, 'Vigipirate Heightened Security Posture',             'Expect armed patrols and bag checks at major transport terminals, museums, and public squares.', TRUE),
(4,  4, 'CRITICAL: Active Armed Conflict & Mandatory Registration', 'All WNI remaining in Syria must maintain daily contact with the KBRI Damascus Protection Task Force.', TRUE),
(5,  1, 'Alpine Weather & Rail Transit Notice',               'Observe high-altitude trail warnings and keep valuables secure at Geneva and Zurich rail hubs.', TRUE),
(6,  1, 'Strict Customs & E-Vaporizer Prohibition',           'Importing e-cigarettes/vapes or controlled medications without prior permit carries strict penalties.', TRUE),
(7,  1, 'Alpine Tramping & Geothermal Safety',                'Register backcountry routes with DOC and stay on marked boardwalks in geothermal zones.', TRUE),
(8,  2, 'Southern Border Provinces Security Advisory',        'Avoid non-essential travel to Yala, Pattani, Narathiwat, and southern Songkhla provinces.', TRUE),
(9,  3, 'Restricted 10-km Syrian Border Zone',                'Avoid travel near Hatay, Kilis, Gaziantep, Sanliurfa, and Mardin border zones.', TRUE),
(10, 2, 'Urban Armed Robbery & Favela Exclusion',             'Do not enter informal housing developments (favelas) and use only registered transit at night.', TRUE),
(11, 3, 'North Sinai & Western Desert Exclusion Zones',       'Civilian travel to North Sinai and Libyan border corridors is strictly prohibited.', TRUE),
(12, 4, 'CRITICAL: Armed Conflict & Kidnapping Threat',       'Armed groups actively target transport corridors and foreign nationals. Remote consular support via KBRI Dakar.', TRUE),
(13, 4, 'CRITICAL: State of Emergency & Gang Blockades',      'WNI in Haiti should shelter in place and contact KBRI Havana immediately for evacuation coordination.', TRUE),
(14, 4, 'CRITICAL: Aerial Strike Hazard & Evacuation Corridor', 'Coordinate overland evacuation clearance via KBRI Muscat (Oman).', TRUE),
(15, 4, 'CRITICAL: Complex Terrorist Threat',                 'Frequent mortar and VBIED attacks in Mogadishu. Remote protection coordinated via KBRI Nairobi.', TRUE);

INSERT INTO EmergencyContact (destination_country_id, mission_name, hotline, email) VALUES
(1,  'KBRI Tokyo (Embassy of Indonesia in Japan)',            '+81-3-0000-0101 [DEMO - DO NOT DIAL]',      'consular.tokyo@demo-sentinel.id'),
(2,  'KBRI Canberra (Embassy of Indonesia in Australia)',     '+61-2-0000-0104 [DEMO - DO NOT DIAL]',      'consular.canberra@demo-sentinel.id'),
(3,  'KBRI Paris (Embassy of Indonesia in France)',           '+33-1-0000-0201 [DEMO - DO NOT DIAL]',      'consular.paris@demo-sentinel.id'),
(4,  'KBRI Damaskus (Embassy of Indonesia in Syria)',         '+963-11-000-0403 [DEMO SOS - DO NOT DIAL]', 'sos.damascus@demo-sentinel.id'),
(5,  'KBRI Bern (Embassy of Indonesia in Switzerland)',       '+41-31-000-0102 [DEMO - DO NOT DIAL]',      'consular.bern@demo-sentinel.id'),
(6,  'KBRI Singapura (Embassy of Indonesia in Singapore)',    '+65-6000-0103 [DEMO - DO NOT DIAL]',        'consular.singapore@demo-sentinel.id'),
(7,  'KBRI Wellington (Embassy of Indonesia in New Zealand)', '+64-4-000-0105 [DEMO - DO NOT DIAL]',       'consular.wellington@demo-sentinel.id'),
(8,  'KBRI Bangkok (Embassy of Indonesia in Thailand)',       '+66-2-000-0202 [DEMO - DO NOT DIAL]',       'consular.bangkok@demo-sentinel.id'),
(9,  'KBRI Ankara (Embassy of Indonesia in Turkiye)',         '+90-312-000-0301 [DEMO - DO NOT DIAL]',     'consular.ankara@demo-sentinel.id'),
(10, 'KBRI Brasilia (Embassy of Indonesia in Brazil)',        '+55-61-0000-0204 [DEMO - DO NOT DIAL]',     'consular.brasilia@demo-sentinel.id'),
(11, 'KBRI Kairo (Embassy of Indonesia in Egypt)',            '+20-2-0000-0302 [DEMO - DO NOT DIAL]',      'consular.cairo@demo-sentinel.id'),
(12, 'KBRI Dakar (Accredited to Republic of Mali)',           '+221-33-000-0401 [DEMO SOS - DO NOT DIAL]', 'sos.dakar-mali@demo-sentinel.id'),
(13, 'KBRI Havana (Accredited to Republic of Haiti)',         '+53-7-000-0402 [DEMO SOS - DO NOT DIAL]',   'sos.havana-haiti@demo-sentinel.id'),
(14, 'KBRI Muscat (Accredited Evacuation Mission for Yemen)', '+968-24-000-0404 [DEMO SOS - DO NOT DIAL]', 'sos.muscat-yemen@demo-sentinel.id'),
(15, 'KBRI Nairobi (Accredited to Somalia)',                  '+254-20-000-0405 [DEMO SOS - DO NOT DIAL]', 'sos.nairobi-somalia@demo-sentinel.id');

INSERT INTO Watchlist (user_id, destination_country_id, reminder_note) VALUES
(1, 1, 'Check JR Pass validity before departure'),
(1, 2, 'Declare food items at customs');
