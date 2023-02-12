import  { ICoder, ObjectCoderContext, TDObjectCoderOption } from './TDObjectCoder';
import { TDNodeType } from '../TDNode';
import { TDNode } from '../TDNode';
import { TDJSONParser } from '../json/TDJSONParser';

export class CustomCoder implements ICoder {
  public static it = new CustomCoder();
  public static get() {
    return CustomCoder.it;
  }
  private readonly DATE = new Date();
  public encode(obj: any, opt: TDObjectCoderOption, target: TDNode, ctx: ObjectCoderContext): boolean {
    if (!obj.toJSON)
      return false;
    const jsonStr = obj.toJSON();
    if (typeof(jsonStr) !== 'string')
      return false;
    const node = TDJSONParser.get().parse(jsonStr);
    target.setType(node.type).setValue(node.value).children = node.children;
    return true;
  }
}
