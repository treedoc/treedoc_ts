import { Bookmark } from './Bookmark';
import { TreeDoc } from './TreeDoc';
import { TDPath, Part, PathPartType } from './TDPath';
import { StringUtil } from './core/StringUtil';
import { LangUtil } from './core/LangUtil';
import { TDNodeProxyHandler } from './TDNodeProxyHandler';


export enum TDNodeType {
  MAP,
  ARRAY,
  SIMPLE,
}

export type ValueType = string | number | boolean | null | undefined;

const KEY_REF = '$ref';

export class TransientData {
  hash?: number;
  str?: string;
  obj?: any;
  nameIndex?: Map<string, number>;
  proxy?: any;
  [key: string]: any;
}

export class TDNode {
  private static readonly SIZE_TO_INIT_NAME_INDEX = 64;
  public static readonly ID_KEY = "$id";
  public static readonly REF_KEY = "$ref";
  public static readonly COLUMN_KEY = "@key";
  public static readonly COLUMN_VALUE = "@value";
  
  public parent?: TDNode;
  public type = TDNodeType.SIMPLE;
  /** The value of the node, only available for leave node */
  private mValue: ValueType = null;
  /** Children of node. Use List instead of Map to avoid performance overhead of HashMap for small number of elements */
  public children?: TDNode[];
  /** Start position in the source */
  public start?: Bookmark;
  /** Length of this node in the source */
  public end?: Bookmark;
  /** indicate this node is a deduped Array node for textproto which allows duplicated keys */
  public deduped = false;

  // transient properties
  public readonly tData = new TransientData();

  // Create a root node if parent is undefined
  public constructor(public doc: TreeDoc, public key?: string) {}

  public clone(): TDNode {
    const result = new TDNode(this.doc, this.key).setType(this.type).setValue(this.value);
    result.parent = this.parent;
    result.children = this.children;
    result.start = this.start;
    result.end = this.end;
    result.deduped = this.deduped;
    return result;
  }

  public cloneOfSimpleType(value: ValueType): TDNode { return new TDNode(this.doc, this.key).setParent(this.parent).setType(TDNodeType.SIMPLE).setValue(value); }

  public setParent(parent?: TDNode): TDNode { this.parent = parent; return this.touch(); }
  public setKey(key?: string): TDNode { this.key = key; return this.touch(); }
  public setValue(val?: ValueType): TDNode { this.mValue = val; return this.touch(); }
  public get value() { return this.mValue; }
  public set value(value: ValueType) { this.mValue = value; }
  public setType(type: TDNodeType): TDNode { this.type = type; return this; }
  public setStart(start: Bookmark) { this.start = start; return this;}
  public setEnd(end: Bookmark) { this.end = end; return this;}

  public createChild(name?: string): TDNode {
    const childIndex = this.indexOf(name);
    if (childIndex < 0) {
      const cnode = new TDNode(this.doc, name);
      this.addChild(cnode);
      return cnode;
    }

    // special handling for textproto due to its bad design that allows duplicated keys
    let existNode = this.children![childIndex].clone();

    if (!existNode.deduped) {
      const listNode = new TDNode(this.doc, name);
      listNode.parent = this;
      listNode.deduped = true;
      listNode.type = TDNodeType.ARRAY;

      this.children![childIndex] = listNode;
      existNode.key = '0';
      listNode.addChild(existNode);
      listNode.start = existNode.start; // Reuse first node's start and length
      listNode.end = existNode.end;
      existNode = listNode;
    }

    return existNode.createChild();
  }

  public addChild(node: TDNode) {
    if (!this.children) 
      this.children = [];
    node.parent = this;
    node.doc = this.doc;
    if (node.key == null)  // Assume it's array element
      node.key = "" + this.getChildrenSize();
    this.children.push(node);
    if (this.tData.nameIndex != null)
      this.tData.nameIndex.set(node.key, this.children.length - 1);
    else if (this.children.length > TDNode.SIZE_TO_INIT_NAME_INDEX)
      this.initNameIndex();
    
    return this.touch();
  }

  private initNameIndex() {
    this.tData.nameIndex = new Map();
    for (let i = 0; i< this.children!.length; i++) {
      const child = this.children![i];
      if (child.key != null)
        this.tData.nameIndex.set(child.key, i);
    }
  }

