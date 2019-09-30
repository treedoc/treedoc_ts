export default class Bookmark {
  public line: number;
  public col: number;
  public pos: number;

  public constructor(line: number = 0, col: number = 0, pos: number = 0) {
    this.line = line;
    this.col = col;
    this.pos = pos;
  }

  public append(c: string): string {
    this.pos ++;
    this.col++;
    if(c === '\n'){
      this.line++;
      this.col =0;
    }
    return c;
  }

  public clone() {
    return new Bookmark(this.line, this.col, this.pos);
  }
}