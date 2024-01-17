/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverageFrom: ['<rootDir>/scripts/script_dialogue/MinecraftScriptDialogue/**'],
  coveragePathIgnorePatterns: ['index.ts'],
};
