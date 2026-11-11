const nextJest = require("next/jest");
const createJestConfig = nextJest({
  dir: "./",
});
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/backup/",
    "<rootDir>/.next/",
    "<rootDir>/.claude/",
  ],
  // .claude/ holds agent worktrees: full copies of the repo whose
  // package.json would collide with this one in the module map.
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/.claude/"],
};
module.exports = createJestConfig(customJestConfig);
