const path = require("path");

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "typeversion.js",
    libraryTarget: "commonjs2",
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  dynamicImport: true,
                },
              },
            },
          },
        ],
      },
    ],
  },
  target: "node",
  resolve: {
    extensions: [".ts", ".js"],
  },
};
