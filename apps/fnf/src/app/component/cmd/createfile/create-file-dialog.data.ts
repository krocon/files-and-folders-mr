export class CreateFileDialogData {

  constructor(
    public source: string,
    public folderName: string = '',
    public existingFilesOrFolders: string[] = []
  ) {
  }
}
