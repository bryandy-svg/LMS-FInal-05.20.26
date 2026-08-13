const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "supabase-app", "app.js"), "utf8");
const start = source.indexOf("function printPurchaseOrder(poNo)");
const end = source.indexOf("window.savePdfSignatures", start);
if (start < 0 || end < 0) throw new Error("Purchase Order PDF generator was not found.");
const generatorSource = source.slice(start, end);

const po = {
  id: "preview-po",
  po_no: "PO-7018",
  po_date: "2026-08-12",
  expected_date: "2026-08-20",
  vendor: "NAPA AUTO PARTS",
  payment_terms: "Net 30",
  jobsite_project: "LMS Main Shop",
  ap_support_wo_no: "W00011",
  po_type: "Blanket",
  spending_limit: 5000,
  status: "Partially Received",
  match_status: "Mismatch",
  payment_status: "Not Ready",
  incoterm: "FOB",
  landed_cost_enabled: true,
  landed_cost_method: "By Value",
  currency_code: "JPY",
  exchange_rate: 0.0067,
  foreign_order: true,
  foreign_country: "Japan",
  vendor_invoice_no: "",
  notes: "Please confirm availability and expected delivery before shipment.",
  _lines: [
    { sku: "R134A-AC", product_name: "R134A Refrigerant 30 lb Cylinder", unit: "Each", qty: 1, unit_cost: 676.37, wo_no: "W00011", landed_unit_cost: 701.15, allocated_landed_cost: 24.78 },
    { sku: "CRCC05089", product_name: "Brake Cleaner", unit: "Each", qty: 12, unit_cost: 6.60, wo_no: "" },
  ],
};

const currentRows = [po];
const purchaseContext = {
  vendorRows: [{
    name: "NAPA AUTO PARTS",
    address: "123 Marine Corps Drive, Guam",
    email: "orders@example.com",
    phone: "(671) 555-0100",
    terms: "Net 30",
  }],
};
const window = {
  location: { href: pathToFileURL(path.join(root, "dist", "index.html")).href },
  open() {
    return {
      document: {
        open() {},
        write(value) { this.html = value; },
        close() {},
        html: "",
      },
    };
  },
};
const alert = (message) => { throw new Error(message); };
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const formatDisplayDate = (value) => {
  const [year, month, day] = String(value || "").split("-");
  return year && month && day ? `${month}/${day}/${year}` : value || "";
};
const isBlanketPurchaseOrder = () => true;
const poPartsSubtotal = (row) => row._lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unit_cost || 0), 0);
const poTotal = poPartsSubtotal;
const today = () => "2026-08-12";
const signatureBlockHtml = () => `<section class="signatures"><div class="sig-box"><div class="sig-title">Vendor acknowledgement</div><div class="sig-line"></div><div class="sig-label">Name / signature</div></div><div class="sig-box"><div class="sig-title">Approved by LMS Imports</div><div class="sig-line"></div><div class="sig-label">Name / signature</div></div></section>`;
const signatureScriptHtml = () => "";

eval(generatorSource);
let renderedHtml = "";
window.open = () => ({
  document: {
    open() {},
    write(value) { renderedHtml = value; },
    close() {},
  },
});
printPurchaseOrder(po.po_no);

const outputDir = path.join(root, "tmp", "pdfs");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "purchase-order-layout-preview.html");
fs.writeFileSync(outputPath, renderedHtml, "utf8");
console.log(outputPath);
