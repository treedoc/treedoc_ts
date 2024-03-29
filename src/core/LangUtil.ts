export type Constructor = (...args: any[]) => any;  // Add just to avoid JS Lint complain

export class LangUtil {
  public static doIfNotNull<T>(obj: T | undefined, action: (obj: T) => void) { if (obj !== undefined && obj !== null)  action(obj); }
  public static doIfNotNullOrElse<T>(obj: T | undefined, action: (obj: T) => void, elseAction: () => void) { 
    obj !== undefined && obj !== null ?  action(obj) : elseAction();
  }

  public static doIf(condition: boolean, action: () => void) { if (condition) action(); }
  public static doIfOrElse(condition: boolean, action: () => void, elseAction: () => void) { condition ? action() : elseAction(); }

  public static orElse<T>(value: T | null | undefined, fullBack: T): T {
    return value === null || value === undefined ? fullBack : value;
  }


// TS_SPECIFIC
  public static EnumValues(enumType: any) {
    return Object.keys(enumType).filter(key => !isNaN(Number(enumType[key])));
  }

  public staticEnumsValueOf(enumType: any, value: number|string) {
    return enumType[value];
  }

  /**
   * Deep merge two objects.
   * Reference:  https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
   */
  static mergeDeep<T>(target: T, ...sources: any): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (LangUtil.isObject(target) && LangUtil.isObject(source)) {
      for (const key in source) {
        if (LangUtil.isObject(source[key])) {
          if (!(target as any)[key]) Object.assign(target, { [key]: {} });
          LangUtil.mergeDeep((target as any)[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return LangUtil.mergeDeep(target, ...sources);
  }

  static isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  static isNumber(value: any) {
    return typeof value === 'number' && isFinite(value);
  }

  /** 
   * It will do eval first, if it returns function, that's it.
   * otherwise wrap it in `(${args}) => ${script}` or `(${args}) => {${script}}`
   */

  static evalAsFunction(script: string, args: string): Function { // tslint:disable-line
    let res = LangUtil.tryEval(script);
    if (typeof(res) === 'function')
      return res;
    res = LangUtil.tryEval(`(${args}) => ${script}`);
    if (typeof(res) === 'function')
      return res;
    return eval(`(${args}) => {${script}}`);
  }
  
  static tryEval(script: string): Function | undefined {  // tslint:disable-line
    try {
      return eval(script);
    } catch(e) {
      return undefined;
    }
  }
  
  static compare(o1: any, o2: any): number {
    return o1 > o2 ? 1 : (o1 < o2 ? -1 : 0)
  }

  static get<V, F>(o: V, identifier: Identifier<V, F>): F {
    return typeof(identifier) === 'function' ? identifier(o) : (o as any)[identifier];
  }

  // TS_SPECIFIC
  static enumValues(enumType: any) {
    return Object.keys(enumType).filter(key => !isNaN(Number(enumType[key])));
  }

  static enumValueOf(enumType: any, value: number|string) {
    return enumType[value];
  }
}


export type RecursivePartial<T> = {
  [P in keyof T]?:
    T[P] extends Array<(infer U)> ? Array<RecursivePartial<U>> :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P];
};

export type Predicate<T=any> = (i: T) => boolean;
export type Comparator<T=any> = (o1: T, o2: T) => number;
export type Identifier<V=any, F=any> = string | Func<V, F>;

export type Func<TI,TO> = (o: TI)=> TO;
export const identity = (o: any) => o;

export class ExtendedFields {
  [key:string]: Func<any, any>;
}
