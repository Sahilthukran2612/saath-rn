import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Check, Utensils, X } from '../icons';
import { BigButton, Body, Caption, Card, Chip, Title } from '../ui';
import { SectionTitle } from '../kit';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { SLOTS, foodsIn, slotForHour, suggestMeal } from '../../mealGenerator';
import { dayKey } from '../../suggestions';
import food from '../../content/food.json';

const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };
const DIETS = ['veg', 'egg', 'nonveg'];

// Meal ideas made on this phone from the person's region, diet, the hour, what they were given lately and what
// they turned down. Nothing here is a fixed list: "Another idea" draws a new one, "I'll have this" remembers it so
// it does not come straight back, and "Not for me" stops a food from being suggested again.
export default function FoodIdeas() {
  const { state, dispatch, t } = useStore();
  const now = useNow(60000);
  const lang = state.lang === 'hi' ? 'hi' : 'en';
  const prefs = state.foodPrefs;
  const [nonce, setNonce] = useState({});
  const [asking, setAsking] = useState(null);
  const today = dayKey(now);
  const first = slotForHour(new Date(now).getHours());
  const order = [first, ...SLOTS.filter((s) => s !== first)];
  const ideas = useMemo(
    () =>
      order.map((slot) => ({
        slot,
        idea: suggestMeal({
          region: prefs.region,
          diet: prefs.diet,
          slot,
          day: today,
          nonce: nonce[slot] || 0,
          recent: prefs.recent,
          disliked: prefs.disliked,
        }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs.region, prefs.diet, prefs.recent, prefs.disliked, today, nonce, first]
  );
  const set = (patch) => dispatch({ type: 'FOOD_PREFS', patch });

  return (
    <View style={{ gap: 14 }}>
      <Title style={{ fontSize: 22 }}>{t('food.ideas')}</Title>
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('food.diet')}</SectionTitle>
        <View style={row}>
          {DIETS.map((d) => (
            <Chip key={d} label={t(`diet.${d}`)} active={prefs.diet === d} onPress={() => set({ diet: d })} />
          ))}
        </View>
        <SectionTitle>{t('food.region')}</SectionTitle>
        <View style={row}>
          {food.regions.map((r) => (
            <Chip
              key={r.id}
              label={r[lang]}
              active={prefs.region === r.id}
              onPress={() => set({ region: r.id })}
            />
          ))}
        </View>
      </View>
      {ideas.map(({ slot, idea }, i) => (
        <Card key={slot} tone={i === 0 ? 'tint' : undefined} style={{ gap: 10 }}>
          <Caption
            style={{ fontFamily: undefined }}
          >{`${t(`slot.${slot}`)}${i === 0 ? `, ${t('food.now')}` : ''}`}</Caption>
          {idea ? (
            <>
              <Body bold>{idea.text[lang]}</Body>
              <View style={row}>
                <Chip
                  label={t('food.take')}
                  icon={Check}
                  onPress={() => dispatch({ type: 'FOOD_TAKE', ids: idea.ids })}
                />
                <Chip
                  label={t('food.another')}
                  icon={Utensils}
                  onPress={() => setNonce((n) => ({ ...n, [slot]: (n[slot] || 0) + 1 }))}
                />
                <Chip
                  label={t('food.notme')}
                  icon={X}
                  onPress={() => setAsking(asking === slot ? null : slot)}
                />
              </View>
              {asking === slot ? (
                <View style={{ gap: 8 }}>
                  <Caption>{t('food.notmeHelp')}</Caption>
                  <View style={row}>
                    {foodsIn(idea).map((f) => (
                      <Chip
                        key={f.id}
                        label={f[lang]}
                        onPress={() => {
                          dispatch({ type: 'FOOD_NOT', ids: [f.id] });
                          setAsking(null);
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <Body>{t('food.none')}</Body>
          )}
        </Card>
      ))}
      {prefs.disliked.length > 0 || prefs.recent.length > 0 ? (
        <BigButton kind="quiet" label={t('food.reset')} onPress={() => dispatch({ type: 'FOOD_RESET' })} />
      ) : null}
    </View>
  );
}
