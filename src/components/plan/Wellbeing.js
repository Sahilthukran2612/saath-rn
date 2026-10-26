import React, { useState } from 'react';
import { Image, Share, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BigButton, Body, Card, Chip, Title } from '../ui';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { FOOT_ITEMS, idrsScore, schoolCard, weekKey, weeklySummary } from '../../plan';
import food from '../../content/food.json';
import { colors } from '../../theme';

const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 6 };
const field = {
  minHeight: 56,
  fontSize: 18,
  borderWidth: 2,
  borderColor: colors.indigo,
  borderRadius: 12,
  paddingHorizontal: 12,
  backgroundColor: colors.white,
};
const MOODS = ['😣', '😟', '😐', '🙂', '😄'];

// A weekly "how did this week feel?" The reply is always gentle: no counts of misses,
// no nudge to do more. A hard week points to company and Time off.
export function CheckinSection() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const thisWeek = state.checkins.find((c) => c.week === weekKey(now));
  const summary = weeklySummary(state.checkins);
  return (
    <View style={{ gap: 12 }}>
      <Title>{t('checkin.title')}</Title>
      <View style={row}>
        {MOODS.map((m, i) => (
          <Chip
            key={m}
            label={`${m} ${t(`mood.${i + 1}`)}`}
            active={thisWeek?.mood === i + 1}
            onPress={() => dispatch({ type: 'CHECKIN', mood: i + 1, at: Date.now() })}
          />
        ))}
      </View>
      <Card>
        <Body bold>{t(`wellbeing.${summary.id}`)}</Body>
        {state.checkins.length > 1 && (
          <Body>
            {state.checkins
              .slice(-8)
              .map((c) => MOODS[c.mood - 1])
              .join('  ')}
          </Body>
        )}
      </Card>
    </View>
  );
}

export function FoodSection() {
  const { state, dispatch, t } = useStore();
  const lang = state.lang === 'hi' ? 'hi' : 'en';
  const [region, setRegion] = useState('north');
  const meals = food.regions.find((r) => r.id === region)?.meals ?? [];
  const today = new Date().toDateString();
  const todays = state.meals.filter((m) => new Date(m.at).toDateString() === today);
  return (
    <View style={{ gap: 12 }}>
      <Body bold>{t('food.verify')}</Body>
      <Card>
        <Title>{t('food.plate')}</Title>
        {food.plate.map((p) => (
          <Body key={p.id}>
            {p.icon} {p[lang]}
          </Body>
        ))}
      </Card>
      <Card>
        <Title>{t('food.region')}</Title>
        <View style={row}>
          {food.regions.map((r) => (
            <Chip key={r.id} label={r[lang]} active={region === r.id} onPress={() => setRegion(r.id)} />
          ))}
        </View>
        {meals.map((m) => (
          <Body key={m.en}>
            {m.icon} {m[lang]}
          </Body>
        ))}
      </Card>
      <Card>
        <Title>{t('food.fasting')}</Title>
        {food.fasting.map((f) => (
          <Body key={f.en}>• {f[lang]}</Body>
        ))}
        <Title>{t('food.festival')}</Title>
        {food.festival.map((f) => (
          <Body key={f.en}>• {f[lang]}</Body>
        ))}
      </Card>
      <Card>
        <Title>{t('food.log')}</Title>
        <View style={row}>
          {food.mealIcons.map((icon) => (
            <Chip
              key={icon}
              label={icon}
              onPress={() => dispatch({ type: 'MEAL_LOG', id: String(Date.now()), icon, at: Date.now() })}
            />
          ))}
        </View>
        <Body>
          {t('food.today')}: {todays.map((m) => m.icon).join(' ') || '—'}
        </Body>
      </Card>
    </View>
  );
}

