import { TDNode } from '..';
import { TDNodeType } from '../TDNode';
import TreeDoc from '../TreeDoc';
import CustomCoder from './CustomCoder';

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
  encode(obj: any, opt: ObjectCodeOption, target: TDNode, ctx: ObjectCoderContext): boolean;
}

export class ObjectCodeOption {
  public coders: ICoder[] = [CustomCoder.get()];
}

/** Javascript specific class that map JS object to/from TDNode */
export default class TDObjectCoder {
  public static it: TDObjectCoder = new TDObjectCoder();
  public readonly KEY_ID = '$id';
  public readonly KEY_REF = '$ref';
  public static get(): TDObjectCoder {
    return TDObjectCoder.it;
  }

  public encode(
    obj: any,
    opt = new ObjectCodeOption(),
    target = new TreeDoc().root,
    ctx = new ObjectCoderContext(),
  ): TDNode {
    if (this.isNullOrUndefined(obj)) return target;

    if (this.isPrimative(obj)) return target.setValue(obj);

    for (const coder of opt.coders) if (coder.encode(obj, opt, target, ctx)) return target;

    const idx = ctx.path.indexOf(obj);
    if (idx >= 0) return this.setRef(target, '' + (ctx.path.length - idx));

    const existNode = ctx.objNodeMap.get(obj);
    if (existNode) {
      if (!existNode.getChild(this.KEY_ID)) existNode.createChild(this.KEY_ID).setValue(ctx.nextId++);
      return this.setRef(target, '#' + existNode.getChildValue(this.KEY_ID));
    }

    ctx.path.push(obj);
    ctx.objNodeMap.set(obj, target);

    if (this.isArrayLikeObject(obj)) {
      target.type = TDNodeType.ARRAY;
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < obj.length; i++) this.encode(obj[i], opt, target.createChild(), ctx);
    } else {
      // Object or Map
      target.type = TDNodeType.MAP;
      for (const k of Object.keys(obj)) this.encode(obj[k], opt, target.createChild(k), ctx);
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

  // Utilties methods
  private isNullOrUndefined(obj: any): boolean {
    return obj === null || obj === undefined;
  }

  private isPrimative(obj: any): boolean {
    const type = typeof obj;
    if (type !== 'object' && type !== 'function') return true;
    const cstr = obj.constructor.name;
    return cstr === 'Number' || cstr === 'String' || cstr === 'Boolean';
  }

  private isArrayLikeObject(obj: any): boolean {
    return !this.isPrimative(obj) && this.isLength(obj.length);
  }

  private isLength(value: any) {
    return typeof value === 'number' && value > -1 && value % 1 === 0 && value <= Number.MAX_SAFE_INTEGER;
  }
}