  public getChild(name: string | number): TDNode | null {
    if (typeof name === 'string')
      name = this.indexOf(name);
    return this.hasChildren() && name >= 0 ? this.children![name] : null;
  }

  public indexOf(name?: string): number {
    if (this.tData.nameIndex != null)
      return LangUtil.orElse(this.tData.nameIndex.get(name!), -1);

    // VUETIPS: When VueJS instrument this object, it will generate getter to register the dep-graph.
    // Every call to getter could be very heavy if the number of children is huge e.g. > 10000.
    // If we put the this.children inside for loop, it will cause O(n^2) problem.
    // so we have to cache it outside the for loop.
    // Relevant code: reactiveGetter (vue.runtime.esm.js?2b0e:1031)
    const children = this.children;
    if (!children || name == null)
      return -1;
    for (let i = 0; i < children.length; i++)
      if (name === children[i].key)
        return i;
    return -1;
  }

  public getChildValue(name: string): ValueType {
    const cn = this.getChild(name);
    return cn == null ? null : cn.value;
  }

  public hasChildren() {
    return this.children && this.children.length > 0;
  }
  public getChildrenSize() {
    return !this.children ? 0 : this.children.length;
  }

  public getValueByPath(path: TDPath | string): ValueType {
    const cn = this.getByPath(path);
    return cn && cn.value;
  }

  /** If noNull is true, it will return the last matched node */
  public getByPath(path: TDPath | string | string[], noNull = false, idx = 0): TDNode | null {
    if (!(path instanceof TDPath))
      path = TDPath.parse(path);

    if (idx === path.parts.length)
      return this;

    const next = this.getNextNode(path.parts[idx]);
    if (next == null)
      return noNull ? this : null;

    return next.getByPath(path, noNull, idx + 1);
  }

  public getNextNode(part: Part): TDNode | null {
    switch (part.type) {
      case PathPartType.ROOT:
        return this.doc.root;
      case PathPartType.CHILD_OR_ID:
        return this.getChild(part.key!) || this.doc.idMap[part.id!];
      case PathPartType.RELATIVE:
        return this.getAncestor(part.level!);
      case PathPartType.CHILD:
        return this.getChild(part.key!);
      default:
        return null; // Impossible
    }
  }

  public getAncestor(level: number): TDNode | null {
    let result: TDNode | null = this;
    for (let i = 0; i < level && result != null; i++, result = result.parent || null)
      ;
    return result;
  }

  public foreach(action: (n: TDNode) => void) {
    action(this);
    if (this.children != null)
      this.children.forEach(n => n.foreach(action));
    return this;
  }

  public isRoot() {
    return !this.parent;
  }

  /** JS specific logic */
  public toObject(includeTdNode = false, useCache = true): any {
    if (this.tData.obj !== undefined && useCache)
      return this.tData.obj;

    switch (this.type) {
      case TDNodeType.SIMPLE:
        return this.value;
      case TDNodeType.MAP: {
        const result:any = includeTdNode ? { $$tdNode: this } : {};
        if (useCache) this.tData.obj = result;
        return this.toObjectMap(result, includeTdNode);
      }
      case TDNodeType.ARRAY: {
        const result: any = [];
        if (useCache) this.tData.obj = result;
        if (includeTdNode)
          (result as any).$$tdNode = this;
        if (this.children)
          this.children.forEach(c => result.push(c.toObject(includeTdNode)));
        return result;
      }
      default:
        throw new Error('Unknown type');
    }
  }

  private toObjectMap(result: any, includeTdNode: boolean) {
    const refVal = this.getChildValue(KEY_REF);
    if (typeof refVal === 'string') {
      const target = this.getByPath(refVal);
      if (target !== null)
        return target.toObject(includeTdNode);
      console.warn(`Reference is not found: ref:${refVal}; current Node:${this.pathAsString}`);
    }
    this.children?.forEach(c => c.key && (result[c.key] = c.toObject(includeTdNode)));
    return result;
  }

