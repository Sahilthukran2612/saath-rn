import * as Speech from 'expo-speech';

export function speak(text, lang = 'en') {
  try {
    Speech.stop();
    Speech.speak(text, { language: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.9 });
  } catch {
    // voice is a convenience; never block the flow if it is unavailable
  }
}
