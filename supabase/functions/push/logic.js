// Pure rules for the push function, kept apart from the network code so they can be tested.
// They mirror the app's privacy rule (canReceive in src/logic.js) and the database's can_see_event.

const TEXT = {
  en: {
    fall: '{name} may have fallen. Please call them.',
    quiet: '{name} has been very quiet. Please check on them.',
    im_ok: '{name} said they are OK.',
    false_alarm: '{name} says it was a false alarm.',
    other: '{name}: new safety update.',
  },
  hi: {
    fall: '{name} शायद गिर गए हैं। कृपया उन्हें फ़ोन करें।',
    quiet: '{name} बहुत देर से शांत हैं। कृपया उनका हाल पूछें।',
    im_ok: '{name} ने बताया कि वे ठीक हैं।',
    false_alarm: '{name} का कहना है कि यह गलत अलार्म था।',
    other: '{name}: सुरक्षा का नया अपडेट।',
  },
};

export const URGENT = ['fall', 'quiet'];

export function messageFor(kind, name, lang) {
  const set = TEXT[lang] || TEXT.en;
  const who = String(name || '').trim() || (lang === 'hi' ? 'कोई' : 'Someone');
  return { title: 'Saath', body: (set[kind] || set.other).replace('{name}', who) };
}

// Only safety events (type 0) are pushed.
export const shouldPush = (record) => !!record && record.event_type === 0;

// Members who joined (have an account) and may see this event. A safety event reaches every joined member,
// whatever their dial or Time Off, exactly as in the database rule.
export function recipients(record, members) {
  return members.filter((m) => m.user_id && (record.event_type === 0 || (record.event_type <= m.dial && !m.time_off)));
}

// Google answers an address that no longer exists with one of these; the address is then deleted.
export const isDeadToken = (status, body) =>
  status === 404 || /UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/.test(String(body?.error?.status || body?.error?.message || ''));