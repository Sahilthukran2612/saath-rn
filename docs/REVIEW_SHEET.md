# Review sheet: wording that needs a person to check it

Generated from `src/i18n/strings.js` on 2026-11-21. Two reviewers are needed. Mark each row OK or write the fix beside it.

## A. Clinician: is anything unsafe, misleading or too directive?

The rules Saath follows, enforced by tests: never calculate, suggest or change a dose; never diagnose; never say what a sugar level means; no extra tasks after a hard week or in a crisis phase. Medicines and doses are only what the person or the doctor typed. Tick a row only if you would be comfortable with a patient reading it unprompted.

### Suggestion cards (each has up to three phrasings)

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

### Medicines, care plan and visit wording

| Key | Text (English) | Safe? |
|---|---|---|
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
| `plan.build` | Care plan for this person |  |
| `plan.buildNote` | What you publish here is applied on their phone by itself, shown as set by you. Write medicines and doses exactly as you would on a prescription: Saath never works one out. |  |
| `plan.tasks` | Daily tasks |  |
| `plan.testPerDay` | Sugar checks per day (number) |  |
| `plan.notes` | A note for the person |  |
| `plan.publish` | Publish plan |  |
| `plan.empty` | Add at least one medicine, task, check count or note. |  |
| `plan.demoApplied` | Demo: applied to this phone as their phone would. Open the Person view to see it. |  |
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

