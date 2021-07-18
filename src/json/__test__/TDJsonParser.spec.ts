import { StringCharSource } from '../../core/StringCharSource';
import { TDJSONParser } from '../../json/TDJSONParser';
import { TDJSONParserOption } from '../../json/TDJSONParserOption';
import { TDNodeType } from '../../TDNode';
import { TDJSONWriter } from '../../json/TDJSONWriter';
import { TDJSONWriterOption } from '../../json/TDJSONWriterOption';
import { JSONPointer } from '../../json/JSONPointer';
import { TDNode } from '../..';
import { TreeDoc_merge } from '../../TreeDoc';
import { TestData } from './TestData';

const testData = new TestData()

describe('TDJsonParser', () => {
  test('testSkipSpaceAndComments', () => {
    let src = new StringCharSource('  //abcd \n // defghi \n abc');
    expect(TDJSONParser.skipSpaceAndComments(src)).toBe('a');
    expect(src.readString(3)).toBe('abc');

    src = new StringCharSource('  #abcd \n # defghi \n abc');
    expect(TDJSONParser.skipSpaceAndComments(src)).toBe('a');
    expect(src.readString(3)).toBe('abc');

    src = new StringCharSource('/* abcd*/ \n /* defghi*/ \n abc');
    expect(TDJSONParser.skipSpaceAndComments(src)).toBe('a');
    expect(src.readString(3)).toBe('abc');
  });

  test('testParse', () => {
    const node = TDJSONParser.get().parse(testData.testData);
    const json = TDJSONWriter.get().writeAsString(node);

    console.log(`testParse:json=${json}`);

    expect(node.getChildValue('3')).toBe('valueWithoutKey');
    expect(node.getChildValue('6')).toBe('lastValueWithoutKey');
    expect(node.getChildValue('limit')).toBe(10);
    expect(node.getChildValue('total')).toBe('100000000000000000000');
    expect(node.getChildValue('maxSafeInt')).toBe(9007199254740991);
    expect(node.getValueByPath('data/0/name')).toBe('Some Name 1');
    expect(node.getValueByPath('data/1/address/streetLine')).toBe('2nd st');
    const n = node.getByPath('data/1');
    expect(node.getByPath('data/1')!.key).toBe('1');
    expect(node.getByPath(['data', '1'])!.key).toBe('1');

    expect(node.getChild('total')!.isLeaf()).toBeTruthy();
    expect(node.getChild('data')!.isLeaf()).toBeFalsy();
    expect(node.getByPath('data/1')!.path).toEqual(['data', '1']);

    const node1 = TDJSONParser.get().parse(json);
    expect(TDJSONWriter.get().writeAsString(node1)).toBe(json);
  });

  test('testParseProto', () => {
    const node = TDJSONParser.get().parse(testData.proto, new TDJSONParserOption().setDefaultRootType(TDNodeType.MAP));
    const json = TDJSONWriter.get().writeAsString(node,
      new TDJSONWriterOption().setIndentFactor(2).setAlwaysQuoteName(false),
    );
    console.log(`testParseProto:json=${json}`);
    expect(node.getValueByPath('n/n1/0/n11/1/n111')).toBeFalsy();
    expect(node.getValueByPath('n/n1/1/[d.e.f]')).toBe(4);
    expect(node.getValueByPath('n/n3/0')).toBe(6);
    expect(node.getByPath('n/n1/0')!.key).toBe('0');
    expect(node.getByPath('n/n1/1')!.key).toBe('1');
  });

  test('testParseJson5', () => {
    const node = TDJSONParser.get().parse(testData.JSON5);
    const json = TDJSONWriter.get().writeAsString(node,
      new TDJSONWriterOption().setIndentFactor(2).setAlwaysQuoteName(false),
    );
    console.log(`testParseJson5:json=${json}`);
    expect(node.getValueByPath('unquoted')).toBe('and you can quote me on that');
    expect(node.getValueByPath('hexadecimal')).toBe(912559);
    expect(node.getValueByPath('leadingDecimalPoint')).toBe(0.8675309);
    expect(node.getValueByPath('positiveSign')).toBe(1);
  });

  test('testRootMap', () => {
    const node = TDJSONParser.get().parse("'a':1\nb:2", new TDJSONParserOption().setDefaultRootType(TDNodeType.MAP));
    expect(node.getValueByPath('a')).toBe(1);
    expect(node.getValueByPath('b')).toBe(2);
  });

  test('testRootArray', () => {
    const testDataRootArray = `
    ,
    1
    2
    {
      v: 3
    },
    ,
    4,
    ,
    `;
    const node = TDJSONParser.get().parse(testDataRootArray, new TDJSONParserOption().setDefaultRootType(TDNodeType.ARRAY));
    const json = TDJSONWriter.get().writeAsString(node, new TDJSONWriterOption().setIndentFactor(2).setAlwaysQuoteName(false));
    console.log(`testParseJson5:json=${json}`);
    expect(node.getChildrenSize()).toBe(7);
    expect(node.getValueByPath('2')).toBe(2);
    expect(node.getValueByPath('3/v')).toBe(3);
  });

  test('testInvalid', () => {
    let node = TDJSONParser.get().parse('}');
    expect(node.value).toBe('}');

    node = TDJSONParser.get().parse('');
    expect(node.value).toBeNull();

    node = TDJSONParser.get().parse('[}]');
    expect(node.getChild(0)!.value).toBe('}');
  });

  test('testTDPath', () => {
    const jp = JSONPointer.get();
    const node = TDJSONParser.get().parse(testData.testData);
    const node1 = jp.query(node, '#1') as TDNode;
    expect(node1.getChildValue('name')).toBe('Some Name 1');
    // Relative with number support removed
    // expect(jp.query(node1, '2/limit')!.value).toBe(10);
    expect(node.value).toBeNull();
  });

  test('TDNode.toString', () => {
    const node = TDJSONParser.get().parse(testData.testData, new TDJSONParserOption().setDefaultRootType(TDNodeType.MAP));
    const str = node.toString();
    console.log('testToString:str=' + str);
    const str1 = node.toString();
    expect(str1).toBe(str);
    const city = node.getByPath('/data/0/address/city')! as TDNode;
    expect(city).not.toBeNull();
    city.setValue(city.value);
    const str2 = node.toString();
    // expect(str2).not.toBe(str);  // Javascript doesn't have real identity equality operator to verify it.
    expect(str2).toEqual(str);

    city.setValue('other city');
    node.freeze();
    const str3 = node.toString();
    console.log('testToString:str=' + str3);

    // toString should return different value when node value changed
    expect(str3).not.toEqual(str);

    expect(str3).toEqual("{total: '100000000000000000000', maxSafeInt: 9007199254740991, limit: 10, 3: 'valueWithoutKey', data: [{$id: '1', name: 'Some Name 1', address: {streetLine: '1st st', city: 'other city'}, createdAt: '2017-07-14T17:17:33.010Z', ip: '10.1.22.22'}, {$id: '2', name: 'Some Name 2', address: {streetLine: '2nd st', city: 'san jose'}, createdAt: '2017-07-14T17:17:33.010Z'}, 'Multiple line literal\\n    Line2'], objRef: {$ref: '1'}, 6: 'lastValueWithoutKey'}");

    const strWithoutRootKey = node.getChild("data")!.toStringInternal('', false, false, 100).toString();
    expect(strWithoutRootKey).toEqual("[{name: 'Some Name 1', address: {streetLine: '1st st', city: 'other city'}, createdAt: '2017-07-14T17...', ...}, ...]");

    const strWithoutRootKeyLimited = node.getChild("data")!.toStringInternal('', false, false, 10).toString();
    expect(strWithoutRootKeyLimited).toEqual("[{name: 'So...', ...}, ...]");
  });

  test('testStream', () => {
    const reader = new StringCharSource(testData.stream);
    const nodes: TDNode[] = [];
    while(reader.skipSpacesAndReturnsAndCommas())
      nodes.push(TDJSONParser.get().parse(reader));
    const node = TreeDoc_merge(nodes).root;
    console.log("testStream=" + node.toString());
    expect(node.getChild(1)?.key).toEqual("1");
    expect(node.getChild(1)?.getChild(0)?.doc).toBe(node.doc);
    expect(node.toString()).toMatchSnapshot();
  });

  test('testParseAll', () => {    
    let node = TDJSONParser.get().parseAll(testData.stream);
    console.log("testStream=" + node.toString());
    expect(node.toString()).toMatchSnapshot();

    const docFirstElement = node.doc.retain(node.children![0]);
    node = docFirstElement.root;
    console.log("testStream=" + node.toString());
    expect(node.key).toEqual("root");
    expect(node.toString()).toMatchSnapshot();
  });
});
