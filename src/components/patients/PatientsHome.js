import React, { useState } from 'react';
import { View } from 'react-native';
import Text from '../AppText';
import { BigButton, Body, Caption, Card } from '../ui';
import { Avatar, Badge, ListGroup, ListRow, SectionTitle } from '../kit';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';

import { describeEvent, newest, pendingAlert } from '../../circleFeed';
import JoinCard from '../circle/JoinCard';
import PatientPanel from './PatientPanel';
import Doodle from '../doodles';
import AddMyPatient from './AddMyPatient';
import { visitStatus } from '../../visits';
import { circlesFor, hiddenCount, isDoctor } from '../../who';
import { colors, fonts } from '../../theme';

const ROLE_ORDER = ['family', 'asha', 'neighbour'];

// Joining is the less common path, so it sits behind one plain link.
function JoinLink() {
  const { state, t } = useStore();
  const [asked, setOpen] = useState(false);
  const open = asked || !!state.joinCode; // a scanned code opens the box straight away
  if (open) return <JoinCard onJoined={() => setOpen(false)} />;
  return <BigButton kind="text" label={t('join.link')} onPress={() => setOpen(true)} />;
}

// The home of everyone who looks after someone: all their people in one place. The role is per person, because the
// same phone can be a guardian for one, a neighbour for another and a doctor for a third. What each role gets to see
// is decided by the server under that person's privacy dial; this screen only words it. Most urgent first.
export default function PatientsHome() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const [open, setOpen] = useState(null); // household id
  const nameOf = (c) => c.person_name || t('cf.someone');
  const alertOf = (c) => pendingAlert(state.feeds[c.household_id] || [], state.seen[c.household_id], now);

  const circle = circlesFor(state).find((c) => c.household_id === open);
  if (circle) return <PatientPanel circle={circle} onBack={() => setOpen(null)} />;

  const all = circlesFor(state);
  const hidden = hiddenCount(state);
  const doctor = isDoctor(state);
  const needing = all.filter(alertOf).length;
  const roles = doctor ? [] : ROLE_ORDER.filter((r) => all.some((c) => c.role === r));
  const grouped = roles.length > 1;

  const row = (c, i, list) => {
    const feed = state.feeds[c.household_id] || [];
    const alert = alertOf(c);
    const latest = feed[0];
    return (
      <ListRow
        key={c.household_id}
        lead={<Avatar name={nameOf(c)} role={c.role} size={44} />}
        title={nameOf(c)}
        subtitle={
          (grouped ? '' : `${t(`role.${c.role}`)}, `) +
          (latest ? describeEvent(latest, nameOf(c), t) : t('cf.empty'))
        }
        trailing={
          alert ? (
            <Badge tone="brick" label={t('tabSafety')} />
          ) : c.role === 'asha' && visitStatus(state.visits[c.household_id], now).due ? (
            <Badge tone="haldi" label={t('vis.due')} />
          ) : (
            <Badge tone="leaf" label={t('pt.ok')} />
          )
        }
        label={nameOf(c)}
        onPress={() => {
          setOpen(c.household_id);
          if (newest(feed)) dispatch({ type: 'SEEN_SET', id: c.household_id, at: newest(feed) });
        }}
        last={i === list.length - 1}
      />
    );
  };

  return (
    <View style={{ gap: 16 }}>
      <Card
        style={[
          { flexDirection: 'row', alignItems: 'center', gap: 14 },
          needing ? { backgroundColor: colors.brickTint } : null,
        ]}
        accessibilityRole="header"
      >
        <Doodle name="people" size={56} color={needing ? colors.brick : colors.indigo} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: fonts.semi,
              fontSize: 18,
              lineHeight: 24,
              color: needing ? colors.brick : colors.ink,
            }}
          >
            {t(doctor ? 'pt.titleDoctor' : 'pt.title')}
          </Text>
          <Caption style={needing ? { color: colors.brick } : null}>
            {all.length === 0
              ? t('pt.none')
              : needing
                ? t('pt.need').replace('{n}', String(needing))
                : t('pt.allWell')}
          </Caption>
        </View>
      </Card>

      {all.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
          <Doodle name="calendar" size={88} />
          <Body style={{ textAlign: 'center' }} soft>
            {t('mh.empty')}
          </Body>
        </Card>
      ) : grouped ? (
        roles.map((r) => {
          const list = all
            .filter((c) => c.role === r)
            .sort((a, b) => Number(!!alertOf(b)) - Number(!!alertOf(a)));
          return (
            <View key={r} style={{ gap: 8 }}>
              <SectionTitle>{t(`pt.as.${r}`)}</SectionTitle>
              <ListGroup>{list.map((c, i) => row(c, i, list))}</ListGroup>
            </View>
          );
        })
      ) : (
        <ListGroup>
          {[...all]
            .sort((a, b) => Number(!!alertOf(b)) - Number(!!alertOf(a)))
            .map((c, i, list) => row(c, i, list))}
        </ListGroup>
      )}

      {hidden > 0 ? (
        <Card tone="haldi">
          <Caption style={{ color: colors.ink }}>
            {t(doctor ? 'pt.hiddenDoctor' : 'pt.hiddenMember').replace('{n}', String(hidden))}
          </Caption>
        </Card>
      ) : null}
      <AddMyPatient />
      <JoinLink />
    </View>
  );
}
