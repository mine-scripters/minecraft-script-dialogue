/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  },
  "overrides": [
    {
      files: [
        "**/*.test.ts"
      ],
      env: {
        jest: true
      },
      plugins: ["jest"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
};
