import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { HeartPulse } from '../icons';
import { BigButton, Body, Caption, Card, Title } from '../ui';
import { ListGroup, ListRow } from '../kit';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { heartStatus } from '../../heart';
import { askBluetoothPermission, bleAvailable, connectBand, disconnectBand, scanForBands } from '../../services/ble';
import { colors } from '../../theme';

// Connects a Bluetooth heart-rate band and shows the live rate. The rate stays on this phone. Saath only
// says "stayed high/low while you were still" and points to the clinician's plan: it never diagnoses.
export default function HeartCard() {
  const { state, dispatch, t } = useStore();
  const [found, setFound] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState('');
  const stop = useRef(null);
  const now = useNow(5000);
  const { device, readings, contact } = state.heart;
  const last = readings[readings.length - 1];
  const status = heartStatus(readings, { stillSince: state.lastActiveMs, now });

  useEffect(() => () => stop.current?.(), []);

  const find = async () => {
    setMsg('');
    setFound([]);
    if (!bleAvailable()) return setMsg(t('hr.unavailable'));
    if (!(await askBluetoothPermission())) return setMsg(t('hr.denied'));
    setScanning(true);
    let any = false;
    stop.current = scanForBands(
      (d) => {
        any = true;
        setFound((list) => [...list, d]);
      },
      () => {
        setScanning(false);
        if (!any) setMsg(t('hr.none'));
      }
    );
  };

  const pick = async (d) => {
    stop.current?.();
    setFound([]);
    const ok = await connectBand(
      d.id,
      (r) => dispatch({ type: 'HEART_READING', bpm: r.bpm, contact: r.contact, at: Date.now() }),
      () => dispatch({ type: 'HEART_DEVICE', device: null })
    );
    if (ok) dispatch({ type: 'HEART_DEVICE', device: d });
    else setMsg(t('hr.none'));
  };

  const leave = async () => {
    await disconnectBand();
    dispatch({ type: 'HEART_DEVICE', device: null });
  };

  const line =
    status.level === 'high' ? t('hr.high') : status.level === 'low' ? t('hr.low') : status.level === 'ok' ? t('hr.ok') : t('hr.wait');

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <HeartPulse size={24} color={colors.indigo} />
        <Title style={{ fontSize: 22, flex: 1 }}>{t('hr.title')}</Title>
      </View>
      {device ? (
        <View style={{ gap: 8 }}>
          <Caption>{t('hr.connected').replace('{name}', device.name)}</Caption>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Title style={{ fontSize: 56, lineHeight: 64 }} accessibilityLabel={last ? `${last.bpm} ${t('hr.bpm')}` : t('hr.wait')}>
              {last ? last.bpm : '-'}
            </Title>
            <Body>{t('hr.bpm')}</Body>
          </View>
          {!contact ? <Body bold>{t('hr.nocontact')}</Body> : null}
          <Body bold={status.level === 'high' || status.level === 'low'}>{line}</Body>
          <BigButton kind="quiet" label={t('hr.disconnect')} onPress={leave} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Caption>{t('hr.note')}</Caption>
          {scanning ? <Caption>{t('hr.scanning')}</Caption> : null}
          {found.length > 0 ? (
            <ListGroup>
              {found.map((d, i) => (
                <ListRow key={d.id} icon={HeartPulse} title={d.name} label={d.name} onPress={() => pick(d)} last={i === found.length - 1} />
              ))}
            </ListGroup>
          ) : null}
          {msg ? <Body bold>{msg}</Body> : null}
          <BigButton kind="primary" label={t('hr.connect')} onPress={find} />
        </View>
      )}
    </Card>
  );
}