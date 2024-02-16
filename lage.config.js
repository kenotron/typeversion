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
      outputs: ["dist/**"],
    },
    "webpack:cjs": {
      type: "npmScript",
      dependsOn: [],
      inputs: ["src/**/*"],
      outputs: ["dist/**"],
    },
    tsc: {
      type: "npmScript",
      dependsOn: [],
      inputs: ["src/**/*"],
      outputs: ["lib/**"],
    },
  },
  cacheOptions: {
    environmentGlob: ["*.js", "*.json"],
    outputGlob: ["dist/**", "lib/**"],
  },
};
