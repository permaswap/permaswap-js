module.exports = {
  presets: [
    ['@babel/env', { targets: { node: 'current' } }],
    ['@babel/typescript']
  ],
  plugins: ['@babel/plugin-transform-modules-commonjs']
}
