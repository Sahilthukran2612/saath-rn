import React from 'react';
import { View } from 'react-native';
import { TriangleAlert } from './icons';
import { BigButton, Body, Caption, Card } from './ui';
import { useStore } from '../state/store';
import { useNav } from './nav';
import { useNow } from './useNow';
import { ago, allPending, describeEvent } from '../circleFeed';
import { colors } from '../theme';

// A fall or long quiet reported by someone I look after. Shown at the top of every screen until I
// say I have seen it. Brick red is allowed here: this is a real safety alert.
// It only appears while the app is open: push notifications are not built yet.
export default function CircleAlertBanner() {
  const { state, dispatch, t } = useStore();
  const goTo = useNav();
  const now = useNow();
  const [top] = allPending(state.circles, state.feeds, state.seen, now);
  if (!top) return null;
  const name = top.circle.person_name || t('cf.someone');
  return (
    <Card
      accessibilityRole="alert"
      style={{
        marginHorizontal: 16,
        marginBottom: 8,
        gap: 8,
        backgroundColor: colors.brickTint,
        borderColor: colors.brick,
        borderWidth: 1.5,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TriangleAlert size={26} color={colors.brick} />
        <Body bold style={{ flex: 1, color: colors.brick }}>
          {describeEvent(top.event, name, t)}
        </Body>
      </View>
      <Caption>{ago(top.event.created_at, now, t)}</Caption>
      <BigButton
        kind="quiet"
        label={t('cf.seen')}
        onPress={() => {
          dispatch({ type: 'SEEN_SET', id: top.circle.household_id, at: top.event.created_at });
          goTo('circle');
        }}
      />
    </Card>
  );
}
