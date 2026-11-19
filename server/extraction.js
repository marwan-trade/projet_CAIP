// Extraction du texte d'un PDF ou d'un DOCX, sans bibliothèque externe.
// Suffisant pour l'analyse par règles ; un PDF scanné (image) ne donne pas de texte.
import { inflateRawSync, inflateSync } from 'node:zlib';

// ---------- DOCX : une archive ZIP qui contient word/document.xml ----------
function lireZip(buf, cible) {
  // Fin du répertoire central : signature 0x06054b50, cherchée depuis la fin.
  let fin = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) return null;
  const nb = buf.readUInt16LE(fin + 10);
  let p = buf.readUInt32LE(fin + 16);
  for (let k = 0; k < nb; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const methode = buf.readUInt16LE(p + 10);
    const taille = buf.readUInt32LE(p + 20);
    const lNom = buf.readUInt16LE(p + 28);
    const lExtra = buf.readUInt16LE(p + 30);
    const lCom = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nom = buf.toString('utf8', p + 46, p + 46 + lNom);
    if (nom === cible) {
      const debut = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(debut, debut + taille);
      return methode === 0 ? data : inflateRawSync(data);
    }
    p += 46 + lNom + lExtra + lCom;
  }
  return null;
}

const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function texteDocx(buf) {
  const xml = lireZip(buf, 'word/document.xml');
  if (!xml) return '';
  return xml
    .toString('utf8')
    .replace(/<w:tab\/>/g, ' ')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ENTITES[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

// ---------- PDF : texte des opérateurs Tj / TJ dans les flux ----------
function chainePdf(s) {
  return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, c) => {
    if (/^[0-7]+$/.test(c)) return String.fromCharCode(parseInt(c, 8));
    return { n: '\n', r: '', t: ' ', b: '', f: '', '(': '(', ')': ')', '\\': '\\' }[c];
  });
}

// Chaînes hexadécimales : 1 octet par caractère (polices standard) ou
// 2 octets par glyphe (polices Word/Canva), décodés grâce aux tables ToUnicode.
function hexPdf(hex, carte) {
  const h = hex.replace(/\s+/g, '');
  if (carte.size && h.length % 4 === 0) {
    let out = '';
    let connus = 0;
    for (let i = 0; i < h.length; i += 4) {
      const c = carte.get(h.slice(i, i + 4).toUpperCase());
      if (c !== undefined) { out += c; connus++; }
    }
    if (connus * 2 >= h.length / 4) return out;
  }
  let out = '';
  for (let i = 0; i < h.length; i += 2) out += String.fromCharCode(parseInt(h.slice(i, i + 2), 16) || 32);
  return out;
}

function texteFlux(contenu, carte) {
  const out = [];
  const re = /\[((?:[^\]\\]|\\.)*)\]\s*TJ|\(((?:[^)\\]|\\.)*)\)\s*(?:Tj|'|")|<([0-9A-Fa-f\s]+)>\s*(?:Tj|'|")|(T\*|Td|TD|ET)/g;
  let m;
  while ((m = re.exec(contenu))) {
    if (m[1] !== undefined) {
      const parts = [...m[1].matchAll(/\(((?:[^)\\]|\\.)*)\)|<([0-9A-Fa-f\s]*)>|(-?\d+(?:\.\d+)?)/g)];
      out.push(parts.map((p) => (p[1] !== undefined ? chainePdf(p[1]) : p[2] !== undefined ? hexPdf(p[2], carte) : Number(p[3]) < -200 ? ' ' : '')).join(''));
    } else if (m[2] !== undefined) {
      out.push(chainePdf(m[2]));
    } else if (m[3] !== undefined) {
      out.push(hexPdf(m[3], carte));
    } else {
      out.push(m[4] === 'ET' ? '\n' : ' ');
    }
  }
  return out.join('');
}

const unicode = (hex) => {
  let s = '';
  for (let i = 0; i + 4 <= hex.length; i += 4) s += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
  return s;
};

// Tables ToUnicode (bfchar / bfrange) réunies en une seule carte.
function lireCarte(flux, carte) {
  for (const bloc of flux.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const [, src, dst] of bloc[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      if (src.length === 4) carte.set(src.toUpperCase(), unicode(dst));
    }
  }
  for (const bloc of flux.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const [, a, b, dst] of bloc[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      if (a.length !== 4) continue;
      const debut = parseInt(a, 16);
      const base = parseInt(dst.slice(0, 4), 16);
      for (let c = debut; c <= parseInt(b, 16) && c - debut < 512; c++) {
        carte.set(c.toString(16).toUpperCase().padStart(4, '0'), String.fromCharCode(base + c - debut));
      }
    }
  }
}

function textePdf(buf) {
  const brut = buf.toString('latin1');
  const flux = [];
  const re = /(?<!end)stream\r?\n/g;
  let m;
  while ((m = re.exec(brut))) {
    const debut = m.index + m[0].length;
    const fin = brut.indexOf('endstream', debut);
    if (fin < 0) break;
    const entete = brut.slice(Math.max(0, m.index - 400), m.index);
    let data = buf.subarray(debut, fin);
    re.lastIndex = fin + 9;
    if (/FlateDecode/.test(entete)) {
      try {
        data = inflateSync(data);
      } catch {
        try { data = inflateSync(data.subarray(0, data.length - 1)); } catch { continue; }
      }
    } else if (/Filter/.test(entete)) {
      continue; // images et autres filtres : rien à lire
    }
    flux.push(data.toString('latin1'));
  }
  const carte = new Map();
  for (const f of flux) if (f.includes('begincmap')) lireCarte(f, carte);
  return flux
    .filter((f) => !f.includes('begincmap'))
    .map((f) => texteFlux(f, carte))
    .filter((t) => t.trim())
    .join('\n');
}

export function extraireTexte(buf, nomFichier) {
  const ext = String(nomFichier || '').split('.').pop().toLowerCase();
  try {
    const texte = ext === 'docx' ? texteDocx(buf) : ext === 'pdf' ? textePdf(buf) : '';
    return texte.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  } catch {
    return '';
  }
}

// Vérifie la signature réelle du fichier, pas seulement son extension.
export function typeReel(buf) {
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (buf.readUInt32LE(0) === 0x04034b50) return 'docx';
  return null;
}
