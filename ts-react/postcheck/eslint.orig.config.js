import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import promise from 'eslint-plugin-promise'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sonarjs from 'eslint-plugin-sonarjs'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  sonarjs.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  promise.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser }
    },
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: true, node: true }
    },
    rules: {
      // complexity and size
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/cyclomatic-complexity': ['error', { threshold: 10 }],
      'sonarjs/expression-complexity': ['error', { max: 5 }],
      'sonarjs/max-lines': ['error', { maximum: 600 }],
      'sonarjs/max-lines-per-function': ['error', { maximum: 200 }],
      'sonarjs/nested-control-flow': ['error', { maximumNestingLevel: 4 }],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/max-union-size': ['error', { threshold: 4 }],
      'sonarjs/prefer-read-only-props': 'error',
      'sonarjs/elseif-without-else': 'error',
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/no-unused-vars': 'off',
      'max-params': ['error', 4],
      'no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 2, 10, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          enforceConst: false,
          detectObjects: false
        }
      ],
      'no-else-return': ['error', { allowElseIf: false }],
      curly: ['error', 'all'],
      eqeqeq: 'error',
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      // typescript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } }
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // react
      'react/prop-types': 'off',
      'react/no-unstable-nested-components': 'error',
      'react/no-multi-comp': ['error', { ignoreStateless: false }],
      'react/jsx-no-leaked-render': 'error',
      'react/function-component-definition': [
        'error',
        { namedComponents: 'function-declaration', unnamedComponents: 'function-expression' }
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      // a11y: the interaction rules the house disables
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/mouse-events-have-key-events': 'off',
      // imports
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      'import/order': 'off',
      'import/no-duplicates': 'error',
      'import/no-mutable-exports': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      // promises
      'promise/prefer-await-to-then': 'error',
      'promise/catch-or-return': 'error'
    }
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test-utils/**'],
    rules: {
      'no-magic-numbers': 'off',
      'max-params': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-hardcoded-ip': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react/no-multi-comp': 'off'
    }
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    rules: { ...tseslint.configs.disableTypeChecked.rules, 'import/no-unresolved': 'off' }
  },
  prettier
)
