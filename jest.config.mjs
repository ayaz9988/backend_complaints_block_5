export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["./src/tests"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  testTimeout: 10000,
  verbose: true,
};
