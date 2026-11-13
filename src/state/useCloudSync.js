import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { cloudConfig, flush, isConfigured } from '../services/cloud';

const RETRY_MS = 60000;

// Sends waiting events to the circle's server when signed in. Quiet when offline, not signed in,
// or when no server is configured. One send at a time, retried every minute while events wait.
export default function useCloudSync() {
  const { state, dispatch } = useStore();
  const { access, householdId } = state.cloud;
  const waiting = state.outbox.length;
  const busy = useRef(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!waiting) return undefined;
    const h = setInterval(() => setTick((n) => n + 1), RETRY_MS);
    return () => clearInterval(h);
  }, [waiting]);

  const { cloud, outbox } = state;
  useEffect(() => {
    const cfg = cloudConfig();
    if (!state.hydrated || !isConfigured(cfg) || !access || !householdId || !waiting || busy.current) return;
    busy.current = true;
    flush(cfg, cloud, outbox)
      .then((res) => {
        if (res.session) dispatch({ type: 'CLOUD_SET', patch: res.session });
        if (res.sentIds.length) dispatch({ type: 'OUTBOX_SENT', ids: res.sentIds });
      })
      .finally(() => {
        busy.current = false;
      });
  }, [state.hydrated, access, householdId, waiting, tick, cloud, outbox, dispatch]);
}
