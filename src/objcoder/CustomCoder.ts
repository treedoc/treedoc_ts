import  { ICoder, ObjectCoderContext, TDObjectCoderOption } from './TDObjectCoder';
import { TDNodeType } from '../TDNode';
import { TDNode } from '../TDNode';
import { TDJSONParser } from '../json/TDJSONParser';
import { TDJSONParserOption } from '../json/TDJSONParserOption';

export class CustomCoder implements ICoder {
  public static it = new CustomCoder();
  public static get() {
    return CustomCoder.it;
  }
  public encode(obj: any, opt: TDObjectCoderOption, target: TDNode, ctx: ObjectCoderContext): boolean {
    if (!obj.toJSON)
      return false;
    const jsonStr = obj.toJSON();
    if (typeof(jsonStr) !== 'string')
      return false;
    const node = TDJSONParser.get().parse(jsonStr, TDJSONParserOption.ofDefaultRootType(TDNodeType.SIMPLE));
    target.setType(node.type).setValue(node.value).children = node.children;
    return true;
  }
}
