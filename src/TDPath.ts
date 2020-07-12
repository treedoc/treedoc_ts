import TDNode from './TDNode';

export enum PathPartType {
  ROOT,
  CHILD,
  RELATIVE,
  ID,
}

export class Part {
  public key?: string; // Only for Type.CHILD or TYPE.ID
  public level?: number; // Only for RELATIVE
  constructor(public readonly type: PathPartType) {}
  public setKey(key: string) {
    this.key = key;
    return this;
  }
  public setLevel(level: number) {
    this.level = level;
    return this;
  }
  public static ofId(id: string): Part {
    return new Part(PathPartType.ID).setKey(id);
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

export default class TDPath {
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
        path.addParts(Part.ofId(s.substring(1)));
      else 
        path.addParts(Part.ofChild(s));
    }
    return path;
  }
}
