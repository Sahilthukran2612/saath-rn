import { initialState } from '../src/state/reducer';
import { SEED, makeSeeded } from './seed';

export { SEED };
export const seededState = makeSeeded(initialState);
