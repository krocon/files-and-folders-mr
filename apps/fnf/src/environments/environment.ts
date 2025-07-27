// This file-content can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file-content replacements can be found in `angular.json`.

const prefix = 'http://localhost:3333';

export const environment = {
  production: false,
  version: '27.07.2025 15:29',
  commitHash: 'f8e7f6b',

  config: {
    apiUrl: prefix + "/api/config"
  },
  sysinfo: {
    getDrivesUrl: prefix + "/api/drives",
    getSysinfoUrl: prefix + "/api/sysinfo",
    getAllinfoUrl: prefix + "/api/allinfo",
    getFirstStartFolderUrl: prefix + "/api/firststartfolder"
  },
  fileSystem: {
    checkPathUrl: prefix + "/api/checkpath",
    filterExistsUrl: prefix + "/api/filterexists",
    readDirUrl: prefix + "/api/readdir",
    defaultRoot: "/",
    fileWatcher: false
  },
  multiRename: {
    convertnamesUrl: prefix + "/api/ai/convertnames",
    groupfilesUrl: prefix + "/api/ai/groupfiles",
    hasOpenAiApiKeyUrl: prefix + "/api/ai/hasopenaiapikey"
  },
  checkGlob: {
    apiUrl: prefix + "/api/checkglob"
  },
  clean: {
    apiUrl: prefix + "/api/clean"
  },
  shell: {
    shellUrl: prefix + "/api/shell",
    spawnUrl: prefix + "/api/spawn",
    cancelSpawnUrl: prefix + "/api/cancelspawn",
  },
  walkdir: {
    apiUrl: prefix + "/api/walkdirsync",
    syncMode: true
  },
  shellAutocomplete: {
    autocompleteUrl: prefix + "/api/shell-autocomplete"
  },

  lookAndFeel: {
    apiUrl: prefix + "/api/themes"
  },

  shortcut: {
    apiUrl: prefix + "/api/shortcuts"
  },
  filetypeExtensions: {
    apiUrl: prefix + "/api/filetypes"
  },
  searchPatterns: {
    apiUrl: prefix + "/api/searchpatterns"
  },
  edit: {
    apiUrl: prefix + "/api/file?name=",
    saveFile: prefix + "/api/file?name="
  },
  fileAction: {
    url: prefix + "/api/do",
    multiUrl: prefix + "/api/do/multi",
  },
  gotoAnything: {
    apiUrl: prefix + "/api/findfolders"
  },
  tool: {
    loadUrl: prefix + "/api/tools",
    shellUrl: prefix + "/api/shell"
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
