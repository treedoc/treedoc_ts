import Bookmark from "./Bookmark";
import CharSource from "./CharSource";

export default class ParseRuntimeException extends Error {
  public readonly bookmark: Bookmark;
  public readonly digest: string;

  public constructor(message: string, bookmark: Bookmark, digest: string) {
    super(message + ", " + bookmark + ", digest:" + digest);
    this.bookmark = bookmark;
    this.digest = digest;
  }

  public getBookmark() { return this.bookmark.clone(); }
}
