import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import * as service from '../src/services/reminders';
import { validHour, reminderPlan, formatHour, stepHour } from '../src/reminders';

jest.mock('../src/services/reminders', () => ({
  remindersAvailable: jest.fn(() => true),
  askReminderPermission: jest.fn(async () => true),
  scheduleReminders: jest.fn(async () => 4),
  cancelReminders: jest.fn(async () => {}),
}));

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

beforeEach(() => jest.clearAllMocks());

describe('reminder rules', () => {
  test('only whole hours from 0 to 23 count', () => {
    [0, 8, 23].forEach((h) => expect(validHour(h)).toBe(true));
    [-1, 24, 8.5, '8', null, undefined, NaN].forEach((h) => expect(validHour(h)).toBe(false));
  });
  test('tasks without a valid hour get no reminder', () => {
    const tasks = [
      { id: 'a', title: 'A', hour: 8 },
      { id: 'b', title: 'B' },
      { id: 'c', title: 'C', hour: null },
      { id: 'd', title: 'D', hour: 99 },
    ];
    expect(reminderPlan(tasks)).toEqual([{ id: 'a', title: 'A', hour: 8 }]);
  });
  test('nothing is scheduled inside the sleep window (22:00 to 07:00)', () => {
    const at = (hour) => reminderPlan([{ id: 'x', title: 'X', hour }]).length;
    [22, 23, 0, 3, 6].forEach((h) => expect([h, at(h)]).toEqual([h, 0]));
    [7, 8, 13, 18, 21].forEach((h) => expect([h, at(h)]).toEqual([h, 1]));
  });
  test('hours print as 08:00', () => {
    expect(formatHour(8)).toBe('08:00');
    expect(formatHour(13)).toBe('13:00');
  });
  test('the two buttons step an hour, start at 8:00 from none, and clear at the ends', () => {
    expect(stepHour(null, 1)).toBe(8);
    expect(stepHour(null, -1)).toBeNull();
    expect(stepHour(undefined, 1)).toBe(8);
    expect(stepHour(8, 1)).toBe(9);
    expect(stepHour(8, -1)).toBe(7);
    expect(stepHour(23, 1)).toBeNull();
    expect(stepHour(0, -1)).toBeNull();
  });
});

describe('reminders in the app', () => {
  const openEditor = async () => fireEvent.press(screen.getByLabelText('Edit routine'));

  test('off by default: nothing is scheduled and any old schedule is cleared', async () => {
    await mount({ mode: 'elder' });
    await waitFor(() => expect(service.cancelReminders).toHaveBeenCalled());
    expect(service.scheduleReminders).not.toHaveBeenCalled();
  });

  test('turning it on asks permission, then schedules each task at its hour', async () => {
    await mount({ mode: 'elder' });
    await fireEvent.press(screen.getByLabelText('Remind me at these times: off'));
    await waitFor(() => expect(service.scheduleReminders).toHaveBeenCalled());
    expect(service.askReminderPermission).toHaveBeenCalled();
    const [tasks, bodyFor] = service.scheduleReminders.mock.calls.at(-1);
    expect(tasks.map((t) => [t.title, t.hour])).toEqual([
      ['Morning medicine', 8],
      ['Lunch', 13],
      ['Evening walk', 18],
      ['Sugar check', 20],
    ]);
    expect(bodyFor('Lunch')).toBe('Time for: Lunch');
  });

  test('if notifications are refused it stays off and says why', async () => {
    service.askReminderPermission.mockResolvedValueOnce(false);
    await mount({ mode: 'elder' });
    await fireEvent.press(screen.getByLabelText('Remind me at these times: off'));
    await waitFor(() => expect(screen.getByText(/Allow notifications so reminders can show/)).toBeTruthy());
    expect(service.scheduleReminders).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Remind me at these times: off')).toBeTruthy();
  });

  test('turning it off clears the schedule', async () => {
    await mount({ mode: 'elder', reminders: true });
    await waitFor(() => expect(service.scheduleReminders).toHaveBeenCalled());
    service.cancelReminders.mockClear();
    await fireEvent.press(screen.getByLabelText('Remind me at these times: on'));
    await waitFor(() => expect(service.cancelReminders).toHaveBeenCalled());
  });

  test('changing a task time reschedules with the new hour', async () => {
    await mount({ mode: 'elder', reminders: true });
    await waitFor(() => expect(service.scheduleReminders).toHaveBeenCalledTimes(1));
    await openEditor();
    expect(screen.getByText('Reminder at 08:00')).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Later')[0]);
    expect(screen.getByText('Reminder at 09:00')).toBeTruthy();
    await waitFor(() => expect(service.scheduleReminders.mock.calls.at(-1)[0][0].hour).toBe(9));
  });

  test('stepping past the ends clears a reminder, and a task with none says so', async () => {
    await mount({ mode: 'elder', tasks: [{ id: 'x', icon: '📌', title: 'Walk', done: false, hour: 23 }] });
    await openEditor();
    expect(screen.getByText('This is in the sleep window, so no reminder will show.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Later'));
    expect(screen.getByText('No reminder')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Later'));
    expect(screen.getByText('Reminder at 08:00')).toBeTruthy();
  });

  test('the reminder wording follows the language', async () => {
    await mount({ mode: 'elder', reminders: true, lang: 'hi' });
    await waitFor(() => expect(service.scheduleReminders).toHaveBeenCalled());
    const bodyFor = service.scheduleReminders.mock.calls.at(-1)[1];
    expect(bodyFor('दवा')).toBe('समय हो गया: दवा');
  });
});
