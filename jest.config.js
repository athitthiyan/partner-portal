module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec).ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/', '<rootDir>/dist/', '<rootDir>/coverage/'],
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
};
