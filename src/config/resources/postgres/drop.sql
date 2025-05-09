
-- Tabellen in umgekehrter Abhängigkeits‑Reihenfolge löschen
DROP TABLE IF EXISTS supplement.produktbild  CASCADE;
DROP TABLE IF EXISTS supplement.beschreibung CASCADE;
DROP TABLE IF EXISTS supplement.supplement   CASCADE;

-- ENUM‑Typ löschen
DROP TYPE IF EXISTS supplement.supplementart;
