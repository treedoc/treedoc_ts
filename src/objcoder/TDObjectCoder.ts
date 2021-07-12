import { TDNode } from '..';
import { TDNodeType } from '../TDNode';
import { TreeDoc } from '../TreeDoc';
import { CustomCoder } from './CustomCoder';
import { StringUtil } from '../core/StringUtil';
import { LangUtil } from '..';

export class ObjectCoderContext {
  public nextId = 1;

  /** only used for encoding */
  public objNodeMap = new Map<any, TDNode>();

  /** only used for decoding */
  public idToObjMap = new Map<string, TDNode>();

  public path: any[] = [];
}

export interface ICoder {
  /** return true means encoded */
  encode(obj: any, opt: TDObjectCoderOption, target: TDNode, ctx: ObjectCoderContext): boolean;
}

export class TDObjectCoderOption {
  public coders: ICoder[] = [CustomCoder.get()];
  public showType = false;
  public showFunction = false;

  public setShowType(showType: boolean) {
    this.showType = showType;
    return this;
  }

  public setShowFunction(showFunction: boolean) {
    this.showFunction = showFunction;
    return this;
  }
}

/** Javascript specific class that map JS object to/from TDNode */
export class TDObjectCoder {
  public static it: TDObjectCoder = new TDObjectCoder();
  public readonly KEY_ID = '$id';
  public readonly KEY_REF = '$ref';
  public readonly KEY_TYPE = '$type';
  public static get(): TDObjectCoder {
    return TDObjectCoder.it;
  }

  public static encode( 
    obj: any, opt: Partial<TDObjectCoderOption> = {}, target = new TreeDoc().root, ctx = new ObjectCoderContext()) {
    return TDObjectCoder.get().encode(obj, opt, target, ctx);
  }

  public encode(
    obj: any, option: Partial<TDObjectCoderOption> = {}, target = new TreeDoc().root, ctx = new ObjectCoderContext()): TDNode {
    const opt = LangUtil.mergeDeep(new TDObjectCoderOption(), option);
    if (this.isNullOrUndefined(obj))
      return target;

    if (this.isPrimitive(obj))
      return target.setValue(obj);

    if (typeof obj === 'function')
      return target.setValue(opt.showFunction ? obj.toString() : null);

    for (const coder of opt.coders) 
      if (coder.encode(obj, opt, target, ctx))
        return target;

    const idx = ctx.path.indexOf(obj);
    if (idx >= 0)
      return this.setRef(target, StringUtil.repeat('../', ctx.path.length - idx));

    const existNode = ctx.objNodeMap.get(obj);
    if (existNode) {
      if (existNode.type === TDNodeType.MAP) {
        if (!existNode.getChild(this.KEY_ID)) {
          const id = ctx.nextId++;
          existNode.createChild(this.KEY_ID).setValue(id);
          target.doc.idMap[id] = existNode;
        }

        return this.setRef(target, '#' + existNode.getChildValue(this.KEY_ID));
      } else
        return this.setRef(target, existNode.pathAsString);
    }

    ctx.path.push(obj);
    ctx.objNodeMap.set(obj, target);

    if (this.isArrayLikeObject(obj)) {
      target.type = TDNodeType.ARRAY;
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < obj.length; i++)
        this.encode(obj[i], opt, target.createChild(), ctx)  ;
    } else {
      // Object or Map
      target.type = TDNodeType.MAP;
      if (opt.showType && obj.constructor && obj.constructor.name !== 'Object')
        target.createChild(this.KEY_TYPE).setValue(obj.constructor.name)
      for (const k of Object.keys(obj)) {
        if (this.isNullOrUndefined(obj[k]))
          continue;
        if (!opt.showFunction && typeof obj === 'function')
          continue;
        this.encode(obj[k], opt, target.createChild(k), ctx);
      }
    }
    ctx.path.pop();
    return target;
  }

  private setRef(node: TDNode, ref: string) {
    node
      .setType(TDNodeType.MAP)
      .createChild(this.KEY_REF)
      .setValue(ref);
    return node;
  }

  // Utilities methods
  private isNullOrUndefined(obj: any): boolean {
    return obj === null || obj === undefined || typeof obj === 'symbol';
  }

  private isPrimitive(obj: any): boolean {
    const type = typeof obj;
    if (obj === null || obj=== undefined || type !== 'object' && type !== 'function') 
      return true;
    const cstr = obj.constructor && obj.constructor.name;
    return cstr === 'Number' || cstr === 'String' || cstr === 'Boolean';
  }

  private isArrayLikeObject(obj: any): boolean {
    return !this.isPrimitive(obj) && this.isLength(obj.length);
  }

  private isLength(value: any) {
    return typeof value === 'number' && value > -1 && value % 1 === 0 && value <= Number.MAX_SAFE_INTEGER;
  }
}
