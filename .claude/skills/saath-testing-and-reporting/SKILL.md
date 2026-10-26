---
name: saath-testing-and-reporting
description: Use at the end of every Saath phase. Run tests and lint, update docs, report in the fixed format.
---

1. Run `npm test` and `npm run lint`. Run an Android bundle check: `npx expo export --platform android`.
2. Update `docs/TEST_REPORT.md` and the real / simulated / future table in `README.md`.
3. Report as **Works / Simulated / Broken / Next / Risks**. Do not claim a feature works unless it was run. Say what could not be run (no device, no network).
4. Commit with a clear message.
