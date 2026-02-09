// Polyfill for Node versions < 20 (e.g. Node 18)
console.log('Injecting Array.prototype.toReversed polyfill...');
if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function() {
      return Array.from(this).reverse();
    },
    writable: true,
    configurable: true,
  });
}
console.log('Polyfill injected.');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
