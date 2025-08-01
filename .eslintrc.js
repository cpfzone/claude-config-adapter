module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'space-before-function-paren': ['error', 'never']
  }
}