import React from 'react';
import { ScrollView, Share } from 'react-native';
import { BigButton, Body, Card, Title } from '../components/ui';
import { useStore } from '../state/store';
import { tallyToCsv } from '../services/export';
import { explainBaseline } from '../care';

// Simulated quiet: fast-forward a virtual clock to 14:00 with the last activity one hour
// longer ago than the person's own quiet threshold, and let isInactive decide.
function quietTrace(inactiveHours) {
  const d = new Date();
  d.setHours(14, 0, 0, 0);
  const nowMs = d.getTime();
  return { nowMs, lastActiveMs: nowMs - (inactiveHours + 1) * 3600000 };
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
            dispatch({
              type: 'QUIET_CHECK',
              ...quietTrace(state.baseline.inactiveHours),
              simulated: true,
              id: String(Date.now()),
            })
          }
        />
        <BigButton
          kind="quiet"
          label={t('missedFall')}
          onPress={() => dispatch({ type: 'MISSED', kind: 'fall' })}
        />
        <BigButton
          kind="quiet"
          label={t('missedQuiet')}
          onPress={() => dispatch({ type: 'MISSED', kind: 'quiet' })}
        />
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
      <Card>
        <Title>{t('baselineTitle')}</Title>
        {explainBaseline(state.baseline).map((line) => (
          <Body key={line}>{line}</Body>
        ))}
        <BigButton
          kind="quiet"
          label={t('resetBaseline')}
          onPress={() => dispatch({ type: 'RESET_BASELINE' })}
        />
      </Card>
    </ScrollView>
  );
}
