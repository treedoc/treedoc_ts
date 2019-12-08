import CharSource from './CharSource';
import EOFRuntimeException from './EOFRuntimeException';
import Predicate from './Predicate';
import StringBuilder from './StringBuilder';

export default class StringCharSource extends CharSource {
  public constructor(public readonly str: string) {
    super();
  }

  public read(): string {
    if (this.isEof(0)) throw new EOFRuntimeException();
    return this.bookmark.append(this.str.charAt(this.bookmark.pos));
  }

  public peek(i = 0) {
    if (this.isEof(i)) throw new EOFRuntimeException();
    return this.str.charAt(this.bookmark.pos + i);
  }

  public isEof(idx = 0) {
    return this.bookmark.pos + idx >= this.str.length;
  }

  public readUntil(
    predicate: Predicate<CharSource>,
    target: StringBuilder | null,
    minLen = 0,
    maxLen = Number.MAX_VALUE,
  ): boolean {
    const startPos = this.bookmark.pos;
    let len = 0;
    let matched = false;
    for (; len < maxLen && !this.isEof(); len++) {
      matched = len >= minLen && predicate(this);
      if (matched) break;
      this.read();
    }
    if (target != null) target.append(this.str.substr(startPos, len));
    return matched;
  }
}
