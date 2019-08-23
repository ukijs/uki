import babel from 'rollup-plugin-babel';
import pkg from './package.json';

// Derive some of the configuration from package.json
const peerDependencies = Object.keys(pkg.peerDependencies);
const allExternals = peerDependencies.concat(
  Object.keys(pkg.dependencies || {})).concat(
  Object.keys(pkg.devDependencies || {}));
const commonPlugins = [
  babel({ exclude: ['node_modules/**'] }) // let us use fancy new things like async in our code
];

// Basic build formats, without minification
export default [
  // ES Module
  {
    input: 'src/module.js',
    output: {
      file: pkg.module,
      format: 'es'
    },
    external: allExternals,
    plugins: commonPlugins
  },
  {
    input: 'src/module.js',
    output: {
      file: pkg.main,
      format: 'cjs'
    },
    external: allExternals,
    plugins: commonPlugins
  }
];
