import Bookmark from '../Bookmark';
import Predicate from './Predicate';
import StringBuilder from './StringBuilder';
import EOFRuntimeException from './EOFRuntimeException';
import ParseRuntimeException from './ParseRuntimeException';

export default abstract class CharSource {
  private static readonly MAX_STRING_LEN = 20000;
  // HTML &nbsp; will be converted to \u00a0, that's why it need to be supported here
  private static readonly SPACE_RETURN_CHARS = ' \n\r\t\u00a0';

  protected readonly bookmark = new Bookmark();

  public abstract read(): string;
  public /*abstract*/ peek(i: number = 0) {
    return '';
  }
  public /*abstract*/ isEof(i: number = 0) {
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
  public abstract readUntil(
    predicate: Predicate<CharSource>,
    target: StringBuilder | null,
    minLen?: number,
    maxLen?: number,
  ): boolean;
  public skipUntil(predicate: Predicate<CharSource>): boolean {
    return this.readUntil(predicate, null);
  }

    /** @return true Terminal conditions matches  */
  public readUntilTerminatorToString(
    chars: string,
    target: StringBuilder | null,
    include = true,
    minLen = 0,
    maxLen = Number.MAX_VALUE,
  ) {
    return this.readUntil(s => chars.indexOf(s.peek(0)) >= 0 === include, target, minLen, maxLen);
  }

  /** @return true Terminal conditions matches  */
  public readUntilTerminator(chars: string, minLen = 0, maxLen = Number.MAX_VALUE): string {
    const sb = new StringBuilder();
    this.readUntilTerminatorToString(chars, sb, true, minLen, maxLen);
    return sb.toString();
  }

  /** @return true Terminal conditions matches  */
  public skipUntilTerminator(chars: string, include = true): boolean {
    return this.readUntilTerminatorToString(chars, null, include);
  }
  public skipSpacesAndReturns(): boolean {
    return this.skipUntilTerminator(CharSource.SPACE_RETURN_CHARS, false);
  }
  
  public skipChars(chars: string): boolean { return this.skipUntilTerminator(chars, false); }

  public readToString(target: StringBuilder | null, len: number): boolean {
    return this.readUntil(s => false, target, len, len);
  }

  public readString(len: number): string {
    const sb = new StringBuilder();
    this.readToString(sb, len);
    return sb.toString();
  }

  public skip(len = 1): boolean {
    return this.readToString(null, len);
  }

  public readUntilMatch(
    str: string,
    skipStr: boolean,
    target: StringBuilder | null,
    minLen = 0,
    maxLen = CharSource.MAX_STRING_LEN,
  ): boolean {
    const matches = this.readUntil(s => s.startsWidth(str), target, minLen, maxLen);
    if (matches && skipStr)
      this.skip(str.length);
    return matches;
  }

  public skipUntilMatch(str: string, skipStr: boolean): boolean {
    return this.readUntilMatch(str, skipStr, null);
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

  public startsWidth(str: string): boolean {
    if (this.isEof(str.length))
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
    return this.readQuotedToString(quote, new StringBuilder()).toString();
  }

  public readQuotedToString(quote: string, sb: StringBuilder): StringBuilder {
    const terminator = this.getTermStrWithQuoteAndEscape(quote);
    const pos = this.bookmark.pos;
    while (true) {
      if (!this.readUntilTerminatorToString(terminator, sb))
        throw new EOFRuntimeException("Can't find matching quote at position:" + pos);
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
