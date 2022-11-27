const esbuild = require('esbuild');

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { Generator } = require('npm-dts');

const generator = new Generator({
  entry: 'index.js',
  output: 'index.d.ts',
  root: 'lib',
});
generator.generate();

const watch = process.argv.length >= 3 && process.argv[2] === 'watch';

esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    outfile: 'lib/index.js',
    bundle: true,
    minify: true,
    platform: 'node',
    sourcemap: true,
    target: 'node14',
    watch: watch
      ? {
          onRebuild(error, result) {
            if (error) {
              console.error('watch build failed:', error);
            } else {
              generator.generate();
            }
          },
        }
      : false,
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
