module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary"],
  coverageProvider: "v8",
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "^(.+)/version\\.js$": "$1/version.ts",
    "^(.+)/utils\\.js$": "$1/utils.ts",
    "^(.+)/auth\\.js$": "$1/auth.ts",
  },
};
