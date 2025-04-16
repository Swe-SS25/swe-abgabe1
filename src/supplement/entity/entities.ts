import { Beschreibung } from './beschreibung.entity.js';
import { Produktbild } from './produktbild.entity.js';
import { Supplement } from './supplement.entity.js';


// erforderlich in src/config/db.ts und src/buch/buch.module.ts
export const entities = [Supplement, Produktbild, Beschreibung];
