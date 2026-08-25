const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "supabase-app", "app.js"), "utf8");
const extract = (startText, endText) => {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end < 0) throw new Error(`Could not extract ${startText}`);
  return source.slice(start, end);
};
const workOrderPdfSource = extract("function printWorkOrderDraft(woNo)", "async function emailCustomerInvoice");
const printableSource = extract("function printableDocumentHtml(", "function signatureBlockHtml(");

const poNumber = "W00031";
const currentRows = [{
  id: "preview-work-order",
  wo_no: poNumber,
  wo_date: "2026-07-27",
  bill_to_customer: "MATSON NAVIGATION COMPANY",
  asset_tag: "Matson-002",
  requested_by: "CHRIS MATSON",
  customer_po: "TO FOLLOW",
  jobsite_location: "MATSON",
  actual_location: "PORT AUTHORITY OF GUAM",
  description: "Inspect and repair the reported equipment fault.\nConfirm safe operation before returning the unit to service.",
  status: "In Progress",
  _parts: [
    { sku: "770-1730", product_name: "TAPE, ELECTRIC", accepted_qty: 1, qty_needed: 1, unit_cost: 7.57, selling_price: 7.57 },
    { sku: "CRCC05089", product_name: "BRAKE CLEANER", accepted_qty: 4, qty_needed: 4, unit_cost: 6.60, selling_price: 6.60 },
  ],
  _labor: [
    { id: "l5", mechanic: "Mechanic Beta", issue: "Helper labor - Taylor TXCL975", clock_in: "2026-08-11T08:00:00", clock_out: "2026-08-11T10:00:00", hourly_rate: 200, work_done: "Helper hours only" },
    { id: "l1", mechanic: "Mechanic Alpha", issue: "Taylor TXCL975", clock_in: "2026-07-27T08:00:00", clock_out: "2026-07-27T12:00:00", hourly_rate: 200, work_done: "Initial inspection completed.\nHydraulic leak isolated near the lift cylinder." },
    { id: "l2", mechanic: "Mechanic Beta", issue: "Helper labor - Taylor TXCL975", clock_in: "2026-07-27T09:00:00", clock_out: "2026-07-27T12:00:00", hourly_rate: 200, work_done: "Helper hours only" },
    { id: "l4", mechanic: "Mechanic Alpha", issue: "Taylor TXCL975", clock_in: "2026-07-31T08:00:00", clock_out: "2026-07-31T10:00:00", hourly_rate: 200, work_done: "Installed replacement hose and fittings.\nPressure-tested the system and confirmed normal operation." },
    { id: "l3", mechanic: "Mechanic Gamma", issue: "Helper labor - Taylor TXCL975", clock_in: "2026-07-28T08:00:00", clock_out: "2026-07-28T11:00:00", hourly_rate: 200, work_done: "Helper hours only" },
    { id: "l6", mechanic: "Mechanic Alpha", issue: "Taylor TXCL975", clock_in: "2026-08-11T07:00:00", clock_out: "2026-08-11T08:00:00", hourly_rate: 200, work_done: "Final operational inspection completed.\nUnit released for service." },
  ],
}];

let renderedHtml = "";
const window = { location: { href: pathToFileURL(path.join(root, "dist", "index.html")).href } };
const alert = (message) => { throw new Error(message); };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const formatDisplayDate = (value) => {
  const [year, month, day] = String(value || "").split("-");
  return year && month && day ? `${month}/${day}/${year}` : value || "";
};
const workOrderAssetDetails = () => ({ name: "TAYLOR TXCL975", serial: "SHB36511", plate: "", operator: "" });
const actualLocationForWorkOrder = (wo) => wo.actual_location || "";
const workOrderPartSellingPrice = (part) => Number(part.selling_price || part.unit_cost || 0);
const partDisplayName = (part) => part.product_name || part.sku || "Part";
const laborHours = (labor) => (new Date(labor.clock_out) - new Date(labor.clock_in)) / 3600000;
const laborNarrativeSort = (a, b) => String(a.clock_in || "").localeCompare(String(b.clock_in || ""));
const laborNarrativeDate = (labor, fallbackDate = "") => {
  const value = labor.clock_in || fallbackDate || "";
  const parsed = new Date(value);
  return parsed.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
};
const isHelperLabor = (labor = {}) => /^helper labor\b/i.test(String(labor.issue || "")) || /helper (hours only|for hours only)/i.test(String(labor.work_done || ""));
const isReversedLabor = (labor = {}) => /(?:^|\|\s*)reversed\s/i.test(String(labor.work_done || ""));
const normalizedLaborIssue = (labor = {}) => String(labor.issue || "General work order").replace(/^Helper labor\s*-\s*/i, "") || "General work order";
const signatureBlockHtml = () => `<section class="signatures"><div class="sig-box"><div class="sig-title">Customer acceptance</div><div class="sig-line"></div><div class="sig-label">Name / signature</div></div><div class="sig-box"><div class="sig-title">Received / Approved by LMS Imports</div><div class="sig-line"></div><div class="sig-label">Name / signature</div></div></section>`;
const signatureScriptHtml = () => "";
const openPrintWindow = (html) => { renderedHtml = html; };

eval(printableSource);
eval(workOrderPdfSource);
printWorkOrderDraft(poNumber);

const outputDir = path.join(root, "tmp", "pdfs");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "work-order-layout-preview.html");
fs.writeFileSync(outputPath, renderedHtml, "utf8");
console.log(outputPath);
