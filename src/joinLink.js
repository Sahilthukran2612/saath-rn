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
