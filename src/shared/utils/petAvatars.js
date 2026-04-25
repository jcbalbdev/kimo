/**
 * Pet Avatar System — Single source of truth
 * All avatar imports, mappings, and helper functions.
 */

// ── Image imports ────────────────────────────────────────────
import gatoIcon               from '../../assets/gatito.webp';
import gatoGrisIcon           from '../../assets/gatito-gris.webp';
import persianCatIcon         from '../../assets/persian-cat.webp';
import gatoBlancoNegroIcon    from '../../assets/gato-blanco-negro.webp';
import gatoCareyIcon          from '../../assets/gato-carey.webp';
import calicoIcon             from '../../assets/calico.webp';
import huskyIcon              from '../../assets/husky.webp';
import dalmataIcon            from '../../assets/dalmata.webp';
import viringoIcon            from '../../assets/viringo.webp';
import shihtzuIcon            from '../../assets/shihtzu.webp';
import cockerSpanielIcon      from '../../assets/cocker-spaniel.webp';
import perroPeludoBlancoIcon  from '../../assets/perrito-peludo-blanco.webp';
import perroRingoIcon         from '../../assets/perro-ringo.webp';
import bichonMaltesIcon       from '../../assets/bichon-maltes.webp';
import conejitoIcon           from '../../assets/conejito.webp';
import conejoNaranjaIcon      from '../../assets/conejo-naranja.webp';

// ── Default image per species ────────────────────────────────
export const PET_IMG = {
  cat:    gatoIcon,
  dog:    huskyIcon,
  rabbit: conejitoIcon,
};

// ── Avatar key → image mapping ───────────────────────────────
export const AVATAR_KEY_TO_IMG = {
  'img-gris':            gatoGrisIcon,
  'img-persian':         persianCatIcon,
  'img-blanco-negro':    gatoBlancoNegroIcon,
  'img-carey':           gatoCareyIcon,
  'img-calico':          calicoIcon,
  'img-husky':           huskyIcon,
  'img-dalm':            dalmataIcon,
  'img-viringo':         viringoIcon,
  'img-shihtzu':         shihtzuIcon,
  'img-cocker':          cockerSpanielIcon,
  'img-perrito-peludo':  perroPeludoBlancoIcon,
  'img-ringo':           perroRingoIcon,
  'img-bichon':          bichonMaltesIcon,
  'img-conejito':        conejitoIcon,
  'img-conejo-nrj':      conejoNaranjaIcon,
};

// ── Avatar options per species (for the avatar picker) ───────
export const SPECIES_AVATARS = {
  cat: [
    { key: 'img',                  img: gatoIcon },
    { key: 'img-gris',             img: gatoGrisIcon },
    { key: 'img-persian',          img: persianCatIcon },
    { key: 'img-blanco-negro',     img: gatoBlancoNegroIcon },
    { key: 'img-carey',            img: gatoCareyIcon },
    { key: 'img-calico',           img: calicoIcon },
  ],
  dog: [
    { key: 'img',                  img: huskyIcon },
    { key: 'img-dalm',             img: dalmataIcon },
    { key: 'img-viringo',          img: viringoIcon },
    { key: 'img-shihtzu',          img: shihtzuIcon },
    { key: 'img-cocker',           img: cockerSpanielIcon },
    { key: 'img-perrito-peludo',   img: perroPeludoBlancoIcon },
    { key: 'img-ringo',            img: perroRingoIcon },
    { key: 'img-bichon',           img: bichonMaltesIcon },
  ],
  rabbit: [
    { key: 'img',               img: conejitoIcon },
    { key: 'img-conejo-nrj',    img: conejoNaranjaIcon },
  ],
  other: [
    { key: 'img-gato',            img: gatoIcon },
    { key: 'img-gris',            img: gatoGrisIcon },
    { key: 'img-persian',         img: persianCatIcon },
    { key: 'img-blanco-negro',    img: gatoBlancoNegroIcon },
    { key: 'img-carey',           img: gatoCareyIcon },
    { key: 'img-calico',          img: calicoIcon },
    { key: 'img-husky',           img: huskyIcon },
    { key: 'img-dalm',            img: dalmataIcon },
    { key: 'img-viringo',         img: viringoIcon },
    { key: 'img-shihtzu',         img: shihtzuIcon },
    { key: 'img-cocker',          img: cockerSpanielIcon },
    { key: 'img-perrito-peludo',  img: perroPeludoBlancoIcon },
    { key: 'img-ringo',           img: perroRingoIcon },
    { key: 'img-bichon',          img: bichonMaltesIcon },
    { key: 'img-conejito',        img: conejitoIcon },
    { key: 'img-conejo-nrj',      img: conejoNaranjaIcon },
  ],
};

// Keys that mean "use the default species illustration"
export const DEFAULT_SPECIES_KEYS = new Set(['🐕', '🐈', '🐇', '🐾', 'img']);

/**
 * Resolve the display image for a pet object.
 * Priority: real photo (photo_url) > named avatar key > species default.
 * Works for pet cards, selectors, and household pet lists.
 */
export function getPetImg(pet) {
  if (!pet) return gatoIcon;
  if (pet.photo_url) return pet.photo_url;
  const k = pet.avatar_emoji;
  if (k && AVATAR_KEY_TO_IMG[k]) return AVATAR_KEY_TO_IMG[k];
  return PET_IMG[pet.species] || gatoIcon;
}
