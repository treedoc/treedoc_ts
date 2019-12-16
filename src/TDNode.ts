import Bookmark from './Bookmark';
import TreeDoc from './TreeDoc';
import TDPath, { Part, PathPartType } from './TDPath';

export enum TDNodeType {
  MAP,
  ARRAY,
  SIMPLE,
}

export type ValueType = string | number | boolean | null | undefined;
function isDigitOnly(str: string) {
  return str.match(/^[0-9]+$/) != null;
}

export default class TDNode {
  public parent?: TDNode;
  public type = TDNodeType.SIMPLE;
  /** The value of the node, only available for leave node */
  public value?: ValueType;
  /** Children of node. Use List instead of Map to avoid performance overhead of HashMap for small number of elements */
  public children?: TDNode[];
  /** Start position in the source */
  public start?: Bookmark;
  /** Length of this node in the source */
  public end?: Bookmark;
  /** indicate this node is a deduped Array node for textproto which allows duplicated keys */
  public deduped = false;

  // Create a root node if parent is undefined
  public constructor(
    public readonly doc: TreeDoc,
    /** The key of the node, null for root or array element */
    public readonly key : string | null = null
  ) {}

  public setValue(val?: ValueType): TDNode {
    this.value = val;
    return this;
  }

  public setType(type: TDNodeType): TDNode {
    this.type = type;
    return this;
  }

  public createChild(name?: string): TDNode {
    const childIndex = this.indexOf(name);
    if (childIndex < 0) {
      const cnode = new TDNode(this.doc, name);
      this.addChild(cnode);
      return cnode;
    }

    const children = this.children as TDNode[];
    let existNode = children[childIndex];

    // special handling for textproto due to it's bad design that allows duplicated keys
    if (!existNode.deduped) {
      const listNode = new TDNode(this.doc, name);
      listNode.parent = this;
      listNode.deduped = true;
      listNode.type = TDNodeType.ARRAY;

      children[childIndex] = listNode;
      listNode.addChild(existNode);
      listNode.start = existNode.start; // Reuse first node's start and length
      listNode.end = existNode.end;
      existNode = listNode;
    }

    const cn = new TDNode(this.doc);
    existNode.addChild(cn);
    return cn;
  }

  public addChild(node: TDNode) {
    if (!this.children) this.children = [];
    this.children.push(node);
    node.parent = this;
    return this;
  }

  public getChild(name: string): TDNode | null {
    const idx = this.indexOf(name);
    return idx < 0 ? null : (this.children as TDNode[])[idx];
  }

  public indexOf(name?: string): number {
    if (!this.children || name == null) return -1;

    for (let i = 0; i < this.children.length; i++) if (name === this.children[i].key) return i;
    return -1;
  }

  public getChildValue(name: string): ValueType {
    const cn = this.getChild(name);
    return cn == null ? null : cn.value;
  }

  public getChildByIdx(idx: number): TDNode | null {
    return this.hasChildren() ? this.children![idx] : null;
  }

  public hasChildren() { return this.children && this.children.length > 0; }
  public getChildrenSize() { return !this.children ? 0 : this.children.length; }

  public getChildByPath(path: string): TDNode | null {
    return this.getChildByPathIdx(path.split('/'), 0);
  }
  public getValueByPath1(path: string): ValueType {
    const cn = this.getChildByPath(path);
    return cn == null ? null : cn.value;
  }

  public getChildByPathIdx(path: string[], idx: number): TDNode | null {
    if (idx === path.length) return this;

    const pi = path[idx];
    const cn = isDigitOnly(pi) ? this.getChildByIdx(parseInt(pi, 10)) : this.getChild(pi);
    return cn == null ? null : cn.getChildByPathIdx(path, idx + 1);
  }

  public getValueByPathStr(path: string): ValueType { return this.getValueByPath(TDPath.parse(path)); }
  public getValueByPath(path: TDPath): ValueType {
    const cn = this.getByPath(path);
    return cn == null ? null : cn.value;
  }

  public getByPathStr(path: string): TDNode | null { return this.getByPath(TDPath.parse(path)); }
  /** If noNull is true, it will return the last matched node */
  public getByPath(path: TDPath, noNull = false, idx = 0): TDNode | null {
    if (idx === path.parts.length)
      return this;

    const next = this.getNextNode(path.parts[idx]);
    if (next == null)
      return noNull ? this : null;

    return next.getByPath(path, noNull, idx + 1);
  }

  private getNextNode(part: Part): TDNode | null {
    switch (part.type) {
      case PathPartType.ROOT: return this.doc.root;
      case PathPartType.ID: return this.doc.idMap[part.key!];
      case PathPartType.RELATIVE: return this.getAncestor(part.level!);
      case PathPartType.CHILD: return isDigitOnly(part.key!) ? this.getChildByIdx(parseInt(part.key!)) : this.getChild(part.key!);
      default: return null;  // Impossible
    }
  }

  private getAncestor(level: number): TDNode | null {
    let result: TDNode | null = this;
    for (let i = 0; i < level && result != null; i++, result = result.parent || null)
      ;
    return result;
  }

  public isRoot() {
    return !this.parent;
  }

  /** JS specific logic */
  public toObject(): any {
    const $ = {
      start: this.start,
      end: this.end,
    };

    switch (this.type) {
      case TDNodeType.SIMPLE:
        return this.value;
      case TDNodeType.MAP: {
        const obj: any = { $ };
        if (this.children) this.children.forEach(c => c.key && (obj[c.key] = c.toObject()));
        return obj;
      }
      case TDNodeType.ARRAY: {
        const obj: any[] = [];
        (obj as any).$ = $;
        if (this.children) this.children.forEach(c => obj.push(c.toObject()));
        return obj;
      }
      default:
        throw new Error('Unknown type');
    }
  }

}
