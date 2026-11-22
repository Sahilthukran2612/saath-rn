import React, { useState } from 'react';
import { View } from 'react-native';
import { Pill, Plus, X } from '../icons';
import { BigButton, Body, Caption, Chip, Title } from '../ui';
import { CheckMark, Field, ListGroup, ListRow, SectionTitle } from '../kit';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { WHEN, dueMedicines, takenToday, validMedicine } from '../../medicines';
import { nowMs } from '../../services/clock';
import Sheet from '../Sheet';

const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };

// One medicine, as the person typed it from the prescription: the name, the dose text exactly as written, and a
// "taken" mark for today. Saath never suggests or changes a dose.
function MedRow({ m, taken, last }) {
  const { state, dispatch, t } = useStore();
  const author = state.carePlan?.author;
  return (
    <ListRow
      icon={Pill}
      title={m.name}
      subtitle={`${m.dose ? `${m.dose}, ` : ''}${t(`when.${m.when}`)}${
        m.plan && author ? `. ${t('plan.setBy').replace('{who}', author)}` : ''
      }`}
      trailing={<CheckMark done={taken} size={34} />}
      onPress={() => dispatch({ type: 'MED_TAKEN', id: m.id, now: nowMs() })}
      label={`${m.name}, ${taken ? t('med.taken') : t('med.notTaken')}`}
      chevron={false}
      last={last}
    />
  );
}

// The medicines card for the Care tab: the list grouped by time of day, plus a short form to add one.
export default function Medicines() {
  const { state, dispatch, t } = useStore();
  const now = useNow(60000);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [when, setWhen] = useState('afterBreakfast');
  const [open, setOpen] = useState(false);
  const taken = new Set(takenToday(state.medTaken, now));
  const sorted = [...state.medicines].sort(
    (a, b) => WHEN.findIndex(([id]) => id === a.when) - WHEN.findIndex(([id]) => id === b.when)
  );
  const add = () => {
    if (!validMedicine(name)) return;
    dispatch({ type: 'MED_ADD', id: String(nowMs()), name: name.trim(), dose: dose.trim(), when });
    setName('');
    setDose('');
  };
  return (
    <View style={{ gap: 12 }}>
      <Title style={{ fontSize: 22 }}>{t('med.title')}</Title>
      {sorted.length === 0 ? (
        <Body>{t('med.empty')}</Body>
      ) : (
        <ListGroup>
          {sorted.map((m, i) => (
            <MedRow key={m.id} m={m} taken={taken.has(m.id)} last={i === sorted.length - 1} />
          ))}
        </ListGroup>
      )}
      <Caption>{t('med.note')}</Caption>
      <BigButton kind="quiet" icon={Plus} label={t('med.add')} onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={t('med.add')}>
        <Field label={t('med.name')} value={name} onChangeText={setName} />
        <Field label={t('med.dose')} value={dose} onChangeText={setDose} />
        <SectionTitle>{t('med.when')}</SectionTitle>
        <View style={row}>
          {WHEN.map(([id]) => (
            <Chip key={id} label={t(`when.${id}`)} active={when === id} onPress={() => setWhen(id)} />
          ))}
        </View>
        <BigButton
          icon={Plus}
          label={t('med.save')}
          onPress={() => {
            add();
            if (validMedicine(name)) setOpen(false);
          }}
        />
        {state.medicines.some((m) => !m.plan) ? (
          <View style={row}>
            {state.medicines
              .filter((m) => !m.plan)
              .map((m) => (
                <Chip
                  key={m.id}
                  label={`${t('remove')}: ${m.name}`}
                  icon={X}
                  onPress={() => dispatch({ type: 'MED_REMOVE', id: m.id })}
                />
              ))}
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

// On Today: the medicines whose time has come and are not yet marked, each with one tap to mark it.
export function MedicinesNow() {
  const { state, t } = useStore();
  const now = useNow(60000);
  const due = dueMedicines(state.medicines, state.medTaken, now);
  if (state.alert || due.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      <Title style={{ fontSize: 22 }}>{t('med.now')}</Title>
      <ListGroup>
        {due.map((m, i) => (
          <MedRow key={m.id} m={m} taken={false} last={i === due.length - 1} />
        ))}
      </ListGroup>
    </View>
  );
}
