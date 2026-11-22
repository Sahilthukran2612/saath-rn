import React from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Activity, Download, FlaskConical, Moon, RotateCcw, ShieldCheck } from '../components/icons';
import { BigButton, Body, Caption, Card, Glyph, Screen, ScreenTitle, Title } from '../components/ui';
import { ListGroup, ListRow, SectionTitle, Stat } from '../components/kit';
import Doodle from '../components/doodles';
import HeartCard from '../components/safety/HeartCard';
import { SHOW_HEART } from '../features';
import { useNav } from '../components/nav';
import { useStore } from '../state/store';
import { tallyToCsv } from '../services/export';
import { explainBaseline } from '../care';
import { colors, radii } from '../theme';

export default function SafetyScreen() {
  const { state, dispatch, t } = useStore();
  const go = useNav();
  const tl = state.tally;
  return (
    <Screen>
      <ScreenTitle>{t('tabSafety')}</ScreenTitle>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Doodle name="walker" size={72} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.watchChip}>
              <Glyph icon={ShieldCheck} size={20} color={colors.leafDeep} strokeWidth={2.2} />
              <Body bold style={{ color: colors.leafDeep }}>
                {state.background ? t('watch.bg') : t('watch.on')}
              </Body>
            </View>
            <Body>{t('helpsNotice')}</Body>
          </View>
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <SectionTitle>{t('baselineTitle')}</SectionTitle>
        <ListGroup>
          {explainBaseline(state.baseline, state.lang).map((line, i) => (
            <ListRow key={line} icon={i === 0 ? Activity : Moon} title={line} />
          ))}
          <ListRow
            icon={RotateCcw}
            title={t('resetBaseline')}
            onPress={() => dispatch({ type: 'RESET_BASELINE' })}
            chevron={false}
          />
        </ListGroup>
      </View>

      {SHOW_HEART ? <HeartCard /> : null}
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.trialIcon}>
            <Glyph icon={FlaskConical} size={22} color={colors.haldiDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Title style={{ fontSize: 22 }}>{t('trialTitle')}</Title>
            {state.autoCall || state.autoSms ? (
              <Caption style={{ color: colors.madder }}>{t('trial.realWarn')}</Caption>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
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
        <View style={styles.statRow}>
          <Stat value={tl.alerts} label={t('tallyAlerts')} />
          <Stat value={tl.imOk} label={t('tallyImOk')} color={colors.leafDeep} />
          <Stat value={tl.escalated} label={t('tallyEscalated')} />
        </View>
        <View style={styles.statRow}>
          <Stat value={tl.falseAlarm} label={t('tallyFalse')} />
          <Stat value={tl.missed} label={t('tallyMissed')} color={colors.madder} />
          <View style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <BigButton
              kind="quiet"
              icon={Download}
              label={t('exportCsv')}
              onPress={() => Share.share({ message: tallyToCsv(tl) })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <BigButton
              kind="quiet"
              icon={RotateCcw}
              label={t('resetTally')}
              onPress={() => dispatch({ type: 'RESET_TALLY' })}
            />
          </View>
        </View>
      </Card>
      <Caption style={{ textAlign: 'center' }} onPress={() => go('me')}>
        {t('bg.title')}
      </Caption>
    </Screen>
  );
}

const styles = StyleSheet.create({
  watchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.leafTint,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  trialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.haldiTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: { flexDirection: 'row', gap: 12 },
});
