module.exports = {
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.vue', '.ts', '.d.ts'],
            },
            alias: {
                extensions: ['.vue', '.js', '.ts', '.scss', '.d.ts'],
                map: [
                    ['@/components', './src/components'],
                    ['@/pages', './src/pages'],
                    ['@/router', './src/router'],
                    ['@/stores', './src/stores'],
                    ['@/styles', './src/styles'],
                    ['@/types', './src/types'],
                    ['@/utils', './src/utils'],
                ],
            },
        },
    },
};
