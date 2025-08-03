import puppeteer from "puppeteer";
import fs from "fs/promises";

const URLS_INPUT_FILE = "./urls.json";
const OUT_DIR = "./screenshots";
const VIEWPORT = {width: 1440, height: 900};

async function pressShortcut(page, shortcut) {
  const modifiers = ["Shift", "Control", "Alt", "Meta"];
  const held = [];

  for (const key of shortcut) {
    if (modifiers.includes(key)) {
      await page.keyboard.down(key);
      held.push(key);
    } else {
      await page.keyboard.press(key);
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
