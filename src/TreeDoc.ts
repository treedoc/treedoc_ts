import { TDNodeType } from '.';
import { ListUtil } from './core/ListUtil';
import { LangUtil } from './core/LangUtil';
import { TDNode } from './TDNode';

export class TreeDoc {
  public idMap: { [key: string]: TDNode } = {};
  public root: TDNode = new TDNode(this, "root");
  
  public constructor(rootKey = 'root', public readonly uri: string | null = null) {
    this.root.key = rootKey;
  }

  public static ofArray() {
    const result = new TreeDoc();
    result.root.setType(TDNodeType.ARRAY);
    return result;
  }

  /** Retrain only the sub-tree under the input node. */
  public retain(node: TDNode) {
    node.setKey(this.root.key);
    this.root = node;
    node.parent = undefined;
    return this;
  }

  /**
   * Create a TreeDoc with array root node contains the input nodes. This method will mutate the input nodes without
   * copying them. So the original Treedoc and parent associated with nodes will be obsoleted.
   * For idMap merge, all the id will be reassigned as id + "_" + docId to avoid collision.
   */
  public static merge(nodes: TDNode[]) {
    const result = new TreeDoc();
    result.root.type = TDNodeType.ARRAY;
    let docId = 0;
    for (const node of nodes) {
      node.setKey(undefined);
      result.idMap = {...result.idMap, ...ListUtil.mapKeys(node.doc.idMap, k => k + "_" + docId) };
      node.foreach(n => {
        n.doc = result;
        LangUtil.doIfNotNull(n.getChild(TDNode.REF_KEY), nRef => nRef!.value += "_" + docId);
        LangUtil.doIfNotNull(n.getChild(TDNode.ID_KEY), nRef => nRef!.value += "_" + docId);
      });
      result.root.addChild(node);
      docId ++;
    }
    return result;
  }

  /**
   * Build a tree node with exiting node as root node. This method will mutate input node so that the original doc and
   * parent associated with that node will be obsoleted. The that node is still associated with original doc, the original
   * doc will be in invalid state.
   */
  public static ofNode(node: TDNode) {
    const key = node.doc.root.key;
    const result = new TreeDoc(node.doc.root.key, node.doc.uri);
    result.root = node.setKey(key);
    result.idMap = {...node.doc.idMap};
    node.doc = result;
    node.parent = undefined;
    return result;
  }
}

// Jest has problem to access static method. We have to define global method for Jest spec to access
export function TreeDoc_ofArray() {
  return TreeDoc.ofArray();
}

export function TreeDoc_merge(nodes: TDNode[]) {
  return TreeDoc.merge(nodes);
}

export function TreeDoc_ofNode(node: TDNode) {
  return TreeDoc.ofNode(node);
}
