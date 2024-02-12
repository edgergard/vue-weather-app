module.exports = {
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "plugin:vue/vue3-recommended", "prettier"],
  "parser": "vue-eslint-parser",
  "parserOptions": { 
    "parser": "@typescript-eslint/parser" 
  },
  plugins: ['@typescript-eslint'],
  rules: {},
};
