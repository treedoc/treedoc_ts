import { Bookmark } from '../Bookmark';
import { Predicate } from './LangUtil';
import { StringBuilder } from './StringBuilder';
import { EOFRuntimeException } from './EOFRuntimeException';
import { ParseRuntimeException } from './ParseRuntimeException';

export abstract class CharSource {
  private static readonly MAX_STRING_LEN = 20000;
  // HTML &nbsp; will be converted to \u00a0, that's why it need to be supported here
  private static readonly SPACE_RETURN_CHARS = ' \n\r\t\u00a0';
  private static readonly SPACE_RETURN_COMMA_CHARS = CharSource.SPACE_RETURN_CHARS + ",";

  readonly bookmark = new Bookmark();

  public abstract read(): string;
  public /*abstract*/ peek(i = 0) {
    return '';
  }
  public /*abstract*/ isEof(i = 0) {
    return false;
  }

  public getBookmark() {
    return this.bookmark.clone();
  }

  /**
   * Skip chars until eof or length or predicate condition matches
   * If target is set, the skipped the chars will be saved in the target
   *
   * @return true The terminate condition matches. otherwise, could be EOF or length matches
   */
  public abstract readUntil(target: StringBuilder | null, predicate: Predicate<CharSource>, minLen?: number, maxLen?: number): boolean;
  public skipUntil(predicate: Predicate<CharSource>): boolean {
    return this.readUntil(null, predicate);
  }

    /** @return true Terminal conditions matches  */
  public readUntilTerminatorToString(target: StringBuilder | null, chars: string, strs: string[] | null = null, include = true, minLen = 0, maxLen = Number.MAX_VALUE) {
    return this.readUntil(target, s => (chars.indexOf(s.peek(0)) >= 0 || this.startsWithAny(strs)) === include, minLen, maxLen);
  }

  /** @return true Terminal conditions matches  */
  public readUntilTerminator(chars: string, strs: string[] | null = null, minLen = 0, maxLen = Number.MAX_VALUE): string {
    const sb = new StringBuilder();
    this.readUntilTerminatorToString(sb, chars, strs, true, minLen, maxLen);
    return sb.toString();
  }

  /** @return true Terminal conditions matches  */
  public skipUntilTerminator(chars: string, include = true): boolean {
    return this.readUntilTerminatorToString(null, chars, null, include);
  }
  /** @return true Indicates more character in the stream  */
  public skipSpacesAndReturns(): boolean { return this.skipUntilTerminator(CharSource.SPACE_RETURN_CHARS, false); }
  public skipSpacesAndReturnsAndCommas(): boolean { return this.skipUntilTerminator(CharSource.SPACE_RETURN_COMMA_CHARS, false); }
  /** @return true Indicates more character in the stream  */
  public skipChars(chars: string): boolean { return this.skipUntilTerminator(chars, false); }

  public readToString(target: StringBuilder | null, len: number): boolean {
    return this.readUntil(target, s => false, len, len);
  }

  public readString(len: number): string {
    const sb = new StringBuilder();
    this.readToString(sb, len);
    return sb.toString();
  }

  public skip(len = 1): boolean {
    return this.readToString(null, len);
  }

  public readUntilMatch(target: StringBuilder | null, str: string, skipStr: boolean, minLen = 0, maxLen = CharSource.MAX_STRING_LEN): boolean {
    const matches = this.readUntil(target, s => s.startsWith(str), minLen, maxLen);
    if (matches && skipStr)
      this.skip(str.length);
    return matches;
  }

  public skipUntilMatch(str: string, skipStr: boolean): boolean {
    return this.readUntilMatch(null, str, skipStr);
  }

  // TODO: performance optimization with string.substr()
  public peekString(len: number): string {
    const sb = new StringBuilder();
    for (let i = 0; i < len; i++) {
      if (this.isEof(i))
        break;
      sb.append(this.peek(i));
    }
    return sb.toString();
  }
  
  public startsWithAny(strs: string[] | null): boolean {
    if (strs != null) {
      for (const s of strs)
        if (this.startsWith(s))
          return true;
    }
    return false;
  }

  public startsWith(str: string): boolean {
    if (this.isEof(str.length - 1))
      return false;
    for (let i = 0; i < str.length; i++) {
      if (this.peek(i) !== str.charAt(i))
        return false;
    }
    return true;
  }

  // For performance, avoid creating String object every time
  private getTermStrWithQuoteAndEscape(quote: string): string {
    switch (quote) {
      case "'":
        return "\\'";
      case '"':
        return '\\"';
      case '`':
        return '\\`';
      default:
        return '\\';
    }
  }

  public readQuotedString(quote: string): string {
    return this.readQuotedToString(new StringBuilder(), quote).toString();
  }

  public readQuotedToString(sb: StringBuilder, quote: string): StringBuilder {
    const terminator = this.getTermStrWithQuoteAndEscape(quote);
    // Not calling getBookmark() to avoid clone an object
    const pos = this.bookmark.pos;
    const line = this.bookmark.line;
    const col = this.bookmark.col;
    while (true) {
      if (!this.readUntilTerminatorToString(sb, terminator))
        throw new EOFRuntimeException(`Can't find matching quote at position:${pos};line:${line};col:${col}`);
      let c = this.read();
      if (c === quote)
        break;

      // c should be '/', tt's a escape sequence
      c = this.read();
      switch (c) {
        case 'b':
          sb.append('\b');
          break;
        case 't':
          sb.append('\t');
          break;
        case 'n':
          sb.append('\n');
          break;
        case 'f':
          sb.append('\f');
          break;
        case 'r':
          sb.append('\r');
          break;
        case 'v':
          sb.append('\u000B');
          break;
        case 'u':
          const code = parseInt(this.readString(4), 16);
          if (Number.isNaN(code))
            throw this.createParseRuntimeException('Escaped unicode with invalid number: ' + code);
          sb.append(String.fromCharCode(code));
          break;
        case '\n':
        case '\r':
          break; // Assume it's a line continuation
        default:
          if (this.isOctDigit(c))
            sb.append(String.fromCharCode(this.readOctNumber(Number(c))));
          else sb.append(c);
      }
    }
    return sb;
  }

  private readOctNumber(num: number) {
    for (let i = 0; i < 2; i++) {
      const d = this.peek();
      if (!this.isOctDigit(d))
        break;
      const newNum = num * 8 + Number(d);
      if (newNum > 255)
        break;
      num = newNum;
      this.read();
    }
    return num;
  }

  private isOctDigit(c: string) {
    return '0' <= c && c <= '8';
  }

  public createParseRuntimeException(message: string) {
    return new ParseRuntimeException(message, this.getBookmark(), this.peekString(10));
  }
}
