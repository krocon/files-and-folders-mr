export const environment = {
  production: true,
  version: '28.07.2025 15:41',
  commitHash: '0d6f25c',

  config: {
    apiUrl: "/api/config"
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
    apiUrl: "/api/checkglob"
  },
  clean: {
    apiUrl: "/api/clean"
  },
  shell: {
    shellUrl: "/api/shell",
    spawnUrl: "/api/spawn",
    cancelSpawnUrl: "/api/cancelspawn",
  },
  walkdir: {
    apiUrl: "/api/walkdirsync",
    syncMode: true
  },

  shellAutocomplete: {
    autocompleteUrl: "/api/shell-autocomplete"
  },
  configThemes: {
    apiUrl: "/api/themes"
  },
  shortcut: {
    apiUrl: "/api/shortcuts"
  },
  filetypeExtensions: {
    apiUrl: "/api/filetypes"
  },
  buttons: {
    apiUrl: "/api/buttons"
  },
  searchPatterns: {
    apiUrl: "/api/searchpatterns"
  },
  edit: {
    apiUrl: "api/file?name=",
    saveFile: "api/file?name="
  },
  fileAction: {
    url: "api/do",
    multiUrl: "api/do/multi",
  },
  gotoAnything: {
    apiUrl: "api/findfolders"
  },
  tool: {
    loadUrl: "api/tools",
    shellUrl: "api/shell"
  }
};
