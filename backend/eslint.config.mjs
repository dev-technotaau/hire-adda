import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import pluginPromise from 'eslint-plugin-promise';
import pluginN from 'eslint-plugin-n';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    pluginPromise.configs['flat/recommended'],
    pluginN.configs['flat/recommended'],
    prettierConfig,
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'logs/**'],
    },
    {
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        rules: {
            // TypeScript
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-misused-promises': 'off',

            // Security
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',

            // Best practices
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
            'no-return-await': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always'],
            curly: ['warn', 'multi-line'],

            // Node
            'n/no-process-exit': 'off',
            'n/no-missing-import': 'off',
            'n/no-unsupported-features/es-syntax': 'off',
            'n/no-unpublished-import': 'off',
        },
    }
);
