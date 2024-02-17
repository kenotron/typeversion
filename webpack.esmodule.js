const { default: merge } = require("webpack-merge");
const { baseConfig } = require("./webpack.base");
module.exports = merge(baseConfig, {
  output: {
    filename: "typeversion.mjs",
    library: {
      type: "module",
    },
  },
  target: "async-node16",
  experiments: {
    outputModule: true,
  },
});
