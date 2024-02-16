/** @type {import('lage').ConfigOptions} */
module.exports = {
  pipeline: {
    build: {
      type: "noop",
      dependsOn: ["tsc", "webpack"],
      inputs: [],
    },
    webpack: {
      type: "npmScript",
      dependsOn: [],
      inputs: ["src/**/*"]
    },
    tsc: {
      type: "npmScript",
      dependsOn: [],
      inputs: ["src/**/*"]
    },
  },
  cacheOptions: {

  },
};
