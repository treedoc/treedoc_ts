import { TD, TDNode } from ".";
import { LangUtil, Func, ExtendedFields } from "./core/LangUtil";
import { TDNodeType } from "./TDNode";

const TARGET = "$target";
const KEY = "$key";
export const TRANSIENT_DATA_KEY_EXTENDED_FIELDS = "$extendedFields";

export class TDNodeProxyHandler<T extends TDNode> implements ProxyHandler<T> {
  constructor(public useCache: boolean) {}

  get?(target: T, prop: string | symbol, receiver: any): any {
    // console.log(`prop: ${prop.toString()}`);

    if (prop === Symbol.toPrimitive) {
      return target.toString();
    }

    if (typeof(prop) !== 'string') {
      console.log(`Got unknown symbol prop: ${prop.toString()}`);
      return (target as any)[prop];
    }

    // console.log(`get: p=${p}, target=${target.pathAsString}`);
    if (prop === 'length') 
      return target.getChildrenSize();
    
    if (prop === TARGET)
      return target;
    
    if (prop === KEY)
      return target.key;

    const extendedFields = target.tData[TRANSIENT_DATA_KEY_EXTENDED_FIELDS] as ExtendedFields;
    if (extendedFields && extendedFields[prop])
      return extendedFields[prop](receiver);
    
    const idx = Number(prop);
    const c = LangUtil.isNumber(idx) ? target.getChild(idx) : target.getChild(prop);
    if (c) {
      if (c.type === TDNodeType.SIMPLE)
        return c.value;
      // TODO: Support reference objects of $ref
      return c.toProxy(this.useCache);
    }
    
    // Prevent: Function Proxy .toString() Errors
    // https://stackoverflow.com/questions/38259885/function-proxy-tostring-errors
    const res = (target as any)[prop];
    // return res;
    // console.log(`prop: ${prop}, res:${res}, typeof res=${typeof res}`);
    return (typeof res === 'function') ? res.bind(target) : res
  }

  // Doesn't work for Object.keys(), not sure why
  // ownKeys?(target: T): Array<string | symbol> {
  //   // console.log(`ownKeys: target=${target.pathAsString}`);
  //   const res = [TARGET, KEY];
  //   if (target.type === TDNodeType.MAP)
  //     target.children!.forEach(n => res.push(n.key!));
  //   else if (target.type === TDNodeType.ARRAY)
  //     res.push("length")
  //   return res;
  // }
}