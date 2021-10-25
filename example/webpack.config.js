const path = require('path')

module.exports = {
    entry: './game.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js'
    },
    mode: 'none',
    externals: {
        'i2c': 'commonjs i2c',
        'graphics': 'commonjs graphics'
    }
}