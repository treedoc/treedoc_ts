import { TD, TDNode } from ".";
import LangUtil from "./core/LangUtil";
import { TDNodeType } from "./TDNode";

const TARGET = "$target";
const KEY = "$key";

export default class TDNodeProxyHandler<T extends TDNode> implements ProxyHandler<T> {
  get?(target: T, prop: string | symbol, receiver: any): any {
    if (typeof(prop) !== 'string') {
      console.log(`Got symbol prop: ${prop.toString()}`);
      return (target as any)[prop];
    }

    // console.log(`get: p=${p}, target=${target.pathAsString}`);
    if (prop === 'length') 
      return target.getChildrenSize();
    
    if (prop === TARGET)
      return target;
    
    if (prop === KEY)
      return target.key;
    
    const idx = Number(prop);
    const c = LangUtil.isNumber(idx) ? target.getChild(idx) : target.getChild(prop);
    if (c) {
      if (c.type === TDNodeType.SIMPLE)
        return c.value;
      // TODO: Support reference objects
      return c.toProxy();
    }
    
    return (target as any)[prop];
  }

  // Doesn't work for Object.keys(), not sure why
  ownKeys?(target: T): Array<string | symbol> {
    // console.log(`ownKeys: target=${target.pathAsString}`);
    const res = [TARGET, KEY];
    if (target.type === TDNodeType.MAP)
      target.children!.forEach(n => res.push(n.key!));
    else if (target.type === TDNodeType.ARRAY)
      res.push("length")
    return res;
  }
}