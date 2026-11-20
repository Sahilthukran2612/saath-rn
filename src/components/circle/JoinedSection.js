import React from 'react';
import { View } from 'react-native';
import { BigButton, Body, Caption, Card } from '../ui';
import { Avatar, Badge, ListGroup, Segmented } from '../kit';
import { useStore } from '../../state/store';
import useJoinedDial, { sameSomeone } from '../../state/useJoinedDial';
import { colors } from '../../theme';

// People who joined this circle from their own phones, and what each of them sees. Changing the dial
// here is what the server checks before it shows that person anything (row-level security): it is the
// real control, not a label. In demo mode there is no server, so the change stays on this phone.
export default function JoinedSection() {
  const { state, dispatch, t } = useStore();
  const { setDial, msg, live } = useJoinedDial();
  if (!live && !state.demo) return null;
  // People already in the list above (same name and role as a contact I added) are not repeated here.
  const joinedOnly = state.joined.filter((j) => !state.members.some((c) => sameSomeone(c, j)));

  return (
    <View style={{ gap: 12 }}>
      <Body bold>{t('jm.title')}</Body>
      {joinedOnly.length === 0 ? (
        <Caption>{t('jm.none')}</Caption>
      ) : (
        <ListGroup>
          {joinedOnly.map((m, i) => (
            <View
              key={m.id}
              style={{
                padding: 16,
                gap: 12,
                borderBottomWidth: i === joinedOnly.length - 1 ? 0 : 1,
                borderBottomColor: colors.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={m.name} role={m.role} size={44} />
                <View style={{ flex: 1 }}>
                  <Body bold>{m.name}</Body>
                  <Caption>{t(`role.${m.role}`)}</Caption>
                </View>
                {m.time_off ? <Badge tone="haldi" label={t('jm.timeOff')} /> : null}
              </View>
              <Segmented
                value={m.dial}
                onChange={(v) => setDial(m, v)}
                options={[0, 1, 2].map((d) => ({ value: d, label: t(`dial${d}`) }))}
              />
              <Caption>{t('jm.sees').replace('{name}', m.name).replace('{level}', t(`dial${m.dial}`))}</Caption>
            </View>
          ))}
        </ListGroup>
      )}
      {msg ? <Body bold>{msg}</Body> : null}
      {state.demo && !live ? (
        <Card tone="haldi" style={{ gap: 8 }}>
          <Caption style={{ color: colors.ink }}>{t('demo.circleNote')}</Caption>
          <BigButton
            kind="quiet"
            label={t('demo.joinedAdd')}
            onPress={() => dispatch({ type: 'DEMO_JOINED_ADD' })}
          />
        </Card>
      ) : null}
    </View>
  );
}