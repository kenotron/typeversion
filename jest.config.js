/** @type import("jest").Config */
module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  rootDir: "./src/__tests__",
  testMatch: ["<rootDir>/**/*.test.ts"],
};
