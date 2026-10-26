import { useEffect, useState } from 'react';

// Current time that refreshes every 30 s, so expiry and reminder status stay honest without
// calling Date.now() during render.
export function useNow(everyMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(h);
  }, [everyMs]);
  return now;
}
