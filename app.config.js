// Adds Firebase to the Android build only when google-services.json is present in the project folder, so the
// app still builds (without push) before the Firebase project exists. See docs/PUSH.md.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const hasFirebase = fs.existsSync(path.join(process.cwd(), 'google-services.json'));
  return {
    ...config,
    android: { ...config.android, ...(hasFirebase ? { googleServicesFile: './google-services.json' } : {}) },
  };
};