export class Bookmark {
  public constructor(public line: number = 0, public col: number = 0, public pos: number = 0) {}

  public append(c: string): string {
    this.pos++;
    this.col++;
    if (c === '\n') {
      this.line++;
      this.col = 0;
    }
    return c;
  }

  public clone() {
    return new Bookmark(this.line, this.col, this.pos);
  }

  public toString() {
    return `Bookmark(line=${this.line}, col=${this.col}, pos=${this.pos})`;
  }
}
