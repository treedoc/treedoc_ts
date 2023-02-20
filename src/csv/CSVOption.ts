export class CSVOption {
  public includeHeader = true;
  public fieldSep = ',';
  public recordSep = '\n';
  public quoteChar = '"';

  public _fieldAndRecord = this.fieldSep + this.recordSep;

  public setFieldSep(fieldSep: string) { this.fieldSep = fieldSep; return this.buildTerm(); }
  public setRecordSep(recordSep: string) { this.recordSep = recordSep; return this.buildTerm(); }
  public setQuoteChar(quoteChar: string) { this.quoteChar = quoteChar; return this; }
  public setIncludeHeader(includeHeader: boolean) { this.includeHeader = includeHeader; return this; }

  public buildTerm() {
    this._fieldAndRecord = this.fieldSep + this.recordSep;
    return this;
  }
}
