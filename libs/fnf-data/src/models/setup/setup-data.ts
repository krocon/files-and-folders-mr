export class SetupData {
  public readonly openAboutInNewWindow: boolean;
  public readonly openSetupInNewWindow: boolean;
  public readonly openServerShellInNewWindow: boolean;
  public readonly openManageShortcutsInNewWindow: boolean;
  public readonly loadFolderSizeAfterSelection: boolean;
  public readonly condensedPresentationStyle: boolean;

  constructor(
    openAboutInNewWindow: boolean = false,
    openSetupInNewWindow: boolean = false,
    openServerShellInNewWindow: boolean = true,
    openManageShortcutsInNewWindow: boolean = true,
    loadFolderSizeAfterSelection: boolean = false,
    condensedPresentationStyle: boolean = false
  ) {
    this.openAboutInNewWindow = openAboutInNewWindow;
    this.openSetupInNewWindow = openSetupInNewWindow;
    this.openServerShellInNewWindow = openServerShellInNewWindow;
    this.openManageShortcutsInNewWindow = openManageShortcutsInNewWindow;
    this.loadFolderSizeAfterSelection = loadFolderSizeAfterSelection;
    this.condensedPresentationStyle = condensedPresentationStyle;
  }

  static getDefaults(): SetupData {
    return new SetupData();
  }

  toJSON(): any {
    return {
      openAboutInNewWindow: this.openAboutInNewWindow,
      openSetupInNewWindow: this.openSetupInNewWindow,
      openServerShellInNewWindow: this.openServerShellInNewWindow,
      openManageShortcutsInNewWindow: this.openManageShortcutsInNewWindow,
      loadFolderSizeAfterSelection: this.loadFolderSizeAfterSelection,
      condensedPresentationStyle: this.condensedPresentationStyle
    };
  }

  static fromJSON(json: any): SetupData {
    return new SetupData(
      json.openAboutInNewWindow ?? false,
      json.openSetupInNewWindow ?? false,
      json.openServerShellInNewWindow ?? true,
      json.openManageShortcutsInNewWindow ?? true,
      json.loadFolderSizeAfterSelection ?? false,
      json.condensedPresentationStyle ?? false
    );
  }
}