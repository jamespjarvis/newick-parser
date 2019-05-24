const path = require('path');

module.exports = {
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'Tree',
    libraryTarget: 'window',
    libraryExport: 'default'
  }
}