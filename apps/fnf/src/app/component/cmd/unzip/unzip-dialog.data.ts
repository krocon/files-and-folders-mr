export class UnzipDialogData {

  constructor(
    public source: string,
    public folderName: string = '',
    public existingSubdirectories: string[] = []
  ) {
  }
}
