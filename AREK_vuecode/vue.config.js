const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? '/AREK/' : '/',
  devServer: {
    host: 'localhost',
    port: 3001,
    client: {
      overlay: false,
      webSocketURL: 'ws://localhost:3001/ws'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
});

