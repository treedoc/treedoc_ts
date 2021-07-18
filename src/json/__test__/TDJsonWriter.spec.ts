import { TDJSONParser } from '../../json/TDJSONParser';
import {TDJSONWriter } from '../../json/TDJSONWriter';
import { TDJSONWriterOption, TextType} from '../../json/TDJSONWriterOption';
import { TestData } from './TestData';
import { NodeFilter } from '../../json/NodeFilter';

const testData = new TestData();

describe('TDJsonWriter', () => {
  test('testWriterWithNodeFilter', () => {
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

  test('testWriterWithTextDeco', () => {
    const node = TDJSONParser.get().parse(testData.testData);
    const opt = new TDJSONWriterOption().setIndentFactor(2)
      .setTextDecorator((s, type) => {
        switch (type) {
          case TextType.KEY: return "<b>" + s + "</b>";
          case TextType.OPERATOR: return '<font color=red>' + s + "</font>";
          case TextType.NON_STRING:
            return "<font color=green>" + s + "</font>";
          case TextType.STRING:
          default: return s;
        }
      });
    const str = TDJSONWriter.get().writeAsString(node, opt);
    console.log(str);
    expect(str).toMatchSnapshot();
    expect(str).toContain("<b>total</b>");
    expect(str).toContain("<font color=red>:</font>");
    expect(str).toContain("<font color=green>9007199254740991</font>");
  });
});
