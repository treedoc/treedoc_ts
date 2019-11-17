import Bookmark from "./Bookmark";

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
  /** The key of the node, null for root or array element */
  public readonly key?: string;
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
  public constructor(key?: string) {
    this.key = key;
  }

  public setValue(val?: ValueType): TDNode {
    this.value = val;
    return this;
  }

  public createChild(name?: string): TDNode {
    const childIndex = this.indexOf(name);
    if (childIndex < 0) {
      const cnode = new TDNode(name);
      this.addChild(cnode);
      return cnode;
    }

    const children = this.children as TDNode[];
    let existNode = children[childIndex];

    // special handling for textproto due to it's bad design that allows duplicated keys
    if (!existNode.deduped) {
      const listNode = new TDNode(name);
      listNode.parent = this;
      listNode.deduped = true;
      listNode.type = TDNodeType.ARRAY;

      children[childIndex] = listNode;
      listNode.addChild(existNode);
      listNode.start = existNode.start;  // Reuse first node's start and length
      listNode.end = existNode.end;
      existNode = listNode;
    }

    const cn = new TDNode();
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
    if (!this.children || idx >= this.children.length) return null;
    return this.children[idx];
  }

  public getChildByPath(path: string): TDNode | null {
    return this.getChildByPathIdx(path.split('/'), 0);
  }
  public getValueByPath(path: string): ValueType {
    const cn = this.getChildByPath(path);
    return cn == null ? null : cn.value;
  }

  public getChildByPathIdx(path: string[], idx: number): TDNode | null {
    if (idx === path.length) return this;

    const pi = path[idx];
    const cn = isDigitOnly(pi) ? this.getChildByIdx(parseInt(pi, 10)) : this.getChild(pi);
    return cn == null ? null : cn.getChildByPathIdx(path, idx + 1);
  }

  public hasChildren() {
    return this.children && this.children.length > 0;
  }
  public getChildrenSize() {
    return !this.children ? 0 : this.children.length;
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
        const obj: any = {$};
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
