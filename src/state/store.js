import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { initialState, reducer } from './reducer';
import { load, save } from '../services/storage';
import { t as translate } from '../i18n/strings';

const Ctx = createContext(null);

export function StoreProvider({ children, preload }) {
  const [state, dispatch] = useReducer(
    reducer,
    preload ? { ...initialState, ...preload, hydrated: true } : initialState
  );

  useEffect(() => {
    if (preload) return;
    load().then((saved) => dispatch({ type: 'HYDRATE', saved }));
  }, [preload]);

  useEffect(() => {
    if (state.hydrated && !preload) save(state);
  }, [state, preload]);

  const t = (key) => translate(state.lang, key);
  return <Ctx.Provider value={{ state, dispatch, t }}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
