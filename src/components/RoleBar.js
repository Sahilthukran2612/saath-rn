import React from 'react';
import { ScrollView } from 'react-native';
import { Chip } from './ui';
import { useStore } from '../state/store';

const LABEL = {
  person: 'Person',
  family: 'Family',
  neighbour: 'Neighbour',
  asha: 'ASHA',
  clinician: 'Clinician',
};

// Demo device only. Real roles come from real accounts in Phase 4.
export default function RoleBar() {
  const { state, dispatch } = useStore();
  if (!state.demo) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {Object.keys(LABEL).map((r) => (
        <Chip
          key={r}
          label={LABEL[r]}
          active={state.role === r}
          onPress={() => dispatch({ type: 'SET', key: 'role', value: r })}
        />
      ))}
    </ScrollView>
  );
}
