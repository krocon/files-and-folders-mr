const prefix = '';
const apiPrefix = prefix + "/api";

export const environment = {
  production: true,
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
