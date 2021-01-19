import CSVParser from './CSVParser';
import CSVOption from './CSVOption';
import CSVWriter from './CSVWriter';
import { StringCharSource } from '..';

const testCsv = `
field1,field2,field3
v11,v12,v13
v21, "v2l1
V2l2" ,v23
"v31""v31","v32""""v32",v33
`;

describe('CSVParser and CSVWriter', () => {
  
  //   @Test public void testReadField() {
  //     assertEquals("ab'cd", CSVParser.get().readField(new ArrayCharSource("'ab''cd'"),
  //         new CSVOption().setQuoteChar('\'')));
  //   }
  // }
  
  test('testParseAndWriter', () => {
    const node = CSVParser.get().parse(testCsv);
    expect(node.toString()).toBe("[['field1', 'field2', 'field3'], ['v11', 'v12', 'v13'], ['v21', 'v2l1\\nV2l2', 'v23'], ['v31\"v31', 'v32\"\"v32', 'v33']]");

    const opt = new CSVOption().setFieldSep('|');
    const str = CSVWriter.get().writeAsString(node, opt);
    expect(str).toMatchSnapshot();
    const node1 = CSVParser.get().parse(str, opt);
    expect(node1.toString()).toEqual(node.toString());
  });

  test('testReadField', () => {
    expect(CSVParser.get().readField(new StringCharSource("'ab''cd'"), new CSVOption().setQuoteChar('\''))).toBe("ab'cd");
  });
});
