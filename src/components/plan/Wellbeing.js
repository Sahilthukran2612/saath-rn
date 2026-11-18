import React, { useState } from 'react';
import { Image, Share, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Banana, Camera, Candy, Coffee, Heart, Send, Soup, Salad, Utensils, Wheat } from '../icons';
import { BigButton, Body, Caption, Card, Chip, Glyph, PressRow, Title } from '../ui';
import { Badge, CheckMark, Field, ListGroup, ListRow, Segmented, Stat, SectionTitle } from '../kit';
import { MoodFace, PlateDiagram } from '../art';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { nowMs } from '../../services/clock';
import { FOOT_ITEMS, idrsScore, schoolCard, weekKey, weeklySummary } from '../../plan';
import food from '../../content/food.json';
import { colors, fonts, radii } from '../../theme';

const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };

// A weekly "how did this week feel?" The reply is always gentle: no counts of misses,
// no nudge to do more. A hard week points to company and Time off.
export function CheckinSection() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const thisWeek = state.checkins.find((c) => c.week === weekKey(now));
  const summary = weeklySummary(state.checkins);
  return (
    <View style={{ gap: 16 }}>
      <Title style={{ fontSize: 24 }}>{t('checkin.title')}</Title>
      <View style={styles.moodRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = thisWeek?.mood === n;
          return (
            <PressRow
              key={n}
              accessibilityRole="button"
              accessibilityLabel={t(`mood.${n}`)}
              accessibilityState={{ selected: on }}
              onPress={() => dispatch({ type: 'CHECKIN', mood: n, at: Date.now() })}
              containerStyle={{ flex: 1 }}
              style={[styles.moodTile, on && styles.moodTileOn]}
            >
              <MoodFace level={n} size={40} color={on ? colors.white : colors.indigo} />
            </PressRow>
          );
        })}
      </View>
      <View style={styles.moodLabels}>
        <Caption>{t('mood.1')}</Caption>
        <Caption>{t('mood.5')}</Caption>
      </View>
      <Card tone="tint" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Glyph icon={Heart} size={26} color={colors.indigo} />
        <Body bold style={{ flex: 1 }}>
          {t(`wellbeing.${summary.id}`)}
        </Body>
      </Card>
      {state.checkins.length > 1 ? (
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {state.checkins.slice(-8).map((c) => (
            <MoodFace key={c.week} level={c.mood} size={30} color={colors.inkFaint} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const MEALS = [
  ['rice', Utensils],
  ['roti', Wheat],
  ['salad', Salad],
  ['dal', Soup],
  ['fruit', Banana],
  ['sweet', Candy],
  ['tea', Coffee],
];

export function FoodSection() {
  const { state, dispatch, t } = useStore();
  const lang = state.lang === 'hi' ? 'hi' : 'en';
  const [region, setRegion] = useState('north');
  const meals = food.regions.find((r) => r.id === region)?.meals ?? [];
  const today = new Date().toDateString();
  const todays = state.meals.filter((m) => new Date(m.at).toDateString() === today);
  const plateDots = [colors.leaf, colors.haldi, colors.indigoSoft];
  return (
    <View style={{ gap: 18 }}>
      <Card tone="haldi">
        <Body bold>{t('food.verify')}</Body>
      </Card>
      <Card style={{ gap: 14 }}>
        <Title style={{ fontSize: 22 }}>{t('food.plate')}</Title>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <PlateDiagram size={132} />
          <View style={{ flex: 1, gap: 10 }}>
            {food.plate.map((p, i) => (
              <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: plateDots[i] }} />
                <Body style={{ flex: 1 }}>{p[lang]}</Body>
              </View>
            ))}
          </View>
        </View>
      </Card>
      <View style={{ gap: 10 }}>
        <SectionTitle>{t('food.region')}</SectionTitle>
        <View style={row}>
          {food.regions.map((r) => (
            <Chip key={r.id} label={r[lang]} active={region === r.id} onPress={() => setRegion(r.id)} />
          ))}
        </View>
        <ListGroup>
          {meals.map((m) => (
            <ListRow key={m.en} icon={Utensils} title={m[lang]} />
          ))}
        </ListGroup>
      </View>
      <View style={{ gap: 10 }}>
        <SectionTitle>{t('food.fasting')}</SectionTitle>
        <ListGroup>
          {food.fasting.map((f) => (
            <ListRow
              key={f.en}
              icon={Heart}
              iconBg={colors.haldiTint}
              iconColor={colors.haldiDeep}
              title={f[lang]}
            />
          ))}
        </ListGroup>
        <SectionTitle>{t('food.festival')}</SectionTitle>
        <ListGroup>
          {food.festival.map((f) => (
            <ListRow
              key={f.en}
              icon={Candy}
              iconBg={colors.leafTint}
              iconColor={colors.leafDeep}
              title={f[lang]}
            />
          ))}
        </ListGroup>
      </View>
      <Card style={{ gap: 12 }}>
        <Title style={{ fontSize: 22 }}>{t('food.log')}</Title>
        <View style={row}>
          {MEALS.map(([id, Icon]) => (
            <Chip
              key={id}
              label={t(`meal.${id}`)}
              icon={Icon}
              onPress={() => dispatch({ type: 'MEAL_LOG', id: String(Date.now()), icon: id, at: Date.now() })}
            />
          ))}
        </View>
        <Body bold>{`${t('food.today')}: ${todays.length}`}</Body>
        {todays.length ? (
          <View style={row}>
            {todays.map((m) => {
              const found = MEALS.find(([id]) => id === m.icon);
              return <Badge key={m.id} label={found ? t(`meal.${m.icon}`) : t('food.today')} tone="leaf" />;
            })}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const ACTIVITY = ['vigorous', 'moderate', 'mild', 'sedentary'];

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
    <View style={{ gap: 18 }}>
      <View style={{ gap: 10 }}>
        <Title style={{ fontSize: 24 }}>{t('foot.title')}</Title>
        <ListGroup>
          {FOOT_ITEMS.map((id) => (
            <ListRowCheck
              key={id}
              label={t(`foot.${id}`)}
              done={items.includes(id)}
              onPress={() => toggle(id)}
            />
          ))}
        </ListGroup>
        <BigButton
          label={t('foot.save')}
          onPress={() => {
            dispatch({ type: 'FOOT_CHECK', at: Date.now(), items });
            setItems([]);
          }}
        />
        <Body bold>{`${t('foot.checks')}: ${state.footChecks.length}`}</Body>
        <Card tone="haldi">
          <Body bold>{t('foot.note')}</Body>
        </Card>
        <BigButton kind="quiet" icon={Camera} label={t('foot.photo')} onPress={photo} />
        <Caption>{t('foot.photoNote')}</Caption>
        <View style={row}>
          {state.footPhotos.slice(-4).map((p) => (
            <Image
              key={p.uri}
              source={{ uri: p.uri }}
              style={{ width: 84, height: 84, borderRadius: 12 }}
              accessibilityLabel={t('foot.photos')}
            />
          ))}
        </View>
      </View>

      <Card style={{ gap: 12 }}>
        <Title style={{ fontSize: 22 }}>{t('waist.title')}</Title>
        {lastWaist ? <Stat value={`${lastWaist.cm} cm`} label={t('waist.title')} /> : null}
        <Field
          label={t('waist.title')}
          value={waist}
          onChangeText={setWaist}
          keyboardType="number-pad"
          placeholder="cm"
        />
        <BigButton
          kind="quiet"
          label={t('waist.save')}
          onPress={() => {
            dispatch({ type: 'WAIST_ADD', cm: parseInt(waist, 10), at: Date.now() });
            setWaist('');
          }}
        />
      </Card>

      <Card style={{ gap: 14 }}>
        <Title style={{ fontSize: 22 }}>{t('risk.title')}</Title>
        <Field
          label={t('risk.age')}
          value={a.age}
          onChangeText={(v) => setA({ ...a, age: v })}
          keyboardType="number-pad"
        />
        <Caption>{t('risk.gender')}</Caption>
        <Segmented
          value={a.gender}
          onChange={(gender) => setA({ ...a, gender })}
          options={['female', 'male'].map((g) => ({ value: g, label: t(`risk.${g}`) }))}
        />
        <Caption>{t('risk.activity')}</Caption>
        <View style={row}>
          {ACTIVITY.map((g) => (
            <Chip
              key={g}
              label={t(`act.${g}`)}
              active={a.activity === g}
              onPress={() => setA({ ...a, activity: g })}
            />
          ))}
        </View>
        <Caption>{t('risk.family')}</Caption>
        <Segmented
          value={a.family}
          onChange={(family) => setA({ ...a, family })}
          options={['none', 'one', 'both'].map((g) => ({ value: g, label: t(`fam.${g}`) }))}
        />
        <BigButton label={t('risk.calc')} onPress={calc} />
        {result ? (
          <View style={{ gap: 8 }}>
            <Body bold>{`${t('risk.score')}: ${result.score}`}</Body>
            <Badge
              label={t(`risk.${result.level}`)}
              tone={result.level === 'high' ? 'haldi' : result.level === 'moderate' ? 'indigo' : 'leaf'}
            />
          </View>
        ) : null}
        <Caption>{t('risk.note')}</Caption>
      </Card>
    </View>
  );
}

// A checklist row: the whole row is the target and the check draws itself.
function ListRowCheck({ label, done, onPress, last }) {
  return (
    <PressRow
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.checkRow, !last && styles.checkDivider]}
    >
      <Text style={{ flex: 1, fontFamily: fonts.semi, fontSize: 18, color: colors.ink }}>{label}</Text>
      <CheckMark done={done} size={30} />
    </PressRow>
  );
}

// Teacher card for a teen with type 1 diabetes. Sharing is the teen's own tap, and each share is
// written to the audit log so the person can see it. The guardian's number is on the card only
// if the guardian agreed to show it.
export function SchoolSection() {
  const { state, dispatch, t } = useStore();
  const card = schoolCard(state);
  const steps = card.steps.map((s) => t(`school.${s}`));
  const contact = card.phone ? `${t('school.guardian')}: ${card.guardian} ${card.phone}` : null;
  const share = async () => {
    dispatch({ type: 'VIEW', viewer: 'teacher', item: t('school.shared'), at: nowMs() });
    try {
      await Share.share({
        message: [card.name, ...steps.map((s, i) => `${i + 1}. ${s}`), contact, t('school.note')]
          .filter(Boolean)
          .join('\n'),
      });
    } catch {
      // dismissing the share sheet is fine
    }
  };
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.schoolCard}>
        <View style={styles.schoolHead}>
          <Title style={{ color: colors.white, fontSize: 22 }}>{t('school.title')}</Title>
          {card.name ? <Body style={{ color: colors.indigoSoft }}>{card.name}</Body> : null}
        </View>
        <View style={{ padding: 18, gap: 14 }}>
          {steps.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={styles.stepNum}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.indigo }}>{i + 1}</Text>
              </View>
              <Body style={{ flex: 1 }}>{s}</Body>
            </View>
          ))}
          {contact ? <Body bold>{contact}</Body> : null}
          <Caption>{t('school.note')}</Caption>
        </View>
      </View>
      <BigButton icon={Send} label={t('school.share')} onPress={share} />
    </View>
  );
}

const styles = StyleSheet.create({
  moodRow: { flexDirection: 'row', gap: 8 },
  moodTile: {
    minHeight: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.indigoTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodTileOn: { backgroundColor: colors.indigo },
  moodLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16 },
  checkDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  schoolCard: {
    backgroundColor: colors.white,
    borderRadius: radii.hero,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  schoolHead: { backgroundColor: colors.indigo, padding: 18, gap: 2 },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.indigoTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
