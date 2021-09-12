import { CSVParser } from './CSVParser';
import { CSVOption } from './CSVOption';
import { CSVWriter } from './CSVWriter';
import { StringCharSource } from '..';

const testCsv = `
field1,field2,field3,field4
v11,v12,v13,1
v21, "v2l1
V2l2" ,v23,true
"v31""v31","v32""""v32",v33,"3"
`;

describe('CSVParser and CSVWriter', () => {
  test('testParseAndWriter', () => {
    const node = CSVParser.get().parse(testCsv);
    expect(node.toString()).toMatchSnapshot();

    const opt = new CSVOption().setFieldSep('|');
    const str = CSVWriter.get().writeAsString(node, opt);
    expect(str).toMatchSnapshot();
    const node1 = CSVParser.get().parse(str, opt);
    expect(node1.toString()).toMatchSnapshot();
    expect(node1.toString()).toEqual(node.toString());
  });

  test('testReadField', () => {
    expect(CSVParser.get().readField(new StringCharSource("'ab''cd'"), new CSVOption().setQuoteChar('\''))).toBe("ab'cd");
  });

  test("testReadFieldMissingQuote", () => {
    let error = "";
    try {
      CSVParser.get().readField(new StringCharSource("'ab''cd"), new CSVOption().setQuoteChar('\''));
    } catch (e: any) {
      error = e.message;
    }
    expect(error).toBe("Can't find matching quote at position:4;line:0;col:4");
  })
});
