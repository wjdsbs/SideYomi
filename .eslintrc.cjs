module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    webextensions: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.app.json', './tsconfig.node.json'],
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    // React 17+ JSX transform — import React 불필요
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    // .tsx 파일에서 JSX 허용
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    // default export 강제 해제 (named export 허용)
    'import/prefer-default-export': 'off',
    // TypeScript가 prop 타입 안전성을 보장하므로 불필요
    'react/require-default-props': 'off',
  },
  ignorePatterns: ['dist', 'node_modules', 'vite.config.ts'],
};
