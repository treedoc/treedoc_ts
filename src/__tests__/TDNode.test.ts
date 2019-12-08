import TDJSONParser from '../json/TDJSONParser';
import TDJSONParserOption from '../json/TDJSONParserOption';

test('testToObject', () => {
  const testData = `
    {
      "a": 1
      "b": [1,2,3]
      "c": "str"
    }
`;
  const node = TDJSONParser.get().parse(new TDJSONParserOption(testData));
  const obj = node.toObject();
  expect(JSON.stringify(obj.b.$)).toBe(JSON.stringify({
    start: {
      line: 3,
      col: 11,
      pos: 31,
    },
    end: {
      line: 3,
      col: 18,
      pos: 38,
    },
  }));
  expect(JSON.stringify(obj)).toBe(
    JSON.stringify({
      $: {
        start: {
          line: 1,
          col: 4,
          pos: 5,
        },
        end: {
          line: 5,
          col: 5,
          pos: 61,
        },
      },
      a: 1,
      b: [1, 2, 3],
      c: 'str',
    }),
  );
});
