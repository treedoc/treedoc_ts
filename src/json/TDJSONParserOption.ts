import { TDNodeType } from '../TDNode';

export class TDJSONParserOption {
  public KEY_ID = `$id`;

  public uri?: string;

  /** In case there's no enclosed '[' of '{' on the root level, the default type. */
  public defaultRootType = TDNodeType.SIMPLE;

  public setDefaultRootType(type: TDNodeType) {
    this.defaultRootType = type;
    return this;
  }

 /**
  * if this is set, all the id in $id and $ref will be suffixed with "_" + docId, this is to avoid collision when merge
  * multiple docs as stream
  */
  docId?: string | number;

  public setDocId(id: string | number) {
    this.docId = id;
    return this;
  }
}
