if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return Array.from(this).reverse();
  };
}
console.log('Array.prototype.toReversed polyfilled successfully.');
