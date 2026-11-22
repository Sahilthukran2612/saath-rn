import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, TextInput, View } from 'react-native';
import Text from '../AppText';
import { Caption, Glyph, PressRow, useScale } from '../ui';
import { Send, Sparkles, Trash, X } from '../icons';
import { useStore } from '../../state/store';
import { useNav } from '../nav';
import { useReducedMotion } from '../motion';
import useKeyboardVisible from '../useKeyboard';
import { buildAiContext } from '../../ai/context';
import { fetchAiReply } from '../../ai/client';
import { nowMs } from '../../services/clock';
import { usesAi } from '../../who';
import { isEmergency } from '../../ai/guard';
import { colors, fonts, radii, shadow } from '../../theme';

// The floating helper. A round button sits above the navigation bar; it opens a floating window to chat in.
// What is typed is checked on the phone first: anything that sounds like an emergency is never sent anywhere, it gets
// a plain line pointing to the real alert and a real person. Replies are checked again on arrival (src/ai/guard.js).
// With no internet the window says so and nothing is lost.

const QUICK = ['ai.q1', 'ai.q2', 'ai.q3', 'ai.q4'];
let seq = 0;
const nextId = () => `m${nowMs()}-${seq++}`;

function Bubble({ m }) {
  const k = useScale();
  const mine = m.role === 'user';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
      <View
        style={{
          backgroundColor: mine ? colors.indigo : colors.mist,
          borderRadius: 20,
          borderBottomRightRadius: mine ? 6 : 20,
          borderBottomLeftRadius: mine ? 20 : 6,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 17 * Math.min(k, 1.2),
            lineHeight: 25 * Math.min(k, 1.2),
            color: mine ? colors.white : colors.ink,
          }}
        >
          {m.text}
        </Text>
      </View>
    </View>
  );
}

export default function ChatWindow({ bottom = 96 }) {
  const { state, dispatch, t } = useStore();
  const go = useNav();
  const reduced = useReducedMotion();
  const k = useScale();
  const typing = useKeyboardVisible();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [urgent, setUrgent] = useState(false);
  const scroll = useRef(null);
  const [rise] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!open) return;
    rise.setValue(reduced ? 1 : 0);
    if (!reduced)
      Animated.timing(rise, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
  }, [open, reduced, rise]);

  const msgs = state.aiChat || [];
  useEffect(() => {
    if (open) setTimeout(() => scroll.current?.scrollToEnd?.({ animated: false }), 30);
  }, [open, msgs.length, busy]);

  if (!state.aiOn || state.alert || !usesAi(state)) return null;

  const send = async (raw) => {
    const q = String(raw ?? text).trim();
    if (!q || busy) return;
    setText('');
    setNote('');
    setUrgent(false);
    dispatch({ type: 'AI_CHAT_ADD', id: nextId(), role: 'user', text: q });
    if (isEmergency(q)) {
      setUrgent(true);
      dispatch({ type: 'AI_CHAT_ADD', id: nextId(), role: 'assistant', text: t('ai.emergency') });
      return;
    }
    setBusy(true);
    const history = [...msgs, { role: 'user', text: q }];
    const r = await fetchAiReply(buildAiContext(state, nowMs()), history);
    setBusy(false);
    if (r.ok) dispatch({ type: 'AI_CHAT_ADD', id: nextId(), role: 'assistant', text: r.text });
    else setNote(t(r.reason === 'busy' ? 'ai.busy' : 'ai.offline'));
  };

  if (!open) {
    return (
      <PressRow
        accessibilityRole="button"
        accessibilityLabel={t('ai.fab')}
        onPress={() => setOpen(true)}
        containerStyle={{ position: 'absolute', right: 16, bottom }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.indigo,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadow.raised,
        }}
        rippleColor="rgba(255,255,255,0.28)"
      >
        <Glyph icon={Sparkles} size={28} color={colors.white} />
      </PressRow>
    );
  }

  return (
    <Animated.View
      accessibilityViewIsModal
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: typing ? 12 : bottom,
        top: 12,
        backgroundColor: colors.paper,
        borderRadius: 28,
        overflow: 'hidden',
        opacity: rise,
        transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        ...shadow.raised,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.indigo,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Glyph icon={Sparkles} size={20} color={colors.white} />
        </View>
        <Text
          accessibilityRole="header"
          style={{ flex: 1, fontFamily: fonts.bold, fontSize: 20 * Math.min(k, 1.2), color: colors.ink }}
        >
          {t('ai.title')}
        </Text>
        {msgs.length > 0 ? (
          <PressRow
            accessibilityRole="button"
            accessibilityLabel={t('ai.clear')}
            onPress={() => dispatch({ type: 'AI_CHAT_CLEAR' })}
            style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Glyph icon={Trash} size={22} color={colors.inkSoft} />
          </PressRow>
        ) : null}
        <PressRow
          accessibilityRole="button"
          accessibilityLabel={t('ai.close')}
          onPress={() => setOpen(false)}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Glyph icon={X} size={24} color={colors.ink} />
        </PressRow>
      </View>
      <Caption style={{ paddingHorizontal: 16, paddingBottom: 8 }}>{t('ai.notice')}</Caption>

      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
      >
        {msgs.length === 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: fonts.semi, fontSize: 18 * Math.min(k, 1.2), color: colors.ink }}>
              {t('ai.empty')}
            </Text>
            {QUICK.map((q) => (
              <PressRow
                key={q}
                accessibilityRole="button"
                accessibilityLabel={t(q)}
                onPress={() => send(t(q))}
                style={{
                  minHeight: 56,
                  borderRadius: radii.pill,
                  borderWidth: 1,
                  borderColor: colors.line,
                  paddingHorizontal: 18,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.semi,
                    fontSize: 17 * Math.min(k, 1.2),
                    color: colors.indigoDeep,
                  }}
                >
                  {t(q)}
                </Text>
              </PressRow>
            ))}
          </View>
        ) : (
          msgs.map((m) => <Bubble key={m.id} m={m} />)
        )}
        {busy ? <Caption>{t('ai.thinking')}</Caption> : null}
        {note ? <Caption style={{ color: colors.madder }}>{note}</Caption> : null}
        {urgent ? (
          <PressRow
            accessibilityRole="button"
            accessibilityLabel={t('ai.openSafety')}
            onPress={() => {
              setOpen(false);
              go('safety');
            }}
            style={{
              minHeight: 56,
              borderRadius: radii.pill,
              backgroundColor: colors.brick,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 18 * Math.min(k, 1.2), color: colors.white }}>
              {t('ai.openSafety')}
            </Text>
          </PressRow>
        ) : null}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <TextInput
          accessibilityLabel={t('ai.placeholder')}
          value={text}
          onChangeText={setText}
          placeholder={t('ai.placeholder')}
          placeholderTextColor={colors.inkSoft}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          maxLength={400}
          style={{
            flex: 1,
            minHeight: 56,
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.mist,
            paddingHorizontal: 18,
            fontFamily: fonts.regular,
            fontSize: 17 * Math.min(k, 1.2),
            color: colors.ink,
            paddingVertical: Platform.OS === 'android' ? 8 : 12,
          }}
        />
        <PressRow
          accessibilityRole="button"
          accessibilityLabel={t('ai.send')}
          onPress={() => send()}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.indigo,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy || !text.trim() ? 0.5 : 1,
          }}
        >
          <Glyph icon={Send} size={24} color={colors.white} />
        </PressRow>
      </View>
    </Animated.View>
  );
}
