import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ArrowRight, Check } from '../components/icons';
import { BigButton, Body, Caption, Card, Chip, Title } from '../components/ui';
import { Avatar, Field, ListGroup, ListRow, Segmented, Toggle } from '../components/kit';
import { SaathMark } from '../components/art';
import ContactsForm from '../components/circle/ContactsForm';
import { useStore } from '../state/store';
import useChoices from '../state/useChoices';
import { askSmsPermission, smsAvailable } from '../services/sms';
import { askReminderPermission } from '../services/reminders';
import { callsAvailable } from '../services/calls';
import { colors } from '../theme';

const STEPS = 4;

// The first-run setup. It collects only what the app needs to protect this person: who is using the phone, a
// name, the people to reach, and how alerts should work. Nothing here is sent anywhere.
export default function OnboardingScreen() {
  const { state, dispatch, t } = useStore();
  const choices = useChoices();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.profile.name || '');
  const [condition, setCondition] = useState(state.profile.condition || '');
  const set = (key, value) => dispatch({ type: 'SET', key, value });
  const real = state.members.filter((m) => !m.demo);

  const next = () => {
    if (step === 1) dispatch({ type: 'PROFILE_SET', patch: { name: name.trim(), condition: condition.trim() } });
    setStep((s) => s + 1);
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 32, gap: 18 }}>
      <SaathMark size={56} />
      <Caption>{t('ob.step').replace('{n}', String(step + 1)).replace('{total}', String(STEPS))}</Caption>

      {step === 0 ? (
        <View style={{ gap: 16 }}>
          <Title style={{ fontSize: 32, letterSpacing: -0.6 }}>{t('ob.welcome')}</Title>
          <Body>{t('ob.intro')}</Body>
          <Body bold>{t('language')}</Body>
          <Segmented
            value={state.lang}
            onChange={(v) => set('lang', v)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिन्दी' },
            ]}
          />
          <Body bold>{t('ob.who')}</Body>
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
              title={t('call.title')}
              subtitle={!callsAvailable && !state.demo ? t('call.unavailable') : state.autoCallDenied ? t('call.denied') : t('call.note')}
              trailing={<Toggle value={state.autoCall} label={t('call.title')} onValueChange={choices.autoCall} />}
            />
            <ListRow
              title={t('sms.title')}
              subtitle={!smsAvailable && !state.demo ? t('sms.unavailable') : state.autoSmsDenied ? t('sms.denied') : t('sms.note')}
              trailing={
                <Toggle
                  value={state.autoSms}
                  label={t('sms.title')}
                  onValueChange={async (on) => {
                    set('autoSmsDenied', false);
                    if (!on) return set('autoSms', false);
                    if (!smsAvailable && state.demo) return set('autoSms', true);
                    if (await askSmsPermission()) return set('autoSms', true);
                    set('autoSms', false);
                    set('autoSmsDenied', true);
                    return undefined;
                  }}
                />
              }
            />
            <ListRow
              title={t('siren.title')}
              subtitle={t('siren.note')}
              trailing={<Toggle value={state.siren} label={t('siren.title')} onValueChange={(on) => set('siren', on)} />}
            />
            <ListRow
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
              title={t('bg.title')}
              subtitle={t('bg.note')}
              trailing={<Toggle value={state.background} label={t('bg.title')} onValueChange={(on) => set('background', on)} />}
              last
            />
          </ListGroup>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        {step < STEPS - 1 ? (
          <BigButton icon={ArrowRight} label={t('ob.next')} onPress={next} />
        ) : (
          <BigButton kind="ok" icon={Check} label={t('ob.finish')} onPress={() => set('onboarded', true)} />
        )}
        {step > 0 ? <BigButton kind="quiet" label={t('back')} onPress={() => setStep((s) => s - 1)} /> : null}
      </View>
    </ScrollView>
  );
}