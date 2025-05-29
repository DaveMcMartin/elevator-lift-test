module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "expo-localization": "<rootDir>/__mocks__/expo-localization.ts",
    "\\.svg$": "<rootDir>/__mocks__/svgMock.js",
  },
};
