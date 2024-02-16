/** @type {import('lage').ConfigOptions} */
module.exports = {
  pipeline: {
    build: {
      type: "noop",
      dependsOn: ["tsc", "webpack"],
      inputs: [],
    },
    "webpack": {
      type: "noop",
      dependsOn: ["webpack:esm", "webpack:cjs"],
      inputs: [],
    },
    "webpack:esm": {
      type: "npmScript",
      dependsOn: [],
      inputs: ["src/**/*"],
    },
    "webpack:cjs": {
      type: "npmScript",
      dependsOn: [],
      inputs: ["src/**/*"],
    },
    tsc: {
      type: "npmScript",
      dependsOn: [],
      inputs: ["src/**/*"],
    },
  },
  cacheOptions: {
    environmentGlob: ["*.js", "*.json"],
    outputGlob: ["dist/**", "lib/**"],
  },
};
