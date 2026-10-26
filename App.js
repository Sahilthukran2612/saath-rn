import React from 'react';
import { StoreProvider } from './src/state/store';
import AppShell from './src/AppShell';

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
