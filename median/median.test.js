const { median } = require("./median");

describe("median", () => {
  test("single element returns that element", () => {
    expect(median([5])).toBe(5);
  });

  test("odd length returns the middle value", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  test("even length returns the mean of the two middle values", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([4, 1])).toBe(2.5);
  });

  test("sorts numerically, not lexicographically", () => {
    // default sort() would give [10, 2, 9] and pick 2
    expect(median([10, 9, 2])).toBe(9);
    expect(median([100, 25, 3, 1000])).toBe(62.5);
  });

  test("handles negative numbers", () => {
    expect(median([-5, -1, -3])).toBe(-3);
    expect(median([-2, 2])).toBe(0);
  });

  test("handles decimals", () => {
    expect(median([0.5, 1.5, 0.1])).toBe(0.5);
  });

  test("handles duplicates", () => {
    expect(median([7, 7, 7, 7])).toBe(7);
    expect(median([1, 2, 2, 9])).toBe(2);
  });

  test("already-sorted and reverse-sorted input give the same result", () => {
    expect(median([1, 2, 3, 4, 5])).toBe(3);
    expect(median([5, 4, 3, 2, 1])).toBe(3);
  });

  test("does not mutate the input array", () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });

  test("throws on empty array", () => {
    expect(() => median([])).toThrow(/non-empty array/);
  });

  test.each([undefined, null, 5, "123", { length: 1 }])(
    "throws on non-array input: %p",
    (bad) => {
      expect(() => median(bad)).toThrow(/non-empty array/);
    }
  );
});
