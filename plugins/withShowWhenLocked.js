// Lets Saath's main screen appear over the lock screen and turn the screen on when an alert opens it
// (the full-screen notification in the foreground module relies on this). It changes two attributes on
// MainActivity in the generated AndroidManifest and nothing else.
const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withShowWhenLocked(config) {
  return withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application?.[0];
    const main = app?.activity?.find((a) => a.$['android:name'] === '.MainActivity');
    if (main) {
      main.$['android:showWhenLocked'] = 'true';
      main.$['android:turnScreenOn'] = 'true';
    }
    return c;
  });
};