import React from 'react';
import { useFonts } from 'expo-font';
// Only the three weights Saath uses, so the other four are not packaged.
import { Mukta_400Regular } from '@expo-google-fonts/mukta/400Regular';
import { Mukta_600SemiBold } from '@expo-google-fonts/mukta/600SemiBold';
import { Mukta_700Bold } from '@expo-google-fonts/mukta/700Bold';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from './src/state/store';
import AppShell from './src/AppShell';

export default function App() {
  // Mukta carries Hindi and English in one voice. The fonts ship inside the app, so this is quick and offline.
  const [loaded, error] = useFonts({ Mukta_400Regular, Mukta_600SemiBold, Mukta_700Bold });
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
