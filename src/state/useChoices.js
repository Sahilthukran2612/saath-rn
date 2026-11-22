import { useStore } from './store';
import { askCallPermissions, callsAvailable } from '../services/calls';

// The alert choices that need the phone's permission, in one place so the setup flow and the Me tab behave the
// same: ask first, and if it is refused the switch stays off and says why.
export default function useChoices() {
  const { dispatch } = useStore();
  const set = (key, value) => dispatch({ type: 'SET', key, value });
  return {
    autoCall: async (on) => {
      set('autoCallDenied', false);
      if (!on) return set('autoCall', false);
      if (callsAvailable && (await askCallPermissions())) return set('autoCall', true);
      set('autoCall', false);
      set('autoCallDenied', true);
      return undefined;
    },
  };
}