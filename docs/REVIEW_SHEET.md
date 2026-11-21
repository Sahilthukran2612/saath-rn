# Review sheet: wording that needs a person to check it

Generated from `src/i18n/strings.js` on 2026-11-21. Two reviewers are needed. Mark each row OK or write the fix beside it.

## A. Clinician: is anything unsafe, misleading or too directive?

The rules Saath follows, enforced by tests: never calculate, suggest or change a dose; never diagnose; never say what a sugar level means; no extra tasks after a hard week or in a crisis phase. Medicines and doses are only what the person or the doctor typed. Tick a row only if you would be comfortable with a patient reading it unprompted.

**Generated cards and chat replies are not in this sheet.** They are written by a model at run time (see `docs/AI.md`). Read a few dozen real ones in the app: the cards on Today marked "Idea", and replies in the helper, including questions about medicine, a missed dose, and "how much insulin".

### Suggestion cards (rule-based; each has up to three phrasings)

| Card | Text (English) | Safe? |
|---|---|---|
| `refill` | **Medicine running low**. Your medicine may run out in about {days} days. Ask your clinic or chemist about a refill. |  |
| `strips` | **Test strips running low**. About {days} days of test strips are left at your usual testing. Ask your clinic or chemist. |  |
| `visit` | **Questions for your visit**. You have written {n} for your next clinic visit. Have a look before you go. |  |
| `foot` | **Look at your feet**. Look at both feet once a week for sores, cracks or blisters. It takes two minutes. |  |
| `checkin` | **How was this week?**. Tell Saath how the week felt. One tap. |  |
| `reading` | **A reading today?**. If you test today, add the number so your record stays complete. |  |
| `ladder` | **One step toward doing it yourself**. Pick one skill from your Ladder to try this week, with a parent beside you. |  |
| `company` | **Talk to someone today**. This has been a hard week. Call or message someone in your circle. You can also pause routine updates with Time off. |  |
| `water` | **A glass of water**. Sip some water now. If your clinic has told you to limit fluids, follow that. / Have a glass of water within the next hour, unless your clinic limits fluids. Keep it where you can see it. / Pour a glass of water now and sip it as you go. If your clinic limits fluids, follow that. |  |
| `walk` | **A slow walk after eating**. A short, easy walk around the house or street. If you feel unwell, stop and sit down. / If you feel steady, an easy stroll after eating is a gentle habit. Sit down if you feel unwell. / Step outside for a slow walk, or walk around the house. Stop and sit if anything feels wrong. |  |
| `meal` | **{slot} idea**. {idea}. Use it, swap it, or ask for another in the Food guide. |  |
| `plate` | **Fill your plate**. Half vegetables, a quarter dal or protein, a quarter roti or rice. Open the food guide. |  |
| `med` | **Medicine not marked yet**. {names} is not marked as taken. If you took it, mark it. If you are not sure, do not double up: ask your family, chemist or clinic. |  |
| `task` | **Still open today**. {title} was planned for {time}. If you have already done it, tick it on your list below. |  |
| `shoes` | **Check your shoes**. Look inside your shoes before you put them on, and wear them with socks. / Shake out your shoes and feel inside for stones or rough spots before you wear them. / Check your socks for holes or hard seams, then look inside your shoes. |  |
| `sleep` | **Wind down for sleep**. Put the screen away, keep the room dim, and keep your phone near the bed in case you need help. / Dim the lights and keep your phone within reach tonight, in case you need help. / Try to go to bed at the same time tonight, with your phone beside you. |  |
| `rest` | **Rest is enough today**. You do not need to do more today. Sit, sip some water, and tell someone if you want company. / Today you can simply rest. Let someone know if you want company. / There is nothing you must do today. Sit, sip some water, and be easy on yourself. |  |

### Medicines, care plan, visits, readings and AI wording

| Key | Text (English) | Safe? |
|---|---|---|
| `pt.readings` | Sugar readings |  |
| `pt.noReadings` | No readings shared yet. They appear once the person logs one and has you at Full. |  |
| `pt.readingsNote` | Shared by the person. Saath shows the numbers and never says what they mean. |  |
| `inv.doctorSees` | A doctor sees your sugar readings and charts. You can change this any time in Circle. |  |
| `planSub` | Handover, visits and healthy habits |  |
| `visit.facts` | Facts for your visit |  |
| `visit.sugar` | {n} sugar readings, average {avg}, last {last} |  |
| `visit.noSugar` | No sugar readings logged yet. |  |
| `visit.routine` | {done} of {total} routine tasks done today |  |
| `visit.stock` | {pills} tablets left, about {days} days |  |
| `visit.strips` | {strips} strips left |  |
| `visit.questions` | Questions to ask |  |
| `visit.addQ` | Add question |  |
| `visit.qPlaceholder` | Type a question |  |
| `visit.share` | Share summary |  |
| `visit.s1` | What should I do on a sick day? |  |
| `visit.s2` | Is my testing plan right for me? |  |
| `visit.s3` | Can I get cheaper medicines, or refills closer to home? |  |
| `vis.due` | Visit due |  |
| `vis.title` | Household visit |  |
| `vis.never` | No visit noted yet. |  |
| `vis.today` | Visited today. |  |
| `vis.ago` | Last visit {n} days ago. |  |
| `vis.mark` | I visited today |  |
| `plan.meds` | Medicines |  |
| `amp.title` | Look after someone new |  |
| `amp.titleDoctor` | Add a patient |  |
| `amp.btn` | Show my card to add someone |  |
| `amp.btnDoctor` | Add my patient |  |
| `amp.scan` | Ask the person to scan this with Saath or their phone camera. |  |
| `amp.then` | They confirm once, then show you a code to scan back. No typing. |  |
| `amp.needAccount` | Sign in with your name and number first (Me tab), so your card has them. |  |
| `plan.editBtn` | Edit care plan |  |
| `sg.noteAi` | Care reminders are made on this phone. Ideas are written by an AI from a short anonymous summary of your day. None of this is medical advice. |  |
| `ai.fab` | Ask Saath for help |  |
| `ai.title` | Saath helper |  |
| `ai.notice` | Replies are written by an AI from a short anonymous summary of your day. It never gives doses or diagnoses. In an emergency, use the alert. |  |
| `ai.empty` | Ask me about food, your routine, or how to use Saath. |  |
| `ai.placeholder` | Ask for help |  |
| `ai.send` | Send |  |
| `ai.close` | Close |  |
| `ai.clear` | Clear chat |  |
| `ai.thinking` | Thinking... |  |
| `ai.offline` | The helper needs internet right now. Try again when you have signal. |  |
| `ai.busy` | The helper is busy. Please try again in a minute. |  |
| `ai.emergency` | This sounds urgent. Open the alert on the Safety tab, or call someone in your circle or 112 now. I cannot help with emergencies in chat. |  |
| `ai.openSafety` | Open Safety |  |
| `ai.q1` | What can I eat today? |  |
| `ai.q2` | I missed my medicine |  |
| `ai.q3` | Ideas for a short walk |  |
| `ai.q4` | How do I add someone to my circle? |  |
| `ai.setting` | Smart cards and helper |  |
| `ai.settingNote` | Needs internet. Sends only a short anonymous summary: never your name, number, medicines or readings. |  |
| `plan.build` | Care plan for this person |  |
| `plan.buildNote` | What you publish here is applied on their phone by itself, shown as set by you. Write medicines and doses exactly as you would on a prescription: Saath never works one out. |  |
| `plan.tasks` | Daily tasks |  |
| `plan.testPerDay` | Sugar checks per day (number) |  |
| `plan.notes` | A note for the person |  |
| `plan.publish` | Publish plan |  |
| `plan.empty` | Add at least one medicine, task, check count or note. |  |
| `plan.needSignIn` | Sign in on the Me tab first. |  |
| `plan.sending` | Sending... |  |
| `plan.sent` | Published. Their phone updates by itself next time it is online and open. |  |
| `plan.offline` | No connection. Try again when you are online. |  |
| `plan.failed` | Could not publish. Only a clinician added to this person's circle can. |  |
| `plan.safety` | Saath only passes on what you wrote. It does not check a dose or suggest one. |  |
| `plan.updated` | {who} updated your plan |  |
| `plan.what` | Now: {meds} medicines and {tasks} daily tasks from your clinician. |  |
| `plan.check` | If anything looks different from what your clinician told you, ask them before following it. |  |
| `plan.gotIt` | Got it |  |
| `plan.setBy` | set by {who} |  |
| `med.title` | My medicines |  |
| `med.empty` | No medicines added yet. Add them exactly as your doctor wrote them. |  |
| `med.note` | Saath only reminds you. It never suggests, works out or changes a dose. Copy it from your prescription, and ask your doctor or chemist if you are unsure. |  |
| `med.add` | Add a medicine |  |
| `med.close` | Close |  |
| `med.name` | Medicine name |  |
| `med.dose` | Dose as written on the prescription |  |
| `med.doseHelp` | For example, copy what the prescription says. Leave it empty if you prefer. |  |
| `med.when` | When |  |
| `med.save` | Save medicine |  |
| `med.taken` | taken |  |
| `med.notTaken` | not marked |  |
| `med.now` | Medicines now |  |
| `when.beforeBreakfast` | Before breakfast |  |
| `when.afterBreakfast` | After breakfast |  |
| `when.beforeLunch` | Before lunch |  |
| `when.afterLunch` | After lunch |  |
| `when.beforeDinner` | Before dinner |  |
| `when.afterDinner` | After dinner |  |
| `when.bedtime` | At bedtime |  |

## B. Native Hindi speaker: is the Hindi natural, respectful and clear for a low-literacy reader?

Four rows (tip.travel, school.note, consentLegal, school.call) may show `(missing)` or a blank only because their lines wrap in the source file; the Hindi exists in `src/i18n/strings.js` and the parity test passes. Ask for those four if you need them.

