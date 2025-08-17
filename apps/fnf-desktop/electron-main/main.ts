import {app, BrowserWindow, ipcMain, protocol, session, shell} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {z} from 'zod';

const isDev = process.env.FNF_DEV_SERVER_URL != null;
const DEV_URL = process.env.FNF_DEV_SERVER_URL || 'http://localhost:4200';
const API_URL = process.env.FNF_API_URL || 'http://localhost:3333';

let mainWindow: BrowserWindow | null = null;

function setupSecurityHeaders() {
  const cspDev = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: ws:; img-src 'self' data: blob: http: https:; style-src 'self' 'unsafe-inline' http: https:; font-src 'self' data: http: https:; connect-src 'self' http: https: ws:;";
  const cspProd = "default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' http: https:; frame-ancestors 'none'; form-action 'self'";

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
      devTools: isDev,
    }
  });

  // Security hardening
  mainWindow.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());

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
  setupSecurityHeaders();

  // Optional: register custom protocol for future use
  protocol.registerFileProtocol('fnf-local', (request, callback) => {
    const url = request.url.replace('fnf-local://', '');
    const filePath = path.normalize(path.join(__dirname, '../', url));
    callback({path: filePath});
  });

  createWindow();
});

app.on('window-all-closed', () => {
  // For macOS keep app active until quit
  if (process.platform !== 'darwin') app.quit();
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

// IPC handlers
ipcMain.handle('app:getVersion', () => app.getVersion());

ipcMain.handle('app:openExternal', (_e, url: string) => {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
  } catch {
    return false;
  }
  return shell.openExternal(url);
});

ipcMain.handle('api:request', async (_e, input) => {
  const parse = ApiRequestSchema.safeParse(input);
  if (!parse.success) {
    return {ok: false, status: 400, error: 'Invalid request', issues: parse.error.issues};
  }
  const {method, path: p, headers, body} = parse.data;
  const url = (API_URL.replace(/\/$/, '')) + (p.startsWith('/') ? p : '/' + p);
  try {
    const res = await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json', ...(headers || {})},
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {})
    } as any);
    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : await res.text();
    return {ok: res.ok, status: res.status, data: payload};
  } catch (err: any) {
    return {ok: false, status: 0, error: err?.message || String(err)};
  }
});
