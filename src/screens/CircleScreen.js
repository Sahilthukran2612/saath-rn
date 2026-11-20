import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Eye, Lock, Phone, ShieldCheck, X } from '../components/icons';
import { Body, Caption, Card, Chip, Glyph, Title } from '../components/ui';
import { Avatar, Badge, ListGroup, ListRow, Segmented, Toggle, SectionTitle } from '../components/kit';
import { Reveal } from '../components/motion';
import Perf from '../components/Perf';
import InviteSection from '../components/circle/InviteSection';
import HelpSection from '../components/circle/HelpSection';
import CirclesSection from '../components/circle/CirclesSection';
import JoinedSection from '../components/circle/JoinedSection';
import { useStore } from '../state/store';
import { canShareItem } from '../logic';
import { colors, shadow } from '../theme';

// Names are stored like "Asha (daughter)". Show the name, and the relation only when it adds something.
function splitName(name, roleLabel) {
  const match = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (!match) return { base: name, note: '' };
  const note = match[2].toLowerCase() === roleLabel.toLowerCase() ? '' : match[2];
  return { base: match[1], note };
}

function MemberRow({ m, last }) {
  const { state, dispatch, t } = useStore();
  const isPerson = state.role === 'person';
  const visible = canShareItem({ involves: [m.id] }, { [m.id]: m.shareContact });
  const roleLabel = t(`role.${m.role}`);
  const { base, note } = splitName(m.name, roleLabel);
  return (
    <View style={styles.member}>
      <View style={styles.memberTop}>
        <Avatar name={m.name} role={m.role} size={48} />
        <View style={{ flex: 1 }}>
          <Body bold>{base}</Body>
          <Caption>{note ? `${roleLabel}, ${note}` : roleLabel}</Caption>
        </View>
        {isPerson ? (
          <View style={{ alignItems: 'center' }}>
            <Toggle
              value={m.timeOff}
              label={t('timeOff')}
              onValueChange={(on) => dispatch({ type: 'SET_TIME_OFF', id: m.id, on })}
            />
            <Caption>{t('timeOff')}</Caption>
          </View>
        ) : null}
      </View>
      {/* Second-person consent: a member's number shows only if they agreed. */}
      <View style={styles.contact}>
        <Glyph icon={visible ? Phone : Lock} size={18} color={colors.inkSoft} />
        <Caption>{visible ? m.phone : t('contactHidden')}</Caption>
      </View>
      {isPerson && !m.demo ? (
        <View style={{ flexDirection: 'row' }}>
          <Chip
            label={t('ct.remove').replace('{name}', base)}
            icon={X}
            onPress={() => dispatch({ type: 'CONTACT_REMOVE', id: m.id })}
          />
        </View>
      ) : null}
      {state.role === m.role ? (
        <View style={styles.inlineToggle}>
          <Body>{t('shareMyNumber')}</Body>
          <Toggle
            value={m.shareContact}
            label={t('shareMyNumber')}
            onValueChange={(on) => dispatch({ type: 'SET_SHARE_CONTACT', id: m.id, on })}
          />
        </View>
      ) : null}
      {isPerson ? (
        <Segmented
          value={m.dial}
          onChange={(dial) => dispatch({ type: 'SET_DIAL', id: m.id, dial })}
          options={[0, 1, 2].map((d) => ({ value: d, label: t(`dial${d}`) }))}
        />
      ) : (
        <Badge label={t(`dial${m.dial}`)} tone={m.dial === 2 ? 'indigo' : m.dial === 1 ? 'leaf' : 'haldi'} />
      )}
      {state.mode === 'teen' && m.guardian ? <Caption>{t('guardianLimit')}</Caption> : null}
      {!last ? <Perf style={{ marginTop: 4 }} /> : null}
    </View>
  );
}

export default function CircleScreen() {
  const { state, t } = useStore();
  const isPerson = state.role === 'person';
  const viewer = (v) => (t(`role.${v}`) === `role.${v}` ? v : t(`role.${v}`));
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18 }}
    >
      <View style={{ gap: 2 }}>
        <Title style={{ fontSize: 32, letterSpacing: -0.6 }}>{t('tabCircle')}</Title>
        <Caption>{t('circleSub')}</Caption>
      </View>
      <Reveal index={0}>
        <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Glyph icon={ShieldCheck} size={28} color={colors.indigo} />
          <Body style={{ flex: 1 }}>{t('safetyAlways')}</Body>
        </Card>
      </Reveal>
      <Reveal index={1}>
        <SectionTitle>{t('privacyDial')}</SectionTitle>
        <View style={{ height: 8 }} />
        <View style={styles.group}>
          {state.members.map((m, i) => (
            <MemberRow key={m.id} m={m} last={i === state.members.length - 1} />
          ))}
        </View>
      </Reveal>
      {isPerson ? (
        <Reveal index={2}>
          <InviteSection />
        </Reveal>
      ) : null}
      {isPerson || state.role === 'family' ? (
        <Reveal index={3}>
          <HelpSection />
        </Reveal>
      ) : null}
      {isPerson ? (
        <Reveal index={4}>
          <JoinedSection />
        </Reveal>
      ) : null}
      <Reveal index={4}>
        <CirclesSection />
      </Reveal>
      <Reveal index={5}>
        <SectionTitle>{t('whoViewed')}</SectionTitle>
        <View style={{ height: 8 }} />
        {state.audit.length === 0 ? (
          <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Glyph icon={Eye} size={24} color={colors.inkSoft} />
            <Body style={{ flex: 1 }}>{t('emptyAudit')}</Body>
          </Card>
        ) : (
          <ListGroup>
            {state.audit
              .slice()
              .reverse()
              .map((e, i) => (
                <ListRow
                  key={i}
                  icon={Eye}
                  title={e.item}
                  subtitle={`${viewer(e.viewer)}, ${new Date(e.at).toLocaleTimeString()}`}
                />
              ))}
          </ListGroup>
        )}
      </Reveal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.paper,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.card,
  },
  member: { padding: 16, gap: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
