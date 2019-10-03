import StringCharSource from '../StringCharSource';
import EOFRuntimeException from '../EOFRuntimeException';
import StringBuilder from '../StringBuilder';


test('testCharArraySource', () => {
  const cs = new StringCharSource("0123\n");
  expect(cs.read()).toBe('0');
  expect(cs.read()).toBe('1');
  expect(cs.peek()).toBe('2');
  expect(cs.peek(1)).toBe('3');
  expect(cs.read()).toBe('2');
  expect(cs.read()).toBe('3');
  expect(cs.getBookmark().toString()).toBe("Bookmark(line=0, col=4, pos=4)");
  expect(cs.read()).toBe('\n');
  expect(cs.getBookmark().toString()).toBe("Bookmark(line=1, col=0, pos=5)");
  expect(() => cs.read()).toThrow(EOFRuntimeException);
});

test('testParseText', () => {
  const cs = new StringCharSource("  Text before /* some comments */ Text after");
  cs.skipSpaces();
  expect(cs.getPos()).toBe(2);

  let target = new StringBuilder();
  
  // should match '/*'
  expect(cs.readUntilMatch("/*", false, target, 0, 1000)).toBeTruthy();
  expect(target.toString()).toBe("Text before ");

  // should start with '/*'
  expect(cs.startsWidth("/*")).toBeTruthy();

  cs.skip(2);  // skip /*

  target = new StringBuilder();
  // should match with '*/'
  expect(cs.readUntilMatch("*/", false, target)).toBeTruthy();

  expect(target.toString()).toBe(" some comments ");

  target = new StringBuilder();
  // should match with '*/'
  expect(cs.readUntilMatch("*/", false, target)).toBeTruthy();
});

test('testParseText', () => {
  const cs = new StringCharSource("'It\\'s a quoted \\\"string\\\" with escape \\n \\r \\f \\t \\u9829'");
  const c = cs.read();  // skip first quote
  expect(cs.readQuotedString(c)).toBe("It's a quoted \"string\" with escape \n \r \f \t \u9829");
});

test('testReadQuotedStringError', () => {
  let cs = new StringCharSource("'Missing closing quote");
  let c = cs.read();  // skip first quote
  
  expect(() => cs.readQuotedString(c)).toThrow("Can't find matching quote at position:1");

  cs = new StringCharSource("`Invalid escape \\p abcdefg`");
  c = cs.read();  // skip first quote
  expect(() => cs.readQuotedString(c)).toThrowError("Invalid escape sequence:p, Bookmark(line=0, col=18, pos=18), digest: abcd");
});

