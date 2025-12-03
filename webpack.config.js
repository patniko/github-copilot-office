const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const fs = require("fs");
const os = require("os");

module.exports = {
  mode: "development",
  entry: {
    taskpane: "./src/taskpane/taskpane.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/taskpane/taskpane.html",
      filename: "taskpane.html",
      chunks: ["taskpane"],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    server: {
      type: "https",
      options: {
        key: fs.readFileSync(path.join(os.homedir(), ".office-addin-dev-certs", "localhost.key")),
        cert: fs.readFileSync(path.join(os.homedir(), ".office-addin-dev-certs", "localhost.crt")),
      },
    },
    port: 3000,
    hot: true,
    liveReload: true,
  },
  devtool: "source-map",
};
