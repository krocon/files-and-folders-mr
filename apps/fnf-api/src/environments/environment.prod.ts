// Define a function to get environment variables at runtime
import {join} from "path";

const getEnvironmentVariables = () => {

  const label = 'prod';
  const version = '26.07.2025 18:27';
  const commitHash = 'a8089b6';

  const frontendPort = process.env.frontendPort ? Number(process.env.frontendPort) : 4201;
  const websocketPort = process.env.websocketPort ? Number(process.env.websocketPort) : 3334;

  const shortcutsDefaultsPath = join(__dirname, '../../..', 'fnf-api/assets/shortcut/defaults');
  const shortcutsCustomPath = join(__dirname, '../../..', 'fnf-api/assets/shortcut/custom');

  const colorDefaultsPath = join(__dirname, '../../..', 'fnf-api/assets/color/defaults')
  const colorCustomPath = join(__dirname, '../../..', 'fnf-api/assets/color/custom');

  const filetypeDefaultsPath = join(__dirname, '../../..', 'fnf-api/assets/filetype/defaults')
  const filetypeCustomPath = join(__dirname, '../../..', 'fnf-api/assets/filetype/custom');

  const toolDefaultsPath = join(__dirname, '../../..', 'fnf-api/assets/tool/defaults')
  const toolCustomPath = join(__dirname, '../../..', 'fnf-api/assets/tool/custom');

  const openaiApiKey = process.env.FNF_OPENAI_API_KEY || '';
  const openaiApiUrl = process.env.FNF_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const openaiModel = process.env.FNF_OPENAI_MODEL || 'gpt-4';

  const llamaApiKey = process.env.FNF_LLAMA_API_KEY || '';
  const llamaApiUrl = process.env.FNF_LLAMA_API_URL || 'http://localhost:11434/api/generate';
  const llamaModel = process.env.FNF_LLAMA_MODEL || 'llama3';
  const aiCompletionService = process.env.FNF_AI_COMPLETION_SERVICE || 'openai';

  return {
    label,
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

    toolDefaultsPath,
    toolCustomPath,

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
  production: true,

  get label() {
    return getEnvironmentVariables().label;
  },
  get frontendPort() {
    return getEnvironmentVariables().frontendPort;
  },
  get websocketPort() {
    return getEnvironmentVariables().websocketPort;
  },
  get openaiApiKey() {
    return getEnvironmentVariables().openaiApiKey;
  },

  get shortcutsDefaultsPath() {
    return getEnvironmentVariables().shortcutsDefaultsPath;
  },
  get shortcutsCustomPath() {
    return getEnvironmentVariables().shortcutsCustomPath;
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
    const {frontendPort, websocketPort} = getEnvironmentVariables();
    return {
      cors: {
        origin: [
          '*',
          'http://localhost:4200',
          'http://localhost:3333',
          'http://localhost:' + process.env.PORT,
          'http://localhost:' + frontendPort,
          'http://localhost:' + websocketPort,
        ],
        methods: ["GET", "POST"],
      }
    };
  }
};
