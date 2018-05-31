module.exports = {
    "plugins": [
        "mocha"
    ],
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "airbnb-base",
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        },
        "ecmaVersion": 2017,
        "sourceType": "script"
    },
    "rules": {   
        //-------------------------------------//
        //-- Modifications to airbnb's rules --//
        //-------------------------------------//
        "arrow-parens": ["error", "as-needed", { "requireForBlockBody": false }],
        "comma-dangle": ["error", "never"],    // how about no
        "complexity": ["error", 10],   // KISS
        "dot-notation": [
            "error",
            {
                "allowKeywords": true,
                "allowPattern": "[^\\w\\d_]"    // I think it looks neater/safer like for non alpha numerics
            }
        ],
        "function-paren-newline": "off",  // This rule doesn't always work how you might expect
        "indent": [
            "error",
            4,
            { SwitchCase: 1 }
        ],
        "linebreak-style": [ "error", require('os').EOL === '\r\n'? 'windows': 'unix'], // I want to enforce unix if running on Linux build server, but handle deving on local windows machine.
        "max-len": "off",     // we have a lot of long lines that can't be broken neatly. 
        "no-console": "error",  // There shouldn't be a need for console. We have a Logger
        "no-multi-spaces": ["error", { "ignoreEOLComments": true }],  // allow spacing before EOL comments
        "no-param-reassign": "warn",    // I do this a fair amount for strings and numbers, which are passed by value, not by reference
        "no-plusplus": "off", // only an issue if you're not using semi colons
        "no-underscore-dangle": "off",  // we make use of _id and _key from Arango. Also, this rule is purely stylistic
        "no-warning-comments": "warn", // This makes tracking slightly easier :D
        "quotes": [
            "error",
            "single",
            {
                "avoidEscape": true
            }
        ],
        "strict": ["warn", "safe"],    // unlike airbnb, we're not using babel, so we need strictmode
        //----------------------//
        //-- Additional Rules --//
        //----------------------//
        "valid-jsdoc": 2,
        "require-jsdoc": [
            2,
            {
                "require": {
                    "FunctionDeclaration": true,
                    "MethodDefinition": true,
                    "ClassDeclaration": true
                }
            }
        ],
        "mocha/no-exclusive-tests": "error"
    }
};
