// Wall-clock time for event handlers. Kept in one place so screens never call Date.now() while rendering.
export const nowMs = () => Date.now();
