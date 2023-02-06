import { TDNodeType } from '../TDNode';
import { TDJSONOption } from './TDJSONOption';

export class TDJSONParserOption extends TDJSONOption {
  public static ofDefaultRootType(type: TDNodeType): TDJSONParserOption { return new TDJSONParserOption().setDefaultRootType(type); }
  public static ofMapToString(): TDJSONParserOption { return new TDJSONParserOption().setDeliminatorKey("=").setDeliminatorValue(", "); }
  
  uri?: string;

  /** In case there's no enclosed '[' of '{' on the root level, the default type. */
  defaultRootType = TDNodeType.SIMPLE;

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

  // Package scopes used by parser
  termValue = "";
  termValueInMap = "";
  termValueInArray = "";
  termKey = "";
  termValueStrs: string[] = [];
  termKeyStrs: string[] = [];

  buildTerms() {
    this.termValue = "\n\r" + this.deliminatorObjectStart;  // support tree with a type in the form of "type{attr1:val1}"
    this.termKey = this.deliminatorObjectStart + this.deliminatorObjectEnd + this.deliminatorArrayStart;
    this.termValueStrs = [];
    this.termKeyStrs = [];
    if (this.deliminatorValue.length === 1) {  // If more than 1, will use separate string collection as term
      this.termValue += this.deliminatorValue;
      this.termKey += this.deliminatorValue;
    } else {
      this.termValueStrs.push(this.deliminatorValue);
      this.termKeyStrs.push(this.deliminatorValue);
    }
    if (this.deliminatorKey.length === 1)
      this.termKey += this.deliminatorKey;
    else
      this.termKeyStrs.push(this.deliminatorKey);

      this.termValueInMap = this.termValue + this.deliminatorObjectEnd;
      this.termValueInArray = this.termValue + this.deliminatorArrayEnd;
    }
}
