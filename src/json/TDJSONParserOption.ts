import { TDNodeType } from '../TDNode';
import { TDJSONOption } from './TDJSONOption';

export class TDJSONParserOption extends TDJSONOption {
  public static ofDefaultRootType(type: TDNodeType): TDJSONParserOption { return new TDJSONParserOption().setDefaultRootType(type); }
  public static ofMapToString(): TDJSONParserOption { return new TDJSONParserOption().setDeliminatorKey("=").setDeliminatorValue(", "); }
  
  uri?: string;

  /**
   * In case there's no enclosed '[' of '{' on the root level, the default type.
   * By default, it will try to interpreter as a single value (either map, if there's ":", or a simple value.)
   */
  defaultRootType: TDNodeType | undefined;

  constructor() { super(); this.buildTerms(); }

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
  
  public setDeliminatorKey(val: string): TDJSONParserOption { this.deliminatorKey = val; return this; }
  public setDeliminatorValue(val: string): TDJSONParserOption { this.deliminatorValue = val; return this; }

  public setDeliminatorObject(start: string, end: string): TDJSONParserOption {
    this.deliminatorObjectStart = start;
    this.deliminatorObjectEnd = end;
    return this;
  }

  public setDeliminatorArray(start: string, end: string): TDJSONParserOption {
    this.deliminatorArrayStart = start;
    this.deliminatorArrayEnd = end;
    return this;
  }
}
