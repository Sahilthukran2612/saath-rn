import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerRootComponent } from 'expo';

import { applyTheme } from './src/theme';

// The look (light, dark or follow the phone) is read first, and the app is loaded only after it is applied,
// because every screen builds its styles from the colour tokens when its file is first loaded.
async function start() {
  let choice = 'auto';
  try {
    choice = (await AsyncStorage.getItem('saath.theme')) || 'auto';
  } catch {
    // no stored choice: follow the phone
  }
  applyTheme(choice, Appearance.getColorScheme());
  const App = require('./App').default;
  registerRootComponent(App);
}

start();
