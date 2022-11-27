const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { build } = require('esbuild');
const { dependencies, peerDependencies } = require('./package.json');

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { Generator } = require('npm-dts');

const generator = new Generator({
  entry: 'src/index.ts',
  output: 'dist/index.d.ts',
});
generator.generate();

const watch = process.argv.length >= 3 && process.argv[2] === 'watch';

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  external: Object.keys(dependencies).concat(
    Object.keys(peerDependencies ?? {})
  ),
  watch: watch
    ? {
        onRebuild(error, result) {
          if (error) {
            console.error('watch build failed:', error);
          } else {
            exec('tsc --noEmit')
              .then(({ stdout }) => console.log(stdout))
              .catch((err) => console.error(err.stdout));
            generator.generate();
            console.error('watch build succeeded for server');
          }
        },
      }
    : false,
  plugins: [nodeExternalsPlugin()],
};

build({
  ...sharedConfig,
  platform: 'node', // for CJS
  outfile: 'dist/index.js',
}).catch(() => process.exit(1));

build({
  ...sharedConfig,
  outfile: 'dist/index.esm.js',
  platform: 'node', // for ESM
  format: 'esm',
}).catch(() => process.exit(1));
