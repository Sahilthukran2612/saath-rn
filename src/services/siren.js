// A loud wail so people nearby hear an unanswered alert, even with no signal at all. It plays on this
// phone only, loops until stopped, and is generated (scripts/make-siren.ps1), not a downloaded sound.
// expo-audio is loaded only when needed so a missing module never breaks the app start.
let player = null;

export function startSiren() {
  if (player) return true;
  try {
    const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    player = createAudioPlayer(require('../../assets/siren.wav'));
    player.loop = true;
    player.volume = 1;
    player.play();
    return true;
  } catch {
    player = null;
    return false;
  }
}

export function stopSiren() {
  if (!player) return;
  const p = player;
  player = null;
  try {
    p.pause();
    p.remove();
  } catch {
    // already stopped
  }
}

export const sirenPlaying = () => !!player;
