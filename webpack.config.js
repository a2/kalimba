const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  name: "index",
  mode: "development",
  entry: "./src/index.js",
  target: "web",
  module: {
    rules: [
      {
        resourceQuery: /asset/,
        type: "asset/resource",
      },
      {
        resourceQuery: /build/,
        type: "asset/resource",
        use: {
          loader: "val-loader",
          options: {
            executableFile: path.resolve(__dirname, "tools", "build-loader.js"),
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./static/index.html",
    }),
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devtool: "source-map",
};