  public toProxy(useCache = true): TDNode {
    if (useCache && this.tData.proxy)
      return this.tData.proxy;
    const res = new Proxy(this, new TDNodeProxyHandler(useCache));
    // res.toString = this.toString;  // Without this, the proxy.toString will return 
    if (useCache)
      this.tData.proxy = res;
    return res;
  }

  public get pathAsString() {
    return '/' + this.path.join('/');
  }
  public get path(): string[] {
    return this.parent ? [...this.parent.path, this.key!] : [];
  }
  public isLeaf() {
    return this.getChildrenSize() === 0;
  }

  private touch(): TDNode {
    this.tData.hash = undefined;
    this.tData.str = undefined;
    this.tData.proxy = undefined;
    this.tData.obj = undefined;
    if (this.parent != null)
      this.parent.touch();
    return this;
  }

  public toString() {
    if (this.tData.str === undefined)
      this.tData.str = this.toStringInternal('', false);
    return this.tData.str;
  }

  /** method specific for JSON.stringify() */
  public toJSON() { return this.toStringInternal('', false); }

  public toStringInternal(sb: string, includeRootKey = true, includeReservedKeys = true, limit = 100000) {
    if (this.parent != null && this.parent.type === TDNodeType.MAP && includeRootKey)
      sb += this.key + ': ';


    if (this.value !== null && this.value !== undefined) {
      if (typeof this.value !== 'string' || !includeRootKey) {
        sb += this.value;
      } else {
        let str = StringUtil.cEscape(this.value, '\'')!;
        const remainLen = limit - sb.length;
        if (str.length > remainLen)
          str = str.substring(0, remainLen) + "...";
        sb += '\'' + str + '\'';
      }
    }

    if (this.children == null)
      return sb;

    sb += this.type === TDNodeType.ARRAY ? '[' : '{';
    for (const n of this.children) {
      if (!includeReservedKeys && n.key && n.key.startsWith("$"))
        continue;

      if (sb.length > limit) {
        sb += '...';
        break;
      }
  
      sb = n.toStringInternal(sb, true, includeReservedKeys, limit);      
      if (n !== this.children.slice(-1)[0])
        sb += ", ";

    }
    sb += this.type === TDNodeType.ARRAY ? ']' : '}';
    return sb;
  }

  public childrenValueAsList(): any[]  {
    return !this.children ? [] : this.children.map(c => c.value || c);
  }

  public childrenValueAsListOfList(): any[][] {
    return ! this.children ? [] : this.children.map(c => c.childrenValueAsList());
  }

  public childrenValueAsListWithKeys(keys: string[], target: any[]): any[] {
    for (const k of keys) {
      if (k === TDNode.COLUMN_KEY)
        continue;
      if (k === TDNode.COLUMN_VALUE && this.type === TDNodeType.SIMPLE)
        target.push(this.value);
      else {
        const c = this.getChild(k);
        target.push(c?.value || c);
      }
    }
    return target;
  }

  public childrenValueAsListOfListWithKeys(keys: string[]): any[][] {
    return !this.children ? [] :
        this.children.map(c => c.childrenValueAsListWithKeys(keys, keys[0] === TDNode.COLUMN_KEY ? [c.key] : []));
  }

  /** Get union of keys for all children, it's used for represent children in a table view */
  public getChildrenKeys(): string[] {
    const result: any = [];
    const keySet = new Set();

    if (this.type === TDNodeType.SIMPLE || !this.children)
      return result;
    // Add the key column
    result.push(TDNode.COLUMN_KEY);
    keySet.add(TDNode.COLUMN_KEY);
    let hasValue = false;
    for (const c of this.children) {
      if (c.value != null)
        hasValue = true;
      if (c.children)
        for (const cc of c.children) 
          if (!keySet.has(cc.key)) {
            result.push(cc.key);
            keySet.add(cc.key);
          }
    }
    if (hasValue)
      result.splice(1, 0, TDNode.COLUMN_VALUE);
    return result;
  }

  // JS Specific
  public freeze() {
    const children = this.children;
    if (children) {
      for (const c of children) 
        c.freeze();
    }
    Object.freeze(this.start);
    Object.freeze(this.end);
    Object.freeze(this.doc);
    Object.freeze(this);
  }
}
