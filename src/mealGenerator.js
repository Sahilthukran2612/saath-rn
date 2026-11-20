import pools from './content/ingredients.json';

// Meal ideas made on the phone, fresh for each person, day and meal. No network and no model: a seeded choice
// from ingredient pools that follows the half-vegetables, quarter-protein, quarter-grain plate.
//
// What shapes an idea: the person's region and diet (veg, egg, non-veg), the meal of the day, what they were
// given in the last few days (so the same thing does not come back), and what they have said "not for me" to
// (those foods stop appearing). The same inputs always give the same idea, so it does not flicker on re-render;
// "another idea" changes the nonce.
//
// Safety: no amounts, no calories, no claim about sugar, nothing about medicine. It is a plate idea, and the
// screen says to verify with the clinic or a dietitian.

export const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];

// The meal the person is most likely about to eat, from the hour.
export function slotForHour(h) {
  if (h >= 5 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 16 && h < 19) return 'snack';
  return 'dinner';
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Small seeded generator: the same seed always gives the same run of numbers.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, rand, avoid) {
  const fresh = list.filter((x) => !avoid.has(x.id));
  const from = fresh.length ? fresh : list;
  return from[Math.floor(rand() * from.length)];
}

const fits = (x, { region, diet, slot }) =>
  (!x.r || x.r.includes(region)) && (!x.d || x.d.includes(diet)) && (!x.s || x.s.includes(slot));

// `recent` is a list of food ids given lately; `disliked` the ones the person turned down.
export function suggestMeal({ region = 'north', diet = 'veg', slot = 'lunch', day, nonce = 0, recent = [], disliked = [] }) {
  const ctx = { region, diet, slot };
  const rand = rng(hash(`${day}|${slot}|${region}|${diet}|${nonce}`));
  const avoid = new Set([...recent, ...disliked]);
  const never = new Set(disliked);
  const usable = (list) => list.filter((x) => fits(x, ctx) && !never.has(x.id));

  if (slot === 'snack') {
    const s = pick(usable(pools.snack), rand, avoid);
    return s
      ? { slot, ids: [s.id], text: { en: s.en[0].toUpperCase() + s.en.slice(1), hi: s.hi } }
      : null;
  }

  const grains = usable(pools.grain);
  const proteins = usable(pools.protein);
  const vegs = usable(pools.veg);
  if (!grains.length || !proteins.length || !vegs.length) return null;

  const grain = pick(grains, rand, avoid);
  const protein = pick(proteins, rand, avoid);
  const v1 = pick(vegs, rand, avoid);
  const v2 = slot !== 'breakfast' ? pick(vegs.filter((v) => v.id !== v1.id), rand, avoid) : null;
  const side = slot !== 'breakfast' && rand() < 0.65 ? pick(usable(pools.side), rand, avoid) : null;

  const vegEn = v2 ? `${v1.en} and ${v2.en}` : v1.en;
  const vegHi = v2 ? `${v1.hi} और ${v2.hi}` : v1.hi;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const en =
    slot === 'breakfast'
      ? `${cap(grain.en)} with ${protein.en} and ${v1.en}`
      : `${cap(grain.en)} with ${protein.en} and ${vegEn}${side ? `, and ${side.en}` : ''}`;
  const hi =
    slot === 'breakfast'
      ? `${grain.hi}, ${protein.hi} और ${v1.hi}`
      : `${grain.hi}, ${protein.hi} और ${vegHi}${side ? `, साथ में ${side.hi}` : ''}`;
  const ids = [grain.id, protein.id, v1.id, ...(v2 ? [v2.id] : []), ...(side ? [side.id] : [])];
  return { slot, ids, text: { en, hi } };
}

// Everything that can be turned down, so "not for me" can name a food: the one the person picks from the idea.
export function foodsIn(idea) {
  if (!idea) return [];
  const all = [...pools.grain, ...pools.protein, ...pools.veg, ...pools.side, ...pools.snack];
  return idea.ids.map((id) => all.find((x) => x.id === id)).filter(Boolean);
}
