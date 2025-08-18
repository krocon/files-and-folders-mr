import {app, BrowserWindow, globalShortcut, protocol, session, shell} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {z} from 'zod';
import {createServer} from 'node:http';

// Load .env early so process.env is populated (dev and packaged)
(function loadEnv() {
  try {
    const candidates = [
      path.resolve(__dirname, '../.env'),
      path.resolve(process.cwd(), '.env'),
      (process.resourcesPath ? path.join(process.resourcesPath, '.env') : '')
    ].filter(Boolean) as string[];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, 'utf8');
        let count = 0;
        for (const raw of text.split(/\r?\n/)) {
          const line = raw.replace(/^\uFEFF/, '').trim();
          if (!line || line.startsWith('#')) continue;
          const eq = line.indexOf('=');
          if (eq === -1) continue;
          const key = line.slice(0, eq).trim();
          let val = line.slice(eq + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
            val = val.slice(1, -1);
          }
          if (!(key in process.env)) {
            process.env[key] = val;
            count++;
          }
        }
        console.log(`[main] Loaded ${count} env var(s) from ${p}`);
        break;
      }
    }
  } catch (e) {
    console.warn('[main] Failed to load .env file', e);
  }
})();

const isDev = !app.isPackaged && process.env.FNF_DEV_SERVER_URL != null;
const DEV_URL = process.env.FNF_DEV_SERVER_URL || 'http://localhost:4200';
const API_URL = process.env.FNF_API_URL || 'http://localhost:3333';
const enableDevTools = isDev || ['1', 'true', 'yes', 'on'].includes((process.env.FNF_ENABLE_DEVTOOLS || '').toLowerCase());

let mainWindow: BrowserWindow | null = null;

const DESKTOP_HTTP_HOST = process.env.FNF_DESKTOP_HTTP_HOST || '127.0.0.1';
const DESKTOP_HTTP_PORT = Number.parseInt(process.env.FNF_DESKTOP_HTTP_PORT || '', 10) || 4765;

let httpServer: ReturnType<typeof createServer> | null = null;
let httpPort: number | null = null;

function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sendJson(res: any, status: number, payload: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readJson(req: any): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

async function startHttpServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    httpServer = createServer(async (req, res) => {
      try {
        setCorsHeaders(res);
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        const url = (req.url || '/').split('?')[0];

        if (req.method === 'GET' && url === '/app/version') {
          return sendJson(res, 200, {version: app.getVersion()});
        }

        if (req.method === 'POST' && url === '/app/open-external') {
          const body = await readJson(req);
          const u = body?.url;
          if (typeof u !== 'string') {
            return sendJson(res, 400, {ok: false, error: 'Invalid url'});
          }
          try {
            new URL(u);
          } catch {
            return sendJson(res, 400, {ok: false, error: 'Invalid url'});
          }
          try {
            await shell.openExternal(u);
            return sendJson(res, 200, {ok: true});
          } catch (e: any) {
            return sendJson(res, 500, {ok: false, error: e?.message || String(e)});
          }
        }

        if (req.method === 'POST' && url === '/api/request') {
          const input = await readJson(req);
          const parse = ApiRequestSchema.safeParse(input);
          if (!parse.success) {
            return sendJson(res, 400, {ok: false, status: 400, error: 'Invalid request', issues: parse.error.issues});
          }
          const {method, path: p, headers, body} = parse.data;
          const target = (API_URL.replace(/\/$/, '')) + (p.startsWith('/') ? p : '/' + p);
          try {
            const r = await fetch(target, {
              method,
              headers: {'Content-Type': 'application/json', ...(headers || {})},
              body: method === 'GET' ? undefined : JSON.stringify(body ?? {})
            } as any);
            const contentType = r.headers.get('content-type') || '';
            const payload = contentType.includes('application/json') ? await r.json() : await r.text();
            return sendJson(res, 200, {ok: r.ok, status: r.status, data: payload});
          } catch (err: any) {
            return sendJson(res, 500, {ok: false, status: 0, error: err?.message || String(err)});
          }
        }

        return sendJson(res, 404, {error: 'Not Found'});
      } catch (e: any) {
        return sendJson(res, 500, {error: e?.message || String(e)});
      }
    });

    httpServer.on('error', (err) => {
      console.error('[main] HTTP server error', err);
      reject(err);
    });
    httpServer.listen(DESKTOP_HTTP_PORT, DESKTOP_HTTP_HOST, () => {
      const address = httpServer?.address();
      const actualPort = typeof address === 'object' && address ? (address as any).port : DESKTOP_HTTP_PORT;
      httpPort = actualPort;
      console.log(`[main] Desktop HTTP server listening at http://${DESKTOP_HTTP_HOST}:${actualPort}`);
      resolve(actualPort);
    });
  });
}

