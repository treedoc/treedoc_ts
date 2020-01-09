import TDNode from './TDNode';

export default class TreeDoc {
  public readonly idMap: { [key: string]: TDNode } = {};
  public readonly root: TDNode;
  public constructor(rootKey = 'root', public readonly uri: string | null = null) {
    this.root = new TDNode(this, rootKey);
  }
}
