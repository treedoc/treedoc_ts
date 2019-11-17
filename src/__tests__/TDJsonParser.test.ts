import StringCharSource from '../StringCharSource';
import TDJSONParser from '../TDJSONParser';
import TDJSONParserOption from '../TDJSONParserOption';
import { TDNodeType } from '../TDNode';
import TDJSONWriter from '../TDJSONWriter';
import TDJSONWriterOption from '../TDJSONWriterOption';

test('testSkipSpaceAndComments', () => {
  let src = new StringCharSource('  //abcd \n // defghi \n abc');
  expect(TDJSONParser.skipSpaceAndComments(src)).toBeTruthy();
  expect(src.readString(3)).toBe('abc');

  src = new StringCharSource('  #abcd \n # defghi \n abc');
  expect(TDJSONParser.skipSpaceAndComments(src)).toBeTruthy();
  expect(src.readString(3)).toBe('abc');

  src = new StringCharSource('/* abcd*/ \n /* defghi*/ \n abc');
  expect(TDJSONParser.skipSpaceAndComments(src)).toBeTruthy();
  expect(src.readString(3)).toBe('abc');
});

test('testParse', () => {
  const testData = `
  // Some comments
  {
    "total": 100000000000000000000,
    "limit": 10,
    "valueWithoutKey",

    /* block comments */
    "data": [
      {
        "name": "Some Name 1",  // More line comments
        "address": {
          "streetLine": "1st st",
          city: "san jose",
        },
        "createdAt": "2017-07-14T17:17:33.010Z",
      },
      {
        "name": "Some Name 2",
        "address": /*comments*/ {
          "streetLine": "2nd st",
          city: "san jose",
        },
        "createdAt": "2017-07-14T17:17:33.010Z",
      },
      \`Multiple line literal
      Line2\`
    ],
    lastValueWithoutKey
  }`;
  const node = TDJSONParser.get().parse(new TDJSONParserOption(testData));
  const json = TDJSONWriter.get().writeAsString(node);

  console.log(`testParse:json=${json}`);

  expect(node.getChildValue('2')).toBe('valueWithoutKey');
  expect(node.getChildValue('4')).toBe('lastValueWithoutKey');
  expect(node.getChildValue('limit')).toBe(10);
  expect(node.getChildValue('total')).toBe(100000000000000000000);
  expect(node.getValueByPath('data/0/name')).toBe('Some Name 1');
  expect(node.getValueByPath('data/1/address/streetLine')).toBe('2nd st');

  const node1 = TDJSONParser.get().parse(new TDJSONParserOption(json));
  expect(TDJSONWriter.get().writeAsString(node1)).toBe(json);
});

test('testParseProto', () => {
  const testData = `
  n: {
    n1: {
      n11: 1
      # Duplicated key; ':' is emitted before '{'
      n11 {
        n111: false
      }
      n12: "2"
    }
    # Multi-line comments
    # Line2
    ########
    n1: {
      n11: "abcd"
      #  Extension keys
      [d.e.f]: 4
      n11: "multiline 1\n"
      'line2'
    }
    n2: [1,2,3]
    n2 [3,4,5]  # ':' is emitted before '['
    "n3" [6, 7, 8, 9]
  }`;

  let node = TDJSONParser.get().parse(new TDJSONParserOption(testData).setDefaultRootType(TDNodeType.MAP));
  const json = TDJSONWriter.get().writeAsString(
    node,
    new TDJSONWriterOption().setIndentFactor(2).setAlwaysQuoteName(false),
  );
  console.log(`testParseProto:json=${json}`);
  expect(node.getValueByPath('n/n1/0/n11/1/n111')).toBeFalsy();
  expect(node.getValueByPath('n/n1/1/[d.e.f]')).toBe(4);
  expect(node.getValueByPath('n/n3/0')).toBe(6);

  node = TDJSONParser.get().parse(new TDJSONParserOption("'a':1\nb:2").setDefaultRootType(TDNodeType.MAP));
  expect(node.getValueByPath('a')).toBe(1);
  expect(node.getValueByPath('b')).toBe(2);
});

test('testParseJson5', () => {
  const testData = `
  // https://spec.json5.org/
  {
    // comments
    unquoted: 'and you can quote me on that',
    singleQuotes: 'I can use "double quotes" here',
    lineBreaks: "Look, Mom! \
  No \\n's!",
    hexadecimal: 0xdecaf,
    leadingDecimalPoint: .8675309, andTrailing: 8675309.,
    positiveSign: +1,
    trailingComma: 'in objects', andIn: ['arrays',],
    "backwardsCompatible": "with JSON",
  }`;

  const node = TDJSONParser.get().parse(new TDJSONParserOption(testData));
  const json = TDJSONWriter.get().writeAsString(
    node,
    new TDJSONWriterOption().setIndentFactor(2).setAlwaysQuoteName(false),
  );
  console.log(`testParseJson5:json=${json}`);
  expect(node.getValueByPath('unquoted')).toBe('and you can quote me on that');
  expect(node.getValueByPath('hexadecimal')).toBe(912559);
  expect(node.getValueByPath('leadingDecimalPoint')).toBe(0.8675309);
  expect(node.getValueByPath('positiveSign')).toBe(1);
});

test('testRootArray', () => {
  const testData = `
  1
  2
  { v: 3 }
  4
  `;
  const node = TDJSONParser.get().parse(new TDJSONParserOption(testData).setDefaultRootType(TDNodeType.ARRAY));
  const json = TDJSONWriter.get().writeAsString(
    node,
    new TDJSONWriterOption().setIndentFactor(2).setAlwaysQuoteName(false),
  );
  console.log(`testParseJson5:json=${json}`);
  expect(node.getChildrenSize()).toBe(4);
  expect(node.getValueByPath('1')).toBe(2);
  expect(node.getValueByPath('2/v')).toBe(3);
});

test('testInvalid', () => {
  let node = TDJSONParser.get().parse(new TDJSONParserOption('}'));
  expect(node.value).toBe('');

  node = TDJSONParser.get().parse(new TDJSONParserOption(''));
  expect(node.value).toBeUndefined();
});
