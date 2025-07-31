// This file-content can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file-content replacements can be found in `angular.json`.

const apiPort1 = 3333;
const prefix1 = `${location.protocol}//${location.hostname}:${apiPort1}`;

const apiPrefix1 = prefix1 + "/api";

export const environment = {
  production: false,
  version: '31.07.2025 09:56',
  commitHash: '70b27de',

  config: {
    apiUrl: apiPrefix1 + "/config"
  },
  sysinfo: {
    getDrivesUrl: apiPrefix1 + "/drives",
    getSysinfoUrl: apiPrefix1 + "/sysinfo",
    getAllinfoUrl: apiPrefix1 + "/allinfo",
    getFirstStartFolderUrl: apiPrefix1 + "/firststartfolder"
  },
  fileSystem: {
    checkPathUrl: apiPrefix1 + "/checkpath",
    filterExistsUrl: apiPrefix1 + "/filterexists",
    readDirUrl: apiPrefix1 + "/readdir",
    getfileattributesUrl: apiPrefix1 + "/getfileattributes",
    setfileattributesUrl: apiPrefix1 + "/setfileattributes",
    defaultRoot: "/",
    fileWatcher: false
  },
  multiRename: {
    convertnamesUrl: apiPrefix1 + "/ai/convertnames",
    groupfilesUrl: apiPrefix1 + "/ai/groupfiles",
    hasOpenAiApiKeyUrl: apiPrefix1 + "/ai/hasopenaiapikey"
  },
  checkGlob: {
    apiUrl: apiPrefix1 + "/checkglob"
  },
  clean: {
    apiUrl: apiPrefix1 + "/clean"
  },
  shell: {
    shellUrl: apiPrefix1 + "/shell",
    spawnUrl: apiPrefix1 + "/spawn",
    cancelSpawnUrl: apiPrefix1 + "/cancelspawn",
  },
  walkdir: {
    apiUrl: apiPrefix1 + "/walkdirsync",
    syncMode: true
  },
  shellAutocomplete: {
    autocompleteUrl: apiPrefix1 + "/shell-autocomplete"
  },

  configThemes: {
    apiUrl: apiPrefix1 + "/themes"
  },

  shortcut: {
    apiUrl: apiPrefix1 + "/shortcuts"
  },
  filetypeExtensions: {
    apiUrl: apiPrefix1 + "/filetypes"
  },
  buttons: {
    apiUrl: apiPrefix1 + "/buttons"
  },
  searchPatterns: {
    apiUrl: apiPrefix1 + "/searchpatterns"
  },
  prompt: {
    apiUrl: apiPrefix1 + "/prompts"
  },
  edit: {
    apiUrl: apiPrefix1 + "/file?name=",
    saveFile: apiPrefix1 + "/file?name="
  },
  fileAction: {
    url: apiPrefix1 + "/do",
    multiUrl: apiPrefix1 + "/do/multi",
  },
  gotoAnything: {
    apiUrl: apiPrefix1 + "/findfolders"
  },
  tool: {
    loadUrl: apiPrefix1 + "/tools",
    shellUrl: apiPrefix1 + "/shell"
  },
  download: {
    downloadUrl: apiPrefix1 + "/download"
  }
};

/*
 * For easier debugging in development mode, you can import the following file-content
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
