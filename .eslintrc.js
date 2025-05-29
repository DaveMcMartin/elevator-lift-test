module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  overrides: [],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "prettier"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "off",
    "react/jsx-filename-extension": [
      1,
      { extensions: [".js", ".jsx", ".tsx", ".ts"] },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "no-extra-semi": "off",
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
};
