/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json',
    },
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  // Root directory for test files
  roots: ["<rootDir>/test"],

  // Glob patterns for test files
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Collect code coverage information
  collectCoverage: true,

  // Output directory for coverage reports
  coverageDirectory: "coverage",

  // Coverage report formats
  coverageReporters: ["text", "lcov", "json-summary"],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
};
