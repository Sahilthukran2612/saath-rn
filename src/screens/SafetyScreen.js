import React from 'react';
import { View } from 'react-native';
import { Activity, Moon, RotateCcw, Smartphone, Users } from '../components/icons';
import { Body, Card, Screen, Title } from '../components/ui';
import { Avatar, ListGroup, ListRow, SectionTitle } from '../components/kit';
import Doodle from '../components/doodles';
import HeartCard from '../components/safety/HeartCard';
import { SHOW_HEART } from '../features';
import { useNav } from '../components/nav';
import { useStore } from '../state/store';
import { escalationChain } from '../logic';
import { explainBaseline } from '../care';
import { colors } from '../theme';

// Safety shows only what protects the person: that the phone is watching, who it calls and in what order, and how
// sensitive it is for them. The study tally lives under Me, Study data.
export default function SafetyScreen() {
  const { state, dispatch, t } = useStore();
  const go = useNav();
  const chain = escalationChain(state.members);
  return (
    <Screen title={t('tabSafety')}>
      <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
        <Doodle name="shield" size={104} color={colors.leaf} />
        <Title style={{ textAlign: 'center' }}>{state.background ? t('watch.bg') : t('watch.on')}</Title>
        <Body soft style={{ textAlign: 'center' }}>
          {t('helpsNotice')}
        </Body>
      </Card>

      <View style={{ gap: 8 }}>
        <SectionTitle>{t('safety.calls')}</SectionTitle>
        <ListGroup>
          {chain.length > 0 ? (
            chain.map((m, i) => (
              <ListRow
                key={m.id}
                lead={<Avatar name={m.name} role={m.role} size={36} />}
                title={m.name}
                subtitle={`${i + 1}. ${t(`role.${m.role}`)}`}
              />
            ))
          ) : (
            <ListRow icon={Users} title={t('safety.callsEmpty')} onPress={() => go('circle')} chevron />
          )}
        </ListGroup>
      </View>

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
          />
        </ListGroup>
      </View>

      {SHOW_HEART ? <HeartCard /> : null}

      <ListGroup>
        <ListRow icon={Smartphone} title={t('bg.title')} onPress={() => go('me')} chevron />
      </ListGroup>
    </Screen>
  );
}
