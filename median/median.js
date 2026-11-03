function median(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("median() requires a non-empty array");
  }
  const a = [...arr].sort((x, y) => x - y); // numeric sort on a copy
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

module.exports = { median };
