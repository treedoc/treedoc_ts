import { TDNodeType } from '../TDNode';

export class TDJSONParserOption {
  public static ofDefaultRootType(type: TDNodeType): TDJSONParserOption { return new TDJSONParserOption().setDefaultRootType(type); }
  public static ofMapToString(): TDJSONParserOption { return new TDJSONParserOption().setDeliminatorKey("=").setDeliminatorValue(", "); }

  KEY_ID = `$id`;
  private _deliminatorKey = ":";
  private _deliminatorValue = ",";  

  get deliminatorKey() { return this._deliminatorKey; }
  get deliminatorValue () { return this._deliminatorValue ; }

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
  
  public setDeliminatorKey(val: string): TDJSONParserOption { this._deliminatorKey = val; this.buildTerms(); return this; }
  public setDeliminatorValue(val: string): TDJSONParserOption { this._deliminatorValue = val; this.buildTerms(); return this; }

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
    if (this._deliminatorValue.length == 1) {  // If more than 1, will use separate string collection as term
      this.termValue += this._deliminatorValue;
      this.termKey += this._deliminatorValue;
    } else {
      this.termValueStrs.push(this._deliminatorValue);
      this.termKeyStrs.push(this._deliminatorValue);
    }
    if (this._deliminatorKey.length == 1)
      this.termKey += this._deliminatorKey;
    else
      this.termKeyStrs.push(this._deliminatorKey);

    this.termValueInMap = this.termValue + "}";
    this.termValueInArray = this.termValue + "]";
  }
}
