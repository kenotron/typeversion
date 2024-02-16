/** @type {import('lage').ConfigOptions} */
module.exports = {
  pipeline: {
    build: {
      type: "noop",
      dependsOn: ["tsc", "webpack"],
      inputs: [],
      outputs: [],
      cache: false,
    },
    webpack: {
      type: "noop",
      dependsOn: ["webpack:esm", "webpack:cjs"],
      inputs: [],
      outputs: [],
      cache: false,
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
