const apiPrefix1 = `${location.protocol}//${location.hostname}:3333/api`;

export const environment = {

  version: '10.08.2025 12:36',
  commitHash: '66df9f3',

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
  setup: {
    apiUrl: apiPrefix1 + "/setup"
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
  tools: {
    apiUrl: apiPrefix1 + "/tools"
  },
  download: {
    downloadUrl: apiPrefix1 + "/download"
  }
};

