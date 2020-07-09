import Bookmark from './Bookmark';
import TreeDoc from './TreeDoc';
import TDPath, { Part, PathPartType } from './TDPath';

export enum TDNodeType {
  MAP,
  ARRAY,
  SIMPLE,
}

export type ValueType = string | number | boolean | null | undefined;

const KEY_REF = '$ref';

export default class TDNode {
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
  private hash?: number;
  private str?: string;
  private obj?: any;

  // Create a root node if parent is undefined
  public constructor(public readonly doc: TreeDoc, public key: string) {}

  public clone(): TDNode {
    const result = new TDNode(this.doc, this.key).setType(this.type).setValue(this.value);
    result.parent = this.parent;
    result.children = this.children;
    result.start = this.start;
    result.end = this.end;
    result.deduped = this.deduped;
    return result;
  }

  public setKey(key: string): TDNode {
    this.key = key;
    this.touch();
    return this;
  }

  public setValue(val?: ValueType): TDNode {
    this.mValue = val;
    this.touch();
    return this;
  }

  public get value() {
    return this.mValue;
  }

  public setType(type: TDNodeType): TDNode {
    this.type = type;
    return this;
  }

  public createChild(name?: string): TDNode {
    if (name === undefined)
      // Assume it's array element
      name = this.getChildrenSize() + '';

    const childIndex = this.indexOf(name);
    if (childIndex < 0) {
      const cnode = new TDNode(this.doc, name);
      this.addChild(cnode);
      return cnode;
    }

    // special handling for textproto due to it's bad design that allows duplicated keys
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
    if (!this.children) this.children = [];
    this.children.push(node);
    node.parent = this;
    this.touch();
    return this;
  }

  public getChild(name: string | number): TDNode | null {
    if (typeof name === 'string') name = this.indexOf(name);
    return this.hasChildren() && name >= 0 ? this.children![name] : null;
  }

  public indexOf(name?: string): number {
    // VUETIPS: When VueJS instrument this object, it will generate getter to register the dep-graph.
    // very call to getter could be very heavy if the number of children is huge e.g. > 10000.
    // If we put the this.children inside for loop, it will cause O(n^2) problem.
    // so we have to cache it outside the for loop.
    // Relevant code: reactiveGetter (vue.runtime.esm.js?2b0e:1031)
    // TODO: add index when the node number is huge
    const children = this.children;
    if (!children || name == null) return -1;
    for (let i = 0; i < children.length; i++) if (name === children[i].key) return i;
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
    if (!(path instanceof TDPath)) path = TDPath.parse(path);

    if (idx === path.parts.length) return this;

    const next = this.getNextNode(path.parts[idx]);
    if (next == null) return noNull ? this : null;

    return next.getByPath(path, noNull, idx + 1);
  }

  public getNextNode(part: Part): TDNode | null {
    switch (part.type) {
      case PathPartType.ROOT:
        return this.doc.root;
      case PathPartType.ID:
        return this.doc.idMap[part.key!];
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
    for (let i = 0; i < level && result != null; i++, result = result.parent || null);
    return result;
  }

  public isRoot() {
    return !this.parent;
  }

  /** JS specific logic */
  public toObject(includePosition = true): any {
    if (this.obj !== undefined) return this.obj;

    const $ = {
      start: this.start,
      end: this.end,
    };

    switch (this.type) {
      case TDNodeType.SIMPLE:
        return this.value;
      case TDNodeType.MAP: {
        this.obj = includePosition ? { $ } : {};

        const refVal = this.getChildValue(KEY_REF);
        if (typeof refVal === 'string') {
          const target = this.getByPath(refVal);
          if (target == null)
            throw new Error(`Reference is not found: ref:${refVal}; current Node:${this.pathAsString}`);
          this.obj = target.toObject(includePosition);
        } else {
          if (this.children) this.children.forEach(c => c.key && (this.obj[c.key] = c.toObject(includePosition)));
        }
        return this.obj;
      }
      case TDNodeType.ARRAY: {
        this.obj = [];
        if (includePosition) (this.obj as any).$ = $;
        if (this.children) this.children.forEach(c => this.obj.push(c.toObject(includePosition)));
        return this.obj;
      }
      default:
        throw new Error('Unknown type');
    }
  }

  public get pathAsString() {
    return '/' + this.path.join('/');
  }
  public get path(): string[] {
    return this.parent ? [...this.parent.path, this.key] : [];
  }
  public isLeaf() {
    return this.getChildrenSize() === 0;
  }

  private touch(): TDNode {
    this.hash = undefined;
    this.str = undefined;
    if (this.parent != null) this.parent.touch();
    return this;
  }

  public toString() {
    if (this.str === undefined) this.str = this.toStringInternal();
    return this.str;
  }

  public toStringInternal(limit = 100000) {
    let sb = '';
    if (this.parent != null && this.parent.type === TDNodeType.MAP) sb += this.key + ':';

    if (this.value != null) sb += this.value;

    if (this.children == null) return sb;

    sb += this.type === TDNodeType.ARRAY ? '[' : '{';
    for (const n of this.children) {
      sb += n.toStringInternal(limit) + ',';
      if (sb.length > limit) {
        sb += '...';
        break;
      }
    }
    sb += this.type === TDNodeType.ARRAY ? ']' : '}';
    return sb;
  }

  public freeze() {
    const children = this.children;
    if (children) {
      for (const c of children) c.freeze();
    }
    Object.freeze(this.start);
    Object.freeze(this.end);
    Object.freeze(this.doc);
    Object.freeze(this);
  }
}
