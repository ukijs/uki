import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/main.js',
  dest: 'build/uki.umd.js',
  format: 'umd',
  moduleName: 'uki',
  sourceMap: 'inline',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
