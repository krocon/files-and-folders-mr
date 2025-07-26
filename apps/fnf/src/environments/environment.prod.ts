export const environment = {
  production: true,
  version: '26.07.2025 18:27',
  commitHash: 'a8089b6',

  config: {
    getUrl: "/api/config"
  },
  sysinfo: {
    getDrivesUrl: "/api/drives",
    getSysinfoUrl: "/api/sysinfo",
    getAllinfoUrl: "/api/allinfo",
    getFirstStartFolderUrl: "/api/firststartfolder"
  },
  fileSystem: {
    checkPathUrl: "/api/checkpath",
    filterExistsUrl: "/api/filterexists",
    readDirUrl: "/api/readdir",
    defaultRoot: "/",
    fileWatcher: false
  },
  multiRename: {
    convertnamesUrl: "/api/ai/convertnames",
    groupfilesUrl: "/api/ai/groupfiles",
    hasOpenAiApiKeyUrl: "/api/ai/hasopenaiapikey"
  },
  checkGlob: {
    checkGlobUrl: "/api/checkglob"
  },
  clean: {
    cleanUrl: "/api/clean"
  },
  shell: {
    shellUrl: "/api/shell",
    spawnUrl: "/api/spawn",
    cancelSpawnUrl: "/api/cancelspawn",
  },
  walkdir: {
    walkdirSyncUrl: "/api/walkdirsync",
    syncMode: true
  },

  shellAutocomplete: {
    autocompleteUrl: "/api/shell-autocomplete"
  },
  lookAndFeel: {
    getApiUrl: "/api/themes"
  },
  shortcut: {
    getShortcutApiUrl: "/api/shortcuts"
  },
  filetypeExtensions: {
    getApiUrl: "/api/filetypes"
  },
  searchPatterns: {
    getApiUrl: "/api/searchpatterns"
  },
  edit: {
    getFile: "api/file?name=",
    saveFile: "api/file?name="
  },
  fileAction: {
    url: "api/do",
    multiUrl: "api/do/multi",
  },
  gotoAnything: {
    findFoldersUrl: "api/findfolders"
  },
  tool: {
    loadUrl: "api/tools",
    shellUrl: "api/shell"
  }
};
