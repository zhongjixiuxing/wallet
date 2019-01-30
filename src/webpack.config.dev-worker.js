const merge = require('webpack-merge');
const baseConfig = require('../webpack.config.worker');

module.exports = merge(baseConfig, {
  'mode': 'development',
  'watch': true
});