| Key | English | Hindi | OK / fix |
|---|---|---|---|
| `theme.title` | Look | रूप |  |
| `theme.auto` | Phone | फ़ोन जैसा |  |
| `theme.light` | Light | हल्का |  |
| `theme.dark` | Dark | गहरा |  |
| `theme.reopen` | Close Saath and open it again to change the look. | रूप बदलने के लिए साथ को बंद करके दोबारा खोलें। |  |
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
| `inv.message` | Saath invite. 1) Install Saath. 2) Choose "I look after someone". 3) Create your account with the phone number I gave you. 4) Enter this code: {code} | साथ का न्योता। 1) साथ इंस्टॉल करें। 2) "मैं किसी की देखभाल करता/करती हूँ" चुनें। 3) मैंने जो फ़ोन नंबर दिया है, उसी से अपना खाता बनाएँ। 4) यह कोड डालें: {code} |  |
| `inv.code` | Code: {code} | कोड: {code} |  |
| `inv.needSignIn` | Not sent. Sign in on the Me tab first. Until then nobody can join with this code. | भेजा नहीं गया। पहले "मैं" टैब में साइन इन करें। तब तक इस कोड से कोई नहीं जुड़ सकता। |  |
| `inv.notSent` | Not sent yet. It sends by itself in about 30 seconds while the app is open and online. | अभी भेजा नहीं गया। ऐप खुला और इंटरनेट चालू हो तो करीब 30 सेकंड में अपने आप चला जाता है। |  |
| `inv.sendNow` | Send now | अभी भेजें |  |
| `inv.sentBadge` | Sent | भेजा गया |  |
| `inv.failed` | Could not send it. Check the internet and try again. | भेज नहीं सके। इंटरनेट देखें और फिर कोशिश करें। |  |
| `inv.sent` | Sent. They can join with the code now. | भेज दिया गया। अब वे कोड से जुड़ सकते हैं। |  |
| `inv.again` | Share the code again | कोड फिर से भेजें |  |
| `inv.demoNote` | Demo: tapping a waiting person marks them as joined on this phone only. | डेमो: इंतज़ार वाले व्यक्ति को दबाने से वह सिर्फ़ इसी फ़ोन पर जुड़ा हुआ दिखता है। |  |
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
| `acc.quickNote` | Works on this phone only. If you clear Saath\'s data or change phone, it is lost. | सिर्फ़ इसी फ़ोन पर चलता है। साथ का डेटा मिटाने या फ़ोन बदलने पर खो जाता है। |  |
| `acc.multi` | Sign in with the same number and password on another phone to use Saath there too. | दूसरे फ़ोन पर भी साथ चलाने के लिए वहाँ इसी नंबर और पासवर्ड से साइन इन करें। |  |
| `rem.toggle` | Remind me at these times | इन समयों पर याद दिलाएँ |  |
| `rem.body` | Time for: {title} | समय हो गया: {title} |  |
| `rem.note` | Every day, even when Saath is closed. | हर दिन, साथ बंद हो तब भी। |  |
| `rem.at` | Reminder at {time} | {time} पर याद दिलाएँ |  |
| `rem.none` | No reminder | कोई याद दिलाना नहीं |  |
| `rem.earlier` | Earlier | पहले |  |
| `rem.later` | Later | बाद में |  |
| `rem.sleep` | This is in the sleep window, so no reminder will show. | यह सोने के समय में है, इसलिए याद नहीं दिलाया जाएगा। |  |
| `rem.denied` | Allow notifications so reminders can show, then try again. | सूचनाओं की अनुमति दें ताकि याद दिलाना दिख सके, फिर कोशिश करें। |  |
| `food.verify` | Verify locally. This is general guidance. Follow your clinician's plan. | स्थानीय रूप से जाँचें। यह सामान्य जानकारी है। अपने डॉक्टर की योजना मानें। |  |
| `food.plate` | Your plate | आपकी थाली |  |
| `food.region` | Meals from your region | आपके इलाके के खाने |  |
| `food.fasting` | Fasting | व्रत |  |
| `food.festival` | Festivals | त्योहार |  |
| `food.log` | What did you eat? | आपने क्या खाया? |  |
| `food.today` | Meals today | आज का खाना |  |
| `acc.title` | Account and sync | खाता और सिंक |  |
| `acc.off` | Sync is not set up in this build. Saath works fully offline on this phone. | इस बिल्ड में सिंक चालू नहीं है। साथ इस फ़ोन पर बिना इंटरनेट पूरा चलता है। |  |
| `acc.phone` | Your mobile number | आपका मोबाइल नंबर |  |
| `join.link` | I have an invite code | मेरे पास न्योते का कोड है |  |
| `inv.card` | People who help you | लोग जो आपकी मदद करते हैं |  |
| `pt.title` | People I look after | जिनकी मैं देखभाल करता हूँ |  |
| `acc.open` | Sign in or create account | साइन इन या खाता बनाएँ |  |
| `vis.due` | Visit due | मिलने का समय |  |
| `vis.title` | Household visit | घर का दौरा |  |
| `vis.never` | No visit noted yet. | अभी कोई दौरा दर्ज नहीं। |  |
| `vis.today` | Visited today. | आज मिल चुके हैं। |  |
| `vis.ago` | Last visit {n} days ago. | आख़िरी दौरा {n} दिन पहले। |  |
| `vis.mark` | I visited today | आज मिलकर आया |  |
| `plan.meds` | Medicines | दवाएँ |  |
| `tasks.title` | Today\'s tasks | आज के काम |  |
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
| `acc.anonNote` | If you clear Saath\'s data or change phone, this account is lost and your circle must invite you again. | अगर आप साथ का डेटा मिटाएँ या फ़ोन बदलें, तो यह खाता खो जाता है और आपके घेरे को फिर से न्योता भेजना होगा। |  |
| `acc.disabled` | The server has not allowed this yet. Ask whoever set up Saath. | सर्वर ने अभी इसकी अनुमति नहीं दी। जिसने साथ सेट किया है उससे पूछें। |  |
| `join.title` | Join someone\'s circle | किसी के घेरे में जुड़ें |  |
| `join.code` | Invite code | न्योते का कोड |  |
| `join.button` | Join | जुड़ें |  |
| `join.needSignIn` | Sign in on the Me tab first. | पहले \'मैं\' टैब में साइन इन करें। |  |
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
| `plan.demoApplied` | Demo: applied to this phone as their phone would. Open the Person view to see it. | डेमो: इस फ़ोन पर वैसे ही लागू हुआ जैसे उनके फ़ोन पर होता। देखने के लिए व्यक्ति का दृश्य खोलें। |  |
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