function setupSecurityHeaders() {
  const cspDev = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws:; img-src 'self' data: blob: http: https:; style-src 'self' 'unsafe-inline' http: https:; font-src 'self' data: http: https:; connect-src 'self' http: https: ws:;";
  const cspProd = "default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https: https://fonts.gstatic.com; connect-src 'self' http: https: ws: wss:; frame-ancestors 'none'; form-action 'self'";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders || {};
    headers['Content-Security-Policy'] = [isDev ? cspDev : cspProd];
    callback({cancel: false, responseHeaders: headers});
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      devTools: enableDevTools,
    }
  });

  // Security hardening
  mainWindow.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  // Allow navigation only to our own app (DEV_URL in dev; file:// in prod)
  mainWindow.webContents.on('will-navigate', (e, url) => {
    try {
      const allowed = isDev
        ? (typeof url === 'string' && url.startsWith(DEV_URL))
        : (typeof url === 'string' && url.startsWith('file:'));
      if (!allowed) e.preventDefault();
    } catch {
      e.preventDefault();
    }
  });

  // Log load failures to help diagnose blank screen issues
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error(`[main] did-fail-load: code=${errorCode} desc=${errorDescription} url=${validatedURL} mainFrame=${isMainFrame}`);
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.on('did-fail-load', () => {
      // Retry once after slight delay
      setTimeout(() => mainWindow && mainWindow.loadURL(DEV_URL), 500);
    });
  } else {
    const indexHtml = path.resolve(__dirname, '../resources/renderer/index.html');
    if (fs.existsSync(indexHtml)) {
      mainWindow.loadFile(indexHtml);
    } else {
      const msg = `Renderer index not found at ${indexHtml}`;
      console.error(msg);
      const placeholder = path.resolve(__dirname, 'index.html');
      if (fs.existsSync(placeholder)) {
        mainWindow.loadFile(placeholder).then(() => {
          mainWindow?.webContents.executeJavaScript(`document.body.style.fontFamily='monospace';document.body.style.padding='16px';document.body.textContent=${JSON.stringify(msg)};`);
        });
      } else {
        mainWindow.loadURL('data:text/plain,' + encodeURIComponent(msg));
      }
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, _argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('ready', async () => {
  // Only set CSP/security headers in production to avoid interfering with Angular dev server
  if (!isDev) {
    setupSecurityHeaders();
  } else {
    console.log('[main] Dev mode detected: skipping CSP header injection');
  }

  // Optional: register custom protocol for future use
  protocol.registerFileProtocol('fnf-local', (request, callback) => {
    const url = request.url.replace('fnf-local://', '');
    const filePath = path.normalize(path.join(__dirname, '../', url));
    callback({path: filePath});
  });

  createWindow();

  // Start internal HTTP server for renderer communication
  startHttpServer().catch(e => console.error('[main] Failed to start HTTP server', e));

  if (enableDevTools) {
    try {
      const ok1 = globalShortcut.register(process.platform === 'darwin' ? 'Cmd+Alt+I' : 'Ctrl+Alt+I', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.toggleDevTools();
        }
      });
      const ok2 = globalShortcut.register('F12', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.toggleDevTools();
        }
      });
      if (!ok1 || !ok2) {
        console.warn('[main] Failed to register DevTools shortcuts');
      } else {
        console.log('[main] DevTools shortcuts enabled: Cmd/Ctrl+Alt+I and F12');
      }
    } catch (e) {
      console.warn('[main] Error registering DevTools shortcuts', e);
    }
  }
});

app.on('window-all-closed', () => {
  // For macOS keep app active until quit
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch {
  }
  try {
    if (httpServer) {
      httpServer.close();
      httpServer = null;
      console.log('[main] HTTP server closed');
    }
  } catch {
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Schemas
const ApiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  path: z.string().min(1),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

// Communication switched to internal HTTP server. IPC handlers were removed.
