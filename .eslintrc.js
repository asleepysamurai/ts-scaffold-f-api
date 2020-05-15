const OFF = 0,
  WARN = 1,
  ERROR = 2;

module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    curly: ERROR,
    'brace-style': [WARN, '1tbs', { allowSingleLine: false }],
    'arrow-body-style': [ERROR, 'always'],
    '@typescript-eslint/no-unused-vars-experimental': ERROR,
    'no-unused-vars': OFF,
  },
};
