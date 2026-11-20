import React, { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';

import { applyTheme } from './src/theme';

// The app is registered at once and synchronously, as React Native requires. The root renders nothing until the
// saved look (light, dark or follow the phone) has been read and applied, and only then loads the rest of the app,
// because every screen builds its styles from the colour tokens when its file is first loaded.
function Root() {
  const [App, setApp] = useState(null);
  useEffect(() => {
    let live = true;
    (async () => {
      let choice = 'auto';
      try {
        choice = (await AsyncStorage.getItem('saath.theme')) || 'auto';
      } catch {
        // no stored choice: follow the phone
      }
      // The Tailwind classes follow the phone's colour scheme, so the chosen look is set there too: 'auto' hands it back.
      Appearance.setColorScheme(choice === 'dark' || choice === 'light' ? choice : null);
      applyTheme(choice, Appearance.getColorScheme());
      const Loaded = require('./App').default;
      if (live) setApp(() => Loaded);
    })();
    return () => {
      live = false;
    };
  }, []);
  return App ? <App /> : null;
}

registerRootComponent(Root);
