module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier', // must be last — disables ESLint rules that conflict with Prettier
  ],
  rules: {
    // --- TypeScript ---
    '@typescript-eslint/explicit-function-return-type': 'off',        // inferred is fine
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',                    // use unknown instead
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',               // always await promises
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',              // no ! operator

    // --- General ---
    'no-console': ['warn', { allow: ['warn', 'error'] }],             // use logger instead
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-throw-literal': 'error',                                       // throw Error, not strings

    // --- Imports ---
    'no-duplicate-imports': 'error',
  },
  // ignoring specific lints for tests for simplification
  // context: lint for tests were added later after 471 tests already exists, so its not worth fixing these lints
  overrides: [
    {
      files: ['tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'jest.config.js', '*.js'],
};