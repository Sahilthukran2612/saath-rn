---
name: saath-localization
description: Use for any user-visible string in Saath. Resource files, English and Hindi, text-to-speech, large text.
---

- No hard-coded UI text. Add keys to `src/i18n/strings.js` with both `en` and `hi`, and read them through `t()` from `useStore()`.
- Every prompt has a spoken version via `src/services/voice.js` (`expo-speech`, `hi-IN` or `en-IN`).
- Keep sentences short. Test with large-text mode and long Hindi strings.
- Known gap: a few labels (role chips, mode and phase chips, "Reset ...") are still English-only. Move them into the resource file.
