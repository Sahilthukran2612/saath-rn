import React from 'react';
import { ScrollView, Share } from 'react-native';
import { BigButton, Body, Card, Title } from '../components/ui';
import { useStore } from '../state/store';
import { tallyToCsv } from '../services/export';
import { CFG } from '../logic';

// Simulated quiet: fast-forward a virtual clock to 14:00 with the last activity at 07:00
// (seven quiet hours, outside the sleep window) and let isInactive decide.
function quietTrace() {
  const d = new Date();
  d.setHours(14, 0, 0, 0);
  const nowMs = d.getTime();
  return { nowMs, lastActiveMs: nowMs - (CFG.inactiveHours + 1) * 3600000 };
}

export default function SafetyScreen() {
  const { state, dispatch, t } = useStore();
  const tl = state.tally;
  const idle = !!state.alert;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{t('tabSafety')}</Title>
      <Body>{t('helpsNotice')}</Body>
      <Card>
        <Title>{t('trialTitle')}</Title>
        <Body>{t('trialNote')}</Body>
        <BigButton
          kind="primary"
          label={t('simulateFall')}
          icon="🧪"
          onPress={() =>
            !idle &&
            dispatch({
              type: 'TRIGGER_ALERT',
              kind: 'fall',
              confidence: 0.85,
              reason: 'simulated: impact then still',
              id: String(Date.now()),
            })
          }
        />
        <BigButton
          kind="quiet"
          label={t('simulateQuiet')}
          icon="🕒"
          onPress={() =>
            !idle &&
            dispatch({ type: 'QUIET_CHECK', ...quietTrace(), simulated: true, id: String(Date.now()) })
          }
        />
        <BigButton kind="quiet" label={t('missedEvent')} onPress={() => dispatch({ type: 'MISSED' })} />
        <Body>
          {t('tallyAlerts')}: {tl.alerts} · {t('tallyImOk')}: {tl.imOk} · {t('tallyEscalated')}:{' '}
          {tl.escalated}
          {'\n'}
          {t('tallyFalse')}: {tl.falseAlarm} · {t('tallyMissed')}: {tl.missed}
        </Body>
        <BigButton
          kind="quiet"
          label={t('exportCsv')}
          onPress={() => Share.share({ message: tallyToCsv(tl) })}
        />
        <BigButton kind="quiet" label="Reset tally" onPress={() => dispatch({ type: 'RESET_TALLY' })} />
      </Card>
    </ScrollView>
  );
}
