const ts = require('rollup-plugin-ts');

module.exports = [
  {
    input: 'scripts/script_dialogue/MinecraftScriptDialogue/index.ts',
    external: ['@minecraft/server', '@minecraft/server-ui'],
    output: {
      file: 'dist/MinecraftScriptDialogue.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      ts({
        tsconfig: (resolvedOptions) => ({
          ...resolvedOptions,
        }),
      }),
    ],
  },
];
