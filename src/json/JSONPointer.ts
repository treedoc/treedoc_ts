import TDPath, { Part } from '../TDPath';
import { TDNode } from '../index';

/**
 * <pre>
 * Implementation of JSONPointer with following specs and extensions
 *
 * 1. swagger spec of ref: https://swagger.io/docs/specification/using-ref/
 * 2. relative json pointer: https://json-schema.org/draft/2019-09/relative-json-pointer.html
 * 3. json-schema using id with ref: https://json-schema.org/understanding-json-schema/structuring.html#using-id-with-ref
 *
 * Different from specs:
 * 1. Doesn't support tailing # to indicate the key. Which is not necessary
 * 2. Support ".." as parent, "." as current relative node
 *
 * Examples:
 * 1. URL + Anchor:  http://a.com/path#/p1/p2
 * 2. URL only:  http://a.com
 * 3. Anchor only:  #/p1/p2
 * 4. Relative with number: 2/p1/p2
 * 5. Relative with anchor: ../p1/p2
 * 6. Anchor with $id reference:  [http://a.com/path]#nodeId
 * </pre>
 */
export default class JSONPointer {
  public static get(): JSONPointer {
    return new JSONPointer();
  }

  public parse(str: string): TDPath {
    const path = new TDPath();
    if (!str)
      return path;

    if (str.endsWith('#'))
      // Ignore the last # which indicate "key" of the map
      str = str.substring(0, str.length - 1);

    if (str.indexOf('#') < 0) {
      if (this.parseParts(str, path, true))
        return path;
      path.docPath = str;
      path.addParts(Part.ofRoot());
    } else {
      const strs = str.split('#');
      if (strs[0])
        path.docPath = strs[0];
      this.parseParts(strs[1], path, false);
    }

    return path;
  }

  private parseParts(str: string, path: TDPath, relativeWithNum: boolean): boolean {
    const parts = str.split('/');
    if (relativeWithNum) {
      const level = Number.parseInt(parts[0]);
      if (Number.isNaN(level))
        return false;
      path.addParts(Part.ofRelative(level));
    } else {
      if (!parts[0])
        path.addParts(Part.ofRoot());
      else if ('.' === parts[0]) 
        path.addParts(Part.ofRelative(0));
      else if ('..' === parts[0])
        path.addParts(Part.ofRelative(1));
      else
        path.addParts(Part.ofChildOrId(parts[0], parts[0]));
    }

    for (let i = 1; i < parts.length; i++) {
      path.addParts(this.parsePart(parts[i]));
    }
    return true;
  }

  private parsePart(str: string): Part {
    str = str.replace('~1', '/').replace('~0', '~');
    return Part.ofChild(str);
  }

  public query(node: Readonly<TDNode>, path: string): TDNode | null {
    return node.getByPath(this.parse(path));
  }
}
