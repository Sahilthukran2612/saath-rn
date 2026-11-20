import React from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  Activity,
  Download,
  FlaskConical,
  Moon,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from '../components/icons';
import { BigButton, Body, Caption, Card, Glyph, Title } from '../components/ui';
import { ListGroup, ListRow, SectionTitle, Stat } from '../components/kit';
import { Reveal } from '../components/motion';
import Doodle from '../components/doodles';
import HeartCard from '../components/safety/HeartCard';
import { useNav } from '../components/nav';
import { useStore } from '../state/store';
import { tallyToCsv } from '../services/export';
import { explainBaseline } from '../care';
import { colors, radii } from '../theme';

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
  const go = useNav();
  const tl = state.tally;
  const idle = !!state.alert;
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18 }}
    >
      <View style={{ gap: 2 }}>
        <Title style={{ fontSize: 32 }}>{t('tabSafety')}</Title>
      </View>

      <Reveal index={0}>
        <View style={styles.hero}>
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
          {!state.background ? <Caption>{t('bg.note')}</Caption> : null}
        </View>
      </Reveal>

      <Reveal index={1}>
        <SectionTitle>{t('baselineTitle')}</SectionTitle>
        <View style={{ height: 8 }} />
        <ListGroup>
          {explainBaseline(state.baseline).map((line, i) => (
            <ListRow key={line} icon={i === 0 ? Activity : Moon} title={line} />
          ))}
          <ListRow
            icon={RotateCcw}
            title={t('resetBaseline')}
            onPress={() => dispatch({ type: 'RESET_BASELINE' })}
            chevron={false}
          />
        </ListGroup>
      </Reveal>

      <Reveal index={2}>
        <HeartCard />
        <View style={{ height: 14 }} />
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.trialIcon}>
              <Glyph icon={FlaskConical} size={22} color={colors.haldiDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Title style={{ fontSize: 22 }}>{t('trialTitle')}</Title>
              <Caption>{t('trialNote')}</Caption>
              {(state.autoCall || state.autoSms) && !state.demo ? (
                <Caption style={{ color: colors.madder }}>{t('trial.realWarn')}</Caption>
              ) : null}
            </View>
          </View>
          <BigButton
            label={t('simulateFall')}
            icon={TriangleAlert}
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
            icon={Moon}
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
      </Reveal>
      <Caption style={{ textAlign: 'center' }} onPress={() => go('me')}>
        {t('bg.title')}
      </Caption>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.indigo, borderRadius: radii.md, padding: 16, gap: 10 },
  watchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.leafTint,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },  trialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.haldiTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: { flexDirection: 'row', gap: 12 },
});
