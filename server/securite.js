// Mots de passe, jetons et cookies, avec le seul module crypto de Node.
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const N = 16384;

export async function hacherMotDePasse(motDePasse) {
  const sel = randomBytes(16);
  const cle = await scryptAsync(motDePasse, sel, 64, { N, r: 8, p: 1 });
  return `scrypt$${N}$${sel.toString('base64')}$${cle.toString('base64')}`;
}

export async function verifierMotDePasse(motDePasse, stocke) {
  const [algo, n, selB64, cleB64] = String(stocke || '').split('$');
  if (algo !== 'scrypt') return false;
  const attendu = Buffer.from(cleB64, 'base64');
  const cle = await scryptAsync(motDePasse, Buffer.from(selB64, 'base64'), attendu.length, { N: Number(n), r: 8, p: 1 });
  return timingSafeEqual(cle, attendu);
}

export const jeton = () => randomBytes(32).toString('base64url');
export const empreinte = (valeur) => createHash('sha256').update(valeur).digest('hex');

export function lireCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(nom, valeur, { maxAge, secure }) {
  const parts = [`${nom}=${encodeURIComponent(valeur)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

// Règles communes aux formulaires.
export const emailValide = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''));
export const MOT_DE_PASSE_MIN = 8;
