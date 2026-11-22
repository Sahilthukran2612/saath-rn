import React, { useState } from 'react';
import { View } from 'react-native';
import { ArrowRight, Bell, Check, MessageCircle, Phone, ShieldCheck, Siren } from '../components/icons';
import { BigButton, Body, Caption, Card, Chip, Screen, Title } from '../components/ui';
import { Avatar, Field, ListGroup, ListRow, Segmented, Toggle, SectionTitle } from '../components/kit';
import Doodle from '../components/doodles';
import { Push } from '../components/motion';
import SetupProgress from '../components/SetupProgress';
import ContactsForm from '../components/circle/ContactsForm';
import { useStore } from '../state/store';
import useChoices from '../state/useChoices';
import { askSmsPermission, smsAvailable } from '../services/sms';
import { askReminderPermission } from '../services/reminders';
import { callsAvailable } from '../services/calls';
import { colors } from '../theme';

// One picture per step, so each page is recognisable at a glance.
const HERO = ['heart', 'face', 'people', 'shield'];

// The first-run setup. It collects only what the app needs to protect this person: who is using the phone, a
// name, the people to reach, and how alerts should work. Nothing here is sent anywhere.
export default function OnboardingScreen() {
  const { state, dispatch, t } = useStore();
  const choices = useChoices();
  // Someone who signed in to an existing account is asked only for what lives on this phone: the people to reach
  // and how alerts work. Everyone else gets the whole setup.
  const order = state.returning ? [2, 3] : [0, 1, 2, 3];
  const [index, setIndex] = useState(0);
  const step = order[index];
  const [name, setName] = useState(state.profile.name || '');
  const [condition, setCondition] = useState(state.profile.condition || '');
  const set = (key, value) => dispatch({ type: 'SET', key, value });
  const real = state.members;

  const next = () => {
    if (step === 1)
      dispatch({ type: 'PROFILE_SET', patch: { name: name.trim(), condition: condition.trim() } });
    setIndex((n) => n + 1);
  };

  return (
    <Screen setup>
      <SetupProgress step={index} total={order.length} />
      <View style={{ alignItems: 'center', paddingVertical: 4 }}>
        <Doodle name={HERO[step]} size={112} color={step === 0 ? colors.leaf : colors.indigo} />
      </View>
      <Push key={step} style={{ flex: 0 }}>
        {step === 0 ? (
          <View style={{ gap: 16 }}>
            <Title style={{ fontSize: 30 }}>{t('ob.welcome')}</Title>
            <Body>{t('ob.intro')}</Body>
            <SectionTitle>{t('language')}</SectionTitle>
            <Segmented
              value={state.lang}
              onChange={(v) => set('lang', v)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'हिन्दी' },
              ]}
            />
            <SectionTitle>{t('ob.who')}</SectionTitle>
            <Segmented
              value={state.mode}
              onChange={(v) => set('mode', v)}
              options={['teen', 'elder', 'adult'].map((v) => ({ value: v, label: t(`mode.${v}`) }))}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ gap: 14 }}>
            <Title style={{ fontSize: 28 }}>{t('ob.nameTitle')}</Title>
            <Field label={t('ob.name')} value={name} onChangeText={setName} />
            <Field label={t('ob.condition')} value={condition} onChangeText={setCondition} />
            <Caption>{t('ob.privacy')}</Caption>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: 14 }}>
            <Title style={{ fontSize: 28 }}>{t('ob.contactsTitle')}</Title>
            <Body>{t('ob.contactsNote')}</Body>
            {real.length > 0 ? (
              <ListGroup>
                {real.map((m, i) => (
                  <ListRow
                    key={m.id}
                    lead={<Avatar name={m.name} role={m.role} size={44} />}
                    title={m.name}
                    subtitle={`${t(`role.${m.role}`)}, ${m.phone}`}
                    trailing={
                      <Chip
                        label={t('ct.remove').replace('{name}', m.name)}
                        onPress={() => dispatch({ type: 'CONTACT_REMOVE', id: m.id })}
                      />
                    }
                    last={i === real.length - 1}
                  />
                ))}
              </ListGroup>
            ) : (
              <Body bold style={{ color: colors.madder }}>
                {t('ob.skipWarn')}
              </Body>
            )}
            <Card style={{ gap: 12 }}>
              <ContactsForm />
            </Card>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={{ gap: 14 }}>
            <Title style={{ fontSize: 28 }}>{t('ob.choicesTitle')}</Title>
            <Caption>{t('ob.choicesNote')}</Caption>
            <ListGroup>
              <ListRow
                icon={Phone}
                title={t('call.title')}
                subtitle={
                  !callsAvailable
                    ? t('call.unavailable')
                    : state.autoCallDenied
                      ? t('call.denied')
                      : t('call.note')
                }
                trailing={
                  <Toggle value={state.autoCall} label={t('call.title')} onValueChange={choices.autoCall} />
                }
              />
              <ListRow
                icon={MessageCircle}
                title={t('sms.title')}
                subtitle={
                  !smsAvailable ? t('sms.unavailable') : state.autoSmsDenied ? t('sms.denied') : t('sms.note')
                }
                trailing={
                  <Toggle
                    value={state.autoSms}
                    label={t('sms.title')}
                    onValueChange={async (on) => {
                      set('autoSmsDenied', false);
                      if (!on) return set('autoSms', false);
                      if (await askSmsPermission()) return set('autoSms', true);
                      set('autoSms', false);
                      set('autoSmsDenied', true);
                      return undefined;
                    }}
                  />
                }
              />
              <ListRow
                icon={Siren}
                title={t('siren.title')}
                subtitle={t('siren.note')}
                trailing={
                  <Toggle
                    value={state.siren}
                    label={t('siren.title')}
                    onValueChange={(on) => set('siren', on)}
                  />
                }
              />
              <ListRow
                icon={Bell}
                title={t('rem.toggle')}
                subtitle={state.remindersDenied ? t('rem.denied') : t('rem.note')}
                trailing={
                  <Toggle
                    value={state.reminders}
                    label={t('rem.toggle')}
                    onValueChange={async (on) => {
                      set('remindersDenied', false);
                      if (on && !(await askReminderPermission())) {
                        set('reminders', false);
                        set('remindersDenied', true);
                        return;
                      }
                      set('reminders', on);
                    }}
                  />
                }
              />
              <ListRow
                icon={ShieldCheck}
                title={t('bg.title')}
                subtitle={t('bg.note')}
                trailing={
                  <Toggle
                    value={state.background}
                    label={t('bg.title')}
                    onValueChange={(on) => set('background', on)}
                  />
                }
                last
              />
            </ListGroup>
          </View>
        ) : null}
      </Push>

      <View style={{ gap: 10 }}>
        {index < order.length - 1 ? (
          <BigButton icon={ArrowRight} label={t('ob.next')} onPress={next} />
        ) : (
          <BigButton
            kind="ok"
            icon={Check}
            label={t('ob.finish')}
            onPress={() => {
              set('returning', false);
              set('onboarded', true);
            }}
          />
        )}
        {index > 0 ? (
          <BigButton kind="text" label={t('back')} onPress={() => setIndex((n) => n - 1)} />
        ) : null}
      </View>
    </Screen>
  );
}
