import { createContext, useContext } from 'react';

// Lets a screen send the person to another tab ("Go to Care") without owning the tab state.
export const NavContext = createContext(() => {});
export const useNav = () => useContext(NavContext);
