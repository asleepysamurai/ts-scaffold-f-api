/**
 * Test test to test if the test tests
 * Delete this in forks
 */

const sum = (a: number, b: number): number => {
  return a + b;
};

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
