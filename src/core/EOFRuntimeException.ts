export class EOFRuntimeException extends Error {
  readonly _type = 'EOFRuntimeException';

  public constructor(message = '') {
    super(message);
    Object.setPrototypeOf(this, EOFRuntimeException.prototype);
  }

  static is(e: any): e is EOFRuntimeException {
    return e != null && e._type === 'EOFRuntimeException';
  }
}
