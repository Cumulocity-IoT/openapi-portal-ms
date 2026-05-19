import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import jsdocPlugin from 'eslint-plugin-jsdoc';

export default [
  {
    ignores: ['dist/', 'node_modules/', '.tmp/'],
  },
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': ['error', { printWidth: 300, singleQuote: false, trailingComma: 'all' }],
    },
  },
  {
    files: ['src/api/**/*.ts'],
    plugins: {
      jsdoc: jsdocPlugin,
    },
    rules: {
      'jsdoc/match-description': [
        'error',
        {
          // Regexp explanation:
          // ^[^`*#~[\]]*$
          // Disallows: ` (backticks), * (bold/italic), # (headers), ~ (strikethrough), [ ] (links)
          // Allows: _ (underscore — common in identifiers like action_type; does not render as markdown in isolation)
          mainDescription: '^[^`*#~\\[\\]]*$',
          message: 'JSDoc description contains Markdown. Please use plain text for NestJS Swagger compatibility.',
        },
      ],
      'jsdoc/multiline-blocks': 'error',
      'jsdoc/no-multi-asterisks': 'error',
      'jsdoc/require-description': 'error',
    },
  },
  prettierConfig,
];
