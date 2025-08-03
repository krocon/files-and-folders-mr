import puppeteer from "puppeteer";
import fs from "fs/promises";

const URLS_INPUT_FILE = "./urls.json";
const OUT_DIR = "./screenshots";
const VIEWPORT = {width: 1440, height: 900};

async function pressShortcut(page, shortcut) {
  const modifiers = ["Shift", "Control", "Alt", "Meta"];
  const held = [];

  // Function to map key names to Puppeteer-compatible format
  function mapKeyName(key) {
    // Handle function keys (KeyF1 -> F1, KeyF6 -> F6, etc.)
    if (key.startsWith("KeyF") && key.length >= 4) {
      const fKeyNumber = key.substring(4);
      if (/^\d+$/.test(fKeyNumber)) {
        return `F${fKeyNumber}`;
      }
    }

    // Handle other common key mappings if needed
    const keyMappings = {
      "KeyA": "a", "KeyB": "b", "KeyC": "c", "KeyD": "d", "KeyE": "e",
      "KeyF": "f", "KeyG": "g", "KeyH": "h", "KeyI": "i", "KeyJ": "j",
      "KeyK": "k", "KeyL": "l", "KeyM": "m", "KeyN": "n", "KeyO": "o",
      "KeyP": "p", "KeyQ": "q", "KeyR": "r", "KeyS": "s", "KeyT": "t",
      "KeyU": "u", "KeyV": "v", "KeyW": "w", "KeyX": "x", "KeyY": "y",
      "KeyZ": "z"
    };

    return keyMappings[key] || key;
  }

  for (const key of shortcut) {
    if (modifiers.includes(key)) {
      await page.keyboard.down(key);
      held.push(key);
    } else {
      const mappedKey = mapKeyName(key);
      await page.keyboard.press(mappedKey);
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
