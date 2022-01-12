module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ["@typescript-eslint", "react", "prettier", "import", "sonarjs"],
  extends: [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:sonarjs/recommended",
    "prettier",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
    "prettier/react",
    "airbnb-typescript",
    "airbnb/hooks"
  ],
  settings: {
    react: {
      version: "detect"
    },
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      node: {
        extensions: ["js", "jsx"]
      },
      typescript: {
        alwaysTryTypes: true
      }
    },
    "import/extensions": [
      ".js",
      ".jsx"
    ]
  },
  rules: {
    "react/jsx-filename-extension": [2, { extensions: [".js", ".jsx", ".ts", ".tsx"] }],
    "import/no-extraneous-dependencies": 0,
    "import/no-named-as-default": 0,
    "import/order": 2,
    "import/default": 0,
    "sonarjs/no-small-switch": 0,
    "@typescript-eslint/no-empty-function": [2, { allow: ["private-constructors"] }],
    "linebreak-style": 0,
    "react/jsx-one-expression-per-line": 0,
    "react/jsx-props-no-spreading": 0,
    "react/require-default-props": [2, { ignoreFunctionalComponents: true }],
    "operator-linebreak": [2, "after", { "overrides": { "?": "before", ":": "before" } }],
    "function-paren-newline": 0,
    "no-confusing-arrow": 0,
    "implicit-arrow-linebreak": 0,
    "@typescript-eslint/indent": 0
  },
  env: {
    "browser": true,
    "jest": true,
    "node": true
  },
  globals: {
    "JSX": true
  }
};
