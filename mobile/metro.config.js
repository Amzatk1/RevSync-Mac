// Polyfill for Node versions < 20 (e.g. Node 18)
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return Array.from(this).reverse();
  };
}

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
