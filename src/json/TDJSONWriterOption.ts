export default class TDJSONWriterOption {
  private mIndentFactor = 0;
  public alwaysQuoteName = true;
  public quoteChar = '"';
  /** @internal */
  public indentStr = ''; // Used internally

  public set indentFactor(indentFactor: number) {
    this.mIndentFactor = indentFactor;
    this.indentStr = ' '.repeat(this.mIndentFactor);
  }

  public get indentFactor() { return this.mIndentFactor}

  public setIndentFactor(indentFactor: number) {
    this.indentFactor = indentFactor;
    return this;
  }

  public setIndentStr(str: string) {
    this.indentStr = str;
    return this;
  }

  public setAlwaysQuoteName(alwaysQuoteName: boolean) {
    this.alwaysQuoteName = alwaysQuoteName;
    return this;
  }

  public setQuoteChar(quoteChar: string) {
    this.quoteChar = quoteChar;
    return this;
  }

  public hasIndent() {
    return this.indentStr.length > 0;
  }
}
