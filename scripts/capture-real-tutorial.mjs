import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(".");
const outDir = join(root, "walkthrough-videos", "real-captures");
const port = 8107;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  try {
    const requestPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
    const filePath = normalize(join(root, requestPath === "/" ? "/inventory-system.html" : requestPath));
    if (!filePath.startsWith(root)) throw new Error("Blocked path");
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": mime[extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

await new Promise((resolveListen) => server.listen(port, "127.0.0.1", resolveListen));
await mkdir(outDir, { recursive: true });

const userDataDir = join(root, ".tmp-chrome-real-capture");
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-software-rasterizer",
  "--disable-dev-shm-usage",
  "--no-sandbox",
  "--hide-scrollbars=false",
  "--window-size=1600,900",
  "--remote-debugging-port=9337",
  `--user-data-dir=${userDataDir}`,
  `http://127.0.0.1:${port}/inventory-system.html`,
], { stdio: "ignore" });

async function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

let wsUrl = "";
for (let i = 0; i < 80; i += 1) {
  try {
    const tabs = await fetchJson("http://127.0.0.1:9337/json");
    wsUrl = tabs.find((t) => t.type === "page")?.webSocketDebuggerUrl || "";
    if (wsUrl) break;
  } catch {}
  await sleep(250);
}
if (!wsUrl) throw new Error("Chrome DevTools did not start.");

const ws = new WebSocket(wsUrl);
await new Promise((resolveOpen, rejectOpen) => {
  ws.addEventListener("open", resolveOpen, { once: true });
  ws.addEventListener("error", rejectOpen, { once: true });
});

let nextId = 1;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: ok, reject: fail } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) fail(new Error(msg.error.message));
    else ok(msg.result || {});
  }
});

function send(method, params = {}) {
  const id = nextId;
  nextId += 1;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveSend, rejectSend) => pending.set(id, { resolve: resolveSend, reject: rejectSend }));
}

async function evaluate(expression) {
  return send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
}

async function screenshot(name) {
  await sleep(600);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 78, fromSurface: true });
  const buffer = Buffer.from(shot.data, "base64");
  await new Promise((resolveWrite, rejectWrite) => {
    const stream = createWriteStream(join(outDir, `${name}.jpg`));
    stream.on("finish", resolveWrite);
    stream.on("error", rejectWrite);
    stream.end(buffer);
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1600,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await sleep(1800);

const steps = [
  ["Dashboard", "01-dashboard", "Dashboard: start with the summary cards, action items, quick access, and operational tables.", "dashboard"],
  ["Products", "02-products", "Products: maintain SKUs, units, source vendors, photos, markups, optional alternates, and inventory controls.", "products"],
  ["Stock Movement", "03-stock-movement", "Stock Movement: review receipts, sales issues, repairs, FIFO cost, vendor, customer, and reference number.", "movements"],
  ["Purchasing", "04-purchasing", "Purchasing: create POs with multiple lines, jobsite, terms, incoterms, currency, freight, and work order reference.", "purchasing"],
  ["Goods Receipts", "05-goods-receipts", "Goods Receipts: receive ordered quantities, track vendor invoices per receipt, and reverse mistakes.", "purchasing"],
  ["Sales Orders", "06-sales-orders", "Sales Orders: select searchable products, reserve available parts, capture customer PO, and invoice when ready.", "orders"],
  ["Fleet & Equipment", "07-fleet-equipment", "Fleet & Equipment: manage photos, new QR, old QR, last update dates, location scans, and repair status.", "assets"],
  ["Add Asset", "08-add-asset", "Add Asset: create equipment with optional compatible assets, parent-child relationships, location, and QR tracking.", "asset-modal"],
  ["Repairs", "09-repairs", "Repairs: manage open, ready-to-close, closed-not-invoiced, and invoiced work orders with parts and labor history.", "repairs"],
  ["Invoices", "10-invoices", "Invoices: bill parts, equipment sales, rentals, and work orders with narrated work history on PDFs.", "invoices"],
  ["Accounting", "11-accounting", "Accounting: manage AP, AR, GL, check run, bank reconciliation, aging, reports, and posting period controls.", "accounting"],
  ["Users", "12-users", "Users: create company users, restrict module access, and give mechanics a simplified mobile-friendly view.", "users"],
];

const captured = [];
for (const [module, file, subtitle, view] of steps) {
  if (module !== "Dashboard") {
    await evaluate(`
      (() => {
        const modalClose = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'x');
        if (modalClose) modalClose.click();
        const view = ${JSON.stringify(view)};
        if (view === 'asset-modal') {
          if (typeof openModule === 'function') openModule('assets');
          setTimeout(() => {
            const add = [...document.querySelectorAll('button')].find((b) => /Add asset/i.test(b.textContent));
            if (add) add.click();
          }, 150);
        } else if (typeof openModule === 'function') {
          openModule(view);
        } else {
          const target = document.querySelector('[data-go="' + view + '"]');
          if (target) target.click();
        }
      })()
    `);
    await sleep(1000);
  }
  await screenshot(file);
  captured.push({ file: `${file}.jpg`, module, subtitle });
}

await writeFile(join(outDir, "steps.json"), JSON.stringify(captured, null, 2));
ws.close();
chrome.kill();
server.close();

console.log(JSON.stringify({ outDir, count: captured.length }, null, 2));
