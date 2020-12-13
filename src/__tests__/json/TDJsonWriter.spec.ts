import TDJSONParser from '../../json/TDJSONParser';
import TDJSONWriter from '../../json/TDJSONWriter';
import TDJSONWriterOption from '../../json/TDJSONWriterOption';
import { TDNode } from '../..';
import TestData from './TestData';

const MASKED = "[masked]";
const testData = new TestData();

describe('TDJsonWriter', () => {
  test('testWriterWithValueMapper', () => {
    let node = TDJSONParser.get().parse(testData.testData);
    const opt = new TDJSONWriterOption().setIndentFactor(2)
        .setValueMapper(n => {return n.key === "ip"  ? MASKED : n.value;})
        .setNodeMapper(n => n.key === "address" ? new TDNode(n.doc, n.key).setValue(MASKED) : n);
    const str = TDJSONWriter.get().writeAsString(node, opt);
    console.log("testWriterWithValueMapper: str=\n" + str);
    node = TDJSONParser.get().parse(str);
    expect(node.getValueByPath("/data/0/ip")).toEqual(MASKED);
    expect(node.getValueByPath("/data/0/address")).toEqual(MASKED);
  });
});
