export default class TDJSONWriterOption {
  public indentFactor = 0;
  public alwaysQuoteName = true;
  public quoteChar = '"';
  /** @internal */
  public indentStr = "";  // Used internally

  public setIndentFactor(indentFactor: number): TDJSONWriterOption {
    this.indentFactor = indentFactor;
    this.indentStr = ' '.repeat(this.indentFactor);
    return this;
  }

  public setAlwaysQuoteName(alwaysQuoteName : boolean) {
    this.alwaysQuoteName = alwaysQuoteName;
    return this;
  }

  public setQuoteChar(quoteChar: string) {
    this.quoteChar = quoteChar;
    return this;
  }
}