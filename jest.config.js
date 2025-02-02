const nextJest = require("next/jest");
const createJestConfig = nextJest({
  dir: "./",
});
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "vfile/do-not-use-conditional-minpath":
      "<rootDir>/node_modules/vfile/lib/minpath.browser.js",
    "vfile/do-not-use-conditional-minproc":
      "<rootDir>/node_modules/vfile/lib/minproc.browser.js",
    "vfile/do-not-use-conditional-minurl":
      "<rootDir>/node_modules/vfile/lib/minurl.browser.js",
    "^@/pages/(.*)$": "<rootDir>/pages/$1",
  },
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: ["node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)"],
};
module.exports = createJestConfig(customJestConfig);
