// learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').metroconfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
