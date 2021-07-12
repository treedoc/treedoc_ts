import { TDJSONParser } from '../../json/TDJSONParser';
import {TDJSONWriter } from '../../json/TDJSONWriter';
import { TDJSONWriterOption } from '../../json/TDJSONWriterOption';
import { TestData } from './TestData';
import { NodeFilter } from '../../json/NodeFilter';

const testData = new TestData();

describe('TDJsonWriter', () => {
  test('testWriterWithValueMapper', () => {
    let node = TDJSONParser.get().parse(testData.testData);
    const opt = new TDJSONWriterOption().setIndentFactor(2)
        .addNodeFilter(NodeFilter.mask(".*/address", ".*/ip"))
        .addNodeFilter(NodeFilter.exclude(".*/\\$id"));
    const str = TDJSONWriter.get().writeAsString(node, opt);
    console.log(str);
    expect(str).toMatchSnapshot();
    node = TDJSONParser.get().parse(str);
    expect(node.getValueByPath("/data/0/$id")).toBeNull();
    expect(node.getValueByPath("/data/0/ip")).toEqual("<Masked:len=10>");
    expect(node.getValueByPath("/data/0/address")).toEqual("{Masked:size=2}");
  });
});
