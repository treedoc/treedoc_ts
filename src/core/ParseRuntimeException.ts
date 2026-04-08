import { Bookmark } from '../Bookmark';

export class ParseRuntimeException extends Error {
  readonly _type = 'ParseRuntimeException';
  public readonly partialObject?: any;
  public readonly causedBy?: Error;

  static is(e: any): e is ParseRuntimeException {
    return e != null && e._type === 'ParseRuntimeException';
  }

  public constructor(
    message: string,
    public readonly bookmark: Bookmark,
    public readonly digest: string,
    cause?: Error,
    partialObject?: any,
  ) {
    super(message + ', ' + bookmark + ', digest:' + digest);
    Object.setPrototypeOf(this, ParseRuntimeException.prototype);
    this.bookmark = bookmark;
    this.digest = digest;
    this.partialObject = partialObject;
    this.causedBy = cause;
  }

  public getBookmark() {
    return this.bookmark.clone();
  }
}
