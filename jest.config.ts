import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/js-with-ts-esm', // Suporte a ESM + TS
  testEnvironment: 'node',                 // Node para backend / scripts
  extensionsToTreatAsEsm: ['.ts'],        // Arquivos TS serão tratados como ESM
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/test/**/*.ts', '**/?(*.)+(spec|test).ts'], // Onde os testes estão
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json',          // Aponta pro seu tsconfig
    },
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  verbose: true,
};

export default config;
