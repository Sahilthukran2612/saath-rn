import React from 'react';
import { ScrollView, View } from 'react-native';
import { Body, Card, Chip, Title } from '../components/ui';
import { useStore } from '../state/store';

export default function CircleScreen() {
  const { state, dispatch, t } = useStore();
  const isPerson = state.role === 'person';
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{t('privacyDial')}</Title>
      <Body>{t('safetyAlways')}</Body>
      {state.members.map((m) => (
        <Card key={m.id}>
          <Body bold>{m.name}</Body>
          {isPerson ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[0, 1, 2].map((d) => (
                <Chip
                  key={d}
                  label={t(`dial${d}`)}
                  active={m.dial === d}
                  onPress={() => dispatch({ type: 'SET_DIAL', id: m.id, dial: d })}
                />
              ))}
            </View>
          ) : (
            <Body>{t(`dial${m.dial}`)}</Body>
          )}
          {isPerson && (
            <Chip
              label={`${t('timeOff')}: ${m.timeOff ? 'on' : 'off'}`}
              active={m.timeOff}
              onPress={() => dispatch({ type: 'SET_TIME_OFF', id: m.id, on: !m.timeOff })}
            />
          )}
        </Card>
      ))}
      <Title>{t('whoViewed')}</Title>
      {state.audit.length === 0 ? (
        <Body>{t('nobodyViewed')}</Body>
      ) : (
        state.audit
          .slice()
          .reverse()
          .map((e, i) => (
            <Body key={i}>
              {new Date(e.at).toLocaleTimeString()} · {e.viewer} · {e.item}
            </Body>
          ))
      )}
    </ScrollView>
  );
}
