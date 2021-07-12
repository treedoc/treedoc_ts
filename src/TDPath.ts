import { TDNode } from './TDNode';

export enum PathPartType {
  ROOT,
  CHILD,
  RELATIVE,
  CHILD_OR_ID,   // child or id, it will first try to find child by the key, then fallback to id.
}

export class Part {
  public key?: string; // Only for Type.CHILD or CHILD_OR_ID
  public id?: string;   // Only for CHILD_OR_ID
  public level?: number; // Only for RELATIVE

  constructor(public readonly type: PathPartType) {}
  public setKey(key: string) {
    this.key = key;
    return this;
  }
  public setId(id: string) {
    this.id = id;
    return this;
  }
  public setLevel(level: number) {
    this.level = level;
    return this;
  }
  public static ofChildOrId(key: string, id: string): Part {
    return new Part(PathPartType.CHILD_OR_ID).setKey(key).setId(id);
  }
  public static ofChild(key: string): Part {
    return new Part(PathPartType.CHILD).setKey(key);
  }
  public static ofRelative(level: number): Part {
    return new Part(PathPartType.RELATIVE).setLevel(level);
  }
  public static ofRoot(): Part {
    return new Part(PathPartType.ROOT);
  }
}

export class TDPath {
  /** The path parts */
  public readonly parts: Part[] = [];
  public addParts(...part: Part[]): TDPath {
    this.parts.push(...part);
    return this;
  }

  public constructor(
    /** The TreeDoc file path or URL, it could absolution or relative */
    public docPath: string | null = null,
  ) {}

  public static parse(str: string | string[]): TDPath {
    if (typeof str === 'string')
      str = str.split('/');

    if (str.length === 0)
      return new TDPath().addParts(Part.ofRelative(0));

    const path = new TDPath();
    for (const s of str) {
      if ('.' === s)
        path.addParts(Part.ofRelative(0));
      else if ('..' === s)
        path.addParts(Part.ofRelative(1));
      else if (s === '' || s === '#')
        path.addParts(Part.ofRoot());
      else if (s.startsWith('#') && s.length > 0)
        path.addParts(Part.ofChildOrId(s, s.substring(1)));
      else 
        path.addParts(Part.ofChild(s));
    }
    return path;
  }
}
