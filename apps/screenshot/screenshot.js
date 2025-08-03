import puppeteer from "puppeteer";
import fs from "fs/promises";

const URLS_INPUT_FILE = "./urls.json";
const OUT_DIR = "./screenshots";
const VIEWPORT = {width: 1440, height: 900};

const KEYS = [
  "Power", "Eject", "Abort", "Help", "Backspace", "Tab", "Numpad5", "NumpadEnter", "Enter", "\r", "\n", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "Pause", "CapsLock", "Escape", "Convert", "NonConvert", "Space", "Numpad9", "PageUp", "Numpad3", "PageDown", "End", "Numpad1", "Home", "Numpad7", "ArrowLeft", "Numpad4", "Numpad8", "ArrowUp", "ArrowRight", "Numpad6", "Numpad2", "ArrowDown", "Select", "Open", "PrintScreen", "Insert", "Numpad0", "Delete", "NumpadDecimal", "Digit0", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "MetaLeft", "MetaRight", "ContextMenu", "NumpadMultiply", "NumpadAdd", "NumpadSubtract", "NumpadDivide", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24", "NumLock", "ScrollLock", "AudioVolumeMute", "AudioVolumeDown", "AudioVolumeUp", "MediaTrackNext", "MediaTrackPrevious", "MediaStop", "MediaPlayPause", "Semicolon", "Equal", "NumpadEqual", "Comma", "Minus", "Period", "Slash", "Backquote", "BracketLeft", "Backslash", "BracketRight", "Quote", "AltGraph", "Props", "Cancel", "Clear", "Shift", "Control", "Alt", "Accept", "ModeChange", "Print", "Execute", "Meta", "Attn", "CrSel", "ExSel", "EraseEof", "Play", "ZoomOut", "SoftLeft", "SoftRight", "Camera", "Call", "EndCall", "VolumeDown", "VolumeUp"
];

async function handleKey(modifiers, key, page, held) {
  if (modifiers.includes(key)) {
    await page.keyboard.down(key);
    held.push(key);
  } else {
    await page.keyboard.press(key);
  }
}

async function pressShortcut(page, shortcut) {
  const modifiers = ["Shift", "Control", "Alt", "Meta"];
  const held = [];

  for (const key of shortcut) {
    if (key.length > 2 && !KEYS.includes(key)) {
      let keys = key.split("");
      for (const k of keys) {
        await handleKey(modifiers, k, page, held);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      await handleKey(modifiers, key, page, held);
    }

  }

  // Modifier wieder loslassen
  for (const key of held.reverse()) {
    await page.keyboard.up(key);
  }
}

async function run() {
  await fs.mkdir(OUT_DIR, {recursive: true});
  const views = JSON.parse(await fs.readFile(URLS_INPUT_FILE, "utf-8"));

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  for (const {name, url, shortcuts} of views) {
    console.log(`📸 Capturing: ${name} → ${url}`);
    await page.goto(url, {waitUntil: "networkidle2"});

    if (Array.isArray(shortcuts)) {
      for (const shortcut of shortcuts) {
        console.log(`⌨️ Triggering shortcut: ${shortcut.join(" + ")}`);
        await pressShortcut(page, shortcut);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    await page.screenshot({path: `${OUT_DIR}/${name}.png`});
  }

  await browser.close();
  console.log("✅ All screenshots saved.");
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
