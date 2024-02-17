const { default: merge } = require("webpack-merge");
const { baseConfig } = require("./webpack.base");

module.exports = merge(baseConfig, {
  output: {
    filename: "typeversion.cjs",
    library: {
      type: "commonjs",
    },
  },
  target: "node16",
});
