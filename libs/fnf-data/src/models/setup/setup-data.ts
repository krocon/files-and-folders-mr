export class SetupData {


  constructor(
    public openAboutInNewWindow: boolean = false,
    public openSetupInNewWindow: boolean = false,
    public openServerShellInNewWindow: boolean = true,
    public openManageShortcutsInNewWindow: boolean = true,
    public loadFolderSizeAfterSelection: boolean = false,
    public condensedPresentationStyle: boolean = false
  ) {
  }

}