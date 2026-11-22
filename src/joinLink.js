// The link inside an invite's QR code. Scanning it with any phone camera opens Saath with the code filled in, so a
// person can join a circle without typing. It carries only the invite code: the invite is still bound to the phone
// number it was made for, so a code that reaches the wrong person does not work for them.
export const JOIN_SCHEME = 'saath';

export const joinUrl = (code) => `${JOIN_SCHEME}://join/${String(code).toUpperCase()}`;

// Returns the invite code in a link, or null for anything else.
export function parseJoinUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.trim().match(/^saath:\/\/join\/([A-Za-z0-9]{6,12})\/?(?:[?#].*)?$/);
  return m ? m[1].toUpperCase() : null;
}

// The other direction: a doctor (or any care-giver) shows their own card, and the person they will look after scans it.
// It carries only the care-giver's name, role and phone number: what the person would otherwise type into "Add a
// person". The person still confirms, and the invite that follows is still bound to that number.
const ADD_ROLES = ['family', 'neighbour', 'asha', 'clinician'];

export function addUrl({ name, phone, role }) {
  const n = encodeURIComponent(String(name || '').trim().slice(0, 40));
  const p = String(phone || '').replace(/\D/g, '').slice(-10);
  return `${JOIN_SCHEME}://add/${ADD_ROLES.includes(role) ? role : 'family'}/${p}/${n}`;
}

// Returns { role, phone, name } for a Saath add link, or null for anything else.
export function parseAddUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.trim().match(/^saath:\/\/add\/([a-z]+)\/(\d{10})\/([^/?#]{0,120})\/?$/);
  if (!m || !ADD_ROLES.includes(m[1])) return null;
  let name = '';
  try {
    name = decodeURIComponent(m[3]).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
  } catch {
    return null;
  }
  if (name.length < 2) return null;
  return { role: m[1], phone: m[2], name };
}
