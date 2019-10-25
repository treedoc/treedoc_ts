import Appendable from './Appendable';

export default class StringBuilder implements Appendable {
  private readonly strs = new Array<string>();
  private dirty = false;
  public constructor(private s = '') {
    if (s) this.strs.push(s);
  }

  public append(s: string) {
    if (s) {
      this.strs.push(s);
      this.dirty = true;
    }
    return this;
  }

  public toString() {
    if (this.dirty) {
      this.s = this.strs.join('');
      this.dirty = false;
    }
    return this.s;
  }
}
