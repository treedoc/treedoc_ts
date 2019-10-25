import Bookmark from './Bookmark';
import CharSource from './CharSource';

export default class ParseRuntimeException extends Error {
  public constructor(message: string, public readonly bookmark: Bookmark, public readonly digest: string) {
    super(message + ', ' + bookmark + ', digest:' + digest);
    this.bookmark = bookmark;
    this.digest = digest;
  }

  public getBookmark() {
    return this.bookmark.clone();
  }
}
