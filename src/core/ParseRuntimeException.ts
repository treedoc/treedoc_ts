import { Bookmark } from '../Bookmark';

export class ParseRuntimeException extends Error {
  public readonly partialObject?: any;
  public readonly causedBy?: Error;

  public constructor(
    message: string,
    public readonly bookmark: Bookmark,
    public readonly digest: string,
    cause?: Error,
    partialObject?: any,
  ) {
    super(message + ', ' + bookmark + ', digest:' + digest);
    this.bookmark = bookmark;
    this.digest = digest;
    this.partialObject = partialObject;
    this.causedBy = cause;
  }

  public getBookmark() {
    return this.bookmark.clone();
  }
}
