// polyfill.js
if (!Array.prototype.toReversed) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function() {
      return Array.from(this).reverse();
    },
    writable: true,
    configurable: true,
  });
}
if (!Array.prototype.toSorted) {
    Object.defineProperty(Array.prototype, 'toSorted', {
      value: function(compareFn) {
        return Array.from(this).sort(compareFn);
      },
      writable: true,
      configurable: true,
    });
}
if (!Array.prototype.with) {
    Object.defineProperty(Array.prototype, 'with', {
      value: function(index, value) {
        const copy = Array.from(this);
        copy[index] = value;
        return copy;
      },
      writable: true,
      configurable: true,
    });
}
console.log('Polyfills injected for Node < 20');
