import { TD } from '..';
import TDJSONParser from '../json/TDJSONParser';

describe('TDNode', () => {
  const testData = `
  {
    "a": 1
    "b": [1,2,3]
    "c": "str"
  }
  `;

  const testJson = TD.parse(testData);

  test('testToObject', () => {
    const node = TDJSONParser.get().parse(testData);
    const obj = node.toObject(true);
    expect(TD.stringify(obj.b.$, {jsonOption: {quoteChar: "'"}})).toMatchSnapshot();
    expect(TD.stringify(obj, {jsonOption: {quoteChar: "'"}})).toMatchSnapshot();   
  }),

  test('testToProxy', () => {
    const node = TDJSONParser.get().parse(testData);
    const proxy = node.toProxy();
    expect(proxy.length).toBe(3);
    expect(proxy.a).toBe(1);
    expect(proxy.b.length).toBe(testJson.b.length);
    expect(proxy.b[2]).toBe(3);
    expect(proxy.c).toBe("str");
    // expect(Object.keys(proxy.b)).toBe(["@target"]);
    expect(TD.stringify(proxy, {jsonOption: {quoteChar: "'"}})).toMatchSnapshot();
  });
});