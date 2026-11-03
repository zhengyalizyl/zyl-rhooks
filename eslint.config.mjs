import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import globals from 'globals';
import importSort from 'eslint-plugin-simple-import-sort'
import prettier from 'eslint-plugin-prettier'

// export default [{
//   files:["/**/*/.{js,jsx,ts,tsx}"],
//   rules:{
//     "no-console":"error"
//   }
// }]

export default tseslint.config({
  extends:[js.configs.recommended,...tseslint.configs.recommended],
  files: ["**/*.{js,jsx,ts,tsx}"],
  rules: {
    "no-console": "error",
    "simple-import-sort/imports":'error',
    "simple-import-sort/exports":'error',
    "prettier/prettier":'error'
  },
  languageOptions: {
    parser:tseslint.parser,
    globals:{
      ...globals.browser,
      ...globals.node
    },
  },
  plugins:{
    "simple-import-sort":importSort,
    "prettier":prettier
  }
})
