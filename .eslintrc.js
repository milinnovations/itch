module.exports = {
    // Specifies the ESLint parser
    parser: "@typescript-eslint/parser",

    extends: [
        // Uses the recommended rules from @eslint-plugin-react
        "plugin:react/recommended",

        // Uses the recommended rules from @typescript-eslint/eslint-plugin
        "plugin:@typescript-eslint/recommended",

        // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        "prettier/@typescript-eslint",

        // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
        "plugin:prettier/recommended",

        // Checks rules of Hooks
        "plugin:react-hooks/recommended",
    ],
    parserOptions: {
        // Allows for the parsing of modern ECMAScript features
        ecmaVersion: 2018,

        // Allows for the use of imports
        sourceType: "module",

        // Allows for the parsing of JSX
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",

        // We have a lot of functions without explicit return type.
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",

        // some naming convention
        "@typescript-eslint/naming-convention": [
            "error",
            { selector: "interface", format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: true } },
            { selector: "variable", format: ["camelCase", "PascalCase", "UPPER_CASE"], leadingUnderscore: "allow" },
            { selector: "parameter", format: ["camelCase", "PascalCase"], leadingUnderscore: "allow" },
            { selector: "memberLike", modifiers: ["private"], format: ["camelCase"], leadingUnderscore: "require" },
            { selector: "typeLike", format: ["PascalCase"] },
        ],

        // Always require === and !== instead of == and !=
        eqeqeq: ["error", "always"],

        // Variables whose names begin with an underscore allow to be unused
        "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

        "react/display-name": ["off"],
        // I see no reason to check prop types when we already use Typescript, and it has some false positives
        "react/prop-types": ["off"],
    },
    settings: {
        react: {
            // Tells eslint-plugin-react to automatically detect the version of React to use
            version: "detect",
        },
    },
};
