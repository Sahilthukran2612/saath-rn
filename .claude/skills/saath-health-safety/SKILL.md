---
name: saath-health-safety
description: Use for any health text or feature in Saath. No dosing, no diagnosis, prompts only, minors and consent.
---

- Never calculate insulin or medicine doses. Never diagnose. The phone cannot detect low or high sugar: low-sugar features are rule-based prompts only.
- Every health prompt ends with "follow your clinician's plan, or call family, a clinic or an ASHA".
- Fall and inactivity wording is "helps notice", never "guarantees" or "detects every".
- Scheme, pharmacy and Ayushman Bharat info is curated offline content marked "verify locally".
- Minors (under 18): guardian consent step required under India's DPDP Act 2023. Mark it "needs legal review". Never claim legal compliance.
- Keep `glucoseAdvice` tests that assert no dose text is ever returned.
