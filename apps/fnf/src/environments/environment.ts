// This file-content can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file-content replacements can be found in `angular.json`.

const prefix = 'http://localhost:3333';
const apiPrefix = prefix + "/api";

export const environment = {
  production: false,
  version: '31.07.2025 09:56',
  commitHash: '70b27de',

  config: {
    apiUrl: apiPrefix + "/config"
  },
  sysinfo: {
    getDrivesUrl: apiPrefix + "/drives",
    getSysinfoUrl: apiPrefix + "/sysinfo",
    getAllinfoUrl: apiPrefix + "/allinfo",
    getFirstStartFolderUrl: apiPrefix + "/firststartfolder"
  },
  fileSystem: {
    checkPathUrl: apiPrefix + "/checkpath",
    filterExistsUrl: apiPrefix + "/filterexists",
    readDirUrl: apiPrefix + "/readdir",
    getfileattributesUrl: apiPrefix + "/getfileattributes",
    setfileattributesUrl: apiPrefix + "/setfileattributes",
    defaultRoot: "/",
    fileWatcher: false
  },
  multiRename: {
    convertnamesUrl: apiPrefix + "/ai/convertnames",
    groupfilesUrl: apiPrefix + "/ai/groupfiles",
    hasOpenAiApiKeyUrl: apiPrefix + "/ai/hasopenaiapikey"
  },
  checkGlob: {
    apiUrl: apiPrefix + "/checkglob"
  },
  clean: {
    apiUrl: apiPrefix + "/clean"
  },
  shell: {
    shellUrl: apiPrefix + "/shell",
    spawnUrl: apiPrefix + "/spawn",
    cancelSpawnUrl: apiPrefix + "/cancelspawn",
  },
  walkdir: {
    apiUrl: apiPrefix + "/walkdirsync",
    syncMode: true
  },
  shellAutocomplete: {
    autocompleteUrl: apiPrefix + "/shell-autocomplete"
  },

  configThemes: {
    apiUrl: apiPrefix + "/themes"
  },

  shortcut: {
    apiUrl: apiPrefix + "/shortcuts"
  },
  filetypeExtensions: {
    apiUrl: apiPrefix + "/filetypes"
  },
  buttons: {
    apiUrl: apiPrefix + "/buttons"
  },
  searchPatterns: {
    apiUrl: apiPrefix + "/searchpatterns"
  },
  edit: {
    apiUrl: apiPrefix + "/file?name=",
    saveFile: apiPrefix + "/file?name="
  },
  fileAction: {
    url: apiPrefix + "/do",
    multiUrl: apiPrefix + "/do/multi",
  },
  gotoAnything: {
    apiUrl: apiPrefix + "/findfolders"
  },
  tool: {
    loadUrl: apiPrefix + "/tools",
    shellUrl: apiPrefix + "/shell"
  },
  download: {
    downloadUrl: apiPrefix + "/download"
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
