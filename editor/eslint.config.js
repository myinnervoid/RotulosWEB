const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    // Aplicar a archivos del servidor (CommonJS)
    files: ['server.js', 'server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^e$' }],
      'no-console': 'off',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-duplicate-imports': 'error',
      // Los catch vacíos son intencionados para operaciones defensivas de filesystem
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    // Módulos ES6 del frontend
    files: ['public/modules/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Window & DOM
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        history: 'readonly',
        location: 'readonly',
        // Storage & Fetch
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        // Web APIs
        CustomEvent: 'readonly',
        Event: 'readonly',
        EventSource: 'readonly',
        Worker: 'readonly',
        crypto: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        DOMParser: 'readonly',
        FileReader: 'readonly',
        FormData: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        // Timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        // Dialogs (patrón legacy a reemplazar con <dialog>)
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        // Vendor
        grapesjs: 'readonly',
        // Node
        console: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      // Los catch vacíos son intencionados en código defensivo de browser
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    // Archivos de test (Vitest con jsdom)
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        // Node/jsdom globals inyectados por Vitest
        global: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^get' }],
      'no-console': 'off',
      'no-empty': 'off'
    }
  },
  {
    // Ignorar archivos generados y dependencias
    ignores: [
      'node_modules/**',
      'public/app.js',
      'public/app.min.js',
      'public/style.min.css',
      'public/vendor/**',
      'dist/**',
      'backups/**'
    ]
  }
];
