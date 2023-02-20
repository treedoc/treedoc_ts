import { CSVParser } from './CSVParser';
import { CSVOption } from './CSVOption';
import { CSVWriter } from './CSVWriter';
import { StringCharSource, TDJSONParser } from '..';

const testCsv = `
field1,field2,field3,field4
v11,v12,v13,1
v21, "v2l1
V2l2" ,v23,true
"v31""v31","v32""""v32",v33,"3"
`;

const testObj = `
@key,field1,field2
k1,v11,v12
k2,v21,v22
`

describe('CSVParser and CSVWriter', () => {
  function testParseAndWrite(opt: CSVOption, csv: string) {
    const node = CSVParser.get().parse(csv, opt);
    expect(node.toString()).toMatchSnapshot();
    const str = CSVWriter.get().writeAsString(node, opt.setFieldSep('|'));
    expect(str).toMatchSnapshot();
    const node1 = CSVParser.get().parse(str, opt);
    expect(node1.toString()).toBe(node.toString());
  }

  test('ParseAndWriteWithoutHeader', () => testParseAndWrite(new CSVOption().setIncludeHeader(false), testCsv));
  test('ParseAndWriteWithHeader', () => testParseAndWrite(new CSVOption(), testCsv));
  test('ParseAndWriteObj', () => testParseAndWrite(new CSVOption(), testObj));

  test('JSONValue', () => {
    const json = "[{f1: v1, f2: {a: 1}}]";
    expect(CSVWriter.get().writeAsString(TDJSONParser.get().parse(json))).toMatchSnapshot();
  });

  test('testReadField', () => {
    expect(CSVParser.get().readField(new StringCharSource("'ab''cd'"), new CSVOption().setQuoteChar("'"))).toBe(
      "ab'cd",
    );
  });

  test('testReadFieldMissingQuote', () => {
    let error = '';
    try {
      CSVParser.get().readField(new StringCharSource("'ab''cd"), new CSVOption().setQuoteChar("'"));
    } catch (e: any) {
      error = e.message;
    }
    expect(error).toMatchInlineSnapshot(
      `"Can't find matching quote at position:5;line:0;col:5, Bookmark(line=0, col=7, pos=7), digest:"`,
    );
  });
});
