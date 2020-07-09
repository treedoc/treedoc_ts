import StringBuilder from './StringBuilder';

const C_ESC_CHAR = '\'"`\\\b\f\n\r\t';
const C_ESC_SYMB = '\'"`\\bfnrt';
const MIN_PRINTABLE_CHAR = ' ';

export default class StringUtil {
  public static isJavaIdentifier(str?: string | null): boolean {
    if (str == null || str.length < 1) return false;
    return !!str.match('^[a-zA-Z_$][0-9a-zA-Z_$]*$');
  }

  /**
   * Escape a String using the C style
   * e.g. for string "It's a example" escape to "It\'s a example");
   * This is used by (Java/Javascript/C/C++)Code generator
   *
   * @param str the string to be escaped
   * @param quoteChar The quote char
   * @return The escaped String
   */
  public static cEscape(str: string | null = '', quoteChar = '"'): string | null {
    if (!str) return str;

    // First scan to check if it needs escape just to avoid create new String object for better performance.
    for (let i = 0; ; i++) {
      if (i === str.length) return str;
      const c = str.charAt(i);
      if (c < MIN_PRINTABLE_CHAR || C_ESC_CHAR.indexOf(c) >= 0) break;
    }

    // Second scan, Do escape
    const result = new StringBuilder();
    for (let i = 0; i < str.length; i++) {
      const c = str.charAt(i);
      // check if it's a special printable char
      const idx = C_ESC_CHAR.indexOf(c);
      if (idx >= 3 || quoteChar === c) {
        // first 3 chars are quote chars
        result.append('\\');
        result.append(C_ESC_SYMB.charAt(idx));
      } else if (c < MIN_PRINTABLE_CHAR) {
        // check if it's a un-printable char
        result.append('\\u');
        result.append(
          c
            .charCodeAt(0)
            .toString(16)
            .padStart(4, '0'),
        );
      } else result.append(c);
    }
    return result.toString();
  }

  public static repeat(str: string, times: number) {
    return ''.padEnd(str.length * times, str);
  }
}
