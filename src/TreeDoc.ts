import TDNode from './TDNode';

export default class TreeDoc {
  public readonly idMap: {[key: string]: TDNode} = {};
  public readonly root = new TDNode(this);
  public constructor(
    public readonly uri: string | null = null
  ) {}
}
