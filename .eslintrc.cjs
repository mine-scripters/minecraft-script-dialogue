/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
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
      extends: ['plugin:jest/recommended', 'prettier'],
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
