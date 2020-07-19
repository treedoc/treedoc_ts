export default class TDJSONParserOption {
  public fieldSep = ',';
  public recordSep = '\n';
  public quoteChar = '"';

  public setFieldSep(fieldSep: string) { this.fieldSep = fieldSep; return this; }
  public setRecordSep(recordSep: string) { this.recordSep = recordSep; return this; }
  public setQuoteChar(quoteChar: string) { this.quoteChar = quoteChar; return this; }
}
