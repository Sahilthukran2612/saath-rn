import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Minus, Plus, Send, X } from '../icons';
import { BigButton, Body, Caption, Card, Chip } from '../ui';
import { Field, ListGroup, ListRow, SectionTitle } from '../kit';
import { useStore } from '../../state/store';
import { WHEN } from '../../medicines';
import { draftFromPlan, emptyDraft, planFromDraft, sanitizePlan } from '../../carePlan';
import { cloudConfig, fetchLatestPlan, isConfigured, publishPlan } from '../../services/cloud';

const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };
const hourText = (h) => (h == null ? '' : `${String(h).padStart(2, '0')}:00`);

// The clinician's side: write the plan for the person, press Publish, and their phone applies it by itself. The
// last published plan is loaded so a change is an edit, not a rewrite. Nothing is calculated or suggested here: every
// field is typed by the clinician.
export default function CarePlanBuilder({ circle }) {
  const { state, dispatch, t } = useStore();
  const [draft, setDraft] = useState(emptyDraft());
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [when, setWhen] = useState('afterBreakfast');
  const [task, setTask] = useState('');
  const [hour, setHour] = useState(8);
  const [status, setStatus] = useState('');
  const cfg = cloudConfig();

  useEffect(() => {
    if (!isConfigured(cfg) || !state.cloud.access) return undefined;
    let live = true;
    fetchLatestPlan(cfg, state.cloud, circle.household_id).then((r) => {
      const clean = r.ok && r.row ? sanitizePlan(r.row.plan) : null;
      if (live && clean) setDraft(draftFromPlan(clean));
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circle.household_id]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const addMed = () => {
    if (name.trim().length < 2) return;
    set({ meds: [...draft.meds, { name: name.trim(), dose: dose.trim(), when }] });
    setName('');
    setDose('');
  };
  const addTask = () => {
    if (task.trim().length < 2) return;
    set({ tasks: [...draft.tasks, { title: task.trim(), hour }] });
    setTask('');
  };

  const publish = async () => {
    const plan = planFromDraft(draft);
    if (!plan) return setStatus(t('plan.empty'));
    if (!state.cloud.access) return setStatus(t('plan.needSignIn'));
    setStatus(t('plan.sending'));
    const r = await publishPlan(cfg, state.cloud, circle.household_id, state.profile.name, plan);
    if (r.session) dispatch({ type: 'CLOUD_SET', patch: r.session });
    setStatus(r.ok ? t('plan.sent') : r.status === 0 ? t('plan.offline') : t('plan.failed'));
    return undefined;
  };

  return (
    <View style={{ gap: 14 }}>
      <SectionTitle>{t('plan.meds')}</SectionTitle>
      {draft.meds.length > 0 ? (
        <ListGroup>
          {draft.meds.map((m, i) => (
            <ListRow
              key={`${m.name}-${i}`}
              title={m.name}
              subtitle={`${m.dose ? `${m.dose}, ` : ''}${t(`when.${m.when}`)}`}
              trailing={<X size={22} color="#717AA3" />}
              onPress={() => set({ meds: draft.meds.filter((_, j) => j !== i) })}
              label={`${t('remove')}: ${m.name}`}
              chevron={false}
              last={i === draft.meds.length - 1}
            />
          ))}
        </ListGroup>
      ) : null}
      <Card style={{ gap: 10 }}>
        <Field label={t('med.name')} value={name} onChangeText={setName} />
        <Field label={t('med.dose')} value={dose} onChangeText={setDose} />
        <View style={row}>
          {WHEN.map(([id]) => (
            <Chip key={id} label={t(`when.${id}`)} active={when === id} onPress={() => setWhen(id)} />
          ))}
        </View>
        <BigButton kind="quiet" icon={Plus} label={t('med.save')} onPress={addMed} />
      </Card>

      <SectionTitle>{t('plan.tasks')}</SectionTitle>
      {draft.tasks.length > 0 ? (
        <ListGroup>
          {draft.tasks.map((x, i) => (
            <ListRow
              key={`${x.title}-${i}`}
              title={x.title}
              subtitle={hourText(x.hour)}
              trailing={<X size={22} color="#717AA3" />}
              onPress={() => set({ tasks: draft.tasks.filter((_, j) => j !== i) })}
              label={`${t('remove')}: ${x.title}`}
              chevron={false}
              last={i === draft.tasks.length - 1}
            />
          ))}
        </ListGroup>
      ) : null}
      <Card style={{ gap: 10 }}>
        <Field label={t('taskName')} value={task} onChangeText={setTask} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Caption style={{ flex: 1 }}>{t('rem.at').replace('{time}', hourText(hour))}</Caption>
          <Chip label={t('rem.earlier')} icon={Minus} onPress={() => setHour((h) => (h + 23) % 24)} />
          <Chip label={t('rem.later')} icon={Plus} onPress={() => setHour((h) => (h + 1) % 24)} />
        </View>
        <BigButton kind="quiet" icon={Plus} label={t('addTask')} onPress={addTask} />
      </Card>

      <Field
        label={t('plan.testPerDay')}
        value={draft.testPerDay}
        keyboardType="number-pad"
        onChangeText={(v) => set({ testPerDay: v.replace(/\D/g, '').slice(0, 1) })}
      />
      <Field label={t('plan.notes')} value={draft.notes} multiline onChangeText={(v) => set({ notes: v })} />

      <BigButton icon={Send} label={t('plan.publish')} onPress={publish} />
      {status ? <Body bold>{status}</Body> : null}
      <Caption>{t('plan.safety')}</Caption>
    </View>
  );
}
