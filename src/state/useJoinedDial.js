import { useState } from 'react';
import { useStore } from './store';
import { cloudConfig, isConfigured, setMemberDial } from '../services/cloud';

// Someone in my circle who has joined from their own phone is matched to the contact I added by name and role, so the
// circle lists each person once.
export const sameSomeone = (contact, joined) =>
  contact.role === joined.role && contact.name.trim().toLowerCase() === joined.name.trim().toLowerCase();

// Change what a joined person sees. The server checks this dial before it shows them anything, so it is the real
// control. If the server refuses, the screen goes
// back to the truth and says so.
export default function useJoinedDial() {
  const { state, dispatch, t } = useStore();
  const [msg, setMsg] = useState('');
  const cfg = cloudConfig();
  const live = isConfigured(cfg) && Boolean(state.cloud.access);

  const setDial = async (m, dial) => {
    const before = m.dial;
    setMsg('');
    dispatch({ type: 'JOINED_DIAL', id: m.id, dial });
    if (!live) return;
    const r = await setMemberDial(cfg, state.cloud, m.id, dial);
    if (r.session) dispatch({ type: 'CLOUD_SET', patch: r.session });
    if (!r.ok) {
      dispatch({ type: 'JOINED_DIAL', id: m.id, dial: before });
      setMsg(t('jm.offline'));
    }
  };
  return { setDial, msg, live };
}
