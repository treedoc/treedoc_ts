import { TD } from '..';
import { TDJSONParser } from '../json/TDJSONParser';

describe('TDNode', () => {
  const testData = `
  {
    "a": 1
    "b": [1,2,3]
    "c": "str",
    "validRef": {$ref: /a},
    "invalidRef": {$ref: abc}
  }
  `;

  const testData1 = `
  {
    "log": {
      "version": "1.2",
      "creator": {
        "name": "WebInspector",
        "version": "537.36"
      }
    }
  }`;

  const testJson = TD.parse(testData);

  test('testToObject', () => {
    const node = TDJSONParser.get().parse(testData);
    const obj = node.toObject(true);
    expect(TD.stringify(obj, { jsonOption: { quoteChar: "'" } })).toMatchSnapshot();
  }),
    test('testToProxy', () => {
      const node = TDJSONParser.get().parse(testData);
      const proxy = node.toProxy() as any;
      expect(proxy.length).toBe(5);
      expect(proxy.a).toBe(1);
      expect(proxy.b.length).toBe(testJson.b.length);
      expect(proxy.b[2]).toBe(3);
      expect(proxy.c).toBe('str');
      expect(proxy.toString()).toMatchInlineSnapshot(
        `"{a: 1, b: [1, 2, 3], c: 'str', validRef: {$ref: '/a'}, invalidRef: {$ref: 'abc'}}"`,
      );

      // expect(Object.keys(proxy.b)).toBe(["@target"]);
      expect(TD.stringify(proxy, { jsonOption: { quoteChar: "'" } })).toMatchSnapshot();
    });

  test('testToProxy1', () => {
    const node = TDJSONParser.get().parse(testData1);
    const proxy = node.getByPath('log/creator')!.toProxy() as any;
    expect(proxy.toString()).toMatchInlineSnapshot(`"creator: {name: 'WebInspector', version: '537.36'}"`);
    expect(TD.stringify(proxy, { jsonOption: { quoteChar: "'" } })).toMatchSnapshot();
  });
});
