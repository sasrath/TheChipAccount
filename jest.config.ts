import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          moduleResolution: "node",
          esModuleInterop: true,
        },
      },
    ],
  },
  // Suppress Next.js-specific module noise
  transformIgnorePatterns: ["/node_modules/(?!(next)/)"],
  // Write JSON results to tests/results/
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "tests/results",
        outputName: "junit.xml",
      },
    ],
  ],
};

export default config;
