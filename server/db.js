// Accès à la base de données.
// En production : MySQL via le pilote mysql2 (variable MYSQL_URL ou DATABASE_URL).
// En test local : DB_CLIENT=sqlite utilise la base SQLite intégrée à Node 22,
// avec les mêmes requêtes. Le reste du serveur ne voit que l'interface ci-dessous :
//   all(sql, params) → lignes   get(sql, params) → 1re ligne ou null
//   run(sql, params) → { insertId, changes }   tx(async (db) => …) → transaction

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA = path.join(ICI, '..', 'database', 'mysql', 'schema.sql');

// Date UTC au format DATETIME (« 2026-11-19 08:30:00 »).
export const maintenant = (decalageMs = 0) => new Date(Date.now() + decalageMs).toISOString().slice(0, 19).replace('T', ' ');

function instructions(script) {
  return script
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Traduction minimale du schéma MySQL pour SQLite (tests locaux uniquement).
function versSqlite(sql) {
  return sql
    .replace(/INT\s+AUTO_INCREMENT PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/\)\s*ENGINE=InnoDB[^;]*$/g, ')');
}

async function mysqlDb() {
  const mysql = await import('mysql2/promise');
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const options = {
    waitForConnections: true,
    connectionLimit: 8,
    dateStrings: true,
    timezone: 'Z',
    charset: 'utf8mb4',
    supportBigNumbers: true,
  };
  const pool = url
    ? mysql.createPool({ uri: url, ...options })
    : mysql.createPool({
        host: process.env.MYSQLHOST || '127.0.0.1',
        port: Number(process.env.MYSQLPORT || 3306),
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQLDATABASE || 'caip',
        ...options,
      });

  const sur = (conn) => ({
    async all(sql, params = []) {
      const [rows] = await conn.query(sql, params);
      return rows;
    },
    async get(sql, params = []) {
      const [rows] = await conn.query(sql, params);
      return rows[0] ?? null;
    },
    async run(sql, params = []) {
      const [r] = await conn.query(sql, params);
      return { insertId: r.insertId, changes: r.affectedRows };
    },
  });

  const db = sur(pool);
  db.client = 'mysql';
  db.exec = async (script) => {
    for (const s of instructions(script)) await pool.query(s);
  };
  db.tx = async (fn) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const res = await fn(sur(conn));
      await conn.commit();
      return res;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  };
  db.close = () => pool.end();
  return db;
}

async function sqliteDb() {
  const { DatabaseSync } = await import('node:sqlite');
  const fichier = process.env.SQLITE_FILE || ':memory:';
  const base = new DatabaseSync(fichier);
  base.exec('PRAGMA foreign_keys = ON');
  const norm = (p) => p.map((v) => (typeof v === 'boolean' ? Number(v) : v === undefined ? null : v));
  const clean = (row) => (row ? Object.fromEntries(Object.entries(row)) : null);
  const db = {
    client: 'sqlite',
    async all(sql, params = []) {
      return base.prepare(sql).all(...norm(params)).map(clean);
    },
    async get(sql, params = []) {
      return clean(base.prepare(sql).get(...norm(params)));
    },
    async run(sql, params = []) {
      const r = base.prepare(sql).run(...norm(params));
      return { insertId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async exec(script) {
      for (const s of instructions(script)) base.exec(versSqlite(s));
    },
    async tx(fn) {
      base.exec('BEGIN');
      try {
        const res = await fn(db);
        base.exec('COMMIT');
        return res;
      } catch (e) {
        base.exec('ROLLBACK');
        throw e;
      }
    },
    close() {
      base.close();
    },
  };
  return db;
}

// Version 2 (annulée) avait ajouté 50 CV et 50 lettres par métier.
// Version 3 les retire de la base : lettres « Lettre … · … » et CV listés ci-dessous.
const CV_RETIRES = ["CV Assistant(e) administratif(ve)", "CV Secrétaire de direction", "CV Agent d’accueil", "CV Assistant(e) ressources humaines", "CV Archiviste-documentaliste", "CV Agent administratif de la fonction publique", "CV Assistant(e) comptable", "CV Comptable", "CV Caissier(ère) de banque", "CV Chargé(e) de clientèle bancaire", "CV Contrôleur(se) de gestion junior", "CV Agent de recouvrement", "CV Vendeur(se) en magasin", "CV Commercial(e) terrain", "CV Responsable de boutique", "CV Caissier(ère)", "CV Conseiller(ère) client", "CV Chargé(e) de marketing digital", "CV Agent logistique", "CV Magasinier(ère)", "CV Déclarant(e) en douane", "CV Agent de transit", "CV Conducteur(trice) d’engins portuaires", "CV Chauffeur poids lourd", "CV Agent d’exploitation portuaire", "CV Électricien(ne) du bâtiment", "CV Technicien(ne) de maintenance industrielle", "CV Maçon(ne)", "CV Plombier(ère)", "CV Technicien(ne) froid et climatisation", "CV Soudeur(se)", "CV Conducteur(trice) de travaux junior", "CV Technicien(ne) support informatique", "CV Développeur(se) web", "CV Administrateur(trice) réseaux", "CV Technicien(ne) télécoms", "CV Analyste de données junior", "CV Infirmier(ère)", "CV Aide-soignant(e)", "CV Sage-femme", "CV Préparateur(trice) en pharmacie", "CV Agent de santé communautaire", "CV Réceptionniste d’hôtel", "CV Serveur(se)", "CV Cuisinier(ère)", "CV Guide touristique", "CV Valet ou femme de chambre", "CV Enseignant(e) du primaire", "CV Formateur(trice) pour adultes", "CV Animateur(trice) jeunesse"];

const MIGRATIONS = [
  [3, async (db) => {
    await db.run("DELETE FROM modele WHERE nom LIKE 'Lettre % · %'");
    for (const nom of CV_RETIRES) await db.run('DELETE FROM modele WHERE nom = ?', [nom]);
  }],
];

export async function ouvrirBase() {
  const db = process.env.DB_CLIENT === 'sqlite' ? await sqliteDb() : await mysqlDb();
  // Première mise en route : crée les tables si la base est vide.
  let version = 0;
  try {
    const r = await db.get('SELECT MAX(version) AS v FROM schema_version');
    version = Number(r?.v || 0);
  } catch {
    version = 0;
  }
  if (version < 1) {
    await db.exec(readFileSync(SCHEMA, 'utf8'));
    const { remplir } = await import('./seed.js');
    await remplir(db);
    console.log('[caip] Base créée et données de démonstration ajoutées.');
    version = 1;
  }
  // Évolutions suivantes, appliquées une seule fois chacune.
  for (const [v, appliquer] of MIGRATIONS) {
    if (version >= v) continue;
    await appliquer(db);
    await db.run('INSERT INTO schema_version (version) VALUES (?)', [v]);
    console.log(`[caip] Migration ${v} appliquée.`);
  }
  return db;
}
