export default class EOFRuntimeException {
  public readonly message: string;
  public constructor(message = "") {
    this.message = message;
  }
}