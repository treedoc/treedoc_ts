export default class ListUtil {
  public static exists<V>(source: V[], pred: (t: V) => boolean): boolean {
    return source == null ? false : this.first(source, pred) !== undefined;
  }

  public static first<V>(source: V[], pred: (t: V) => boolean): V | undefined {
    if (source != null)
      for (const s of source)
        if (pred(s))
          return s;
    return undefined;
  }

  public static map<V, TV>(source: { [key: string]: V } | null, keyFunc: (k: string) => string, valFunc: (v: V) => TV): { [key: string]: TV } | null {
    if (source == null)
      return null;
    const result: { [key: string]: TV } = {};
    for (const k of Object.keys(source)) 
      result[keyFunc(k)] = valFunc(source[k]);
    return result;
  }

  public static mapKey<V>(source: { [key: string]: V } | null, keyFunc: (k: string) => string): { [key: string]: V } | null {
    return this.map(source, keyFunc, v => v);
  }
}