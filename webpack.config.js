const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './index.js',
    devtool: 'inline-source-map',
    devServer: {
        static: [
            { directory: path.join(__dirname, 'static') },
            { directory: path.join(__dirname, 'dist') }
        ],
    },
    plugins: [
        new HtmlPlugin({
            title: 'Kaluma ❤️ Thumby',
            template: 'static/index.html',
        }),
        new CopyPlugin({
            patterns: [{ from: 'static', to: 'dist' }]
        }),
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
}
