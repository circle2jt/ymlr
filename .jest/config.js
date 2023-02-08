/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['src'],
  testTimeout: 60000,
  testRegex: '\\.spec\\.[jt]sx?$',
  rootDir: '..',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: ['<rootDir>/.jest/env.js']
}
