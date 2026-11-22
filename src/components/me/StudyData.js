import React from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Download, RotateCcw } from '../icons';
import { BigButton, Caption, Card, Screen } from '../ui';
import { SectionTitle, Stat } from '../kit';
import { useStore } from '../../state/store';
import { Push } from '../motion';
import { tallyToCsv } from '../../services/export';
import { colors } from '../../theme';

// Study data, one level under Me: the tally the field study needs (alerts, check-ins, escalations, false alarms,
// misses), buttons to record a fall or a quiet spell the phone missed, and an export. Nobody needs this day to day,
// so it is kept off the Safety tab.
export default function StudyData({ onBack }) {
  const { state, dispatch, t } = useStore();
  const tl = state.tally;
  return (
    <Push>
      <Screen title={t('study.title')} onBack={onBack} backLabel={t('tabMe')}>
        {state.autoCall || state.autoSms ? (
          <Caption style={{ color: colors.madder }}>{t('trial.realWarn')}</Caption>
        ) : null}
        <Card>
          <View style={styles.row}>
            <Stat value={tl.alerts} label={t('tallyAlerts')} />
            <Stat value={tl.imOk} label={t('tallyImOk')} color={colors.leafDeep} />
            <Stat value={tl.escalated} label={t('tallyEscalated')} />
          </View>
          <View style={styles.row}>
            <Stat value={tl.falseAlarm} label={t('tallyFalse')} />
            <Stat value={tl.missed} label={t('tallyMissed')} color={colors.madder} />
            <View style={{ flex: 1 }} />
          </View>
        </Card>
        <SectionTitle>{t('trialTitle')}</SectionTitle>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <BigButton
              kind="quiet"
              label={t('missedFall')}
              onPress={() => dispatch({ type: 'MISSED', kind: 'fall' })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <BigButton
              kind="quiet"
              label={t('missedQuiet')}
              onPress={() => dispatch({ type: 'MISSED', kind: 'quiet' })}
            />
          </View>
        </View>
        <BigButton
          kind="outlined"
          icon={Download}
          label={t('exportCsv')}
          onPress={() => Share.share({ message: tallyToCsv(tl) })}
        />
        <BigButton
          kind="text"
          icon={RotateCcw}
          label={t('resetTally')}
          onPress={() => dispatch({ type: 'RESET_TALLY' })}
        />
      </Screen>
    </Push>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 12 } });
