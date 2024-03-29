import { StringCharSource } from '../../core/StringCharSource';
import { EOFRuntimeException } from '../../core/EOFRuntimeException';
import { StringBuilder}  from '../../core/StringBuilder';

test('testCharArraySource', () => {
  const cs = new StringCharSource('0123\n');
  expect(cs.read()).toBe('0');
  expect(cs.read()).toBe('1');
  expect(cs.peek()).toBe('2');
  expect(cs.peek(1)).toBe('3');
  expect(cs.read()).toBe('2');
  expect(cs.read()).toBe('3');
  expect(cs.getBookmark().toString()).toBe('Bookmark(line=0, col=4, pos=4)');
  expect(cs.read()).toBe('\n');
  expect(cs.getBookmark().toString()).toBe('Bookmark(line=1, col=0, pos=5)');
  expect(() => cs.read()).toThrow(new EOFRuntimeException());
});

test('testParseText', () => {
  const cs = new StringCharSource('  Text before /* some comments */ Text after');
  cs.skipSpacesAndReturns();
  expect(cs.getBookmark().pos).toBe(2);

  let target = new StringBuilder();

  // should match '/*'
  expect(cs.readUntilMatch(target, '/*', false, 0, 1000)).toBeTruthy();
  expect(target.toString()).toBe('Text before ');

  // should start with '/*'
  expect(cs.startsWith('/*')).toBeTruthy();

  cs.skip(2); // skip /*

  target = new StringBuilder();
  // should match with '*/'
  expect(cs.readUntilMatch(target, '*/', false)).toBeTruthy();

  expect(target.toString()).toBe(' some comments ');

  target = new StringBuilder();
  // should match with '*/'
  expect(cs.readUntilMatch(target, '*/', false)).toBeTruthy();
});

test('testReadQuotedString', () => {
  assertReadQuotedString(
    "'It\\'s a quoted \\\"string\\\" with escape \\n \\r \\f \\t \\v \\? \\u9829'",
    'It\'s a quoted "string" with escape \n \r \f \t \u000b ? \u9829',
  );
});

test('testReadQuotedStringWithOctEscape', () => {
  assertReadQuotedString("'\\040b'", ' b');
  assertReadQuotedString("'\\40b'", ' b');
  assertReadQuotedString("'\\401b'", ' 1b');
  assertReadQuotedString("'\\491b'", '\u000491b');
  assertReadQuotedString("'\\0220\\022'", '\u00120\u0012');
});

function assertReadQuotedString(source: string, expected: string) {
  const cs = new StringCharSource(source);
  const c = cs.read(); // skip first quote
  expect(cs.readQuotedString(c)).toBe(expected);
}

test('testReadQuotedStringError', () => {
  const cs = new StringCharSource("'Missing closing quote");
  const c = cs.read(); // skip first quote

  expect(() => cs.readQuotedString(c)).toThrow("Can't find matching quote at position:1");
});
