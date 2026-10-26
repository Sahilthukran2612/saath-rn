const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  { ignores: ['node_modules/', '.expo/', 'dist/', 'docs/'] },
  {
    files: ['__tests__/**/*.js', 'jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly', describe: 'readonly', test: 'readonly', expect: 'readonly', it: 'readonly' },
    },
  },
];
