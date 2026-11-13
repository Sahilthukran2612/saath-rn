import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { initialState, reducer } from './reducer';
import { load, save, loadRegistry, saveRegistry } from '../services/storage';
import { t as translate } from '../i18n/strings';
import { initialRegistry, enableShared, addProfile, lock, unlock, disableShared } from '../profiles';

const Ctx = createContext(null);

const salt = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children, preload, preloadRegistry }) {
  const [state, dispatch] = useReducer(
    reducer,
    preload ? { ...initialState, ...preload, hydrated: true } : initialState
  );
  const [registry, setRegistry] = useState(() => ({ ...initialRegistry(), ...preloadRegistry }));
  const { activeId } = registry;

  // A phone that was left in shared mode opens locked.
  useEffect(() => {
    if (preload) return;
    loadRegistry()
      .then((reg) => {
        const start = reg.shared ? { ...reg, locked: true } : reg;
        setRegistry(start);
        return load(start.activeId);
      })
      .then((saved) => dispatch({ type: 'HYDRATE', saved }));
  }, [preload]);

  useEffect(() => {
    if (state.hydrated && !preload) save(state, activeId);
  }, [state, preload, activeId]);

  useEffect(() => {
    if (state.hydrated && !preload) saveRegistry(registry);
  }, [registry, state.hydrated, preload]);

  const t = (key) => translate(state.lang, key);

  // Shared-phone actions. Each returns a small result so the screen can say what happened.
  const shared = {
    enable: (pin, name) => {
      const next = enableShared(registry, pin, salt(), name);
      setRegistry(next);
      return next.shared;
    },
    lockNow: () => setRegistry((r) => lock(r)),
    disable: (pin) => {
      const res = disableShared(registry, pin);
      if (res.ok) setRegistry(res.reg);
      return res.ok;
    },
    // Open a profile with its PIN. Another person's data replaces this one only after the PIN is right.
    unlock: async (id, pin) => {
      if (state.alert && id !== activeId) return { ok: false, reason: 'alert' };
      const res = unlock(registry, id, pin, Date.now());
      if (!res.ok) {
        setRegistry(res.reg);
        return res;
      }
      if (id !== activeId) {
        const saved = await load(id);
        dispatch({ type: 'LOAD_PROFILE', saved });
      }
      setRegistry(res.reg);
      return res;
    },
    add: async (name, pin) => {
      const id = `p${Date.now().toString(36)}`;
      const next = addProfile(registry, { id, name, pin, salt: salt() });
      if (next === registry) return false;
      dispatch({ type: 'LOAD_PROFILE', saved: { profile: { ...initialState.profile, name: String(name).trim() } },
      });
      setRegistry(next);
      return true;
    },
  };

  return <Ctx.Provider value={{ state, dispatch, t, registry, shared }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
