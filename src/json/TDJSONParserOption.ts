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

  // Package scopes used by parser
  _termValue = "";
  _termValueInMap = "";
  _termValueInArray = "";
  _termKey = "";
  /** Quote need if a string contains any chars */
  _quoteNeededChars = "";
  _termValueStrs: string[] = [];
  _termKeyStrs: string[] = [];

  buildTerms() {
    this._termValue = "\n\r" + this.deliminatorKey + this.deliminatorObjectStart;  // support tree with a type in the form of "type{attr1:val1}", key1:key2:type{att1:val1}    
    this._termKey = this.deliminatorObjectStart + this.deliminatorObjectEnd + this.deliminatorArrayStart;
    this._termValueStrs = [];
    this._termKeyStrs = [];
    if (this.deliminatorValue.length === 1) {  // If more than 1, will use separate string collection as term
      this._termValue += this.deliminatorValue;
      this._termKey += this.deliminatorValue;
    } else {
      this._termValueStrs.push(this.deliminatorValue);
      this._termKeyStrs.push(this.deliminatorValue);
    }
    if (this.deliminatorKey.length === 1)
      this._termKey += this.deliminatorKey;
    else
      this._termKeyStrs.push(this.deliminatorKey);

    this._termValueInMap = this._termValue + this.deliminatorObjectEnd + this.deliminatorArrayEnd; // It's possible object end is omitted for path compression. e.g [a:b:c]
    this._termValueInMap = this._termValue + this.deliminatorObjectEnd;
    this._termValueInArray = this._termValue + this.deliminatorArrayEnd;
    this._quoteNeededChars = this._termValue + this.deliminatorObjectEnd + this.deliminatorArrayEnd + this.deliminatorKey + this.deliminatorValue + this.quoteChars;
  }
}
