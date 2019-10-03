import TDJSONParser from "../TDJSONParser";
import TDJSONParserOption from "../TDJSONParserOption";
  
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
  expect(JSON.stringify(obj)).toBe(JSON.stringify({
    a: 1,
    b: [1,2,3],
    c: "str",
  }));
});