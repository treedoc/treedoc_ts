import { StringUtil } from '../StringUtil';

test('testIsJavaIdentifier', () => {
  expect(StringUtil.isJavaIdentifier('Abcd')).toBeTruthy();
  expect(StringUtil.isJavaIdentifier('1Abcd')).toBeFalsy();
  expect(StringUtil.isJavaIdentifier('Ab+cd')).toBeFalsy();
});

test('testCEscape', () => {
  const org1 = 'a"\n\t\u0001';
  const dest = 'a\\"\\n\\t\\u0001';
  expect(StringUtil.cEscape(org1, '"')).toBe(dest);

  const org2 = "'test'";
  const des2 = "\\'test\\'";
  expect(StringUtil.cEscape(org2, "'")).toBe(des2);

  expect(StringUtil.cEscape(null, '"')).toBe(null);

  expect(StringUtil.cEscape('abc', '"')).toBe('abc');
});

test('testIndexOfAnyChar', () => {
  expect(StringUtil.indexOfAnyChar("1234", "234")).toBe(1);
  expect(StringUtil.indexOfAnyChar("1234", "567")).toBe(-1);
})

