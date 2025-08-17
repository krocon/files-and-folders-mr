import {contextBridge, ipcRenderer} from 'electron';
import {z} from 'zod';


const ApiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  path: z.string().min(1),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

const OpenExternalSchema = z.object({url: z.string().url()});

const bridge = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  openExternal: (url: string): Promise<boolean> => {
    const parse = OpenExternalSchema.safeParse({url});
    if (!parse.success) return Promise.resolve(false);
    return ipcRenderer.invoke('app:openExternal', url);
  },
  apiRequest: (input: z.input<typeof ApiRequestSchema>): Promise<unknown> => {
    const parse = ApiRequestSchema.safeParse(input);
    if (!parse.success) {
      return Promise.resolve({ok: false, status: 400, error: 'Invalid request', issues: parse.error.issues});
    }
    const withDefaults = {method: 'GET', ...parse.data} as Required<z.infer<typeof ApiRequestSchema>>;
    return ipcRenderer.invoke('api:request', withDefaults);
  },
  util: {
    fixPath: (s: string): string => {
      if (!s) return '';
      s = s
        .replace(/\\/g, "/")
        .replace(/\/\//g, "/");
      if (s.length === 2 && s[1] === ':') {
        s = s + '/'; // c: -> c:/
      }
      return s;
    }
  }
} as const;

contextBridge.exposeInMainWorld('bridge', bridge);

export type Bridge = typeof bridge;
