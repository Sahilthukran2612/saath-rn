import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Eye, MoreHorizontal, ShieldCheck, X } from '../components/icons';
import { BigButton, Body, Caption, Card, Chip, Glyph, Screen } from '../components/ui';
import Sheet from '../components/Sheet';
import { Avatar, Badge, ListGroup, ListRow, Segmented, Toggle, SectionTitle } from '../components/kit';
import Perf from '../components/Perf';
import InviteSection from '../components/circle/InviteSection';
import HelpSection from '../components/circle/HelpSection';
import CirclesSection from '../components/circle/CirclesSection';
import JoinedSection from '../components/circle/JoinedSection';
import { useStore } from '../state/store';
import { canShareItem } from '../logic';
import useJoinedDial, { sameSomeone } from '../state/useJoinedDial';
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
  const [manage, setManage] = useState(false);
  const isPerson = state.role === 'person';
  // A person who has joined from their own phone is the same person as this contact: one row, and the control moves
  // the real (server-enforced) dial for them as well as the local one.
  const joined = state.joined.find((j) => sameSomeone(m, j));
  const { setDial } = useJoinedDial();
  const dial = joined ? joined.dial : m.dial;
  const setLevel = (d) => {
    dispatch({ type: 'SET_DIAL', id: m.id, dial: d });
    if (joined) setDial(joined, d);
  };
  const visible = canShareItem({ involves: [m.id] }, { [m.id]: m.shareContact });
  const roleLabel = t(`role.${m.role}`);
  const { base, note } = splitName(m.name, roleLabel);
  // One quiet line under the name: who they are, and their number only if they agreed to show it.
  const line = [note ? `${roleLabel}, ${note}` : roleLabel, visible ? m.phone : t('contactHidden')]
    .filter(Boolean)
    .join(', ');
  return (
    <View style={styles.member}>
      <View style={styles.memberTop}>
        <Avatar name={m.name} role={m.role} size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Body bold>{base}</Body>
          <Caption>{line}</Caption>
        </View>
        {isPerson ? (
          <Toggle value={dial > 0} label={t('dial.in')} onValueChange={(on) => setLevel(on ? 1 : 0)} />
        ) : (
          <Badge
            label={t(`dial${m.dial}`)}
            tone={m.dial === 2 ? 'indigo' : m.dial === 1 ? 'leaf' : 'haldi'}
          />
        )}
      </View>
      {isPerson && dial > 0 ? (
        <Segmented
          value={dial}
          onChange={setLevel}
          options={[1, 2].map((d) => ({ value: d, label: t(`dial${d}`) }))}
        />
      ) : null}
      {state.mode === 'teen' && m.guardian ? <Caption>{t('guardianLimit')}</Caption> : null}
      {isPerson || state.role === m.role ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {joined ? <Badge label={t('circ.onSaath')} tone="leaf" /> : null}
          {m.timeOff ? <Badge label={t('jm.timeOff')} tone="haldi" /> : null}
          <View style={{ flex: 1 }} />
          <Chip label={t('manage')} icon={MoreHorizontal} onPress={() => setManage(true)} />
        </View>
      ) : null}
      <Sheet visible={manage} onClose={() => setManage(false)} title={base}>
        {isPerson ? (
          <View style={styles.inlineToggle}>
            <Body style={{ flex: 1 }}>{t('timeOff')}</Body>
            <Toggle
              value={m.timeOff}
              label={t('timeOff')}
              onValueChange={(on) => dispatch({ type: 'SET_TIME_OFF', id: m.id, on })}
            />
          </View>
        ) : null}
        {state.role === m.role ? (
          <View style={styles.inlineToggle}>
            <Body style={{ flex: 1 }}>{t('shareMyNumber')}</Body>
            <Toggle
              value={m.shareContact}
              label={t('shareMyNumber')}
              onValueChange={(on) => dispatch({ type: 'SET_SHARE_CONTACT', id: m.id, on })}
            />
          </View>
        ) : null}
        {isPerson ? (
          <BigButton
            kind="outlined"
            icon={X}
            label={t('ct.remove').replace('{name}', base)}
            onPress={() => {
              setManage(false);
              dispatch({ type: 'CONTACT_REMOVE', id: m.id });
            }}
          />
        ) : null}
      </Sheet>
      {!last ? <Perf style={{ marginTop: 4 }} /> : null}
    </View>
  );
}
export default function CircleScreen() {
  const { state, t } = useStore();
  const isPerson = state.role === 'person';
  const viewer = (v) => (t(`role.${v}`) === `role.${v}` ? v : t(`role.${v}`));
  return (
    <Screen title={t('tabCircle')}>
      <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Glyph icon={ShieldCheck} size={28} color={colors.indigo} />
        <Body style={{ flex: 1 }}>{t('safetyAlways')}</Body>
      </Card>
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('privacyDial')}</SectionTitle>
        <View style={styles.group}>
          {state.members.map((m, i) => (
            <MemberRow key={m.id} m={m} last={i === state.members.length - 1} />
          ))}
        </View>
      </View>
      {isPerson ? <InviteSection /> : null}
      {isPerson || state.role === 'family' ? <HelpSection /> : null}
      {isPerson ? <JoinedSection /> : null}
      {state.circles.length > 0 ? <CirclesSection /> : null}
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('whoViewed')}</SectionTitle>
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
      </View>
    </Screen>
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
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inlineToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
