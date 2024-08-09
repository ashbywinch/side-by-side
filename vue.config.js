const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    config.module
      .rule('jsonl')
      .test(/\.jsonl$/)
      .type('javascript/auto')
      .use('jsonlines-loader')
        .loader('jsonlines-loader')
        .end()
    config.plugin('polyfills').use(NodePolyfillPlugin)
  }})
