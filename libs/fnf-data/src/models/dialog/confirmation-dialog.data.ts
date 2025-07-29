export class ConfirmationDialogData {
  public readonly message: string;

  constructor(
    public title: string,
    message: string | string[]
  ) {
    this.message = Array.isArray(message) ? message.join('\n') : message;
  }
} 