import Bookmark from "./Bookmark";
import CharSource from "./CharSource";

export default class ParseRuntimeException {
  public readonly message: string;
  public readonly bookmark: Bookmark;
  public readonly digest: string;

  public constructor(message: string, bookmark: Bookmark, digest: string) {
    this.message = message;
    this.bookmark = bookmark;
    this.digest = digest;
  }

  public getBookmark() { return this.bookmark.clone(); }

  public getMessage(): string {
    return this.message + ", " + this.bookmark + ", digest:" + this.digest;
  }
}
