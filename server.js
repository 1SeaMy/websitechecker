import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.post("/check", async (req, res) => {
  const { url, selector } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL gerekli" });
  }

  const startTime = Date.now();

  let browser;

  try {
    browser = await chromium.launch({
      headless: true
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36"
    });

    const page = await context.newPage();

    // Console error topla
    let consoleErrors = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000
    });

    await page.waitForLoadState("networkidle");

    let elementFound = true;

    if (selector) {
      const element = await page.$(selector);
      elementFound = element !== null;
    }

    const duration = Date.now() - startTime;

    await browser.close();

    return res.json({
      status: elementFound ? "up" : "degraded",
      http_code: response?.status(),
      dom_loaded: true,
      critical_element_found: elementFound,
      console_errors: consoleErrors,
      response_time_ms: duration
    });

  } catch (error) {
    if (browser) await browser.close();

    return res.json({
      status: "down",
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log("Server 3000 portunda çalışıyor");
});
