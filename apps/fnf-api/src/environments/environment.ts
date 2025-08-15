// Define a function to get environment variables at runtime
import {join} from "path";
import * as fs from "node:fs";


const getEnvironmentVariables = () => {

  const version = '15.08.2025 07:36';
  const commitHash = '28496f7';

  const dockerAssetPrefix = process.env.FNF_ASSETS_ROOT || '/usr/src/app/apps/fnf-api/assets';
  const assetsPrefix = fs.existsSync(dockerAssetPrefix) ? dockerAssetPrefix : join(__dirname, '..', 'src/assets');

  const frontendPort = process.env.frontendPort ? Number(process.env.frontendPort) : 4201;
  const websocketPort = process.env.websocketPort ? Number(process.env.websocketPort) : 3334;

  const shortcutsDefaultsPath = assetsPrefix + '/shortcut/defaults';
  const shortcutsCustomPath = assetsPrefix + '/shortcut/custom';

  const colorDefaultsPath = assetsPrefix + '/color/defaults'
  const colorCustomPath = assetsPrefix + '/color/custom';

  const filetypeDefaultsPath = assetsPrefix + '/filetype/defaults'
  const filetypeCustomPath = assetsPrefix + '/filetype/custom';

  const buttonDefaultsPath = assetsPrefix + '/button/defaults'
  const buttonCustomPath = assetsPrefix + '/button/custom';

  const searchPatternCustomPath = assetsPrefix + '/search/defaults'
  const searchPatternDefaultsPath = assetsPrefix + '/search/custom';

  const toolDefaultsPath = assetsPrefix + '/tool/defaults'
  const toolCustomPath = assetsPrefix + '/tool/custom';

  const promptDefaultsPath = assetsPrefix + '/prompt/defaults'
  const promptCustomPath = assetsPrefix + '/prompt/custom';

  const setupPath = assetsPrefix + '/setup';


  const openaiApiKey = process.env.FNF_OPENAI_API_KEY || '';
  const openaiApiUrl = process.env.FNF_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const openaiModel = process.env.FNF_OPENAI_MODEL || 'gpt-4';

  const llamaApiKey = process.env.FNF_LLAMA_API_KEY || '';
  const llamaApiUrl = process.env.FNF_LLAMA_API_URL || 'http://localhost:11434/api/generate';
  const llamaModel = process.env.FNF_LLAMA_MODEL || 'llama3';

  const aiCompletionService = process.env.FNF_AI_COMPLETION_SERVICE || 'openai';

  return {
    version,
    commitHash,
    frontendPort,
    websocketPort,

    shortcutsDefaultsPath,
    shortcutsCustomPath,

    colorDefaultsPath,
    colorCustomPath,

    filetypeDefaultsPath,
    filetypeCustomPath,

    buttonDefaultsPath,
    buttonCustomPath,

    searchPatternDefaultsPath,
    searchPatternCustomPath,

    toolDefaultsPath,
    toolCustomPath,

    promptDefaultsPath,
    promptCustomPath,

    setupPath,

    openaiApiKey,
    openaiApiUrl,
    openaiModel,
    llamaApiKey,
    llamaApiUrl,
    llamaModel,
    aiCompletionService
  };
};

// Create a dynamic environment object that gets values at runtime
export const environment = {
  production: false,

  get frontendPort() {
    return getEnvironmentVariables().frontendPort;
  },
  get websocketPort() {
    return getEnvironmentVariables().websocketPort;
  },
  get shortcutsDefaultsPath() {
    return getEnvironmentVariables().shortcutsDefaultsPath;
  },
  get shortcutsCustomPath() {
    return getEnvironmentVariables().shortcutsCustomPath;
  },

  get colorDefaultsPath() {
    return getEnvironmentVariables().colorDefaultsPath;
  },
  get colorCustomPath() {
    return getEnvironmentVariables().colorCustomPath;
  },
  get filetypeDefaultsPath() {
    return getEnvironmentVariables().filetypeDefaultsPath;
  },
  get filetypeCustomPath() {
    return getEnvironmentVariables().filetypeCustomPath;
  },

  get buttonDefaultsPath() {
    return getEnvironmentVariables().buttonDefaultsPath;
  },
  get buttonCustomPath() {
    return getEnvironmentVariables().buttonCustomPath;
  },

  get searchPatternDefaultsPath() {
    return getEnvironmentVariables().searchPatternDefaultsPath;
  },
  get searchPatternCustomPath() {
    return getEnvironmentVariables().searchPatternCustomPath;
  },

  get toolDefaultsPath() {
    return getEnvironmentVariables().toolDefaultsPath;
  },
  get toolCustomPath() {
    return getEnvironmentVariables().toolCustomPath;
  },

  get promptDefaultsPath() {
    return getEnvironmentVariables().promptDefaultsPath;
  },
  get promptCustomPath() {
    return getEnvironmentVariables().promptCustomPath;
  },

  get setupPath() {
    return getEnvironmentVariables().setupPath;
  },

  get openaiApiKey() {
    return getEnvironmentVariables().openaiApiKey;
  },
  get llamaApiKey() {
    return getEnvironmentVariables().llamaApiKey;
  },
  get aiCompletionService() {
    return getEnvironmentVariables().aiCompletionService;
  },
  get openaiApiUrl() {
    return getEnvironmentVariables().openaiApiUrl;
  },
  get openaiModel() {
    return getEnvironmentVariables().openaiModel;
  },
  get llamaApiUrl() {
    return getEnvironmentVariables().llamaApiUrl;
  },
  get llamaModel() {
    return getEnvironmentVariables().llamaModel;
  },
  get version() {
    return getEnvironmentVariables().version;
  },
  get commitHash() {
    return getEnvironmentVariables().commitHash;
  },
  get websocketOptions() {
    return {
      cors: {
        origin: true,
        credentials: false
      }
    };
  }
};
