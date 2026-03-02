module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended', // Must be last to override other configs
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh', 'simple-import-sort'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        'react/react-in-jsx-scope': 'off', // Not needed in React 17+
        'no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: '@tripavail/shared/core/client',
                        message:
                            'Import Supabase via @/lib/supabase to ensure a single client module boundary in the web app.',
                    },
                ],
                patterns: [
                    {
                        group: [
                            '../../**/shared/src/core/client',
                            '../../**/shared/src/core/client.*',
                            '../**/shared/src/core/client',
                            '../**/shared/src/core/client.*',
                        ],
                        message:
                            'Do not import from shared/src (creates a second module instance). Use @/lib/supabase instead.',
                    },
                ],
            },
        ],
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        'react/prop-types': 'off',
    },
    overrides: [
        {
            files: ['src/components/ui/**/*.tsx'],
            rules: {
                'react-refresh/only-export-components': 'off',
            },
        },
        {
            files: ['src/lib/supabase.ts'],
            rules: {
                'no-restricted-imports': 'off',
            },
        },
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
}
