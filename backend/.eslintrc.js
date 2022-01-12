module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"]
  },
  plugins: ["@typescript-eslint", "prettier", "import", "sonarjs"],
  extends: [
    "standard",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:sonarjs/recommended",
    "prettier",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
    "airbnb-typescript/base"
  ],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"]
    }
  },
  rules: {
    "linebreak-style": 0,
    "operator-linebreak": [2, "after", { "overrides": { "?": "before", ":": "before" } }],
    "function-paren-newline": 0,
    "no-confusing-arrow": 0,
    "implicit-arrow-linebreak": 0,
    "no-console": 0,
    "object-curly-newline": 0,
    "class-methods-use-this": 0,
    "import/no-extraneous-dependencies": 0,
    "import/no-named-as-default": 0,
    "import/order": 2,
    "import/default": 0,
    "sonarjs/no-small-switch": 0,
    "@typescript-eslint/no-empty-function": [2, { allow: ["private-constructors"] }],
    "@typescript-eslint/indent": 0,
	'no-param-reassign': ['error', { props: false }],
  },
  env: {
    "es2020": true,
    "node": true,
    "jest": true
  }
};
