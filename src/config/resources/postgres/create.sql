/*------------------------------------------------------------------------------
   Supplement-Datenbankschema  –  Stand 09.05.2025
   Lizenz: GNU GPL v3
------------------------------------------------------------------------------*/

-------------------------------------------------------------------------------
-- 0)  Schema anlegen und Suchpfad setzen
-------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION supplement;
ALTER ROLE supplement SET search_path = 'supplement';

-------------------------------------------------------------------------------
-- 1)  ENUM-Typ für supplement_art
-------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'supplement'
           AND t.typname  = 'supplement_art'        -- snake_case!
    ) THEN
        CREATE TYPE supplement.supplement_art AS ENUM (
            'pulver',
            'tabletten',
            'kapseln'
        );
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2)  Haupttabelle supplement
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplement.supplement (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name            varchar NOT NULL,
    portionen       varchar,
    supplement_art  supplement.supplement_art,   -- snake_case Spaltenname

    erzeugt         timestamp NOT NULL DEFAULT NOW(),
    aktualisiert    timestamp NOT NULL DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- 3)  1 : 1-Tabelle beschreibung  (PK = eigene ID, FK UNIQUE)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplement.beschreibung (
    id                    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    info                  varchar,
    vorteile              varchar,
    dosieremphehlug       varchar,

    supplement_id         integer NOT NULL UNIQUE
        REFERENCES supplement.supplement(id)
);

-------------------------------------------------------------------------------
-- 4)  1 : n-Tabelle produktbild
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supplement.produktbild (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    bezeichnung     varchar NOT NULL,
    path            varchar,

    supplement_id   integer NOT NULL
        REFERENCES supplement.supplement(id)
);

CREATE INDEX IF NOT EXISTS produktbild_supplement_id_idx
    ON supplement.produktbild (supplement_id);
