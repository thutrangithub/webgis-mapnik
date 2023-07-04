const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./client/map.js",
  output: {
    filename: "map-bundle.js",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./client/map.html",
      filename: "map.html"
    }),
  ],
  devServer: {
    port: 8080,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
