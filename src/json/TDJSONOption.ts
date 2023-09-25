import { TDNodeType } from '../TDNode';

export class TDJSONOption {
  KEY_ID = `$id`;
  KEY_TYPE = "$type";
  deliminatorKey = ":";
  deliminatorValue = ",";
  deliminatorObjectStart = "{";
  deliminatorObjectEnd = "}";
  deliminatorArrayStart = "[";
  deliminatorArrayEnd = "]";
  /**
   * QuoteChar can have multiple value. When multiple value is provided, it will dynamically choose the best one
   * to minimize the escape. For example "\"\'", if the string contains a lot of single quote, it will use double quote.
   */
  public quoteChars = '"';
  public setQuoteChars(quoteChars: string) { this.quoteChars = quoteChars; return this; }

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
