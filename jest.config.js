const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  automock: false,
  setupFiles: [path.resolve(__dirname, 'tests/setup.ts')],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^tests/(.*)$': '<rootDir>/tests/$1',
  },
  testPathIgnorePatterns: ['dist'],
};
