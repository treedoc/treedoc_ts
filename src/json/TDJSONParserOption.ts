import { TDNodeType } from '../TDNode';

export class TDJSONParserOption {
  public static ofDefaultRootType(type: TDNodeType): TDJSONParserOption { return new TDJSONParserOption().setDefaultRootType(type); }
  public static ofMapToString(): TDJSONParserOption { return new TDJSONParserOption().setDeliminatorKey("=").setDeliminatorValue(", "); }

  KEY_ID = `$id`;
  private mDeliminatorKey = ":";
  private mDeliminatorValue = ",";  

  get deliminatorKey() { return this.mDeliminatorKey; }
  get deliminatorValue () { return this.mDeliminatorValue ; }

  uri?: string;

  /** In case there's no enclosed '[' of '{' on the root level, the default type. */
  defaultRootType = TDNodeType.SIMPLE;

  constructor() { this.buildTerms(); }

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
  
  public setDeliminatorKey(val: string): TDJSONParserOption { this.mDeliminatorKey = val; this.buildTerms(); return this; }
  public setDeliminatorValue(val: string): TDJSONParserOption { this.mDeliminatorValue = val; this.buildTerms(); return this; }

  // Package scopes used by parser
  termValue = "";
  termValueInMap = "";
  termValueInArray = "";
  termKey = "";
  termValueStrs: string[] = [];
  termKeyStrs: string[] = [];

  buildTerms() {
    this.termValue = "\n\r";
    this.termKey = "{[}";
    this.termValueStrs = [];
    this.termKeyStrs = [];
    if (this.mDeliminatorValue.length === 1) {  // If more than 1, will use separate string collection as term
      this.termValue += this.mDeliminatorValue;
      this.termKey += this.mDeliminatorValue;
    } else {
      this.termValueStrs.push(this.mDeliminatorValue);
      this.termKeyStrs.push(this.mDeliminatorValue);
    }
    if (this.mDeliminatorKey.length === 1)
      this.termKey += this.mDeliminatorKey;
    else
      this.termKeyStrs.push(this.mDeliminatorKey);

    this.termValueInMap = this.termValue + "}";
    this.termValueInArray = this.termValue + "]";
  }
}