// Foot check, waist and the risk questionnaire. Photos are for the person's own diary and the
// clinic: Saath does not look at them or analyse them.
export function BodySection() {
  const { state, dispatch, t } = useStore();
  const [items, setItems] = useState([]);
  const [waist, setWaist] = useState('');
  const [a, setA] = useState({ age: '', gender: 'female', activity: 'moderate', family: 'none' });
  const [result, setResult] = useState(state.risk?.result ?? null);
  const toggle = (id) => setItems(items.includes(id) ? items.filter((x) => x !== id) : [...items, id]);

  const photo = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const r = await ImagePicker.launchCameraAsync({ quality: 0.5 });
      if (!r.canceled && r.assets?.[0]?.uri)
        dispatch({ type: 'FOOT_PHOTO', uri: r.assets[0].uri, at: Date.now() });
    } catch {
      // the diary is optional; never block the checklist
    }
  };
  const calc = () => {
    const age = parseInt(a.age, 10);
    const w = state.waist[state.waist.length - 1]?.cm;
    if (!(age > 0) || !w) return;
    const r = idrsScore({ age, gender: a.gender, waistCm: w, activity: a.activity, family: a.family });
    setResult(r);
    dispatch({ type: 'RISK_SET', answers: a, result: r, at: Date.now() });
  };
  const lastWaist = state.waist[state.waist.length - 1];

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Title>{t('foot.title')}</Title>
        {FOOT_ITEMS.map((id) => (
          <Chip
            key={id}
            label={`${items.includes(id) ? '✓ ' : ''}${t(`foot.${id}`)}`}
            active={items.includes(id)}
            onPress={() => toggle(id)}
          />
        ))}
        <BigButton
          label={t('foot.save')}
          onPress={() => {
            dispatch({ type: 'FOOT_CHECK', at: Date.now(), items });
            setItems([]);
          }}
        />
        <Body>
          {t('foot.checks')}: {state.footChecks.length}
        </Body>
        <Body bold>{t('foot.note')}</Body>
        <BigButton kind="quiet" icon="📷" label={t('foot.photo')} onPress={photo} />
        <Body>{t('foot.photoNote')}</Body>
        <View style={row}>
          {state.footPhotos.slice(-4).map((p) => (
            <Image
              key={p.uri}
              source={{ uri: p.uri }}
              style={{ width: 80, height: 80, borderRadius: 10 }}
              accessibilityLabel={t('foot.photos')}
            />
          ))}
        </View>
      </Card>
      <Card>
        <Title>{t('waist.title')}</Title>
        <TextInput
          accessibilityLabel={t('waist.title')}
          keyboardType="number-pad"
          value={waist}
          onChangeText={setWaist}
          placeholder="cm"
          style={field}
        />
        <BigButton
          label={t('waist.save')}
          onPress={() => {
            dispatch({ type: 'WAIST_ADD', cm: parseInt(waist, 10), at: Date.now() });
            setWaist('');
          }}
        />
        {lastWaist && <Body bold>{lastWaist.cm} cm</Body>}
      </Card>
      <Card>
        <Title>{t('risk.title')}</Title>
        <TextInput
          accessibilityLabel={t('risk.age')}
          placeholder={t('risk.age')}
          keyboardType="number-pad"
          value={a.age}
          onChangeText={(v) => setA({ ...a, age: v })}
          style={field}
        />
        <Body bold>{t('risk.gender')}</Body>
        <View style={row}>
          {['female', 'male'].map((g) => (
            <Chip
              key={g}
              label={t(`risk.${g}`)}
              active={a.gender === g}
              onPress={() => setA({ ...a, gender: g })}
            />
          ))}
        </View>
        <Body bold>{t('risk.activity')}</Body>
        <View style={row}>
          {['vigorous', 'moderate', 'mild', 'sedentary'].map((g) => (
            <Chip
              key={g}
              label={t(`act.${g}`)}
              active={a.activity === g}
              onPress={() => setA({ ...a, activity: g })}
            />
          ))}
        </View>
        <Body bold>{t('risk.family')}</Body>
        <View style={row}>
          {['none', 'one', 'both'].map((g) => (
            <Chip
              key={g}
              label={t(`fam.${g}`)}
              active={a.family === g}
              onPress={() => setA({ ...a, family: g })}
            />
          ))}
        </View>
        <BigButton label={t('risk.calc')} onPress={calc} />
        {result && (
          <>
            <Body bold>
              {t('risk.score')}: {result.score}
            </Body>
            <Body>{t(`risk.${result.level}`)}</Body>
          </>
        )}
        <Body>{t('risk.note')}</Body>
      </Card>
    </View>
  );
}

// Teacher card for a teen with type 1 diabetes. Sharing is the teen's own tap, and each share is
// written to the audit log so the person can see it. The guardian's number is on the card only
// if the guardian agreed to show it.
export function SchoolSection() {
  const { state, dispatch, t } = useStore();
  const card = schoolCard(state);
  const lines = [
    card.name && `${card.name}`,
    ...card.steps.map((s, i) => `${i + 1}. ${t(`school.${s}`)}`),
    card.phone && `${t('school.guardian')}: ${card.guardian} ${card.phone}`,
    t('school.note'),
  ].filter(Boolean);
  const share = async () => {
    dispatch({ type: 'VIEW', viewer: 'teacher', item: t('school.shared'), at: Date.now() });
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // dismissing the share sheet is fine
    }
  };
  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Title>{t('school.title')}</Title>
        {lines.map((l) => (
          <Body key={l}>{l}</Body>
        ))}
      </Card>
      <BigButton icon="📤" label={t('school.share')} onPress={share} />
    </View>
  );
}
