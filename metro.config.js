// learn more https://docs.expo.io/guides/customizing-metro
const { getdefaultconfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').metroconfig} */
const config = getdefaultconfig(__dirname);

module.exports = config;
