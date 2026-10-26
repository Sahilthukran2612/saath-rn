import { Accelerometer } from 'expo-sensors';
import { CFG, detectFall } from '../logic';

const BUFFER_MS = 8000;

// Foreground-only listener (Expo Go). True background sensing needs a foreground
// service in a dev client: see docs/ARCHITECTURE.md (Phase 2). Not tested on a device yet.
export function startFallListener({ onFall, onActivity }) {
  let buf = [];
  let lastCheck = 0;
  let lastActivity = 0;
  try {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const t = Date.now();
      buf.push({ t, x, y, z });
      buf = buf.filter((s) => s.t > t - BUFFER_MS);
      const m = Math.sqrt(x * x + y * y + z * z);
      if (Math.abs(m - 1) > 0.15 && t - lastActivity > 30000) {
        lastActivity = t;
        onActivity(t);
      }
      if (t - lastCheck > 1000) {
        lastCheck = t;
        const r = detectFall(buf, CFG);
        if (r.state === 'fall') {
          buf = [];
          onFall(r);
        }
      }
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