| Key | English | Hindi | OK / fix |
|---|---|---|---|
| `tabToday` | Today | आज |  |
| `tabCircle` | Circle | घेरा |  |
| `tabSafety` | Safety | सुरक्षा |  |
| `tabCare` | Care | देखभाल |  |
| `tabMe` | Me | मैं |  |
| `imOk` | I'm OK | मैं ठीक हूँ |  |
| `imOkHint` | Tap once to tell your circle you are fine. | एक बार दबाएँ। आपके अपनों को पता चल जाएगा। |  |
| `areYouOk` | Are you OK? | क्या आप ठीक हैं? |  |
| `areYouOkSub` | We noticed something. Tap if you are fine. | कुछ गड़बड़ लगी। ठीक हैं तो दबाएँ। |  |
| `calling` | Reaching | संपर्क कर रहे हैं |  |
| `nobodyReached` | No one answered yet. Please call someone you trust. | अभी कोई नहीं मिला। कृपया किसी अपने को फ़ोन करें। |  |
| `falseAlarm` | False alarm | गलत अलार्म |  |
| `missedEvent` | Missed event | छूटी घटना |  |
| `exportCsv` | Export trial CSV | परीक्षण CSV भेजें |  |
| `resetTally` | Reset counts | गिनती शून्य करें |  |
| `trialTitle` | Sensor trial mode | सेंसर परीक्षण |  |
| `trialNote` | Use scripted trials only. Never test falls with real older adults. | सिर्फ़ तय परीक्षण करें। बुज़ुर्गों पर गिरना कभी न आज़माएँ। |  |
| `tallyAlerts` | Alerts | अलर्ट |  |
| `tallyImOk` | I'm OK | मैं ठीक हूँ |  |
| `tallyEscalated` | Escalated | आगे बढ़ा |  |
| `tallyFalse` | False alarm | गलत अलार्म |  |
| `tallyMissed` | Missed | छूटा |  |
| `helpsNotice` | Saath helps notice when you may need help. It cannot promise to catch every fall. | साथ यह पहचानने में मदद करता है कि आपको मदद चाहिए हो सकती है। हर गिरना पकड़ने का वादा नहीं। |  |
| `privacyDial` | Privacy dial | निजता डायल |  |
| `dial0` | Safety only | सिर्फ़ सुरक्षा |  |
| `dial1` | Routine | दिनचर्या |  |
| `dial2` | Full | पूरा |  |
| `safetyAlways` | Safety alerts always reach everyone and cannot be turned off. | सुरक्षा अलर्ट सबको मिलते हैं और बंद नहीं हो सकते। |  |
| `timeOff` | Time off | छुट्टी |  |
| `whoViewed` | Who viewed what | किसने क्या देखा |  |
| `nobodyViewed` | No one has viewed your information yet. | अभी किसी ने आपकी जानकारी नहीं देखी। |  |
| `clinicianPlan` | Follow your clinician's plan, or call family, a clinic or an ASHA. | अपने डॉक्टर की योजना मानें, या परिवार, क्लिनिक या आशा को फ़ोन करें। |  |
| `addReading` | Add sugar reading | शुगर रीडिंग जोड़ें |  |
| `noAccess` | You do not have access to this. Ask the person to share it. | आपके पास यह देखने की अनुमति नहीं है। व्यक्ति से साझा करने को कहें। |  |
| `largeText` | Large text | बड़े अक्षर |  |
| `language` | Language | भाषा |  |
| `theme.title` | Look | रूप |  |
| `theme.auto` | Phone | फ़ोन जैसा |  |
| `theme.light` | Light | हल्का |  |
| `theme.dark` | Dark | गहरा |  |
| `theme.reopen` | Close Saath and open it again to change the look. | रूप बदलने के लिए साथ को बंद करके दोबारा खोलें। |  |
| `confidence` | Confidence | भरोसा |  |
| `ladder` | Transition ladder | ज़िम्मेदारी की सीढ़ी |  |
| `ladderNow` | Now: Together | अभी: साथ-साथ |  |
| `sugarPlan` | Sugar plan | शुगर योजना |  |
| `refill` | Refill | दवा बाकी |  |
| `daysLeft` | days left | दिन बाकी |  |
| `spend` | Spend this month | इस महीने का खर्च |  |
| `householdsRanked` | Households by need | ज़रूरत के हिसाब से घर |  |
| `onePage` | One-page summary | एक पन्ने का सार |  |
| `statusGlance` | Status at a glance | एक नज़र में हाल |  |
| `safetyOnlyView` | You get safety alerts only. | आपको सिर्फ़ सुरक्षा अलर्ट मिलेंगे। |  |
| `lastOk` | Last "I'm OK" | आख़िरी "मैं ठीक हूँ" |  |
| `done` | done | हो गया |  |
| `consentTitle` | Ask a parent or guardian | माता-पिता या अभिभावक से पूछें |  |
| `consentBody` | You are under 18. A parent or guardian must agree before Saath is used. | आप 18 से कम उम्र के हैं। साथ इस्तेमाल से पहले अभिभावक की सहमति ज़रूरी है। |  |
| `consentName` | Guardian name | अभिभावक का नाम |  |
| `consentPhone` | Guardian phone | अभिभावक का फ़ोन |  |
| `consentAgree` | My guardian agrees | मेरे अभिभावक सहमत हैं |  |
| `consentNeed` | Enter the guardian name and a valid phone number. | अभिभावक का नाम और सही फ़ोन नंबर डालें। |  |
| `inviteTitle` | Add a person | किसी को जोड़ें |  |
| `inviteName` | Name | नाम |  |
| `invitePhone` | Phone number | फ़ोन नंबर |  |
| `inviteShare` | Add and send code | जोड़ें और कोड भेजें |  |
| `invitePending` | Waiting | इंतज़ार |  |
| `invalidPhone` | Enter a 10-digit mobile number. | 10 अंकों का मोबाइल नंबर डालें। |  |
| `helpButton` | Ask for help | मदद माँगें |  |
| `helpSent` | Help request sent | मदद का अनुरोध भेजा |  |
| `delegateTitle` | Ask someone to do a task | किसी से काम करने को कहें |  |
| `delegateFor` | For 1 hour | 1 घंटे के लिए |  |
| `delegateDay` | For 1 day | 1 दिन के लिए |  |
| `expires` | Until | तक |  |
| `expired` | Expired | समय खत्म |  |
| `markDone` | Mark done | हो गया लिखें |  |
| `contactHidden` | Number hidden until they agree | नंबर तब तक छिपा है जब तक वे हाँ न कहें |  |
| `shareMyNumber` | Show my number | मेरा नंबर दिखाएँ |  |
| `editRoutine` | Edit routine | दिनचर्या बदलें |  |
| `addTask` | Add task | काम जोड़ें |  |
| `taskName` | Task name | काम का नाम |  |
| `save` | Save | सहेजें |  |
| `remove` | Remove | हटाएँ |  |
| `remindersPaused` | Reminders paused | रिमाइंडर रुके हैं |  |
| `remindersOn` | Reminders on | रिमाइंडर चालू |  |
| `waiting` | Waiting to sync | सिंक का इंतज़ार |  |
| `guidanceNew` | New diagnosis: take it one step at a time. Ask your clinician, family or an ASHA anything. | नई बीमारी: एक-एक कदम चलें। डॉक्टर, परिवार या आशा से कुछ भी पूछें। |  |
| `guidanceCrisis` | A hard time: lean on your circle. Call family, a clinic or an ASHA. | मुश्किल समय: अपनों का सहारा लें। परिवार, क्लिनिक या आशा को फ़ोन करें। |  |
| `guardianLimit` | A guardian keeps at least Routine. | अभिभावक को कम से कम दिनचर्या दिखती है। |  |
| `notMinor` | I am not under 18 | मैं 18 से कम उम्र का नहीं हूँ |  |
| `sugarLog` | Sugar log | शुगर रीडिंग |  |
| `trendUp` | Going up | बढ़ रही है |  |
| `trendDown` | Going down | घट रही है |  |
| `trendSteady` | Steady | स्थिर |  |
| `average` | Average | औसत |  |
| `insulinTaken` | Insulin taken | इंसुलिन ली |  |
| `ateMeal` | Ate a meal | खाना खाया |  |
| `insulinNote` | Saath records only the time, never the amount. | साथ सिर्फ़ समय लिखता है, मात्रा कभी नहीं। |  |
| `stripsLeft` | strips left | स्ट्रिप बाकी |  |
| `testPlan` | Tests a day, set by your clinician | रोज़ कितनी जाँच, डॉक्टर तय करते हैं |  |
| `refillTitle` | Medicine stock | दवा का स्टॉक |  |
| `pillsLeft` | tablets left | गोलियाँ बाकी |  |
| `refillNow` | Refill now | अभी दवा लें |  |
| `refillSoon` | Refill soon | जल्द दवा लें |  |
| `refillOk` | Stock is fine | स्टॉक ठीक है |  |
| `budgetTitle` | Care budget | देखभाल का खर्च |  |
| `budgetAdd` | Add cost | खर्च जोड़ें |  |
| `amount` | Amount in rupees | रुपये में रकम |  |
| `cat_medicine` | Medicine | दवा |  |
| `cat_strips` | Strips | स्ट्रिप |  |
| `cat_travel` | Travel | आना-जाना |  |
| `cat_other` | Other | दूसरा |  |
| `thisMonth` | This month | इस महीने |  |
| `lastMonth` | Last month | पिछले महीने |  |
| `savingTips` | Saving tips | बचत के सुझाव |  |
| `baselineTitle` | How Saath learned from you | साथ ने आपसे क्या सीखा |  |
| `resetBaseline` | Reset to normal | पहले जैसा करें |  |
| `callNow` | Call | फ़ोन करें |  |
| `sendMessage` | Send message | संदेश भेजें |  |
| `whatsapp` | WhatsApp | व्हाट्सऐप |  |
| `sms` | SMS | एसएमएस |  |
| `jm.title` | Joined on their own phones | अपने फ़ोन से जुड़े लोग |  |
| `jm.none` | No one has joined yet. Share an invite code from the form above. | अभी कोई नहीं जुड़ा। ऊपर के फ़ॉर्म से न्योते का कोड भेजें। |  |
| `jm.sees` | {name} sees: {level} | {name} देखते हैं: {level} |  |
| `jm.offline` | Could not save the change. Try again when you have a connection. | बदलाव सहेज नहीं सके। कनेक्शन मिलने पर फिर कोशिश करें। |  |
| `jm.timeOff` | On Time Off | छुट्टी पर |  |
| `cf.timeOff` | Pause routine updates from them | उनके रोज़ के अपडेट रोकें |  |
| `cf.timeOffNote` | Safety alerts still reach you. | सुरक्षा अलर्ट फिर भी आपको मिलेंगे। |  |
| `siren.title` | Loud alarm when no one answers | कोई जवाब न दे तो तेज़ अलार्म |  |
| `siren.note` | Plays a loud siren here if no one answers. Works with no signal. | कोई जवाब न दे तो यहाँ तेज़ सायरन बजता है। बिना सिग्नल के भी चलता है। |  |
| `push.on` | Alerts from your circle will reach this phone even when Saath is closed. | आपके घेरे के अलर्ट इस फ़ोन तक पहुँचेंगे, साथ बंद हो तब भी। |  |
| `push.denied` | Notifications are off for Saath, so alerts will not reach this phone while it is closed. Allow them in the phone's settings. | साथ के लिए सूचनाएँ बंद हैं, इसलिए ऐप बंद होने पर अलर्ट इस फ़ोन तक नहीं पहुँचेंगे। फ़ोन की सेटिंग में इन्हें चालू करें। |  |
| `push.nofirebase` | Push alerts are not set up in this build of Saath yet. | साथ के इस संस्करण में पुश अलर्ट अभी तैयार नहीं हैं। |  |
| `push.error` | Could not turn on alerts for this phone. Saath will try again next time it opens. | इस फ़ोन के लिए अलर्ट चालू नहीं हो सके। साथ अगली बार खुलने पर फिर कोशिश करेगा। |  |
| `push.unavailable` | Push alerts need the installed Saath app. | पुश अलर्ट के लिए इंस्टॉल किया हुआ साथ ऐप चाहिए। |  |
| `rc.title` | How will you use Saath? | आप साथ का कैसे इस्तेमाल करेंगे? |  |
| `rc.person` | I need care | मुझे देखभाल चाहिए |  |
| `rc.personNote` | I live with an illness, or I am getting older. I want the people close to me to know I am safe. | मैं किसी बीमारी के साथ जीता/जीती हूँ, या मेरी उम्र बढ़ रही है। मैं चाहता/चाहती हूँ कि मेरे अपनों को पता रहे कि मैं सुरक्षित हूँ। |  |
| `rc.member` | I look after someone | मैं किसी की देखभाल करता/करती हूँ |  |
| `rc.memberNote` | I am a family member, neighbour or ASHA worker. Someone invited me. | मैं परिवार का सदस्य, पड़ोसी या आशा कार्यकर्ता हूँ। किसी ने मुझे न्योता भेजा है। |  |
| `rc.change` | You can change this later on the Me tab. | इसे बाद में "मैं" टैब में बदल सकते हैं। |  |
| `mo.nameTitle` | About you | आपके बारे में |  |
| `mo.nameNote` | The person you look after will see this name. | जिनकी आप देखभाल करते हैं, उन्हें यही नाम दिखेगा। |  |
| `mo.accountTitle` | Your own account | आपका अपना खाता |  |
| `mo.accountNote` | Your own account is how Saath knows who you are on your phone. Create one with your own phone number and a password. If you already have one, choose Sign in. | आपका अपना खाता ही बताता है कि आपके फ़ोन पर आप कौन हैं। अपने फ़ोन नंबर और पासवर्ड से खाता बनाएँ। पहले से है तो साइन इन चुनें। |  |
| `mo.needAccount` | Create your account first. | पहले अपना खाता बनाएँ। |  |
| `mo.joinTitle` | Join the person you look after | जिनकी देखभाल करते हैं, उनसे जुड़ें |  |
| `mo.joinNote` | They send you a code from their Saath app (Circle, then Invite someone). Your role, for example neighbour or clinician, comes from their invite. | वे अपने साथ ऐप (घेरा, फिर किसी को न्योता) से आपको एक कोड भेजते हैं। आपकी भूमिका, जैसे पड़ोसी या डॉक्टर, उनके न्योते से तय होती है। |  |
| `mo.noCode` | No code yet? Ask the person to open Circle, tap Invite someone, choose your role, and send you the code. You can join later from the Circle tab. | अभी कोड नहीं है? उनसे कहें कि घेरा खोलें, "किसी को न्योता" दबाएँ, आपकी भूमिका चुनें और आपको कोड भेजें। बाद में घेरा टैब से भी जुड़ सकते हैं। |  |
| `mo.joined` | Circles you have joined: {n} | आप जितने घेरों से जुड़े हैं: {n} |  |
| `mo.finish` | Start | शुरू करें |  |
| `mo.skip` | I will join later | मैं बाद में जुड़ूँगा/जुड़ूँगी |  |
| `use.title` | How I use Saath | मैं साथ का कैसे इस्तेमाल करता/करती हूँ |  |
| `use.person` | I need care | मुझे देखभाल चाहिए |  |
| `use.member` | I look after someone | मैं किसी की देखभाल करता/करती हूँ |  |
| `use.both` | Both | दोनों |  |
| `use.note` | This changes which tabs you see. Your information stays on this phone. | इससे आपको दिखने वाले टैब बदलते हैं। आपकी जानकारी इसी फ़ोन पर रहती है। |  |
| `cf.youAre` | You are their {role}. | आप उनके {role} हैं। |  |
| `mh.empty` | You have not joined anyone's circle yet. | आप अभी किसी के घेरे से नहीं जुड़े हैं। |  |
| `mh.line` | {name}: you are their {role}. | {name}: आप उनके {role} हैं। |  |
| `inv.message` | Saath invite. 1) Install Saath. 2) Choose "I look after someone". 3) Create your account with the phone number I gave you. 4) Enter this code: {code} | साथ का न्योता। 1) साथ इंस्टॉल करें। 2) "मैं किसी की देखभाल करता/करती हूँ" चुनें। 3) मैंने जो फ़ोन नंबर दिया है, उसी से अपना खाता बनाएँ। 4) यह कोड डालें: {code} |  |
| `pt.readings` | Sugar readings | शुगर रीडिंग |  |
| `pt.noReadings` | No readings shared yet. They appear once the person logs one and has you at Full. | अभी कोई रीडिंग साझा नहीं हुई। जब व्यक्ति कोई रीडिंग दर्ज करेगा और आपको पूरी पहुँच देगा, तब दिखेगी। |  |
| `pt.readingsNote` | Shared by the person. Saath shows the numbers and never says what they mean. | व्यक्ति ने साझा की हैं। साथ सिर्फ़ संख्याएँ दिखाता है, उनका मतलब कभी नहीं बताता। |  |
| `inv.doctorSees` | A doctor sees your sugar readings and charts. You can change this any time in Circle. | डॉक्टर आपकी शुगर रीडिंग और चार्ट देखते हैं। आप इसे कभी भी घेरे में बदल सकते हैं। |  |
| `inv.messageDoctor` | Saath invite. 1) Install Saath. 2) Choose "I am a doctor". 3) Create your account with the phone number I gave you. 4) Enter this code: {code} | साथ का न्योता। 1) साथ इंस्टॉल करें। 2) "मैं डॉक्टर हूँ" चुनें। 3) मैंने जो फ़ोन नंबर दिया है, उसी से अपना खाता बनाएँ। 4) यह कोड डालें: {code} |  |
| `inv.code` | Code: {code} | कोड: {code} |  |
| `inv.needSignIn` | Not sent. Sign in on the Me tab first. Until then nobody can join with this code. | भेजा नहीं गया। पहले "मैं" टैब में साइन इन करें। तब तक इस कोड से कोई नहीं जुड़ सकता। |  |
| `inv.notSent` | Not sent yet. It sends by itself in about 30 seconds while the app is open and online. | अभी भेजा नहीं गया। ऐप खुला और इंटरनेट चालू हो तो करीब 30 सेकंड में अपने आप चला जाता है। |  |
| `inv.sendNow` | Send now | अभी भेजें |  |
| `inv.sentBadge` | Sent | भेजा गया |  |
| `inv.failed` | Could not send it. Check the internet and try again. | भेज नहीं सके। इंटरनेट देखें और फिर कोशिश करें। |  |
| `inv.sent` | Sent. They can join with the code now. | भेज दिया गया। अब वे कोड से जुड़ सकते हैं। |  |
| `inv.again` | Share the code again | कोड फिर से भेजें |  |
| `inv.sameNumber` | They must create their Saath account with this same phone number, or the code will not work. | उन्हें साथ में इसी फ़ोन नंबर से अपना खाता बनाना होगा, वरना कोड काम नहीं करेगा। |  |
| `join.boundNote` | This code only works for the phone number the person entered for you. Sign in with that number. | यह कोड सिर्फ़ उसी फ़ोन नंबर पर काम करता है जो उस व्यक्ति ने आपके लिए डाला था। उसी नंबर से साइन इन करें। |  |
| `acc.create` | Create account | खाता बनाएँ |  |
| `acc.signin.tab` | Sign in | साइन इन |  |
| `acc.pass` | Password (8 or more characters) | पासवर्ड (8 या ज़्यादा अक्षर) |  |
| `acc.pass2` | Repeat the password | पासवर्ड दोबारा डालें |  |
| `acc.mismatch` | The two passwords are different. | दोनों पासवर्ड अलग हैं। |  |
| `acc.short` | Use a password of at least 8 characters. | कम से कम 8 अक्षरों का पासवर्ड रखें। |  |
| `acc.exists` | This number already has an account. Use Sign in. | इस नंबर का खाता पहले से है। साइन इन करें। |  |
| `acc.wrong` | The number or the password is not right. | नंबर या पासवर्ड सही नहीं है। |  |
| `acc.confirm` | The server still wants a confirmation text. Whoever runs the server must switch off phone confirmations. | सर्वर अभी भी पुष्टि का संदेश माँग रहा है। सर्वर चलाने वाले को फ़ोन की पुष्टि बंद करनी होगी। |  |
| `acc.noreset` | No text message is sent. A forgotten password cannot be reset, so keep it safe. | कोई मैसेज नहीं भेजा जाता। भूला हुआ पासवर्ड वापस नहीं मिलता, इसलिए उसे सँभालकर रखें। |  |
| `acc.quick` | Skip for now | अभी छोड़ें |  |
| `acc.quickNote` | Works on this phone only. If you clear Saath's data or change phone, it is lost. | सिर्फ़ इसी फ़ोन पर चलता है। साथ का डेटा मिटाने या फ़ोन बदलने पर खो जाता है। |  |
| `acc.multi` | Sign in with the same number and password on another phone to use Saath there too. | दूसरे फ़ोन पर भी साथ चलाने के लिए वहाँ इसी नंबर और पासवर्ड से साइन इन करें। |  |
| `call.title` | Call my contacts automatically | मेरे संपर्कों को अपने आप फ़ोन करें |  |
| `call.note` | Calls your contacts one by one if no one answers. Uses your phone plan. | कोई जवाब न दे तो संपर्कों को एक-एक करके फ़ोन लगाता है। आपके फ़ोन प्लान से। |  |
| `call.unavailable` | This needs the installed Saath app, not Expo Go. | इसके लिए इंस्टॉल किया हुआ साथ ऐप चाहिए, Expo Go नहीं। |  |
| `call.denied` | Allow phone calls so Saath can call your contacts, then try again. | फ़ोन करने की अनुमति दें ताकि साथ आपके संपर्कों को फ़ोन कर सके, फिर कोशिश करें। |  |
| `call.calling` | Calling {name} now... | {name} को अभी फ़ोन लगा रहे हैं... |  |
| `call.reached` | Someone answered the call to {name}. | {name} को की गई कॉल किसी ने उठाई। |  |
| `trial.realWarn` | Calls and messages are on. A trial that runs to the end will really reach your contacts. Tap I'm OK to stop it. | कॉल और संदेश चालू हैं। जो परीक्षण अंत तक चलेगा वह सचमुच आपके संपर्कों तक पहुँचेगा। रोकने के लिए "मैं ठीक हूँ" दबाएँ। |  |
| `ct.title` | Emergency contacts | आपातकालीन संपर्क |  |
| `ct.note` | If no one answers an alert, Saath reaches these people in this order: family, neighbour, ASHA, clinician. | अगर अलर्ट का कोई जवाब न आए, तो साथ इन लोगों तक इसी क्रम में पहुँचता है: परिवार, पड़ोसी, आशा, डॉक्टर। |  |
| `ct.add` | Add a contact | संपर्क जोड़ें |  |
| `ct.name` | Name | नाम |  |
| `ct.phone` | Phone number | फ़ोन नंबर |  |
| `ct.role` | Who is this? | ये कौन हैं? |  |
| `ct.save` | Add contact | संपर्क जोड़ें |  |
| `ct.remove` | Remove {name} | {name} को हटाएँ |  |
| `ct.empty` | No contacts yet. Add at least one so an alert can reach someone. | अभी कोई संपर्क नहीं। कम से कम एक जोड़ें ताकि अलर्ट किसी तक पहुँच सके। |  |
| `ct.bad` | Enter a name and a 10-digit mobile number. | नाम और 10 अंकों का मोबाइल नंबर डालें। |  |
| `ct.dup` | That number is already in the list. | यह नंबर सूची में पहले से है। |  |
| `ob.welcome` | Welcome to Saath | साथ में आपका स्वागत है |  |
| `ob.intro` | Saath helps the people around you look after you. Setup takes about two minutes. | साथ आपके आसपास के लोगों को आपकी देखभाल में मदद करता है। सेटअप में लगभग दो मिनट लगते हैं। |  |
| `ob.who` | Who will use this phone? | यह फ़ोन कौन इस्तेमाल करेगा? |  |
| `ob.next` | Next | आगे |  |
| `ob.nameTitle` | About you | आपके बारे में |  |
| `ob.name` | Your name | आपका नाम |  |
| `ob.condition` | Condition (optional) | बीमारी (ज़रूरी नहीं) |  |
| `ob.contactsTitle` | Who should we reach? | हम किस तक पहुँचें? |  |
| `ob.contactsNote` | If a fall is noticed and you do not answer, Saath calls these people one by one. Add at least one real number. | अगर गिरना पकड़ा जाए और आप जवाब न दें, तो साथ इन लोगों को एक-एक करके फ़ोन करता है। कम से कम एक असली नंबर जोड़ें। |  |
| `ob.skipWarn` | Without a contact, an alert has no one to reach. | बिना संपर्क के अलर्ट के पास पहुँचने के लिए कोई नहीं होगा। |  |
| `ob.choicesTitle` | How should alerts work? | अलर्ट कैसे काम करें? |  |
| `ob.choicesNote` | You can change these later on the Me tab. Each one asks the phone for permission. | इन्हें बाद में "मैं" टैब में बदल सकते हैं। हर एक के लिए फ़ोन से अनुमति माँगी जाती है। |  |
| `ob.finish` | Start using Saath | साथ इस्तेमाल करना शुरू करें |  |
| `ob.privacy` | Saath never reads your messages, contacts or location. Movement data stays on this phone. | साथ आपके संदेश, संपर्क या लोकेशन कभी नहीं पढ़ता। हलचल का डेटा इसी फ़ोन पर रहता है। |  |
| `ob.step` | Step {n} of {total} | चरण {n} / {total} |  |
| `rem.toggle` | Remind me at these times | इन समयों पर याद दिलाएँ |  |
| `rem.body` | Time for: {title} | समय हो गया: {title} |  |
| `rem.note` | Every day, even when Saath is closed. | हर दिन, साथ बंद हो तब भी। |  |
| `rem.at` | Reminder at {time} | {time} पर याद दिलाएँ |  |
| `rem.none` | No reminder | कोई याद दिलाना नहीं |  |
| `rem.earlier` | Earlier | पहले |  |
| `rem.later` | Later | बाद में |  |
| `rem.sleep` | This is in the sleep window, so no reminder will show. | यह सोने के समय में है, इसलिए याद नहीं दिलाया जाएगा। |  |
| `rem.denied` | Allow notifications so reminders can show, then try again. | सूचनाओं की अनुमति दें ताकि याद दिलाना दिख सके, फिर कोशिश करें। |  |
| `hr.title` | Heart-rate band | हार्ट-रेट बैंड |  |
| `hr.note` | Connect a Bluetooth heart-rate band or chest strap. Saath reads the rate on this phone only and never stores or sends it. It cannot tell whether you are ill. | ब्लूटूथ हार्ट-रेट बैंड या चेस्ट स्ट्रैप जोड़ें। साथ दर इसी फ़ोन पर पढ़ता है, कभी सहेजता या भेजता नहीं। यह नहीं बता सकता कि आप बीमार हैं या नहीं। |  |
| `hr.connect` | Find my band | मेरा बैंड खोजें |  |
| `hr.scanning` | Looking for a band... | बैंड खोज रहे हैं... |  |
| `hr.pick` | Tap your band | अपने बैंड पर दबाएँ |  |
| `hr.connected` | Connected to {name} | {name} से जुड़ा है |  |
| `hr.disconnect` | Disconnect | अलग करें |  |
| `hr.bpm` | beats a minute | धड़कन प्रति मिनट |  |
| `hr.nocontact` | The band is not touching your skin. | बैंड आपकी त्वचा को छू नहीं रहा। |  |
| `hr.none` | No band found. Wear the band, switch Bluetooth on and try again. | कोई बैंड नहीं मिला। बैंड पहनें, ब्लूटूथ चालू करें और फिर कोशिश करें। |  |
| `hr.unavailable` | Bluetooth needs the installed Saath app, not Expo Go. | ब्लूटूथ के लिए इंस्टॉल किया हुआ साथ ऐप चाहिए, Expo Go नहीं। |  |
| `hr.denied` | Allow Bluetooth so Saath can find your band, then try again. | ब्लूटूथ की अनुमति दें ताकि साथ आपका बैंड खोज सके, फिर कोशिश करें। |  |
| `hr.high` | Your heart rate has stayed high while you were still. | आराम के दौरान आपकी धड़कन काफ़ी देर से तेज़ है। |  |
| `hr.low` | Your heart rate has stayed low while you were still. | आराम के दौरान आपकी धड़कन काफ़ी देर से धीमी है। |  |
| `hr.ok` | Steady while you rest. | आराम में धड़कन स्थिर है। |  |
| `hr.wait` | Reading... | पढ़ रहे हैं... |  |
| `sms.title` | Send the alert SMS by itself | अलर्ट एसएमएस अपने आप भेजें |  |
| `sms.note` | Texts your contacts if no one answers. Uses your SMS plan and mobile signal, not internet. | कोई जवाब न दे तो संपर्कों को एसएमएस भेजता है। आपके एसएमएस प्लान और मोबाइल सिग्नल से, इंटरनेट से नहीं। |  |
| `sms.unavailable` | This needs the installed Saath app, not Expo Go. | इसके लिए इंस्टॉल किया हुआ साथ ऐप चाहिए, Expo Go नहीं। |  |
| `sms.denied` | Allow SMS so Saath can send alerts, then try again. | एसएमएस की अनुमति दें ताकि साथ अलर्ट भेज सके, फिर कोशिश करें। |  |
| `sms.sentTo` | Message sent to {name} | {name} को संदेश भेजा गया |  |
| `sms.failed` | Could not send a message by itself. Tap Call or a message button. | अपने आप संदेश नहीं भेज सके। फ़ोन करें या संदेश वाला बटन दबाएँ। |  |
| `step.sugar` | Have sugar, jaggery or a glucose biscuit. | चीनी, गुड़ या ग्लूकोज़ बिस्कुट लें। |  |
| `step.recheck` | Check your sugar again in 15 minutes. | 15 मिनट बाद शुगर फिर जाँचें। |  |
| `step.call` | If you still feel unwell, call family, a clinic or an ASHA. | फिर भी ठीक न लगे तो परिवार, क्लिनिक या आशा को फ़ोन करें। |  |
| `step.night` | Check your sugar before sleeping if your clinician has told you to. | डॉक्टर ने कहा हो तो सोने से पहले शुगर जाँचें। |  |
| `tip.travel` | Travel costs are high. Ask if refills can be collected closer to home or in one visit. | (missing) |  |
| `tabPlan` | Plan | योजना |  |
| `appName` | Saath | साथ |  |
| `circleSub` | Who can see what | कौन क्या देख सकता है |  |
| `mode.teen` | Teen | किशोर |  |
| `mode.elder` | Elder | बुज़ुर्ग |  |
| `mode.adult` | Adult | वयस्क |  |
| `phase.new` | New diagnosis | नई बीमारी |  |
| `phase.stable` | Stable | स्थिर |  |
| `phase.crisis` | Hard time | मुश्किल समय |  |
| `me.mode` | Who is this for | यह किसके लिए है |  |
| `me.phase` | Where are you now | अभी आप कहाँ हैं |  |
| `me.settings` | Settings | सेटिंग |  |
| `resetData` | Reset app data | ऐप का डेटा मिटाएँ |  |
| `consentSub` | This takes a minute and keeps you safe. | इसमें एक मिनट लगता है और आप सुरक्षित रहते हैं। |  |
| `planSub` | Handover, visits and healthy habits | ज़िम्मेदारी, डॉक्टर की मुलाकात और अच्छी आदतें |  |
| `meal.rice` | Rice | चावल |  |
| `meal.roti` | Roti | रोटी |  |
| `meal.salad` | Salad | सलाद |  |
| `meal.dal` | Dal | दाल |  |
| `meal.fruit` | Fruit | फल |  |
| `meal.sweet` | Sweet | मिठाई |  |
| `meal.tea` | Tea | चाय |  |
| `plate.veg` | Vegetables | सब्ज़ियाँ |  |
| `plate.protein` | Dal, egg, fish | दाल, अंडा, मछली |  |
| `plate.grain` | Roti, rice | रोटी, चावल |  |
| `careSub` | Sugar, medicine and costs | शुगर, दवा और खर्च |  |
| `role.person` | Person | व्यक्ति |  |
| `role.family` | Guardian | अभिभावक |  |
| `role.neighbour` | Neighbour | पड़ोसी |  |
| `role.asha` | ASHA | आशा |  |
| `role.clinician` | Doctor | डॉक्टर |  |
| `inviteSub` | Saath calls them if you do not answer an alert. The code lets them follow how you are on their own phone. | अलर्ट का जवाब न देने पर साथ उन्हें फ़ोन करता है। कोड से वे अपने फ़ोन पर आपका हाल देख सकते हैं। |  |
| `helpSub` | Ask once. The request ends by itself. | एक बार माँगें। अनुरोध अपने आप खत्म हो जाता है। |  |
| `delegation.open` | Open until {time} | {time} तक खुला |  |
| `emptyAudit` | No one has looked yet. You will see every view here. | अभी किसी ने नहीं देखा। हर बार यहाँ दिखेगा। |  |
| `greet.morning` | Good morning | सुप्रभात |  |
| `greet.afternoon` | Good afternoon | नमस्ते |  |
| `greet.evening` | Good evening | शुभ संध्या |  |
| `greet.night` | Good night | शुभ रात्रि |  |
| `sent.ok` | Your circle knows you are fine. | आपके अपनों को पता चल गया कि आप ठीक हैं। |  |
| `doneOf` | {done} of {total} done today | आज {total} में से {done} काम हुए |  |
| `lastReading` | Last reading | आख़िरी रीडिंग |  |
| `noReading` | No reading yet | अभी कोई रीडिंग नहीं |  |
| `statusOk` | All is well | सब ठीक है |  |
| `statusAlert` | Needs a look | ध्यान चाहिए |  |
| `rankNeed` | Needs attention | ध्यान चाहिए |  |
| `rankOk` | Stable | स्थिर |  |
| `watch.on` | Watching | नज़र रखी जा रही है |  |
| `watch.bg` | Watching in background | पीछे भी नज़र है |  |
| `bg.title` | Keep watching in the background | पीछे चलते हुए भी नज़र रखें |  |
| `bg.notice` | Saath is helping notice when you may need help. | साथ यह पहचानने में मदद कर रहा है कि आपको मदद चाहिए हो सकती है। |  |
| `bg.note` | A notice stays on screen while this is on. | चालू रहने पर स्क्रीन पर एक सूचना रहती है। |  |
| `bg.unavailable` | This needs the installed Saath app, not Expo Go. | इसके लिए इंस्टॉल किया हुआ साथ ऐप चाहिए, Expo Go नहीं। |  |
| `bg.denied` | Allow notifications so the notice can show, then try again. | सूचना दिखाने के लिए नोटिफ़िकेशन की अनुमति दें, फिर कोशिश करें। |  |
| `back` | Back | पीछे |  |
| `saved` | Saved | सहेजा गया |  |
| `sec.ladder` | Handing over care | देखभाल की ज़िम्मेदारी |  |
| `sec.visit` | Visit prep | डॉक्टर के पास जाने की तैयारी |  |
| `sec.passport` | Health passport | स्वास्थ्य पासपोर्ट |  |
| `sec.checkin` | Weekly check-in | हफ़्ते का हाल |  |
| `sec.food` | Food guide | खाने की जानकारी |  |
| `sec.body` | Body check | शरीर की जाँच |  |
| `sec.school` | School plan | स्कूल के लिए योजना |  |
| `stage.parent` | Parent does | माता-पिता करते हैं |  |
| `stage.together` | Together | साथ-साथ |  |
| `stage.backup` | You, with backup | आप, मदद के साथ |  |
| `stage.independent` | Independent | खुद |  |
| `skill.refills` | Order refills | दवा मँगवाना |  |
| `skill.explain` | Explain my condition | अपनी बीमारी समझाना |  |
| `skill.visitPrep` | Prepare for a visit | डॉक्टर के पास की तैयारी |  |
| `skill.badDays` | Handle a hard day | मुश्किल दिन संभालना |  |
| `ladder.ready` | I am ready for the next step | मैं अगले कदम के लिए तैयार हूँ |  |
| `ladder.waiting` | Waiting for a parent to agree | माता-पिता की हाँ का इंतज़ार |  |
| `ladder.approve` | Agree | हाँ |  |
| `ladder.decline` | Not yet | अभी नहीं |  |
| `ladder.back` | Go back a step | एक कदम पीछे |  |
| `ladder.needApproval` | A parent agrees to each step | हर कदम पर माता-पिता हाँ कहते हैं |  |
| `ladder.backNote` | Going back a step is fine. A hard week is not a failure. | एक कदम पीछे जाना ठीक है। मुश्किल हफ़्ता नाकामी नहीं है। |  |
| `ladder.teenOnly` | The person chooses when they are ready. A parent can agree or say not yet. | तैयार होने का फ़ैसला व्यक्ति खुद करता है। माता-पिता हाँ या अभी नहीं कह सकते हैं। |  |
| `visit.facts` | Facts for your visit | डॉक्टर के लिए तथ्य |  |
| `visit.sugar` | {n} sugar readings, average {avg}, last {last} | {n} शुगर रीडिंग, औसत {avg}, आख़िरी {last} |  |
| `visit.noSugar` | No sugar readings logged yet. | अभी कोई शुगर रीडिंग नहीं लिखी। |  |
| `visit.routine` | {done} of {total} routine tasks done today | आज {total} में से {done} काम हुए |  |
| `visit.stock` | {pills} tablets left, about {days} days | {pills} गोलियाँ बाकी, लगभग {days} दिन |  |
| `visit.strips` | {strips} strips left | {strips} स्ट्रिप बाकी |  |
| `visit.questions` | Questions to ask | पूछने के सवाल |  |
| `visit.addQ` | Add question | सवाल जोड़ें |  |
| `visit.qPlaceholder` | Type a question | सवाल लिखें |  |
| `visit.share` | Share summary | सार भेजें |  |
| `visit.s1` | What should I do on a sick day? | बीमारी के दिन मुझे क्या करना है? |  |
| `visit.s2` | Is my testing plan right for me? | क्या मेरी जाँच की योजना मेरे लिए सही है? |  |
| `visit.s3` | Can I get cheaper medicines, or refills closer to home? | क्या सस्ती दवा या घर के पास दवा मिल सकती है? |  |
| `pass.name` | Name | नाम |  |
| `pass.condition` | Condition | बीमारी |  |
| `pass.allergies` | Allergies | एलर्जी |  |
| `pass.emergency` | Emergency contact | आपात संपर्क |  |
| `pass.include` | Include in the passport | पासपोर्ट में क्या रखें |  |
| `pass.meds` | Medicine | दवा |  |
| `pass.sugar` | Sugar summary | शुगर का सार |  |
| `pass.contact` | Emergency contact | आपात संपर्क |  |
| `pass.qr` | Show QR code | QR कोड दिखाएँ |  |
| `pass.pdf` | Save as PDF | PDF में सहेजें |  |
| `pass.text` | Send as a message | संदेश की तरह भेजें |  |
| `pass.tooLong` | Too long for a QR code. Shorten the notes. | QR कोड के लिए बहुत लंबा है। नोट छोटे करें। |  |
| `pass.note` | The QR code works offline. It holds only what you tick. | QR कोड बिना इंटरनेट चलता है। इसमें सिर्फ़ वही है जिस पर आप निशान लगाएँ। |  |
| `pass.pdfFailed` | Could not make the PDF. Show the QR code instead, or try again. | PDF नहीं बन सका। इसके बजाय QR कोड दिखाएँ, या फिर कोशिश करें। |  |
| `checkin.title` | How did this week feel? | यह हफ़्ता कैसा लगा? |  |
| `mood.1` | Very hard | बहुत मुश्किल |  |
| `mood.2` | Hard | मुश्किल |  |
| `mood.3` | Okay | ठीक-ठाक |  |
| `mood.4` | Good | अच्छा |  |
| `mood.5` | Very good | बहुत अच्छा |  |
| `wellbeing.none` | Tap a face when you are ready. There is no wrong answer. | जब मन हो तब एक चेहरा दबाएँ। कोई जवाब गलत नहीं है। |  |
| `wellbeing.first` | Thank you for sharing. We will look at the weeks together. | बताने के लिए शुक्रिया। हम हफ़्तों को साथ देखेंगे। |  |
| `wellbeing.good` | This week felt good. Nice to see. | यह हफ़्ता अच्छा रहा। यह जानकर अच्छा लगा। |  |
| `wellbeing.steady` | A steady week. That counts. | एक स्थिर हफ़्ता। यह भी मायने रखता है। |  |
| `food.verify` | Verify locally. This is general guidance. Follow your clinician's plan. | स्थानीय रूप से जाँचें। यह सामान्य जानकारी है। अपने डॉक्टर की योजना मानें। |  |
| `food.plate` | Your plate | आपकी थाली |  |
| `food.region` | Meals from your region | आपके इलाके के खाने |  |
| `food.fasting` | Fasting | व्रत |  |
| `food.festival` | Festivals | त्योहार |  |
| `food.log` | What did you eat? | आपने क्या खाया? |  |
| `food.today` | Meals today | आज का खाना |  |
| `foot.title` | Foot check | पैरों की जाँच |  |
| `foot.cuts` | Look for cuts or sores | कट या घाव देखें |  |
| `foot.redness` | Look for red or hot spots | लाल या गर्म जगह देखें |  |
| `foot.swelling` | Look for swelling | सूजन देखें |  |
| `foot.dry` | Look for dry or cracked skin | सूखी या फटी त्वचा देखें |  |
| `foot.nails` | Check nails are cut straight | नाखून सीधे कटे हैं, देखें |  |
| `foot.shoes` | Check shoes for stones | जूतों में कंकड़ देखें |  |
| `foot.save` | Save foot check | पैरों की जाँच सहेजें |  |
| `foot.note` | If you see a cut, sore or swelling, show a clinic or an ASHA soon. | कट, घाव या सूजन दिखे तो जल्द क्लिनिक या आशा को दिखाएँ। |  |
| `foot.photo` | Take a photo for your diary | डायरी के लिए फ़ोटो लें |  |
| `foot.photoNote` | Photos stay on this phone. Saath does not look at them. | फ़ोटो इसी फ़ोन में रहती हैं। साथ उन्हें नहीं देखता। |  |
| `foot.photos` | Photos | फ़ोटो |  |
| `foot.checks` | Foot checks done | पैरों की जाँच हुई |  |
| `waist.title` | Waist in cm | कमर सेंटीमीटर में |  |
| `waist.save` | Save waist | कमर सहेजें |  |
| `risk.title` | Diabetes risk check | डायबिटीज़ जोखिम जाँच |  |
| `risk.age` | Age in years | उम्र (साल) |  |
| `risk.gender` | Gender | लिंग |  |
| `risk.female` | Female | महिला |  |
| `risk.male` | Male | पुरुष |  |
| `risk.activity` | Activity | गतिविधि |  |
| `act.vigorous` | Hard exercise or heavy work | कड़ी कसरत या भारी काम |  |
| `act.moderate` | Moderate | मध्यम |  |
| `act.mild` | Mild | हल्की |  |
| `act.sedentary` | Mostly sitting | ज़्यादातर बैठे रहना |  |
| `risk.family` | Family history | परिवार में बीमारी |  |
| `fam.none` | None | कोई नहीं |  |
| `fam.one` | One parent | एक माता या पिता |  |
| `fam.both` | Both parents | माता और पिता दोनों |  |
| `risk.calc` | See my score | मेरा स्कोर देखें |  |
| `risk.score` | Score | स्कोर |  |
| `risk.low` | Lower risk. Keep an active, balanced routine. | कम जोखिम। सक्रिय और संतुलित दिनचर्या रखें। |  |
| `risk.moderate` | Medium risk. A blood test at a clinic is a good idea. | मध्यम जोखिम। क्लिनिक में खून की जाँच कराना अच्छा रहेगा। |  |
| `risk.high` | Higher risk. Please get a blood test at a clinic soon. | ज़्यादा जोखिम। कृपया जल्द क्लिनिक में खून की जाँच कराएँ। |  |
| `risk.note` | This is a screening score, not a diagnosis. Verify locally and ask a clinician. | यह जाँच का स्कोर है, निदान नहीं। स्थानीय रूप से जाँचें और डॉक्टर से पूछें। |  |
| `school.title` | Card for the teacher | शिक्षक के लिए कार्ड |  |
| `school.stop` | Stop the activity and stay with the student. | गतिविधि रोकें और विद्यार्थी के साथ रहें। |  |
| `school.sugar` | If they look shaky, sweaty or confused, give sugar, jaggery or a glucose biscuit. | काँपते, पसीने में या उलझन में दिखें तो चीनी, गुड़ या ग्लूकोज़ बिस्कुट दें। |  |
| `school.stay` | Stay with them and let them rest until they feel better. | उनके साथ रहें और ठीक लगने तक आराम करने दें। |  |
| `school.note` | This card helps notice and respond. Follow the clinician's plan for this student. | (missing) |  |
| `school.share` | Share this card | यह कार्ड भेजें |  |
| `school.shared` | Card shared | कार्ड भेजा गया |  |
| `school.guardian` | Parent or guardian | माता-पिता या अभिभावक |  |
| `advice.unknown` | Enter a reading. | रीडिंग डालें। |  |
| `advice.low` | This looks low. Have sugar, jaggery or a glucose biscuit, then recheck. | यह कम लगती है। चीनी, गुड़ या ग्लूकोज़ बिस्कुट लें, फिर दोबारा जाँचें। |  |
| `advice.high` | This looks high. Drink water and check your plan. | यह ज़्यादा लगती है। पानी पिएँ और अपनी योजना देखें। |  |
| `advice.ok` | In the usual range. Nice work logging it. | सामान्य दायरे में है। लिखने के लिए शाबाश। |  |
| `missedFall` | Missed fall | छूटा गिरना |  |
| `missedQuiet` | Missed quiet | छूटी शांति |  |
| `sp.title` | Shared phone | साझा फ़ोन |  |
| `sp.choosePin` | Choose a 4-digit PIN | 4 अंकों का पिन चुनें |  |
| `sp.offPin` | Enter your PIN to turn this off | इसे बंद करने के लिए अपना पिन डालें |  |
| `sp.confirm` | Confirm | पक्का करें |  |
| `sp.lock` | Lock now | अभी लॉक करें |  |
| `sp.who` | Who is using Saath? | साथ कौन चला रहा है? |  |
| `sp.addTitle` | Add a person | किसी को जोड़ें |  |
| `sp.name` | Name | नाम |  |
| `sp.add` | Add person | व्यक्ति जोड़ें |  |
| `sp.enterPin` | Enter your PIN | अपना पिन डालें |  |
| `sp.open` | Open | खोलें |  |
| `sp.wrong` | Wrong PIN. {n} tries left. | गलत पिन। {n} कोशिशें बाकी हैं। |  |
| `sp.wait` | Too many tries. Wait {s} seconds. | बहुत कोशिशें हो गईं। {s} सेकंड रुकें। |  |
| `sp.badPin` | Use exactly 4 digits. | ठीक 4 अंक डालें। |  |
| `sp.badNew` | Enter a name and a 4-digit PIN. | नाम और 4 अंकों का पिन डालें। |  |
| `sp.alertNote` | Safety alerts still show while the phone is locked. | फ़ोन लॉक होने पर भी सुरक्षा अलर्ट दिखते हैं। |  |
| `sp.alertFirst` | Answer the safety alert first. | पहले सुरक्षा अलर्ट का जवाब दें। |  |
| `acc.title` | Account and sync | खाता और सिंक |  |
| `acc.off` | Sync is not set up in this build. Saath works fully offline on this phone. | इस बिल्ड में सिंक चालू नहीं है। साथ इस फ़ोन पर बिना इंटरनेट पूरा चलता है। |  |
| `acc.phone` | Your mobile number | आपका मोबाइल नंबर |  |
| `join.link` | I have an invite code | मेरे पास न्योते का कोड है |  |
| `inv.card` | People who help you | लोग जो आपकी मदद करते हैं |  |
| `pt.title` | People I look after | जिनकी मैं देखभाल करता हूँ |  |
| `rc.doctor` | I am a doctor | मैं डॉक्टर हूँ |  |
| `rc.doctorNote` | Your patients only. You add them, plan their care, and see how they are doing. | सिर्फ़ आपके मरीज़। आप उन्हें जोड़ते हैं, उनकी देखभाल की योजना बनाते हैं और उनका हाल देखते हैं। |  |
| `mo.nameTitleDoctor` | About you, doctor | आपके बारे में, डॉक्टर साहब |  |
| `ob.nameDoctor` | Your name, as patients will see it | आपका नाम, जैसा मरीज़ों को दिखेगा |  |
| `pt.hiddenMember` | {n} invitation(s) were sent to you as a doctor. Use a doctor account for those. | {n} न्योता आपको डॉक्टर के रूप में भेजा गया था। उसके लिए डॉक्टर खाता इस्तेमाल करें। |  |
| `pt.hiddenDoctor` | {n} invitation(s) were not sent to you as a doctor, so they are not shown here. Doctors only see their patients. | {n} न्योता आपको डॉक्टर के रूप में नहीं भेजा गया था, इसलिए यहाँ नहीं दिखता। डॉक्टर सिर्फ़ अपने मरीज़ देखते हैं। |  |
| `sheet.close` | Close | बंद करें |  |
| `plate.alt` | Plate model | थाली का नमूना |  |
| `acc.open` | Sign in or create account | साइन इन या खाता बनाएँ |  |
| `vis.due` | Visit due | मिलने का समय |  |
| `vis.title` | Household visit | घर का दौरा |  |
| `vis.never` | No visit noted yet. | अभी कोई दौरा दर्ज नहीं। |  |
| `vis.today` | Visited today. | आज मिल चुके हैं। |  |
| `vis.ago` | Last visit {n} days ago. | आख़िरी दौरा {n} दिन पहले। |  |
| `vis.mark` | I visited today | आज मिलकर आया |  |
| `plan.meds` | Medicines | दवाएँ |  |
| `manage` | Manage | प्रबंधित करें |  |
| `tasks.title` | Today's tasks | आज के काम |  |
| `rem.section` | Reminders | याद दिलाना |  |
| `mo.who` | I am a... | मैं हूँ... |  |
| `pt.titleDoctor` | My patients | मेरे मरीज़ |  |
| `amp.title` | Look after someone new | किसी नए की देखभाल जोड़ें |  |
| `amp.titleDoctor` | Add a patient | मरीज़ जोड़ें |  |
| `amp.btn` | Show my card to add someone | जोड़ने के लिए मेरा कार्ड दिखाएँ |  |
| `amp.btnDoctor` | Add my patient | मेरा मरीज़ जोड़ें |  |
| `amp.scan` | Ask the person to scan this with Saath or their phone camera. | व्यक्ति से कहें कि इसे साथ या फ़ोन के कैमरे से स्कैन करें। |  |
| `amp.then` | They confirm once, then show you a code to scan back. No typing. | वे एक बार पक्का करेंगे, फिर आपको स्कैन करने के लिए कोड दिखाएँगे। टाइप नहीं करना। |  |
| `amp.needAccount` | Sign in with your name and number first (Me tab), so your card has them. | पहले अपने नाम और नंबर से साइन इन करें (मैं टैब), ताकि कार्ड में वे हों। |  |
| `plan.editBtn` | Edit care plan | देखभाल योजना बदलें |  |
| `inv.scan` | Scan to join | स्कैन करके जुड़ें |  |
| `inv.scanFor` | {name}: scan this with your phone camera, or type the code below | {name} अपने फ़ोन के कैमरे से यह कोड स्कैन करें, या ऊपर का कोड डालें |  |
| `inv.showQr` | Show QR code | QR कोड दिखाएँ |  |
| `circ.onSaath` | On Saath | साथ पर |  |
| `an.days` | {n} days | {n} दिन |  |
| `an.none` | No readings in this time yet. | इस समय में अभी कोई रीडिंग नहीं। |  |
| `an.lowest` | Lowest | सबसे कम |  |
| `an.highest` | Highest | सबसे ज़्यादा |  |
| `an.readings` | Logged | दर्ज |  |
| `an.dailyAvg` | Average each day | हर दिन का औसत |  |
| `an.mgdl` | Sugar reading (mg/dL) | शुगर रीडिंग (mg/dL) |  |
| `an.save` | Save reading | रीडिंग सहेजें |  |
| `an.medWeek` | Medicines taken this week | इस हफ़्ते ली गई दवाएँ |  |
| `an.heart` | Heart rate | दिल की धड़कन |  |
| `an.heartWait` | Waiting for readings from your band. | आपके बैंड से रीडिंग का इंतज़ार है। |  |
| `an.heartNone` | Connect a heart-rate band to see your heart rate here. | यहाँ दिल की धड़कन देखने के लिए हार्ट-रेट बैंड जोड़ें। |  |
| `an.heartSession` | This session only. Heart rate is not saved or sent. | सिर्फ़ इस सत्र के लिए। धड़कन सहेजी या भेजी नहीं जाती। |  |
| `an.connect` | Connect a band | बैंड जोड़ें |  |
| `dial.in` | In my privacy dial | मेरे निजता डायल में |  |
| `pt.none` | No one yet | अभी कोई नहीं |  |
| `pt.need` | {n} need attention | {n} को ध्यान चाहिए |  |
| `pt.allWell` | All is well | सब ठीक है |  |
| `pt.ok` | OK | ठीक |  |
| `pt.as.family` | As guardian | अभिभावक के रूप में |  |
| `pt.as.clinician` | As doctor | डॉक्टर के रूप में |  |
| `pt.as.asha` | As ASHA | आशा के रूप में |  |
| `pt.as.neighbour` | As neighbour | पड़ोसी के रूप में |  |
| `acc.continue` | Continue | जारी रखें |  |
| `acc.show` | Show | दिखाएँ |  |
| `acc.hide` | Hide | छिपाएँ |  |
| `acc.wait` | Please wait... | रुकिए... |  |
| `acc.wrongPass` | That is not the right password for this number. | इस नंबर के लिए पासवर्ड सही नहीं है। |  |
| `acc.code` | Code from the SMS | SMS में आया कोड |  |
| `acc.send` | Send code | कोड भेजें |  |
| `acc.signIn` | Sign in | साइन इन |  |
| `acc.sent` | Code sent. Check your messages. | कोड भेज दिया। अपने संदेश देखें। |  |
| `acc.failed` | Could not reach the server. Try again when you have a connection. | सर्वर तक नहीं पहुँचे। कनेक्शन मिलने पर फिर कोशिश करें। |  |
| `acc.badCode` | That code did not work. | यह कोड काम नहीं आया। |  |
| `acc.in` | Signed in as {phone} | {phone} से साइन इन है |  |
| `acc.waiting` | {n} updates waiting to send | {n} अपडेट भेजने के लिए रुके हैं |  |
| `acc.out` | Sign out | साइन आउट |  |
| `acc.start` | Turn on sync | सिंक चालू करें |  |
| `acc.startNote` | No phone number needed. Your circle joins with an invite code. | फ़ोन नंबर की ज़रूरत नहीं। आपका घेरा न्योते के कोड से जुड़ता है। |  |
| `acc.inAnon` | Sync is on for this phone | इस फ़ोन पर सिंक चालू है |  |
| `acc.anonNote` | If you clear Saath's data or change phone, this account is lost and your circle must invite you again. | अगर आप साथ का डेटा मिटाएँ या फ़ोन बदलें, तो यह खाता खो जाता है और आपके घेरे को फिर से न्योता भेजना होगा। |  |
| `acc.disabled` | The server has not allowed this yet. Ask whoever set up Saath. | सर्वर ने अभी इसकी अनुमति नहीं दी। जिसने साथ सेट किया है उससे पूछें। |  |
| `ev.fall` | {name} may have fallen. Please call them. | {name} शायद गिर गए हैं। कृपया उन्हें फ़ोन करें। |  |
| `ev.quiet` | {name} has been very quiet. Please check on them. | {name} बहुत देर से शांत हैं। कृपया उनका हाल पूछें। |  |
| `ev.imOk` | {name} said they are OK. | {name} ने बताया कि वे ठीक हैं। |  |
| `ev.false` | {name} says it was a false alarm. | {name} का कहना है कि यह गलत अलार्म था। |  |
| `ev.task` | {name} finished: {detail} | {name} ने पूरा किया: {detail} |  |
| `ev.other` | {name}: new update | {name}: नया अपडेट |  |
| `ago.now` | just now | अभी |  |
| `ago.min` | {n} min ago | {n} मिनट पहले |  |
| `ago.hour` | {n} h ago | {n} घंटे पहले |  |
| `ago.day` | {n} days ago | {n} दिन पहले |  |
| `cf.title` | People I look after | मैं जिनके घेरे में हूँ |  |
| `cf.none` | You are not in anyone's circle yet. | आप अभी किसी के घेरे में नहीं हैं। |  |
| `cf.empty` | No news yet. | अभी कोई खबर नहीं। |  |
| `cf.someone` | Someone | कोई |  |
| `cf.sees` | You see: {level} | आप देखते हैं: {level} |  |
| `cf.note` | You only see what they chose to share with you. Safety alerts always reach you. | आप वही देखते हैं जो उन्होंने आपके साथ साझा करना चुना है। सुरक्षा अलर्ट आपको हमेशा मिलते हैं। |  |
| `cf.offline` | Showing what arrived the last time you were online. | आख़िरी बार ऑनलाइन होने पर जो आया, वही दिख रहा है। |  |
| `cf.seen` | Got it | देख लिया |  |
| `join.title` | Join someone's circle | किसी के घेरे में जुड़ें |  |
| `join.code` | Invite code | न्योते का कोड |  |
| `join.button` | Join | जुड़ें |  |
| `join.needSignIn` | Sign in on the Me tab first. | पहले 'मैं' टैब में साइन इन करें। |  |
| `join.ok` | You joined their circle. | आप उनके घेरे में जुड़ गए। |  |
| `join.bad` | That code did not work. Ask them for a new one. | यह कोड काम नहीं आया। उनसे नया कोड माँगें। |  |
| `join.net` | Could not reach the server. Try again when you have a connection. | सर्वर तक नहीं पहुँचे। कनेक्शन मिलने पर फिर कोशिश करें। |  |
| `join.limit` | Too many tries. Wait a few minutes, then try again. | बहुत कोशिशें हो गईं। कुछ मिनट रुककर फिर कोशिश करें। |  |
| `sg.title` | Today's slips | आज की पर्चियाँ |  |
| `sg.note` | Small things for today, made on this phone from what you have entered. This is not medical advice. | आज के लिए छोटी बातें, इसी फ़ोन पर आपकी दी हुई जानकारी से बनी हैं। यह इलाज की सलाह नहीं है। |  |
| `sg.stamp` | Stamp it | मुहर लगाएँ |  |
| `sg.skip` | Not today | आज नहीं |  |
| `sg.open` | Open | खोलें |  |
| `sg.stamped` | Done | हो गया |  |
| `sg.allDone` | Every slip is stamped for today. Well done. | आज की सब पर्चियों पर मुहर लग गई। शाबाश। |  |
| `sg.none` | Nothing more for today. | आज के लिए और कुछ नहीं। |  |
| `sg.left` | {n} left | {n} बाकी |  |
| `sg.a11y` | Suggestion {i} of {n}: {title} | {n} में से सुझाव {i}: {title} |  |
| `sg.kind.care` | Care | देखभाल |  |
| `sg.noteAi` | Care reminders are made on this phone. Ideas are written by an AI from a short anonymous summary of your day. None of this is medical advice. | देखभाल की याद दिलाने वाले कार्ड इसी फ़ोन पर बनते हैं। सुझाव एक AI आपके दिन के छोटे और गुमनाम सार से लिखता है। इनमें से कुछ भी चिकित्सा सलाह नहीं है। |  |
| `sg.kind.ai` | Idea | सुझाव |  |
| `ai.fab` | Ask Saath for help | साथ से मदद माँगें |  |
| `ai.title` | Saath helper | साथ सहायक |  |
| `ai.notice` | Replies are written by an AI from a short anonymous summary of your day. It never gives doses or diagnoses. In an emergency, use the alert. | जवाब एक AI लिखता है, आपके दिन के छोटे और गुमनाम सार से। वह कभी खुराक या बीमारी की पहचान नहीं बताता। आपात स्थिति में अलर्ट दबाएँ। |  |
| `ai.empty` | Ask me about food, your routine, or how to use Saath. | खाने, अपनी दिनचर्या या साथ इस्तेमाल करने के बारे में पूछें। |  |
| `ai.placeholder` | Ask for help | मदद के लिए पूछें |  |
| `ai.send` | Send | भेजें |  |
| `ai.close` | Close | बंद करें |  |
| `ai.clear` | Clear chat | चैट साफ़ करें |  |
| `ai.thinking` | Thinking... | सोच रहा है... |  |
| `ai.offline` | The helper needs internet right now. Try again when you have signal. | सहायक को अभी इंटरनेट चाहिए। सिग्नल मिलने पर फिर कोशिश करें। |  |
| `ai.busy` | The helper is busy. Please try again in a minute. | सहायक अभी व्यस्त है। कृपया एक मिनट बाद फिर कोशिश करें। |  |
| `ai.emergency` | This sounds urgent. Open the alert on the Safety tab, or call someone in your circle or 112 now. I cannot help with emergencies in chat. | यह ज़रूरी लगता है। सुरक्षा टैब में अलर्ट खोलें, या अपने घेरे में किसी को या 112 पर अभी फ़ोन करें। मैं चैट में आपात स्थिति में मदद नहीं कर सकता। |  |
| `ai.openSafety` | Open Safety | सुरक्षा खोलें |  |
| `ai.q1` | What can I eat today? | आज मैं क्या खा सकता/सकती हूँ? |  |
| `ai.q2` | I missed my medicine | मेरी दवा छूट गई |  |
| `ai.q3` | Ideas for a short walk | छोटी सैर के लिए सुझाव |  |
| `ai.q4` | How do I add someone to my circle? | अपने घेरे में किसी को कैसे जोड़ूँ? |  |
| `ai.setting` | Smart cards and helper | स्मार्ट कार्ड और सहायक |  |
| `ai.settingNote` | Needs internet. Sends only a short anonymous summary: never your name, number, medicines or readings. | इंटरनेट चाहिए। सिर्फ़ एक छोटा गुमनाम सार भेजता है: आपका नाम, नंबर, दवाएँ या रीडिंग कभी नहीं। |  |
| `sg.kind.habit` | Habit | आदत |  |
| `sg.refill.t` | Medicine running low | दवा कम हो रही है |  |
| `sg.refill.b` | Your medicine may run out in about {days} days. Ask your clinic or chemist about a refill. | आपकी दवा करीब {days} दिन में खत्म हो सकती है। रिफ़िल के बारे में अपने क्लिनिक या केमिस्ट से पूछें। |  |
| `sg.strips.t` | Test strips running low | टेस्ट स्ट्रिप कम हो रही हैं |  |
| `sg.strips.b` | About {days} days of test strips are left at your usual testing. Ask your clinic or chemist. | आपकी जाँच के हिसाब से करीब {days} दिन की स्ट्रिप बची हैं। अपने क्लिनिक या केमिस्ट से पूछें। |  |
| `sg.visit.t` | Questions for your visit | डॉक्टर से मिलने के सवाल |  |
| `sg.visit.b` | You have written {n} for your next clinic visit. Have a look before you go. | अगली बार क्लिनिक जाने के लिए आपने {n} सवाल लिखे हैं। जाने से पहले एक बार देख लें। |  |
| `sg.foot.t` | Look at your feet | अपने पैर देखें |  |
| `sg.foot.b` | Look at both feet once a week for sores, cracks or blisters. It takes two minutes. | हफ़्ते में एक बार दोनों पैर देखें: घाव, दरारें या छाले। इसमें दो मिनट लगते हैं। |  |
| `sg.checkin.t` | How was this week? | इस हफ़्ते कैसा रहा? |  |
| `sg.checkin.b` | Tell Saath how the week felt. One tap. | साथ को बताएँ कि हफ़्ता कैसा लगा। बस एक बार दबाएँ। |  |
| `sg.reading.t` | A reading today? | आज रीडिंग लेनी है? |  |
| `sg.reading.b` | If you test today, add the number so your record stays complete. | अगर आज जाँच करें, तो नंबर जोड़ दें ताकि आपका रिकॉर्ड पूरा रहे। |  |
| `sg.ladder.t` | One step toward doing it yourself | खुद करने की ओर एक कदम |  |
| `sg.ladder.b` | Pick one skill from your Ladder to try this week, with a parent beside you. | अपनी सीढ़ी से एक काम चुनें और इस हफ़्ते माता-पिता के साथ बैठकर आज़माएँ। |  |
| `sg.company.t` | Talk to someone today | आज किसी से बात करें |  |
| `sg.company.b` | This has been a hard week. Call or message someone in your circle. You can also pause routine updates with Time off. | यह हफ़्ता मुश्किल रहा। अपने घेरे में किसी को फ़ोन या संदेश करें। चाहें तो छुट्टी से रोज़ के अपडेट रोक सकते हैं। |  |
| `sg.water.t` | A glass of water | एक गिलास पानी |  |
| `sg.water.b` | Sip some water now. If your clinic has told you to limit fluids, follow that. | अभी थोड़ा पानी पिएँ। अगर क्लिनिक ने पानी कम पीने को कहा है, तो वही मानें। |  |
| `sg.water.b2` | Have a glass of water within the next hour, unless your clinic limits fluids. Keep it where you can see it. | पानी का एक गिलास अगले एक घंटे में पी लें, अगर क्लिनिक ने पानी कम करने को न कहा हो। उसे नज़र के सामने रखें। |  |
| `sg.water.b3` | Pour a glass of water now and sip it as you go. If your clinic limits fluids, follow that. | अभी एक गिलास पानी डालें और धीरे-धीरे पिएँ। अगर क्लिनिक ने पानी सीमित करने को कहा है तो वही मानें। |  |
| `sg.walk.t` | A slow walk after eating | खाने के बाद धीमी सैर |  |
| `sg.walk.b` | A short, easy walk around the house or street. If you feel unwell, stop and sit down. | घर या गली में थोड़ी आराम से सैर करें। तबीयत ठीक न लगे तो रुककर बैठ जाएँ। |  |
| `sg.walk.b2` | If you feel steady, an easy stroll after eating is a gentle habit. Sit down if you feel unwell. | अगर आप स्थिर महसूस करें तो खाने के बाद आराम से टहलना अच्छी आदत है। तबीयत ठीक न लगे तो बैठ जाएँ। |  |
| `sg.walk.b3` | Step outside for a slow walk, or walk around the house. Stop and sit if anything feels wrong. | बाहर धीरे-धीरे टहलें, या घर में ही चलें। कुछ भी ठीक न लगे तो रुककर बैठ जाएँ। |  |
| `sg.meal.t` | {slot} idea | {slot} का सुझाव |  |
| `sg.meal.b` | {idea}. Use it, swap it, or ask for another in the Food guide. | {idea}। इसे चुनें, बदलें, या खाने की गाइड में दूसरा सुझाव माँगें। |  |
| `sg.plate.t` | Fill your plate | थाली भरें |  |
| `sg.plate.b` | Half vegetables, a quarter dal or protein, a quarter roti or rice. Open the food guide. | आधी थाली सब्ज़ी, एक चौथाई दाल या प्रोटीन, एक चौथाई रोटी या चावल। खाने की गाइड खोलें। |  |
| `pro.note` | Read only. Saath shows what the household chose to share and never changes a treatment plan. | सिर्फ़ पढ़ने के लिए। साथ वही दिखाता है जो घर ने साझा करना चुना, और इलाज की योजना कभी नहीं बदलता। |  |
| `hero.done` | done today | आज हुए |  |
| `plan.build` | Care plan for this person | इस व्यक्ति की देखभाल योजना |  |
| `plan.buildNote` | What you publish here is applied on their phone by itself, shown as set by you. Write medicines and doses exactly as you would on a prescription: Saath never works one out. | आप यहाँ जो प्रकाशित करेंगे वह उनके फ़ोन पर अपने आप लागू होगा, आपके नाम से। दवा और खुराक वैसे ही लिखें जैसे पर्चे पर लिखते हैं: साथ कभी खुराक नहीं निकालता। |  |
| `plan.tasks` | Daily tasks | रोज़ के काम |  |
| `plan.testPerDay` | Sugar checks per day (number) | दिन में शुगर की जाँच (संख्या) |  |
| `plan.notes` | A note for the person | व्यक्ति के लिए एक नोट |  |
| `plan.publish` | Publish plan | योजना भेजें |  |
| `plan.empty` | Add at least one medicine, task, check count or note. | कम से कम एक दवा, काम, जाँच की संख्या या नोट जोड़ें। |  |
| `plan.needSignIn` | Sign in on the Me tab first. | पहले मैं टैब में साइन इन करें। |  |
| `plan.sending` | Sending... | भेज रहे हैं... |  |
| `plan.sent` | Published. Their phone updates by itself next time it is online and open. | भेज दी गई। उनका फ़ोन अगली बार ऑनलाइन और खुला होने पर अपने आप अपडेट होगा। |  |
| `plan.offline` | No connection. Try again when you are online. | कनेक्शन नहीं है। ऑनलाइन होने पर फिर कोशिश करें। |  |
| `plan.failed` | Could not publish. Only a clinician added to this person's circle can. | भेजी नहीं जा सकी। सिर्फ़ इस व्यक्ति के घेरे में जुड़ा डॉक्टर ही भेज सकता है। |  |
| `plan.safety` | Saath only passes on what you wrote. It does not check a dose or suggest one. | साथ सिर्फ़ वही आगे पहुँचाता है जो आपने लिखा। वह खुराक न जाँचता है, न सुझाता है। |  |
| `plan.updated` | {who} updated your plan | {who} ने आपकी योजना बदली |  |
| `plan.what` | Now: {meds} medicines and {tasks} daily tasks from your clinician. | अब: डॉक्टर की ओर से {meds} दवाएँ और {tasks} रोज़ के काम। |  |
| `plan.check` | If anything looks different from what your clinician told you, ask them before following it. | अगर कुछ भी वैसा नहीं दिखता जैसा डॉक्टर ने बताया था, तो मानने से पहले उनसे पूछें। |  |
| `plan.gotIt` | Got it | समझ गया |  |
| `plan.setBy` | set by {who} | {who} ने तय किया |  |
| `med.title` | My medicines | मेरी दवाएँ |  |
| `med.empty` | No medicines added yet. Add them exactly as your doctor wrote them. | अभी कोई दवा नहीं जोड़ी। उन्हें वैसे ही जोड़ें जैसे डॉक्टर ने लिखा है। |  |
| `med.note` | Saath only reminds you. It never suggests, works out or changes a dose. Copy it from your prescription, and ask your doctor or chemist if you are unsure. | साथ सिर्फ़ याद दिलाता है। वह खुराक कभी सुझाता, निकालता या बदलता नहीं। पर्चे से वैसे ही लिखें, और पक्का न हो तो डॉक्टर या केमिस्ट से पूछें। |  |
| `med.add` | Add a medicine | दवा जोड़ें |  |
| `med.close` | Close | बंद करें |  |
| `med.name` | Medicine name | दवा का नाम |  |
| `med.dose` | Dose as written on the prescription | पर्चे पर लिखी खुराक |  |
| `med.doseHelp` | For example, copy what the prescription says. Leave it empty if you prefer. | पर्चे पर जो लिखा है वही लिखें। चाहें तो खाली छोड़ दें। |  |
| `med.when` | When | कब |  |
| `med.save` | Save medicine | दवा सहेजें |  |
| `med.taken` | taken | ले ली |  |
| `med.notTaken` | not marked | निशान नहीं लगा |  |
| `med.now` | Medicines now | अभी की दवाएँ |  |
| `when.beforeBreakfast` | Before breakfast | नाश्ते से पहले |  |
| `when.afterBreakfast` | After breakfast | नाश्ते के बाद |  |
| `when.beforeLunch` | Before lunch | दोपहर के खाने से पहले |  |
| `when.afterLunch` | After lunch | दोपहर के खाने के बाद |  |
| `when.beforeDinner` | Before dinner | रात के खाने से पहले |  |
| `when.afterDinner` | After dinner | रात के खाने के बाद |  |
| `when.bedtime` | At bedtime | सोते समय |  |
| `sg.med.t` | Medicine not marked yet | दवा पर निशान नहीं लगा |  |
| `sg.med.b` | {names} is not marked as taken. If you took it, mark it. If you are not sure, do not double up: ask your family, chemist or clinic. | {names} पर ली हुई का निशान नहीं है। ले ली हो तो निशान लगाएँ। पक्का न हो तो दोबारा न लें: परिवार, केमिस्ट या क्लिनिक से पूछें। |  |
| `food.ideas` | Meal ideas for you | आपके लिए खाने के सुझाव |  |
| `food.ideasNote` | Made on this phone for your region and diet, and they change every day. Plate idea only: ask your clinic or a dietitian what is right for you. | ये इसी फ़ोन पर आपके इलाके और खान-पान के हिसाब से बनते हैं, और हर दिन बदलते हैं। सिर्फ़ थाली का विचार: आपके लिए क्या ठीक है, यह अपने क्लिनिक या डायटीशियन से पूछें। |  |
| `food.diet` | What do you eat? | आप क्या खाते हैं? |  |
| `diet.veg` | Vegetarian | शाकाहारी |  |
| `diet.egg` | Eggs too | अंडे भी |  |
| `diet.nonveg` | Non-vegetarian | माँसाहारी |  |
| `slot.breakfast` | Breakfast | नाश्ता |  |
| `slot.lunch` | Lunch | दोपहर का खाना |  |
| `slot.snack` | Snack | हल्का नाश्ता |  |
| `slot.dinner` | Dinner | रात का खाना |  |
| `food.now` | next | अगला |  |
| `food.take` | I will have this | मैं यह खाऊँगा |  |
| `food.another` | Another idea | दूसरा सुझाव |  |
| `food.notme` | Not for me | मेरे लिए नहीं |  |
| `food.notmeHelp` | Which food should Saath stop suggesting? | साथ को कौन सा खाना सुझाना बंद करना चाहिए? |  |
| `food.reset` | Forget my choices | मेरी पसंद भूल जाएँ |  |
| `food.none` | No idea fits those choices. Try forgetting your choices. | इन पसंदों में कोई सुझाव नहीं बना। पसंद भुलाकर देखें। |  |
| `ph.household` | Household {x} | घर {x} |  |
| `ph.needA` | Missed medicine 2 days | 2 दिन दवा छूटी |  |
| `ph.needB` | Refill due in 3 days | 3 दिन में दवा का रिफ़िल चाहिए |  |
| `ph.needC` | Stable | स्थिर |  |
| `nb.title` | You are a neighbour | आप पड़ोसी हैं |  |
| `nb.get` | You get safety alerts only | आपको सिर्फ़ सुरक्षा अलर्ट मिलते हैं |  |
| `nb.getSub` | A fall that nobody answers, or an "I am OK" that never came. | ऐसी गिरावट जिसका किसी ने जवाब नहीं दिया, या "मैं ठीक हूँ" जो आया ही नहीं। |  |
| `nb.do` | Call or visit when an alert reaches you | अलर्ट आने पर फ़ोन करें या मिलने जाएँ |  |
| `nb.doSub` | You live close enough to help quickly. That is why you are in this circle. | आप पास रहते हैं, इसलिए जल्दी मदद कर सकते हैं। इसीलिए आप इस घेरे में हैं। |  |
| `nb.never` | You never see | आप कभी नहीं देखते |  |
| `nb.neverSub` | Sugar readings, medicines, the daily routine or where the person is. | शुगर रीडिंग, दवाएँ, रोज़ की दिनचर्या या व्यक्ति कहाँ है। |  |
| `task.t1` | Morning medicine | सुबह की दवा |  |
| `task.t2` | Lunch | दोपहर का खाना |  |
| `task.t3` | Evening walk | शाम की सैर |  |
| `task.t4` | Sugar check | शुगर की जाँच |  |
| `sg.task.t` | Still open today | आज अभी बाकी है |  |
| `sg.task.b` | {title} was planned for {time}. If you have already done it, tick it on your list below. | {title} का समय {time} था। अगर कर लिया है तो नीचे अपनी सूची में निशान लगाएँ। |  |
| `sg.shoes.t` | Check your shoes | जूते देख लें |  |
| `sg.shoes.b` | Look inside your shoes before you put them on, and wear them with socks. | जूते पहनने से पहले अंदर देख लें, और मोज़े के साथ पहनें। |  |
| `sg.shoes.b2` | Shake out your shoes and feel inside for stones or rough spots before you wear them. | जूते पहनने से पहले उन्हें झाड़ लें और हाथ डालकर देखें कि कंकड़ या खुरदरी जगह तो नहीं। |  |
| `sg.shoes.b3` | Check your socks for holes or hard seams, then look inside your shoes. | मोज़ों में छेद या सख़्त सिलाई देखें, फिर जूतों के अंदर देखें। |  |
| `sg.sleep.t` | Wind down for sleep | सोने की तैयारी |  |
| `sg.sleep.b` | Put the screen away, keep the room dim, and keep your phone near the bed in case you need help. | स्क्रीन रख दें, कमरे में हल्की रोशनी रखें, और फ़ोन बिस्तर के पास रखें ताकि ज़रूरत पर मदद मिल सके। |  |
| `sg.sleep.b2` | Dim the lights and keep your phone within reach tonight, in case you need help. | आज रात बत्ती धीमी करें और फ़ोन पास रखें, ताकि ज़रूरत पड़े तो मदद बुला सकें। |  |
| `sg.sleep.b3` | Try to go to bed at the same time tonight, with your phone beside you. | आज रात रोज़ वाले समय पर सोने की कोशिश करें, फ़ोन अपने पास रखकर। |  |
| `sg.rest.t` | Rest is enough today | आज आराम काफ़ी है |  |
| `sg.rest.b` | You do not need to do more today. Sit, sip some water, and tell someone if you want company. | आज और कुछ करने की ज़रूरत नहीं। बैठें, थोड़ा पानी पिएँ, और साथ चाहिए तो किसी को बताएँ। |  |
| `sg.rest.b2` | Today you can simply rest. Let someone know if you want company. | आज बस आराम कर सकते हैं। साथ चाहिए तो किसी को बता दें। |  |
| `sg.rest.b3` | There is nothing you must do today. Sit, sip some water, and be easy on yourself. | आज कुछ करना ज़रूरी नहीं। बैठें, थोड़ा पानी पिएँ, और अपने साथ नरमी रखें। |  |
| `consentLegal` | कानूनी समीक्षा बाकी है। यह कदम पहचान की जाँच नहीं करता और कानूनी पालन का दावा नहीं है। | (missing) |  |
| `school.call` | परिवार या क्लिनिक को फ़ोन करें। निगल न पाएँ या जवाब न दें तो आपात मदद बुलाएँ। | (missing) |  |
