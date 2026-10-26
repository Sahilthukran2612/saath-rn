import React, { useEffect } from 'react';
import { View } from 'react-native';
import { BigButton, Body, Card, Title } from './ui';
import { colors } from '../theme';
import { useStore } from '../state/store';
import { speak } from '../services/voice';

// Ticks the countdown. Only depends on the alert id and phase, and dispatches without
// reading state, so there is no stale closure and each transition is counted once in the reducer.
function useEscalationClock(alertId, active, dispatch) {
  useEffect(() => {
    if (!alertId || !active) return undefined;
    const h = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(h);
  }, [alertId, active, dispatch]);
}

export default function AlertBanner() {
  const { state, dispatch, t } = useStore();
  const al = state.alert;
  useEscalationClock(al?.id, al && al.phase !== 'done', dispatch);

  useEffect(() => {
    if (al) speak(`${t('areYouOk')} ${t('areYouOkSub')}`, state.lang);
  }, [al?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!al) return null;
  const who = al.phase === 'escalating' ? al.chain[al.stepIndex] : null;
  return (
    <Card
      style={{ backgroundColor: colors.brick, borderColor: colors.brick, margin: 16 }}
      accessibilityLiveRegion="assertive"
    >
      <Title style={{ color: colors.white }}>{t('areYouOk')}</Title>
      <Body style={{ color: colors.white }}>{t('areYouOkSub')}</Body>
      <Body style={{ color: colors.white }}>
        {t('confidence')}: {Math.round(al.confidence * 100)}% ({al.reason})
      </Body>
      {al.phase === 'countdown' && (
        <Body style={{ color: colors.white }} bold>
          {al.remaining}s
        </Body>
      )}
      {who && (
        <Body style={{ color: colors.white }} bold>
          {t('calling')}: {who.name} ({al.remaining}s)
        </Body>
      )}
      {al.phase === 'done' && <Body style={{ color: colors.white }}>{t('nobodyReached')}</Body>}
      <View style={{ gap: 10 }}>
        <BigButton
          kind="ok"
          icon="✅"
          label={t('imOk')}
          onPress={() => dispatch({ type: 'IM_OK', at: Date.now() })}
        />
        <BigButton kind="quiet" label={t('falseAlarm')} onPress={() => dispatch({ type: 'FALSE_ALARM' })} />
      </View>
    </Card>
  );
}
