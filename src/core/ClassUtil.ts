export default class ClassUtil {
 /**
  * To Simple Object without type. It will to convert str into null, boolean, double, long or Integer.
  * For number, it supports Hex number with prefix of "0x". If conversion fails. It will return the original str.
  */
  public static toSimpleObject(str: string): number | boolean | string | null {
    if ("null" === str)
      return null;
    if ("true" === str)
      return true;
    if ("false" === str)
      return false;
    return this.tryToNumber(str);
  }

  private static tryToNumber(str: string): number | boolean | string {
    if (str.length > 0) {
      if (str.startsWith("0x") || str.startsWith(("0X")))
        return this.parseNumber(str.substring(2), true);
      const c = str.charAt(0);
      if (c === '-' || c === '+' || c === '.' || (c >= '0' && c <= '9'))
        return this.parseNumber(str, false);
    }
    return str;
  }

  private static parseNumber(str: string, isHex: boolean): number | string {
    if (str.indexOf('.') !== str.lastIndexOf('.'))  // More than 2 `.`, javascript parseInt won't complain
      return str;

    const isDouble = !isHex && str.indexOf('.') >= 0;
    const num = isDouble ? parseFloat(str) : parseInt(str, isHex ? 16 : 10);
    return Number.isNaN(num) || (!isDouble && num > Number.MAX_SAFE_INTEGER) ? str : num;
  }
}