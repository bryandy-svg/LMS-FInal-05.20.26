import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const modules = [
  { group: "Home", items: [["dashboard", "Dashboard"]] },
  { group: "Inventory", items: [["products", "Products"], ["movements", "Stock Movement"], ["inventory", "Inventory Balance"], ["purchasing", "Purchasing"], ["receipts", "Goods Receipts"]] },
  { group: "Sales & Billing", items: [["orders", "Sales Orders"], ["salestopurchase", "Parts to Order"], ["rentals", "Rentals"], ["invoices", "Invoices"], ["payments", "Customer Payments"]] },
  { group: "Fleet & Repairs", items: [["assets", "Fleet & Equipment"], ["equipmentrepairqueue", "Equipment Subject to Repair"], ["equipmenthistory", "Equipment History"], ["repairs", "Repairs"], ["supplies", "Supplies Issuance"], ["partsrequests", "Parts Requests"], ["mechanics", "Mechanics"]] },
  { group: "Accounting", items: [["accounting", "Accounting"], ["coa", "Chart of Accounts"], ["bank", "Bank Reconciliation"], ["checkrun", "Check Run"], ["aging", "Aging Summary"]] },
  { group: "Masters", items: [["vendors", "Vendors"], ["customers", "Customers"], ["users", "Users"], ["settings", "Settings"]] },
];

const userModuleChoices = modules.flatMap((group) => group.items.map(([id, label]) => ({ id, label, group: group.group })));

const tableMap = {
  products: { table: "products", key: "sku", title: "Products", sub: "Manage SKUs, pricing, locations, reorder points, batches, compatible parts, and photos.", heads: ["photo_url", "sku", "name", "source_vendor", "category", "unit", "warehouse", "bin_shelf", "qty", "reorder_point", "cost", "selling_price", "markup_percent", "status"], labels: ["Photo", "SKU", "Product", "Preferred Vendor", "Category", "Unit", "Warehouse", "Bin / Shelf", "Qty", "Reorder", "Cost", "Price", "Markup %", "Status"] },
  movements: { table: "stock_movements", key: "reference_no", title: "Stock Movement", sub: "Receive, sell, adjust, transfer, reserve, and audit stock.", heads: ["movement_date", "reference_no", "type", "product_name", "vendor", "sold_to", "sold_date", "qty", "from_warehouse", "to_warehouse", "unit_fifo_cost", "total_fifo_cost", "document_no", "entered_by", "reason"], labels: ["Date", "Reference #", "Type", "Product", "Vendor", "Sold To", "Sold Date", "Qty", "From", "To", "Unit FIFO Cost", "Total FIFO Cost", "Document", "Entered By", "Reason"], readOnly: true },
  purchasing: { table: "purchase_orders", key: "po_no", title: "Purchasing", sub: "PO issue, goods receipt, matching, landed cost, AP posting, and payment readiness.", heads: ["po_no", "po_date", "vendor", "jobsite_project", "payment_terms", "incoterm", "currency_code", "freight_amount", "duty_amount", "other_landed_cost_amount", "landed_cost_enabled", "vendor_invoice_no", "vendor_invoice_amount", "match_status", "payment_status", "status"], labels: ["PO", "Date", "Vendor", "Jobsite / Project", "Terms", "Incoterm", "Currency", "Freight", "Duty", "Other Landed", "Landed Cost", "Invoice", "Invoice Amount", "Match", "Payment", "Status"] },
  receipts: { table: "goods_receipts", key: "gr_no", title: "Goods Receipts", sub: "Receive ordered goods only and track partial/full receipt.", heads: ["gr_no", "gr_date", "po_no", "vendor", "vendor_invoice_no", "vendor_invoice_date", "vendor_invoice_amount", "sku", "product_name", "ordered_qty", "received_qty", "unit_cost", "received_amount", "received_by", "receipt_type", "status"], labels: ["GR #", "Date", "PO", "Vendor", "Invoice #", "Invoice Date", "Invoice Amount", "SKU", "Product", "Ordered", "Received", "Unit Cost", "Amount", "Received By", "Receipt Type", "Status"] },
  orders: { table: "sales_orders", key: "order_no", title: "Sales Orders", sub: "Customer demand, customer PO controls, line items, fulfillment, and invoicing.", heads: ["order_no", "order_date", "customer", "customer_po", "payment_mode", "manager_override", "override_by", "status", "invoice_no"], labels: ["Order", "Date", "Customer", "Customer PO", "Payment Mode", "Override", "Override By", "Status", "Invoice"] },
  salestopurchase: { title: "Parts to Order", sub: "Customer sales demand that is reserved or backordered until stock is received.", derived: true },
  assets: { table: "assets", key: "asset_tag", title: "Fleet & Equipment", sub: "Track vehicles, heavy equipment, readings, ownership, locations, photos, QR codes, and parent/child attachments.", heads: ["photo_url", "qr_update_url", "old_qr_code", "asset_tag", "name", "type", "general_type", "parent_asset_tag", "relationship_type", "compatible_with", "make", "model", "color", "vin_serial", "plate", "location", "last_update_date", "scanned_date", "odometer", "engine_hours", "assigned_operator", "status"], labels: ["Photo", "New QR", "Old QR Code", "Asset #", "Description", "Type", "General Type", "Parent Asset", "Relationship", "Compatible With", "Make", "Model", "Color", "VIN / Serial", "Plate", "Location", "Last Update Date", "Scanned Date", "Odometer", "Hours", "Operator", "Status"] },
  repairs: { table: "work_orders", key: "wo_no", title: "Repairs", sub: "Work orders, issue details, parts, labor, priority, billing, and next service.", heads: ["wo_no", "wo_date", "asset_tag", "priority", "bill_to_customer", "customer_po", "work_type", "vendor_shop", "odometer", "engine_hours", "status", "invoice_no"], labels: ["WO #", "Date", "Asset", "Priority", "Bill To", "Customer PO", "Type", "Vendor / Shop", "Odometer", "Hours", "Status", "Invoice"] },
  supplies: { title: "Supplies Issuance", sub: "Issue supplies to employees or mechanics, with optional work order charging.", derived: true },
  partsrequests: { table: "work_order_parts", key: "id", title: "Parts Requests", sub: "Mechanic shortages and parts needing purchase.", heads: ["sku", "product_name", "qty_needed", "unit_cost", "amount", "availability", "status", "accepted_qty", "notes"], labels: ["SKU", "Product", "Qty Needed", "Unit Cost", "Amount", "Availability", "Status", "Accepted Qty", "Notes"] },
  mechanics: { table: "mechanics", key: "reference", title: "Mechanic Master", sub: "Mechanic rates, specialties, status, and contact details.", heads: ["reference", "name", "hourly_rate", "phone", "email", "specialty", "status"], labels: ["Reference", "Name", "Rate", "Phone", "Email", "Specialty", "Status"] },
  rentals: { table: "rentals", key: "rental_no", title: "Rentals", sub: "Rental checkout, customer PO control, return, deposit, invoice timing, and revenue tracking.", heads: ["rental_no", "customer", "customer_po", "item_type", "item_ref", "start_date", "end_date", "invoice_timing", "rate_type", "rate", "deposit", "status", "invoice_no"], labels: ["Rental", "Customer", "Customer PO", "Item Type", "Item", "Start", "End", "Invoice Timing", "Rate Type", "Rate", "Deposit", "Status", "Invoice"] },
  invoices: { table: "invoices", key: "invoice_no", title: "Invoices", sub: "Parts sales, equipment sales, equipment rental, and work order billing.", heads: ["invoice_no", "invoice_date", "due_date", "customer", "type", "source_ref", "status"], labels: ["Invoice #", "Date", "Due Date", "Customer", "Type", "Source", "Status"] },
  payments: { table: "customer_payments", key: "receipt_no", title: "Customer Payments", sub: "Receive and track accounts receivable payments.", heads: ["receipt_no", "payment_date", "customer", "invoice_no", "amount", "method", "bank_reference", "status"], labels: ["Receipt #", "Date", "Customer", "Invoice", "Amount", "Method", "Bank Ref", "Status"] },
  accounting: { table: "general_ledger", key: "id", title: "Accounting", sub: "Posting-date ledger detail with customers, vendors, invoices, assets, and mechanics.", heads: ["posting_date", "account", "customer", "vendor", "invoice_no", "invoice_date", "due_date", "mechanic", "asset", "description", "reference", "debit", "credit", "source", "status"], labels: ["Posting Date", "Account", "Customer", "Vendor", "Invoice #", "Invoice Date", "Due Date", "Mechanic", "Asset", "Description", "Reference", "Debit", "Credit", "Source", "Status"] },
  coa: { table: "chart_of_accounts", key: "account", title: "Chart of Accounts", sub: "LMS account codes, financial statement grouping, account types, and normal balances.", heads: ["account_code", "account", "report_group", "type", "normal_balance", "notes"], labels: ["Code", "Account", "Report", "Type", "Normal Balance", "Notes"] },
  bank: { table: "bank_transactions", key: "id", title: "Bank Reconciliation", sub: "Match bank activity to GL, payments, deposits, and checks.", heads: ["tx_date", "description", "reference", "amount", "status", "matched_reference", "notes"], labels: ["Date", "Description", "Reference", "Amount", "Status", "Matched Ref", "Notes"] },
  checkrun: { table: "check_runs", key: "check_run_no", title: "Check Run", sub: "Select approved payables, issue checks, and post payments.", heads: ["check_run_no", "payment_date", "payment_mode", "payment_account", "bank_account", "check_no", "vendor", "reference", "invoice_no", "invoice_date", "due_date", "amount", "status"], labels: ["Check Run", "Date", "Mode", "Payment Account", "Bank", "Check #", "Vendor", "Reference", "Invoice", "Invoice Date", "Due Date", "Amount", "Status"] },
  vendors: { table: "vendors", key: "reference", title: "Vendor Master", sub: "Suppliers, source vendors, terms, and purchase history.", heads: ["reference", "name", "email", "phone", "address", "terms", "tax_id", "notes"], labels: ["Reference", "Name", "Email", "Phone", "Address", "Terms", "Tax ID", "Notes"] },
  customers: { table: "customers", key: "reference", title: "Customer Master", sub: "Buyers, billing details, rentals, statements, and order history.", heads: ["reference", "name", "email", "phone", "address", "terms", "tax_id", "notes"], labels: ["Reference", "Name", "Email", "Phone", "Address", "Terms", "Tax ID", "Notes"] },
  users: { table: "app_profiles", key: "id", title: "Users", sub: "Create company logins and restrict access by module.", heads: ["username", "email", "full_name", "role", "modules"], labels: ["Username", "Email", "Name", "Role", "Modules"] },
  inventory: { title: "Inventory Balance", sub: "On-hand stock and inventory value from live products.", derived: true },
  equipmenthistory: { title: "Equipment History", sub: "Repair history, parts used, labor, and recurring problem summary.", derived: true },
  aging: { title: "Aging Summary", sub: "AR/AP aging by customer/vendor or detailed invoice.", derived: true },
  settings: { title: "Settings", sub: "Master lists and setup controls.", derived: true },
};

let session = null;
let profile = null;
let currentView = "dashboard";
let currentRows = [];
let currentCfg = null;
let editing = null;
let accountingTab = "gl";
let productMeta = { vendors: [], categories: [], units: [], warehouses: [] };
let purchaseContext = { products: [], vendors: [], vendorRows: [] };
const productColumnDefs = [
  ["photo", "Photo"], ["sku", "SKU"], ["name", "Product"], ["source_vendor", "Preferred Vendor"], ["category", "Category"], ["unit", "Unit"],
  ["warehouse", "Warehouse"], ["bin_shelf", "Bin / Shelf"], ["qty", "Qty"], ["reorder_point", "Reorder"], ["cost", "Cost"],
  ["selling_price", "Price"], ["markup_percent", "Markup %"], ["status", "Status"],
];
const assetColumnDefs = [
  ["photo", "Photo"], ["new_qr", "New QR"], ["old_qr_code", "Old QR Code"], ["needs_qr_code_printed", "Needs QR Code Printed"], ["asset_tag", "Asset #"], ["description", "Description"], ["type", "Type"],
  ["general_type", "General Type"], ["parent_asset", "Parent Asset"], ["relationship_type", "Relationship"], ["compatible_with", "Compatible With"],
  ["make_model", "Make / Model"], ["color", "Color"], ["vin_serial", "VIN / Serial"], ["plate", "Plate"], ["location", "Location"],
  ["last_update_date", "Last Update Date"], ["scanned_date", "Scanned Date"], ["reading", "Reading"], ["assigned_operator", "Operator"], ["open_wo_issue", "WO / Issue"], ["status", "Status"],
];
const ASSET_COLUMN_STORAGE_KEY = "lms.assetColumns.v3";

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
const today = () => new Date().toISOString().slice(0, 10);

boot();

async function boot() {
  renderNav();
  bindChrome();
  const { data } = await supabase.auth.getSession();
  session = data.session;
  if (session) await loadProfile();
  renderNav();
  updateAuthView();
  if (session) {
    await loadView(defaultView());
    await handleAssetHash();
  }
  window.addEventListener("hashchange", handleAssetHash);
}

function bindChrome() {
  $("loginBtn").onclick = login;
  $("logoutBtn").onclick = logout;
  $("refreshBtn").onclick = () => loadView(currentView);
  $("exportBtn").onclick = exportCurrentCsv;
  $("importBtn").onclick = () => $("fileImport").click();
  $("sampleBtn").onclick = loadSampleData;
  $("clearBtn").onclick = clearTestData;
  $("fileImport").onchange = importLocalJson;
  $("modalClose").onclick = closeModal;
  $("modalCancel").onclick = closeModal;
  $("modalSave").onclick = saveModal;
  document.addEventListener("focusin", (event) => {
    if (event.target?.classList?.contains("suggest-input")) {
      setTimeout(() => event.target.select(), 0);
    }
  });
  new MutationObserver(enhanceColumnFilters).observe($("content"), { childList: true, subtree: true });
}

function renderNav() {
  const visibleModules = isMechanicUser()
    ? [{ group: "Mechanic", items: [["repairs", "Work Orders"]] }]
    : modules;
  $("nav").innerHTML = visibleModules.map((group) => `
    <div class="nav-group">
      <div class="nav-title">${esc(group.group)}</div>
      ${group.items.map(([id, label]) => `<button class="nav-btn" data-view="${id}">${esc(label)}</button>`).join("")}
    </div>
  `).join("");
  document.querySelectorAll("[data-view]").forEach((btn) => btn.onclick = () => loadView(btn.dataset.view));
}

function isMechanicUser() {
  return /mechanic/i.test(profile?.role || "");
}

function defaultView() {
  return isMechanicUser() ? "repairs" : "dashboard";
}

async function login() {
  $("loginMsg").textContent = "";
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    $("loginMsg").textContent = error.message;
    return;
  }
  session = data.session;
  await loadProfile();
  renderNav();
  updateAuthView();
  await loadView(defaultView());
  await handleAssetHash();
}

async function logout() {
  await supabase.auth.signOut();
  session = null;
  profile = null;
  updateAuthView();
}

async function loadProfile() {
  const user = session?.user;
  if (!user) return;
  const { data } = await supabase.from("app_profiles").select("*").eq("id", user.id).maybeSingle();
  profile = data || { username: user.email, full_name: user.email, role: "Administrator", modules: ["all"] };
}

function updateAuthView() {
  document.body.classList.toggle("logged-out", !session);
  document.body.classList.toggle("mechanic-mode", Boolean(session && isMechanicUser()));
  $("loginPanel").style.display = session ? "none" : "block";
  $("content").style.display = session ? "block" : "none";
  $("sessionBox").innerHTML = session ? `Logged in as<br><strong>${esc(profile?.full_name || session.user.email)}</strong><br>${esc(profile?.role || "User")}` : "Not logged in";
  $("logoutBtn").style.display = session ? "inline-block" : "none";
  ["importBtn", "sampleBtn", "clearBtn", "exportBtn"].forEach((id) => {
    if ($(id)) $(id).style.display = session && isMechanicUser() ? "none" : "";
  });
}

function canAccess(view) {
  if (isMechanicUser()) return view === "repairs";
  const mods = profile?.modules || ["all"];
  return mods.includes("all") || mods.includes(view) || view === "dashboard";
}

async function loadView(view) {
  if (!session) return;
  if (isMechanicUser()) view = "repairs";
  if (!canAccess(view)) {
    $("content").innerHTML = `<div class="panel"><div class="empty">Your user does not have access to this module.</div></div>`;
    return;
  }
  currentView = view;
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("content").innerHTML = `<div class="empty">Loading...</div>`;
  if (view === "dashboard") return renderDashboard();
  if (view === "products") return renderProductsView();
  if (view === "movements") return renderStockMovementView();
  if (view === "inventory") return renderInventoryBalanceView();
  if (view === "purchasing") return renderPurchasingView();
  if (view === "receipts") return renderGoodsReceiptsView();
  if (view === "orders") return renderSalesOrdersView();
  if (view === "salestopurchase") return renderSalesPartsToOrderView();
  if (view === "rentals") return renderRentalsView();
  if (view === "invoices") return renderInvoicesView();
  if (view === "payments") return renderCustomerPaymentsView();
  if (view === "accounting") return renderAccountingView();
  if (view === "checkrun") return renderCheckRunView();
  if (view === "bank") return renderBankReconciliationView();
  if (view === "assets") return renderAssetsView();
  if (view === "equipmentrepairqueue") return renderEquipmentRepairQueueView();
  if (view === "repairs") return renderRepairsView();
  if (view === "supplies") return renderSuppliesIssuanceView();
  if (view === "aging") return renderAgingSummaryView();
  if (view === "settings") return renderSettingsView();
  if (tableMap[view]?.derived) return renderDerived(view);
  currentCfg = tableMap[view];
  $("viewTitle").textContent = currentCfg.title;
  $("viewSub").textContent = currentCfg.sub;
  const { data, error } = await supabase.from(currentCfg.table).select("*").order(currentCfg.heads[0], { ascending: false }).limit(500);
  if (error) {
    $("content").innerHTML = `<div class="panel"><div class="empty">${esc(error.message)}</div></div>`;
    return;
  }
  currentRows = data || [];
  renderTableModule();
}

async function renderDashboard() {
  $("viewTitle").textContent = "Dashboard";
  $("viewSub").textContent = "A clear view of stock, value, alerts, and movement.";
  const [products, sales, po, assets, repairs, rentals, invoices, gl] = await Promise.all([
    getAll("products"), getAll("sales_orders"), getAll("purchase_orders"), getAll("assets"), getAll("work_orders"), getAll("rentals"), getAll("invoices"), getAll("general_ledger")
  ]);
  const inventoryValue = products.reduce((s, p) => s + Number(p.qty || 0) * Number(p.cost || 0), 0);
  const low = products.filter((p) => Number(p.qty || 0) <= Number(p.reorder_point || 0)).length;
  const openSales = sales.filter((s) => !["Fulfilled", "Paid", "Cancelled"].includes(s.status)).length;
  const apControl = po.filter((p) => p.payment_status !== "Paid").length;
  const fleetRepair = repairs.filter((r) => !["Complete", "Invoiced", "Cancelled"].includes(r.status)).length;
  const rentalsOut = rentals.filter((r) => ["Out", "Overdue", "Reserved"].includes(r.status)).length;
  const debit = gl.reduce((s, r) => s + Number(r.debit || 0), 0);
  const credit = gl.reduce((s, r) => s + Number(r.credit || 0), 0);

  $("content").innerHTML = `
    <div class="stats fleet-stats">
      ${stat("Inventory Value", money(inventoryValue), `${products.reduce((s, p) => s + Number(p.qty || 0), 0)} units on hand, ${low} low stock`)}
      ${stat("Open Sales / AR", openSales, `${invoices.filter((i) => i.status !== "Paid").length} open invoices`)}
      ${stat("AP To Control", apControl, "POs and payable exposure")}
      ${stat("Fleet & Repairs", assets.length, `${fleetRepair} open repair jobs`)}
      ${stat("Rentals Out", rentalsOut, `${rentals.length} rental records`)}
      ${stat("Net Position", money(debit - credit), "GL debit minus credit check")}
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Action Needed</strong><span>Operational exceptions from across the system</span></div></div>
      <div class="table-wrap"><table><tbody>
        <tr><td>${low} inventory item${low === 1 ? "" : "s"} at or below reorder point.</td><td><button data-jump="products">Review</button></td></tr>
        <tr><td>${po.filter((p) => p.match_status === "Mismatch").length} purchase order${po.length === 1 ? "" : "s"} need PO/GR/invoice matching review.</td><td><button data-jump="purchasing">Review</button></td></tr>
        <tr><td>${fleetRepair} work order${fleetRepair === 1 ? "" : "s"} open or waiting.</td><td><button data-jump="repairs">Review</button></td></tr>
      </tbody></table></div>
    </section>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Quick Access</strong><span>Jump into the most-used modules</span></div></div>
      <div class="quick-grid">
        ${quick("products", "Inventory", "Products, parts, preferred vendors, photos")}
        ${quick("purchasing", "Purchasing", "PO, goods receipt, matching, pay readiness")}
        ${quick("orders", "Sales", "Customer PO, issue goods, AR flow")}
        ${quick("assets", "Fleet", "Equipment photos, QR codes, readings")}
        ${quick("equipmenthistory", "Equipment History", "Parts used, problems, repair timeline")}
        ${quick("repairs", "Repairs", "Work orders, parts, labor clocking")}
        ${quick("supplies", "Supplies", "Issue supplies to people or WOs")}
        ${quick("accounting", "Accounting", "GL, AP, AR, statements, bank rec")}
        ${quick("rentals", "Rentals", "Checkout, returns, deposits, income")}
      </div>
    </section>`;
  document.querySelectorAll("[data-jump],[data-quick]").forEach((b) => b.onclick = () => loadView(b.dataset.jump || b.dataset.quick));
}

function stat(label, value, note) {
  return `<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;
}

function quick(view, title, text) {
  return `<button class="quick-card" data-quick="${view}"><strong>${esc(title)}</strong><span>${esc(text)}</span></button>`;
}

async function renderDerived(view) {
  const cfg = tableMap[view];
  $("viewTitle").textContent = cfg.title;
  $("viewSub").textContent = cfg.sub;
  $("content").innerHTML = `<section class="panel"><div class="empty">This live report shell is ready. The detailed Supabase report logic will be filled in the next passes.</div></section>`;
}

async function renderInventoryBalanceView() {
  currentCfg = { title: "Inventory Balance", sub: "On-hand stock and inventory value from live products.", readOnly: true, heads: ["as_of", "sku", "product", "vendor", "warehouse", "bin_shelf", "qty", "unit_cost", "value", "last_movement", "status"], labels: ["As Of", "SKU", "Product", "Vendor", "Warehouse", "Bin / Shelf", "Qty", "Unit Cost", "Value", "Last Movement", "Status"] };
  $("viewTitle").textContent = "Inventory Balance";
  $("viewSub").textContent = "Inventory balance as of a selected date, or current balance when blank.";
  const [products, movements, receipts, salesOrders, salesLines, workOrders, workOrderParts] = await Promise.all([
    getAll("products"),
    getAll("stock_movements"),
    getAll("goods_receipts"),
    getAll("sales_orders"),
    getAll("sales_order_lines"),
    getAll("work_orders"),
    getAll("work_order_parts"),
  ]);
  const linkedMovements = buildLinkedStockMovements({ movements, products, receipts, salesOrders, salesLines, workOrders, workOrderParts });
  productMeta.products = products;
  productMeta.movements = linkedMovements;
  const rows = inventoryBalanceRows("", products, linkedMovements);
  currentRows = rows;
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="inventorySearch" placeholder="Search inventory balance by SKU, item, vendor, warehouse">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Inventory Balance As Of</strong><span>Leave blank for current live balance.</span></div><div class="actions"><label class="mini-filter">As of <input id="inventoryAsOf" placeholder="mm/dd/yyyy or yyyy-mm-dd"></label><button id="inventoryApplyAsOf">Apply date</button><button id="inventoryCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button></div></div>
      <div id="inventoryNotice" class="notice">As of current: ${money(rows.reduce((sum, row) => sum + Number(row.value || 0), 0))}</div>
      <div id="inventoryTableHost">${inventoryBalanceTableHtml(rows)}</div>
    </section>`;
  $("inventorySearch").oninput = renderFilteredInventoryBalance;
  $("inventoryApplyAsOf").onclick = applyInventoryAsOf;
  $("inventoryCsvBtn").onclick = exportCurrentCsv;
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function inventoryBalanceRows(asOfInput, products = productMeta.products || [], movements = productMeta.movements || []) {
  const asOf = parseFlexibleDate(asOfInput);
  return products.map((p) => {
    const productMoves = movements.filter((m) => (m.product_id && m.product_id === p.id) || (m.sku && m.sku === p.sku));
    const eligibleMoves = asOf ? productMoves.filter((m) => String(m.movement_date || "") <= asOf) : productMoves;
    const qty = asOf ? (eligibleMoves.length ? eligibleMoves.reduce((sum, m) => sum + Number(m.qty || 0), 0) : Number(p.qty || 0)) : Number(p.qty || 0);
    const lastMove = eligibleMoves.sort((a, b) => String(b.movement_date || "").localeCompare(String(a.movement_date || "")))[0];
    const unitCost = Number(lastMove?.unit_fifo_cost ?? p.cost ?? 0);
    return {
      as_of: asOf || "Current",
      sku: p.sku,
      product: p.name,
      vendor: p.source_vendor,
      warehouse: p.warehouse,
      bin_shelf: p.bin_shelf,
      qty,
      unit_cost: unitCost,
      value: qty * unitCost,
      last_movement: lastMove?.movement_date || (asOf ? "Opening / current balance" : ""),
      status: p.status,
    };
  }).filter((row) => !asOf || Number(row.qty || 0) !== 0 || row.last_movement);
}

function inventoryBalanceTableHtml(rows) {
  return `<div class="table-wrap"><table><thead><tr>${currentCfg.labels.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${currentCfg.labels.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${currentCfg.heads.map((h) => `<td>${inventoryBalanceCell(h, row)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${currentCfg.heads.length}" class="empty">No inventory balance for that date.</td></tr>`}</tbody></table></div>`;
}

function inventoryBalanceCell(field, row) {
  if (["unit_cost", "value"].includes(field)) return money(row[field]);
  if (field === "status") return badge(row[field]);
  return esc(row[field] ?? "");
}

function applyInventoryAsOf() {
  const input = $("inventoryAsOf")?.value || "";
  const asOf = parseFlexibleDate(input);
  if (input && !asOf) {
    alert("Enter the as-of date as mm/dd/yyyy or yyyy-mm-dd.");
    return;
  }
  currentRows = inventoryBalanceRows(input, productMeta.products, productMeta.movements);
  $("inventoryNotice").textContent = `As of ${asOf || "current"}: ${money(currentRows.reduce((sum, row) => sum + Number(row.value || 0), 0))}`;
  renderFilteredInventoryBalance();
}

function renderFilteredInventoryBalance() {
  const q = ($("inventorySearch")?.value || "").toLowerCase();
  const rows = currentRows.filter((row) => !q || Object.values(row).join(" ").toLowerCase().includes(q));
  $("inventoryTableHost").innerHTML = inventoryBalanceTableHtml(rows);
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function parseFlexibleDate(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return v;
  const us = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return `${us[3]}-${String(us[1]).padStart(2, "0")}-${String(us[2]).padStart(2, "0")}`;
  return "";
}

async function renderAgingSummaryView() {
  $("viewTitle").textContent = "Aging Summary";
  $("viewSub").textContent = "AR/AP aging by customer/vendor as of a selected date.";
  const [invoices, invoiceLines, payments, purchaseOrders, poLines, receipts] = await Promise.all([
    getAll("invoices"),
    getAll("invoice_lines"),
    getAll("customer_payments"),
    getAll("purchase_orders"),
    getAll("purchase_order_lines"),
    getAll("goods_receipts"),
  ]);
  productMeta.aging = { invoices, invoiceLines, payments, purchaseOrders, poLines, receipts };
  currentRows = agingRows("ar", "summary", "");
  currentCfg = agingCfg("summary");
  $("content").innerHTML = `
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>AR / AP Aging As Of</strong><span>Type a date like 12/31/2025. Blank means today.</span></div><div class="actions"><label class="mini-filter">As of <input id="agingAsOf" placeholder="mm/dd/yyyy or yyyy-mm-dd"></label>${suggestInput("agingType", ["ar", "ap"], "ar", "Type")}${suggestInput("agingMode", ["summary", "detail"], "summary", "Mode")}<button id="agingApply">Apply</button><button id="agingCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button></div></div>
      <div class="toolbar"><input class="searchbox" id="agingSearch" placeholder="Search aging by customer, vendor, invoice, reference"></div>
      <div id="agingNotice" class="notice">${agingNoticeText("ar", "")}</div>
      <div id="agingTableHost">${agingTableHtml(currentRows, "summary")}</div>
    </section>`;
  $("agingApply").onclick = applyAgingFilters;
  $("agingSearch").oninput = renderFilteredAging;
  $("agingCsvBtn").onclick = exportCurrentCsv;
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function applyAgingFilters() {
  const asOfInput = $("agingAsOf")?.value || "";
  const asOf = parseFlexibleDate(asOfInput);
  if (asOfInput && !asOf) {
    alert("Enter the as-of date as mm/dd/yyyy or yyyy-mm-dd.");
    return;
  }
  const type = $("agingType")?.value || "ar";
  const mode = $("agingMode")?.value || "summary";
  currentRows = agingRows(type, mode, asOfInput);
  currentCfg = agingCfg(mode);
  $("agingNotice").textContent = agingNoticeText(type, asOf);
  renderFilteredAging();
}

function renderFilteredAging() {
  const mode = $("agingMode")?.value || "summary";
  const q = ($("agingSearch")?.value || "").toLowerCase();
  const rows = currentRows.filter((row) => !q || Object.values(row).join(" ").toLowerCase().includes(q));
  $("agingTableHost").innerHTML = agingTableHtml(rows, mode);
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function agingRows(type, mode, asOfInput) {
  const asOf = parseFlexibleDate(asOfInput) || today();
  const baseRows = type === "ap" ? apAgingDetailRows(asOf) : arAgingDetailRows(asOf);
  if (mode === "detail") return baseRows;
  const grouped = new Map();
  baseRows.forEach((row) => {
    const key = row.name;
    const g = grouped.get(key) || { name: key, count: 0, balance: 0, current: 0, days30: 0, days60: 0, days90: 0, over90: 0, oldest_due: "", worst_aging: "" };
    g.count += 1;
    ["balance", "current", "days30", "days60", "days90", "over90"].forEach((field) => g[field] += Number(row[field] || 0));
    if (!g.oldest_due || String(row.due_date || "") < g.oldest_due) g.oldest_due = row.due_date || "";
    g.worst_aging = worstAgingLabel(g);
    grouped.set(key, g);
  });
  return [...grouped.values()].sort((a, b) => b.balance - a.balance);
}

function arAgingDetailRows(asOf) {
  const { invoices = [], invoiceLines = [], payments = [] } = productMeta.aging || {};
  return invoices.filter((invoice) => String(invoice.invoice_date || "") <= asOf && !/void|cancel|reversed/i.test(invoice.status || "")).map((invoice) => {
    const total = invoiceLines.filter((line) => line.invoice_id === invoice.id).reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.rate || 0), 0);
    const paid = payments.filter((p) => p.invoice_no === invoice.invoice_no && String(p.payment_date || "") <= asOf && !/void|cancel|reversed/i.test(p.status || "")).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return agingBucketRow({ name: invoice.customer, reference: invoice.source_ref, invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, due_date: invoice.due_date, balance: total - paid, status: invoice.status }, asOf);
  }).filter((row) => row.balance > 0.004);
}

function apAgingDetailRows(asOf) {
  const { purchaseOrders = [], poLines = [], receipts = [] } = productMeta.aging || {};
  return purchaseOrders.map((po) => ({ ...po, _lines: poLines.filter((line) => line.po_id === po.id || line.po_no === po.po_no), _receipts: receipts.filter((gr) => gr.po_no === po.po_no) })).filter((po) => {
    const ap = poApSummary(po);
    const postDate = po.posting_date || ap.invoice_date || po.po_date || "";
    return postDate <= asOf && !/paid|cancel/i.test(po.payment_status || po.status || "");
  }).map((po) => {
    const ap = poApSummary(po);
    return agingBucketRow({ name: po.vendor, reference: po.po_no, invoice_no: ap.invoice_no || "", invoice_date: ap.invoice_date || po.po_date, due_date: ap.due_date || ap.invoice_date || po.po_date, balance: ap.invoice_amount, status: ap.payment || ap.status }, asOf);
  }).filter((row) => row.balance > 0.004);
}

function agingBucketRow(row, asOf) {
  const days = daysBetween(row.due_date || row.invoice_date || asOf, asOf);
  return {
    ...row,
    current: days <= 0 ? row.balance : 0,
    days30: days > 0 && days <= 30 ? row.balance : 0,
    days60: days > 30 && days <= 60 ? row.balance : 0,
    days90: days > 60 && days <= 90 ? row.balance : 0,
    over90: days > 90 ? row.balance : 0,
  };
}

function daysBetween(from, to) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.floor((b - a) / 86400000);
}

function worstAgingLabel(row) {
  if (row.over90) return "90+";
  if (row.days90) return "61-90";
  if (row.days60) return "31-60";
  if (row.days30) return "1-30";
  return "Current";
}

function agingCfg(mode) {
  if (mode === "detail") return { heads: ["name", "reference", "invoice_no", "invoice_date", "due_date", "balance", "current", "days30", "days60", "days90", "over90", "status"], labels: ["Name", "Reference", "Invoice #", "Invoice Date", "Due Date", "Balance", "Current", "1-30", "31-60", "61-90", "90+", "Status"] };
  return { heads: ["name", "count", "balance", "current", "days30", "days60", "days90", "over90", "oldest_due", "worst_aging"], labels: ["Name", "Invoices", "Balance", "Current", "1-30", "31-60", "61-90", "90+", "Oldest Due", "Worst Aging"] };
}

function agingTableHtml(rows, mode) {
  const cfg = agingCfg(mode);
  return `<div class="table-wrap"><table><thead><tr>${cfg.labels.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${cfg.labels.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${cfg.heads.map((h) => `<td>${agingCell(h, row)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cfg.heads.length}" class="empty">No open aging balance for that as-of date.</td></tr>`}</tbody></table></div>`;
}

function agingCell(field, row) {
  if (["balance", "current", "days30", "days60", "days90", "over90"].includes(field)) return money(row[field]);
  if (field === "status" || field === "worst_aging") return badge(row[field]);
  return esc(row[field] ?? "");
}

function agingNoticeText(type, asOf) {
  return `${type === "ap" ? "Accounts Payable" : "Accounts Receivable"} aging as of ${asOf || today()}. Only invoices posted on or before the as-of date are included.`;
}

async function renderAccountingView() {
  currentCfg = tableMap.accounting;
  $("viewTitle").textContent = "Accounting";
  $("viewSub").textContent = "GL, AP, AR, sales history, purchase history, statements, and bank reconciliation.";
  const [gl, coa, invoices, invoiceLines, payments, pos, poLines, receipts, salesOrders, salesLines, bankRows, products] = await Promise.all([
    getAll("general_ledger"),
    getAll("chart_of_accounts"),
    getAll("invoices"),
    getAll("invoice_lines"),
    getAll("customer_payments"),
    getAll("purchase_orders"),
    getAll("purchase_order_lines"),
    getAll("goods_receipts"),
    getAll("sales_orders"),
    getAll("sales_order_lines"),
    getAll("bank_transactions"),
    getAll("products"),
  ]);
  const data = buildAccountingData({ gl, coa, invoices, invoiceLines, payments, pos, poLines, receipts, salesOrders, salesLines, bankRows, products });
  const s = data.summary;
  $("content").innerHTML = `
    <div class="stats">
      ${stat("Sales Revenue", money(s.revenue), "Posted sales, rental, service, and equipment revenue")}
      ${stat("Inventory Value", money(s.inventory), "Current cost value on hand")}
      ${stat("Expenses", money(s.expenses), "Posted costs and expense accounts")}
      ${stat("Net Position", money(s.net), "Revenue minus expenses")}
    </div>
    <section class="panel">
      <div class="toolbar"><input class="searchbox" id="accountingSearch" placeholder="Search accounting by account, customer, vendor, invoice, reference, amount, status"></div>
      <div class="panel-head">
        <div class="tabs">
          ${[
            ["gl", "General Ledger"],
            ["sales", "Sales History"],
            ["purchases", "Purchases History"],
            ["coa", "Chart of Accounts"],
            ["ap", "Accounts Payable"],
            ["ar", "Accounts Receivable"],
            ["tb", "Trial Balance"],
            ["bs", "Balance Sheet"],
            ["is", "Income Statement"],
            ["cf", "Cash Flow"],
            ["bank", "Bank Reconciliation"],
          ].map(([id, label]) => `<button class="${accountingTab === id ? "active" : ""}" data-accounting-tab="${id}">${esc(label)}</button>`).join("")}
        </div>
        <div class="actions">
          <button id="newAccountBtn">Add account</button>
          <button id="newBankItemBtn">Add bank item</button>
          <button class="primary" id="newJournalBtn">Add journal entry</button>
          <button id="accountingCsvBtn">Excel</button>
          <button id="accountingPrintBtn">PDF / Print</button>
        </div>
      </div>
      <div id="accountingTableHost">${accountingPanelHtml(data, accountingTab)}</div>
    </section>`;
  bindAccountingView(data);
}

function buildAccountingData(source) {
  const invoices = source.invoices.map((inv) => ({
    ...inv,
    _lines: source.invoiceLines.filter((line) => line.invoice_id === inv.id || line.invoice_no === inv.invoice_no),
    _paid: source.payments.filter((p) => p.invoice_no === inv.invoice_no && !/void|reverse/i.test(p.status || "")).reduce((sum, p) => sum + Number(p.amount || 0), 0),
  }));
  const pos = source.pos.map((po) => ({
    ...po,
    _lines: source.poLines.filter((line) => line.po_id === po.id || line.po_no === po.po_no),
    _receipts: source.receipts.filter((gr) => gr.po_no === po.po_no),
  }));
  const salesOrders = source.salesOrders.map((order) => ({
    ...order,
    _lines: source.salesLines.filter((line) => line.order_id === order.id || line.order_no === order.order_no),
  }));
  const gl = source.gl
    .map((row) => normalizeGlRow(row))
    .sort((a, b) => String(b.posting_date || "").localeCompare(String(a.posting_date || "")) || String(a.account || "").localeCompare(String(b.account || "")));
  const revenue = gl.filter((row) => /revenue|sales/i.test(row.account || "")).reduce((sum, row) => sum + Number(row.credit || 0) - Number(row.debit || 0), 0);
  const expenses = gl.filter((row) => /expense|cost of goods|cogs|adjustment/i.test(row.account || "")).reduce((sum, row) => sum + Number(row.debit || 0) - Number(row.credit || 0), 0);
  const inventory = source.products.reduce((sum, p) => sum + Number(p.qty || 0) * Number(p.cost || 0), 0);
  return { ...source, invoices, pos, salesOrders, gl, summary: { revenue, expenses, inventory, net: revenue - expenses } };
}

function normalizeGlRow(row) {
  return {
    posting_date: row.posting_date || row.entry_date || row.date || "",
    account: row.account || "",
    customer: row.customer || "",
    vendor: row.vendor || "",
    invoice_no: row.invoice_no || row.invoiceNumber || "",
    invoice_date: row.invoice_date || row.invoiceDate || "",
    due_date: row.due_date || row.dueDate || "",
    mechanic: row.mechanic || "",
    asset: row.asset || "",
    description: row.description || row.notes || "",
    reference: row.reference || "",
    debit: Number(row.debit || 0),
    credit: Number(row.credit || 0),
    source: row.source || "",
    status: row.status || "Posted",
  };
}

function accountingPanelHtml(data, tab) {
  if (tab === "coa") return accountingTable(coaRows(data), ["Code", "Account", "Report", "Type", "Normal Balance", "Debit", "Credit", "Balance"], (r) => [r.account_code || "", r.account, r.report_group || "", r.type, r.normal_balance, money(r.debit), money(r.credit), money(r.balance)]);
  if (tab === "ap") return `<div class="actions"><button id="postApFromPoBtn">Post AP from PO</button><button data-jump="checkrun">Open check run</button></div>${accountingTable(accountsPayableRows(data), ["Vendor", "PO", "PO Date", "Invoice #", "Invoice Date", "Due Date", "PO Total", "Received", "Invoice Amount", "Match", "Payment", "Status", ""], (r) => [r.vendor, r.po_no, r.po_date, r.invoice_no, r.invoice_date, r.due_date, money(r.po_total), money(r.received), money(r.invoice_amount), badge(r.match), badge(r.payment), badge(r.status), apRowActions(r)])}`;
  if (tab === "ar") return `<div class="actions"><button data-jump="payments">Receive payment</button><button data-jump="invoices">Open invoices</button></div>${accountingTable(accountsReceivableRows(data), ["Customer", "Invoice #", "Invoice Date", "Due Date", "Type", "Source", "Invoice Total", "Paid", "Balance", "Status", ""], (r) => [r.customer, r.invoice_no, r.invoice_date, r.due_date, r.type, r.source_ref, money(r.total), money(r.paid), money(r.balance), badge(r.status), arRowActions(r)])}`;
  if (tab === "sales") return accountingTable(salesAccountingRows(data), ["Date", "Sales Order", "Customer", "Customer PO", "Payment Mode", "Status", "Lines", "Subtotal", "Invoice", "AR Balance"], (r) => [r.date, r.order_no, r.customer, r.customer_po, r.payment_mode || "PO", badge(r.status), r.lines, money(r.total), r.invoice_no || "", money(r.balance)]);
  if (tab === "purchases") return accountingTable(purchaseAccountingRows(data), ["Date", "PO", "Vendor", "Invoice", "PO Total", "Received", "AP", "Match", "Payment", "Status", ""], (r) => [r.date, r.po_no, r.vendor, r.invoice_no, money(r.po_total), money(r.received), money(r.ap), badge(r.match), badge(r.payment), badge(r.status), apRowActions(r)]);
  if (tab === "tb") return accountingTable(trialBalanceRows(data), ["Account", "Type", "Debit", "Credit"], (r) => [r.account, r.type, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : ""]);
  if (tab === "bs") return financialStatementHtml("Balance Sheet", balanceSheetRows(data), ["Section", "Account", "Amount"], (r) => [r.section, accountDrillButton(r.account), money(r.amount)], data);
  if (tab === "is") return financialStatementHtml("Income Statement", incomeStatementRows(data), ["Section", "Account", "Amount"], (r) => [r.section, accountDrillButton(r.account), money(r.amount)], data);
  if (tab === "cf") return financialStatementHtml("Cash Flow", cashFlowRows(data), ["Section", "Description", "Amount"], (r) => [r.section, r.description, money(r.amount)], data);
  if (tab === "bank") return `${bankSummaryHtml(data)}${accountingTable(bankReconciliationRows(data), ["Date", "Source", "Description", "Reference", "Debit", "Credit", "Bank Amount", "Status"], (r) => [r.date, r.source, r.description, r.reference, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : "", r.bank_amount !== "" ? money(r.bank_amount) : "", badge(r.status)])}`;
  return accountingTable(data.gl, ["Posting Date", "Account", "Customer", "Vendor", "Invoice #", "Invoice Date", "Due Date", "Mechanic", "Asset", "Description", "Reference", "Debit", "Credit", "Source", "Status"], (r) => [r.posting_date, r.account, r.customer, r.vendor, r.invoice_no, r.invoice_date, r.due_date, r.mechanic, r.asset, r.description, r.reference, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : "", r.source, badge(r.status)]);
}

function accountingTable(rows, heads, mapper) {
  currentRows = rows;
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${mapper(row).map((value) => `<td>${value ?? ""}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No records yet.</td></tr>`}</tbody></table></div>`;
}

function coaRows(data) {
  const accounts = new Map();
  data.coa.forEach((a) => accounts.set(a.account, { account_code: a.account_code || "", account: a.account, report_group: a.report_group || statementGroup(a.type || accountType(a.account)), type: a.type || accountType(a.account), normal_balance: a.normal_balance || normalBalance(a.type || accountType(a.account)), debit: 0, credit: 0 }));
  data.gl.forEach((row) => {
    if (!accounts.has(row.account)) accounts.set(row.account, { account_code: "", account: row.account, report_group: statementGroup(accountType(row.account)), type: accountType(row.account), normal_balance: normalBalance(accountType(row.account)), debit: 0, credit: 0 });
    const account = accounts.get(row.account);
    account.debit += Number(row.debit || 0);
    account.credit += Number(row.credit || 0);
  });
  return [...accounts.values()].map((a) => ({ ...a, balance: /credit/i.test(a.normal_balance) ? a.credit - a.debit : a.debit - a.credit })).sort((a, b) => a.account.localeCompare(b.account));
}

function statementGroup(type) {
  return /revenue|expense|cost|income/i.test(type || "") ? "Income Statement" : "Balance Sheet";
}

function accountType(account) {
  if (/cash|bank|receivable|inventory|equipment|asset/i.test(account || "")) return "Asset";
  if (/payable|credit card|liabil/i.test(account || "")) return "Liability";
  if (/equity|capital/i.test(account || "")) return "Equity";
  if (/revenue|sales|income/i.test(account || "")) return "Revenue";
  return "Expense";
}

function normalBalance(type) {
  return /liability|equity|revenue/i.test(type || "") ? "Credit" : "Debit";
}

function accountsPayableRows(data) {
  return data.pos.map((po) => {
    const poTotalAmount = poTotal(po);
    const received = poReceivedTotal(po);
    const ap = poApSummary(po);
    const apPosted = data.gl.some((row) => row.reference === po.po_no && row.source === "Purchase Order");
    return { id: po.id, vendor: po.vendor, po_no: po.po_no, po_date: po.po_date, invoice_no: ap.invoice_no, invoice_date: ap.invoice_date, due_date: ap.due_date, po_total: poTotalAmount, received, invoice_amount: ap.invoice_amount, match: ap.match, payment: ap.payment, status: apPosted ? "AP Posted" : ap.status, ap_posted: apPosted };
  }).filter((row) => !/cancel/i.test(row.status) && Number(row.received || row.invoice_amount || 0) > 0).sort((a, b) => String(b.po_date || "").localeCompare(String(a.po_date || "")));
}

function poApSummary(po) {
  const received = poReceivedTotal(po);
  const active = activeReceipts(po);
  const receiptInvoiceNo = [...new Set(active.map((gr) => gr.vendor_invoice_no).filter(Boolean))].join(", ");
  const receiptInvoiceDates = active.map((gr) => gr.vendor_invoice_date).filter(Boolean).sort();
  const receiptInvoiceAmount = active.reduce((sum, gr) => sum + Number(gr.vendor_invoice_amount || gr.received_amount || Number(gr.received_qty || 0) * Number(gr.unit_cost || 0)), 0);
  const invoiceAmount = Number(po.vendor_invoice_amount || receiptInvoiceAmount || received || 0);
  const invoiceNo = po.vendor_invoice_no || receiptInvoiceNo || "";
  const invoiceDate = po.vendor_invoice_date || receiptInvoiceDates[0] || po.invoice_date || "";
  const dueDate = po.due_date || invoiceDate || po.expected_date || "";
  const match = po.match_status && !/pending|awaiting/i.test(po.match_status) ? po.match_status : !received ? "Awaiting Goods" : !invoiceAmount ? "Pending" : Math.abs(invoiceAmount - received) <= 0.005 ? "Matched" : "Mismatch";
  const payment = po.payment_status && !/not ready/i.test(po.payment_status) ? po.payment_status : match === "Matched" ? "Ready to Pay" : "Not Ready";
  const status = po.status || (received ? "Goods Received" : "Draft");
  return { invoice_no: invoiceNo, invoice_date: invoiceDate, due_date: dueDate, invoice_amount: invoiceAmount, match, payment, status };
}

function accountsReceivableRows(data) {
  return data.invoices.map((inv) => {
    const total = invoiceTotal(inv);
    const paid = invoicePaid(inv);
    return { id: inv.id, customer: inv.customer, invoice_no: inv.invoice_no, invoice_date: inv.invoice_date, due_date: inv.due_date, type: inv.type, source_ref: inv.source_ref, total, paid, balance: Math.max(0, total - paid), status: inv.status || (total - paid <= 0 ? "Paid" : "Open") };
  }).filter((row) => !/void|reverse/i.test(row.status)).sort((a, b) => String(b.invoice_date || "").localeCompare(String(a.invoice_date || "")));
}

function salesAccountingRows(data) {
  return data.salesOrders.map((order) => {
    const invoice = data.invoices.find((inv) => inv.invoice_no === order.invoice_no || inv.source_ref === order.order_no);
    const lines = order._lines || [];
    const total = lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unit_price || line.price || 0), 0);
    return { date: order.order_date, order_no: order.order_no, customer: order.customer, customer_po: order.customer_po || "", payment_mode: order.payment_mode || "PO", status: order.status || "", lines: lines.length, total, invoice_no: invoice?.invoice_no || order.invoice_no || "", balance: invoice ? invoiceBalance(invoice) : 0 };
  }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function purchaseAccountingRows(data) {
  return accountsPayableRows(data).map((row) => ({ ...row, date: row.po_date, ap: row.invoice_amount }));
}

function apRowActions(row) {
  const needsResolve = /mismatch|pending|awaiting/i.test(`${row.match} ${row.status}`) || Number(row.invoice_amount || 0) !== Number(row.received || row.po_total || 0);
  const canPay = row.ap_posted && /matched/i.test(row.match || "") && !/paid/i.test(row.payment || "");
  return `<div class="rowactions"><button class="rowbtn" type="button" data-ap-post="${esc(row.po_no)}">Post</button>${needsResolve ? `<button class="rowbtn" type="button" data-ap-resolve="${esc(row.po_no)}">Resolve</button>` : ""}${canPay ? `<button class="rowbtn" type="button" data-ap-check="${esc(row.po_no)}">Check</button>` : ""}</div>`;
}

function arRowActions(row) {
  return Number(row.balance || 0) > 0 ? `<button class="rowbtn" type="button" data-ar-receive="${esc(row.invoice_no)}">Receive</button>` : "";
}

function trialBalanceRows(data) {
  return coaRows(data).map((row) => {
    const debitBalance = /credit/i.test(row.normal_balance) ? Math.max(0, -row.balance) : Math.max(0, row.balance);
    const creditBalance = /credit/i.test(row.normal_balance) ? Math.max(0, row.balance) : Math.max(0, -row.balance);
    return { account: row.account, type: row.type, debit: debitBalance, credit: creditBalance };
  }).filter((row) => row.debit || row.credit);
}

function balanceSheetRows(data) {
  return coaRows(data).filter((row) => /asset|liability|equity/i.test(row.type)).map((row) => ({ section: row.type, account: row.account, amount: row.balance }));
}

function incomeStatementRows(data) {
  return coaRows(data).filter((row) => /revenue|expense/i.test(row.type)).map((row) => ({ section: row.type, account: row.account, amount: row.balance }));
}

function cashFlowRows(data) {
  return data.gl.filter((row) => /cash|bank|operating bank/i.test(row.account || "")).map((row) => ({ section: row.debit >= row.credit ? "Cash In" : "Cash Out", description: row.description || row.reference, amount: Number(row.debit || 0) - Number(row.credit || 0) }));
}

function financialStatementHtml(title, rows, heads, mapper) {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return `<div class="notice">${esc(title)} total ${money(total)}. Click an account line to review the posting details.</div>${accountingTable(rows, heads, mapper)}<div id="financialDetailHost"></div>`;
}

function accountDrillButton(account) {
  return `<button class="link-btn" data-account-drill="${esc(account)}">${esc(account)}</button>`;
}

function bankSummaryHtml(data) {
  const rows = bankReconciliationRows(data);
  const book = rows.filter((r) => r.source === "Book").reduce((sum, row) => sum + Number(row.debit || 0) - Number(row.credit || 0), 0);
  const bank = data.bankRows.filter((row) => !/ignored/i.test(row.status || "")).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const unmatched = data.bankRows.filter((row) => /unmatched|review/i.test(row.status || "")).length;
  return `<div class="stats">${stat("Book Cash", money(book), "Cash account from ledger")}${stat("Bank Activity", money(bank), "Bank imported or entered amount")}${stat("Unmatched", unmatched, "Items needing review")}${stat("Difference", money(book - bank), "Book cash less bank activity")}</div>`;
}

function bankReconciliationRows(data) {
  const cashRows = data.gl.filter((row) => /cash|bank|operating bank/i.test(row.account || "")).map((row) => ({ date: row.posting_date, source: "Book", description: row.description, reference: row.reference, debit: row.debit, credit: row.credit, bank_amount: "", status: row.status || "Posted" }));
  const bankRows = data.bankRows.map((row) => ({ date: row.tx_date, source: "Bank", description: row.description, reference: row.reference, debit: "", credit: "", bank_amount: Number(row.amount || 0), status: row.status || "Unmatched" }));
  return [...cashRows, ...bankRows].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function bindAccountingView(data) {
  document.querySelectorAll("[data-accounting-tab]").forEach((btn) => btn.onclick = () => {
    accountingTab = btn.dataset.accountingTab;
    $("accountingTableHost").innerHTML = accountingPanelHtml(data, accountingTab);
    bindAccountingView(data);
  });
  document.querySelectorAll("[data-jump]").forEach((btn) => btn.onclick = () => loadView(btn.dataset.jump));
  const postBtn = $("postApFromPoBtn");
  if (postBtn) postBtn.onclick = () => openPostApFromPoModal(data);
  $("accountingSearch").oninput = applyAccountingSearch;
  $("newAccountBtn").onclick = () => openAccountingSourceModal("coa");
  $("newBankItemBtn").onclick = () => openAccountingSourceModal("bank");
  $("newJournalBtn").onclick = () => openAccountingSourceModal("accounting");
  $("accountingCsvBtn").onclick = exportAccountingCsv;
  $("accountingPrintBtn").onclick = () => window.print();
  document.querySelectorAll("[data-account-drill]").forEach((btn) => btn.onclick = () => showAccountDrill(data, btn.dataset.accountDrill));
  document.querySelectorAll("[data-ap-post]").forEach((btn) => btn.onclick = () => openPostApFromPoModal(data, btn.dataset.apPost));
  document.querySelectorAll("[data-ap-resolve]").forEach((btn) => btn.onclick = () => openResolveApMismatchModal(data, btn.dataset.apResolve));
  document.querySelectorAll("[data-ap-check]").forEach((btn) => btn.onclick = () => createCheckRunFromPo(data, btn.dataset.apCheck));
  document.querySelectorAll("[data-ar-receive]").forEach((btn) => btn.onclick = () => {
    const inv = data.invoices.find((row) => row.invoice_no === btn.dataset.arReceive);
    openCustomerPaymentModal(inv);
  });
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function openAccountingSourceModal(sourceView) {
  currentCfg = tableMap[sourceView];
  openModal();
}

async function openPostApFromPoModal(data, poNo = "") {
  const pos = data.pos.filter((po) => !/cancel/i.test(po.status || ""));
  const po = pos.find((row) => row.po_no === poNo) || pos[0];
  const ap = po ? poApSummary(po) : {};
  const ref = await nextRefPreview("ap", "AP-", "general_ledger", "reference");
  $("modalTitle").textContent = po ? `Post AP from ${po.po_no}` : "Post AP from PO";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productSelect("Purchase order", "po_no", pos.map((row) => `${row.po_no} | ${row.vendor} | ${money(poTotal(row))}`), po ? `${po.po_no} | ${po.vendor} | ${money(poTotal(po))}` : "")}
      ${productInput("AP posting #", "reference", ref)}
      ${productInput("Posting date", "posting_date", today(), "date")}
      ${productInput("Vendor invoice #", "vendor_invoice_no", ap.invoice_no || "")}
      ${productInput("Invoice date", "vendor_invoice_date", ap.invoice_date || po?.po_date || today(), "date")}
      ${productInput("Due date", "due_date", ap.due_date || po?.expected_date || today(), "date")}
      ${productInput("Invoice amount", "vendor_invoice_amount", ap.invoice_amount || poReceivedTotal(po || {}) || poTotal(po || {}), "number")}
      ${productSelect("Match status", "match_status", ["Matched", "Mismatch", "Pending", "Awaiting Goods"], ap.match || "Matched")}
      ${productSelect("Payment status", "payment_status", ["Not Ready", "Ready to Pay", "Hold", "Paid"], ap.payment || "Ready to Pay")}
      ${productSelect("Document status", "status", ["Draft", "Partially Received", "Goods Received", "Matched", "Paid"], ap.status || "Matched")}
      <div class="field wide"><label>PO items purchased / received</label>${apPoLineTable(po)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(po?.notes || "")}</textarea></div>
    </div>
    <p class="notice">Posting AP updates the PO, records the invoice fields, and creates clean debit/credit lines in General Ledger.</p>`;
  $("modalSave").onclick = () => savePostApFromPo(data);
  $("modal").style.display = "flex";
  const input = document.querySelector('[data-product-field="po_no"]');
  if (input) input.onchange = () => openPostApFromPoModal(data, parsePoNo(input.value));
}

function parsePoNo(value) {
  return String(value || "").split("|")[0].trim();
}

function apPoLineTable(po) {
  const heads = ["SKU", "Product", "Ordered", "Received", "Unit Cost", "Received Amount", "WO"];
  const lines = po?._lines || [];
  return `<div class="table-wrap"><table class="mini-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${lines.length ? lines.map((line) => {
    const received = activeReceipts(po).filter((gr) => gr.sku === line.sku).reduce((sum, gr) => sum + Number(gr.received_qty || 0), 0);
    const cost = Number(line.unit_cost || 0);
    return `<tr><td>${esc(line.sku || "")}</td><td>${esc(line.product_name || "")}</td><td>${esc(line.qty || 0)}</td><td>${esc(received)}</td><td>${money(cost)}</td><td>${money(received * cost)}</td><td>${esc(line.wo_no || "")}</td></tr>`;
  }).join("") : `<tr><td colspan="${heads.length}" class="empty">No PO lines found.</td></tr>`}</tbody></table></div>`;
}

async function savePostApFromPo(data) {
  const record = collectProductModalFields();
  const poNo = parsePoNo(record.po_no);
  const po = data.pos.find((row) => row.po_no === poNo);
  if (!po) {
    alert("Choose a valid purchase order.");
    return;
  }
  const invoiceAmount = Number(record.vendor_invoice_amount || 0);
  if (!record.vendor_invoice_no || !record.vendor_invoice_date || !record.due_date || invoiceAmount <= 0) {
    alert("Vendor invoice #, invoice date, due date, and invoice amount are required.");
    return;
  }
  if (isLockedAccountingDate(record.posting_date) || isLockedAccountingDate(record.vendor_invoice_date) || isLockedAccountingDate(record.due_date)) {
    alert("This AP posting is inside the closed accounting period.");
    return;
  }
  const receivedAmount = poReceivedTotal(po);
  if (receivedAmount <= 0) {
    alert("Receive goods before posting Accounts Payable. If the goods receipt was reversed, post a new goods receipt first.");
    return;
  }
  try {
    await supabase.from("purchase_orders").update({
      vendor_invoice_no: record.vendor_invoice_no,
      vendor_invoice_date: record.vendor_invoice_date,
      vendor_invoice_amount: invoiceAmount,
      due_date: record.due_date,
      match_status: record.match_status || "Matched",
      payment_status: record.payment_status || "Ready to Pay",
      status: record.status || "Matched",
      notes: record.notes || po.notes || null,
    }).eq("id", po.id);
    await postPurchaseOrderLedger(po, record);
    closeModal();
    accountingTab = "ap";
    renderAccountingView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function openResolveApMismatchModal(data, poNo) {
  const po = data.pos.find((row) => row.po_no === poNo);
  if (!po) return;
  const ap = poApSummary(po);
  $("modalTitle").textContent = `Resolve AP mismatch ${po.po_no}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("PO", "po_no", po.po_no)}
      ${productInput("Vendor", "vendor", po.vendor || "")}
      ${productInput("PO total", "po_total", poTotal(po), "number")}
      ${productInput("Received total", "received_total", poReceivedTotal(po), "number")}
      ${productInput("Vendor invoice #", "vendor_invoice_no", ap.invoice_no || "")}
      ${productInput("Invoice date", "vendor_invoice_date", ap.invoice_date || today(), "date")}
      ${productInput("Due date", "due_date", ap.due_date || po.expected_date || today(), "date")}
      ${productInput("Invoice amount", "vendor_invoice_amount", ap.invoice_amount || poReceivedTotal(po) || poTotal(po), "number")}
      ${productSelect("Resolve as", "match_status", ["Matched", "Mismatch", "Hold", "Pending"], ap.match || "Matched")}
      ${productSelect("Payment status", "payment_status", ["Ready to Pay", "Not Ready", "Hold", "Paid"], ap.payment || "Ready to Pay")}
      <div class="field wide"><label>Resolution note</label><textarea data-product-field="notes">${esc(po.notes || "")}</textarea></div>
    </div>
    <p class="notice">Use this to document the accounting resolution. The invoice amount and status update the PO and the GL posting can be refreshed from the AP Post action.</p>`;
  $("modalSave").onclick = async () => {
    const record = collectProductModalFields();
    if (isLockedAccountingDate(record.vendor_invoice_date) || isLockedAccountingDate(record.due_date)) {
      alert("This AP resolution is inside the closed accounting period.");
      return;
    }
    try {
      await supabase.from("purchase_orders").update({
        vendor_invoice_no: record.vendor_invoice_no,
        vendor_invoice_date: record.vendor_invoice_date,
        due_date: record.due_date,
        vendor_invoice_amount: Number(record.vendor_invoice_amount || 0),
        match_status: record.match_status,
        payment_status: record.payment_status,
        notes: [po.notes, `Resolved ${new Date().toLocaleString()}: ${record.notes || ""}`].filter(Boolean).join("\n"),
      }).eq("id", po.id);
      closeModal();
      accountingTab = "ap";
      renderAccountingView();
    } catch (error) {
      alert(error.message || error);
    }
  };
  $("modal").style.display = "flex";
}

async function createCheckRunFromPo(data, poNo) {
  const po = data.pos.find((row) => row.po_no === poNo);
  if (!po) return;
  const ap = poApSummary(po);
  const amount = Number(ap.invoice_amount || poReceivedTotal(po) || poTotal(po));
  if (poReceivedTotal(po) <= 0) {
    alert("This PO has no active goods receipt. Receive the goods again before creating a check run.");
    return;
  }
  if (!/ready to pay|paid/i.test(ap.payment || "")) {
    alert("This PO is not ready to pay yet. Post or resolve AP matching first.");
    return;
  }
  if (!await hasPostedApForPurchaseOrder(po.po_no)) {
    alert("Post this receipt to Accounts Payable first. Check run is available after AP is posted.");
    return;
  }
  if (!amount) {
    alert("This PO has no payable amount.");
    return;
  }
  if (isLockedAccountingDate(today())) {
    alert("Today's posting date is inside the closed accounting period.");
    return;
  }
  const coa = data.coa || await getAll("chart_of_accounts");
  const accounts = paymentAccountOptions(coa);
  const checkRunNo = await nextRefPreview("check", "CHK-", "check_runs", "check_run_no");
  $("modalTitle").textContent = `Create check run for ${po.po_no}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Check run #", "check_run_no", checkRunNo)}
      ${productInput("Payment date", "payment_date", today(), "date")}
      ${productSelect("Pay from account", "payment_account", accounts, accounts[0] || "FHB Checking")}
      ${productSelect("Payment mode", "payment_mode", ["Check", "ACH", "Wire", "Cash", "Credit Card"], paymentModeForAccount(accounts[0] || "FHB Checking"))}
      ${productInput("Check # / EFT reference", "check_no", "")}
      ${productInput("Vendor", "vendor", po.vendor || "")}
      ${productInput("Reference", "reference", po.po_no)}
      ${productInput("Invoice #", "invoice_no", ap.invoice_no || "")}
      ${productInput("Invoice date", "invoice_date", ap.invoice_date || "", "date")}
      ${productInput("Due date", "due_date", ap.due_date || po.expected_date || "", "date")}
      ${productInput("Amount", "amount", amount, "number")}
      ${productSelect("Status", "status", ["Draft", "Posted"], "Draft")}
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">Created from ${esc(po.po_no)}</textarea></div>
    </div>
    <p class="notice">Choose the actual cash/checking/bank account or credit card payable account that will pay this AP item.</p>`;
  $("modalSave").onclick = async () => {
    const record = collectProductModalFields();
    if (!record.payment_account) {
      alert("Choose the payment account.");
      return;
    }
    if (isLockedAccountingDate(record.payment_date)) {
      alert("This payment date is inside the closed accounting period.");
      return;
    }
    try {
      const run = {
        check_run_no: record.check_run_no,
        payment_date: record.payment_date,
        payment_mode: record.payment_mode || paymentModeForAccount(record.payment_account),
        payment_account: record.payment_account,
        bank_account: record.payment_account,
        check_no: record.check_no || "",
        vendor: record.vendor || po.vendor,
        reference: record.reference || po.po_no,
        invoice_no: record.invoice_no || "",
        invoice_date: record.invoice_date || null,
        due_date: record.due_date || null,
        amount: Number(record.amount || amount),
        status: record.status || "Draft",
        notes: record.notes || null,
      };
      await upsertOne("check_runs", run, "check_run_no");
      if (/posted/i.test(run.status || "")) {
        await postCheckRunLedger(run);
        await supabase.from("purchase_orders").update({ payment_status: "Paid", status: "Paid" }).eq("id", po.id);
      } else {
        await supabase.from("purchase_orders").update({ payment_status: "Ready to Pay" }).eq("id", po.id);
      }
      await incrementSequence("check");
      closeModal();
      accountingTab = "ap";
      renderAccountingView();
    } catch (error) {
      alert(error.message || error);
    }
  };
  $("modal").style.display = "flex";
}

async function postPurchaseOrderLedger(po, record) {
  const amount = Number(record.vendor_invoice_amount || poReceivedTotal(po) || poTotal(po));
  const received = poReceivedTotal(po);
  if (received <= 0) throw new Error("Receive goods before posting AP for this PO.");
  const variance = amount - received;
  const postingDate = record.posting_date || record.vendor_invoice_date || today();
  const rows = [
    { entry_date: postingDate, posting_date: postingDate, account: "Parts Accrual", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `Clear accrued receipt ${po.po_no}`, reference: po.po_no, debit: received, credit: 0, source: "Purchase Order", status: "Posted" },
    { entry_date: postingDate, posting_date: postingDate, account: "Accounts Payable (A/P)", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `Payable to ${po.vendor}`, reference: po.po_no, debit: 0, credit: amount, source: "Purchase Order", status: "Posted" },
  ];
  if (variance > 0) rows.push({ entry_date: postingDate, posting_date: postingDate, account: "Inventory Loss - Obsolete Part", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `PO invoice variance ${po.vendor}`, reference: po.po_no, debit: variance, credit: 0, source: "Purchase Order", status: "Posted" });
  if (variance < 0) rows.push({ entry_date: postingDate, posting_date: postingDate, account: "Inventory Loss - Obsolete Part", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `PO invoice variance ${po.vendor}`, reference: po.po_no, debit: 0, credit: Math.abs(variance), source: "Purchase Order", status: "Posted" });
  await supabase.from("general_ledger").delete().eq("reference", po.po_no).eq("source", "Purchase Order");
  await upsertMany("general_ledger", rows, "id");
}

async function postGoodsReceiptLedger(receipts) {
  const rows = receipts.flatMap((gr) => {
    const amount = Number(gr.received_qty || 0) * Number(gr.unit_cost || 0);
    if (!amount) return [];
    return [
      { entry_date: gr.gr_date, posting_date: gr.gr_date, account: "Parts Inventory", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Goods receipt ${gr.sku}`, reference: gr.gr_no, debit: amount, credit: 0, source: "Goods Receipt", status: "Posted" },
      { entry_date: gr.gr_date, posting_date: gr.gr_date, account: "Parts Accrual", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Accrued receipt ${gr.sku}`, reference: gr.gr_no, debit: 0, credit: amount, source: "Goods Receipt", status: "Posted" },
    ];
  });
  for (const gr of receipts) {
    await supabase.from("general_ledger").delete().eq("reference", gr.gr_no).eq("source", "Goods Receipt");
  }
  if (rows.length) await upsertMany("general_ledger", rows, "id");
}

async function postGoodsReceiptReversalLedger(gr) {
  const amount = Number(gr.received_qty || 0) * Number(gr.unit_cost || 0);
  if (!amount) return;
  const reference = `REV-${gr.gr_no}`;
  await supabase.from("general_ledger").delete().eq("reference", reference).eq("source", "Goods Receipt Reversal");
  await upsertMany("general_ledger", [
    { entry_date: today(), posting_date: today(), account: "Parts Accrual", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Reverse accrual ${gr.gr_no}`, reference, debit: amount, credit: 0, source: "Goods Receipt Reversal", status: "Posted" },
    { entry_date: today(), posting_date: today(), account: "Parts Inventory", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Reverse inventory ${gr.gr_no}`, reference, debit: 0, credit: amount, source: "Goods Receipt Reversal", status: "Posted" },
  ], "id");
}

function collectProductModalFields() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  return record;
}

function applyAccountingSearch() {
  const q = $("accountingSearch")?.value?.toLowerCase() || "";
  document.querySelectorAll("#accountingTableHost tbody tr").forEach((tr) => {
    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

function showAccountDrill(data, account) {
  const host = $("financialDetailHost");
  if (!host) return;
  const rows = data.gl.filter((row) => row.account === account);
  host.innerHTML = `<section class="panel"><div class="panel-head"><div class="panel-title"><strong>${esc(account)} Detail</strong><span>Posting-date ledger detail for the selected account.</span></div></div>${accountingTable(rows, ["Posting Date", "Description", "Reference", "Customer", "Vendor", "Debit", "Credit", "Source"], (r) => [r.posting_date, r.description, r.reference, r.customer, r.vendor, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : "", r.source])}</section>`;
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function exportAccountingCsv() {
  const rows = [...document.querySelectorAll("#accountingTableHost table tr")].map((tr) => [...tr.children].map((cell) => `"${String(cell.textContent || "").replace(/"/g, '""')}"`).join(","));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `accounting-${accountingTab}-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function renderCheckRunView() {
  currentCfg = tableMap.checkrun;
  $("viewTitle").textContent = "Check Run";
  $("viewSub").textContent = "Select approved payables, filter by vendor, issue checks, and post payments.";
  const [pos, poLines, receipts, runs, coa] = await Promise.all([
    getAll("purchase_orders"),
    getAll("purchase_order_lines"),
    getAll("goods_receipts"),
    getAll("check_runs"),
    getAll("chart_of_accounts"),
  ]);
  const data = buildAccountingData({ gl: [], coa, invoices: [], invoiceLines: [], payments: [], pos, poLines, receipts, salesOrders: [], salesLines: [], bankRows: [], products: [] });
  const vendorFilter = localStorage.getItem("lms.checkRunVendor") || "";
  const payables = checkRunEligiblePayables(data).filter((row) => !vendorFilter || row.vendor === vendorFilter);
  const history = checkRunHistoryRows(runs).filter((row) => !vendorFilter || row.vendor === vendorFilter);
  currentRows = history;
  const vendors = [...new Set([...payables.map((r) => r.vendor), ...history.map((r) => r.vendor)].filter(Boolean))].sort();
  const readyTotal = payables.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  $("content").innerHTML = `
    <div class="stats">
      ${stat("Ready to Pay", payables.length, "Matched payables")}
      ${stat("Open Check Amount", money(readyTotal), "Filtered payable amount")}
      ${stat("Last Check Run", history[0]?.check_run_no || "None", history[0]?.payment_date || "No payments posted")}
      ${stat("Runs Posted", runs.filter((r) => /posted|cleared/i.test(r.status || "")).length, "Payment batches")}
    </div>
    <section class="panel">
      <div class="toolbar">
        <select id="checkRunVendorFilter"><option value="">All vendors</option>${vendors.map((v) => `<option value="${esc(v)}" ${v === vendorFilter ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>
        <input class="searchbox" id="checkRunSearch" placeholder="Search check runs by vendor, PO, invoice, check number, status">
      </div>
      <div class="panel-head"><div class="panel-title"><strong>Payables Ready for Check Run</strong><span>Only matched and approved payables can be selected for payment.</span></div><button class="primary" id="newCheckRunBtn">New check run</button></div>
      <div id="checkRunPayablesHost">${checkRunPayablesTable(payables)}</div>
    </section>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Check Run History</strong><span>Posted and draft payment batches with vendor-level detail.</span></div><div class="actions"><button id="checkRunCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button></div></div>
      <div id="checkRunHistoryHost">${checkRunHistoryTable(history)}</div>
    </section>`;
  $("checkRunVendorFilter").onchange = (e) => {
    localStorage.setItem("lms.checkRunVendor", e.target.value);
    renderCheckRunView();
  };
  $("checkRunSearch").oninput = () => filterTwoTables("checkRunSearch", ["checkRunPayablesHost", "checkRunHistoryHost"]);
  $("newCheckRunBtn").onclick = () => openCheckRunModal(data, vendorFilter);
  $("checkRunCsvBtn").onclick = () => downloadCsv([["Check Run", "Date", "Mode", "Payment Account", "Check #", "Vendor", "Reference", "Invoice", "Amount", "Status"], ...history.map((r) => [r.check_run_no, r.payment_date, r.payment_mode, r.payment_account, r.check_no, r.vendor, r.reference, r.invoice_no, r.amount, r.status])], "check-run.csv");
  bindCheckRunRows();
}

function checkRunEligiblePayables(data) {
  return accountsPayableRows(data).filter((row) => row.ap_posted && /matched/i.test(row.match || "") && /ready/i.test(row.payment || "") && !/paid/i.test(row.payment || row.status || "")).map((row) => ({ ...row, amount: Number(row.invoice_amount || row.received || row.po_total || 0), source: "Purchase Order" }));
}

function checkRunHistoryRows(runs) {
  return [...runs].sort((a, b) => String(b.payment_date || "").localeCompare(String(a.payment_date || "")));
}

function checkRunPayablesTable(rows) {
  const heads = ["Include", "Vendor", "Reference", "Invoice #", "Invoice Date", "Due Date", "Amount", "Match", "Payment", "Source"];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => i ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr><td><input type="checkbox" data-check-payable="${esc(r.po_no)}" checked></td><td>${esc(r.vendor)}</td><td>${esc(r.po_no)}</td><td>${esc(r.invoice_no)}</td><td>${esc(r.invoice_date)}</td><td>${esc(r.due_date)}</td><td>${money(r.amount)}</td><td>${badge(r.match)}</td><td>${badge(r.payment)}</td><td>${esc(r.source)}</td></tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No matched payables ready for check run.</td></tr>`}</tbody></table></div>`;
}

function checkRunHistoryTable(rows) {
  const heads = ["Check Run", "Date", "Payment Mode", "Payment Account", "Check #", "Vendor", "Reference", "Invoice #", "Invoice Date", "Due Date", "Amount", "Status", "Notes", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr><td>${esc(r.check_run_no)}</td><td>${esc(r.payment_date)}</td><td>${esc(r.payment_mode)}</td><td>${esc(r.payment_account)}</td><td>${esc(r.check_no || "")}</td><td>${esc(r.vendor)}</td><td>${esc(r.reference)}</td><td>${esc(r.invoice_no || "")}</td><td>${esc(r.invoice_date || "")}</td><td>${esc(r.due_date || "")}</td><td>${money(r.amount)}</td><td>${badge(r.status)}</td><td>${esc(r.notes || "")}</td><td><div class="rowactions"><button class="rowbtn" data-check-print="${esc(r.check_run_no)}">Print</button>${/draft/i.test(r.status || "") ? `<button class="rowbtn" data-check-post="${esc(r.check_run_no)}">Post</button>` : ""}</div></td></tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No check runs yet.</td></tr>`}</tbody></table></div>`;
}

function bindCheckRunRows() {
  document.querySelectorAll("[data-check-print]").forEach((btn) => btn.onclick = () => printCheckRun(btn.dataset.checkPrint));
  document.querySelectorAll("[data-check-post]").forEach((btn) => btn.onclick = () => postCheckRun(btn.dataset.checkPost));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function openCheckRunModal(data, vendorFilter = "") {
  const payables = checkRunEligiblePayables(data).filter((row) => !vendorFilter || row.vendor === vendorFilter);
  const number = await nextRefPreview("check", "CHK-", "check_runs", "check_run_no");
  const accounts = paymentAccountOptions(data.coa || []);
  $("modalTitle").textContent = "New check run";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Check run #", "check_run_no", number)}
      ${productInput("Payment date", "payment_date", today(), "date")}
      ${productSelect("Pay from account", "payment_account", accounts, accounts[0] || "FHB Checking")}
      ${productSelect("Payment mode", "payment_mode", ["Check", "ACH", "Wire", "Cash", "Credit Card"], "Check")}
      ${productInput("Starting check # / EFT batch", "check_no", "")}
      <div class="field wide"><label>Payables to include</label>${checkRunPayablesTable(payables)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes"></textarea></div>
    </div>
    <p class="notice">${vendorFilter ? `Filtered to ${esc(vendorFilter)}. ` : ""}Posting creates AP payment lines and matched bank payment activity.</p>`;
  $("modalSave").onclick = () => saveCheckRunModal(data, payables);
  $("modal").style.display = "flex";
}

function paymentAccountOptions(coa = []) {
  const names = (coa || [])
    .map((a) => a.account)
    .filter((account) => {
      const text = String(account || "");
      const isCash = /cash|bank|checking|savings|petty cash/i.test(text) && !/receivable|payable|deposit/i.test(text);
      const isCreditCardPayable = /credit card payable|card payable/i.test(text);
      return isCash || isCreditCardPayable;
    });
  return [...new Set([...(names.length ? names : []), "FHB Checking", "Credit Card Payable - LMS Impo"])];
}

async function saveCheckRunModal(data, payables) {
  const record = collectProductModalFields();
  const selected = payables.filter((row) => document.querySelector(`[data-check-payable="${CSS.escape(row.po_no)}"]`)?.checked);
  if (!selected.length) {
    alert("Select at least one payable.");
    return;
  }
  if (isLockedAccountingDate(record.payment_date)) {
    alert("This payment date is inside the closed accounting period.");
    return;
  }
  try {
    for (const [index, row] of selected.entries()) {
      const checkNo = sequentialCheckNo(record.check_no, index);
      await upsertOne("check_runs", {
        check_run_no: index ? `${record.check_run_no}-${index + 1}` : record.check_run_no,
        payment_date: record.payment_date,
        payment_mode: record.payment_mode || paymentModeForAccount(record.payment_account),
        payment_account: record.payment_account,
        bank_account: record.payment_account,
        check_no: checkNo,
        vendor: row.vendor,
        reference: row.po_no,
        invoice_no: row.invoice_no || "",
        invoice_date: row.invoice_date || null,
        due_date: row.due_date || null,
        amount: Number(row.amount || 0),
        status: "Posted",
        notes: record.notes || null,
      }, "check_run_no");
      await supabase.from("purchase_orders").update({ payment_status: "Paid", status: "Paid" }).eq("po_no", row.po_no);
      await postCheckRunLedger({ ...record, check_no: checkNo, vendor: row.vendor, reference: row.po_no, invoice_no: row.invoice_no, invoice_date: row.invoice_date, due_date: row.due_date, amount: row.amount, status: "Posted" });
    }
    await incrementSequence("check");
    closeModal();
    renderCheckRunView();
  } catch (error) {
    alert(error.message || error);
  }
}

function sequentialCheckNo(start, index) {
  const n = Number(start);
  return Number.isFinite(n) && start !== "" ? String(n + index) : start || "";
}

function paymentModeForAccount(account) {
  if (/credit card|card payable/i.test(account || "")) return "Credit Card";
  if (/cash|petty cash/i.test(account || "")) return "Cash";
  if (/wire/i.test(account || "")) return "Wire";
  return "Check";
}

async function postCheckRun(checkRunNo) {
  const rows = await getAll("check_runs");
  const run = rows.find((r) => r.check_run_no === checkRunNo);
  if (!run) return;
  if (isLockedAccountingDate(run.payment_date)) {
    alert("This check run is inside the closed accounting period.");
    return;
  }
  await supabase.from("check_runs").update({ status: "Posted" }).eq("check_run_no", checkRunNo);
  await postCheckRunLedger({ ...run, status: "Posted" });
  if (run.reference) await supabase.from("purchase_orders").update({ payment_status: "Paid", status: "Paid" }).eq("po_no", run.reference);
  renderCheckRunView();
}

async function postCheckRunLedger(run) {
  const amount = Number(run.amount || 0);
  if (!amount) return;
  await upsertOne("bank_transactions", { tx_date: run.payment_date, bank_account: run.bank_account || run.payment_account || "FHB Checking", description: `Check run ${run.check_run_no || run.reference}`, reference: run.check_run_no || run.reference, amount: -Math.abs(amount), status: "Matched", matched_reference: run.reference, notes: `Account: ${run.bank_account || run.payment_account || "FHB Checking"}` }, "id");
  await supabase.from("general_ledger").delete().eq("reference", run.check_run_no || run.reference).eq("source", "Check Run");
  await upsertMany("general_ledger", [
    { entry_date: run.payment_date, posting_date: run.payment_date, account: "Accounts Payable (A/P)", vendor: run.vendor, invoice_no: run.invoice_no || null, invoice_date: run.invoice_date || null, due_date: run.due_date || null, description: `Payment to ${run.vendor}`, reference: run.check_run_no || run.reference, debit: amount, credit: 0, source: "Check Run", status: run.status || "Posted" },
    { entry_date: run.payment_date, posting_date: run.payment_date, account: run.payment_account || "FHB Checking", vendor: run.vendor, invoice_no: run.invoice_no || null, invoice_date: run.invoice_date || null, due_date: run.due_date || null, description: `Check run ${run.check_no || run.check_run_no || ""}`, reference: run.check_run_no || run.reference, debit: 0, credit: amount, source: "Check Run", status: run.status || "Posted" },
  ], "id");
}

function printCheckRun(checkRunNo) {
  const row = currentRows.find((r) => r.check_run_no === checkRunNo) || {};
  const html = `<html><head><title>${esc(checkRunNo)}</title><style>body{font-family:Arial;margin:36px}.check{width:8.5in;min-height:3.5in;border:1px solid #d7dee8;padding:24px}.top{display:flex;justify-content:space-between}.amount{font-size:22px;font-weight:700}.line{border-bottom:1px solid #111;height:36px;margin-top:20px}.memo{margin-top:18px;color:#475569}</style></head><body><section class="check"><div class="top"><div><strong>${esc(row.payment_date || today())}</strong><br>${esc(row.vendor || "")}</div><div>Check # ${esc(row.check_no || row.check_run_no || "")}</div></div><p class="amount">${money(row.amount || 0)}</p><div class="line"></div><div class="memo">Invoice ${esc(row.invoice_no || "")} | Reference ${esc(row.reference || "")} | ${esc(row.payment_account || "")}</div></section><script>print()</script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return alert("Allow popups to print checks.");
  win.document.write(html);
  win.document.close();
}

async function renderBankReconciliationView() {
  currentCfg = tableMap.bank;
  $("viewTitle").textContent = "Bank / Credit Card Reconciliation";
  $("viewSub").textContent = "Statement format per bank account or credit card payable account.";
  const [gl, bankRows, coa] = await Promise.all([getAll("general_ledger"), getAll("bank_transactions"), getAll("chart_of_accounts")]);
  const banks = reconciliationAccountOptions(coa, gl);
  const selectedBank = localStorage.getItem("lms.bankRecBank") || banks[0] || "Operating Bank";
  const accountKind = reconciliationAccountKind(selectedBank);
  const periodTo = localStorage.getItem("lms.bankRecTo") || today();
  const periodFrom = localStorage.getItem("lms.bankRecFrom") || monthStart(periodTo);
  const begInfo = getBankBeginningBalance(selectedBank);
  const beg = Number(begInfo.amount || 0);
  const statement = buildBankStatement(gl.map(normalizeGlRow), bankRows, selectedBank, periodFrom, periodTo, beg);
  $("content").innerHTML = `
    <div class="stats">
      ${stat("Beginning Balance", money(beg), `As of ${begInfo.as_of_date || "account setup"} for ${selectedBank}`)}
      ${stat("Ending Balance Per Book", money(statement.bookEnding), "Beginning balance plus book activity")}
      ${stat(`Ending Balance Per ${accountKind}`, money(statement.bankEnding), `Beginning balance plus ${accountKind.toLowerCase()} activity`)}
      ${stat("Difference", money(statement.difference), `Book ending less ${accountKind.toLowerCase()} ending`)}
    </div>
    <section class="panel">
      <div class="toolbar">
        <select id="bankRecBank">${banks.map((b) => `<option value="${esc(b)}" ${b === selectedBank ? "selected" : ""}>${esc(b)}</option>`).join("")}</select>
        <label>From <input type="date" id="bankRecFrom" value="${esc(periodFrom)}"></label>
        <label>To <input type="date" id="bankRecTo" value="${esc(periodTo)}"></label>
        <button id="bankBegBtn">Set beginning balance</button>
        <button id="bankItemBtn">Add bank item</button>
        <button id="bankCsvBtn">Excel</button>
        <button onclick="window.print()">PDF / Print</button>
      </div>
      <div id="bankRecHost">${bankStatementHtml(statement, selectedBank, periodFrom, periodTo, accountKind)}</div>
    </section>`;
  $("bankRecBank").onchange = (e) => { localStorage.setItem("lms.bankRecBank", e.target.value); renderBankReconciliationView(); };
  $("bankRecFrom").onchange = (e) => { localStorage.setItem("lms.bankRecFrom", e.target.value); renderBankReconciliationView(); };
  $("bankRecTo").onchange = (e) => { localStorage.setItem("lms.bankRecTo", e.target.value); renderBankReconciliationView(); };
  $("bankBegBtn").onclick = () => openBankBeginningModal(selectedBank);
  $("bankItemBtn").onclick = () => openBankTransactionModal(selectedBank);
  $("bankCsvBtn").onclick = () => exportBankStatementCsv(statement, selectedBank, periodFrom, periodTo);
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function reconciliationAccountOptions(coa = [], gl = []) {
  const coaAccounts = coa.map((a) => a.account).filter(Boolean);
  const glAccounts = gl.map((r) => r.account).filter(Boolean);
  return [...new Set([...coaAccounts, ...glAccounts, "Operating Bank", "Cash", "Credit Card Payable"].filter((account) => /cash|bank|checking|savings|credit card|card payable/i.test(account || "")))].sort();
}

function reconciliationAccountKind(account) {
  return /credit card|card payable/i.test(account || "") ? "Credit Card Statement" : "Bank Statement";
}

function monthStart(dateText) {
  const date = new Date(`${dateText || today()}T00:00:00`);
  if (Number.isNaN(date.getTime())) return today().slice(0, 8) + "01";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function buildBankStatement(gl, bankRows, bank, from, to, beginningBalance) {
  const inPeriod = (date) => String(date || "") >= from && String(date || "") <= to;
  const beforePeriod = (date) => String(date || "") < from;
  const bankName = String(bank || "").toLowerCase();
  const bookRows = gl.filter((r) => String(r.account || "").toLowerCase() === bankName);
  const bookPrior = bookRows.filter((r) => beforePeriod(r.posting_date)).reduce((sum, r) => sum + Number(r.debit || 0) - Number(r.credit || 0), 0);
  const bookPeriod = bookRows.filter((r) => inPeriod(r.posting_date)).map((r) => ({
    type: Number(r.debit || 0) >= Number(r.credit || 0) ? "Deposit" : "Check",
    date: r.posting_date,
    num: r.reference,
    vendor: r.vendor || r.customer || r.description || "",
    amount: Number(r.debit || 0) - Number(r.credit || 0),
    status: r.status || "Posted",
    source: "Book",
  }));
  const bankPeriod = bankRows.filter((r) => inPeriod(r.tx_date) && bankTransactionBank(r, bank)).map((r) => ({
    type: Number(r.amount || 0) >= 0 ? "Deposit" : "Check",
    date: r.tx_date,
    num: r.reference,
    vendor: bankPayeeName(r),
    amount: Number(r.amount || 0),
    status: r.status || "Unmatched",
    source: "Bank",
  }));
  const cleared = bankPeriod.filter((r) => /matched|cleared/i.test(r.status));
  const uncleared = bankPeriod.filter((r) => !/matched|cleared/i.test(r.status));
  const bookRefs = new Set(bookPeriod.map((r) => String(r.num || "").toLowerCase()).filter(Boolean));
  const bankRefs = new Set(bankPeriod.map((r) => String(r.num || "").toLowerCase()).filter(Boolean));
  const adjustments = bookPeriod.filter((r) => r.num && !bankRefs.has(String(r.num).toLowerCase())).map((r) => ({ ...r, source: "Book adjustment" }));
  const newTransactions = bankPeriod.filter((r) => r.num && !bookRefs.has(String(r.num).toLowerCase())).map((r) => ({ ...r, source: "Bank new transaction" }));
  const bookActivity = bookPeriod.reduce((sum, r) => sum + r.amount, 0);
  const clearedActivity = cleared.reduce((sum, r) => sum + r.amount, 0);
  const unclearedActivity = uncleared.reduce((sum, r) => sum + r.amount, 0);
  const adjustmentActivity = adjustments.reduce((sum, r) => sum + r.amount, 0);
  const registerBalance = beginningBalance + bookPrior;
  return {
    beginningBalance,
    registerBalance,
    checks: cleared.filter((r) => r.amount < 0),
    deposits: cleared.filter((r) => r.amount >= 0),
    uncleared,
    adjustments,
    newTransactions,
    checksTotal: cleared.filter((r) => r.amount < 0).reduce((sum, r) => sum + r.amount, 0),
    depositsTotal: cleared.filter((r) => r.amount >= 0).reduce((sum, r) => sum + r.amount, 0),
    unclearedTotal: unclearedActivity,
    adjustmentTotal: adjustmentActivity,
    bookEnding: beginningBalance + bookPrior + bookActivity,
    bankEnding: beginningBalance + clearedActivity,
    difference: beginningBalance + bookPrior + bookActivity - (beginningBalance + clearedActivity),
  };
}

function bankPayeeName(row) {
  const text = row.description || row.notes || "";
  return text.replace(/^Check run\s*/i, "").trim() || row.matched_reference || "";
}

function bankStatementHtml(statement, bank, from, to, accountKind = "Bank Statement") {
  return `<div class="bank-statement">
    <div class="bank-title">
      <strong>LMS IMPORTS</strong>
      <span>${esc(accountKind)} Reconciliation Statement</span>
      <span>${esc(bank)}</span>
      <span>${formatDisplayDate(to)}</span>
    </div>
    <table class="bank-rec-table">
      <thead><tr><th>Type</th><th>Date</th><th>Num</th><th>Vendor Name</th><th class="num">Amount</th><th class="num">Balance</th></tr></thead>
      <tbody>
        <tr class="section-total"><td colspan="5">Beginning Balance</td><td class="num">${bankAmount(statement.beginningBalance)}</td></tr>
        ${bankSection("Cleared Transactions", "", [])}
        ${bankSection("Checks and Payments", "", statement.checks)}
        ${bankSubtotal(statement.checksTotal)}
        ${bankSection("Deposits and Credits", "", statement.deposits)}
        ${bankSubtotal(statement.depositsTotal)}
        ${bankSection("Uncleared Transaction", "", statement.uncleared)}
        ${bankSubtotal(statement.unclearedTotal)}
        <tr class="section-total"><td colspan="4">Register Balance as of ${formatDisplayDate(from)}</td><td class="num">${bankAmount(statement.registerBalance)}</td><td class="num">${bankAmount(statement.bookEnding)}</td></tr>
        ${bankSection("For Adjustment", "Checks and Payments", statement.adjustments.filter((r) => r.amount < 0))}
        ${bankSubtotal(statement.adjustments.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0))}
        ${bankSection("", "New Transaction", statement.newTransactions)}
        ${bankSubtotal(statement.newTransactions.reduce((s, r) => s + r.amount, 0))}
        <tr class="grand-total"><td colspan="4">Ending Balance</td><td class="num">${bankAmount(statement.bankEnding)}</td><td class="num">${bankAmount(statement.bookEnding)}</td></tr>
      </tbody>
    </table>
  </div>`;
}

function bankSection(title, subtitle, rows) {
  return `${title ? `<tr class="section"><td colspan="6">${esc(title)}</td></tr>` : ""}${subtitle ? `<tr class="subsection"><td colspan="6">${esc(subtitle)}</td></tr>` : ""}${rows.map(bankStatementRow).join("")}`;
}

function bankStatementRow(row) {
  return `<tr><td>${esc(row.type || "")}</td><td>${formatDisplayDate(row.date)}</td><td><strong>${esc(row.num || "")}</strong></td><td>${esc(row.vendor || "")}</td><td class="num">${bankAmount(row.amount)}</td><td class="num">${bankAmount(row.amount)}</td></tr>`;
}

function bankSubtotal(amount) {
  return `<tr class="subtotal"><td colspan="4"></td><td class="num">${bankAmount(amount)}</td><td class="num">${bankAmount(amount)}</td></tr>`;
}

function bankAmount(amount) {
  const n = Number(amount || 0);
  const formatted = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${formatted})` : formatted;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  return `${Number(m)}/${Number(d)}/${y}`;
}

function exportBankStatementCsv(statement, bank, from, to) {
  const rows = [["LMS IMPORTS"], ["Bank Reconciliation Statement"], [bank], [formatDisplayDate(to)], [], ["Type", "Date", "Num", "Vendor Name", "Amount", "Balance"], ["Beginning Balance", "", "", "", "", statement.beginningBalance]];
  [["Checks and Payments", statement.checks], ["Deposits and Credits", statement.deposits], ["Uncleared Transaction", statement.uncleared], ["For Adjustment", statement.adjustments], ["New Transaction", statement.newTransactions]].forEach(([label, items]) => {
    rows.push([label, "", "", "", "", ""]);
    items.forEach((r) => rows.push([r.type, formatDisplayDate(r.date), r.num, r.vendor, r.amount, r.amount]));
  });
  rows.push(["Ending Balance", "", "", "", statement.bankEnding, statement.bookEnding]);
  downloadCsv(rows, `bank-reconciliation-${bank}-${from}-to-${to}.csv`);
}

function buildBankRecRows(gl, bankRows, bank, asOf) {
  const book = gl.filter((r) => r.posting_date <= asOf && String(r.account || "").toLowerCase() === String(bank || "").toLowerCase()).map((r) => ({ date: r.posting_date, source: "Book", description: r.description, reference: r.reference, debit: r.debit, credit: r.credit, bank_amount: "", status: r.status || "Posted" }));
  const bankTx = bankRows.filter((r) => String(r.tx_date || "") <= asOf && bankTransactionBank(r, bank)).map((r) => ({ date: r.tx_date, source: "Bank", description: r.description, reference: r.reference, debit: "", credit: "", bank_amount: Number(r.amount || 0), status: r.status || "Unmatched" }));
  return [...book, ...bankTx].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function bankTransactionBank(row, bank) {
  if (row.bank_account) return row.bank_account === bank;
  const note = String(row.notes || "");
  const match = note.match(/Bank:\s*([^|]+)/i);
  return match ? match[1].trim() === bank : bank === "Operating Bank";
}

function bankRecTable(rows) {
  const heads = ["Date", "Source", "Description", "Reference", "Debit", "Credit", "Bank Amount", "Status"];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr><td>${esc(r.date)}</td><td>${esc(r.source)}</td><td>${esc(r.description)}</td><td>${esc(r.reference)}</td><td>${r.debit ? money(r.debit) : ""}</td><td>${r.credit ? money(r.credit) : ""}</td><td>${r.bank_amount !== "" ? money(r.bank_amount) : ""}</td><td>${badge(r.status)}</td></tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No bank or book activity for this bank/date.</td></tr>`}</tbody></table></div>`;
}

function getBankBeginningBalance(bank) {
  const data = JSON.parse(localStorage.getItem("lms.bankBegBalances") || "{}");
  const value = data[bank];
  if (typeof value === "object" && value) return { as_of_date: value.as_of_date || "", amount: Number(value.amount || 0) };
  return { as_of_date: "", amount: Number(value || 0) };
}

function setBankBeginningBalance(bank, asOfDate, amount) {
  const data = JSON.parse(localStorage.getItem("lms.bankBegBalances") || "{}");
  data[bank] = { as_of_date: asOfDate || today(), amount: Number(amount || 0) };
  localStorage.setItem("lms.bankBegBalances", JSON.stringify(data));
}

function openBankBeginningModal(bank) {
  const beg = getBankBeginningBalance(bank);
  $("modalTitle").textContent = `Beginning balance - ${bank}`;
  $("modalBody").innerHTML = `<div class="form-grid">${productInput("Bank account", "bank", bank)}${productInput("As of date", "as_of_date", beg.as_of_date || today(), "date")}${productInput("Beginning balance", "amount", beg.amount, "number")}</div><p class="notice">This beginning balance is used as the starting point for bank reconciliation totals.</p>`;
  $("modalSave").onclick = () => {
    const record = collectProductModalFields();
    setBankBeginningBalance(record.bank || bank, record.as_of_date, record.amount);
    closeModal();
    renderBankReconciliationView();
  };
  $("modal").style.display = "flex";
}

async function openBankTransactionModal(bank) {
  const kind = reconciliationAccountKind(bank);
  $("modalTitle").textContent = `Add ${kind.toLowerCase()} item`;
  $("modalBody").innerHTML = `<div class="form-grid">${productInput("Account", "bank_account", bank)}${productInput("Date", "tx_date", today(), "date")}${productInput("Description", "description", "")}${productInput("Reference", "reference", "")}${productInput("Amount", "amount", 0, "number")}${productSelect("Status", "status", ["Unmatched", "Matched", "Cleared", "Ignored"], "Unmatched")}${productInput("Matched reference", "matched_reference", "")}<div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(kind)}: ${esc(bank)}</textarea></div></div>`;
  $("modalSave").onclick = async () => {
    const record = collectProductModalFields();
    try {
      await upsertOne("bank_transactions", { ...record, amount: Number(record.amount || 0) }, "id");
      closeModal();
      renderBankReconciliationView();
    } catch (error) {
      alert(error.message || error);
    }
  };
  $("modal").style.display = "flex";
}

async function renderSettingsView() {
  $("viewTitle").textContent = "Settings";
  $("viewSub").textContent = "System controls, accounting period close, and setup values.";
  const closeDate = getAccountingCloseDate();
  const isAdmin = /admin/i.test(profile?.role || "");
  $("content").innerHTML = `
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Accounting Period Close</strong><span>Locks prior posting periods so posted data cannot be changed accidentally.</span></div></div>
      <div class="form-grid">
        <div class="field"><label>Closed through posting date</label><input type="date" id="closePostingDate" value="${esc(closeDate)}" ${isAdmin ? "" : "disabled"}></div>
        <div class="field"><label>Status</label>${badge(closeDate ? `Closed through ${closeDate}` : "Open")}</div>
      </div>
      <div class="actions"><button class="primary" id="saveCloseDateBtn" ${isAdmin ? "" : "disabled"}>Save close date</button><button id="openPeriodBtn" ${isAdmin ? "" : "disabled"}>Open period</button></div>
      <p class="notice">Only administrators should change this. Transactions dated on or before the closed date are blocked from editing, posting, reversing, and payment.</p>
    </section>`;
  $("saveCloseDateBtn").onclick = () => {
    setAccountingCloseDate($("closePostingDate").value);
    renderSettingsView();
  };
  $("openPeriodBtn").onclick = () => {
    if (!confirm("Open prior accounting periods? This allows older transactions to be changed again.")) return;
    setAccountingCloseDate("");
    renderSettingsView();
  };
}

function getAccountingCloseDate() {
  return localStorage.getItem("lms.accountingCloseDate") || "";
}

function setAccountingCloseDate(value) {
  localStorage.setItem("lms.accountingCloseDate", value || "");
}

function isLockedAccountingDate(value) {
  const closeDate = getAccountingCloseDate();
  const date = String(value || "").slice(0, 10);
  return Boolean(closeDate && date && date <= closeDate);
}

function filterTwoTables(inputId, hostIds) {
  const q = $(inputId)?.value?.toLowerCase() || "";
  hostIds.forEach((id) => {
    document.querySelectorAll(`#${id} tbody tr`).forEach((tr) => {
      tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

async function renderProductsView() {
  currentCfg = tableMap.products;
  $("viewTitle").textContent = "Products";
  $("viewSub").textContent = "Manage SKUs, pricing, locations, reorder points, and batches.";
  const [products, vendors, categories, units, warehouses, purchaseOrders, salesOrders] = await Promise.all([
    getAll("products"),
    getAll("vendors"),
    getAll("categories"),
    getAll("units"),
    getAll("warehouses"),
    getAll("purchase_orders"),
    getAll("sales_orders"),
  ]);
  productMeta = {
    vendors: vendors.map((v) => v.name).filter(Boolean).sort(),
    categories: categories.map((v) => v.name).filter(Boolean).sort(),
    units: units.map((v) => v.name).filter(Boolean).sort(),
    warehouses: warehouses.map((v) => v.name).filter(Boolean).sort(),
  };
  currentRows = products.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
  const stats = productStats(currentRows);
  const openPOs = purchaseOrders.filter((po) => !["Goods Received", "Matched", "Paid", "Cancelled"].includes(po.status)).length;
  const awaitingMatch = purchaseOrders.filter((po) => ["Goods Received", "Partially Received"].includes(po.status) && po.match_status !== "Matched").length;
  const issuableOrders = salesOrders.filter((o) => !["Quotation", "Fulfilled", "Paid", "Cancelled"].includes(o.status)).length;

  $("content").innerHTML = `
    <div class="toolbar product-toolbar">
      <input class="searchbox" id="productSearch" placeholder="Search SKU, name, supplier, location">
      ${selectHtml("productCategoryFilter", "All categories", productMeta.categories)}
      ${selectHtml("productWarehouseFilter", "All warehouses", productMeta.warehouses)}
      ${selectHtml("productStatusFilter", "All statuses", ["Active", "Low", "Out", "Inactive", "Discontinued"])}
      <button id="addWarehouseBtn">Add warehouse</button>
      <button class="primary" id="addProductBtn">Add product</button>
    </div>
    <div class="stats">
      ${stat("Products", stats.count, `${stats.inactive} inactive`)}
      ${stat("Units On Hand", stats.qty, `Across ${stats.locations} locations`)}
      ${stat("Inventory Value", money(stats.value), `Potential retail ${money(stats.retail)}`)}
      ${stat("Needs Attention", stats.low, `${stats.out} out of stock`)}
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Inventory Process Flow</strong><span>Use documents for every stock change so accounting, costing, and history stay clean.</span></div></div>
      <div class="quick-grid">
        ${flowCard("purchasing", "1. Buy", "Create PO to vendor", `${openPOs} open POs`)}
        ${flowCard("purchasing", "2. Receive", "Post goods receipt from PO", "Received stock becomes available")}
        ${flowCard("accounting", "3. Match & Pay", "Match PO, GR, and vendor invoice", `${awaitingMatch} need review`)}
        ${flowCard("orders", "4. Issue", "Issue only received goods", `${issuableOrders} orders pending`)}
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Product Master</strong><span>${currentRows.length} items shown. Master data only; stock changes post from documents.</span></div><div class="actions"><button id="productColumnsBtn">Columns</button><button id="productsCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button></div></div>
      <div class="column-chooser" id="productColumnChooser" hidden>${productColumnChooserHtml()}</div>
      <div id="productTableHost">${productTableHtml(currentRows)}</div>
    </section>`;

  $("productSearch").oninput = renderFilteredProducts;
  $("productCategoryFilter").oninput = renderFilteredProducts;
  $("productWarehouseFilter").oninput = renderFilteredProducts;
  $("productStatusFilter").oninput = renderFilteredProducts;
  $("addWarehouseBtn").onclick = () => quickCreateMaster("warehouses", "Warehouse");
  $("addProductBtn").onclick = () => openProductModal();
  $("productColumnsBtn").onclick = () => $("productColumnChooser").hidden = !$("productColumnChooser").hidden;
  $("productsCsvBtn").onclick = exportCurrentCsv;
  document.querySelectorAll("[data-product-column]").forEach((box) => box.onchange = saveProductColumnChoice);
  document.querySelectorAll("[data-flow-view]").forEach((b) => b.onclick = () => loadView(b.dataset.flowView));
  bindProductRows();
}

function productStats(rows) {
  const qty = rows.reduce((s, p) => s + Number(p.qty || 0), 0);
  const value = rows.reduce((s, p) => s + Number(p.qty || 0) * Number(p.cost || 0), 0);
  const retail = rows.reduce((s, p) => s + Number(p.qty || 0) * Number(p.selling_price || 0), 0);
  const low = rows.filter((p) => Number(p.qty || 0) <= Number(p.reorder_point || 0)).length;
  const out = rows.filter((p) => Number(p.qty || 0) <= 0).length;
  const inactive = rows.filter((p) => /inactive|discontinued/i.test(p.status || "")).length;
  const locations = new Set(rows.map((p) => p.warehouse).filter(Boolean)).size;
  return { count: rows.length, qty, value, retail, low, out, inactive, locations };
}

function selectHtml(id, label, values) {
  return `${suggestInput(id, values, "", label)}`;
}

function suggestInput(id, values, value = "", placeholder = "Type to search") {
  const listId = `${id}List`;
  const unique = [...new Set((values || []).map((v) => String(v ?? "").trim()).filter(Boolean))];
  return `<input class="suggest-input" id="${esc(id)}" list="${esc(listId)}" value="${esc(value || "")}" placeholder="${esc(placeholder)}" autocomplete="off"><datalist id="${esc(listId)}">${unique.map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
}

function flowCard(view, title, text, note) {
  return `<button class="quick-card" data-flow-view="${view}"><strong>${esc(title)}</strong><span>${esc(text)}</span><small>${esc(note)}</small></button>`;
}

function renderFilteredProducts() {
  const q = $("productSearch").value.toLowerCase();
  const category = $("productCategoryFilter").value;
  const warehouse = $("productWarehouseFilter").value;
  const status = $("productStatusFilter").value;
  const rows = currentRows.filter((p) => {
    const searchOk = !q || [p.sku, p.name, p.source_vendor, p.category, p.warehouse, p.bin_shelf, p.compatible_with].join(" ").toLowerCase().includes(q);
    return searchOk && (!category || p.category === category) && (!warehouse || p.warehouse === warehouse) && (!status || p.status === status);
  });
  $("productTableHost").innerHTML = productTableHtml(rows);
  bindProductRows();
}

function productTableHtml(rows) {
  const columns = productVisibleColumns();
  const heads = [...columns.map((col) => col[1]), ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((p) => productRowHtml(p, columns)).join("") : `<tr><td colspan="${heads.length}" class="empty">No products yet.</td></tr>`}</tbody></table></div>`;
}

function productRowHtml(p, columns = productVisibleColumns()) {
  return `<tr>
    ${columns.map(([key]) => `<td>${productCellHtml(p, key)}</td>`).join("")}
    <td><div class="rowactions"><button class="rowbtn" data-product-edit="${esc(p.sku)}">Edit</button><button class="rowbtn danger" data-product-delete="${esc(p.sku)}">Delete</button></div></td>
  </tr>`;
}

function productCellHtml(p, key) {
  if (key === "photo") return p.photo_url ? `<img class="thumb" src="${esc(p.photo_url)}" alt="Photo">` : `<span class="badge">No photo</span>`;
  if (key === "name") return `<strong>${esc(p.name)}</strong>`;
  if (key === "cost" || key === "selling_price") return money(p[key]);
  if (key === "status") return badge(productStatus(p));
  return esc(p[key] ?? "");
}

function productVisibleColumns() {
  const saved = JSON.parse(localStorage.getItem("lms.productColumns") || "null");
  const keys = Array.isArray(saved) && saved.length ? saved : productColumnDefs.filter(([key]) => key !== "markup_percent").map(([key]) => key);
  const valid = new Set(productColumnDefs.map(([key]) => key));
  return keys.filter((key) => valid.has(key)).map((key) => productColumnDefs.find(([colKey]) => colKey === key)).filter(Boolean);
}

function productColumnChooserHtml() {
  const active = new Set(productVisibleColumns().map(([key]) => key));
  return productColumnDefs.map(([key, label]) => `<label class="checkline"><input type="checkbox" data-product-column="${esc(key)}" ${active.has(key) ? "checked" : ""}> ${esc(label)}</label>`).join("");
}

function saveProductColumnChoice() {
  const keys = [...document.querySelectorAll("[data-product-column]:checked")].map((box) => box.dataset.productColumn);
  localStorage.setItem("lms.productColumns", JSON.stringify(keys.length ? keys : productColumnDefs.map(([key]) => key)));
  $("productTableHost").innerHTML = productTableHtml(currentRows);
  bindProductRows();
}

function productStatus(p) {
  if (/inactive|discontinued/i.test(p.status || "")) return p.status;
  if (Number(p.qty || 0) <= 0) return "Out";
  if (Number(p.qty || 0) <= Number(p.reorder_point || 0)) return "Low";
  return "In stock";
}

function bindProductRows() {
  document.querySelectorAll("[data-product-edit]").forEach((b) => b.onclick = () => openProductModal(currentRows.find((p) => p.sku === b.dataset.productEdit)));
  document.querySelectorAll("[data-product-delete]").forEach((b) => b.onclick = async () => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("sku", b.dataset.productDelete);
    if (error) alert(error.message);
    renderProductsView();
  });
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function renderStockMovementView() {
  currentCfg = tableMap.movements;
  $("viewTitle").textContent = "Stock Movement";
  $("viewSub").textContent = "Receive, sell, adjust, transfer, reserve, and audit stock.";
  const [movements, products, receipts, salesOrders, salesLines, workOrders, workOrderParts] = await Promise.all([
    getAll("stock_movements"),
    getAll("products"),
    getAll("goods_receipts"),
    getAll("sales_orders"),
    getAll("sales_order_lines"),
    getAll("work_orders"),
    getAll("work_order_parts"),
  ]);
  currentRows = buildLinkedStockMovements({ movements, products, receipts, salesOrders, salesLines, workOrders, workOrderParts });
  productMeta.products = products.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="movementSearch" placeholder="Search stock ledger by product, SKU, type, reference, location">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Stock Ledger</strong><span>Read-only movement history. Sales, work orders, and goods receipts post here automatically.</span></div><div class="actions">${dateRangeControls("movement")}<button id="movementApplyDates">Apply dates</button><button id="movementCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="correctionBtn">Approved correction</button></div></div>
      <div id="movementTableHost">${stockMovementTableHtml(currentRows)}</div>
    </section>`;
  $("movementSearch").oninput = renderFilteredStockMovements;
  $("movementApplyDates").onclick = renderFilteredStockMovements;
  $("movementCsvBtn").onclick = exportCurrentCsv;
  $("correctionBtn").onclick = openStockCorrectionModal;
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  bindStockMovementRows();
}

function renderFilteredStockMovements() {
  const q = ($("movementSearch")?.value || "").toLowerCase();
  const from = $("movementFrom")?.value || "";
  const to = $("movementTo")?.value || "";
  const rows = currentRows.filter((row) => {
    const date = String(row.movement_date || "");
    return (!q || Object.values(row).join(" ").toLowerCase().includes(q)) && (!from || date >= from) && (!to || date <= to);
  });
  $("movementTableHost").innerHTML = stockMovementTableHtml(rows);
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  bindStockMovementRows();
}

function stockMovementTableHtml(rows) {
  const heads = ["Date", "Reference #", "Type", "Product", "Vendor", "Sold To", "Sold Date", "Qty", "From", "To", "Unit FIFO Cost", "Total FIFO Cost", "Document", "Entered By", "Reason"];
  const fields = ["movement_date", "reference_no", "type", "product_name", "vendor", "sold_to", "sold_date", "qty", "from_warehouse", "to_warehouse", "unit_fifo_cost", "total_fifo_cost", "document_no", "entered_by", "reason"];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${fields.map((h) => `<td>${stockMovementCell(h, row)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No stock movement yet.</td></tr>`}</tbody></table></div>`;
}

function stockMovementCell(field, row) {
  if (field === "product_name") return `${esc(row.product_name || "")}${row.sku ? `<br><span class="muted">${esc(row.sku)}</span>` : ""}`;
  if (field === "document_no") return row.document_no ? `<button class="linkbtn" type="button" data-doc-link="${esc(row.document_no)}">${esc(row.document_no)}</button>` : "";
  if (/cost/.test(field)) return money(row[field]);
  return esc(row[field] ?? "");
}

function dateRangeControls(prefix) {
  return `<label class="mini-filter">From <input type="date" id="${prefix}From"></label><label class="mini-filter">To <input type="date" id="${prefix}To"></label>`;
}

function bindStockMovementRows() {
  document.querySelectorAll("[data-doc-link]").forEach((b) => b.onclick = () => {
    const ref = b.dataset.docLink || "";
    if (/^PO-/i.test(ref)) loadView("purchasing");
    else if (/^SO-/i.test(ref)) loadView("orders");
    else if (/^WO-/i.test(ref)) loadView("repairs");
    else if (/^GR-/i.test(ref)) loadView("receipts");
  });
}

function buildLinkedStockMovements({ movements = [], products = [], receipts = [], salesOrders = [], salesLines = [], workOrders = [], workOrderParts = [] }) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const productBySku = new Map(products.map((p) => [p.sku, p]));
  const seen = new Set();
  const rows = [];
  const push = (row) => {
    if (!row.reference_no || seen.has(row.reference_no)) return;
    seen.add(row.reference_no);
    const p = productById.get(row.product_id) || productBySku.get(row.sku) || {};
    rows.push({
      ...row,
      product_id: row.product_id || p.id || null,
      sku: row.sku || p.sku || "",
      product_name: row.product_name || p.name || "Deleted item",
      vendor: row.vendor || p.source_vendor || "",
      unit_fifo_cost: Number(row.unit_fifo_cost ?? p.cost ?? 0),
      total_fifo_cost: Number(row.total_fifo_cost ?? Math.abs(Number(row.qty || 0)) * Number(row.unit_fifo_cost ?? p.cost ?? 0)),
      entered_by: row.entered_by || "System",
    });
  };

  movements.forEach((m) => push(m));

  receipts.forEach((gr) => push({
    reference_no: `SM-${gr.gr_no}`,
    movement_date: gr.gr_date,
    type: "Goods Receipt",
    product_id: gr.product_id,
    sku: gr.sku,
    product_name: gr.product_name,
    vendor: gr.vendor,
    qty: Number(gr.received_qty || 0),
    to_warehouse: productById.get(gr.product_id)?.warehouse || "",
    unit_fifo_cost: Number(gr.unit_cost || 0),
    total_fifo_cost: Number(gr.received_qty || 0) * Number(gr.unit_cost || 0),
    document_no: gr.po_no || gr.gr_no,
    reason: `${gr.gr_no} received from ${gr.po_no || "purchase"}`,
    entered_by: gr.received_by || "System",
  }));

  const orderById = new Map(salesOrders.map((o) => [o.id, o]));
  salesLines.forEach((line) => {
    const order = orderById.get(line.order_id);
    if (!order || !/fulfilled|posted|paid/i.test(order.status || "")) return;
    const p = productById.get(line.product_id) || productBySku.get(line.sku) || {};
    push({
      reference_no: `SM-${order.order_no}-${line.sku}`,
      movement_date: order.order_date,
      type: "Sale Issue",
      product_id: line.product_id || p.id,
      sku: line.sku,
      product_name: line.product_name,
      vendor: p.source_vendor || "",
      sold_to: order.customer,
      sold_date: order.order_date,
      qty: -Math.abs(Number(line.qty || 0)),
      from_warehouse: p.warehouse || "",
      unit_fifo_cost: Number(p.cost || 0),
      total_fifo_cost: Math.abs(Number(line.qty || 0)) * Number(p.cost || 0),
      document_no: order.order_no,
      reason: `Order ${order.order_no}`,
      entered_by: "System",
    });
  });

  const woById = new Map(workOrders.map((wo) => [wo.id, wo]));
  workOrderParts.forEach((part, index) => {
    const acceptedQty = Number(part.accepted_qty || 0);
    if (!acceptedQty || !/accepted|used|issued|complete/i.test(effectivePartStatus(part))) return;
    const wo = woById.get(part.wo_id) || {};
    const p = productById.get(part.product_id) || productBySku.get(part.sku) || {};
    push({
      reference_no: `SM-${wo.wo_no || "WO"}-${part.sku}-${index + 1}`,
      movement_date: wo.wo_date || today(),
      type: "Repair",
      product_id: part.product_id || p.id,
      sku: part.sku,
      product_name: part.product_name,
      vendor: p.source_vendor || "",
      qty: -Math.abs(acceptedQty),
      from_warehouse: p.warehouse || "",
      unit_fifo_cost: Number(part.unit_cost || p.cost || 0),
      total_fifo_cost: Math.abs(acceptedQty) * Number(part.unit_cost || p.cost || 0),
      document_no: wo.wo_no || "",
      reason: part.issue || "Work order part",
      entered_by: "System",
    });
  });

  return rows.sort((a, b) => String(b.movement_date || "").localeCompare(String(a.movement_date || "")));
}

function openStockCorrectionModal() {
  const reference = `SM-${Date.now().toString().slice(-6)}`;
  $("modalTitle").textContent = "Approved stock correction";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Reference #", "reference_no", reference)}
      ${productInput("Date", "movement_date", today(), "date")}
      ${productSelect("Type", "type", ["Adjustment", "Count", "Transfer"], "Adjustment")}
      <div class="field"><label>Product</label><input class="suggest-input" list="poProductOptions" data-product-field="product_lookup" placeholder="Search SKU, name, vendor" autocomplete="off">${productOptionsDatalist()}</div>
      ${productInput("Qty change", "qty", "", "number")}
      ${productInput("From warehouse", "from_warehouse", "")}
      ${productInput("To warehouse", "to_warehouse", "")}
      ${productInput("Unit FIFO cost", "unit_fifo_cost", "", "number")}
      ${productInput("Document", "document_no", "")}
      <div class="field wide"><label>Reason / approval note</label><textarea data-product-field="reason"></textarea></div>
    </div>
    <p class="notice">Use this only for approved corrections. Positive quantity adds stock; negative quantity removes stock.</p>`;
  $("modalSave").onclick = saveStockCorrectionModal;
  $("modal").style.display = "flex";
}

async function saveStockCorrectionModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  const product = resolveProductLookup(record.product_lookup);
  if (!product) {
    alert("Choose a valid product before posting the correction.");
    return;
  }
  if (!record.reason) {
    alert("Reason / approval note is required.");
    return;
  }
  const qty = Number(record.qty || 0);
  if (!qty) {
    alert("Qty change cannot be zero.");
    return;
  }
  const unitCost = Number(record.unit_fifo_cost || product.cost || 0);
  try {
    await upsertOne("stock_movements", {
      reference_no: record.reference_no,
      movement_date: record.movement_date || today(),
      type: record.type || "Adjustment",
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      qty,
      from_warehouse: record.from_warehouse,
      to_warehouse: record.to_warehouse || product.warehouse,
      unit_fifo_cost: unitCost,
      total_fifo_cost: Math.abs(qty) * unitCost,
      document_no: record.document_no,
      entered_by: profile?.full_name || profile?.username || "Owner",
      reason: record.reason,
    }, "reference_no");
    await supabase.from("products").update({ qty: Number(product.qty || 0) + qty }).eq("id", product.id);
    closeModal();
    renderStockMovementView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function renderPurchasingView() {
  currentCfg = tableMap.purchasing;
  $("viewTitle").textContent = "Purchasing";
  $("viewSub").textContent = "Issue POs, receive goods, match invoices, and release payments.";
  const [pos, lines, receipts, vendors, products, workOrders, terms, incoterms, standardNotes] = await Promise.all([
    getAll("purchase_orders"),
    getAll("purchase_order_lines"),
    getAll("goods_receipts"),
    getAll("vendors"),
    getAll("products"),
    getAll("work_orders"),
    getAll("master_terms"),
    getAll("incoterms"),
    getAll("standard_po_notes"),
  ]);
  currentRows = pos.sort((a, b) => String(b.po_date || "").localeCompare(String(a.po_date || "")));
  currentRows.forEach((po) => {
    po._lines = lines.filter((line) => line.po_id === po.id);
    po._receipts = receipts.filter((gr) => gr.po_id === po.id || gr.po_no === po.po_no);
  });
  productMeta.vendors = vendors.map((v) => v.name).filter(Boolean).sort();
  productMeta.products = products.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
  productMeta.openWorkOrders = (workOrders || []).filter(isOpenWorkOrder).sort((a, b) => String(a.wo_no || "").localeCompare(String(b.wo_no || "")));
  productMeta.terms = terms.map((t) => t.name).filter(Boolean).sort();
  productMeta.incoterms = incoterms.map((t) => t.name).filter(Boolean).sort();
  productMeta.standardPoNotes = standardNotes.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  purchaseContext = { products: productMeta.products, vendors: productMeta.vendors, vendorRows: vendors, openWorkOrders: productMeta.openWorkOrders, terms: productMeta.terms, incoterms: productMeta.incoterms, standardPoNotes: productMeta.standardPoNotes };
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="poSearch" placeholder="Search purchase orders by PO, vendor, invoice, product, match status">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Purchase Orders</strong><span>PO issued, goods receipt, invoice matching, and accounting payment readiness</span></div><div class="actions"><button id="poCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newPoBtn">New PO</button></div></div>
      <div id="poTableHost">${purchaseOrderTableHtml(currentRows)}</div>
    </section>`;
  $("poSearch").oninput = renderFilteredPurchaseOrders;
  $("poCsvBtn").onclick = exportPurchaseOrdersCsv;
  $("newPoBtn").onclick = () => openPurchaseOrderModal();
  bindPurchaseRows();
}

function renderFilteredPurchaseOrders() {
  const q = $("poSearch").value.toLowerCase();
  const rows = currentRows.filter((po) => !q || [
    po.po_no, po.po_date, po.vendor, po.vendor_invoice_no, po.match_status, po.payment_status, po.status,
    ...(po._lines || []).map((line) => `${line.sku} ${line.product_name}`)
  ].join(" ").toLowerCase().includes(q));
  $("poTableHost").innerHTML = purchaseOrderTableHtml(rows);
  bindPurchaseRows();
}

function purchaseOrderTableHtml(rows) {
  const heads = ["PO", "Date", "Vendor", "Jobsite / Project", "Terms", "Incoterm", "Currency", "Parts", "Freight", "Landed Add", "PO Total", "Received", "Invoice", "Match", "Payment", "Status", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(purchaseOrderRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No purchase orders yet.</td></tr>`}</tbody></table></div>`;
}

function purchaseOrderRowHtml(po) {
  const invoice = po.vendor_invoice_no ? `${esc(po.vendor_invoice_no)}<br>${money(po.vendor_invoice_amount)}` : "";
  const canPay = String(po.match_status || "").toLowerCase() === "matched" && String(po.payment_status || "").toLowerCase() !== "paid";
  return `<tr>
    <td>${esc(po.po_no)}</td>
    <td>${esc(po.po_date || "")}</td>
    <td>${esc(po.vendor || "")}</td>
    <td>${esc(po.jobsite_project || "")}</td>
    <td>${esc(po.payment_terms || "")}</td>
    <td>${esc(po.incoterm || "")}</td>
    <td>${po.foreign_order ? `${esc(po.currency_code || "")}<br><small>${esc(po.foreign_country || "")}</small>` : "USD"}</td>
    <td>${money(poPartsSubtotal(po))}</td>
    <td>${money(poFreight(po))}</td>
    <td>${po.landed_cost_enabled ? `${money(poLandedAddOn(po))}<br><small>${esc(po.landed_cost_method || "By Value")}</small>` : "Off"}</td>
    <td>${money(poTotal(po))}</td>
    <td>${money(poReceivedTotal(po))}</td>
    <td>${invoice}</td>
    <td>${badge(po.match_status || "Pending")}</td>
    <td>${badge(po.payment_status || "Not Ready")}</td>
    <td>${badge(po.status || "Draft")}</td>
    <td><div class="rowactions"><button class="rowbtn" type="button" data-po-pdf="${esc(po.po_no)}">PDF</button><button class="rowbtn" type="button" data-po-email="${esc(po.po_no)}">Email</button><button class="rowbtn" type="button" data-po-gr="${esc(po.po_no)}">GR</button><button class="rowbtn" type="button" data-po-match="${esc(po.po_no)}">=</button>${canPay ? `<button class="rowbtn" type="button" data-po-pay="${esc(po.po_no)}">$</button>` : ""}<button class="rowbtn" type="button" data-po-edit="${esc(po.po_no)}">Edit</button><button class="rowbtn danger" type="button" data-po-delete="${esc(po.po_no)}">Delete</button></div></td>
  </tr>`;
}

function poTotal(po) {
  return poPartsSubtotal(po) + poLandedAddOn(po);
}

function poPartsSubtotal(po) {
  return (po._lines || []).reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unit_cost || 0), 0);
}

function poFreight(po) {
  return Number(po?.freight_amount || 0);
}

function poLandedAddOn(po) {
  return Number(po?.freight_amount || 0) + Number(po?.duty_amount || 0) + Number(po?.other_landed_cost_amount || 0);
}

function poReceivedTotal(po) {
  return activeReceipts(po).reduce((sum, line) => sum + Number(line.received_qty || 0) * Number(line.unit_cost || 0), 0);
}

function poReceivedQtyBySku(po, sku) {
  return activeReceipts(po).filter((line) => line.sku === sku).reduce((sum, line) => sum + Number(line.received_qty || 0), 0);
}

function activeReceipts(po) {
  return (po?._receipts || []).filter((line) => !/reversed|void|cancel/i.test(line.status || ""));
}

function poReceiptStatus(po) {
  const lines = po?._lines || [];
  if (!lines.length) return "Draft";
  const receivedTotal = activeReceipts(po).reduce((sum, row) => sum + Number(row.received_qty || 0), 0);
  if (receivedTotal <= 0) return "Issued";
  const allReceived = lines.every((line) => poReceivedQtyBySku(po, line.sku) >= Number(line.qty || 0));
  return allReceived ? "Goods Received" : "Partially Received";
}

function poMatchStatusFromAmounts(po) {
  const received = poReceivedTotal(po);
  const receiptInvoiceAmount = activeReceipts(po).reduce((sum, gr) => sum + Number(gr.vendor_invoice_amount || gr.received_amount || Number(gr.received_qty || 0) * Number(gr.unit_cost || 0)), 0);
  const invoice = Number(po.vendor_invoice_amount || receiptInvoiceAmount || 0);
  if (!received) return "Awaiting Goods";
  if (!invoice) return "Pending";
  return Math.abs(invoice - received) <= 0.005 ? "Matched" : "Mismatch";
}

function receiptInvoiceSummary(rows, fallbackDate = today()) {
  const invoiceRows = rows.filter((row) => row.vendor_invoice_no || row.vendor_invoice_date || Number(row.vendor_invoice_amount || 0));
  if (!invoiceRows.length) return null;
  const invoiceNos = [...new Set(invoiceRows.map((row) => row.vendor_invoice_no).filter(Boolean))];
  const invoiceDates = invoiceRows.map((row) => row.vendor_invoice_date).filter(Boolean).sort();
  const amount = invoiceRows.reduce((sum, row) => sum + Number(row.vendor_invoice_amount || row.received_qty * row.unit_cost || 0), 0);
  return {
    vendor_invoice_no: invoiceNos.join(", "),
    vendor_invoice_date: invoiceDates[0] || fallbackDate,
    vendor_invoice_amount: amount,
  };
}

async function refreshPurchaseOrderFlow(poNo, { keepPaid = false } = {}) {
  const [poRows, lines, receipts] = await Promise.all([getAll("purchase_orders"), getAll("purchase_order_lines"), getAll("goods_receipts")]);
  const po = poRows.find((row) => row.po_no === poNo);
  if (!po) return null;
  po._lines = lines.filter((line) => line.po_id === po.id || line.po_no === po.po_no);
  po._receipts = receipts.filter((row) => row.po_no === po.po_no);
  const status = poReceiptStatus(po);
  const match = poMatchStatusFromAmounts(po);
  const paymentStatus = keepPaid && /paid/i.test(po.payment_status || "") ? "Paid" : match === "Matched" ? "Ready to Pay" : "Not Ready";
  await supabase.from("purchase_orders").update({ status, match_status: match, payment_status: paymentStatus }).eq("id", po.id);
  if (!activeReceipts(po).length) {
    await supabase.from("general_ledger").delete().eq("reference", po.po_no).eq("source", "Purchase Order");
  }
  return { ...po, status, match_status: match, payment_status: paymentStatus };
}

async function hasPurchaseOrderPayments(poNo) {
  const [checks, ledger] = await Promise.all([
    supabase.from("check_runs").select("id,status,reference").eq("reference", poNo).limit(1),
    supabase.from("general_ledger").select("id,source,reference,account").eq("reference", poNo).eq("source", "Check Run").limit(1),
  ]);
  if (checks.error && checks.error.code !== "PGRST116") throw checks.error;
  if (ledger.error && ledger.error.code !== "PGRST116") throw ledger.error;
  return Boolean((checks.data || []).length || (ledger.data || []).length);
}

async function hasPostedApForPurchaseOrder(poNo) {
  const { data, error } = await supabase.from("general_ledger").select("id").eq("reference", poNo).eq("source", "Purchase Order").limit(1);
  if (error && error.code !== "PGRST116") throw error;
  return Boolean((data || []).length);
}

function bindPurchaseRows() {
  document.querySelectorAll("[data-po-edit]").forEach((b) => b.onclick = () => openPurchaseOrderModal(currentRows.find((po) => po.po_no === b.dataset.poEdit)));
  document.querySelectorAll("[data-po-delete]").forEach((b) => b.onclick = () => deletePurchaseOrder(b.dataset.poDelete));
  document.querySelectorAll("[data-po-pdf]").forEach((b) => b.onclick = () => printPurchaseOrder(b.dataset.poPdf));
  document.querySelectorAll("[data-po-email]").forEach((b) => b.onclick = () => emailPurchaseOrder(b.dataset.poEmail));
  document.querySelectorAll("[data-po-gr]").forEach((b) => b.onclick = () => openGoodsReceiptModal(currentRows.find((po) => po.po_no === b.dataset.poGr)));
  document.querySelectorAll("[data-po-match]").forEach((b) => b.onclick = () => openPostApFromPoModal({ pos: currentRows }, b.dataset.poMatch));
  document.querySelectorAll("[data-po-pay]").forEach((b) => b.onclick = () => createCheckRunFromPo({ pos: currentRows }, b.dataset.poPay));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function openPurchaseOrderModal(po = null) {
  editing = po;
  const poNo = po?.po_no || await nextRefPreview("po", "PO-", "purchase_orders", "po_no");
  const firstProduct = productMeta.products?.[0] || {};
  const lines = po?._lines?.length ? po._lines : [{ sku: firstProduct.sku || "", product_name: firstProduct.name || "", unit: firstProduct.unit || "", qty: 1, unit_cost: firstProduct.cost || 0, wo_no: "" }];
  $("modalTitle").textContent = po ? "Edit purchase order" : "New purchase order";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Number", "po_no", poNo)}
      ${productSelect("Vendor", "vendor", productMeta.vendors || [], po?.vendor || "", "New vendor")}
      ${productInput("Date", "po_date", po?.po_date || today(), "date")}
      ${productInput("Jobsite / Project", "jobsite_project", po?.jobsite_project || "")}
      ${productInput("Expected", "expected_date", po?.expected_date || "", "date")}
      ${productSelect("Payment terms", "payment_terms", productMeta.terms || [], po?.payment_terms || "Net 30", "New terms")}
      ${productSelect("Incoterm", "incoterm", productMeta.incoterms || ["FOB", "CIF", "DDP"], po?.incoterm || "FOB", "New incoterm")}
      ${productInput("Freight amount", "freight_amount", po?.freight_amount ?? 0, "number")}
      ${productSelect("Use landed cost for inventory", "landed_cost_enabled", ["No", "Yes"], po?.landed_cost_enabled ? "Yes" : "No")}
      ${productSelect("Landed cost allocation", "landed_cost_method", ["By Value", "By Qty"], po?.landed_cost_method || "By Value")}
      ${productInput("Duty / Customs", "duty_amount", po?.duty_amount ?? 0, "number")}
      ${productInput("Other landed cost", "other_landed_cost_amount", po?.other_landed_cost_amount ?? 0, "number")}
      ${productSelect("Foreign order", "foreign_order", ["No", "Yes"], po?.foreign_order ? "Yes" : "No")}
      ${productInput("Foreign country", "foreign_country", po?.foreign_country || "")}
      ${productSelect("Currency", "currency_code", ["USD", "JPY", "PHP", "KRW", "AUD", "EUR", "CNY"], po?.currency_code || "USD")}
      ${productInput("Exchange rate to USD", "exchange_rate", po?.exchange_rate ?? 1, "number")}
      ${productInput("Vendor invoice #", "vendor_invoice_no", po?.vendor_invoice_no || "")}
      ${productInput("Vendor invoice amount", "vendor_invoice_amount", po?.vendor_invoice_amount ?? 0, "number")}
      ${productSelect("Payment status", "payment_status", ["Not Ready", "Ready to Pay", "Hold", "Paid"], po?.payment_status || "Not Ready")}
      ${productSelect("Status", "status", ["Quotation", "Draft", "Issued", "Partially Received", "Goods Received", "Matched", "Paid", "Cancelled"], po?.status || "Draft")}
      <div class="field wide"><label>Standard PO notes</label>${standardPoNotePickerHtml()}<div class="actions table-actions"><button class="rowbtn" type="button" id="insertPoNoteBtn">Insert note</button><button class="rowbtn" type="button" id="newPoNoteBtn">New standard note</button></div></div>
      <div class="field wide"><label>Line items</label>${purchaseLineRows(lines)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(po?.notes || "")}</textarea></div>
    </div>
    <p class="notice">Jobsite / Project, vendor, terms, and lines are required. If landed cost is enabled, freight, duty, and other import costs are allocated into line costs for receiving and inventory valuation.</p>`;
  $("modalSave").onclick = savePurchaseOrderModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => handlePurchaseQuickCreate(b.dataset.productQuick, po));
  const addLineBtn = $("addPoLineBtn");
  if (addLineBtn) addLineBtn.onclick = addPurchaseLineRow;
  const insertNoteBtn = $("insertPoNoteBtn");
  if (insertNoteBtn) insertNoteBtn.onclick = insertSelectedPoNote;
  const newNoteBtn = $("newPoNoteBtn");
  if (newNoteBtn) newNoteBtn.onclick = () => quickCreateStandardPoNote(po);
}

function purchaseLineRows(lines) {
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Product</th><th>WO #</th><th>UOM</th><th>On Hand</th><th>Qty</th><th>Foreign Cost</th><th>USD Cost</th><th>Landed Unit</th><th>Amount</th></tr></thead><tbody id="poLineBody">${lines.map((line, i) => purchaseLineRowHtml(line, i)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addPoLineBtn">Add row</button></div>`;
}

function purchaseLineRowHtml(line = {}, index = 0) {
  const sku = line.sku || "";
  const product = productMeta.products?.find((p) => p.sku === sku) || {};
  const label = sku ? `${sku} - ${line.product_name || product.name || ""}` : "";
  const woLabel = line.wo_no ? workOrderOptionLabel((productMeta.openWorkOrders || []).find((wo) => wo.wo_no === line.wo_no) || { wo_no: line.wo_no, asset_tag: "", bill_to_customer: "", status: "" }) : "";
  return `<tr>
    <td><input class="suggest-input" list="poProductOptions" data-po-line="sku" data-line-index="${index}" value="${esc(label)}" placeholder="Search SKU, name, vendor" autocomplete="off">${productOptionsDatalist()}</td>
    <td><input class="suggest-input" list="poOpenWorkOrderOptions" data-po-line="wo_no" data-line-index="${index}" value="${esc(woLabel)}" placeholder="Search open WO, asset, customer" autocomplete="off">${openWorkOrderOptionsDatalist()}</td>
    <td><input data-po-line="unit" data-line-index="${index}" value="${esc(line.unit || product.unit || "")}" readonly></td>
    <td>${esc(product.qty ?? "")}</td>
    <td><input type="number" step="0.01" data-po-line="qty" data-line-index="${index}" value="${esc(line.qty || "")}"></td>
    <td><input type="number" step="0.01" data-po-line="foreign_unit_cost" data-line-index="${index}" value="${esc(line.foreign_unit_cost || "")}" placeholder="If foreign"></td>
    <td><input type="number" step="0.01" data-po-line="unit_cost" data-line-index="${index}" value="${esc(line.unit_cost ?? product.cost ?? "")}"></td>
    <td><input type="number" step="0.01" data-po-line="landed_unit_cost" data-line-index="${index}" value="${esc(line.landed_unit_cost || "")}" readonly></td>
    <td>${money(Number(line.qty || 0) * Number(line.unit_cost || 0))}</td>
  </tr>`;
}

function standardPoNotePickerHtml() {
  const notes = productMeta.standardPoNotes || [];
  return `<input class="suggest-input" id="poStandardNotePicker" list="poStandardNoteOptions" placeholder="Search reusable PO note" autocomplete="off"><datalist id="poStandardNoteOptions">${notes.map((note) => `<option value="${esc(note.title)}"></option>`).join("")}</datalist>`;
}

function openWorkOrderOptionsDatalist() {
  if ($("poOpenWorkOrderOptions")) return "";
  const options = (productMeta.openWorkOrders || []).map(workOrderOptionLabel);
  return `<datalist id="poOpenWorkOrderOptions">${[...new Set(options)].map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
}

function workOrderOptionLabel(wo) {
  return [wo?.wo_no, wo?.asset_tag || "No asset", wo?.bill_to_customer || "Internal", wo?.status || "Open"]
    .filter(Boolean)
    .join(" | ");
}

function isOpenWorkOrder(wo) {
  return !/closed|invoiced|complete|cancel/i.test(wo?.status || "");
}

function productOptionsDatalist() {
  if ($("poProductOptions")) return "";
  const options = [];
  (productMeta.products || []).forEach((p) => {
    const sku = p.sku || "";
    const name = p.name || "";
    const vendor = p.source_vendor || "No preferred vendor";
    const onHand = p.qty ?? 0;
    options.push(`${sku} - ${name} | preferred ${vendor} | on hand ${onHand}`);
    options.push(`${name} - ${sku} | preferred ${vendor} | on hand ${onHand}`);
    if (vendor && vendor !== "No preferred vendor") options.push(`${vendor} | ${sku} - ${name} | on hand ${onHand}`);
  });
  return `<datalist id="poProductOptions">${[...new Set(options)].map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
}

function resolveProductLookup(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  const directSku = text.split(" - ")[0].split("|")[0].trim();
  let product = (productMeta.products || []).find((p) => String(p.sku || "").toLowerCase() === directSku.toLowerCase());
  if (product) return product;
  product = (productMeta.products || []).find((p) => {
    const haystack = [p.sku, p.name, p.source_vendor, `${p.sku} - ${p.name}`, `${p.name} - ${p.sku}`].join(" ").toLowerCase();
    return haystack.includes(lower) || lower.includes(String(p.sku || "").toLowerCase()) || lower.includes(String(p.name || "").toLowerCase());
  });
  return product || null;
}

function resolveOpenWorkOrderLookup(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  const directWo = text.split("|")[0].trim();
  return (productMeta.openWorkOrders || []).find((wo) => {
    const woNo = String(wo.wo_no || "").toLowerCase();
    const haystack = [wo.wo_no, wo.asset_tag, wo.bill_to_customer, wo.status, wo.description].join(" ").toLowerCase();
    return woNo === directWo.toLowerCase() || haystack.includes(lower) || lower.includes(woNo);
  }) || null;
}

async function quickCreatePurchaseVendor(po) {
  const name = prompt("Vendor name to create");
  if (!name) return;
  try {
    await upsertOne("vendors", { reference: await nextRefPreview("vendor", "V-", "vendors", "reference"), name: name.trim(), terms: "30 days" }, "name");
    await renderPurchasingView();
    await openPurchaseOrderModal(po);
    const vendorField = document.querySelector('[data-product-field="vendor"]');
    if (vendorField) vendorField.value = name.trim();
  } catch (error) {
    alert(error.message || error);
  }
}

async function handlePurchaseQuickCreate(field, po) {
  if (field === "vendor") return quickCreatePurchaseVendor(po);
  if (field === "payment_terms") return quickCreatePurchaseTerms(po);
  if (field === "incoterm") return quickCreatePurchaseIncoterm(po);
}

async function quickCreatePurchaseTerms(po) {
  const name = prompt("Payment term name, for example Net 30 or 50% payment upon order");
  if (!name) return;
  const daysMatch = String(name).match(/\d+/);
  try {
    await upsertOne("master_terms", { name: name.trim(), days: daysMatch ? Number(daysMatch[0]) : 0 }, "name");
    await renderPurchasingView();
    await openPurchaseOrderModal(po);
    const field = document.querySelector('[data-product-field="payment_terms"]');
    if (field) field.value = name.trim();
  } catch (error) {
    alert(error.message || error);
  }
}

async function quickCreatePurchaseIncoterm(po) {
  const name = prompt("Incoterm, for example FOB, CIF, DDP");
  if (!name) return;
  try {
    await upsertOne("incoterms", { name: name.trim().toUpperCase(), notes: "" }, "name");
    await renderPurchasingView();
    await openPurchaseOrderModal(po);
    const field = document.querySelector('[data-product-field="incoterm"]');
    if (field) field.value = name.trim().toUpperCase();
  } catch (error) {
    alert(error.message || error);
  }
}

async function quickCreateStandardPoNote(po) {
  const title = prompt("Standard note title");
  if (!title) return;
  const body = prompt("Standard note text");
  if (!body) return;
  try {
    await upsertOne("standard_po_notes", { title: title.trim(), body: body.trim() }, "title");
    await renderPurchasingView();
    await openPurchaseOrderModal(po);
    const picker = $("poStandardNotePicker");
    if (picker) picker.value = title.trim();
  } catch (error) {
    alert(error.message || error);
  }
}

function insertSelectedPoNote() {
  const title = $("poStandardNotePicker")?.value || "";
  const note = (productMeta.standardPoNotes || []).find((row) => String(row.title || "").toLowerCase() === title.toLowerCase());
  if (!note) {
    alert("Choose a standard note first, or create a new one.");
    return;
  }
  const notes = document.querySelector('[data-product-field="notes"]');
  if (notes) notes.value = [notes.value.trim(), note.body].filter(Boolean).join("\n");
}

function addPurchaseLineRow() {
  const body = $("poLineBody");
  if (!body) return;
  const index = body.querySelectorAll("tr").length;
  body.insertAdjacentHTML("beforeend", purchaseLineRowHtml({}, index));
}

async function savePurchaseOrderModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  record.foreign_order = record.foreign_order === "Yes" || record.foreign_order === true;
  record.landed_cost_enabled = record.landed_cost_enabled === "Yes" || record.landed_cost_enabled === true;
  record.exchange_rate = Number(record.exchange_rate || 1);
  record.freight_amount = Number(record.freight_amount || 0);
  record.duty_amount = Number(record.duty_amount || 0);
  record.other_landed_cost_amount = Number(record.other_landed_cost_amount || 0);
  record.landed_cost_method = record.landed_cost_method || "By Value";
  if (!record.foreign_order) {
    record.currency_code = "USD";
    record.exchange_rate = 1;
    record.foreign_country = null;
  }
  const missing = ["po_no", "vendor", "po_date", "jobsite_project", "payment_terms", "status"].filter((field) => !record[field]);
  if (missing.length) {
    alert("Please complete PO number, vendor, date, jobsite/project, payment terms, and status.");
    return;
  }
  if (record.foreign_order && (!record.foreign_country || !record.currency_code || record.exchange_rate <= 0)) {
    alert("Foreign orders need country, currency, and a positive exchange rate.");
    return;
  }
  try {
    if (record.payment_terms && !(productMeta.terms || []).some((term) => term.toLowerCase() === record.payment_terms.toLowerCase())) {
      const daysMatch = String(record.payment_terms).match(/\d+/);
      await upsertOne("master_terms", { name: record.payment_terms.trim(), days: daysMatch ? Number(daysMatch[0]) : 0 }, "name");
    }
    if (record.incoterm && !(productMeta.incoterms || []).some((term) => term.toLowerCase() === record.incoterm.toLowerCase())) {
      await upsertOne("incoterms", { name: record.incoterm.trim().toUpperCase(), notes: "" }, "name");
      record.incoterm = record.incoterm.trim().toUpperCase();
    }
    const lineRows = allocatePurchaseLandedCost(parsePurchaseLineRows(), record);
    if (!lineRows.length) {
      alert("Add at least one PO line.");
      return;
    }
    if (isLockedAccountingDate(record.po_date) || isLockedAccountingDate(record.posting_date)) {
      alert("This PO date is inside the closed accounting period.");
      return;
    }
    record.vendor_invoice_amount = Number(record.vendor_invoice_amount || 0);
    record.match_status = editing?.match_status || "Pending";
    record.posting_date = record.posting_date || record.po_date;
    const wasNew = !editing;
    const saved = await upsertOne("purchase_orders", record, "po_no");
    await supabase.from("purchase_order_lines").delete().eq("po_id", saved.id);
    await upsertMany("purchase_order_lines", lineRows.map((line) => ({ ...line, po_id: saved.id })), "id");
    await syncPurchaseOrderWorkOrderReservations(saved, lineRows);
    if (wasNew) await incrementSequence("po");
    closeModal();
    renderPurchasingView();
  } catch (error) {
    alert(error.message || error);
  }
}

function parsePurchaseLineRows() {
  const rows = [];
  const invalidWorkOrders = [];
  const foreignOrder = (document.querySelector('[data-product-field="foreign_order"]')?.value || "") === "Yes";
  const exchangeRate = Number(document.querySelector('[data-product-field="exchange_rate"]')?.value || 1);
  const trList = [...document.querySelectorAll("#poLineBody tr")];
  trList.forEach((tr) => {
    const get = (field) => tr.querySelector(`[data-po-line="${field}"]`)?.value || "";
    const product = resolveProductLookup(get("sku"));
    if (!product) return;
    const woText = get("wo_no");
    const workOrder = woText ? resolveOpenWorkOrderLookup(woText) : null;
    if (woText && !workOrder) invalidWorkOrders.push(woText);
    const sku = product.sku;
    const foreignUnitCost = Number(get("foreign_unit_cost") || 0);
    const unitCost = foreignOrder && foreignUnitCost > 0 ? foreignUnitCost * exchangeRate : Number(get("unit_cost") || 0);
    rows.push({ product_id: product?.id || null, sku, product_name: product?.name || get("sku"), unit: product?.unit || get("unit") || null, wo_no: workOrder?.wo_no || null, qty: Number(get("qty") || 0), foreign_unit_cost: foreignUnitCost, unit_cost: unitCost, allocated_landed_cost: 0, landed_unit_cost: unitCost });
  });
  if (invalidWorkOrders.length) {
    throw new Error(`Choose only open work orders from the WO # dropdown: ${invalidWorkOrders.join(", ")}`);
  }
  return rows.filter((line) => line.qty > 0);
}

function allocatePurchaseLandedCost(lines, po) {
  if (!po.landed_cost_enabled) return lines.map((line) => ({ ...line, allocated_landed_cost: 0, landed_unit_cost: Number(line.unit_cost || 0) }));
  const addOn = poLandedAddOn(po);
  if (!addOn || !lines.length) return lines.map((line) => ({ ...line, allocated_landed_cost: 0, landed_unit_cost: Number(line.unit_cost || 0) }));
  const method = String(po.landed_cost_method || "By Value").toLowerCase();
  const baseTotal = method.includes("qty")
    ? lines.reduce((sum, line) => sum + Number(line.qty || 0), 0)
    : lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unit_cost || 0), 0);
  if (!baseTotal) return lines;
  let allocatedSoFar = 0;
  return lines.map((line, index) => {
    const base = method.includes("qty") ? Number(line.qty || 0) : Number(line.qty || 0) * Number(line.unit_cost || 0);
    const rawAllocation = index === lines.length - 1 ? addOn - allocatedSoFar : addOn * (base / baseTotal);
    const allocation = Math.round(rawAllocation * 100) / 100;
    allocatedSoFar += allocation;
    const landedUnit = Number(line.unit_cost || 0) + (Number(line.qty || 0) ? allocation / Number(line.qty || 0) : 0);
    return { ...line, allocated_landed_cost: allocation, landed_unit_cost: Math.round(landedUnit * 10000) / 10000 };
  });
}

async function syncPurchaseOrderWorkOrderReservations(po, lineRows) {
  const taggedLines = lineRows.filter((line) => line.wo_no);
  const notesNeedle = `Reserved from PO ${po.po_no}`;
  const { data: oldReservations, error: oldError } = await supabase
    .from("work_order_parts")
    .select("id,status,notes")
    .ilike("notes", `%${notesNeedle}%`);
  if (oldError) throw oldError;
  const removable = (oldReservations || []).filter((row) => !/accepted/i.test(row.status || ""));
  if (removable.length) await supabase.from("work_order_parts").delete().in("id", removable.map((row) => row.id));
  if (!taggedLines.length) return;
  const openByNo = new Map((productMeta.openWorkOrders || []).map((wo) => [wo.wo_no, wo]));
  const rows = taggedLines.map((line) => {
    const wo = openByNo.get(line.wo_no);
    const available = Number((productMeta.products || []).find((p) => p.sku === line.sku)?.qty || 0);
    return {
      wo_id: wo?.id || null,
      issue: `PO ${po.po_no}`,
      product_id: line.product_id || null,
      sku: line.sku,
      product_name: line.product_name,
      qty_needed: Number(line.qty || 0),
      unit_cost: Number(line.unit_cost || 0),
      availability: available >= Number(line.qty || 0) ? "OK" : `To order ${Math.max(0, Number(line.qty || 0) - available)}`,
      status: "Reserved",
      accepted_qty: 0,
      notes: `${notesNeedle} for ${line.wo_no}`,
    };
  }).filter((row) => row.wo_id && row.sku && row.qty_needed > 0);
  await upsertMany("work_order_parts", rows, "id");
}

async function deletePurchaseOrder(poNo) {
  if (!confirm("Delete this PO and its lines?")) return;
  const po = currentRows.find((row) => row.po_no === poNo);
  if (po?.id) await supabase.from("purchase_order_lines").delete().eq("po_id", po.id);
  const { error } = await supabase.from("purchase_orders").delete().eq("po_no", poNo);
  if (error) alert(error.message);
  renderPurchasingView();
}

async function openGoodsReceiptModal(po) {
  if (!po) return;
  editing = po;
  productMeta.receiptInvoiceColumns = await goodsReceiptInvoiceColumnsReady();
  const grNo = await nextRefPreview("gr", "GR-", "goods_receipts", "gr_no");
  $("modalTitle").textContent = `Goods receipt for ${po.po_no}`;
  document.querySelector(".modalbox")?.classList.add("wide-modal");
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("GR #", "gr_no", grNo)}
      ${productInput("Date", "gr_date", today(), "date")}
      ${productInput("PO #", "po_no", po.po_no)}
      ${productInput("Vendor", "vendor", po.vendor || "")}
      <div class="field wide"><label>Items received</label>${goodsReceiptRows(po)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes"></textarea></div>
    </div>
    <p class="notice">Received quantity cannot be more than the remaining ordered quantity. You may put a vendor invoice reference per received line, so one PO can be matched to multiple invoices in AP.${productMeta.receiptInvoiceColumns ? "" : " Run the goods receipt invoice reference SQL migration so invoice references save as separate columns."}</p>`;
  $("modalSave").onclick = saveGoodsReceiptModal;
  $("modal").style.display = "flex";
}

async function goodsReceiptInvoiceColumnsReady() {
  if (typeof productMeta.receiptInvoiceColumns === "boolean") return productMeta.receiptInvoiceColumns;
  const { error } = await supabase.from("goods_receipts").select("vendor_invoice_no").limit(1);
  productMeta.receiptInvoiceColumns = !error;
  return productMeta.receiptInvoiceColumns;
}

function goodsReceiptRows(po) {
  const rows = po._lines || [];
  return `<div class="table-wrap gr-wrap"><table class="line-table gr-line-table"><thead><tr><th>Receive</th><th>SKU</th><th>Product</th><th>Ordered</th><th>Received Before</th><th>Remaining</th><th>Qty Received</th><th>Unit Cost</th><th>Invoice #</th><th>Invoice Date</th><th>Invoice Amount</th><th>Receipt Type</th></tr></thead><tbody>${rows.map((line, index) => {
    const receivedBefore = activeReceipts(po).filter((gr) => gr.sku === line.sku).reduce((sum, gr) => sum + Number(gr.received_qty || 0), 0);
    const remaining = Math.max(0, Number(line.qty || 0) - receivedBefore);
    const receiptUnitCost = po.landed_cost_enabled ? Number(line.landed_unit_cost || line.unit_cost || 0) : Number(line.unit_cost || 0);
    const defaultAmount = remaining * receiptUnitCost;
    return `<tr data-gr-line="${index}">
      <td class="tight"><input type="checkbox" data-gr-field="include" ${remaining > 0 ? "checked" : ""}></td>
      <td>${esc(line.sku)}</td>
      <td>${esc(line.product_name || "")}</td>
      <td class="numcell">${esc(line.qty || 0)}</td>
      <td class="numcell">${esc(receivedBefore)}</td>
      <td class="numcell" data-gr-remaining="${remaining}">${esc(remaining)}</td>
      <td><input type="number" step="0.01" min="0" max="${remaining}" data-gr-field="received_qty" value="${remaining}"></td>
      <td><input type="number" step="0.01" min="0" data-gr-field="unit_cost" value="${esc(receiptUnitCost)}"></td>
      <td><input data-gr-field="vendor_invoice_no" placeholder="Vendor invoice #"></td>
      <td><input type="date" data-gr-field="vendor_invoice_date"></td>
      <td><input type="number" step="0.01" min="0" data-gr-field="vendor_invoice_amount" value="${esc(defaultAmount || "")}"></td>
      <td>${suggestInput(`receiptType${index}`, ["Partial", "Full"], remaining >= Number(line.qty || 0) ? "Full" : "Partial", "Receipt type").replace(">", ' data-gr-field="receipt_type">')}</td>
      <input type="hidden" data-gr-field="sku" value="${esc(line.sku)}">
      <input type="hidden" data-gr-field="product_name" value="${esc(line.product_name || "")}">
      <input type="hidden" data-gr-field="ordered_qty" value="${esc(line.qty || 0)}">
      <input type="hidden" data-gr-field="product_id" value="${esc(line.product_id || "")}">
    </tr>`;
  }).join("")}</tbody></table></div>`;
}

async function saveGoodsReceiptModal() {
  const po = editing;
  if (!po) return;
  const header = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => header[el.dataset.productField] = el.value || null);
  const rows = [...document.querySelectorAll("[data-gr-line]")].map((tr) => {
    const get = (field) => tr.querySelector(`[data-gr-field="${field}"]`)?.value || "";
    const include = tr.querySelector('[data-gr-field="include"]')?.checked;
    const remaining = Number(tr.querySelector("[data-gr-remaining]")?.dataset.grRemaining || 0);
    const receivedQty = Number(get("received_qty") || 0);
    return {
      include,
      remaining,
      received_qty: receivedQty,
      product_id: get("product_id") || null,
      sku: get("sku"),
      product_name: get("product_name"),
      ordered_qty: Number(get("ordered_qty") || 0),
      unit_cost: Number(get("unit_cost") || 0),
      vendor_invoice_no: get("vendor_invoice_no") || null,
      vendor_invoice_date: get("vendor_invoice_date") || null,
      vendor_invoice_amount: Number(get("vendor_invoice_amount") || 0),
      receipt_type: get("receipt_type") || "Partial",
    };
  }).filter((row) => row.include && row.received_qty > 0);
  const over = rows.find((row) => row.received_qty > row.remaining);
  if (over) {
    alert(`${over.sku} received quantity cannot be more than remaining quantity.`);
    return;
  }
  if (!rows.length) {
    alert("Select at least one line to receive.");
    return;
  }
  try {
    const grNo = header.gr_no;
    const grDate = header.gr_date || today();
    const receiptRows = rows.map((row, index) => {
      const invoiceNote = row.vendor_invoice_no ? `Invoice ${row.vendor_invoice_no}${row.vendor_invoice_date ? ` dated ${row.vendor_invoice_date}` : ""}${row.vendor_invoice_amount ? ` amount ${money(row.vendor_invoice_amount)}` : ""}` : "";
      const receiptRow = {
      gr_no: rows.length === 1 ? grNo : `${grNo}-${index + 1}`,
      gr_date: grDate,
      po_id: po.id,
      po_no: po.po_no,
      vendor: po.vendor,
      product_id: row.product_id,
      sku: row.sku,
      product_name: row.product_name,
      ordered_qty: row.ordered_qty,
      received_qty: row.received_qty,
      unit_cost: row.unit_cost,
        received_by: profile?.full_name || profile?.username || "Owner",
        receipt_type: row.receipt_type,
        status: "Received",
        notes: [header.notes, productMeta.receiptInvoiceColumns ? "" : invoiceNote].filter(Boolean).join(" | ") || null,
      };
      if (productMeta.receiptInvoiceColumns) {
        receiptRow.vendor_invoice_no = row.vendor_invoice_no;
        receiptRow.vendor_invoice_date = row.vendor_invoice_date;
        receiptRow.vendor_invoice_amount = row.vendor_invoice_amount || row.received_qty * row.unit_cost;
      }
      return receiptRow;
    });
    await upsertMany("goods_receipts", receiptRows, "gr_no");
    await postGoodsReceiptLedger(receiptRows);
    for (const [index, row] of rows.entries()) {
      const product = (productMeta.products || []).find((p) => p.id === row.product_id || p.sku === row.sku);
      const movementRef = rows.length === 1 ? `SM-${grNo}` : `SM-${grNo}-${index + 1}`;
      await upsertOne("stock_movements", {
        reference_no: movementRef,
        movement_date: grDate,
        type: "Goods Receipt",
        product_id: product?.id || row.product_id,
        sku: row.sku,
        product_name: row.product_name,
        vendor: po.vendor,
        qty: row.received_qty,
        to_warehouse: product?.warehouse || "",
        unit_fifo_cost: row.unit_cost,
        total_fifo_cost: row.received_qty * row.unit_cost,
        document_no: po.po_no,
        entered_by: profile?.full_name || profile?.username || "Owner",
        reason: `${po.po_no} ${row.receipt_type.toLowerCase()} receipt${row.vendor_invoice_no ? ` / invoice ${row.vendor_invoice_no}` : ""}`,
      }, "reference_no");
      if (product?.id) {
        const nextQty = Number(product.qty || 0) + Number(row.received_qty || 0);
        await supabase.from("products").update({
          qty: nextQty,
          cost: row.unit_cost || product.cost,
        }).eq("id", product.id);
        product.qty = nextQty;
        product.cost = row.unit_cost || product.cost;
      }
    }
    await incrementSequence("gr");
    const invoiceSummary = receiptInvoiceSummary(rows, grDate);
    if (invoiceSummary) {
      await supabase.from("purchase_orders").update({
        vendor_invoice_no: invoiceSummary.vendor_invoice_no || po.vendor_invoice_no || null,
        vendor_invoice_date: invoiceSummary.vendor_invoice_date || po.vendor_invoice_date || null,
        vendor_invoice_amount: invoiceSummary.vendor_invoice_amount || po.vendor_invoice_amount || 0,
        due_date: po.due_date || po.expected_date || invoiceSummary.vendor_invoice_date || grDate,
      }).eq("id", po.id);
    }
    await refreshPurchaseOrderFlow(po.po_no, { keepPaid: true });
    closeModal();
    renderPurchasingView();
  } catch (error) {
    alert(error.message || error);
  }
}

function printPurchaseOrder(poNo) {
  const po = currentRows.find((row) => row.po_no === poNo);
  if (!po) return;
  const lines = po._lines || [];
  const title = String(po.status || "").toLowerCase() === "quotation" ? "Purchase Quote" : "Purchase Order";
  const vendor = (purchaseContext.vendorRows || []).find((row) => String(row.name || "").toLowerCase() === String(po.vendor || "").toLowerCase()) || {};
  const vendorDetails = [
    po.vendor || vendor.name || "",
    vendor.address || "",
    vendor.email ? `Email: ${vendor.email}` : "",
    vendor.phone ? `Phone: ${vendor.phone}` : "",
    `Terms: ${po.payment_terms || vendor.terms || "Not specified"}`,
    vendor.tax_id ? `Tax ID: ${vendor.tax_id}` : "",
  ].filter(Boolean);
  const poDetails = [
    ["Jobsite / Project", po.jobsite_project || ""],
    ["Status", po.status || ""],
    ["Match", po.match_status || "Pending"],
    ["Payment", po.payment_status || "Not Ready"],
    ["Incoterm", po.incoterm || ""],
    ["Landed Cost", po.landed_cost_enabled ? `${po.landed_cost_method || "By Value"} allocation` : "No"],
    ["Expected", po.expected_date || ""],
    ["Currency", po.foreign_order ? `${po.currency_code || "USD"} to USD @ ${po.exchange_rate || 1}` : "USD"],
    ["Country", po.foreign_order ? po.foreign_country || "" : ""],
    ["Vendor Invoice #", po.vendor_invoice_no || ""],
    ["Invoice Date", po.vendor_invoice_date || ""],
    ["Due Date", po.due_date || ""],
    ["Invoice Amount", Number(po.vendor_invoice_amount || 0) ? money(po.vendor_invoice_amount) : ""],
  ].filter(([, value]) => String(value ?? "").trim());
  const partsSubtotal = poPartsSubtotal(po);
  const freight = poFreight(po);
  const duty = Number(po.duty_amount || 0);
  const otherLanded = Number(po.other_landed_cost_amount || 0);
  const html = `<!doctype html><html><head><title>${esc(po.po_no)}</title><style>
    @page{size:Letter;margin:.45in}
    *{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#102033;margin:0;background:#fff}
    .sheet{max-width:7.6in;margin:0 auto}
    .print-btn{position:fixed;right:18px;top:18px;padding:9px 13px;border:1px solid #cfd6df;border-radius:7px;background:#fff}
    .top{display:flex;justify-content:space-between;gap:20px;border-bottom:4px solid #075f6d;padding:12px 0 18px;margin-bottom:24px}
    .logo{font-size:38px;line-height:1;font-weight:900;font-style:italic;color:#075f6d;letter-spacing:0}
    .logo small{font-size:13px;font-style:normal;text-transform:uppercase;letter-spacing:2px}
    h1{color:#075f6d;margin:14px 0 0;font-size:28px}
    .doc-meta{text-align:right;font-size:15px;line-height:1.65}
    .boxes{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px}
    .box{border:1px solid #cfd6df;border-radius:7px;padding:13px;min-height:104px;line-height:1.35}
    .box strong{color:#061b2d}
    .meta-line{display:flex;gap:7px;justify-content:space-between;border-bottom:1px solid #eef2f6;padding:2px 0}
    .meta-line:last-child{border-bottom:0}
    .meta-line span:first-child{font-weight:700;color:#061b2d}
    .meta-line span:last-child{text-align:right}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{border-bottom:1px solid #d8dee8;padding:10px 9px;text-align:left;word-break:break-word}
    th{font-size:11px;text-transform:uppercase;color:#1f3145;background:#eef3f6}
    .sku{width:17%}.uom{width:10%}.qty{width:10%}.cost,.amount{width:16%}
    .num{text-align:right}
    .subtotal-row td{border-bottom:0;padding-top:12px;padding-bottom:3px}
    .subtotal-label{font-weight:700;text-align:right}
    .total-row td{border-bottom:2px solid #cfd6df}
    .total{font-weight:900;font-size:21px;color:#075f6d}
    .notes{margin-top:18px;border-top:1px solid #d8dee8;padding-top:12px;font-size:12px;color:#506178}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:34px;page-break-inside:avoid}
    .sig-box{min-height:112px;border-top:1px solid #0f172a;padding-top:8px;font-size:12px;color:#506178}
    .sig-title{font-weight:800;color:#061b2d;margin-bottom:8px}
    .sig-pad{width:100%;height:92px;border:1px solid #cfd6df;border-radius:6px;background:#fff;touch-action:none}
    .sig-actions{display:flex;gap:8px;margin:8px 0}.sig-actions button{padding:6px 9px;border:1px solid #cfd6df;border-radius:6px;background:#fff}
    .sig-input{width:100%;border:0;border-bottom:1px solid #cfd6df;padding:6px 0;margin:2px 0 5px;font-size:12px}
    .sig-line{border-bottom:1px solid #cfd6df;height:26px;margin-top:4px}
    .sig-label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#506178;margin-top:5px}
    @media print{.print-btn,.sig-actions{display:none}.sheet{max-width:none}.sig-pad{border:0;border-bottom:1px solid #0f172a;border-radius:0}}
  </style></head><body><button class="print-btn" onclick="window.print()">Print / Save PDF</button><main class="sheet"><div class="top"><div><div class="logo">lms <small>imports</small></div><h1>${esc(title)}</h1></div><div class="doc-meta"><strong>${esc(po.po_no)}</strong><br>Date ${esc(po.po_date || "")}${po.expected_date ? `<br>Expected ${esc(po.expected_date)}` : ""}</div></div><div class="boxes"><div class="box"><strong>Vendor</strong><br>${vendorDetails.map(esc).join("<br>") || "No vendor details on file"}</div><div class="box">${poDetails.map(([label, value]) => `<div class="meta-line"><span>${esc(label)}</span><span>${esc(value)}</span></div>`).join("")}</div></div><table><thead><tr><th class="sku">SKU</th><th>Item</th><th class="uom">UOM</th><th class="qty num">Qty</th><th class="cost num">Unit Cost</th><th class="amount num">Amount</th></tr></thead><tbody>${lines.map((line) => `<tr><td>${esc(line.sku)}</td><td>${esc(line.product_name || "")}${line.wo_no ? `<br><small>WO ${esc(line.wo_no)}</small>` : ""}${po.landed_cost_enabled ? `<br><small>Landed unit ${money(line.landed_unit_cost || line.unit_cost)} / allocation ${money(line.allocated_landed_cost || 0)}</small>` : ""}</td><td>${esc(line.unit || "")}</td><td class="num">${esc(line.qty)}</td><td class="num">${money(line.unit_cost)}</td><td class="num">${money(Number(line.qty || 0) * Number(line.unit_cost || 0))}</td></tr>`).join("")}<tr class="subtotal-row"><td colspan="5" class="subtotal-label">Parts subtotal</td><td class="num">${money(partsSubtotal)}</td></tr><tr class="subtotal-row"><td colspan="5" class="subtotal-label">Freight</td><td class="num">${money(freight)}</td></tr><tr class="subtotal-row"><td colspan="5" class="subtotal-label">Duty / Customs</td><td class="num">${money(duty)}</td></tr><tr class="subtotal-row"><td colspan="5" class="subtotal-label">Other landed cost</td><td class="num">${money(otherLanded)}</td></tr><tr class="total-row"><td colspan="5" class="num total">Total</td><td class="num total">${money(poTotal(po))}</td></tr></tbody></table>${po.notes ? `<div class="notes"><strong>Notes</strong><br>${esc(po.notes)}</div>` : ""}${signatureBlockHtml("Vendor acknowledgement")}</main>${signatureScriptHtml()}</body></html>`;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow popups to print or save PDF.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function emailPurchaseOrder(poNo) {
  const po = currentRows.find((row) => row.po_no === poNo);
  if (!po) return;
  const vendor = (purchaseContext.vendorRows || []).find((row) => String(row.name || "").toLowerCase() === String(po.vendor || "").toLowerCase()) || {};
  if (!vendor.email) {
    alert(`No email is saved for ${po.vendor || "this vendor"}. Add the vendor email in Vendor Master first.`);
    return;
  }
  printPurchaseOrder(poNo);
  const subject = `${po.po_no} Purchase Order from LMS Imports`;
  const body = [
    `Hello ${po.vendor || ""},`,
    "",
    `Please see purchase order ${po.po_no}.`,
    `PO Date: ${po.po_date || ""}`,
    po.expected_date ? `Expected Date: ${po.expected_date}` : "",
    `Jobsite / Project: ${po.jobsite_project || ""}`,
    `Terms: ${po.payment_terms || ""}`,
    `Incoterm: ${po.incoterm || ""}`,
    `Parts subtotal: ${money(poPartsSubtotal(po))}`,
    `Freight: ${money(poFreight(po))}`,
    po.landed_cost_enabled ? `Duty / Customs: ${money(po.duty_amount || 0)}` : "",
    po.landed_cost_enabled ? `Other landed cost: ${money(po.other_landed_cost_amount || 0)}` : "",
    `Total: ${money(poTotal(po))}`,
    "",
    "The PDF opened in a separate tab so it can be saved and attached to this email.",
    "",
    "Thank you,",
    "LMS Imports",
  ].filter((line) => line !== "").join("\n");
  window.location.href = `mailto:${encodeURIComponent(vendor.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function exportPurchaseOrdersCsv() {
  currentCfg = { labels: ["PO", "Date", "Vendor", "Jobsite / Project", "Terms", "Incoterm", "Foreign Order", "Country", "Currency", "Exchange Rate", "Landed Cost Enabled", "Allocation Method", "Parts Subtotal", "Freight", "Duty", "Other Landed", "PO Total", "Received", "Invoice", "Invoice Amount", "Match", "Payment", "Status"], heads: [] };
  currentRows = currentRows.map((po) => ({ PO: po.po_no, Date: po.po_date, Vendor: po.vendor, "Jobsite / Project": po.jobsite_project, Terms: po.payment_terms, Incoterm: po.incoterm, "Foreign Order": po.foreign_order ? "Yes" : "No", Country: po.foreign_country, Currency: po.currency_code, "Exchange Rate": po.exchange_rate, "Landed Cost Enabled": po.landed_cost_enabled ? "Yes" : "No", "Allocation Method": po.landed_cost_method, "Parts Subtotal": poPartsSubtotal(po), Freight: poFreight(po), Duty: po.duty_amount, "Other Landed": po.other_landed_cost_amount, "PO Total": poTotal(po), Received: poReceivedTotal(po), Invoice: po.vendor_invoice_no, "Invoice Amount": po.vendor_invoice_amount, Match: po.match_status, Payment: po.payment_status, Status: po.status }));
  const rows = [currentCfg.labels, ...currentRows.map((r) => currentCfg.labels.map((h) => r[h] ?? ""))];
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "purchase-orders.csv";
  a.click();
  URL.revokeObjectURL(url);
  renderPurchasingView();
}

async function renderGoodsReceiptsView() {
  currentCfg = tableMap.receipts;
  $("viewTitle").textContent = "Goods Receipts";
  $("viewSub").textContent = "Receive ordered goods only and track partial/full receipt.";
  const [receipts, products] = await Promise.all([getAll("goods_receipts"), getAll("products")]);
  productMeta.products = products;
  currentRows = receipts.sort((a, b) => String(b.gr_date || "").localeCompare(String(a.gr_date || "")));
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="receiptSearch" placeholder="Search receipts by GR, PO, vendor, invoice, product, status">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Goods Receipts</strong><span>Receipt history with invoice references and reversal controls.</span></div><div class="actions">${dateRangeControls("receipt")}<button id="receiptApplyDates">Apply dates</button><button id="receiptCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button></div></div>
      <div id="receiptTableHost">${goodsReceiptsTableHtml(currentRows)}</div>
    </section>`;
  $("receiptSearch").oninput = renderFilteredGoodsReceipts;
  $("receiptApplyDates").onclick = renderFilteredGoodsReceipts;
  $("receiptCsvBtn").onclick = exportCurrentCsv;
  bindGoodsReceiptRows();
}

function renderFilteredGoodsReceipts() {
  const q = ($("receiptSearch")?.value || "").toLowerCase();
  const from = $("receiptFrom")?.value || "";
  const to = $("receiptTo")?.value || "";
  const rows = currentRows.filter((row) => {
    const date = String(row.gr_date || "");
    return (!q || Object.values(row).join(" ").toLowerCase().includes(q)) && (!from || date >= from) && (!to || date <= to);
  });
  $("receiptTableHost").innerHTML = goodsReceiptsTableHtml(rows);
  bindGoodsReceiptRows();
}

function goodsReceiptsTableHtml(rows) {
  const heads = [...currentCfg.labels, ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(goodsReceiptRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No goods receipts yet.</td></tr>`}</tbody></table></div>`;
}

function goodsReceiptRowHtml(row) {
  const reversed = /reversed/i.test(row.status || "");
  return `<tr>${currentCfg.heads.map((h) => `<td>${cell(h, row[h], row)}</td>`).join("")}<td><div class="rowactions">${reversed ? badge("Reversed") : `<button class="rowbtn danger" type="button" data-reverse-gr="${esc(row.gr_no)}">Reverse</button>`}</div></td></tr>`;
}

function bindGoodsReceiptRows() {
  document.querySelectorAll("[data-reverse-gr]").forEach((b) => b.onclick = () => reverseGoodsReceipt(b.dataset.reverseGr));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function reverseGoodsReceipt(grNo) {
  const gr = currentRows.find((row) => row.gr_no === grNo);
  if (!gr || /reversed/i.test(gr.status || "")) return;
  if (!confirm(`Reverse ${gr.gr_no}? This will subtract the received quantity from stock and post a reversal movement.`)) return;
  const product = (productMeta.products || []).find((p) => p.id === gr.product_id || p.sku === gr.sku);
  const qty = Number(gr.received_qty || 0);
  const unitCost = Number(gr.unit_cost || product?.cost || 0);
  try {
    if (gr.po_no && await hasPurchaseOrderPayments(gr.po_no)) {
      alert("This PO already has a payment/check run. Reverse the payment first, then reverse the goods receipt.");
      return;
    }
    if (gr.po_no && await hasPostedApForPurchaseOrder(gr.po_no)) {
      alert("This PO is already posted to Accounts Payable. Reverse or clear the AP posting first, then reverse the goods receipt.");
      return;
    }
    await supabase.from("goods_receipts").update({
      status: "Reversed",
      notes: [gr.notes, `Reversed ${today()} by ${profile?.full_name || profile?.username || "Owner"}`].filter(Boolean).join(" | "),
    }).eq("gr_no", gr.gr_no);
    await upsertOne("stock_movements", {
      reference_no: `REV-${gr.gr_no}`,
      movement_date: today(),
      type: "Goods Receipt Reversal",
      product_id: gr.product_id || product?.id || null,
      sku: gr.sku,
      product_name: gr.product_name,
      vendor: gr.vendor,
      qty: -Math.abs(qty),
      from_warehouse: product?.warehouse || "",
      unit_fifo_cost: unitCost,
      total_fifo_cost: Math.abs(qty) * unitCost,
      document_no: gr.po_no || gr.gr_no,
      entered_by: profile?.full_name || profile?.username || "Owner",
      reason: `Reversal of ${gr.gr_no}${gr.vendor_invoice_no ? ` / invoice ${gr.vendor_invoice_no}` : ""}`,
    }, "reference_no");
    if (product?.id) {
      await supabase.from("products").update({ qty: Number(product.qty || 0) - qty }).eq("id", product.id);
    }
    await postGoodsReceiptReversalLedger(gr);
    if (gr.po_no) await refreshPurchaseOrderFlow(gr.po_no);
    renderPurchasingView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function renderSalesOrdersView() {
  currentCfg = tableMap.orders;
  $("viewTitle").textContent = "Sales Orders";
  $("viewSub").textContent = "Track customer demand and committed inventory.";
  const [orders, lines, customers, products] = await Promise.all([
    getAll("sales_orders"),
    getAll("sales_order_lines"),
    getAll("customers"),
    getAll("products"),
  ]);
  currentRows = orders.sort((a, b) => String(b.order_date || "").localeCompare(String(a.order_date || "")));
  currentRows.forEach((order) => order._lines = lines.filter((line) => line.order_id === order.id));
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  productMeta.products = products.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="salesSearch" placeholder="Search sales orders by order, customer, PO, product, status">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Sales Orders</strong><span>Customer requests and fulfillment status</span></div><div class="actions"><button id="salesCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newSalesBtn">New order</button></div></div>
      <div id="salesTableHost">${salesOrderTableHtml(currentRows)}</div>
    </section>`;
  $("salesSearch").oninput = renderFilteredSalesOrders;
  $("salesCsvBtn").onclick = exportSalesOrdersCsv;
  $("newSalesBtn").onclick = () => openSalesOrderModal();
  bindSalesRows();
}

function renderFilteredSalesOrders() {
  const q = $("salesSearch").value.toLowerCase();
  const rows = currentRows.filter((order) => !q || [
    order.order_no, order.customer, order.customer_po, order.order_date, order.status, order.invoice_no,
    ...(order._lines || []).map((line) => `${line.sku} ${line.product_name}`)
  ].join(" ").toLowerCase().includes(q));
  $("salesTableHost").innerHTML = salesOrderTableHtml(rows);
  bindSalesRows();
}

function salesOrderTableHtml(rows) {
  const heads = ["Order", "Customer", "Customer PO", "Payment Mode", "Date", "Status", "Lines", "To Order", "Total", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(salesOrderRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No sales orders yet.</td></tr>`}</tbody></table></div>`;
}

function salesOrderRowHtml(order) {
  const poBadge = order.customer_po ? badge(order.customer_po) : order.manager_override ? badge(`Override: ${order.override_by || "Manager"}`) : badge("Missing PO");
  const toOrderQty = salesOrderShortageQty(order);
  return `<tr>
    <td>${esc(order.order_no)}</td>
    <td>${esc(order.customer || "")}</td>
    <td>${poBadge}</td>
    <td>${badge(order.payment_mode || "PO")}</td>
    <td>${esc(order.order_date || "")}</td>
    <td>${badge(order.status || "Open")}</td>
    <td>${esc((order._lines || []).length)}</td>
    <td>${toOrderQty ? badge(`${toOrderQty} to order`) : ""}</td>
    <td>${money(salesOrderTotal(order))}</td>
    <td><div class="rowactions"><button class="rowbtn" type="button" data-sales-pdf="${esc(order.order_no)}">PDF</button><button class="rowbtn" type="button" data-sales-invoice="${esc(order.order_no)}">Inv</button>${order.status !== "Fulfilled" ? `<button class="rowbtn" type="button" data-sales-issue="${esc(order.order_no)}">→</button>` : ""}<button class="rowbtn" type="button" data-sales-edit="${esc(order.order_no)}">Edit</button><button class="rowbtn danger" type="button" data-sales-delete="${esc(order.order_no)}">Delete</button></div></td>
  </tr>`;
}

function salesOrderTotal(order) {
  return (order._lines || []).reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0), 0);
}

function salesOrderShortageQty(order) {
  if (["quotation", "fulfilled", "paid", "cancelled"].includes(String(order.status || "").toLowerCase())) return 0;
  return (order._lines || []).reduce((sum, line) => {
    const product = (productMeta.products || []).find((p) => p.sku === line.sku);
    return sum + Math.max(0, Number(line.qty || 0) - Number(product?.qty || 0));
  }, 0);
}

function bindSalesRows() {
  document.querySelectorAll("[data-sales-edit]").forEach((b) => b.onclick = () => openSalesOrderModal(currentRows.find((order) => order.order_no === b.dataset.salesEdit)));
  document.querySelectorAll("[data-sales-delete]").forEach((b) => b.onclick = () => deleteSalesOrder(b.dataset.salesDelete));
  document.querySelectorAll("[data-sales-pdf]").forEach((b) => b.onclick = () => printSalesOrder(b.dataset.salesPdf));
  document.querySelectorAll("[data-sales-issue]").forEach((b) => b.onclick = () => issueSalesOrder(b.dataset.salesIssue));
  document.querySelectorAll("[data-sales-invoice]").forEach((b) => b.onclick = () => invoiceSalesOrder(b.dataset.salesInvoice));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function openSalesOrderModal(order = null) {
  editing = order;
  const orderNo = order?.order_no || await nextRefPreview("so", "SO-", "sales_orders", "order_no");
  const lines = order?._lines?.length ? order._lines : [{ sku: productMeta.products?.[0]?.sku || "", product_name: productMeta.products?.[0]?.name || "", qty: 1, price: productMeta.products?.[0]?.selling_price || 0 }];
  $("modalTitle").textContent = order ? "Edit sales order" : "New sales order";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Number", "order_no", orderNo)}
      ${productSelect("Customer", "customer", productMeta.customers || [], order?.customer || "", "New customer")}
      ${productInput("Date", "order_date", order?.order_date || today(), "date")}
      ${productInput("Customer PO #", "customer_po", order?.customer_po || "")}
      ${productSelect("Mode of payment", "payment_mode", ["PO", "Cash", "Check", "ACH", "Credit Card", "Wire", "Other"], order?.payment_mode || "PO")}
      ${productSelect("Manager override", "manager_override", ["No", "Yes"], order?.manager_override ? "Yes" : "No")}
      ${productInput("Override by", "override_by", order?.override_by || "")}
      <div class="field wide"><label>Override reason</label><textarea data-product-field="override_reason">${esc(order?.override_reason || "")}</textarea></div>
      ${productSelect("Status", "status", ["Quotation", "Open", "Approved", "Reserved", "Fulfilled", "Posted", "Paid", "Cancelled"], order?.status || "Open")}
      <div class="field wide"><label>Line items</label>${salesLineRows(lines)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(order?.notes || "")}</textarea></div>
    </div>
    <p class="notice">All products are listed, including zero stock items. Goods issue and invoicing stay blocked until enough stock is available.</p>`;
  $("modalSave").onclick = saveSalesOrderModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateSalesCustomer(order));
  const addLineBtn = $("addSalesLineBtn");
  if (addLineBtn) addLineBtn.onclick = addSalesLineRow;
}

function salesLineRows(lines) {
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Product</th><th>On Hand</th><th>Qty</th><th>Price</th><th>Amount</th><th>In-Stock Alt</th></tr></thead><tbody id="salesLineBody">${lines.map((line, i) => salesLineRowHtml(line, i)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addSalesLineBtn">Add row</button></div>`;
}

function salesLineRowHtml(line = {}, index = 0) {
  const sku = line.sku || "";
  const product = productMeta.products?.find((p) => p.sku === sku) || {};
  const label = sku ? `${sku} - ${line.product_name || product.name || ""}` : "";
  return `<tr>
    <td><input class="suggest-input" list="poProductOptions" data-sales-line="sku" data-line-index="${index}" value="${esc(label)}" placeholder="Search SKU, name, vendor" autocomplete="off">${productOptionsDatalist()}</td>
    <td>${esc(product.qty ?? "")}</td>
    <td><input type="number" step="0.01" data-sales-line="qty" data-line-index="${index}" value="${esc(line.qty || "")}"></td>
    <td><input type="number" step="0.01" data-sales-line="price" data-line-index="${index}" value="${esc(line.price ?? product.selling_price ?? "")}"></td>
    <td>${money(Number(line.qty || 0) * Number(line.price || 0))}</td>
    <td>${Number(product.qty || 0) > 0 ? "Available" : "Check alternate"}</td>
  </tr>`;
}

function addSalesLineRow() {
  const body = $("salesLineBody");
  if (!body) return;
  const index = body.querySelectorAll("tr").length;
  body.insertAdjacentHTML("beforeend", salesLineRowHtml({}, index));
}

async function renderSalesPartsToOrderView() {
  currentCfg = tableMap.salestopurchase;
  $("viewTitle").textContent = "Parts to Order";
  $("viewSub").textContent = "Reserved customer demand that cannot be fulfilled until inventory is received.";
  const [orders, lines, products] = await Promise.all([
    getAll("sales_orders"),
    getAll("sales_order_lines"),
    getAll("products"),
  ]);
  currentRows = buildSalesPartsToOrderRows(orders, lines, products);
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="partsToOrderSearch" placeholder="Search by customer, order, SKU, product, status">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Parts to Order</strong><span>Sales orders are allowed, but issue and invoice stay blocked until these shortages are received.</span></div><div class="actions"><button id="partsToOrderCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="partsToOrderPoBtn">New PO</button></div></div>
      <div id="partsToOrderHost">${salesPartsToOrderTableHtml(currentRows)}</div>
    </section>`;
  $("partsToOrderSearch").oninput = renderFilteredSalesPartsToOrder;
  $("partsToOrderCsvBtn").onclick = exportSalesPartsToOrderCsv;
  $("partsToOrderPoBtn").onclick = () => loadView("purchasing");
  bindPartsToOrderRows();
}

function buildSalesPartsToOrderRows(orders, lines, products) {
  const productById = Object.fromEntries(products.map((p) => [p.id, p]));
  const availableBySku = Object.fromEntries(products.map((p) => [p.sku, Number(p.qty || 0)]));
  const orderById = Object.fromEntries(orders.map((o) => [o.id, o]));
  return lines
    .map((line) => ({ line, order: orderById[line.order_id], product: productById[line.product_id] || products.find((p) => p.sku === line.sku) }))
    .filter(({ order }) => order && !["quotation", "fulfilled", "paid", "cancelled"].includes(String(order.status || "").toLowerCase()))
    .sort((a, b) => String(a.order.order_date || "").localeCompare(String(b.order.order_date || "")) || String(a.order.order_no || "").localeCompare(String(b.order.order_no || "")))
    .map(({ line, order, product }) => {
      const sku = line.sku || product?.sku || "";
      const ordered = Number(line.qty || 0);
      const availableBefore = Number(availableBySku[sku] || 0);
      const reservedQty = Math.min(ordered, Math.max(0, availableBefore));
      const shortage = Math.max(0, ordered - reservedQty);
      availableBySku[sku] = availableBefore - ordered;
      return {
        order_no: order.order_no,
        order_date: order.order_date,
        customer: order.customer,
        customer_po: order.customer_po,
        sku,
        product_name: line.product_name || product?.name || "",
        ordered_qty: ordered,
        reserved_qty: reservedQty,
        to_order_qty: shortage,
        on_hand_at_review: Math.max(0, availableBefore),
        source_vendor: product?.source_vendor || "",
        unit_cost: Number(product?.cost || 0),
        estimated_cost: shortage * Number(product?.cost || 0),
        status: shortage > 0 ? "To Order" : "Reserved",
      };
    })
    .filter((row) => row.to_order_qty > 0);
}

function renderFilteredSalesPartsToOrder() {
  const q = $("partsToOrderSearch").value.toLowerCase();
  const rows = currentRows.filter((row) => !q || Object.values(row).join(" ").toLowerCase().includes(q));
  $("partsToOrderHost").innerHTML = salesPartsToOrderTableHtml(rows);
  bindPartsToOrderRows();
}

function salesPartsToOrderTableHtml(rows) {
  const heads = ["Order", "Date", "Customer", "Customer PO", "SKU", "Product", "Ordered", "Reserved", "To Order", "On Hand", "Preferred Vendor", "Est. Cost", "Status", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(salesPartsToOrderRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No sales parts need ordering right now.</td></tr>`}</tbody></table></div>`;
}

function salesPartsToOrderRowHtml(row) {
  return `<tr>
    <td>${esc(row.order_no)}</td>
    <td>${esc(row.order_date || "")}</td>
    <td>${esc(row.customer || "")}</td>
    <td>${esc(row.customer_po || "")}</td>
    <td>${esc(row.sku)}</td>
    <td>${esc(row.product_name)}</td>
    <td>${esc(row.ordered_qty)}</td>
    <td>${esc(row.reserved_qty)}</td>
    <td><strong>${esc(row.to_order_qty)}</strong></td>
    <td>${esc(row.on_hand_at_review)}</td>
    <td>${esc(row.source_vendor || "")}</td>
    <td>${money(row.estimated_cost)}</td>
    <td>${badge(row.status)}</td>
    <td><button class="rowbtn" type="button" data-open-sales="${esc(row.order_no)}">Open SO</button></td>
  </tr>`;
}

function bindPartsToOrderRows() {
  document.querySelectorAll("[data-open-sales]").forEach((b) => b.onclick = async () => {
    await renderSalesOrdersView();
    const order = currentRows.find((row) => row.order_no === b.dataset.openSales);
    if (order) openSalesOrderModal(order);
  });
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function exportSalesPartsToOrderCsv() {
  const heads = ["Order", "Date", "Customer", "Customer PO", "SKU", "Product", "Ordered", "Reserved", "To Order", "On Hand", "Preferred Vendor", "Estimated Cost", "Status"];
  const rows = [heads, ...currentRows.map((row) => [row.order_no, row.order_date, row.customer, row.customer_po, row.sku, row.product_name, row.ordered_qty, row.reserved_qty, row.to_order_qty, row.on_hand_at_review, row.source_vendor, row.estimated_cost, row.status])];
  downloadCsv(rows, "sales-parts-to-order.csv");
}

async function quickCreateSalesCustomer(order) {
  const name = prompt("Customer name to create");
  if (!name) return;
  try {
    await upsertOne("customers", { reference: await nextRefPreview("customer", "C-", "customers", "reference"), name: name.trim(), terms: "30 days" }, "name");
    await renderSalesOrdersView();
    await openSalesOrderModal(order);
    const customerField = document.querySelector('[data-product-field="customer"]');
    if (customerField) customerField.value = name.trim();
  } catch (error) {
    alert(error.message || error);
  }
}

async function saveSalesOrderModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  record.manager_override = record.manager_override === "Yes";
  if (!record.customer_po && !record.manager_override) {
    alert("Customer PO # is required unless manager override is selected.");
    return;
  }
  record.payment_mode = record.payment_mode || "PO";
  if (record.manager_override && (!record.override_by || !record.override_reason)) {
    alert("Override by and override reason are required when manager override is selected.");
    return;
  }
  const lineRows = parseSalesLineRows();
  if (!lineRows.length) {
    alert("Add at least one sales order line.");
    return;
  }
  if (["open", "reserved"].includes(String(record.status || "").toLowerCase()) && hasSalesLineShortage(lineRows)) {
    record.status = "Reserved";
  }
  try {
    const wasNew = !editing;
    const saved = await upsertOne("sales_orders", record, "order_no");
    await supabase.from("sales_order_lines").delete().eq("order_id", saved.id);
    await upsertMany("sales_order_lines", lineRows.map((line) => ({ ...line, order_id: saved.id })), "id");
    await syncSalesOrderInitialAccounting(saved, lineRows, productMeta.products || [], { forceAvailable: /fulfilled|posted|paid/i.test(saved.status || "") });
    if (wasNew) await incrementSequence("so");
    closeModal();
    renderSalesOrdersView();
  } catch (error) {
    alert(error.message || error);
  }
}

function parseSalesLineRows() {
  return [...document.querySelectorAll("#salesLineBody tr")].map((tr) => {
    const get = (field) => tr.querySelector(`[data-sales-line="${field}"]`)?.value || "";
    const product = resolveProductLookup(get("sku"));
    if (!product) return null;
    const sku = product.sku;
    return { product_id: product.id, sku, product_name: product.name, qty: Number(get("qty") || 0), price: Number(get("price") || 0) };
  }).filter((line) => line && line.qty > 0);
}

function hasSalesLineShortage(lines) {
  return lines.some((line) => {
    const product = (productMeta.products || []).find((p) => p.sku === line.sku);
    return !product || Number(line.qty || 0) > Number(product.qty || 0);
  });
}

function salesOrderAccountingReady(order) {
  return ["approved", "reserved", "fulfilled", "posted", "paid"].includes(String(order?.status || "").toLowerCase());
}

async function syncSalesOrderInitialAccounting(order, lines, products = [], options = {}) {
  if (!order?.order_no) return;
  await supabase.from("general_ledger").delete().eq("reference", order.order_no).eq("source", "Sales Order");
  if (!salesOrderAccountingReady(order) || !lines?.length) {
    await supabase.from("general_ledger").delete().eq("reference", order.order_no).eq("source", "Sales Fulfillment");
    return;
  }
  if (isLockedAccountingDate(order.order_date)) throw new Error("This sales order date is inside the closed accounting period.");

  const productBySku = Object.fromEntries((products || []).map((p) => [p.sku, p]));
  const stockBySku = Object.fromEntries((products || []).map((p) => [p.sku, Number(p.qty || 0)]));
  const total = lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0), 0);
  if (!total) return;

  const rows = [{
    entry_date: order.order_date,
    posting_date: order.order_date,
    account: "Accounts Receivable (A/R)",
    customer: order.customer,
    description: `Sales order ${order.order_no} (${order.payment_mode || "PO"})`,
    reference: order.order_no,
    debit: total,
    credit: 0,
    source: "Sales Order",
    status: "Posted",
  }];

  for (const line of lines) {
    const qty = Number(line.qty || 0);
    if (!qty) continue;
    const product = productBySku[line.sku] || {};
    const price = Number(line.price || 0);
    const cost = Number(product.cost || 0);
    const availableQty = options.forceAvailable ? qty : Math.min(qty, Math.max(0, Number(stockBySku[line.sku] || 0)));
    const transitQty = Math.max(0, qty - availableQty);
    stockBySku[line.sku] = Number(stockBySku[line.sku] || 0) - qty;

    if (availableQty > 0 && price > 0) {
      rows.push({ entry_date: order.order_date, posting_date: order.order_date, account: "Parts Sales", customer: order.customer, description: `Available parts sale ${line.sku} ${line.product_name || ""}`, reference: order.order_no, debit: 0, credit: availableQty * price, source: "Sales Order", status: "Posted" });
    }
    if (transitQty > 0 && price > 0) {
      rows.push({ entry_date: order.order_date, posting_date: order.order_date, account: "Parts in Transit", customer: order.customer, description: `Backordered parts sale ${line.sku} ${line.product_name || ""}`, reference: order.order_no, debit: 0, credit: transitQty * price, source: "Sales Order", status: "Posted" });
    }
    if (availableQty > 0 && cost > 0) {
      rows.push({ entry_date: order.order_date, posting_date: order.order_date, account: "COGS - Parts", customer: order.customer, description: `Cost of goods sold ${line.sku} ${line.product_name || ""}`, reference: order.order_no, debit: availableQty * cost, credit: 0, source: "Sales Order", status: "Posted" });
      rows.push({ entry_date: order.order_date, posting_date: order.order_date, account: "Parts Inventory", customer: order.customer, description: `Inventory relief ${line.sku} ${line.product_name || ""}`, reference: order.order_no, debit: 0, credit: availableQty * cost, source: "Sales Order", status: "Posted" });
    }
  }
  await upsertMany("general_ledger", rows, "id");
}

async function postSalesOrderFulfillmentAccounting(order, lines, products = []) {
  if (!order?.order_no || !lines?.length) return;
  if (isLockedAccountingDate(today())) throw new Error("Today's posting date is inside the closed accounting period.");
  const { data: initialRows, error } = await supabase.from("general_ledger").select("*").eq("reference", order.order_no).eq("source", "Sales Order");
  if (error) throw error;
  const existing = initialRows || [];
  const transitAmount = existing.filter((row) => row.account === "Parts in Transit").reduce((sum, row) => sum + Number(row.credit || 0) - Number(row.debit || 0), 0);
  const initialInventoryCredit = existing.filter((row) => row.account === "Parts Inventory").reduce((sum, row) => sum + Number(row.credit || 0) - Number(row.debit || 0), 0);
  const productBySku = Object.fromEntries((products || []).map((p) => [p.sku, p]));
  const totalCost = (lines || []).reduce((sum, line) => sum + Number(line.qty || 0) * Number(productBySku[line.sku]?.cost || 0), 0);
  const remainingCost = Math.max(0, totalCost - Math.max(0, initialInventoryCredit));
  const rows = [];

  if (transitAmount > 0) {
    rows.push({ entry_date: today(), posting_date: today(), account: "Parts in Transit", customer: order.customer, description: `Backordered parts arrived ${order.order_no}`, reference: order.order_no, debit: transitAmount, credit: 0, source: "Sales Fulfillment", status: "Posted" });
    rows.push({ entry_date: today(), posting_date: today(), account: "Parts Sales", customer: order.customer, description: `Recognize sales after parts arrived ${order.order_no}`, reference: order.order_no, debit: 0, credit: transitAmount, source: "Sales Fulfillment", status: "Posted" });
  }
  if (remainingCost > 0) {
    rows.push({ entry_date: today(), posting_date: today(), account: "COGS - Parts", customer: order.customer, description: `Cost of goods sold on fulfillment ${order.order_no}`, reference: order.order_no, debit: remainingCost, credit: 0, source: "Sales Fulfillment", status: "Posted" });
    rows.push({ entry_date: today(), posting_date: today(), account: "Parts Inventory", customer: order.customer, description: `Inventory relief on fulfillment ${order.order_no}`, reference: order.order_no, debit: 0, credit: remainingCost, source: "Sales Fulfillment", status: "Posted" });
  }
  await supabase.from("general_ledger").delete().eq("reference", order.order_no).eq("source", "Sales Fulfillment");
  if (rows.length) await upsertMany("general_ledger", rows, "id");
}

async function deleteSalesOrder(orderNo) {
  if (!confirm("Delete this sales order and its lines?")) return;
  const order = currentRows.find((row) => row.order_no === orderNo);
  if (order?.id) await supabase.from("sales_order_lines").delete().eq("order_id", order.id);
  const { error } = await supabase.from("sales_orders").delete().eq("order_no", orderNo);
  if (error) alert(error.message);
  renderSalesOrdersView();
}

async function issueSalesOrder(orderNo) {
  const order = currentRows.find((row) => row.order_no === orderNo);
  if (!order) return;
  if (String(order.status || "").toLowerCase() === "quotation") {
    alert("Quotation cannot be issued. Change the status first.");
    return;
  }
  const shortage = (order._lines || []).find((line) => {
    const product = (productMeta.products || []).find((p) => p.sku === line.sku);
    return !product || Number(line.qty || 0) > Number(product.qty || 0);
  });
  if (shortage) {
    const product = (productMeta.products || []).find((p) => p.sku === shortage.sku);
    alert(`Cannot issue sale. ${shortage.product_name || shortage.sku} has only ${product?.qty || 0} received units available.`);
    return;
  }
  try {
    const { data: existingSalesEntries, error: existingSalesError } = await supabase.from("general_ledger").select("id").eq("reference", order.order_no).eq("source", "Sales Order");
    if (existingSalesError) throw existingSalesError;
    if (!(existingSalesEntries || []).length) {
      await syncSalesOrderInitialAccounting({ ...order, status: "Approved", payment_mode: order.payment_mode || "PO" }, order._lines || [], productMeta.products || [], { forceAvailable: true });
    }
    for (const line of order._lines || []) {
      const product = (productMeta.products || []).find((p) => p.sku === line.sku);
      const qty = Number(line.qty || 0);
      const unitCost = Number(product?.cost || 0);
      await supabase.from("products").update({ qty: Number(product.qty || 0) - qty }).eq("id", product.id);
      await upsertOne("stock_movements", {
        reference_no: `SM-${order.order_no}-${line.sku}`,
        movement_date: today(),
        type: "Sale Issue",
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        vendor: product.source_vendor,
        sold_to: order.customer,
        sold_date: order.order_date,
        qty: -qty,
        from_warehouse: product.warehouse,
        unit_fifo_cost: unitCost,
        total_fifo_cost: qty * unitCost,
        document_no: order.order_no,
        entered_by: profile?.full_name || profile?.username || "Owner",
        reason: `Order ${order.order_no}`,
      }, "reference_no");
    }
    await supabase.from("sales_orders").update({ status: "Fulfilled" }).eq("id", order.id);
    await postSalesOrderFulfillmentAccounting({ ...order, status: "Fulfilled" }, order._lines || [], productMeta.products || []);
    await invoiceSalesOrder(orderNo, true);
    renderSalesOrdersView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function invoiceSalesOrder(orderNo, silent = false) {
  const order = currentRows.find((row) => row.order_no === orderNo);
  if (!order) return;
  if (order.invoice_no) {
    if (!silent) alert(`Already invoiced as ${order.invoice_no}.`);
    return;
  }
  const shortage = (order._lines || []).find((line) => {
    const product = (productMeta.products || []).find((p) => p.sku === line.sku);
    return String(order.status || "").toLowerCase() !== "fulfilled" && (!product || Number(line.qty || 0) > Number(product.qty || 0));
  });
  if (shortage) {
    alert("Invoice is blocked until goods are issued or enough stock is available.");
    return;
  }
  try {
    const invoiceNo = await nextInvoiceNoByType("Parts Sales");
    const invoice = await upsertOne("invoices", {
      invoice_no: invoiceNo,
      invoice_date: today(),
      due_date: today(),
      customer: order.customer,
      type: "Parts Sales",
      source_ref: order.order_no,
      status: "Open",
      notes: `Sales order invoice ${order.order_no}`,
    }, "invoice_no");
    await upsertMany("invoice_lines", (order._lines || []).map((line) => ({
      invoice_id: invoice.id,
      description: `${line.sku} - ${line.product_name || ""}`,
      unit: (productMeta.products || []).find((p) => p.sku === line.sku)?.unit || line.unit || "",
      qty: Number(line.qty || 0),
      rate: Number(line.price || 0),
    })), "id");
    await supabase.from("sales_orders").update({ invoice_no: invoiceNo, status: "Fulfilled" }).eq("id", order.id);
    if (!silent) alert(`Invoice ${invoiceNo} created.`);
    if (!silent) renderSalesOrdersView();
  } catch (error) {
    alert(error.message || error);
  }
}

function printSalesOrder(orderNo) {
  const order = currentRows.find((row) => row.order_no === orderNo);
  if (!order) return;
  const title = String(order.status || "").toLowerCase() === "quotation" ? "Sales Quote" : "Sales Order";
  const html = printableDocumentHtml({
    title,
    number: order.order_no,
    date: order.order_date,
    partyLabel: "Customer",
    partyName: order.customer,
    meta: [["Customer PO #", order.customer_po || ""], ["Payment Mode", order.payment_mode || "PO"], ["Manager Override", order.manager_override ? "Yes" : "No"], ["Override By", order.override_by || ""], ["Status", order.status || ""]],
    heads: ["SKU", "Item", "Qty", "Unit Price", "Amount"],
    lines: (order._lines || []).map((line) => [line.sku, line.product_name || "", line.qty, money(line.price), money(Number(line.qty || 0) * Number(line.price || 0))]),
    total: salesOrderTotal(order),
    notes: order.notes || "",
  });
  openPrintWindow(html, order.order_no);
}

function exportSalesOrdersCsv() {
  const heads = ["Order", "Customer", "Customer PO", "Payment Mode", "Date", "Status", "Lines", "Total", "Invoice"];
  const rows = [heads, ...currentRows.map((order) => [order.order_no, order.customer, order.customer_po || "", order.payment_mode || "PO", order.order_date, order.status, (order._lines || []).length, salesOrderTotal(order), order.invoice_no || ""])];
  downloadCsv(rows, "sales-orders.csv");
}

async function renderRentalsView() {
  currentCfg = tableMap.rentals;
  $("viewTitle").textContent = "Rentals";
  $("viewSub").textContent = "Track rented vehicles, equipment, inventory items, dates, deposits, returns, and billing.";
  const [rentals, customers, assets, products] = await Promise.all([getAll("rentals"), getAll("customers"), getAll("assets"), getAll("products")]);
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  productMeta.customerRows = customers;
  productMeta.assets = assets;
  productMeta.products = products;
  currentRows = rentals.sort((a, b) => String(b.start_date || "").localeCompare(String(a.start_date || "")));
  $("content").innerHTML = `
    <div class="toolbar"><input class="searchbox" id="rentalSearch" placeholder="Search rentals by rental number, customer, item, date, status"></div>
    <div class="stats">
      ${statCard("Rental Records", currentRows.length, "All rental activity")}
      ${statCard("Currently Out", currentRows.filter((r) => /out|reserved/i.test(r.status || "")).length, "Open or reserved")}
      ${statCard("Rental Revenue", money(currentRows.reduce((s, r) => s + rentalTotal(r), 0)), "All logged rentals")}
      ${statCard("Deposits", money(currentRows.reduce((s, r) => s + Number(r.deposit || 0), 0)), "Deposit exposure")}
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Rentals</strong><span>Check out assets or inventory items, track returns, deposits, and rental income</span></div><div class="actions"><button id="rentalCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newRentalBtn">New rental</button></div></div>
      <div id="rentalTableHost">${rentalTableHtml(currentRows)}</div>
    </section>`;
  $("rentalSearch").oninput = renderFilteredRentals;
  $("rentalCsvBtn").onclick = exportRentalsCsv;
  $("newRentalBtn").onclick = () => openRentalModal();
  bindRentalRows();
}

function statCard(label, value, note) {
  return stat(label, value, note);
}

function renderFilteredRentals() {
  const q = $("rentalSearch").value.toLowerCase();
  const rows = currentRows.filter((r) => !q || [Object.values(r).join(" "), rentalItemName(r)].join(" ").toLowerCase().includes(q));
  $("rentalTableHost").innerHTML = rentalTableHtml(rows);
  bindRentalRows();
}

function rentalTableHtml(rows) {
  const heads = ["Rental", "Customer", "Customer PO", "Item", "Start", "End", "Rate", "Deposit", "Status", "Total", "Invoice", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(rentalRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No rentals yet.</td></tr>`}</tbody></table></div>`;
}

function rentalRowHtml(r) {
  return `<tr>
    <td>${esc(r.rental_no)}</td>
    <td>${esc(r.customer || "")}</td>
    <td>${r.customer_po ? badge(r.customer_po) : r.manager_override ? badge(`Override: ${r.override_by || "Manager"}`) : badge("PO Required")}</td>
    <td>${esc(rentalItemName(r))}</td>
    <td>${esc(r.start_date || "")}</td>
    <td>${esc(r.end_date || "")}</td>
    <td>${money(r.rate)} / ${esc(r.rate_type || "")}</td>
    <td>${money(r.deposit)}</td>
    <td>${badge(r.status || "Reserved")}</td>
    <td>${money(rentalTotal(r))}</td>
    <td>${esc(r.invoice_no || "")}</td>
    <td><div class="rowactions"><button class="rowbtn" type="button" data-rental-invoice="${esc(r.rental_no)}">Inv</button><button class="rowbtn" type="button" data-rental-return="${esc(r.rental_no)}">Return</button><button class="rowbtn" type="button" data-rental-edit="${esc(r.rental_no)}">Edit</button><button class="rowbtn danger" type="button" data-rental-delete="${esc(r.rental_no)}">Delete</button></div></td>
  </tr>`;
}

function rentalItemName(r) {
  if (r.item_type === "Product") {
    const p = (productMeta.products || []).find((item) => item.id === r.item_id || item.sku === r.item_ref);
    return p ? `${p.sku} - ${p.name}` : r.item_ref || "";
  }
  const a = (productMeta.assets || []).find((item) => item.id === r.item_id || item.asset_tag === r.item_ref);
  return a ? `${a.asset_tag} - ${a.name}` : r.item_ref || "";
}

function rentalDays(r) {
  const start = new Date(r.start_date || today());
  const end = new Date(r.end_date || today());
  const diff = Math.ceil((end - start) / 86400000) + 1;
  return Math.max(1, Number.isFinite(diff) ? diff : 1);
}

function rentalTotal(r) {
  return rentalDays(r) * Number(r.rate || 0);
}

function bindRentalRows() {
  document.querySelectorAll("[data-rental-edit]").forEach((b) => b.onclick = () => openRentalModal(currentRows.find((r) => r.rental_no === b.dataset.rentalEdit)));
  document.querySelectorAll("[data-rental-delete]").forEach((b) => b.onclick = () => deleteCustomRow("rentals", "rental_no", b.dataset.rentalDelete, renderRentalsView));
  document.querySelectorAll("[data-rental-return]").forEach((b) => b.onclick = () => returnRental(b.dataset.rentalReturn));
  document.querySelectorAll("[data-rental-invoice]").forEach((b) => b.onclick = () => invoiceRental(b.dataset.rentalInvoice));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function openRentalModal(rental = null) {
  editing = rental;
  const rentalNo = rental?.rental_no || await nextRefPreview("rental", "R-", "rentals", "rental_no");
  $("modalTitle").textContent = rental ? `Edit rental ${rental.rental_no}` : "New rental";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Rental #", "rental_no", rentalNo)}
      ${productSelect("Customer", "customer", productMeta.customers || [], rental?.customer || "", "New customer")}
      ${productInput("Customer PO #", "customer_po", rental?.customer_po || "")}
      ${productSelect("Manager override", "manager_override", ["No", "Yes"], rental?.manager_override ? "Yes" : "No")}
      ${productInput("Override by", "override_by", rental?.override_by || "")}
      ${productSelect("Item type", "item_type", ["Asset", "Product"], rental?.item_type || "Asset")}
      ${rentalItemLookupField(rental)}
      ${productInput("Start date", "start_date", rental?.start_date || today(), "date")}
      ${productInput("End date", "end_date", rental?.end_date || "", "date")}
      ${productSelect("Invoice timing", "invoice_timing", ["At start", "At return", "Manual"], rental?.invoice_timing || "At start")}
      ${productSelect("Rate type", "rate_type", ["Daily", "Weekly", "Monthly", "Flat"], rental?.rate_type || "Daily")}
      ${productInput("Rate", "rate", rental?.rate ?? 0, "number")}
      ${productInput("Deposit", "deposit", rental?.deposit ?? 0, "number")}
      ${productSelect("Status", "status", ["Reserved", "Out", "Returned", "Invoiced", "Cancelled"], rental?.status || "Reserved")}
      ${productInput("Checkout reading", "checkout_reading", rental?.checkout_reading || "")}
      ${productInput("Return reading", "return_reading", rental?.return_reading || "")}
      ${productInput("Invoice #", "invoice_no", rental?.invoice_no || "")}
      <div class="field wide"><label>Override reason</label><textarea data-product-field="override_reason">${esc(rental?.override_reason || "")}</textarea></div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(rental?.notes || "")}</textarea></div>
    </div>
    <p class="notice">Customer PO # is required for rentals unless a manager override is completed with override by and reason.</p>`;
  $("modalSave").onclick = saveRentalModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateCustomerInOpenModal());
}

function rentalItemLookupField(rental = null) {
  const options = [
    ...(productMeta.assets || []).map((a) => `${a.asset_tag} - ${a.name} | ${a.make || ""} ${a.model || ""}`.trim()),
    ...(productMeta.products || []).map((p) => `${p.sku} - ${p.name} | on hand ${p.qty || 0}`),
  ];
  const value = rental?.item_ref || rentalItemName(rental || {});
  return `<div class="field"><label>Item search</label><input class="suggest-input" list="rentalItemOptions" data-product-field="item_lookup" value="${esc(value || "")}" placeholder="Search asset tag, product SKU, name" autocomplete="off"><datalist id="rentalItemOptions">${options.map((o) => `<option value="${esc(o)}"></option>`).join("")}</datalist></div>`;
}

function resolveRentalItem(type, value) {
  const q = String(value || "").toLowerCase();
  if (type === "Product") return (productMeta.products || []).find((p) => q.includes(String(p.sku || "").toLowerCase()) || q.includes(String(p.name || "").toLowerCase()));
  return (productMeta.assets || []).find((a) => q.includes(String(a.asset_tag || "").toLowerCase()) || q.includes(String(a.name || "").toLowerCase()));
}

async function saveRentalModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  const item = resolveRentalItem(record.item_type || "Asset", record.item_lookup || "");
  record.manager_override = String(record.manager_override || "").toLowerCase() === "yes";
  record.item_id = item?.id || null;
  record.item_ref = record.item_type === "Product" ? item?.sku || record.item_lookup : item?.asset_tag || record.item_lookup;
  delete record.item_lookup;
  ["rate", "deposit"].forEach((k) => record[k] = Number(record[k] || 0));
  if (!record.rental_no || !record.customer || !record.item_type || !record.item_ref || !record.start_date) {
    alert("Rental #, customer, item type, item, and start date are required.");
    return;
  }
  if (!record.customer_po && !(record.manager_override && record.override_by && record.override_reason)) {
    alert("Customer PO # is required for rentals unless manager override, override by, and override reason are completed.");
    return;
  }
  try {
    const wasNew = !editing;
    await upsertOne("rentals", record, "rental_no");
    if (wasNew) await incrementSequence("rental");
    closeModal();
    renderRentalsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function returnRental(rentalNo) {
  const rental = currentRows.find((r) => r.rental_no === rentalNo);
  if (!rental) return;
  const reading = prompt("Return reading / condition", rental.return_reading || "");
  if (reading === null) return;
  const { error } = await supabase.from("rentals").update({ end_date: rental.end_date || today(), return_reading: reading, status: "Returned" }).eq("id", rental.id);
  if (error) alert(error.message);
  renderRentalsView();
}

async function invoiceRental(rentalNo) {
  const rental = currentRows.find((r) => r.rental_no === rentalNo);
  if (!rental) return;
  if (rental.invoice_no) {
    alert(`Already invoiced as ${rental.invoice_no}.`);
    return;
  }
  try {
    const invoiceNo = await createCustomerInvoice({
      customer: rental.customer,
      type: "Equipment Rental",
      source_ref: rental.rental_no,
      invoice_date: rental.start_date || today(),
      due_date: rental.end_date || rental.start_date || today(),
      notes: `Deposit: ${money(rental.deposit)}. ${rental.notes || ""}`.trim(),
      lines: [{ description: `${rentalItemName(rental)} rental (${rental.rate_type})`, unit: rental.rate_type || "Rental", qty: rentalDays(rental), rate: Number(rental.rate || 0) }],
    });
    await supabase.from("rentals").update({ invoice_no: invoiceNo, status: "Invoiced" }).eq("id", rental.id);
    alert(`Invoice ${invoiceNo} created.`);
    renderRentalsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function exportRentalsCsv() {
  const heads = ["Rental", "Customer", "Customer PO", "Override", "Override By", "Item Type", "Item", "Start", "End", "Invoice Timing", "Rate Type", "Rate", "Deposit", "Status", "Invoice", "Total"];
  downloadCsv([heads, ...currentRows.map((r) => [r.rental_no, r.customer, r.customer_po, r.manager_override ? "Yes" : "No", r.override_by, r.item_type, rentalItemName(r), r.start_date, r.end_date, r.invoice_timing, r.rate_type, r.rate, r.deposit, r.status, r.invoice_no, rentalTotal(r)])], "rentals.csv");
}

async function renderRepairsView() {
  currentCfg = tableMap.repairs;
  $("viewTitle").textContent = "Repairs";
  $("viewSub").textContent = "Work orders, mechanic time, issue details, parts, labor, and billing.";
  const [workOrders, issues, parts, labor, assets, mechanics, customers, products, stockMovements] = await Promise.all([
    getAll("work_orders"),
    getAll("work_order_issues"),
    getAll("work_order_parts"),
    getAll("work_order_labor"),
    getAll("assets"),
    getAll("mechanics"),
    getAll("customers"),
    getAll("products"),
    getAll("stock_movements"),
  ]);
  productMeta.assets = assets;
  productMeta.mechanicsRows = mechanics;
  productMeta.mechanics = mechanics.map((m) => m.name).filter(Boolean).sort();
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  productMeta.products = products.sort((a, b) => String(a.sku || "").localeCompare(String(b.sku || "")));
  currentRows = workOrders.sort((a, b) => String(b.wo_date || "").localeCompare(String(a.wo_date || "")));
  currentRows.forEach((wo) => {
    wo._issues = issues.filter((row) => row.wo_id === wo.id);
    wo._parts = parts.filter((row) => row.wo_id === wo.id);
    wo._labor = labor.filter((row) => row.wo_id === wo.id);
    wo._stockMovements = stockMovements.filter((row) => row.document_no === wo.wo_no);
  });
  if (isMechanicUser()) return renderMechanicRepairPortal();
  const openRows = repairRowsByTab("open");
  $("content").innerHTML = `
    <div class="stats">
      ${statCard("Open WO", openRows.length, "Still active")}
      ${statCard("Ready to Close", repairRowsByTab("ready").length, "Mechanic flagged")}
      ${statCard("Closed Not Invoiced", repairRowsByTab("closed").length, "Ready for billing")}
      ${statCard("Invoiced WO", repairRowsByTab("invoiced").length, "Locked unless reversed")}
    </div>
    <div class="toolbar"><input class="searchbox" id="repairSearch" placeholder="Search repairs by WO, asset, mechanic, customer PO, status, issue"></div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Repair & Service History</strong><span>Work orders with mechanic time, inventory parts, labor, and next service</span></div><div class="actions"><button id="repairCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newWoBtn">New work order</button></div></div>
      <div class="tabbar"><button class="tabbtn active" data-repair-tab="open">Open WO ${openRows.length}</button><button class="tabbtn" data-repair-tab="ready">Ready to Close ${repairRowsByTab("ready").length}</button><button class="tabbtn" data-repair-tab="closed">Closed Not Invoiced ${repairRowsByTab("closed").length}</button><button class="tabbtn" data-repair-tab="invoiced">Invoiced WO ${repairRowsByTab("invoiced").length}</button></div>
      <div id="repairTableHost">${repairTableHtml(openRows)}</div>
    </section>`;
  $("repairSearch").oninput = renderFilteredRepairs;
  $("repairCsvBtn").onclick = exportCurrentCsv;
  $("newWoBtn").onclick = () => openNewWorkOrderModal();
  document.querySelectorAll("[data-repair-tab]").forEach((b) => b.onclick = () => {
    document.querySelectorAll("[data-repair-tab]").forEach((x) => x.classList.toggle("active", x === b));
    $("repairTableHost").dataset.tab = b.dataset.repairTab;
    renderFilteredRepairs();
  });
  $("repairTableHost").dataset.tab = "open";
  bindRepairRows();
}

function repairRowsByTab(tab) {
  if (tab === "invoiced") return currentRows.filter((wo) => wo.invoice_no || /invoiced/i.test(wo.status || ""));
  if (tab === "ready") return currentRows.filter((wo) => !wo.invoice_no && /ready to close/i.test(wo.status || ""));
  if (tab === "closed") return currentRows.filter((wo) => !wo.invoice_no && /closed|complete/i.test(wo.status || ""));
  return currentRows.filter((wo) => !wo.invoice_no && !/ready to close|closed|complete|invoiced|cancel/i.test(wo.status || ""));
}

function renderFilteredRepairs() {
  const tab = $("repairTableHost")?.dataset.tab || "open";
  const q = ($("repairSearch")?.value || "").toLowerCase();
  const rows = repairRowsByTab(tab).filter((wo) => !q || [
    Object.values(wo).join(" "),
    (wo._issues || []).map((i) => `${i.issue} ${i.assigned_mechanic} ${i.work_notes}`).join(" "),
    (wo._parts || []).map((p) => `${p.sku} ${p.product_name}`).join(" "),
    (wo._labor || []).map((l) => `${l.mechanic} ${l.issue} ${l.work_done}`).join(" "),
  ].join(" ").toLowerCase().includes(q));
  $("repairTableHost").innerHTML = repairTableHtml(rows);
  bindRepairRows();
}

function repairTableHtml(rows) {
  const heads = ["WO #", "Date", "Asset", "Priority", "Issues", "Customer PO", "Mechanic", "Type", "Parts", "Labor", "Total", "Status", "Invoice", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(repairRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No work orders in this tab.</td></tr>`}</tbody></table></div>`;
}

function repairRowHtml(wo) {
  const mechanics = [...new Set((wo._labor || []).map((l) => l.mechanic).filter(Boolean))].join(", ");
  const locked = wo.invoice_no || /invoiced/i.test(wo.status || "");
  const canClose = !locked && !/closed|complete|cancel/i.test(wo.status || "");
  return `<tr>
    <td>${esc(wo.wo_no)}</td><td>${esc(wo.wo_date || "")}</td><td>${esc(wo.asset_tag || "")}</td><td>${badge(wo.priority || "Medium")}</td>
    <td>${esc((wo._issues || []).map((i) => i.issue).filter(Boolean).join("; ") || wo.description || "")}</td>
    <td>${wo.customer_po ? badge(wo.customer_po) : wo.manager_override ? badge(`Override: ${wo.override_by || "Manager"}`) : ""}</td>
    <td>${esc(mechanics || "")}</td><td>${esc(wo.work_type || "")}</td><td>${money(repairPartsTotal(wo))}</td><td>${repairLaborHours(wo).toFixed(2)} hr<br>${money(repairLaborTotal(wo))}</td><td>${money(repairTotal(wo))}</td><td>${badge(wo.status || "Open")}</td><td>${esc(wo.invoice_no || "")}</td>
    <td><div class="rowactions">${locked ? "" : `<button class="rowbtn" type="button" data-wo-time="${esc(wo.wo_no)}">Time</button><button class="rowbtn" type="button" data-wo-edit="${esc(wo.wo_no)}">Edit</button>${canClose ? `<button class="rowbtn" type="button" data-wo-close="${esc(wo.wo_no)}">Close</button>` : ""}`}<button class="rowbtn" type="button" data-wo-invoice="${esc(wo.wo_no)}">Inv</button></div></td>
  </tr>`;
}

function bindRepairRows() {
  document.querySelectorAll("[data-wo-time]").forEach((b) => b.onclick = () => openMechanicTimeModal(currentRows.find((wo) => wo.wo_no === b.dataset.woTime)));
  document.querySelectorAll("[data-wo-edit]").forEach((b) => b.onclick = () => openWorkOrderEditModal(currentRows.find((wo) => wo.wo_no === b.dataset.woEdit)));
  document.querySelectorAll("[data-wo-close]").forEach((b) => b.onclick = () => closeWorkOrder(b.dataset.woClose));
  document.querySelectorAll("[data-wo-invoice]").forEach((b) => b.onclick = () => invoiceWorkOrder(b.dataset.woInvoice));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function currentMechanicName() {
  const email = String(profile?.email || session?.user?.email || "").toLowerCase();
  const username = String(profile?.username || "").toLowerCase();
  const fullName = String(profile?.full_name || "").toLowerCase();
  const row = (productMeta.mechanicsRows || []).find((m) => [m.email, m.name, m.reference].some((v) => String(v || "").toLowerCase() === email || String(v || "").toLowerCase() === username || String(v || "").toLowerCase() === fullName));
  return row?.name || profile?.full_name || profile?.username || session?.user?.email || "Mechanic";
}

function mechanicVisibleWorkOrders(mechanic) {
  const name = String(mechanic || "").toLowerCase();
  const active = currentRows.find((wo) => (wo._labor || []).some((l) => String(l.mechanic || "").toLowerCase() === name && l.clock_in && !l.clock_out));
  if (active && mechanicWorkOrderOpenForPortal(active)) return [active];
  const rows = currentRows.filter((wo) => {
    if (!mechanicWorkOrderOpenForPortal(wo)) return false;
    const assigned = (wo._issues || []).some((i) => String(i.assigned_mechanic || "").toLowerCase() === name);
    const hasLabor = (wo._labor || []).some((l) => String(l.mechanic || "").toLowerCase() === name);
    return assigned || hasLabor;
  });
  if (active && mechanicWorkOrderOpenForPortal(active) && !rows.some((wo) => wo.id === active.id)) rows.unshift(active);
  return rows;
}

function mechanicWorkOrderOpenForPortal(wo) {
  if (!wo || wo.invoice_no) return false;
  return !/ready to close|closed|complete|invoiced|cancel/i.test(wo.status || "");
}

function renderMechanicRepairPortal() {
  const mechanic = currentMechanicName();
  const active = activeLaborForMechanic(mechanic);
  const rows = mechanicVisibleWorkOrders(mechanic);
  currentCfg = { title: "Mechanic Work Orders", sub: "Clock in and out of assigned work only." };
  $("viewTitle").textContent = "My Work Orders";
  $("viewSub").textContent = "Clock in, clock out, and add the work note.";
  $("content").innerHTML = `
    <section class="mechanic-portal">
      <div class="mechanic-hero">
        <div>
          <span>Mechanic</span>
          <strong>${esc(mechanic)}</strong>
          <small>${active ? `Still logged in on ${esc(active._wo?.wo_no || "")} since ${formatDateTime(active.clock_in)}` : "Not currently clocked in"}</small>
        </div>
        <button id="mechanicRefreshBtn">Refresh</button>
      </div>
      ${active ? `<div class="mechanic-active">You are still clocked in on <strong>${esc(active._wo?.wo_no || "")}</strong>. Clock out there before starting another work order.</div>` : ""}
      <div class="mechanic-search-wrap"><input class="searchbox" id="mechanicWoSearch" placeholder="Search WO, asset, issue, status, part"></div>
      ${productOptionsDatalist()}
      <div class="mechanic-card-list">
        ${rows.length ? rows.map((wo) => mechanicWorkOrderCard(wo, mechanic, active)).join("") : `<div class="panel"><div class="empty">No open work orders assigned right now.</div></div>`}
      </div>
    </section>`;
  $("mechanicRefreshBtn").onclick = () => renderRepairsView();
  $("mechanicWoSearch").oninput = () => filterMechanicWorkOrders(rows, mechanic, active);
  bindMechanicPortalActions();
}

function filterMechanicWorkOrders(rows, mechanic, active) {
  const q = ($("mechanicWoSearch")?.value || "").toLowerCase();
  const filtered = rows.filter((wo) => !q || [
    wo.wo_no,
    wo.asset_tag,
    wo.status,
    wo.priority,
    wo.work_type,
    wo.description,
    (wo._issues || []).map((i) => `${i.issue} ${i.status} ${i.work_notes}`).join(" "),
    (wo._parts || []).map((p) => `${p.sku} ${p.product_name} ${p.status} ${p.availability}`).join(" "),
    (wo._labor || []).map((l) => `${l.mechanic} ${l.issue} ${l.work_done}`).join(" "),
  ].join(" ").toLowerCase().includes(q));
  document.querySelector(".mechanic-card-list").innerHTML = filtered.length
    ? filtered.map((wo) => mechanicWorkOrderCard(wo, mechanic, active)).join("")
    : `<div class="panel"><div class="empty">No work orders match your search.</div></div>`;
  bindMechanicPortalActions();
}

function bindMechanicPortalActions() {
  document.querySelectorAll("[data-mech-clock-in]").forEach((b) => b.onclick = () => mechanicQuickClockIn(b.dataset.mechClockIn));
  document.querySelectorAll("[data-mech-clock-out]").forEach((b) => b.onclick = () => mechanicQuickClockOut(b.dataset.mechClockOut));
  document.querySelectorAll("[data-mech-request-parts]").forEach((b) => b.onclick = () => mechanicQuickRequestParts(b.dataset.mechRequestParts));
  document.querySelectorAll("[data-mech-ask-help]").forEach((b) => b.onclick = () => mechanicPortalAskHelp(b.dataset.mechAskHelp));
  document.querySelectorAll("[data-mech-accept-full]").forEach((b) => b.onclick = () => mechanicPortalAcceptPart(b.dataset.mechAcceptFull, "full"));
  document.querySelectorAll("[data-mech-accept-partial]").forEach((b) => b.onclick = () => mechanicPortalAcceptPart(b.dataset.mechAcceptPartial, "partial"));
  document.querySelectorAll("[data-mech-release-part]").forEach((b) => b.onclick = () => mechanicPortalReleasePart(b.dataset.mechReleasePart));
  document.querySelectorAll("[data-mech-ready-close]").forEach((b) => b.onclick = () => mechanicPortalReadyToClose(b.dataset.mechReadyClose));
}

function mechanicWorkOrderCard(wo, mechanic, active) {
  const isActiveHere = active?._wo?.id === wo.id;
  const blockedByOther = active && !isActiveHere;
  const issues = (wo._issues || []).length ? wo._issues : [{ issue: wo.description || "General work order", status: wo.status || "Open" }];
  const issueOptions = issues.map((i) => i.issue).filter(Boolean);
  const partsRows = wo._parts || [];
  const laborRows = wo._labor || [];
  const acceptRows = mechanicPortalAcceptRows(wo);
  return `<article class="mechanic-card ${isActiveHere ? "active" : ""}">
    <div class="mechanic-card-head">
      <div><strong>${esc(wo.wo_no)}</strong><span>${esc(wo.asset_tag || "No asset")} ${wo.priority ? `- ${esc(wo.priority)}` : ""}</span></div>
      ${badge(wo.status || "Open")}
    </div>
    <div class="mechanic-card-body">
      <div class="mechanic-lines">
        ${issues.map((i) => `<div><b>${esc(i.issue || "General work order")}</b><small>${esc(i.status || "Open")}${i.work_notes ? ` - ${esc(i.work_notes)}` : ""}</small></div>`).join("")}
      </div>
      <details class="mechanic-detail" open>
        <summary>Parts history</summary>
        ${partsRows.length ? partsRows.map((p) => `<div><b>${esc(partDisplayName(p))}</b><small>Needed ${esc(p.qty_needed ?? "")} | Accepted ${esc(p.accepted_qty ?? 0)} | ${esc(effectivePartStatus(p))} | ${esc(p.availability || "")}</small></div>`).join("") : `<small>No parts requested yet.</small>`}
      </details>
      <details class="mechanic-detail" open>
        <summary>Accept or release reserved parts</summary>
        ${acceptRows.length ? `<div class="mechanic-accept-list">${acceptRows.map((p) => mechanicPortalAcceptRow(p)).join("")}</div>` : `<small>No reserved parts waiting for acceptance.</small>`}
      </details>
      <details class="mechanic-detail">
        <summary>Labor history</summary>
        ${laborRows.length ? laborRows.map((l) => `<div><b>${esc(l.mechanic || "")} - ${esc(l.issue || "General work order")}</b><small>${formatDateTime(l.clock_in)} ${l.clock_out ? `to ${formatDateTime(l.clock_out)} (${laborHours(l).toFixed(2)} hr)` : "- still clocked in"}${l.work_done ? ` | ${esc(l.work_done)}` : ""}</small></div>`).join("") : `<small>No labor entries yet.</small>`}
      </details>
      <label class="mechanic-label">Issue worked on</label>
      <select data-mech-issue="${esc(wo.wo_no)}">${(issueOptions.length ? issueOptions : ["General work order"]).map((i) => `<option value="${esc(i)}">${esc(i)}</option>`).join("")}</select>
      <div class="mechanic-request">
        <strong>Request parts</strong>
        <input class="suggest-input" list="poProductOptions" data-mech-part-lookup="${esc(wo.wo_no)}" placeholder="Search SKU, name, vendor, or leave blank" autocomplete="off">
        <input data-mech-part-desc="${esc(wo.wo_no)}" placeholder="Describe part needed if SKU is unknown">
        <div class="mechanic-request-row">
          <input type="number" step="0.01" min="0" data-mech-part-qty="${esc(wo.wo_no)}" placeholder="Qty needed">
          <button type="button" data-mech-request-parts="${esc(wo.wo_no)}">Request part</button>
        </div>
        <small>Known SKUs reserve available stock. Unknown or short parts go to Parts Requests for the parts team.</small>
      </div>
      <div class="mechanic-request">
        <strong>Ask mechanic help</strong>
        <select data-mech-helper="${esc(wo.wo_no)}">${["", ...(productMeta.mechanics || []).filter((name) => String(name || "").toLowerCase() !== String(mechanic || "").toLowerCase())].map((name) => `<option value="${esc(name)}">${esc(name || "Select helper mechanic")}</option>`).join("")}</select>
        <button type="button" data-mech-ask-help="${esc(wo.wo_no)}">Ask help</button>
        <small>The helper will see this work order when they log in and can clock in/out for their own hours.</small>
      </div>
      ${isActiveHere ? `<label class="mechanic-label">Work note for clock out</label><textarea data-mech-note="${esc(wo.wo_no)}" placeholder="What was completed?"></textarea>` : ""}
    </div>
    <div class="mechanic-card-actions">
      ${isActiveHere
        ? `<button class="primary" data-mech-clock-out="${esc(wo.wo_no)}">Clock out now</button>`
        : `<button class="primary" data-mech-clock-in="${esc(wo.wo_no)}" ${blockedByOther ? "disabled" : ""}>Clock in now</button>`}
      <button type="button" data-mech-ready-close="${esc(wo.wo_no)}" ${isActiveHere || blockedByOther ? "disabled" : ""}>Ready to close</button>
      ${blockedByOther ? `<small>Clock out from ${esc(active._wo?.wo_no || "current WO")} first.</small>` : ""}
      ${isActiveHere ? `<small>Clock out before marking ready to close.</small>` : ""}
    </div>
  </article>`;
}

function mechanicPortalAcceptRows(wo) {
  return (wo._parts || []).filter((part) => {
    if (remainingReservedQty(part) <= 0) return false;
    if (/released|removed|cancelled/i.test(effectivePartStatus(part))) return false;
    return true;
  });
}

function mechanicPortalAcceptRow(part) {
  const product = (productMeta.products || []).find((p) => p.id === part.product_id || p.sku === part.sku) || {};
  const remaining = remainingReservedQty(part);
  const skuMissing = !part.product_id || !part.sku || /^TBD$/i.test(part.sku || "");
  return `<div class="mechanic-accept-row">
    <div>
      <b>${esc(partDisplayName(part))}</b>
      <small>Issue: ${esc(part.issue || "General")} | Remaining ${esc(remaining)} | On hand ${esc(product.qty ?? 0)} | ${esc(effectivePartStatus(part))}</small>
      ${skuMissing ? `<small>Parts team must fill the SKU before accepting.</small>` : ""}
    </div>
    <div class="mechanic-accept-actions">
      <input type="number" min="0" max="${esc(remaining)}" step="0.01" data-mech-accept-qty="${esc(part.id || "")}" placeholder="Qty">
      <button type="button" data-mech-accept-partial="${esc(part.id || "")}" ${skuMissing ? "disabled" : ""}>Accept qty</button>
      <button type="button" data-mech-accept-full="${esc(part.id || "")}" ${skuMissing ? "disabled" : ""}>Accept full</button>
      <button type="button" data-mech-release-part="${esc(part.id || "")}">Release</button>
    </div>
  </div>`;
}

async function mechanicQuickRequestParts(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  const key = CSS.escape(woNo);
  const mechanic = currentMechanicName();
  const lookup = document.querySelector(`[data-mech-part-lookup="${key}"]`)?.value || "";
  const description = document.querySelector(`[data-mech-part-desc="${key}"]`)?.value || "";
  const qty = Number(document.querySelector(`[data-mech-part-qty="${key}"]`)?.value || 0);
  const issue = document.querySelector(`[data-mech-issue="${key}"]`)?.value || "General work order";
  const product = resolveProductLookup(lookup);
  const partText = product ? partDisplayName(product) : description.trim();
  if (!wo) return;
  if (!partText) {
    alert("Search a part or describe the part needed.");
    return;
  }
  if (!(qty > 0)) {
    alert("Enter the quantity needed.");
    return;
  }
  const onHand = Number(product?.qty || 0);
  const shortage = product ? Math.max(0, qty - onHand) : qty;
  const status = product ? (shortage > 0 ? "Shortage" : "Reserved") : "Requested";
  const availability = product ? (shortage > 0 ? `Short ${shortage}` : "OK") : "Needs part number";
  try {
    await insertOne("work_order_parts", {
      wo_id: wo.id,
      issue,
      product_id: product?.id || null,
      sku: product?.sku || "TBD",
      product_name: product?.name || description.trim(),
      qty_needed: qty,
      accepted_qty: 0,
      unit_cost: Number(product?.cost || 0),
      status,
      availability,
      notes: `Requested by ${mechanic}${product ? "" : " - parts team to assign SKU"}`,
    }, "id");
    if (/shortage|requested/i.test(status)) {
      await supabase.from("work_orders").update({ status: "Waiting Parts" }).eq("id", wo.id);
    }
    alert("Part request saved.");
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function mechanicPortalAskHelp(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  const key = CSS.escape(woNo);
  const helper = document.querySelector(`[data-mech-helper="${key}"]`)?.value || "";
  const issue = document.querySelector(`[data-mech-issue="${key}"]`)?.value || "Helper requested";
  const primary = currentMechanicName();
  if (!wo) return;
  if (!helper) {
    alert("Choose the mechanic you want to ask for help.");
    return;
  }
  if (helper === primary) {
    alert("Choose a different mechanic as helper.");
    return;
  }
  const helperKey = String(helper || "").toLowerCase();
  const alreadyInvited = (wo._issues || []).some((i) => String(i.assigned_mechanic || "").toLowerCase() === helperKey)
    || (wo._labor || []).some((l) => String(l.mechanic || "").toLowerCase() === helperKey);
  if (alreadyInvited) {
    alert(`${helper} is already added to ${wo.wo_no}.`);
    return;
  }
  if (!confirm(`Ask ${helper} for help on ${wo.wo_no}?\n\nThey will see this work order when they log in, and they can clock themselves in.`)) return;
  try {
    await insertOne("work_order_issues", {
      wo_id: wo.id,
      issue_date: today(),
      issue,
      status: "Open",
      assigned_mechanic: helper,
      work_notes: `Asked by ${primary} to help on ${wo.wo_no}`,
    }, "id");
    alert(`${helper} can now see ${wo.wo_no} and clock in.`);
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function mechanicQuickClockIn(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  const mechanic = currentMechanicName();
  const issue = document.querySelector(`[data-mech-issue="${CSS.escape(woNo)}"]`)?.value || "General work order";
  if (!wo) return;
  const active = activeLaborForMechanic(mechanic);
  if (active && active._wo?.id !== wo.id) {
    alert(`${mechanic} is already clocked in on ${active._wo?.wo_no}. Clock out there first.`);
    return;
  }
  if (active && active._wo?.id === wo.id) {
    alert(`${mechanic} is already clocked in on ${wo.wo_no}.`);
    return;
  }
  if (!confirm(`Clock in now?\n\nMechanic: ${mechanic}\nWork order: ${wo.wo_no}\nTime: ${new Date().toLocaleString()}`)) return;
  try {
    await insertOne("work_order_labor", {
      wo_id: wo.id,
      mechanic,
      issue,
      clock_in: new Date().toISOString(),
      clock_out: null,
      hourly_rate: currentMechanicRate(mechanic),
      work_done: "",
    }, "id");
    await supabase.from("work_orders").update({ status: "In Progress" }).eq("id", wo.id);
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function mechanicQuickClockOut(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  const mechanic = currentMechanicName();
  const note = document.querySelector(`[data-mech-note="${CSS.escape(woNo)}"]`)?.value || "";
  if (!wo) return;
  const active = activeLaborForMechanic(mechanic);
  if (!active || active._wo?.id !== wo.id) {
    alert(`${mechanic} is not clocked in on ${wo.wo_no}.`);
    return;
  }
  const clockOut = promptClockOutTimeFromHours(active, new Date().toISOString());
  if (!clockOut) return;
  const hours = laborHours({ clock_in: active.clock_in, clock_out: clockOut });
  if (!confirm(`Confirm clock out?\n\nClock in: ${formatDateTime(active.clock_in)}\nClock out: ${new Date(clockOut).toLocaleString()}\nTotal: ${hours.toFixed(2)} hours`)) return;
  try {
    const { error } = await supabase.from("work_order_labor").update({ clock_out: clockOut, work_done: note || active.work_done || "" }).eq("id", active.id);
    if (error) throw error;
    if (note) await appendIssueWorkNote(wo, active.issue || "General work order", mechanic, note);
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function promptClockOutTimeFromHours(active, fallbackIso) {
  const currentHours = laborHours({ clock_in: active.clock_in, clock_out: fallbackIso });
  const typed = prompt(
    `Clock out time adjustment\n\nClock in: ${formatDateTime(active.clock_in)}\nCurrent time total: ${currentHours.toFixed(2)} hours\n\nIf the mechanic missed the right clock-out time, enter the actual hours worked. Leave blank to use the current time.`,
    ""
  );
  if (typed === null) return "";
  const value = typed.trim();
  if (!value) return fallbackIso;
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0) {
    alert("Enter a valid number of hours worked, like 2.5.");
    return "";
  }
  const adjusted = new Date(new Date(active.clock_in).getTime() + hours * 60 * 60 * 1000);
  if (adjusted > new Date()) {
    alert("The adjusted clock-out time cannot be later than the current time. Reduce the hours worked or leave it blank to use now.");
    return "";
  }
  return adjusted.toISOString();
}

function findMechanicPortalPart(partId) {
  for (const wo of currentRows) {
    const part = (wo._parts || []).find((row) => String(row.id) === String(partId));
    if (part) return { wo, part };
  }
  return {};
}

async function mechanicPortalAcceptPart(partId, mode) {
  const { wo, part } = findMechanicPortalPart(partId);
  if (!wo || !part) return;
  const product = (productMeta.products || []).find((p) => p.id === part.product_id || p.sku === part.sku);
  if (!product || !part.sku || /^TBD$/i.test(part.sku || "")) {
    alert("Parts team must assign the exact SKU before this part can be accepted.");
    return;
  }
  const remaining = remainingReservedQty(part);
  const qtyInput = document.querySelector(`[data-mech-accept-qty="${CSS.escape(String(partId))}"]`);
  const qty = mode === "full" ? remaining : Number(qtyInput?.value || 0);
  if (!(qty > 0)) {
    alert("Enter the quantity to accept.");
    return;
  }
  if (qty > remaining) {
    alert(`You can only accept up to ${remaining}.`);
    return;
  }
  const onHand = Number(product.qty || 0);
  if (qty > onHand) {
    alert(`Not enough stock. On hand is ${onHand}; requested acceptance is ${qty}.`);
    return;
  }
  if (!confirm(`Accept parts now?\n\nWork order: ${wo.wo_no}\nPart: ${partDisplayName(part)}\nQty: ${qty}\n\nThis will deduct the quantity from inventory.`)) return;
  try {
    const acceptedQty = Number(part.accepted_qty || 0) + qty;
    const fullAccepted = acceptedQty >= Number(part.qty_needed || 0);
    const unitCost = Number(part.unit_cost || product.cost || 0);
    const { error: partError } = await supabase.from("work_order_parts").update({
      accepted_qty: acceptedQty,
      unit_cost: unitCost,
      status: fullAccepted ? "Accepted" : "Partially Accepted",
      availability: "OK",
    }).eq("id", part.id);
    if (partError) throw partError;
    const { error: productError } = await supabase.from("products").update({ qty: onHand - qty }).eq("id", product.id);
    if (productError) throw productError;
    await insertOne("stock_movements", {
      reference_no: `SM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      movement_date: today(),
      type: "Repair",
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      vendor: product.source_vendor || "Internal",
      qty: -qty,
      from_warehouse: product.warehouse || null,
      unit_fifo_cost: unitCost,
      total_fifo_cost: qty * unitCost,
      document_no: wo.wo_no,
      entered_by: currentMechanicName(),
      reason: `${wo.wo_no} - ${part.issue || "Work order part"}`,
    });
    alert("Part accepted and inventory deducted.");
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function mechanicPortalReleasePart(partId) {
  const { wo, part } = findMechanicPortalPart(partId);
  if (!wo || !part) return;
  if (!confirm(`Release this reserved part?\n\nWork order: ${wo.wo_no}\nPart: ${partDisplayName(part)}\n\nUse this when the part is no longer needed.`)) return;
  try {
    const notes = [part.notes, `Released by ${currentMechanicName()} on ${new Date().toLocaleString()}`].filter(Boolean).join("\n");
    const { error } = await supabase.from("work_order_parts").update({ status: "Released", availability: "Released", notes }).eq("id", part.id);
    if (error) throw error;
    alert("Reserved part released.");
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function mechanicPortalReadyToClose(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  if (!wo) return;
  const activeLabor = (wo._labor || []).filter((labor) => labor.clock_in && !labor.clock_out);
  if (activeLabor.length) {
    alert(`Clock out active mechanic time before marking ready to close: ${activeLabor.map((l) => l.mechanic).join(", ")}.`);
    return;
  }
  const pendingParts = pendingWorkOrderParts(wo);
  if (pendingParts.length) {
    alert(`${wo.wo_no} still has ${pendingParts.length} part line(s) not accepted, completed, or released. Please finish the parts first.`);
    return;
  }
  if (!confirm(`Mark ${wo.wo_no} as Ready to Close?\n\nIt will be removed from the mechanic open list and sent to admin for closing/invoicing.`)) return;
  try {
    const note = `[Ready to Close ${new Date().toLocaleString()} by ${currentMechanicName()}]\n${workOrderSummaryText(wo)}`;
    const notes = [wo.notes, note].filter(Boolean).join("\n\n");
    const { error } = await supabase.from("work_orders").update({ status: "Ready to Close", notes }).eq("id", wo.id);
    if (error) throw error;
    alert(`${wo.wo_no} marked Ready to Close.`);
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function openNewWorkOrderModal(prefill = {}) {
  editing = null;
  const woNo = await nextRefPreview("wo", "WO-", "work_orders", "wo_no");
  const prefillAsset = prefill.assetTag ? (productMeta.assets || []).find((asset) => asset.asset_tag === prefill.assetTag) : null;
  const assetLookup = prefillAsset ? assetOptionLabel(prefillAsset) : "";
  $("modalTitle").textContent = `New work order ${woNo}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Work order #", "wo_no", woNo)}
      ${productInput("Date", "wo_date", today(), "date")}
      ${productSelect("Bill to customer", "bill_to_customer", productMeta.customers || [], "", "New customer")}
      ${productInput("Customer PO #", "customer_po", "")}
      ${productSelect("Manager override", "manager_override", ["No", "Yes"], "No")}
      ${productInput("Override by", "override_by", "")}
      <div class="field wide"><label>Asset search</label><input class="suggest-input" list="workOrderAssetOptions" data-product-field="asset_lookup" value="${esc(assetLookup)}" placeholder="Search asset tag, name, make, model, serial, plate, location" autocomplete="off">${assetOptionsDatalist()}</div>
      ${productSelect("Work type", "work_type", ["Repair", "Preventive Maintenance", "Breakdown", "Inspection", "Rental Checkout"], "Repair")}
      ${productSelect("Priority", "priority", ["Low", "Medium", "High"], "Medium")}
      ${productInput("Vendor / shop", "vendor_shop", "")}
      ${productInput("Odometer", "odometer", 0, "number")}
      ${productInput("Engine hours", "engine_hours", 0, "number")}
      ${productSelect("Status", "status", ["Open", "In Progress", "Waiting Parts", "Ready to Close", "Closed", "Complete", "Cancelled"], "Open")}
      ${productInput("Next due date", "next_due_date", "", "date")}
      ${productInput("Next due odometer", "next_due_odometer", 0, "number")}
      ${productInput("Next due hours", "next_due_hours", 0, "number")}
      <div class="field wide"><label>Description</label><textarea data-product-field="description" placeholder="Describe the work requested">${esc(prefill.description || "")}</textarea></div>
      <div class="field wide"><label>Override reason</label><textarea data-product-field="override_reason"></textarea></div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes"></textarea></div>
    </div>
    <section class="subpanel">
      <div class="panel-title"><strong>Equipment issues</strong><span>Add the starting issues for this work order. More rows can be added later from Mechanic Time.</span></div>
      ${newWorkOrderIssueTable(prefill.description || "")}
    </section>
    <p class="notice">After saving, use Mechanic Time to clock labor, reserve/accept parts, and mark ready to close.</p>`;
  $("modalSave").onclick = saveNewWorkOrderModal;
  $("modal").style.display = "flex";
  $("addNewWoIssueRowBtn").onclick = addNewWorkOrderIssueRow;
  const assetInput = document.querySelector('[data-product-field="asset_lookup"]');
  if (assetInput) assetInput.onchange = () => fillWorkOrderAssetReadings(assetInput.value);
  if (assetLookup) fillWorkOrderAssetReadings(assetLookup);
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateCustomerInOpenModal());
}

function assetOptionsDatalist() {
  const options = (productMeta.assets || []).map((a) => [a.asset_tag, a.name, [a.make, a.model].filter(Boolean).join(" "), a.vin_serial, a.plate, a.location, a.assigned_operator, a.status].filter(Boolean).join(" | "));
  return `<datalist id="workOrderAssetOptions">${options.map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
}

function resolveAssetLookup(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const key = text.split("|")[0].trim().toLowerCase();
  return (productMeta.assets || []).find((asset) => String(asset.asset_tag || "").toLowerCase() === key || text.toLowerCase().includes(String(asset.asset_tag || "").toLowerCase())) || null;
}

function fillWorkOrderAssetReadings(value) {
  const asset = resolveAssetLookup(value);
  if (!asset) return;
  const odometer = document.querySelector('[data-product-field="odometer"]');
  const hours = document.querySelector('[data-product-field="engine_hours"]');
  if (odometer && !Number(odometer.value || 0)) odometer.value = Number(asset.odometer || 0);
  if (hours && !Number(hours.value || 0)) hours.value = Number(asset.engine_hours || 0);
}

function newWorkOrderIssueTable(firstIssue = "") {
  const rows = Array.from({ length: 5 }, (_, index) => mechanicIssueEditRow({ issue_date: today(), issue: index === 0 ? firstIssue : "", status: "Open", assigned_mechanic: "", work_notes: "" }, index));
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Date</th><th>Issue</th><th>Status</th><th>Assigned Mechanic</th><th>Notes / Work Detail</th></tr></thead><tbody id="newWoIssueBody">${rows.join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addNewWoIssueRowBtn">Add issue row</button></div>`;
}

function addNewWorkOrderIssueRow() {
  const body = $("newWoIssueBody");
  const index = body?.querySelectorAll("tr").length || 0;
  body?.insertAdjacentHTML("beforeend", mechanicIssueEditRow({ issue_date: today(), issue: "", status: "Open", assigned_mechanic: "", work_notes: "" }, index));
}

async function saveNewWorkOrderModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  const asset = resolveAssetLookup(record.asset_lookup);
  record.manager_override = String(record.manager_override || "").toLowerCase() === "yes";
  record.asset_id = asset?.id || null;
  record.asset_tag = asset?.asset_tag || null;
  delete record.asset_lookup;
  ["odometer", "engine_hours", "next_due_odometer", "next_due_hours"].forEach((k) => record[k] = Number(record[k] || 0));
  if (!record.wo_no || !record.wo_date || !record.asset_tag || !record.work_type || !record.priority || !record.status) {
    alert("Work order #, date, asset, work type, priority, and status are required.");
    return;
  }
  const existingOpen = currentRows.find((wo) => String(wo.asset_tag || "").toLowerCase() === String(record.asset_tag || "").toLowerCase() && !wo.invoice_no && !/closed|complete|invoiced|cancel/i.test(wo.status || ""));
  if (existingOpen) {
    alert(`${record.asset_tag} already has an active work order: ${existingOpen.wo_no} (${existingOpen.status || "Open"}). Close or invoice the old work order before opening another one for the same equipment.`);
    return;
  }
  if (record.bill_to_customer && !record.customer_po && !(record.manager_override && record.override_by && record.override_reason)) {
    alert("Customer PO # is required for billable repairs unless manager override, override by, and override reason are completed.");
    return;
  }
  const issueRows = parseWorkOrderIssueRows();
  if (!issueRows.length) {
    alert("Add at least one equipment issue.");
    return;
  }
  try {
    const saved = await upsertOne("work_orders", record, "wo_no");
    await upsertMany("work_order_issues", issueRows.map((row) => ({ ...row, wo_id: saved.id })), "id");
    await supabase.from("assets").update({ status: saved.wo_no, notes: record.description || null }).eq("asset_tag", saved.asset_tag);
    await incrementSequence("wo");
    closeModal();
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function parseWorkOrderIssueRows() {
  return [...document.querySelectorAll("#newWoIssueBody tr")].map((tr) => {
    const get = (field) => tr.querySelector(`[data-clock-issue="${field}"]`)?.value || "";
    return {
      issue_date: get("issue_date") || today(),
      issue: get("issue"),
      status: get("status") || "Open",
      assigned_mechanic: get("assigned_mechanic") === "Unassigned" ? null : get("assigned_mechanic") || null,
      work_notes: get("work_notes") || null,
    };
  }).filter((row) => row.issue || row.work_notes);
}

function openWorkOrderEditModal(wo) {
  if (!wo) return;
  if (wo.invoice_no || /invoiced/i.test(wo.status || "")) {
    alert(`Work order ${wo.wo_no} is invoiced and cannot be edited without reversal.`);
    return;
  }
  editing = wo;
  $("modalTitle").textContent = `Edit work order ${wo.wo_no}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Work order #", "wo_no", wo.wo_no)}
      ${productInput("Date", "wo_date", wo.wo_date || today(), "date")}
      ${productSelect("Bill to customer", "bill_to_customer", productMeta.customers || [], wo.bill_to_customer || "", "New customer")}
      ${productInput("Customer PO #", "customer_po", wo.customer_po || "")}
      ${productSelect("Manager override", "manager_override", ["No", "Yes"], wo.manager_override ? "Yes" : "No")}
      ${productInput("Override by", "override_by", wo.override_by || "")}
      ${productInput("Asset tag", "asset_tag", wo.asset_tag || "")}
      ${productSelect("Work type", "work_type", ["Repair", "Preventive Maintenance", "Breakdown", "Inspection", "Rental Checkout"], wo.work_type || "Repair")}
      ${productSelect("Priority", "priority", ["Low", "Medium", "High"], wo.priority || "Medium")}
      ${productInput("Vendor / shop", "vendor_shop", wo.vendor_shop || "")}
      ${productInput("Odometer", "odometer", wo.odometer || 0, "number")}
      ${productInput("Engine hours", "engine_hours", wo.engine_hours || 0, "number")}
      ${productSelect("Status", "status", ["Open", "In Progress", "Waiting Parts", "Ready to Close", "Closed", "Complete", "Cancelled"], wo.status || "Open")}
      ${productInput("Next due date", "next_due_date", wo.next_due_date || "", "date")}
      ${productInput("Next due odometer", "next_due_odometer", wo.next_due_odometer || 0, "number")}
      ${productInput("Next due hours", "next_due_hours", wo.next_due_hours || 0, "number")}
      <div class="field wide"><label>Description</label><textarea data-product-field="description">${esc(wo.description || "")}</textarea></div>
      <div class="field wide"><label>Work performed summary</label><textarea readonly>${esc(workOrderSummaryText(wo))}</textarea><small>Auto-summary from issues, parts, and mechanic time.</small></div>
      <div class="field wide"><label>Override reason</label><textarea data-product-field="override_reason">${esc(wo.override_reason || "")}</textarea></div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(wo.notes || "")}</textarea></div>
    </div>
    <div class="actions"><button class="primary" type="button" id="closeWoFromEditBtn">Close work order</button></div>
    <section class="subpanel">
      <div class="panel-title"><strong>Mechanic summary by date</strong><span>Issues, parts used, and labor posted against this work order.</span></div>
      ${repairDailySummaryTable(wo)}
    </section>
    <section class="subpanel">
      <div class="panel-title"><strong>Issue details</strong><span>Edit problem rows, assigned mechanic, status, dates, and work notes.</span></div>
      ${workOrderIssueAdminEditTable(wo)}
    </section>
    <section class="subpanel">
      <div class="panel-title"><strong>Parts requested / used</strong><span>Assign exact SKU for mechanic requests, edit qty, cost, status, and add part rows.</span></div>
      ${workOrderPartsAdminEditTable(wo)}
    </section>
    <section class="subpanel">
      <div class="panel-title"><strong>Admin labor editor</strong><span>Adjust clock-in, clock-out, rate, issue, and work detail when time needs correction.</span></div>
      ${repairLaborEditTable(wo)}
    </section>
    <p class="notice">Use Mechanic Time to add issue rows, reserve/accept parts, invite helper mechanics, and clock labor. Invoiced work orders are locked.</p>`;
  $("modalSave").onclick = saveWorkOrderEditModal;
  $("modal").style.display = "flex";
  $("closeWoFromEditBtn").onclick = () => closeWorkOrder(wo.wo_no);
  $("addAdminIssueRowBtn").onclick = addAdminIssueEditRow;
  $("addAdminPartRowBtn").onclick = addAdminPartEditRow;
  bindAdminPartEditLookups();
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateCustomerInOpenModal());
}

async function saveWorkOrderEditModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  record.manager_override = String(record.manager_override || "").toLowerCase() === "yes";
  ["odometer", "engine_hours", "next_due_odometer", "next_due_hours"].forEach((k) => record[k] = Number(record[k] || 0));
  if (!record.wo_no || !record.wo_date || !record.work_type || !record.priority || !record.status) {
    alert("Work order #, date, type, priority, and status are required.");
    return;
  }
  if (record.bill_to_customer && !record.customer_po && !(record.manager_override && record.override_by && record.override_reason)) {
    alert("Customer PO # is required for billable repairs unless manager override, override by, and override reason are completed.");
    return;
  }
  try {
    await upsertOne("work_orders", record, "wo_no");
    await saveWorkOrderIssueEdits(editing);
    await saveWorkOrderPartEdits(editing);
    await saveWorkOrderLaborEdits(editing);
    closeModal();
    renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function saveWorkOrderIssueEdits(wo) {
  const rows = [...document.querySelectorAll("#adminIssueBody tr")];
  const upserts = [];
  for (const tr of rows) {
    const id = tr.dataset.issueId || "";
    const get = (field) => tr.querySelector(`[data-admin-issue="${field}"]`)?.value || "";
    const remove = tr.querySelector('[data-admin-issue="remove"]')?.checked;
    const hasContent = get("issue") || get("work_notes");
    if (remove) {
      if (id) {
        const { error } = await supabase.from("work_order_issues").delete().eq("id", id).eq("wo_id", wo.id);
        if (error) throw error;
      }
      continue;
    }
    if (!hasContent) continue;
    upserts.push({
      ...(id ? { id } : {}),
      wo_id: wo.id,
      issue_date: get("issue_date") || today(),
      issue: get("issue") || "General work order",
      status: get("status") || "Open",
      assigned_mechanic: get("assigned_mechanic") === "Unassigned" ? null : get("assigned_mechanic") || null,
      work_notes: get("work_notes") || null,
    });
  }
  await upsertMany("work_order_issues", upserts, "id");
}

async function saveWorkOrderPartEdits(wo) {
  const rows = [...document.querySelectorAll("#adminPartBody tr")];
  const upserts = [];
  for (const tr of rows) {
    const id = tr.dataset.partId || "";
    const get = (field) => tr.querySelector(`[data-admin-part="${field}"]`)?.value || "";
    const remove = tr.querySelector('[data-admin-part="remove"]')?.checked;
    const existing = (wo._parts || []).find((part) => String(part.id || "") === String(id));
    if (remove) {
      if (id) {
        if (Number(existing?.accepted_qty || 0) > 0) {
          const { error } = await supabase.from("work_order_parts").update({
            qty_needed: Number(existing.accepted_qty || 0),
            status: "Released",
            availability: "Released",
            notes: [existing.notes, `Unaccepted balance released by admin on ${new Date().toLocaleString()}`].filter(Boolean).join("\n"),
          }).eq("id", id).eq("wo_id", wo.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("work_order_parts").delete().eq("id", id).eq("wo_id", wo.id);
          if (error) throw error;
        }
      }
      continue;
    }
    const product = resolveProductLookup(get("product_lookup"));
    const description = get("product_name").trim();
    const qtyNeeded = Number(get("qty_needed") || 0);
    const acceptedQty = Number(get("accepted_qty") || 0);
    if (!product && !description && qtyNeeded <= 0 && acceptedQty <= 0) continue;
    if (acceptedQty > qtyNeeded && qtyNeeded > 0) throw new Error(`Accepted quantity cannot exceed needed quantity for ${description || product?.name || "a part line"}.`);
    const productId = product?.id || existing?.product_id || null;
    const sku = product?.sku || (existing?.sku && !/^TBD$/i.test(existing.sku) ? existing.sku : "TBD");
    const productName = product?.name || description || existing?.product_name || "";
    const unitCost = Number(get("unit_cost") || existing?.unit_cost || product?.cost || 0);
    let status = get("status") || existing?.status || "Requested";
    let availability = get("availability") || existing?.availability || "";
    if (product) {
      const shortQty = Math.max(0, qtyNeeded - Number(product.qty || 0) - acceptedQty);
      if (!availability) availability = shortQty > 0 ? `Short ${shortQty}` : "OK";
      if (/requested|needs/i.test(status)) status = shortQty > 0 ? "Shortage" : "Reserved";
    } else if (!productId) {
      availability = availability || "Needs part number";
      status = status === "Reserved" ? "Requested" : status;
    }
    if (qtyNeeded > 0 && acceptedQty >= qtyNeeded && !/released|cancelled/i.test(status)) status = "Accepted";
    upserts.push({
      ...(id ? { id } : {}),
      wo_id: wo.id,
      issue: get("issue") || existing?.issue || "General",
      product_id: productId,
      sku,
      product_name: productName,
      qty_needed: qtyNeeded,
      accepted_qty: acceptedQty,
      unit_cost: unitCost,
      status,
      availability,
      notes: get("notes") || null,
    });
  }
  await upsertMany("work_order_parts", upserts, "id");
}

function workOrderSummaryText(wo) {
  const issueLines = (wo._issues || []).map((issue) => {
    const status = issue.status ? ` [${issue.status}]` : "";
    const assigned = issue.assigned_mechanic ? ` - ${issue.assigned_mechanic}` : "";
    const notes = issue.work_notes ? `: ${issue.work_notes}` : "";
    return `${issue.issue_date || wo.wo_date || ""} ${issue.issue || "Issue"}${status}${assigned}${notes}`.trim();
  });
  const partLines = (wo._parts || []).map((part) => {
    const accepted = Number(part.accepted_qty || 0);
    const needed = Number(part.qty_needed || 0);
    return `${partDisplayName(part)}: ${accepted}/${needed} accepted${part.issue ? ` for ${part.issue}` : ""} (${effectivePartStatus(part)})`.trim();
  });
  const laborLines = (wo._labor || []).map((labor) => {
    const hours = laborHours(labor).toFixed(2);
    return `${String(labor.clock_in || wo.wo_date || "").slice(0, 10)} ${labor.mechanic || "Mechanic"}: ${hours} hr${labor.issue ? ` on ${labor.issue}` : ""}${labor.work_done ? ` - ${labor.work_done}` : ""}`;
  });
  const total = `Totals: parts ${money(repairPartsTotal(wo))}, labor ${repairLaborHours(wo).toFixed(2)} hr / ${money(repairLaborTotal(wo))}, total ${money(repairTotal(wo))}.`;
  return [
    issueLines.length ? `Issues:\n${issueLines.map((line) => `- ${line}`).join("\n")}` : "",
    partLines.length ? `Parts:\n${partLines.map((line) => `- ${line}`).join("\n")}` : "",
    laborLines.length ? `Labor:\n${laborLines.map((line) => `- ${line}`).join("\n")}` : "",
    total,
  ].filter(Boolean).join("\n\n");
}

async function closeWorkOrder(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  if (!wo) return;
  if (wo.invoice_no || /invoiced/i.test(wo.status || "")) {
    alert(`Work order ${wo.wo_no} is already invoiced and locked.`);
    return;
  }
  if (/closed|complete/i.test(wo.status || "")) {
    alert(`Work order ${wo.wo_no} is already closed.`);
    return;
  }
  const activeLabor = (wo._labor || []).filter((labor) => labor.clock_in && !labor.clock_out);
  if (activeLabor.length) {
    alert(`Cannot close ${wo.wo_no}.\n\nProblem: ${activeLabor.map((l) => l.mechanic || "Mechanic").join(", ")} still has active clock-in time.\n\nHow to fix: Open Mechanic Time for this work order, click Clock out now for each active mechanic, then try closing again.`);
    return;
  }
  const pendingParts = pendingWorkOrderParts(wo);
  if (pendingParts.length) {
    const parts = pendingParts.slice(0, 5).map((p) => partDisplayName(p)).join(", ");
    alert(`Cannot close ${wo.wo_no}.\n\nProblem: ${pendingParts.length} part request(s) are still open: ${parts}${pendingParts.length > 5 ? ", ..." : ""}.\n\nHow to fix: Receive and accept the needed parts, fill in the final part number for mechanic requests, or release/remove parts that are no longer needed.`);
    return;
  }
  const openIssues = (wo._issues || []).filter((issue) => /open|progress|waiting/i.test(issue.status || ""));
  const confirmText = openIssues.length
    ? `${wo.wo_no} still has ${openIssues.length} issue(s) not marked done. Close it anyway and move it to Closed Not Invoiced?`
    : `Close ${wo.wo_no} and move it to Closed Not Invoiced?`;
  if (!confirm(confirmText)) return;
  try {
    const summary = workOrderSummaryText(wo);
    const closeNote = `[Closed ${new Date().toLocaleString()}]\n${summary}`;
    const notes = [wo.notes, closeNote].filter(Boolean).join("\n\n");
    const { error } = await supabase.from("work_orders").update({ status: "Closed", notes }).eq("id", wo.id);
    if (error) throw error;
    closeModal();
    await renderRepairsView();
  } catch (error) {
    alert(`Could not close ${wo.wo_no}.\n\nProblem: ${error.message || error}\n\nHow to fix: Refresh the Repairs screen, confirm the work order is not invoiced, all mechanics are clocked out, and all requested parts are accepted or released.`);
  }
}

async function markWorkOrderReadyToClose(wo) {
  const mechanic = document.querySelector('[data-product-field="mechanic"]')?.value || "";
  const issue = document.querySelector('[data-product-field="issue"]')?.value || "General work order";
  if (!mechanic) {
    alert("Choose a mechanic first.");
    return;
  }
  const activeLabor = (wo._labor || []).filter((labor) => labor.clock_in && !labor.clock_out);
  if (activeLabor.length) {
    alert(`Clock out active mechanic time first before marking ready to close: ${activeLabor.map((l) => l.mechanic).join(", ")}.`);
    return;
  }
  const pendingParts = pendingWorkOrderParts(wo);
  const confirmText = pendingParts.length
    ? `${wo.wo_no} still has ${pendingParts.length} part request(s) not fully received/accepted. It cannot be marked ready to close until parts are completed or released.`
    : `Mark ${wo.wo_no} as Ready to Close?`;
  if (pendingParts.length) {
    alert(confirmText);
    return;
  }
  if (!confirm(confirmText)) return;
  try {
    await saveMechanicModalWork(wo, mechanic, issue);
    const note = `[Ready to Close ${new Date().toLocaleString()} by ${mechanic}]\n${workOrderSummaryText(wo)}`;
    const notes = [wo.notes, note].filter(Boolean).join("\n\n");
    const { error } = await supabase.from("work_orders").update({ status: "Ready to Close", notes }).eq("id", wo.id);
    if (error) throw error;
    closeModal();
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function repairPartsTotal(wo) {
  return (wo._parts || []).reduce((s, p) => s + Number(p.accepted_qty || 0) * Number(p.unit_cost || 0), 0);
}

function pendingWorkOrderParts(wo) {
  return (wo._parts || []).filter((part) => {
    const needed = Number(part.qty_needed || 0);
    const accepted = Number(part.accepted_qty || 0);
    if (needed > 0 && accepted >= needed) return false;
    const status = effectivePartStatus(part);
    if (/released|removed|cancelled/i.test(status)) return false;
    if (/requested|reserved|partial|shortage|waiting|to order/i.test(status)) return accepted < needed;
    if (!part.sku || /^TBD$/i.test(part.sku)) return true;
    return needed > 0 && accepted < needed && !/accepted|issued|complete/i.test(status);
  });
}

function repairLaborHours(wo) {
  return (wo._labor || []).reduce((s, l) => s + laborHours(l), 0);
}

function repairLaborTotal(wo) {
  return (wo._labor || []).reduce((s, l) => s + laborHours(l) * Number(l.hourly_rate || 0), 0);
}

function repairTotal(wo) {
  return repairPartsTotal(wo) + repairLaborTotal(wo);
}

function laborHours(labor) {
  if (!labor.clock_in || !labor.clock_out) return 0;
  const start = new Date(labor.clock_in);
  const end = new Date(labor.clock_out);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return (end - start) / 3600000;
}

function currentMechanicRate(name) {
  return Number((productMeta.mechanicsRows || []).find((m) => m.name === name)?.hourly_rate || 0);
}

function activeLaborForMechanic(name) {
  return currentRows.flatMap((wo) => (wo._labor || []).map((labor) => ({ ...labor, _wo: wo }))).find((labor) => labor.mechanic === name && labor.clock_in && !labor.clock_out);
}

function openMechanicTimeModal(wo) {
  if (!wo) return;
  const firstMechanic = productMeta.mechanics[0] || "";
  const issueOptions = ["General work order", ...(wo._issues || []).map((i) => i.issue).filter(Boolean)];
  $("modalTitle").textContent = `Mechanic time for ${wo.wo_no}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productSelect("Mechanic", "mechanic", productMeta.mechanics || [], firstMechanic)}
      ${productSelect("Additional mechanic / helper", "helper_mechanic", ["None", ...(productMeta.mechanics || [])], "None")}
      ${productSelect("Issue worked on", "issue", issueOptions, issueOptions[0] || "General work order")}
      ${productInput("Hourly rate", "hourly_rate", currentMechanicRate(firstMechanic), "number")}
      ${productInput("Manual clock-out time", "manual_clock_out", "", "datetime-local")}
      <div class="field wide"><label>Work note</label><textarea data-product-field="work_done" placeholder="What was done, findings, or next step"></textarea></div>
    </div>
    <div id="mechanicClockStatus" class="notice">${mechanicClockStatusHtml(firstMechanic, wo)}</div>
    <div class="actions"><button class="primary" type="button" id="clockInNowBtn">Clock in now</button><button type="button" id="clockOutNowBtn">Clock out now</button><button type="button" id="saveMechanicWorkBtn">Save</button><button type="button" id="saveCloseMechanicWorkBtn">Save and close</button><button type="button" id="readyToCloseBtn">Ready to close</button><button type="button" id="inviteHelperBtn">Invite/add helper</button></div>
    <section class="subpanel">
      <div class="panel-title"><strong>Issue details</strong><span>These rows update the work order issue list and print on the invoice.</span></div>
      ${mechanicIssueEditTable(wo)}
    </section>
    <section class="subpanel">
      <div class="panel-title"><strong>Add / reserve parts during clock-in</strong><span>Mechanics can request parts here. Out-of-stock requests go to Parts Requests.</span></div>
      ${mechanicReservePartsTable(issueOptions)}
    </section>
    <section class="subpanel">
      <div class="panel-title"><strong>Accept or release reserved parts per line</strong><span>Accepted parts deduct inventory. Released parts are removed from the WO reservation.</span></div>
      ${mechanicAcceptPartsTable(wo)}
    </section>
    <section class="subpanel">
      <div class="panel-title"><strong>Parts history</strong><span>All requested, reserved, accepted, released, and shortage lines for this work order.</span></div>
      ${repairPartsMiniTable(wo)}
    </section>
    <section class="subpanel">
      <div class="panel-title"><strong>Labor history</strong><span>Completed clock entries for this work order.</span></div>
      ${repairLaborMiniTable(wo)}
    </section>`;
  $("modalSave").style.display = "none";
  $("modalSave").onclick = closeModal;
  $("modal").style.display = "flex";
  const mechanicInput = document.querySelector('[data-product-field="mechanic"]');
  const rateInput = document.querySelector('[data-product-field="hourly_rate"]');
  mechanicInput.oninput = () => {
    rateInput.value = currentMechanicRate(mechanicInput.value);
    $("mechanicClockStatus").innerHTML = mechanicClockStatusHtml(mechanicInput.value, wo);
  };
  $("clockInNowBtn").onclick = () => clockInMechanic(wo);
  $("clockOutNowBtn").onclick = () => clockOutMechanic(wo);
  $("saveMechanicWorkBtn").onclick = () => saveMechanicWorkAndRefresh(wo, false);
  $("saveCloseMechanicWorkBtn").onclick = () => saveMechanicWorkAndRefresh(wo, true);
  $("readyToCloseBtn").onclick = () => markWorkOrderReadyToClose(wo);
  $("inviteHelperBtn").onclick = () => inviteHelperMechanic(wo);
  document.querySelectorAll("[data-add-clock-row]").forEach((b) => b.onclick = () => appendMechanicClockRow(b.dataset.addClockRow));
  bindMechanicPartLookups();
}

function mechanicClockStatusHtml(mechanic, wo) {
  if (!mechanic) return "Choose a mechanic before clocking in.";
  const active = activeLaborForMechanic(mechanic);
  if (!active) return `${esc(mechanic)} is not clocked in.`;
  if (active._wo?.id === wo.id) return `${esc(mechanic)} is clocked in on ${esc(wo.wo_no)} since ${formatDateTime(active.clock_in)}.`;
  return `${esc(mechanic)} is already clocked in on ${esc(active._wo?.wo_no || "another WO")}. Clock out there first.`;
}

function repairIssueMiniTable(wo) {
  const heads = ["Date", "Issue", "Status", "Assigned Mechanic", "Notes / Work Detail"];
  const rows = wo._issues?.length ? wo._issues : [{ issue_date: wo.wo_date, issue: wo.description || "General work order", status: wo.status, assigned_mechanic: "", work_notes: "" }];
  return `<div class="table-wrap"><table class="line-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((i) => `<tr><td>${esc(i.issue_date || "")}</td><td>${esc(i.issue || "")}</td><td>${badge(i.status || "Open")}</td><td>${esc(i.assigned_mechanic || "")}</td><td>${esc(i.work_notes || "")}</td></tr>`).join("")}</tbody></table></div>`;
}

function workOrderIssueAdminEditTable(wo) {
  const rows = [...(wo._issues || []), ...Array.from({ length: Math.max(3, 6 - (wo._issues || []).length) }, () => ({ issue_date: today(), issue: "", status: "Open", assigned_mechanic: "", work_notes: "" }))];
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Date</th><th>Issue</th><th>Status</th><th>Assigned Mechanic</th><th>Notes / Work Detail</th><th>Remove</th></tr></thead><tbody id="adminIssueBody">${rows.map((row, index) => workOrderIssueAdminEditRow(row, index)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addAdminIssueRowBtn">Add issue row</button></div>`;
}

function workOrderIssueAdminEditRow(row = {}, index = 0) {
  return `<tr data-admin-issue-row="${index}" data-issue-id="${esc(row.id || "")}">
    <td><input type="date" data-admin-issue="issue_date" value="${esc(row.issue_date || today())}"></td>
    <td><input data-admin-issue="issue" value="${esc(row.issue || "")}" placeholder="Leak, brake, inspection"></td>
    <td>${adminInlineSelect("data-admin-issue", "status", ["Open", "In Progress", "Waiting Parts", "Done", "Cancelled"], row.status || "Open")}</td>
    <td>${adminInlineSelect("data-admin-issue", "assigned_mechanic", ["Unassigned", ...(productMeta.mechanics || [])], row.assigned_mechanic || "Unassigned")}</td>
    <td><input data-admin-issue="work_notes" value="${esc(row.work_notes || "")}" placeholder="Work details"></td>
    <td><input type="checkbox" data-admin-issue="remove"></td>
  </tr>`;
}

function addAdminIssueEditRow() {
  const body = $("adminIssueBody");
  const index = body?.querySelectorAll("tr").length || 0;
  body?.insertAdjacentHTML("beforeend", workOrderIssueAdminEditRow({ issue_date: today(), issue: "", status: "Open", assigned_mechanic: "", work_notes: "" }, index));
}

function mechanicIssueEditTable(wo) {
  const rows = [...(wo._issues || []), ...Array.from({ length: Math.max(0, 5 - (wo._issues || []).length) }, () => ({ issue_date: today(), issue: "", status: "Open", assigned_mechanic: "", work_notes: "" }))];
  return `<div class="table-wrap" data-clock-table="issue"><table class="line-table"><thead><tr><th>Date</th><th>Issue</th><th>Status</th><th>Assigned Mechanic</th><th>Notes / Work Detail</th></tr></thead><tbody id="clockIssueBody">${rows.map((i, index) => mechanicIssueEditRow(i, index)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" data-add-clock-row="issue">Add issue row</button></div>`;
}

function mechanicIssueEditRow(row = {}, index = 0) {
  return `<tr>
    <td><input type="date" data-clock-issue="issue_date" data-line-index="${index}" value="${esc(row.issue_date || today())}"></td>
    <td><input data-clock-issue="issue" data-line-index="${index}" value="${esc(row.issue || "")}" placeholder="Leak, brakes, inspection"></td>
    <td>${inlineSelect("data-clock-issue", "status", ["Open", "In Progress", "Waiting Parts", "Done", "Cancelled"], row.status || "Open", index)}</td>
    <td>${inlineSelect("data-clock-issue", "assigned_mechanic", ["Unassigned", ...(productMeta.mechanics || [])], row.assigned_mechanic || "Unassigned", index)}</td>
    <td><input data-clock-issue="work_notes" data-line-index="${index}" value="${esc(row.work_notes || "")}"></td>
  </tr>`;
}

function mechanicReservePartsTable(issueOptions) {
  const rows = Array.from({ length: 5 }, (_, index) => mechanicReservePartRow(index, issueOptions));
  return `${productOptionsDatalist()}<div class="table-wrap" data-clock-table="part"><table class="line-table"><thead><tr><th>Part / SKU</th><th>Description Needed</th><th>On Hand</th><th>Available</th><th>Qty Needed</th><th>Unit Cost</th><th>Issue</th><th>In-stock Alternatives</th></tr></thead><tbody id="clockPartBody">${rows.join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" data-add-clock-row="part">Add part row</button></div><p class="notice">Mechanics may enter only a description when they do not know the exact SKU. Parts team can fill the SKU later in Parts Requests.</p>`;
}

function mechanicReservePartRow(index = 0, issueOptions = []) {
  return `<tr>
    <td><input class="suggest-input" list="poProductOptions" data-clock-part="product_lookup" data-line-index="${index}" placeholder="Search part or leave blank" autocomplete="off"></td>
    <td><input data-clock-part="description" data-line-index="${index}" placeholder="Describe part needed"></td>
    <td data-clock-part-display="on_hand"></td>
    <td data-clock-part-display="available"></td>
    <td><input type="number" step="0.01" data-clock-part="qty" data-line-index="${index}"></td>
    <td><input type="number" step="0.01" data-clock-part="unit_cost" data-line-index="${index}"></td>
    <td>${inlineSelect("data-clock-part", "issue", ["Use clock-in issue", ...issueOptions], "Use clock-in issue", index)}</td>
    <td data-clock-part-display="alternatives"></td>
  </tr>`;
}

function mechanicAcceptPartsTable(wo) {
  const rows = (wo._parts || []).map((part, index) => ({ part, index })).filter(({ part }) => remainingReservedQty(part) > 0 && !/accepted|issued/i.test(effectivePartStatus(part)));
  if (!rows.length) return `<div class="notice">No reserved parts waiting for mechanic acceptance.</div>`;
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Action</th><th>Part / Description</th><th>Issue</th><th>On Hand</th><th>Remaining Reserved</th><th>Qty to Accept</th><th>Status</th><th>In-stock Alternatives</th></tr></thead><tbody>${rows.map(({ part, index }) => mechanicAcceptPartRow(part, index)).join("")}</tbody></table></div>`;
}

function mechanicAcceptPartRow(part, index) {
  const product = (productMeta.products || []).find((p) => p.id === part.product_id || p.sku === part.sku) || {};
  const remaining = remainingReservedQty(part);
  const skuMissing = !part.product_id || !part.sku || /^TBD$/i.test(part.sku || "");
  return `<tr>
    <td>${inlineSelect("data-accept-part", "mode", skuMissing ? ["No", "Remove Reserved"] : ["No", "Partial", "Full", "Remove Reserved"], "No", index, part.id)}</td>
    <td>${esc(`${part.sku || product.sku || ""} - ${part.product_name || product.name || ""}`)}</td>
    <td>${esc(part.issue || "General")}</td>
    <td>${esc(product.qty ?? "")}</td>
    <td>${esc(remaining)}</td>
    <td><input type="number" min="0" max="${esc(remaining)}" step="0.01" data-accept-part="qty" data-line-index="${index}" data-part-id="${esc(part.id || "")}"></td>
    <td>${badge(effectivePartStatus(part))}</td>
    <td>${skuMissing ? "Parts team must fill SKU first" : inStockAlternativesText(product)}</td>
  </tr>`;
}

function inlineSelect(attrName, field, values, value, index, rowId = "") {
  return `<select ${attrName}="${esc(field)}" data-line-index="${index}" ${rowId ? `data-part-id="${esc(rowId)}"` : ""}>${values.map((v) => `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
}

function remainingReservedQty(part) {
  return Math.max(0, Number(part.qty_needed || 0) - Number(part.accepted_qty || 0));
}

function effectivePartStatus(part) {
  const rawStatus = part?.status || "Reserved";
  if (/released|removed|cancelled/i.test(rawStatus)) return rawStatus;
  const needed = Number(part?.qty_needed || 0);
  const accepted = Number(part?.accepted_qty || 0);
  if (needed > 0 && accepted >= needed) return "Accepted";
  if (accepted > 0) return "Partially Accepted";
  return rawStatus;
}

function inStockAlternativesText(product) {
  const compatible = String(product.compatible_with || "").toLowerCase();
  const rows = (productMeta.products || []).filter((p) => p.sku !== product.sku && Number(p.qty || 0) > 0 && compatible && [p.sku, p.name, p.compatible_with].join(" ").toLowerCase().includes(compatible)).slice(0, 3);
  return rows.length ? rows.map((p) => `${p.sku} (${p.qty})`).join(", ") : "";
}

function appendMechanicClockRow(type) {
  if (type === "issue") {
    const body = $("clockIssueBody");
    const index = body?.querySelectorAll("tr").length || 0;
    body?.insertAdjacentHTML("beforeend", mechanicIssueEditRow({}, index));
  }
  if (type === "part") {
    const body = $("clockPartBody");
    const index = body?.querySelectorAll("tr").length || 0;
    const issueOptions = ["General work order", ...[...document.querySelectorAll('[data-clock-issue="issue"]')].map((el) => el.value).filter(Boolean)];
    body?.insertAdjacentHTML("beforeend", mechanicReservePartRow(index, issueOptions));
    bindMechanicPartLookups();
  }
}

function bindMechanicPartLookups() {
  document.querySelectorAll('[data-clock-part="product_lookup"]').forEach((input) => {
    input.oninput = () => refreshMechanicPartLookup(input);
    input.onchange = () => refreshMechanicPartLookup(input);
  });
}

function refreshMechanicPartLookup(input) {
  const tr = input.closest("tr");
  const product = resolveProductLookup(input.value);
  const set = (field, value) => {
    const target = tr?.querySelector(`[data-clock-part-display="${field}"]`);
    if (target) target.textContent = value;
  };
  if (!product) {
    set("on_hand", "");
    set("available", "");
    set("alternatives", "");
    return;
  }
  const qty = Number(product.qty || 0);
  set("on_hand", qty);
  set("available", qty > 0 ? "Available" : "Out of stock");
  set("alternatives", inStockAlternativesText(product));
  const costInput = tr?.querySelector('[data-clock-part="unit_cost"]');
  if (costInput && !costInput.value) costInput.value = Number(product.cost || 0);
}

function repairPartsMiniTable(wo) {
  const rows = wo._parts || [];
  const heads = ["Part / Description", "Issue", "Needed", "Accepted", "Unit Cost", "Status", "Availability", "Notes"];
  return `<div class="table-wrap"><table class="line-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((p) => `<tr><td>${esc(partDisplayName(p))}</td><td>${esc(p.issue || "")}</td><td>${esc(p.qty_needed ?? "")}</td><td>${esc(p.accepted_qty ?? 0)}</td><td>${money(p.unit_cost || 0)}</td><td>${badge(effectivePartStatus(p))}</td><td>${esc(p.availability || "")}</td><td>${esc(p.notes || "")}</td></tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No parts requested yet.</td></tr>`}</tbody></table></div>`;
}

function partDisplayName(part) {
  if (!part) return "";
  if (!part.sku || /^TBD$/i.test(part.sku)) return `Description only: ${part.product_name || ""}`;
  return `${part.sku || ""} ${part.product_name || ""}`.trim();
}

function workOrderPartsAdminEditTable(wo) {
  const rows = [...(wo._parts || []), ...Array.from({ length: Math.max(3, 6 - (wo._parts || []).length) }, () => ({ issue: "", sku: "", product_name: "", qty_needed: "", accepted_qty: 0, unit_cost: "", status: "Requested", availability: "", notes: "" }))];
  const heads = ["Part / SKU", "Description", "Issue", "Needed", "Accepted", "Unit Cost", "Status", "Availability", "Notes", "Remove"];
  return `${productOptionsDatalist()}<div class="table-wrap"><table class="line-table admin-parts-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody id="adminPartBody">${rows.map((row, index) => workOrderPartAdminEditRow(row, index)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addAdminPartRowBtn">Add part row</button></div><p class="notice">For mechanic requests with no SKU, search and select the real product here. Accepted quantities are kept as history; releasing removes only unaccepted reserved balance.</p>`;
}

function workOrderPartAdminEditRow(row = {}, index = 0) {
  const lookup = [row.sku && !/^TBD$/i.test(row.sku) ? row.sku : "", row.product_name].filter(Boolean).join(" - ");
  return `<tr data-admin-part-row="${index}" data-part-id="${esc(row.id || "")}">
    <td><input class="suggest-input" list="poProductOptions" data-admin-part="product_lookup" value="${esc(lookup)}" placeholder="Search SKU, product, vendor" autocomplete="off"></td>
    <td><input data-admin-part="product_name" value="${esc(row.product_name || "")}" placeholder="Description requested"></td>
    <td><input data-admin-part="issue" value="${esc(row.issue || "")}" placeholder="Issue"></td>
    <td><input type="number" min="0" step="0.01" data-admin-part="qty_needed" value="${esc(row.qty_needed ?? "")}"></td>
    <td><input type="number" min="0" step="0.01" data-admin-part="accepted_qty" value="${esc(row.accepted_qty ?? 0)}"></td>
    <td><input type="number" min="0" step="0.01" data-admin-part="unit_cost" value="${esc(row.unit_cost ?? "")}"></td>
    <td>${adminInlineSelect("data-admin-part", "status", ["Requested", "Reserved", "Shortage", "Partially Accepted", "Accepted", "Released", "Cancelled"], effectivePartStatus(row))}</td>
    <td><input data-admin-part="availability" value="${esc(row.availability || "")}" placeholder="OK / Short / Needs SKU"></td>
    <td><input data-admin-part="notes" value="${esc(row.notes || "")}"></td>
    <td><input type="checkbox" data-admin-part="remove"></td>
  </tr>`;
}

function addAdminPartEditRow() {
  const body = $("adminPartBody");
  const index = body?.querySelectorAll("tr").length || 0;
  body?.insertAdjacentHTML("beforeend", workOrderPartAdminEditRow({ status: "Requested" }, index));
  bindAdminPartEditLookups();
}

function adminInlineSelect(attrName, field, values, value) {
  return `<select ${attrName}="${esc(field)}">${values.map((v) => `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
}

function bindAdminPartEditLookups() {
  document.querySelectorAll('[data-admin-part="product_lookup"]').forEach((input) => {
    input.oninput = () => refreshAdminPartEditLookup(input);
    input.onchange = () => refreshAdminPartEditLookup(input);
  });
}

function refreshAdminPartEditLookup(input) {
  const tr = input.closest("tr");
  const product = resolveProductLookup(input.value);
  if (!product || !tr) return;
  const set = (field, value, onlyBlank = false) => {
    const target = tr.querySelector(`[data-admin-part="${field}"]`);
    if (target && (!onlyBlank || !target.value)) target.value = value ?? "";
  };
  set("product_name", product.name || "");
  set("unit_cost", product.cost ?? "", true);
  set("availability", Number(product.qty || 0) > 0 ? "OK" : "Out of stock");
  const status = tr.querySelector('[data-admin-part="status"]');
  if (status && /requested|shortage|needs/i.test(status.value || "")) status.value = Number(product.qty || 0) > 0 ? "Reserved" : "Shortage";
}

function repairDailySummaryTable(wo) {
  const grouped = new Map();
  const bucket = (date) => {
    const key = String(date || "No date").slice(0, 10) || "No date";
    if (!grouped.has(key)) grouped.set(key, { date: key, issues: [], parts: [], partCost: 0, hours: 0, laborCost: 0, notes: [] });
    return grouped.get(key);
  };
  (wo._issues || []).forEach((issue) => {
    const row = bucket(issue.issue_date || wo.wo_date);
    if (issue.issue) row.issues.push(issue.issue);
    if (issue.work_notes) row.notes.push(issue.work_notes);
  });
  (wo._labor || []).forEach((labor) => {
    const row = bucket(labor.clock_in || wo.wo_date);
    const hours = laborHours(labor);
    row.hours += hours;
    row.laborCost += hours * Number(labor.hourly_rate || 0);
    row.notes.push(`${labor.mechanic || "Mechanic"}${labor.issue ? ` - ${labor.issue}` : ""}${labor.work_done ? `: ${labor.work_done}` : ""}`);
  });
  (wo._stockMovements || []).filter((m) => /repair/i.test(m.type || "")).forEach((movement) => {
    const row = bucket(movement.movement_date || wo.wo_date);
    row.parts.push(`${movement.sku || ""} ${movement.product_name || ""} (${Math.abs(Number(movement.qty || 0))})`.trim());
    row.partCost += Math.abs(Number(movement.total_fifo_cost || 0));
  });
  if (!grouped.size) bucket(wo.wo_date);
  const rows = [...grouped.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const heads = ["Date", "Issues", "Parts Used", "Parts Cost", "Labor Hours", "Labor Cost", "Notes"];
  return `<div class="table-wrap"><table class="line-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr><td>${esc(row.date)}</td><td>${esc([...new Set(row.issues)].join("; "))}</td><td>${esc(row.parts.join("; "))}</td><td>${money(row.partCost)}</td><td>${row.hours.toFixed(2)}</td><td>${money(row.laborCost)}</td><td>${esc(row.notes.filter(Boolean).join(" | "))}</td></tr>`).join("")}</tbody></table></div>`;
}

function repairLaborMiniTable(wo) {
  const rows = wo._labor || [];
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Mechanic</th><th>Issue</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Rate</th><th>Work Done</th></tr></thead><tbody>${rows.length ? rows.map((l) => `<tr><td>${esc(l.mechanic)}</td><td>${esc(l.issue || "")}</td><td>${formatDateTime(l.clock_in)}</td><td>${formatDateTime(l.clock_out)}</td><td>${laborHours(l).toFixed(2)}</td><td>${money(l.hourly_rate)}</td><td>${esc(l.work_done || "")}</td></tr>`).join("") : `<tr><td colspan="7" class="empty">No time entries yet.</td></tr>`}</tbody></table></div>`;
}

function repairLaborEditTable(wo) {
  const rows = wo._labor || [];
  if (!rows.length) return `<div class="notice">No labor entries yet.</div>`;
  const heads = ["Mechanic", "Issue", "Clock In", "Clock Out", "Hours", "Rate", "Work Done"];
  return `<div class="table-wrap"><table class="line-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((l) => repairLaborEditRow(l)).join("")}</tbody></table></div><p class="notice">Clock-out cannot be later than the current time and cannot be before clock-in.</p>`;
}

function repairLaborEditRow(labor) {
  return `<tr data-labor-row="${esc(labor.id || "")}">
    <td><input data-labor-field="mechanic" data-labor-id="${esc(labor.id || "")}" value="${esc(labor.mechanic || "")}"></td>
    <td><input data-labor-field="issue" data-labor-id="${esc(labor.id || "")}" value="${esc(labor.issue || "")}"></td>
    <td><input type="datetime-local" data-labor-field="clock_in" data-labor-id="${esc(labor.id || "")}" value="${esc(dateTimeLocalValue(labor.clock_in))}"></td>
    <td><input type="datetime-local" data-labor-field="clock_out" data-labor-id="${esc(labor.id || "")}" value="${esc(dateTimeLocalValue(labor.clock_out))}"></td>
    <td>${laborHours(labor).toFixed(2)}</td>
    <td><input type="number" step="0.01" data-labor-field="hourly_rate" data-labor-id="${esc(labor.id || "")}" value="${esc(labor.hourly_rate ?? 0)}"></td>
    <td><input data-labor-field="work_done" data-labor-id="${esc(labor.id || "")}" value="${esc(labor.work_done || "")}"></td>
  </tr>`;
}

async function saveWorkOrderLaborEdits(wo) {
  const ids = [...new Set([...document.querySelectorAll("[data-labor-id]")].map((el) => el.dataset.laborId).filter(Boolean))];
  for (const id of ids) {
    const get = (field) => document.querySelector(`[data-labor-field="${field}"][data-labor-id="${id}"]`)?.value || "";
    const clockIn = parseDateTimeLocalValue(get("clock_in"), "Clock in", { allowFuture: true });
    const clockOut = parseDateTimeLocalValue(get("clock_out"), "Clock out", { allowFuture: false });
    if (clockIn && clockOut && new Date(clockOut) < new Date(clockIn)) throw new Error("Clock out cannot be before clock in.");
    const row = {
      mechanic: get("mechanic") || "Unassigned",
      issue: get("issue") || "General work order",
      clock_in: clockIn,
      clock_out: clockOut,
      hourly_rate: Number(get("hourly_rate") || 0),
      work_done: get("work_done") || null,
    };
    const { error } = await supabase.from("work_order_labor").update(row).eq("id", id).eq("wo_id", wo.id);
    if (error) throw error;
  }
}

function dateTimeLocalValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateTimeLocalValue(value, label = "Date/time", { allowFuture = false } = {}) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`${label} is not a valid date/time.`);
  if (!allowFuture && d > new Date()) throw new Error(`${label} cannot be later than the current time.`);
  return d.toISOString();
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return esc(value);
  return d.toLocaleString();
}

async function clockInMechanic(wo) {
  const mechanic = document.querySelector('[data-product-field="mechanic"]')?.value || "";
  const issue = document.querySelector('[data-product-field="issue"]')?.value || "General work order";
  const hourlyRate = Number(document.querySelector('[data-product-field="hourly_rate"]')?.value || currentMechanicRate(mechanic));
  if (!mechanic) {
    alert("Choose a mechanic first.");
    return;
  }
  const active = activeLaborForMechanic(mechanic);
  if (active && active._wo?.id !== wo.id) {
    alert(`${mechanic} is already clocked in on ${active._wo?.wo_no || "another work order"}. Clock out there before starting another work order.`);
    return;
  }
  if (active && active._wo?.id === wo.id) {
    alert(`${mechanic} is already clocked in on ${wo.wo_no}.`);
    return;
  }
  if (!confirm(`Clock in ${mechanic} on ${wo.wo_no} now?\n\nTime: ${new Date().toLocaleString()}`)) return;
  try {
    await saveMechanicModalWork(wo, mechanic, issue);
    await insertOne("work_order_labor", {
      wo_id: wo.id,
      mechanic,
      issue,
      clock_in: new Date().toISOString(),
      clock_out: null,
      hourly_rate: hourlyRate,
      work_done: "",
    }, "id");
    await refreshMechanicTimeModal(wo.wo_no);
  } catch (error) {
    alert(error.message || error);
  }
}

async function clockOutMechanic(wo) {
  const mechanic = document.querySelector('[data-product-field="mechanic"]')?.value || "";
  const workDone = document.querySelector('[data-product-field="work_done"]')?.value || "";
  const manualClockOut = document.querySelector('[data-product-field="manual_clock_out"]')?.value || "";
  const active = activeLaborForMechanic(mechanic);
  if (!active || active._wo?.id !== wo.id) {
    alert(`${mechanic || "This mechanic"} is not currently clocked in on ${wo.wo_no}.`);
    return;
  }
  let clockOutIso;
  try {
    clockOutIso = manualClockOut ? parseDateTimeLocalValue(manualClockOut, "Manual clock-out time", { allowFuture: false }) : new Date().toISOString();
    if (active.clock_in && new Date(clockOutIso) < new Date(active.clock_in)) {
      alert("Clock-out time cannot be before clock-in time.");
      return;
    }
    if (!manualClockOut) {
      clockOutIso = promptClockOutTimeFromHours(active, clockOutIso);
      if (!clockOutIso) return;
    }
  } catch (error) {
    alert(error.message || error);
    return;
  }
  const previewHours = laborHours({ clock_in: active.clock_in, clock_out: clockOutIso });
  if (!confirm(`Confirm clock out for ${mechanic} on ${wo.wo_no}\n\nClock in: ${formatDateTime(active.clock_in)}\nClock out: ${new Date(clockOutIso).toLocaleString()}\nTotal labor: ${previewHours.toFixed(2)} hours\n\nPost this labor time?`)) return;
  try {
    await saveMechanicModalWork(wo, mechanic, active.issue || "General work order");
    const { error } = await supabase.from("work_order_labor").update({
      clock_out: clockOutIso,
      work_done: workDone || active.work_done || "",
    }).eq("id", active.id);
    if (error) throw error;
    if (workDone) await appendIssueWorkNote(wo, active.issue || "General work order", mechanic, workDone);
    await refreshMechanicTimeModal(wo.wo_no);
  } catch (error) {
    alert(error.message || error);
  }
}

async function saveMechanicWorkAndRefresh(wo, closeAfter = false) {
  const mechanic = document.querySelector('[data-product-field="mechanic"]')?.value || "";
  const issue = document.querySelector('[data-product-field="issue"]')?.value || "General work order";
  if (!mechanic) {
    alert("Choose a mechanic first.");
    return;
  }
  try {
    await saveMechanicModalWork(wo, mechanic, issue);
    if (closeAfter) {
      closeModal();
      await renderRepairsView();
    } else {
      await refreshMechanicTimeModal(wo.wo_no);
    }
  } catch (error) {
    alert(error.message || error);
  }
}

async function refreshMechanicTimeModal(woNo) {
  await renderRepairsView();
  const fresh = currentRows.find((row) => row.wo_no === woNo);
  if (fresh) openMechanicTimeModal(fresh);
}

async function inviteHelperMechanic(wo) {
  const primary = document.querySelector('[data-product-field="mechanic"]')?.value || "";
  const helper = document.querySelector('[data-product-field="helper_mechanic"]')?.value || "";
  const issue = document.querySelector('[data-product-field="issue"]')?.value || "General work order";
  if (!primary) {
    alert("Choose the primary mechanic first.");
    return;
  }
  if (!helper || helper === "None") {
    alert("Choose an additional mechanic/helper.");
    return;
  }
  if (helper === primary) {
    alert("Helper must be different from the primary mechanic.");
    return;
  }
  const active = activeLaborForMechanic(helper);
  if (active && active._wo?.id !== wo.id) {
    alert(`${helper} is already clocked in on ${active._wo?.wo_no || "another work order"}.`);
    return;
  }
  if (active && active._wo?.id === wo.id) {
    alert(`${helper} is already clocked in on this work order.`);
    return;
  }
  if (!confirm(`Invite/add ${helper} to ${wo.wo_no} for hours only?\n\nThey will be clocked in now and can only charge labor time.`)) return;
  try {
    await insertOne("work_order_labor", {
      wo_id: wo.id,
      mechanic: helper,
      issue,
      clock_in: new Date().toISOString(),
      clock_out: null,
      hourly_rate: currentMechanicRate(helper),
      work_done: `Added by ${primary} as helper for hours only`,
    }, "id");
    await refreshMechanicTimeModal(wo.wo_no);
  } catch (error) {
    alert(error.message || error);
  }
}

async function saveMechanicModalWork(wo, mechanic, activeIssue) {
  await saveMechanicIssueRows(wo, mechanic);
  await saveMechanicRequestedParts(wo, mechanic, activeIssue);
  await applyMechanicPartAcceptances(wo, mechanic);
}

async function saveMechanicIssueRows(wo, mechanic) {
  const existingByIssue = new Map((wo._issues || []).map((row) => [String(row.issue || "").toLowerCase(), row]));
  const rows = [...document.querySelectorAll("#clockIssueBody tr")].map((tr) => {
    const get = (field) => tr.querySelector(`[data-clock-issue="${field}"]`)?.value || "";
    const issue = get("issue") || "";
    const existing = existingByIssue.get(String(issue).toLowerCase());
    return {
      ...(existing?.id ? { id: existing.id } : {}),
      wo_id: wo.id,
      issue_date: get("issue_date") || today(),
      issue,
      status: get("status") || "Open",
      assigned_mechanic: get("assigned_mechanic") === "Unassigned" ? null : get("assigned_mechanic") || mechanic || null,
      work_notes: get("work_notes") || null,
    };
  }).filter((row) => row.issue || row.work_notes);
  await upsertMany("work_order_issues", rows, "id");
}

async function saveMechanicRequestedParts(wo, mechanic, activeIssue) {
  const rows = [...document.querySelectorAll("#clockPartBody tr")].map((tr) => {
    const get = (field) => tr.querySelector(`[data-clock-part="${field}"]`)?.value || "";
    const product = resolveProductLookup(get("product_lookup"));
    const description = get("description").trim();
    const qty = Number(get("qty") || 0);
    if ((!product && !description) || qty <= 0) return null;
    const issue = get("issue") && get("issue") !== "Use clock-in issue" ? get("issue") : activeIssue || "General work order";
    if (!product) {
      return {
        wo_id: wo.id,
        issue,
        product_id: null,
        sku: "TBD",
        product_name: description,
        qty_needed: qty,
        unit_cost: Number(get("unit_cost") || 0),
        availability: "Needs part number",
        status: "Requested",
        accepted_qty: 0,
        notes: `Mechanic requested by description only by ${mechanic} on ${new Date().toLocaleString()}`,
      };
    }
    const available = Number(product.qty || 0);
    const shortage = Math.max(0, qty - available);
    return {
      wo_id: wo.id,
      issue,
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      qty_needed: qty,
      unit_cost: Number(get("unit_cost") || product.cost || 0),
      availability: shortage > 0 ? `Short ${shortage}` : "OK",
      status: shortage > 0 ? "Shortage" : "Reserved",
      accepted_qty: 0,
      notes: `${shortage > 0 ? "Mechanic requested out-of-stock part" : "Mechanic reserved part"} by ${mechanic} on ${new Date().toLocaleString()}`,
    };
  }).filter(Boolean);
  if (!rows.length) return;
  await upsertMany("work_order_parts", rows, "id");
  if (rows.some((row) => /short|requested/i.test(row.status))) {
    await supabase.from("work_orders").update({ status: "Waiting Parts" }).eq("id", wo.id);
  }
}

async function applyMechanicPartAcceptances(wo, mechanic) {
  const partsById = new Map((wo._parts || []).map((part) => [String(part.id || ""), part]));
  const availableByProductId = new Map((productMeta.products || []).map((product) => [String(product.id || product.sku || ""), Number(product.qty || 0)]));
  const rows = [...document.querySelectorAll('[data-accept-part="mode"]')].map((select) => {
    const partId = select.dataset.partId || "";
    const part = partsById.get(String(partId));
    const qtyInput = [...document.querySelectorAll('[data-accept-part="qty"]')].find((input) => input.dataset.partId === partId);
    return { part, mode: select.value, qty: Number(qtyInput?.value || 0) };
  }).filter((row) => row.part && row.mode !== "No");
  for (const row of rows) {
    const part = row.part;
    if ((!part.product_id || !part.sku || /^TBD$/i.test(part.sku || "")) && row.mode !== "Remove Reserved") {
      throw new Error(`${part.product_name || "Requested part"} needs a SKU/product assigned by the parts team before it can be accepted.`);
    }
    const remaining = remainingReservedQty(part);
    if (row.mode === "Remove Reserved") {
      if (Number(part.accepted_qty || 0) > 0) {
        await supabase.from("work_order_parts").update({ qty_needed: Number(part.accepted_qty || 0), status: "Accepted", notes: `${part.notes || ""} | Reserved balance released by ${mechanic}` }).eq("id", part.id);
      } else {
        await supabase.from("work_order_parts").delete().eq("id", part.id);
      }
      continue;
    }
    const qty = row.mode === "Full" ? remaining : row.qty;
    if (qty <= 0) throw new Error(`Enter quantity to accept for ${part.sku}.`);
    if (qty > remaining + 0.0001) throw new Error(`Accepted quantity for ${part.sku} cannot exceed remaining reserved quantity ${remaining}.`);
    const product = (productMeta.products || []).find((p) => p.id === part.product_id || p.sku === part.sku);
    const productKey = String(product?.id || product?.sku || "");
    const availableNow = availableByProductId.has(productKey) ? availableByProductId.get(productKey) : Number(product?.qty || 0);
    if (!product || qty > Number(availableNow || 0)) {
      await supabase.from("work_order_parts").update({ status: "Shortage", availability: `Short ${Math.max(0, qty - Number(availableNow || 0))}`, notes: `${part.notes || ""} | Acceptance blocked for ${mechanic}; not enough stock.` }).eq("id", part.id);
      await supabase.from("work_orders").update({ status: "Waiting Parts" }).eq("id", wo.id);
      throw new Error(`${part.product_name || part.sku} does not have enough stock to accept. It was kept in Parts Requests.`);
    }
    const acceptedQty = Number(part.accepted_qty || 0) + qty;
    await supabase.from("work_order_parts").update({
      accepted_qty: acceptedQty,
      status: acceptedQty >= Number(part.qty_needed || 0) ? "Accepted" : "Partially Accepted",
      notes: `${part.notes || ""} | Accepted ${qty} by ${mechanic} on ${new Date().toLocaleString()}`,
    }).eq("id", part.id);
    availableByProductId.set(productKey, Number(availableNow || 0) - qty);
    await supabase.from("products").update({ qty: Number(availableNow || 0) - qty }).eq("id", product.id);
    await upsertOne("stock_movements", {
      reference_no: `SM-${wo.wo_no}-${part.sku}-${Date.now().toString().slice(-5)}`,
      movement_date: today(),
      type: "Repair",
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      vendor: product.source_vendor || "",
      qty: -Math.abs(qty),
      from_warehouse: product.warehouse || "",
      unit_fifo_cost: Number(part.unit_cost || product.cost || 0),
      total_fifo_cost: qty * Number(part.unit_cost || product.cost || 0),
      document_no: wo.wo_no,
      entered_by: mechanic,
      reason: `Accepted for ${part.issue || "General"} on ${wo.wo_no}`,
    }, "reference_no");
  }
}

async function appendIssueWorkNote(wo, issue, mechanic, note) {
  const row = (wo._issues || []).find((i) => String(i.issue || "").toLowerCase() === String(issue || "").toLowerCase());
  if (!row) return;
  const stamp = `[${new Date().toLocaleString()}] ${mechanic}: ${note}`;
  const work_notes = [row.work_notes, stamp].filter(Boolean).join("\n");
  await supabase.from("work_order_issues").update({ work_notes }).eq("id", row.id);
}

async function invoiceWorkOrder(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  if (!wo) return;
  if (wo.invoice_no) {
    alert(`Already invoiced as ${wo.invoice_no}.`);
    return;
  }
  if (!/closed|complete/i.test(wo.status || "")) {
    alert("Close or complete the work order before invoicing.");
    return;
  }
  const products = productMeta.products?.length ? productMeta.products : await getAll("products");
  const lines = [
    ...(wo._parts || []).filter((p) => Number(p.accepted_qty || 0) > 0).map((p) => {
      const product = products.find((item) => item.id === p.product_id || item.sku === p.sku) || {};
      return { description: `${p.sku} - ${p.product_name}`, unit: product.unit || p.unit || "", qty: Number(p.accepted_qty || 0), rate: Number(p.unit_cost || 0) };
    }),
    ...(wo._labor || []).filter((l) => laborHours(l) > 0).map((l) => ({ description: `${l.mechanic} - ${l.issue || "Labor"}${l.work_done ? `: ${l.work_done}` : ""}`, unit: "Hour", qty: Number(laborHours(l).toFixed(2)), rate: Number(l.hourly_rate || 0) })),
  ];
  if (!lines.length) {
    alert("No accepted parts or completed labor to invoice.");
    return;
  }
  try {
    const invoiceNo = await nextInvoiceNoByType("Work Order");
    const invoice = await upsertOne("invoices", {
      invoice_no: invoiceNo,
      invoice_date: today(),
      due_date: today(),
      customer: wo.bill_to_customer || "Internal",
      type: "Work Order",
      source_ref: wo.wo_no,
      status: "Open",
      notes: `Work order invoice ${wo.wo_no}`,
    }, "invoice_no");
    await upsertMany("invoice_lines", lines.map((line) => ({ ...line, invoice_id: invoice.id })), "id");
    await postInvoiceLedger(invoice, lines);
    await supabase.from("work_orders").update({ invoice_no: invoiceNo, status: "Invoiced" }).eq("id", wo.id);
    alert(`Invoice ${invoiceNo} created for ${wo.wo_no}.`);
    renderRepairsView();
  } catch (error) {
    alert(`Could not invoice ${wo.wo_no}.\n\nProblem: ${error.message || error}\n\nHow to fix: Check that the work order is closed, has accepted parts or completed labor, and the invoice number is not already used.`);
  }
}

async function renderInvoicesView() {
  currentCfg = tableMap.invoices;
  $("viewTitle").textContent = "Invoices";
  $("viewSub").textContent = "Issue customer invoices for sales, rentals, equipment sales, and work orders.";
  const [invoices, lines, payments, customers, workOrders, woIssues, woParts, woLabor] = await Promise.all([getAll("invoices"), getAll("invoice_lines"), getAll("customer_payments"), getAll("customers"), getAll("work_orders"), getAll("work_order_issues"), getAll("work_order_parts"), getAll("work_order_labor")]);
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  productMeta.customerRows = customers;
  const workOrderRows = workOrders.map((wo) => ({
    ...wo,
    _issues: woIssues.filter((row) => row.wo_id === wo.id),
    _parts: woParts.filter((row) => row.wo_id === wo.id),
    _labor: woLabor.filter((row) => row.wo_id === wo.id),
  }));
  currentRows = invoices.sort((a, b) => String(b.invoice_date || "").localeCompare(String(a.invoice_date || "")));
  currentRows.forEach((inv) => {
    inv._lines = lines.filter((line) => line.invoice_id === inv.id);
    inv._paid = payments.filter((p) => p.invoice_no === inv.invoice_no && !/void|reversed/i.test(p.status || "")).reduce((s, p) => s + Number(p.amount || 0), 0);
    inv._workOrder = workOrderRows.find((wo) => wo.wo_no === inv.source_ref || wo.wo_no === inv.invoice_no || wo.invoice_no === inv.invoice_no) || null;
  });
  $("content").innerHTML = `
    <div class="toolbar"><input class="searchbox" id="invoiceSearch" placeholder="Search invoices by invoice #, customer, source, status, item"></div>
    <div class="stats">
      ${statCard("Open Invoices", currentRows.filter((i) => invoiceBalance(i) > 0 && !/void|reversed/i.test(i.status || "")).length, "Receivable documents")}
      ${statCard("Invoice Total", money(currentRows.reduce((s, i) => s + invoiceTotal(i), 0)), "Gross billings")}
      ${statCard("Collected", money(currentRows.reduce((s, i) => s + invoicePaid(i), 0)), "Customer payments")}
      ${statCard("Open Balance", money(currentRows.reduce((s, i) => s + invoiceBalance(i), 0)), "AR remaining")}
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Customer Invoices</strong><span>Parts sales, equipment sales, equipment rental, and work order billing</span></div><div class="actions"><button id="invoiceCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newInvoiceBtn">New invoice</button></div></div>
      <div id="invoiceTableHost">${invoiceTableHtml(currentRows)}</div>
    </section>`;
  $("invoiceSearch").oninput = renderFilteredInvoices;
  $("invoiceCsvBtn").onclick = exportInvoicesCsv;
  $("newInvoiceBtn").onclick = () => openInvoiceModal();
  bindInvoiceRows();
}

function renderFilteredInvoices() {
  const q = $("invoiceSearch").value.toLowerCase();
  const rows = currentRows.filter((i) => !q || [Object.values(i).join(" "), (i._lines || []).map((l) => l.description).join(" ")].join(" ").toLowerCase().includes(q));
  $("invoiceTableHost").innerHTML = invoiceTableHtml(rows);
  bindInvoiceRows();
}

function invoiceTableHtml(rows) {
  const heads = ["Invoice #", "Date", "Due", "Customer", "Type", "Source", "Amount", "Paid", "Balance", "Status", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(invoiceRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No invoices yet.</td></tr>`}</tbody></table></div>`;
}

function invoiceRowHtml(inv) {
  const displayStatus = invoiceDisplayStatus(inv);
  const locked = /paid|void|reversed/i.test(displayStatus);
  const canPay = invoiceBalance(inv) > 0 && !/void|reversed/i.test(displayStatus);
  return `<tr>
    <td>${esc(inv.invoice_no)}</td><td>${esc(inv.invoice_date || "")}</td><td>${esc(inv.due_date || "")}</td><td>${esc(inv.customer || "")}</td><td>${esc(inv.type || "")}</td><td>${esc(inv.source_ref || "")}</td>
    <td>${money(invoiceTotal(inv))}</td><td>${money(invoicePaid(inv))}</td><td>${money(invoiceBalance(inv))}</td><td>${badge(displayStatus)}</td>
    <td><div class="rowactions">${canPay ? `<button class="rowbtn" type="button" data-invoice-pay="${esc(inv.invoice_no)}">Pay</button>` : ""}<button class="rowbtn" type="button" data-invoice-print="${esc(inv.invoice_no)}">Print</button>${locked ? "" : `<button class="rowbtn" type="button" data-invoice-edit="${esc(inv.invoice_no)}">Edit</button>`}${/void|reversed/i.test(displayStatus) ? "" : `<button class="rowbtn danger" type="button" data-invoice-reverse="${esc(inv.invoice_no)}">Reverse</button>`}</div></td>
  </tr>`;
}

function bindInvoiceRows() {
  document.querySelectorAll("[data-invoice-pay]").forEach((b) => b.onclick = () => openCustomerPaymentModal(currentRows.find((i) => i.invoice_no === b.dataset.invoicePay)));
  document.querySelectorAll("[data-invoice-print]").forEach((b) => b.onclick = () => printCustomerInvoice(b.dataset.invoicePrint));
  document.querySelectorAll("[data-invoice-edit]").forEach((b) => b.onclick = () => openInvoiceModal(currentRows.find((i) => i.invoice_no === b.dataset.invoiceEdit)));
  document.querySelectorAll("[data-invoice-reverse]").forEach((b) => b.onclick = () => reverseInvoice(b.dataset.invoiceReverse));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function invoiceTotal(inv) {
  return (inv._lines || []).reduce((s, l) => s + Number(l.qty || 0) * Number(l.rate || 0), 0);
}

function invoicePaid(inv) {
  return Number(inv._paid || 0);
}

function invoiceBalance(inv) {
  if (/void|reversed/i.test(inv.status || "")) return 0;
  return Math.max(0, invoiceTotal(inv) - invoicePaid(inv));
}

function invoiceDisplayStatus(inv) {
  if (inv.status === "Void") return "Void";
  if (/reversed/i.test(inv.status || "")) return "Reversed";
  const balance = invoiceBalance(inv);
  const total = invoiceTotal(inv);
  if (balance <= 0 && total > 0) return "Paid";
  if (balance < total) return "Partial";
  return inv.status || "Open";
}

async function openInvoiceModal(inv = null) {
  if (inv && /paid|void|reversed/i.test(invoiceDisplayStatus(inv))) {
    alert(`Invoice ${inv.invoice_no} is ${invoiceDisplayStatus(inv)} and cannot be edited. Use Reverse if it needs to be corrected.`);
    return;
  }
  editing = inv;
  const invoiceNo = inv?.invoice_no || await nextInvoiceNoByType("Parts Sales");
  const lines = inv?._lines?.length ? inv._lines : [{ description: "", unit: "", qty: 1, rate: 0 }];
  $("modalTitle").textContent = inv ? `Edit invoice ${inv.invoice_no}` : "New customer invoice";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Invoice #", "invoice_no", invoiceNo)}
      ${productInput("Invoice date", "invoice_date", inv?.invoice_date || today(), "date")}
      ${productInput("Due date", "due_date", inv?.due_date || today(), "date")}
      ${productSelect("Customer", "customer", productMeta.customers || [], inv?.customer || "", "New customer")}
      ${productSelect("Invoice type", "type", ["Parts Sales", "Equipment Sale", "Equipment Rental", "Work Order", "Other"], inv?.type || "Parts Sales")}
      ${productInput("Source reference", "source_ref", inv?.source_ref || "")}
      ${productSelect("Status", "status", ["Open", "Sent", "Partial", "Paid", "Void"], inv?.status || "Open")}
      <div class="field wide"><label>Invoice lines</label>${invoiceLineRows(lines)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(inv?.notes || "")}</textarea></div>
    </div>
    <p class="notice">Invoice lines are saved separately for clean reporting, aging, payments, and statements.</p>`;
  $("modalSave").onclick = saveInvoiceModal;
  $("modal").style.display = "flex";
  $("addInvoiceLineBtn").onclick = addInvoiceLineRow;
  if (!inv) {
    const typeInput = document.querySelector('[data-product-field="type"]');
    const invoiceInput = document.querySelector('[data-product-field="invoice_no"]');
    if (typeInput && invoiceInput) {
      typeInput.onchange = async () => {
        invoiceInput.value = await nextInvoiceNoByType(typeInput.value);
      };
    }
  }
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateCustomerInOpenModal());
}

function invoiceLineRows(lines) {
  const rows = [...lines, ...Array.from({ length: Math.max(0, 5 - lines.length) }, () => ({ description: "", unit: "", qty: "", rate: "" }))];
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Description</th><th>UOM</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody id="invoiceLineBody">${rows.map((line, i) => invoiceLineRowHtml(line, i)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addInvoiceLineBtn">Add row</button></div>`;
}

function invoiceLineRowHtml(line = {}, index = 0) {
  return `<tr><td><input data-invoice-line="description" data-line-index="${index}" value="${esc(line.description || "")}"></td><td><input data-invoice-line="unit" data-line-index="${index}" value="${esc(line.unit || "")}" placeholder="ea, box, hr"></td><td><input type="number" step="0.01" data-invoice-line="qty" data-line-index="${index}" value="${esc(line.qty ?? "")}"></td><td><input type="number" step="0.01" data-invoice-line="rate" data-line-index="${index}" value="${esc(line.rate ?? "")}"></td><td>${money(Number(line.qty || 0) * Number(line.rate || 0))}</td></tr>`;
}

function addInvoiceLineRow() {
  const body = $("invoiceLineBody");
  const index = body.querySelectorAll("tr").length;
  body.insertAdjacentHTML("beforeend", invoiceLineRowHtml({}, index));
}

function parseInvoiceModalLines() {
  return [...document.querySelectorAll("#invoiceLineBody tr")].map((tr) => {
    const get = (field) => tr.querySelector(`[data-invoice-line="${field}"]`)?.value || "";
    return { description: get("description"), unit: get("unit"), qty: Number(get("qty") || 0), rate: Number(get("rate") || 0) };
  }).filter((line) => line.description && line.qty > 0);
}

async function saveInvoiceModal() {
  if (editing && /paid|void|reversed/i.test(invoiceDisplayStatus(editing))) {
    alert(`Invoice ${editing.invoice_no} is ${invoiceDisplayStatus(editing)} and cannot be edited. Use Reverse if it needs to be corrected.`);
    return;
  }
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  const lines = parseInvoiceModalLines();
  if (!record.invoice_no || !record.invoice_date || !record.due_date || !record.customer || !record.type || !lines.length) {
    alert("Invoice #, dates, customer, type, and at least one invoice line are required.");
    return;
  }
  if (isLockedAccountingDate(record.invoice_date) || isLockedAccountingDate(record.due_date)) {
    alert("This invoice date is inside the closed accounting period.");
    return;
  }
  try {
    const wasNew = !editing;
    const saved = await upsertOne("invoices", record, "invoice_no");
    await supabase.from("invoice_lines").delete().eq("invoice_id", saved.id);
    await upsertMany("invoice_lines", lines.map((line) => ({ ...line, invoice_id: saved.id })), "id");
    if (wasNew) await incrementSequence("invoice");
    closeModal();
    renderInvoicesView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function reverseInvoice(invoiceNo) {
  const invoice = currentRows.find((i) => i.invoice_no === invoiceNo);
  if (!invoice || /void|reversed/i.test(invoice.status || "")) return;
  if (isLockedAccountingDate(invoice.invoice_date) || isLockedAccountingDate(today())) {
    alert("This invoice is inside the closed accounting period.");
    return;
  }
  if (!confirm(`Reverse invoice ${invoiceNo}? This keeps the invoice record, marks related customer payments as Reversed, and posts reversing accounting entries.`)) return;
  try {
    const reversalDate = today();
    const originalNotes = invoice.notes ? `${invoice.notes}\n` : "";
    await supabase.from("invoices").update({
      status: "Reversed",
      notes: `${originalNotes}Reversed on ${reversalDate}. Original total ${money(invoiceTotal(invoice))}; paid ${money(invoicePaid(invoice))}.`,
    }).eq("id", invoice.id);
    await supabase.from("customer_payments").update({ status: "Reversed" }).eq("invoice_no", invoiceNo).neq("status", "Void");
    const { data: ledgerRows, error } = await supabase.from("general_ledger").select("*").eq("invoice_no", invoiceNo).neq("source", "Invoice Reversal");
    if (error) throw error;
    const reversalRows = (ledgerRows || []).filter((row) => row.status !== "Reversed").map((row) => ({
      entry_date: reversalDate,
      posting_date: reversalDate,
      account: row.account,
      customer: row.customer,
      vendor: row.vendor,
      invoice_no: row.invoice_no,
      invoice_date: row.invoice_date,
      due_date: row.due_date,
      mechanic: row.mechanic,
      asset: row.asset,
      description: `Reversal of ${row.description || invoiceNo}`,
      reference: `REV-${row.reference || invoiceNo}`,
      debit: Number(row.credit || 0),
      credit: Number(row.debit || 0),
      source: "Invoice Reversal",
      status: "Posted",
    })).filter((row) => row.debit || row.credit);
    if (reversalRows.length) await upsertMany("general_ledger", reversalRows, "id");
    renderInvoicesView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function createCustomerInvoice({ customer, type, source_ref, invoice_date, due_date, notes, lines }) {
  const invoiceNo = await nextInvoiceNoByType(type);
  const invoice = await upsertOne("invoices", { invoice_no: invoiceNo, invoice_date: invoice_date || today(), due_date: due_date || invoice_date || today(), customer, type, source_ref, status: "Open", notes }, "invoice_no");
  await upsertMany("invoice_lines", (lines || []).map((line) => ({ invoice_id: invoice.id, description: line.description, unit: line.unit || "", qty: Number(line.qty || 0), rate: Number(line.rate || 0) })).filter((line) => line.description && line.qty > 0), "id");
  await postInvoiceLedger(invoice, lines || []);
  return invoiceNo;
}

async function nextInvoiceNoByType(type = "") {
  const prefix = invoiceNumberPrefix(type);
  const rows = await getAll("invoices");
  const nums = rows
    .map((row) => String(row.invoice_no || ""))
    .filter((no) => no.startsWith(prefix))
    .map((no) => Number(no.slice(prefix.length).replace(/\D/g, "")))
    .filter(Boolean);
  return `${prefix}${Math.max(9999, ...nums) + 1}`;
}

function invoiceNumberPrefix(type = "") {
  if (/work order/i.test(type)) return "WO-";
  if (/parts/i.test(type)) return "P";
  return "M";
}

async function postInvoiceLedger(invoice, lines) {
  const total = (lines || []).reduce((s, l) => s + Number(l.qty || 0) * Number(l.rate || 0), 0);
  if (!total) return;
  const revenueAccount = /rental/i.test(invoice.type || "") ? "Sales - Equipment Rental" : /work order/i.test(invoice.type || "") ? "LMS Service - Sales" : /equipment sale/i.test(invoice.type || "") ? "Other Sales" : "Parts Sales";
  await upsertMany("general_ledger", [
    { entry_date: invoice.invoice_date, posting_date: invoice.invoice_date, account: "Accounts Receivable (A/R)", customer: invoice.customer, invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, due_date: invoice.due_date, description: `${invoice.type} invoice`, reference: invoice.invoice_no, debit: total, credit: 0, source: "Invoice", status: "Posted" },
    { entry_date: invoice.invoice_date, posting_date: invoice.invoice_date, account: revenueAccount, customer: invoice.customer, invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, due_date: invoice.due_date, description: `${invoice.type} invoice`, reference: invoice.invoice_no, debit: 0, credit: total, source: "Invoice", status: "Posted" },
  ], "id");
}

function printCustomerInvoice(invoiceNo) {
  const inv = currentRows.find((i) => i.invoice_no === invoiceNo);
  if (!inv) return;
  const customer = (productMeta.customerRows || []).find((c) => c.name === inv.customer) || {};
  const html = printableDocumentHtml({
    title: "Customer Invoice",
    number: inv.invoice_no,
    date: inv.invoice_date,
    partyLabel: "Customer",
    partyName: inv.customer,
    partyAddress: customer.address || "",
    meta: [["Due Date", inv.due_date], ["Type", inv.type], ["Source", inv.source_ref || ""], ["Status", invoiceDisplayStatus(inv)]],
    heads: ["Description", "UOM", "Qty", "Rate", "Amount"],
    lines: (inv._lines || []).map((line) => [line.description, line.unit || "", line.qty, money(line.rate), money(Number(line.qty || 0) * Number(line.rate || 0))]),
    total: invoiceTotal(inv),
    notes: inv.notes || "",
    extraHtml: workOrderInvoiceNarrativeHtml(inv),
  });
  openPrintWindow(html, inv.invoice_no);
}

function workOrderInvoiceNarrativeHtml(inv) {
  if (!/work order/i.test(inv.type || "") || !inv._workOrder) return "";
  const wo = inv._workOrder;
  const events = workOrderNarrativeEvents(wo);
  if (!events.length) return "";
  return `<section class="narrative">
    <h2>Work Performed</h2>
    <p>Work order ${esc(wo.wo_no || inv.source_ref || "")}${wo.asset_tag ? ` for asset ${esc(wo.asset_tag)}` : ""}.</p>
    <ol>${events.map((event) => `<li><strong>${esc(event.date || "")}</strong><br>${event.lines.map((line) => esc(line)).join("<br>")}</li>`).join("")}</ol>
  </section>`;
}

function workOrderNarrativeEvents(wo) {
  const events = [];
  (wo._issues || []).forEach((issue) => {
    const lines = [];
    lines.push(`Issue: ${issue.issue || "General work order"}${issue.status ? ` (${issue.status})` : ""}${issue.assigned_mechanic ? ` - assigned to ${issue.assigned_mechanic}` : ""}.`);
    if (issue.work_notes) lines.push(`Notes: ${issue.work_notes}`);
    events.push({ date: issue.issue_date || wo.wo_date || "", sort: `${issue.issue_date || wo.wo_date || ""}T00:00:00.000Z`, lines });
  });
  (wo._labor || []).forEach((labor) => {
    const hours = laborHours(labor);
    const lines = [];
    lines.push(`${labor.mechanic || "Mechanic"} worked on ${labor.issue || "General work order"}${hours ? ` for ${hours.toFixed(2)} hour(s)` : ""}.`);
    if (labor.clock_in || labor.clock_out) lines.push(`Time: ${formatDateTime(labor.clock_in)}${labor.clock_out ? ` to ${formatDateTime(labor.clock_out)}` : " to still open"}.`);
    if (labor.work_done) lines.push(`Work done: ${labor.work_done}`);
    events.push({ date: String(labor.clock_in || wo.wo_date || "").slice(0, 10), sort: labor.clock_in || `${wo.wo_date || ""}T12:00:00.000Z`, lines });
  });
  if (!events.length && wo.description) {
    events.push({ date: wo.wo_date || "", sort: `${wo.wo_date || ""}T00:00:00.000Z`, lines: [`Work requested: ${wo.description}`] });
  }
  return events.sort((a, b) => String(a.sort || "").localeCompare(String(b.sort || "")));
}

function exportInvoicesCsv() {
  const heads = ["Invoice", "Date", "Due", "Customer", "Type", "Source", "Amount", "Paid", "Balance", "Status"];
  downloadCsv([heads, ...currentRows.map((i) => [i.invoice_no, i.invoice_date, i.due_date, i.customer, i.type, i.source_ref, invoiceTotal(i), invoicePaid(i), invoiceBalance(i), invoiceDisplayStatus(i)])], "customer-invoices.csv");
}

async function renderCustomerPaymentsView() {
  currentCfg = tableMap.payments;
  $("viewTitle").textContent = "Customer Payments";
  $("viewSub").textContent = "Receive and track accounts receivable payments.";
  const [payments, invoices, lines, customers] = await Promise.all([getAll("customer_payments"), getAll("invoices"), getAll("invoice_lines"), getAll("customers")]);
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  productMeta.customerRows = customers;
  productMeta.invoiceRows = invoices.map((inv) => ({ ...inv, _lines: lines.filter((line) => line.invoice_id === inv.id), _paid: payments.filter((p) => p.invoice_no === inv.invoice_no && !/void|reversed/i.test(p.status || "")).reduce((s, p) => s + Number(p.amount || 0), 0) }));
  currentRows = payments.sort((a, b) => String(b.payment_date || "").localeCompare(String(a.payment_date || "")));
  $("content").innerHTML = `
    <div class="toolbar"><input class="searchbox" id="paymentSearch" placeholder="Search payments by receipt, customer, invoice, method, bank reference"></div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Customer Payments</strong><span>Payments applied to open invoices and bank reconciliation.</span></div><div class="actions"><button id="paymentCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newPaymentBtn">Receive payment</button></div></div>
      <div id="paymentTableHost">${paymentTableHtml(currentRows)}</div>
    </section>`;
  $("paymentSearch").oninput = renderFilteredPayments;
  $("paymentCsvBtn").onclick = exportPaymentsCsv;
  $("newPaymentBtn").onclick = () => openCustomerPaymentModal();
  bindPaymentRows();
}

function renderFilteredPayments() {
  const q = $("paymentSearch").value.toLowerCase();
  const rows = currentRows.filter((p) => !q || Object.values(p).join(" ").toLowerCase().includes(q));
  $("paymentTableHost").innerHTML = paymentTableHtml(rows);
  bindPaymentRows();
}

function paymentTableHtml(rows) {
  const heads = ["Receipt #", "Date", "Customer", "Invoice", "Amount", "Method", "Bank Ref", "Status", "Notes", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(paymentRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No customer payments yet.</td></tr>`}</tbody></table></div>`;
}

function paymentRowHtml(p) {
  return `<tr><td>${esc(p.receipt_no)}</td><td>${esc(p.payment_date || "")}</td><td>${esc(p.customer || "")}</td><td>${esc(p.invoice_no || "")}</td><td>${money(p.amount)}</td><td>${esc(p.method || "")}</td><td>${esc(p.bank_reference || "")}</td><td>${badge(p.status || "Posted")}</td><td>${esc(p.notes || "")}</td><td><div class="rowactions"><button class="rowbtn" type="button" data-payment-edit="${esc(p.receipt_no)}">Edit</button><button class="rowbtn danger" type="button" data-payment-delete="${esc(p.receipt_no)}">Delete</button></div></td></tr>`;
}

function bindPaymentRows() {
  document.querySelectorAll("[data-payment-edit]").forEach((b) => b.onclick = () => openCustomerPaymentModal(null, currentRows.find((p) => p.receipt_no === b.dataset.paymentEdit)));
  document.querySelectorAll("[data-payment-delete]").forEach((b) => b.onclick = () => deleteCustomRow("customer_payments", "receipt_no", b.dataset.paymentDelete, renderCustomerPaymentsView));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function openCustomerPaymentModal(invoice = null, payment = null) {
  editing = payment;
  if (!productMeta.invoiceRows) {
    const [payments, invoices, lines, customers] = await Promise.all([getAll("customer_payments"), getAll("invoices"), getAll("invoice_lines"), getAll("customers")]);
    productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
    productMeta.invoiceRows = invoices.map((inv) => ({ ...inv, _lines: lines.filter((line) => line.invoice_id === inv.id), _paid: payments.filter((p) => p.invoice_no === inv.invoice_no && !/void|reversed/i.test(p.status || "")).reduce((s, p) => s + Number(p.amount || 0), 0) }));
  }
  const receiptNo = payment?.receipt_no || await nextRefPreview("payment", "PAY-", "customer_payments", "receipt_no");
  const selectedInvoice = invoice || productMeta.invoiceRows.find((inv) => inv.invoice_no === payment?.invoice_no) || null;
  $("modalTitle").textContent = payment ? `Edit payment ${payment.receipt_no}` : selectedInvoice ? `Receive payment for ${selectedInvoice.invoice_no}` : "Receive customer payment";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Receipt #", "receipt_no", receiptNo)}
      ${productInput("Payment date", "payment_date", payment?.payment_date || today(), "date")}
      ${productSelect("Customer", "customer", productMeta.customers || [], payment?.customer || selectedInvoice?.customer || "")}
      ${invoiceLookupInput(selectedInvoice || payment)}
      ${productInput("Open balance", "open_balance", selectedInvoice ? money(invoiceBalance(selectedInvoice)) : "", "text")}
      ${productInput("Amount received", "amount", payment?.amount ?? (selectedInvoice ? invoiceBalance(selectedInvoice) : 0), "number")}
      ${productSelect("Payment method", "method", ["Cash", "Check", "ACH", "Credit Card", "Wire", "Other"], payment?.method || "ACH")}
      ${productInput("Bank reference", "bank_reference", payment?.bank_reference || "")}
      ${productSelect("Status", "status", ["Posted", "Void"], payment?.status || "Posted")}
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(payment?.notes || (selectedInvoice ? `Payment for ${selectedInvoice.invoice_no}` : ""))}</textarea></div>
    </div>
    <p class="notice">Payment cannot exceed the open invoice balance. Posting creates a matched bank transaction and AR ledger entries.</p>`;
  $("modalSave").onclick = saveCustomerPaymentModal;
  $("modal").style.display = "flex";
  document.querySelector('[data-product-field="open_balance"]')?.setAttribute("readonly", "readonly");
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateCustomerInOpenModal());
}

function invoiceLookupInput(selected) {
  const options = (productMeta.invoiceRows || []).filter((inv) => invoiceBalance(inv) > 0 || inv.invoice_no === selected?.invoice_no).map((inv) => `${inv.invoice_no} | ${inv.customer} | ${inv.type} | ${inv.source_ref || "no source"} | balance ${money(invoiceBalance(inv))}`);
  const value = selected?.invoice_no ? options.find((o) => o.startsWith(`${selected.invoice_no} |`)) || selected.invoice_no : "";
  return `<div class="field wide"><label>Search invoice to collect</label><input class="suggest-input" list="paymentInvoiceOptions" data-product-field="invoice_lookup" value="${esc(value)}" placeholder="Search invoice, source, type, balance" autocomplete="off"><datalist id="paymentInvoiceOptions">${options.map((o) => `<option value="${esc(o)}"></option>`).join("")}</datalist></div>`;
}

function invoiceFromPaymentLookup(value) {
  const q = String(value || "").toLowerCase();
  return (productMeta.invoiceRows || []).find((inv) => q.includes(String(inv.invoice_no || "").toLowerCase())) || null;
}

async function saveCustomerPaymentModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  const invoice = invoiceFromPaymentLookup(record.invoice_lookup || record.invoice_no || "");
  if (!invoice) {
    alert("Please choose a valid open invoice.");
    return;
  }
  record.invoice_no = invoice.invoice_no;
  delete record.invoice_lookup;
  delete record.open_balance;
  record.amount = Number(record.amount || 0);
  const balance = invoiceBalance(invoice) + (editing?.invoice_no === invoice.invoice_no ? Number(editing.amount || 0) : 0);
  if (!record.receipt_no || !record.payment_date || !record.customer || record.amount <= 0 || !record.method) {
    alert("Receipt #, date, customer, invoice, amount, and method are required.");
    return;
  }
  if (record.amount > balance + 0.005) {
    alert(`Payment cannot exceed open balance of ${money(balance)}.`);
    return;
  }
  if (isLockedAccountingDate(record.payment_date)) {
    alert("This payment date is inside the closed accounting period.");
    return;
  }
  try {
    const wasNew = !editing;
    await upsertOne("customer_payments", record, "receipt_no");
    if (record.status !== "Void") await postCustomerPayment(record, invoice);
    await updateInvoicePaymentStatus(invoice.invoice_no);
    if (wasNew) await incrementSequence("payment");
    closeModal();
    currentView === "invoices" ? renderInvoicesView() : renderCustomerPaymentsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function postCustomerPayment(payment, invoice) {
  await upsertOne("bank_transactions", { tx_date: payment.payment_date, description: `Customer payment ${payment.customer} ${invoice.invoice_no}`, reference: payment.bank_reference || payment.receipt_no, amount: Number(payment.amount || 0), status: "Matched", matched_reference: invoice.invoice_no, notes: payment.notes || null }, "id");
  await upsertMany("general_ledger", [
    { entry_date: payment.payment_date, posting_date: payment.payment_date, account: "FHB Checking", customer: payment.customer, invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, due_date: invoice.due_date, description: `Customer payment ${invoice.invoice_no}`, reference: payment.receipt_no, debit: Number(payment.amount || 0), credit: 0, source: "Customer Payment", status: "Posted" },
    { entry_date: payment.payment_date, posting_date: payment.payment_date, account: "Accounts Receivable (A/R)", customer: payment.customer, invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, due_date: invoice.due_date, description: `Customer payment ${invoice.invoice_no}`, reference: payment.receipt_no, debit: 0, credit: Number(payment.amount || 0), source: "Customer Payment", status: "Posted" },
  ], "id");
}

async function updateInvoicePaymentStatus(invoiceNo) {
  const [payments, invoices, lines] = await Promise.all([getAll("customer_payments"), getAll("invoices"), getAll("invoice_lines")]);
  const inv = invoices.find((i) => i.invoice_no === invoiceNo);
  if (!inv) return;
  inv._lines = lines.filter((line) => line.invoice_id === inv.id);
  if (/void|reversed/i.test(inv.status || "")) return;
  inv._paid = payments.filter((p) => p.invoice_no === invoiceNo && !/void|reversed/i.test(p.status || "")).reduce((s, p) => s + Number(p.amount || 0), 0);
  const status = invoiceBalance(inv) <= 0.005 ? "Paid" : inv._paid > 0 ? "Partial" : "Open";
  await supabase.from("invoices").update({ status }).eq("id", inv.id);
}

function exportPaymentsCsv() {
  const heads = ["Receipt", "Date", "Customer", "Invoice", "Amount", "Method", "Bank Ref", "Status", "Notes"];
  downloadCsv([heads, ...currentRows.map((p) => [p.receipt_no, p.payment_date, p.customer, p.invoice_no, p.amount, p.method, p.bank_reference, p.status, p.notes])], "customer-payments.csv");
}

async function renderSuppliesIssuanceView() {
  currentCfg = {
    title: "Supplies Issuance",
    sub: "Issue supplies to employees or mechanics, with optional work order charging.",
    heads: ["reference_no", "movement_date", "issued_to", "wo_no", "sku", "product_name", "qty", "warehouse", "unit_cost", "amount", "status", "notes"],
    labels: ["Reference #", "Date", "Issued To", "WO #", "SKU", "Product", "Qty", "Warehouse", "Unit Cost", "Amount", "Status", "Notes"],
  };
  $("viewTitle").textContent = "Supplies Issuance";
  $("viewSub").textContent = "Issue supplies to employees or mechanics, and optionally charge them to a work order.";
  const [products, movements, mechanics, workOrders, workOrderParts] = await Promise.all([
    getAll("products"),
    getAll("stock_movements"),
    getAll("mechanics"),
    getAll("work_orders"),
    getAll("work_order_parts"),
  ]);
  productMeta.products = products.sort((a, b) => String(a.sku || "").localeCompare(String(b.sku || "")));
  productMeta.mechanics = mechanics.map((m) => m.name).filter(Boolean).sort();
  productMeta.workOrders = workOrders.sort((a, b) => String(b.wo_date || "").localeCompare(String(a.wo_date || "")));
  currentRows = supplyIssueRows({ movements, workOrders, workOrderParts, products });
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="supplySearch" placeholder="Search supplies by reference, employee, mechanic, WO, SKU, product">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Supplies Issuance</strong><span>Direct employee/mechanic issue or work-order issue.</span></div><div class="actions"><button id="suppliesCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newSupplyIssueBtn">New issue</button></div></div>
      <div class="notice">Use this for shop supplies, consumables, and mechanic-issued items. Choose a work order when the supply should be part of that WO history and cost.</div>
      <div id="supplyTableHost">${supplyIssueTableHtml(currentRows)}</div>
    </section>`;
  $("supplySearch").oninput = renderFilteredSupplyIssues;
  $("suppliesCsvBtn").onclick = exportCurrentCsv;
  $("newSupplyIssueBtn").onclick = openSupplyIssueModal;
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  bindSupplyIssueRows();
}

function supplyIssueRows({ movements = [], workOrders = [], workOrderParts = [], products = [] }) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const woById = new Map(workOrders.map((wo) => [wo.id, wo]));
  const direct = movements.filter((m) => /supplies issue/i.test(m.type || "")).map((m) => ({
    reference_no: m.reference_no,
    movement_date: m.movement_date,
    issued_to: m.sold_to || "",
    wo_no: /^WO-/i.test(m.document_no || "") ? m.document_no : "",
    sku: m.sku,
    product_name: m.product_name,
    qty: Math.abs(Number(m.qty || 0)),
    warehouse: m.from_warehouse || "",
    unit_cost: Number(m.unit_fifo_cost || 0),
    amount: Math.abs(Number(m.qty || 0)) * Number(m.unit_fifo_cost || 0),
    status: "Posted",
    notes: m.reason || "",
  }));
  const workOrderIssued = workOrderParts.filter((part) => /supply issue|supplies issue/i.test(part.notes || "") || /supplies/i.test(part.issue || "")).map((part) => {
    const wo = woById.get(part.wo_id) || {};
    const product = productById.get(part.product_id) || {};
    const notes = String(part.notes || "");
    const ref = notes.match(/SM-\d+/)?.[0] || `WO-${part.id?.slice?.(0, 8) || ""}`;
    const issueDate = notes.match(/ on (\d{4}-\d{2}-\d{2}) /i)?.[1] || wo.wo_date || "";
    const qty = Number(part.accepted_qty || part.qty_needed || 0);
    return {
      reference_no: ref,
      movement_date: issueDate,
      issued_to: notes.match(/to ([^|]+)/i)?.[1]?.trim() || notes || "",
      wo_no: wo.wo_no || "",
      sku: part.sku,
      product_name: part.product_name || product.name || "",
      qty,
      warehouse: product.warehouse || "",
      unit_cost: Number(part.unit_cost || product.cost || 0),
      amount: qty * Number(part.unit_cost || product.cost || 0),
      status: part.status || "Issued",
      notes,
    };
  });
  return [...direct, ...workOrderIssued].sort((a, b) => String(b.movement_date || "").localeCompare(String(a.movement_date || "")));
}

function supplyIssueTableHtml(rows) {
  return `<div class="table-wrap"><table><thead><tr>${currentCfg.labels.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${currentCfg.labels.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${currentCfg.heads.map((h) => `<td>${supplyIssueCell(h, row)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${currentCfg.heads.length}" class="empty">No supplies issued yet.</td></tr>`}</tbody></table></div>`;
}

function supplyIssueCell(field, row) {
  if (field === "wo_no" && row[field]) return `<button class="linkbtn" type="button" data-supply-wo="${esc(row[field])}">${esc(row[field])}</button>`;
  if (["unit_cost", "amount"].includes(field)) return money(row[field]);
  if (field === "status") return badge(row[field]);
  return esc(row[field] ?? "");
}

function renderFilteredSupplyIssues() {
  const q = ($("supplySearch")?.value || "").toLowerCase();
  const rows = currentRows.filter((row) => !q || Object.values(row).join(" ").toLowerCase().includes(q));
  $("supplyTableHost").innerHTML = supplyIssueTableHtml(rows);
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  bindSupplyIssueRows();
}

function bindSupplyIssueRows() {
  document.querySelectorAll("[data-supply-wo]").forEach((b) => b.onclick = () => loadView("repairs"));
}

async function openSupplyIssueModal() {
  const reference = await nextRefPreview("stock", "SM-", "stock_movements", "reference_no");
  $("modalTitle").textContent = `New supplies issue ${reference}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Reference #", "reference_no", reference)}
      ${productInput("Issue date", "movement_date", today(), "date")}
      ${productSelect("Issued to employee / mechanic", "issued_to", productMeta.mechanics || [], "")}
      <div class="field"><label>Work order (optional)</label><input class="suggest-input" list="supplyWoOptions" data-product-field="wo_lookup" placeholder="Search WO, asset, customer, status" autocomplete="off">${workOrderOptionsDatalist()}</div>
      <div class="field wide"><label>Supply / product</label><input class="suggest-input" list="poProductOptions" data-product-field="product_lookup" placeholder="Search SKU, product, vendor" autocomplete="off">${productOptionsDatalist()}</div>
      ${productInput("Quantity to issue", "qty", "", "number")}
      ${productInput("Unit cost", "unit_cost", "", "number")}
      ${productInput("Warehouse / bin", "warehouse", "")}
      ${productInput("WO issue / use", "issue", "Supplies issuance")}
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes"></textarea></div>
    </div>
    <p class="notice">If a work order is selected, the supply is added as an issued WO line and inventory is deducted. If no WO is selected, it posts as a direct employee/mechanic supplies issue.</p>`;
  $("modalSave").onclick = saveSupplyIssueModal;
  $("modal").style.display = "flex";
}

function workOrderOptionsDatalist() {
  const options = (productMeta.workOrders || []).map((wo) => `${wo.wo_no} | ${wo.asset_tag || "no asset"} | ${wo.bill_to_customer || "internal"} | ${wo.status || ""}`);
  return `<datalist id="supplyWoOptions">${options.map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
}

function resolveWorkOrderLookup(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const key = text.split("|")[0].trim().toLowerCase();
  return (productMeta.workOrders || []).find((wo) => String(wo.wo_no || "").toLowerCase() === key || text.toLowerCase().includes(String(wo.wo_no || "").toLowerCase())) || null;
}

async function saveSupplyIssueModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  const product = resolveProductLookup(record.product_lookup);
  const workOrder = resolveWorkOrderLookup(record.wo_lookup);
  const qty = Number(record.qty || 0);
  if (!record.reference_no || !record.movement_date || !record.issued_to || !product || qty <= 0) {
    alert("Reference #, date, issued to, product, and quantity are required.");
    return;
  }
  if (qty > Number(product.qty || 0)) {
    alert(`Only ${product.qty || 0} available for ${product.sku}. Receive stock first or create a parts request.`);
    return;
  }
  if (record.wo_lookup && !workOrder) {
    alert("Choose a valid work order from the suggestion list, or leave Work order blank for direct issue.");
    return;
  }
  if (workOrder && (workOrder.invoice_no || /invoiced|cancelled/i.test(workOrder.status || ""))) {
    alert(`Work order ${workOrder.wo_no} is locked. Reverse the invoice or reopen the WO before adding supplies.`);
    return;
  }
  const unitCost = Number(record.unit_cost || product.cost || 0);
  const warehouse = record.warehouse || product.warehouse || "";
  try {
    if (workOrder) {
      await upsertOne("work_order_parts", {
        wo_id: workOrder.id,
        issue: record.issue || "Supplies issuance",
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        qty_needed: qty,
        unit_cost: unitCost,
        availability: "OK",
        status: "Issued",
        accepted_qty: qty,
        notes: `Supply issue ${record.reference_no} on ${record.movement_date} to ${record.issued_to}${record.notes ? ` | ${record.notes}` : ""}`,
      }, "id");
    } else {
      await upsertOne("stock_movements", {
        reference_no: record.reference_no,
        movement_date: record.movement_date,
        type: "Supplies Issue",
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        sold_to: record.issued_to,
        sold_date: record.movement_date,
        qty: -Math.abs(qty),
        from_warehouse: warehouse,
        unit_fifo_cost: unitCost,
        total_fifo_cost: qty * unitCost,
        document_no: record.reference_no,
        entered_by: profile?.full_name || profile?.username || "Owner",
        reason: record.notes || "Supplies issued to employee/mechanic",
      }, "reference_no");
    }
    await supabase.from("products").update({ qty: Number(product.qty || 0) - qty }).eq("id", product.id);
    await postSupplyIssueLedger({ ...record, qty, unit_cost: unitCost, warehouse }, product, workOrder);
    await incrementSequence("stock");
    closeModal();
    renderSuppliesIssuanceView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function postSupplyIssueLedger(record, product, workOrder) {
  const total = Number(record.qty || 0) * Number(record.unit_cost || 0);
  if (!total) return;
  const expenseAccount = workOrder ? "Repairs & Maintenance" : "Job Supplies";
  await upsertMany("general_ledger", [
    { entry_date: record.movement_date, posting_date: record.movement_date, account: expenseAccount, mechanic: record.issued_to, asset: workOrder?.asset_tag || null, description: `${record.issue || "Supplies issue"} ${product.sku}`, reference: record.reference_no, debit: total, credit: 0, source: "Supplies Issue", status: "Posted" },
    { entry_date: record.movement_date, posting_date: record.movement_date, account: "Inventory", mechanic: record.issued_to, asset: workOrder?.asset_tag || null, description: `${record.issue || "Supplies issue"} ${product.sku}`, reference: record.reference_no, debit: 0, credit: total, source: "Supplies Issue", status: "Posted" },
  ], "id");
}

async function deleteCustomRow(table, key, value, refresh) {
  if (!confirm("Delete this record?")) return;
  const { error } = await supabase.from(table).delete().eq(key, value);
  if (error) alert(error.message);
  refresh();
}

async function quickCreateCustomerInOpenModal() {
  const name = prompt("Customer name to create");
  if (!name) return;
  try {
    await upsertOne("customers", { reference: await nextRefPreview("customer", "C-", "customers", "reference"), name: name.trim(), terms: "Net 30" }, "name");
    await incrementSequence("customer");
    productMeta.customers = [...new Set([...(productMeta.customers || []), name.trim()])].sort();
    const customerField = document.querySelector('[data-product-field="customer"], [data-product-field="bill_to_customer"]');
    if (customerField) customerField.value = name.trim();
  } catch (error) {
    alert(error.message || error);
  }
}

function downloadCsv(rows, fileName) {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(content, fileName, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function openPrintWindow(html, title = "document") {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow popups to print or save PDF.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.document.title = title;
}

function printableDocumentHtml({ title, number, date, partyLabel, partyName, partyAddress = "", meta = [], heads = [], lines = [], total = 0, totalLabel = "Total", notes = "", extraHtml = "" }) {
  return `<!doctype html><html><head><title>${esc(number || title)}</title><style>
    @page{size:Letter;margin:.45in}
    *{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#102033;margin:0;background:#fff}
    .sheet{max-width:7.6in;margin:0 auto}
    .print-btn{position:fixed;right:18px;top:18px;padding:9px 13px;border:1px solid #cfd6df;border-radius:7px;background:#fff}
    .top{display:flex;justify-content:space-between;gap:20px;border-bottom:4px solid #075f6d;padding:12px 0 18px;margin-bottom:24px}
    .logo{font-size:38px;line-height:1;font-weight:900;font-style:italic;color:#075f6d;letter-spacing:0}
    .logo small{font-size:13px;font-style:normal;text-transform:uppercase;letter-spacing:2px}
    h1{color:#075f6d;margin:14px 0 0;font-size:28px}
    .doc-meta{text-align:right;font-size:15px;line-height:1.65}
    .boxes{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px}
    .box{border:1px solid #cfd6df;border-radius:7px;padding:13px;min-height:84px}
    .box strong{color:#061b2d}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{border-bottom:1px solid #d8dee8;padding:10px 9px;text-align:left;word-break:break-word}
    th{font-size:11px;text-transform:uppercase;color:#1f3145;background:#eef3f6}
    .num{text-align:right}
    .total-row td{border-bottom:2px solid #cfd6df}
    .total{font-weight:900;font-size:21px;color:#075f6d}
    .narrative{margin-top:22px;page-break-inside:auto}
    .narrative h2{font-size:16px;color:#075f6d;margin:0 0 8px;border-bottom:1px solid #d8dee8;padding-bottom:6px}
    .narrative p{margin:0 0 10px;color:#506178;font-size:12px}
    .narrative ol{margin:0;padding-left:20px}
    .narrative li{margin:0 0 10px;padding-bottom:9px;border-bottom:1px solid #edf1f5;font-size:12px;line-height:1.45;page-break-inside:avoid}
    .notes{margin-top:18px;border-top:1px solid #d8dee8;padding-top:12px;font-size:12px;color:#506178}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:34px;page-break-inside:avoid}
    .sig-box{min-height:112px;border-top:1px solid #0f172a;padding-top:8px;font-size:12px;color:#506178}
    .sig-title{font-weight:800;color:#061b2d;margin-bottom:8px}
    .sig-line{border-bottom:1px solid #cfd6df;height:26px;margin-top:4px}
    .sig-label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#506178;margin-top:5px}
    .sig-pad{width:100%;height:92px;border:1px solid #cfd6df;border-radius:6px;background:#fff;touch-action:none}
    .sig-actions{display:flex;gap:8px;margin:8px 0}.sig-actions button{padding:6px 9px;border:1px solid #cfd6df;border-radius:6px;background:#fff}
    .sig-input{width:100%;border:0;border-bottom:1px solid #cfd6df;padding:6px 0;margin:2px 0 5px;font-size:12px}
    @media print{.print-btn,.sig-actions{display:none}.sheet{max-width:none}.sig-pad{border:0;border-bottom:1px solid #0f172a;border-radius:0}}
  </style></head><body><button class="print-btn" onclick="window.print()">Print / Save PDF</button><main class="sheet"><div class="top"><div><div class="logo">lms <small>imports</small></div><h1>${esc(title)}</h1></div><div class="doc-meta"><strong>${esc(number || "")}</strong><br>Date ${esc(date || "")}</div></div><div class="boxes"><div class="box"><strong>${esc(partyLabel || "Customer")}</strong><br>${esc(partyName || "")}${partyAddress ? `<br>${esc(partyAddress)}` : ""}</div><div class="box">${meta.map(([label, value]) => `<strong>${esc(label)}</strong> ${esc(value || "")}`).join("<br>")}</div></div><table><thead><tr>${heads.map((h, i) => `<th class="${i >= 2 ? "num" : ""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${lines.map((line) => `<tr>${line.map((cellValue, i) => `<td class="${i >= 2 ? "num" : ""}">${esc(cellValue)}</td>`).join("")}</tr>`).join("")}<tr class="total-row"><td colspan="${Math.max(1, heads.length - 1)}" class="num total">${esc(totalLabel)}</td><td class="num total">${money(total)}</td></tr></tbody></table>${extraHtml || ""}${notes ? `<div class="notes"><strong>Notes</strong><br>${esc(notes)}</div>` : ""}${signatureBlockHtml(`${partyLabel || "Customer"} acceptance`)}</main>${signatureScriptHtml()}</body></html>`;
}

function signatureBlockHtml(title = "Customer acceptance") {
  return `<section class="signatures">
    <div class="sig-box">
      <div class="sig-title">${esc(title)}</div>
      <canvas class="sig-pad" width="560" height="150" data-signature-pad></canvas>
      <div class="sig-actions"><button type="button" data-clear-signature>Clear signature</button><span>Sign online before printing or saving PDF</span></div>
      <input class="sig-input" placeholder="Printed name">
      <div class="sig-label">Printed name</div>
      <input class="sig-input" placeholder="Date">
      <div class="sig-label">Date</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Received / Approved by LMS Imports</div>
      <canvas class="sig-pad" width="560" height="150" data-signature-pad></canvas>
      <div class="sig-actions"><button type="button" data-clear-signature>Clear signature</button><span>Internal approval signature</span></div>
      <input class="sig-input" placeholder="Name">
      <div class="sig-label">Name / Signature</div>
      <input class="sig-input" placeholder="Remarks">
      <div class="sig-label">Remarks</div>
    </div>
  </section>`;
}

function signatureScriptHtml() {
  return `<script>
(() => {
  const point = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  document.querySelectorAll("[data-signature-pad]").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    let drawing = false;
    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const p = point(canvas, event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const p = point(canvas, event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    const stop = () => { drawing = false; ctx.beginPath(); };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
  });
  document.querySelectorAll("[data-clear-signature]").forEach((button) => {
    button.addEventListener("click", () => {
      const canvas = button.closest(".sig-box").querySelector("[data-signature-pad]");
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    });
  });
})();
</script>`;
}

async function renderAssetsView() {
  currentCfg = tableMap.assets;
  $("viewTitle").textContent = "Fleet & Equipment";
  $("viewSub").textContent = "Track vehicles, heavy equipment, readings, ownership, and assignments.";
  const [assets, locations, types, workOrders] = await Promise.all([
    getAll("assets"),
    getAll("asset_locations"),
    getAll("asset_types"),
    getAll("work_orders"),
  ]);
  currentRows = attachOpenWorkOrderToAssets(assets, workOrders).sort((a, b) => String(a.asset_tag || "").localeCompare(String(b.asset_tag || "")));
  productMeta.assets = currentRows;
  productMeta.locations = locations.map((l) => l.name).filter(Boolean).sort();
  productMeta.assetTypes = types.map((t) => t.name).filter(Boolean).sort();
  productMeta.workOrders = workOrders;
  const stats = assetStats(currentRows, workOrders);
  $("content").innerHTML = `
    <div class="stats">
      ${statCard("Fleet Assets", currentRows.length, `${currentRows.filter((a) => /in service/i.test(a.status || "")).length} in service`)}
      ${statCard("Needs Repair", stats.needsRepair, "Down or flagged assets")}
      ${statCard("Open Repair Jobs", stats.openJobs, "Scheduled or in progress")}
      ${statCard("Repair Spend", money(stats.repairSpend), "All logged work")}
    </div>
    <div class="toolbar fleet-toolbar">
      <input class="searchbox" id="assetSearch" placeholder="Search fleet and equipment by tag, name, make, model, serial, plate, location">
    </div>
    <section class="panel fleet-panel">
      <div class="panel-head"><div class="panel-title"><strong>Vehicles & Heavy Equipment</strong><span>Ownership, readings, location, operator, and condition</span></div><div class="actions"><button id="assetColumnsBtn">Show / Hide Columns</button><button id="assetCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button id="addLocationBtn">Add location</button><button id="assetQrCsvBtn">Excel + QR</button><button id="loadPdfAssetsBtn">Load PDF Asset Master</button><button class="primary" id="newAssetBtn">Add asset</button></div></div>
      <div class="column-chooser" id="assetColumnChooser" hidden>${assetColumnChooserHtml()}</div>
      <div id="assetTableHost">${assetTableHtml(currentRows)}</div>
    </section>`;
  $("assetSearch").oninput = renderFilteredAssets;
  $("assetColumnsBtn").onclick = () => $("assetColumnChooser").hidden = !$("assetColumnChooser").hidden;
  $("assetCsvBtn").onclick = exportCurrentCsv;
  $("assetQrCsvBtn").onclick = exportAssetsWithQrCsv;
  $("loadPdfAssetsBtn").onclick = replaceAssetMasterFromPdf;
  $("addLocationBtn").onclick = () => quickCreateAssetMaster("location");
  $("newAssetBtn").onclick = () => openAssetModal();
  document.querySelectorAll("[data-asset-column]").forEach((box) => box.onchange = saveAssetColumnChoice);
  bindAssetRows();
}

function assetStats(assets, workOrders) {
  return {
    needsRepair: assets.filter((a) => /repair|out|down/i.test(a.status || "")).length,
    openJobs: workOrders.filter((wo) => !/closed|invoiced|complete|cancel/i.test(wo.status || "")).length,
    repairSpend: workOrders.reduce((sum, wo) => sum + Number(wo.total || 0), 0),
  };
}

async function renderEquipmentRepairQueueView() {
  currentCfg = { heads: ["asset_tag", "name", "location", "status", "_openWoIssue", "wo_no"], labels: ["Asset #", "Description", "Location", "Status", "Issue / Request", "Assigned WO"] };
  $("viewTitle").textContent = "Equipment Subject to Repair";
  $("viewSub").textContent = "Assets scanned or flagged for repair before a work order is assigned.";
  const [assets, workOrders, locations, types, customers] = await Promise.all([
    getAll("assets"),
    getAll("work_orders"),
    getAll("asset_locations"),
    getAll("asset_types"),
    getAll("customers"),
  ]);
  productMeta.assets = attachOpenWorkOrderToAssets(assets, workOrders);
  productMeta.locations = locations.map((l) => l.name).filter(Boolean).sort();
  productMeta.assetTypes = types.map((t) => t.name).filter(Boolean).sort();
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  currentRows = productMeta.assets.filter((asset) => /repair|subject/i.test([asset.status, asset.notes].join(" ")) || asset._openWo);
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="repairAssetSearch" placeholder="Search asset, issue, location, assigned WO">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Equipment Subject to Repair</strong><span>Create or review work orders from scanned repair requests.</span></div><div class="actions"><button id="repairAssetCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button></div></div>
      <div id="repairAssetHost">${equipmentRepairQueueTable(currentRows)}</div>
    </section>`;
  $("repairAssetSearch").oninput = renderFilteredEquipmentRepairQueue;
  $("repairAssetCsvBtn").onclick = exportCurrentCsv;
  bindEquipmentRepairQueue();
}

function equipmentRepairQueueTable(rows) {
  const heads = ["Asset #", "Description", "Location", "Status", "Issue / Request", "Assigned WO", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((asset) => `<tr>
    <td>${esc(asset.asset_tag || "")}</td>
    <td>${esc(asset.name || "")}</td>
    <td>${esc(asset.location || "")}</td>
    <td>${badge(asset.status || "")}</td>
    <td>${esc(asset._openWo?.description || repairRequestText(asset) || "")}</td>
    <td>${asset._openWo ? badge(asset._openWo.wo_no || "") : ""}</td>
    <td><div class="rowactions">${asset._openWo ? `<button class="rowbtn" type="button" data-open-wo="${esc(asset._openWo.wo_no)}">Open WO</button>` : `<button class="rowbtn primary" type="button" data-create-wo-asset="${esc(asset.asset_tag)}">Assign WO</button>`}</div></td>
  </tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No equipment is currently subject to repair.</td></tr>`}</tbody></table></div>`;
}

function repairRequestText(asset) {
  const text = String(asset.notes || "");
  const match = text.match(/Repair requested[^:]*:\s*([^|]+)/i);
  return match ? match[1].trim() : text;
}

function renderFilteredEquipmentRepairQueue() {
  const q = ($("repairAssetSearch")?.value || "").toLowerCase();
  const rows = currentRows.filter((row) => !q || [Object.values(row).join(" "), row._openWoIssue].join(" ").toLowerCase().includes(q));
  $("repairAssetHost").innerHTML = equipmentRepairQueueTable(rows);
  bindEquipmentRepairQueue();
}

function bindEquipmentRepairQueue() {
  document.querySelectorAll("[data-create-wo-asset]").forEach((b) => b.onclick = () => openNewWorkOrderModal({ assetTag: b.dataset.createWoAsset, description: repairRequestText(currentRows.find((a) => a.asset_tag === b.dataset.createWoAsset)) }));
  document.querySelectorAll("[data-open-wo]").forEach((b) => b.onclick = () => {
    loadView("repairs").then(() => {
      const wo = currentRows.find((row) => row.wo_no === b.dataset.openWo);
      if (wo) openWorkOrderEditModal(wo);
    });
  });
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function attachOpenWorkOrderToAssets(assets, workOrders) {
  const openByAsset = new Map();
  (workOrders || [])
    .filter((wo) => wo.asset_tag && !wo.invoice_no && !/closed|complete|invoiced|cancel/i.test(wo.status || ""))
    .sort((a, b) => String(b.wo_date || "").localeCompare(String(a.wo_date || "")))
    .forEach((wo) => {
      if (!openByAsset.has(wo.asset_tag)) openByAsset.set(wo.asset_tag, wo);
    });
  return (assets || []).map((asset) => {
    const wo = openByAsset.get(asset.asset_tag);
    return {
      ...asset,
      _openWo: wo || null,
      _openWoIssue: wo ? [wo.wo_no, wo.description || wo.notes || wo.status].filter(Boolean).join(" - ") : "",
    };
  });
}

function renderFilteredAssets() {
  const q = $("assetSearch").value.toLowerCase();
  const rows = currentRows.filter((row) => !q || Object.values(row).join(" ").toLowerCase().includes(q));
  $("assetTableHost").innerHTML = assetTableHtml(rows);
  bindAssetRows();
}

function assetTableHtml(rows) {
  const columns = assetVisibleColumns();
  const heads = [...columns.map((col) => col[1]), ""];
  return `<div class="table-wrap asset-table-wrap"><table class="asset-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((asset) => assetRowHtml(asset, columns)).join("") : `<tr><td colspan="${heads.length}" class="empty">No fleet or equipment yet.</td></tr>`}</tbody></table></div>`;
}

function assetRowHtml(asset, columns = assetVisibleColumns()) {
  return `<tr data-asset-row="${esc(asset.asset_tag || "")}">
    ${columns.map(([key]) => `<td>${assetCellHtml(asset, key)}</td>`).join("")}
    <td><div class="rowactions"><button class="rowbtn" type="button" data-asset-loc="${esc(asset.asset_tag)}">Loc</button><button class="rowbtn" type="button" data-asset-edit="${esc(asset.asset_tag)}">Edit</button><button class="rowbtn danger" type="button" data-asset-delete="${esc(asset.asset_tag)}">Delete</button></div></td>
  </tr>`;
}

function assetCellHtml(asset, key) {
  const qrText = asset.qr_update_url || assetQrUrl(asset);
  const reading = asset.odometer ? `${asset.odometer} mi` : asset.engine_hours ? `${asset.engine_hours} hr` : "";
  const parent = asset.parent_asset_tag ? currentRows.find((row) => row.asset_tag === asset.parent_asset_tag) : null;
  const parentText = parent ? `${parent.asset_tag} - ${parent.name || ""}` : asset.parent_asset_tag || "";
  const oldQrCode = assetOldQrCode(asset);
  const lastUpdateDate = assetLastUpdateDate(asset);
  const cells = {
    photo: asset.photo_url ? `<img class="thumb" src="${esc(asset.photo_url)}" alt="Photo">` : `<span class="badge">No photo</span>`,
    new_qr: `<button class="qr-button" type="button" data-asset-qr="${esc(asset.asset_tag)}" title="Open QR code"><img class="qr" src="${qrCodeUrl(qrText)}" alt="QR"></button>`,
    old_qr_code: esc(oldQrCode),
    needs_qr_code_printed: `<input type="checkbox" class="asset-check" data-asset-needs-qr="${esc(asset.asset_tag || "")}" ${assetNeedsQrPrinted(asset) ? "checked" : ""} title="Needs QR code printed">`,
    asset_tag: esc(asset.asset_tag || ""),
    description: esc(asset.name || asset.description || ""),
    asset: `<strong>${esc(asset.asset_tag)}</strong><br>${esc(asset.name || asset.description || "")}`,
    type: esc(asset.type || ""),
    general_type: esc(asset.general_type || ""),
    parent_asset: esc(parentText),
    relationship_type: esc(asset.relationship_type || ""),
    compatible_with: esc(asset.compatible_with || ""),
    make_model: esc([asset.make, asset.model].filter(Boolean).join(" ")),
    color: esc(asset.color || ""),
    vin_serial: esc(asset.vin_serial || ""),
    plate: esc(asset.plate || ""),
    location: esc(asset.location || ""),
    last_update_date: esc(lastUpdateDate || ""),
    scanned_date: esc(asset.scanned_date || ""),
    reading: esc(reading),
    assigned_operator: esc(asset.assigned_operator || ""),
    open_wo_issue: asset._openWo ? `<strong>${esc(asset._openWo.wo_no || "")}</strong><br>${esc(asset._openWo.description || asset._openWo.status || "")}` : esc(asset.notes && /repair requested/i.test(asset.notes) ? asset.notes : ""),
    status: badge(asset.status || ""),
  };
  return cells[key] ?? esc(asset[key] || "");
}

function assetVisibleColumns() {
  const saved = JSON.parse(localStorage.getItem(ASSET_COLUMN_STORAGE_KEY) || "null");
  const keys = Array.isArray(saved) && saved.length ? saved.flatMap((key) => key === "asset" ? ["asset_tag", "description"] : [key]) : assetColumnDefs.map(([key]) => key);
  const valid = new Set(assetColumnDefs.map(([key]) => key));
  return keys.filter((key) => valid.has(key)).map((key) => assetColumnDefs.find(([colKey]) => colKey === key)).filter(Boolean);
}

function assetColumnChooserHtml() {
  const active = new Set(assetVisibleColumns().map(([key]) => key));
  return assetColumnDefs.map(([key, label]) => `<label class="checkline"><input type="checkbox" data-asset-column="${esc(key)}" ${active.has(key) ? "checked" : ""}> ${esc(label)}</label>`).join("");
}

function saveAssetColumnChoice() {
  const keys = [...document.querySelectorAll("[data-asset-column]:checked")].map((box) => box.dataset.assetColumn);
  localStorage.setItem(ASSET_COLUMN_STORAGE_KEY, JSON.stringify(keys.length ? keys : assetColumnDefs.map(([key]) => key)));
  $("assetTableHost").innerHTML = assetTableHtml(currentRows);
  bindAssetRows();
}

function bindAssetRows() {
  document.querySelectorAll("[data-asset-edit]").forEach((b) => b.onclick = () => openAssetModal(currentRows.find((asset) => asset.asset_tag === b.dataset.assetEdit)));
  document.querySelectorAll("[data-asset-delete]").forEach((b) => b.onclick = () => deleteAsset(b.dataset.assetDelete));
  document.querySelectorAll("[data-asset-loc]").forEach((b) => b.onclick = () => openAssetLocationModal(currentRows.find((asset) => asset.asset_tag === b.dataset.assetLoc)));
  document.querySelectorAll("[data-asset-qr]").forEach((b) => b.onclick = () => openAssetQrModal(currentRows.find((asset) => asset.asset_tag === b.dataset.assetQr)));
  document.querySelectorAll("[data-asset-needs-qr]").forEach((box) => box.onchange = () => updateAssetQrPrintNeed(box.dataset.assetNeedsQr, box.checked));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function updateAssetQrPrintNeed(assetTag, needsPrint) {
  const asset = currentRows.find((row) => row.asset_tag === assetTag);
  if (!asset) return;
  const qrPrintedTagged = needsPrint ? "Needs Print" : "Printed";
  const { error } = await supabase.from("assets").update({ qr_printed_tagged: qrPrintedTagged }).eq("asset_tag", assetTag);
  if (error) {
    alert(error.message || "Could not update QR print status.");
    return;
  }
  asset.qr_printed_tagged = qrPrintedTagged;
}

function openAssetQrModal(asset) {
  if (!asset) return;
  const qrText = asset.qr_update_url || assetQrUrl(asset);
  $("modalTitle").textContent = `QR code - ${asset.asset_tag}`;
  $("modalBody").innerHTML = `
    <div class="qr-card">
      <img class="qr-large" src="${qrCodeUrl(qrText, 420)}" alt="QR code for ${esc(asset.asset_tag)}">
      <strong>${esc(asset.asset_tag)}</strong>
      <span>${esc(asset.name || "")}</span>
      <code>${esc(qrText)}</code>
      <button type="button" id="printAssetQrBtn">Print QR</button>
    </div>`;
  $("modalSave").style.display = "none";
  $("modal").style.display = "flex";
  $("printAssetQrBtn").onclick = () => printAssetQr(asset, qrText);
}

function printAssetQr(asset, qrText) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow popups to print this QR code.");
    return;
  }
  win.document.write(`<!doctype html><html><head><title>${esc(asset.asset_tag)} QR</title><style>
    body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:36px;text-align:center;color:#111827}
    img{width:360px;height:360px}
    h1{font-size:32px;margin:18px 0 8px}
    p{margin:0 0 10px;color:#4b5563}
    code{display:block;word-break:break-all;font-size:11px;color:#4b5563;margin-top:16px}
  </style></head><body>
    <img src="${qrCodeUrl(qrText, 480)}" alt="QR">
    <h1>${esc(asset.asset_tag)}</h1>
    <p>${esc(asset.name || "")}</p>
    <code>${esc(qrText)}</code>
    <script>window.onload=()=>{window.print();};<\/script>
  </body></html>`);
  win.document.close();
}

async function openAssetModal(asset = null) {
  editing = asset;
  const assetTag = asset?.asset_tag || await nextRefPreview("asset", "AST-", "assets", "asset_tag");
  const parentOptions = (productMeta.assets || [])
    .filter((row) => row.asset_tag && row.asset_tag !== assetTag)
    .map((row) => assetOptionLabel(row));
  const parentValue = asset?.parent_asset_tag
    ? assetOptionLabel((productMeta.assets || []).find((row) => row.asset_tag === asset.parent_asset_tag) || { asset_tag: asset.parent_asset_tag, name: "" })
    : "";
  $("modalTitle").textContent = asset ? "Edit vehicle or equipment" : "Add vehicle or equipment";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      <div class="field"><label>Equipment photo</label>${asset?.photo_url ? `<img class="thumb large" src="${esc(asset.photo_url)}" alt="Photo">` : ""}<input type="file" accept="image/*" data-asset-file="photo_url"><input type="hidden" data-product-field="photo_url" value="${esc(asset?.photo_url || "")}"></div>
      <div class="field"><label>New scan QR code</label><img class="qr" src="${qrCodeUrl(asset?.qr_update_url || assetQrUrl({ asset_tag: assetTag }))}" alt="QR"><input type="hidden" data-product-field="qr_update_url" value="${esc(asset?.qr_update_url || assetQrUrl({ asset_tag: assetTag }))}"></div>
      ${productInput("Asset tag", "asset_tag", assetTag)}
      ${productSelect("Type of equipment", "type", productMeta.assetTypes || ["Vehicle", "Heavy Equipment", "Trailer"], asset?.type || "Vehicle", "New type")}
      ${productInput("General type", "general_type", asset?.general_type || "")}
      ${productInput("Name", "name", asset?.name || "")}
      ${productInput("Make", "make", asset?.make || "")}
      ${productInput("Model", "model", asset?.model || "")}
      ${productInput("Year", "year", asset?.year || "")}
      ${productInput("Color", "color", asset?.color || "")}
      ${productInput("VIN / Serial", "vin_serial", asset?.vin_serial || "")}
      ${productInput("Plate", "plate", asset?.plate || "")}
      ${productInput("Old QR Code", "old_qr_code", assetOldQrCode(asset || { asset_tag: assetTag }))}
      ${productInput("QR printed / tagged", "qr_printed_tagged", asset?.qr_printed_tagged || "")}
      ${productSelect("Parent asset", "parent_asset_tag", parentOptions, parentValue)}
      ${productSelect("Relationship", "relationship_type", ["Standalone", "Parent equipment", "Attachment", "Component", "Compatible accessory"], asset?.relationship_type || "Standalone")}
      <div class="field wide"><label>Compatible with</label><textarea data-product-field="compatible_with" placeholder="Example: EQ-14, Bobcat E35, excavator quick coupler">${esc(asset?.compatible_with || "")}</textarea></div>
      ${productSelect("Location", "location", productMeta.locations || [], asset?.location || "", "New location")}
      ${productSelect("Status", "status", ["In Service", "Needs Repair", "Reserved", "Out of Service", "Sold"], asset?.status || "In Service")}
      ${productInput("Odometer", "odometer", asset?.odometer ?? 0, "number")}
      ${productInput("Engine hours", "engine_hours", asset?.engine_hours ?? 0, "number")}
      ${productInput("Fuel / power", "fuel_power", asset?.fuel_power || "")}
      ${productInput("Assigned operator", "assigned_operator", asset?.assigned_operator || "")}
      ${productInput("Purchase date", "purchase_date", asset?.purchase_date || "", "date")}
      ${productInput("Purchase cost", "purchase_cost", asset?.purchase_cost ?? 0, "number")}
      ${productInput("Insurance / policy", "insurance_policy", asset?.insurance_policy || "")}
      ${productInput("Registration expiry", "registration_expiry", asset?.registration_expiry || "", "date")}
      ${productInput("Last update date", "last_update_date", assetLastUpdateDate(asset), "date")}
      ${productInput("Latest scanned date", "scanned_date", asset?.scanned_date || "", "datetime-local")}
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(asset?.notes || "")}</textarea></div>
    </div>`;
  $("modalSave").onclick = saveAssetModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateAssetMaster(b.dataset.productQuick, asset));
}

async function quickCreateAssetMaster(field, asset = editing) {
  const isType = field === "type";
  const table = isType ? "asset_types" : "asset_locations";
  const label = isType ? "type" : "location";
  const name = prompt(`New ${label} name`);
  if (!name) return;
  try {
    await upsertOne(table, { name: name.trim() }, "name");
    await renderAssetsView();
    await openAssetModal(asset);
    const input = document.querySelector(`[data-product-field="${isType ? "type" : "location"}"]`);
    if (input) input.value = name.trim();
  } catch (error) {
    alert(error.message || error);
  }
}

async function saveAssetModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  if (!record.asset_tag || !record.type || !record.name) {
    alert("Asset tag, type, and name are required.");
    return;
  }
  const parentTag = parseAssetTag(record.parent_asset_tag);
  if (parentTag && parentTag === record.asset_tag) {
    alert("An asset cannot be its own parent.");
    return;
  }
  const parent = (productMeta.assets || []).find((row) => row.asset_tag === parentTag);
  record.parent_asset_tag = parentTag || null;
  record.parent_asset_id = parent?.id || null;
  record.relationship_type = record.relationship_type || (parentTag ? "Attachment" : "Standalone");
  const wasNew = !editing;
  try {
    const file = document.querySelector("[data-asset-file]")?.files?.[0];
    if (file) record.photo_url = await uploadAssetPhoto(record.asset_tag, file);
    record.qr_update_url = record.qr_update_url || assetQrUrl(record);
    ["odometer", "engine_hours", "purchase_cost"].forEach((field) => record[field] = Number(record[field] || 0));
    const saved = await upsertOne("assets", record, "asset_tag");
    if (wasNew) await incrementSequence("asset");
    closeModal();
    renderAssetsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function assetOptionLabel(asset) {
  return [asset?.asset_tag, asset?.name, asset?.make, asset?.model, asset?.location]
    .filter(Boolean)
    .join(" | ");
}

function parseAssetTag(value) {
  return String(value || "").split("|")[0].trim();
}

async function uploadAssetPhoto(assetTag, file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${assetTag}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("asset-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("asset-photos").getPublicUrl(path);
  return data.publicUrl;
}

function openAssetLocationModal(asset) {
  if (!asset) return;
  editing = asset;
  $("modalTitle").textContent = `Scanned asset ${asset.asset_tag}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productSelect("Scan action", "scan_action", ["Update location", "Ask for repair"], "Update location")}
      ${productSelect("Location", "location", productMeta.locations || [], asset.location || "", "New location")}
      ${productInput("GPS location", "gps_location", asset.gps_location || "")}
      ${productInput("Scanned date", "scanned_date", new Date().toISOString().slice(0, 16), "datetime-local")}
      <div class="field wide"><label>Repair issue</label><textarea data-product-field="repair_issue" placeholder="Describe the issue if this scan is asking for repair"></textarea></div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(asset.notes || "")}</textarea></div>
    </div>
    <p class="notice" id="gpsCaptureNotice">Scanning this QR automatically captures GPS when browser location permission is allowed. Choose Ask for repair if this equipment needs a work order.</p>`;
  $("modalSave").onclick = saveAssetLocationModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateAssetMaster(b.dataset.productQuick, asset));
  window.setTimeout(() => fillGpsLocation({ silent: true }), 150);
}

function fillGpsLocation({ silent = false } = {}) {
  const gpsInput = document.querySelector('[data-product-field="gps_location"]');
  const notice = $("gpsCaptureNotice");
  if (!navigator.geolocation || !gpsInput) {
    if (notice) notice.textContent = "GPS is not available in this browser. The location can still be saved without GPS coordinates.";
    if (!silent) alert("GPS is not available in this browser.");
    return;
  }
  if (notice) notice.textContent = "Capturing GPS from this device...";
  navigator.geolocation.getCurrentPosition((pos) => {
    const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
    gpsInput.value = coords;
    if (notice) notice.textContent = `GPS captured automatically: ${coords}`;
  }, () => {
    if (notice) notice.textContent = "GPS permission was denied or unavailable. The scanned date will still update when you save.";
    if (!silent) alert("GPS permission was denied or unavailable.");
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
}

async function saveAssetLocationModal() {
  const asset = editing;
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  const action = record.scan_action || "Update location";
  const repairIssue = String(record.repair_issue || "").trim();
  delete record.scan_action;
  delete record.repair_issue;
  if (/repair/i.test(action)) {
    if (!repairIssue) {
      alert("Please enter the repair issue so it can appear in Equipment Subject to Repair.");
      return;
    }
    const stamp = new Date().toLocaleString();
    record.status = "Subject to Repair";
    record.notes = [record.notes || asset.notes || "", `Repair requested ${stamp}: ${repairIssue}`].filter(Boolean).join("\n");
  }
  try {
    await supabase.from("assets").update(record).eq("id", asset.id);
    closeModal();
    /repair/i.test(action) ? loadView("equipmentrepairqueue") : renderAssetsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function deleteAsset(assetTag) {
  if (!confirm("Delete this asset?")) return;
  const { error } = await supabase.from("assets").delete().eq("asset_tag", assetTag);
  if (error) alert(error.message);
  renderAssetsView();
}

function assetQrUrl(asset) {
  return `${location.origin}${location.pathname}#asset=${encodeURIComponent(asset.asset_tag || "")}`;
}

function qrCodeUrl(text, size = 120) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(text || "")}`;
}

function exportAssetsWithQrCsv() {
  const columns = assetVisibleColumns();
  const heads = columns.map(([, label]) => label);
  const rows = filteredAssetRowsFromDom();
  const body = rows.map((a) => {
    const qrText = a.qr_update_url || assetQrUrl(a);
    return `<tr>${columns.map(([key]) => {
      if (key === "new_qr") return `<td class="qr-cell"><img class="qr-export" src="${qrCodeUrl(qrText, 120)}" alt="QR"></td>`;
      if (key === "photo") return `<td>${a.photo_url ? `<a href="${esc(a.photo_url)}">${esc(a.photo_url)}</a>` : ""}</td>`;
      return `<td>${esc(assetExportValue(a, key))}</td>`;
    }).join("")}</tr>`;
  }).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    table{border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:11px}
    th,td{border:1px solid #cfd6df;padding:6px 8px;text-align:center;vertical-align:middle;mso-number-format:"\\@";}
    th{background:#edf1f4;font-weight:700}
    .qr-cell{width:76px;height:76px;mso-width-source:userset;mso-height-source:userset}
    .qr-export{width:60px;height:60px;object-fit:contain;display:block;margin:auto}
    tr{height:68px}
  </style></head><body><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(html, "fleet-equipment-with-qr.xls", "application/vnd.ms-excel;charset=utf-8");
}

function filteredAssetRowsFromDom() {
  const visibleTags = [...document.querySelectorAll("[data-asset-row]")]
    .filter((tr) => tr.style.display !== "none")
    .map((tr) => tr.dataset.assetRow);
  if (!visibleTags.length) return currentRows;
  const byTag = new Map(currentRows.map((asset) => [String(asset.asset_tag || ""), asset]));
  return visibleTags.map((tag) => byTag.get(tag)).filter(Boolean);
}

function assetExportValue(asset, key) {
  const oldQrCode = assetOldQrCode(asset);
  const lastUpdateDate = assetLastUpdateDate(asset);
  const values = {
    old_qr_code: oldQrCode,
    needs_qr_code_printed: assetNeedsQrPrinted(asset) ? "Yes" : "No",
    asset_tag: asset.asset_tag || "",
    description: asset.name || asset.description || "",
    type: asset.type || "",
    general_type: asset.general_type || "",
    parent_asset: asset.parent_asset_tag || "",
    relationship_type: asset.relationship_type || "",
    compatible_with: asset.compatible_with || "",
    make_model: [asset.make, asset.model].filter(Boolean).join(" "),
    color: asset.color || "",
    vin_serial: asset.vin_serial || "",
    plate: asset.plate || "",
    location: asset.location || "",
    last_update_date: lastUpdateDate || "",
    scanned_date: asset.scanned_date || "",
    reading: asset.odometer ? `${asset.odometer} mi` : asset.engine_hours ? `${asset.engine_hours} hr` : "",
    assigned_operator: asset.assigned_operator || "",
    open_wo_issue: asset._openWoIssue || "",
    status: asset.status || "",
  };
  return values[key] ?? asset[key] ?? "";
}

function assetOldQrCode(asset = {}) {
  return asset.old_qr_code || asset.old_qr || asset.legacy_qr_code || asset.qr_code || asset.qr_printed_tagged || asset.asset_tag || "";
}

function assetLastUpdateDate(asset = {}) {
  return asset.last_update_date || asset.last_updated || asset.updated_date || String(asset.scanned_date || asset.updated_at || asset.created_at || "").slice(0, 10);
}

function assetNeedsQrPrinted(asset = {}) {
  const value = String(asset.qr_printed_tagged || "").trim().toLowerCase();
  if (!value) return true;
  return /need|no|not|missing|pending|reprint/.test(value) && !/printed|tagged|ok|yes/.test(value);
}

async function replaceAssetMasterFromPdf() {
  if (!confirm("Replace Fleet & Equipment with the PDF asset master? This clears only fleet/equipment asset rows and then loads the PDF list with new scan QR codes.")) return;
  try {
    const pdfAssets = await loadEquipmentMasterAssets();
    if (!pdfAssets.length) throw new Error("No PDF asset master rows were found.");
    await supabase.from("work_orders").update({ asset_id: null }).not("id", "is", null);
    await supabase.from("rentals").update({ item_id: null }).eq("item_type", "Asset");
    await supabase.from("assets").delete().not("id", "is", null);
    await supabase.from("asset_locations").delete().not("id", "is", null);
    await supabase.from("asset_types").delete().not("id", "is", null);
    await importAssetMasterRows(pdfAssets);
    alert(`Loaded ${pdfAssets.length} PDF asset master rows. New QR codes are ready to print and scan.`);
    renderAssetsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function handleAssetHash() {
  if (!session) return;
  const match = location.hash.match(/^#asset=(.+)$/);
  if (!match) return;
  const assetTag = decodeURIComponent(match[1]);
  await renderAssetsView();
  const asset = currentRows.find((row) => row.asset_tag === assetTag);
  if (asset) openAssetLocationModal(asset);
}

async function openProductModal(row = null) {
  editing = row;
  const alternates = row?.id ? await getProductAlternates(row.id) : [];
  const sku = row?.sku || await nextRefPreview("product", "SKU-", "products", "sku");
  $("modalTitle").textContent = row ? "Edit product" : "Add product";
  $("modalBody").innerHTML = `
    <div class="form-grid product-form">
      <div class="field"><label>Part photo</label>${row?.photo_url ? `<img class="thumb large" src="${esc(row.photo_url)}" alt="Photo">` : ""}<input type="file" accept="image/*" data-product-file="photo_url"><input type="hidden" data-product-field="photo_url" value="${esc(row?.photo_url || "")}"></div>
      ${productInput("SKU", "sku", sku)}
      ${productInput("Product name", "name", row?.name || "")}
      ${productSelect("Category", "category", productMeta.categories, row?.category || "", "New category")}
      ${productSelect("Unit", "unit", productMeta.units, row?.unit || "", "New unit")}
      ${productSelect("Warehouse", "warehouse", productMeta.warehouses, row?.warehouse || "", "New warehouse")}
      ${productInput("Bin / shelf", "bin_shelf", row?.bin_shelf || "")}
      <div class="field"><label>Quantity on hand</label><input value="${esc(row?.qty ?? 0)}" disabled><small>Updated only by goods receipt, sales issue, work order issue, or approved correction.</small></div>
      ${productInput("Reorder point", "reorder_point", row?.reorder_point ?? 0, "number")}
      ${productInput("Cost", "cost", row?.cost ?? "", "number")}
      ${productInput("Markup %", "markup_percent", row?.markup_percent ?? "", "number")}
      ${productInput("Selling price", "selling_price", row?.selling_price ?? "", "number")}
      ${productSelect("Preferred vendor", "source_vendor", productMeta.vendors, row?.source_vendor || "", "New vendor")}
      ${productInput("Barcode", "barcode", row?.barcode || "")}
      ${productInput("Batch / lot", "batch_lot", row?.batch_lot || "")}
      ${productInput("Expiry date", "expiry_date", row?.expiry_date || "", "date")}
      ${productSelect("Status", "status", ["Active", "Inactive", "Discontinued"], row?.status || "Active")}
      <div class="field wide"><label>Alternative SKUs</label>${alternateSkuRows(alternates)}</div>
      <div class="field wide"><label>Compatible with</label><textarea data-product-field="compatible_with" placeholder="Equipment, model, part family, size, or keywords">${esc(row?.compatible_with || "")}</textarea></div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(row?.notes || "")}</textarea></div>
    </div>
    <p class="notice">Barcode, batch / lot, expiry date, cost, notes, and alternative SKUs are optional. Quantity is controlled by buying, receiving, and issuance. Enter either Selling Price or Markup %, not both.</p>`;
  $("modalSave").onclick = saveProductModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateProductMaster(b.dataset.productQuick));
  const addAltBtn = $("addAltSkuBtn");
  if (addAltBtn) addAltBtn.onclick = addAlternativeSkuRow;
}

function productInput(label, field, value, type = "text") {
  return `<div class="field"><label>${esc(label)}</label><input ${type === "number" ? 'step="0.01"' : ""} type="${type}" data-product-field="${field}" value="${esc(value)}"></div>`;
}

function productSelect(label, field, values, value, quickLabel = "") {
  const listId = `${field}-${label}`.replace(/[^a-z0-9_-]/gi, "-");
  const unique = [...new Set((values || []).map((v) => String(v ?? "").trim()).filter(Boolean))];
  return `<div class="field"><label>${esc(label)}</label><input class="suggest-input" list="${esc(listId)}" data-product-field="${field}" value="${esc(value || "")}" placeholder="Type to search ${esc(label.toLowerCase())}" autocomplete="off"><datalist id="${esc(listId)}">${unique.map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist>${quickLabel ? `<button class="rowbtn" type="button" data-product-quick="${esc(field)}">${esc(quickLabel)}</button>` : ""}</div>`;
}

function alternateSkuRows(values) {
  const rows = [...values.map((r) => r.alternate_sku), "", "", "", "", ""].slice(0, Math.max(5, values.length + 2));
  return `<div class="table-wrap"><table class="mini-table"><thead><tr><th>Alternative SKU</th></tr></thead><tbody id="altSkuBody">${rows.map((sku, i) => altSkuRowHtml(sku, i)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addAltSkuBtn">Add row</button></div>`;
}

function altSkuRowHtml(sku = "", index = 0) {
  return `<tr><td><input data-alt-sku="${index}" value="${esc(sku || "")}" placeholder="Compatible alternate SKU"></td></tr>`;
}

function addAlternativeSkuRow() {
  const body = $("altSkuBody");
  if (!body) return;
  const index = document.querySelectorAll("[data-alt-sku]").length;
  body.insertAdjacentHTML("beforeend", altSkuRowHtml("", index));
  const inputs = document.querySelectorAll("[data-alt-sku]");
  inputs[inputs.length - 1]?.focus();
}

async function getProductAlternates(productId) {
  const { data, error } = await supabase.from("product_alternates").select("*").eq("product_id", productId);
  if (error) return [];
  return data || [];
}

async function saveProductModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value);
  const file = document.querySelector("[data-product-file]")?.files?.[0];
  const validation = validateProductRecord(record);
  if (validation) {
    alert(validation);
    return;
  }
  try {
    if (file) record.photo_url = await uploadProductPhoto(record.sku, file);
    const wasNew = !editing;
    record.qty = editing ? Number(editing.qty || 0) : 0;
    ["qty", "reorder_point", "cost", "selling_price", "markup_percent"].forEach((k) => {
      record[k] = record[k] === "" || record[k] == null ? null : Number(record[k]);
    });
    if (record.cost && record.markup_percent && !record.selling_price) {
      record.selling_price = Number((record.cost * (1 + record.markup_percent / 100)).toFixed(2));
      record.markup_percent = null;
    }
    const saved = await upsertOne("products", record, "sku");
    if (wasNew) await incrementSequence("product");
    await supabase.from("product_alternates").delete().eq("product_id", saved.id);
    const altRows = [...document.querySelectorAll("[data-alt-sku]")]
      .map((el) => el.value.trim())
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .map((alternate_sku) => ({ product_id: saved.id, alternate_sku }));
    await upsertMany("product_alternates", altRows, "id");
    closeModal();
    renderProductsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function validateProductRecord(record) {
  const required = [["SKU", record.sku], ["Product name", record.name], ["Category", record.category], ["Unit", record.unit], ["Warehouse", record.warehouse], ["Bin / shelf", record.bin_shelf], ["Reorder point", record.reorder_point], ["Status", record.status]];
  const missing = required.filter(([, value]) => String(value ?? "").trim() === "").map(([label]) => label);
  if (missing.length) return `Please complete these product master fields before saving:\n\n${missing.join("\n")}`;
  const price = Number(record.selling_price || 0);
  const markup = Number(record.markup_percent || 0);
  if (price > 0 && markup > 0) return "Enter Selling Price or Markup %, not both.";
  if (price <= 0 && markup <= 0) return "Please enter either Selling Price or Markup %.";
  if (!productMeta.categories.includes(record.category)) return "Category must be created first.";
  if (!productMeta.units.includes(record.unit)) return "Unit must be created first.";
  if (!productMeta.warehouses.includes(record.warehouse)) return "Warehouse must be created first.";
  if (record.source_vendor && !productMeta.vendors.includes(record.source_vendor)) return "Preferred Vendor must be created in Vendor Master first, or leave it blank.";
  return "";
}

async function uploadProductPhoto(sku, file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${sku}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("product-photos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
  return data.publicUrl;
}

async function quickCreateProductMaster(field) {
  const map = {
    category: ["categories", "Category"],
    unit: ["units", "Unit"],
    warehouse: ["warehouses", "Warehouse"],
    source_vendor: ["vendors", "Vendor"],
  };
  const [table, label] = map[field] || [];
  if (!table) return;
  const name = prompt(`New ${label}`);
  if (!name) return;
  try {
    if (table === "vendors") {
      await upsertOne("vendors", { reference: await nextRefPreview("vendor", "V-", "vendors", "reference"), name }, "name");
    } else {
      await upsertOne(table, { name }, "name");
    }
    await renderProductsView();
    await openProductModal(editing);
  } catch (error) {
    alert(error.message || error);
  }
}

async function quickCreateMaster(table, label) {
  const name = prompt(`New ${label}`);
  if (!name) return;
  try {
    await upsertOne(table, { name }, "name");
    renderProductsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function nextRefPreview(key, prefix, table, column) {
  const { data } = await supabase.from("app_sequences").select("*").eq("key", key).maybeSingle();
  if (data) return `${data.prefix}${data.next_number}`;
  const rows = await getAll(table);
  const nums = rows.map((r) => Number(String(r[column] || "").replace(/\D/g, ""))).filter(Boolean);
  return `${prefix}${Math.max(1000, ...nums) + 1}`;
}

async function incrementSequence(key) {
  const { data } = await supabase.from("app_sequences").select("*").eq("key", key).maybeSingle();
  if (!data) return;
  await supabase.from("app_sequences").update({ next_number: Number(data.next_number || 0) + 1 }).eq("key", key);
}

function renderTableModule() {
  $("content").innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <input class="searchbox" id="search" placeholder="Search this module">
        ${currentCfg.readOnly ? "" : `<button class="primary" id="newBtn">New</button>`}
      </div>
      <div class="panel-head"><div class="panel-title"><strong>${esc(currentCfg.title)}</strong><span>${esc(currentRows.length)} records shown.</span></div><div class="actions"><button id="csvBtn">Excel CSV</button><button id="printBtn">PDF / Print</button></div></div>
      <div id="tableHost">${tableHtml(currentRows)}</div>
    </section>`;
  $("search").oninput = () => {
    const q = $("search").value.toLowerCase();
    $("tableHost").innerHTML = tableHtml(currentRows.filter((r) => Object.values(r).join(" ").toLowerCase().includes(q)));
    bindRows();
  };
  if ($("newBtn")) $("newBtn").onclick = () => openModal();
  $("csvBtn").onclick = exportCurrentCsv;
  $("printBtn").onclick = () => window.print();
  bindRows();
}

function tableHtml(rows) {
  return `<div class="table-wrap"><table><thead><tr>${currentCfg.labels.map((h) => `<th>${esc(h)}</th>`).join("")}<th></th></tr><tr>${currentCfg.labels.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}<th></th></tr></thead><tbody>${rows.length ? rows.map(rowHtml).join("") : `<tr><td colspan="${currentCfg.heads.length + 1}" class="empty">No records yet.</td></tr>`}</tbody></table></div>`;
}

function rowHtml(row) {
  const key = row[currentCfg.key || "id"] || row.id;
  return `<tr>${currentCfg.heads.map((h) => `<td>${cell(h, row[h], row)}</td>`).join("")}<td><div class="rowactions">${currentCfg.readOnly ? "" : `<button class="rowbtn" data-edit="${esc(key)}">Edit</button><button class="rowbtn danger" data-del="${esc(key)}">Delete</button>`}</div></td></tr>`;
}

function cell(head, value) {
  if (/photo/.test(head)) return value ? `<img class="thumb" src="${esc(value)}" alt="Photo">` : `<span class="badge">No photo</span>`;
  if (/qr_update_url/.test(head)) return value ? `<img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(value)}" alt="QR">` : "";
  if (/status|match|payment|availability/.test(head)) return badge(value);
  if (/amount|cost|price|rate|debit|credit|value|deposit/.test(head)) return money(value);
  if (Array.isArray(value)) return esc(value.join(", "));
  return esc(value);
}

function badge(v) {
  const text = String(v || "");
  const cls = /paid|matched|active|complete|fulfilled|in service|posted|ready|ok/i.test(text) ? "good" : /hold|mismatch|waiting|partial|reserved|open|draft/i.test(text) ? "warn" : /void|cancel|reversed|out|down|short/i.test(text) ? "bad" : "";
  return `<span class="badge ${cls}">${esc(text)}</span>`;
}

function bindRows() {
  document.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => {
    const row = currentRows.find((r) => String(r[currentCfg.key] || r.id) === b.dataset.edit);
    if (currentView === "users") return openUserModal(row);
    openModal(row);
  });
  document.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => deleteRow(b.dataset.del));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  enhanceColumnFilters();
}

function enhanceColumnFilters() {
  document.querySelectorAll(".column-filter").forEach((input) => {
    if (input.nextElementSibling?.classList?.contains("column-sort")) return;
    input.insertAdjacentHTML("afterend", `<select class="column-sort" data-col="${esc(input.dataset.col || "")}" title="Sort this column"><option value="">No sort</option><option value="asc">A-Z / Low-High</option><option value="desc">Z-A / High-Low</option></select>`);
    input.nextElementSibling.onchange = applyColumnFilters;
  });
}

function applyColumnFilters(event) {
  const source = event?.target?.closest?.("table") ? event.target : document.activeElement;
  const table = source?.closest?.("table") || document.querySelector("table");
  if (!table) return;
  const filters = [...table.querySelectorAll(".column-filter")].map((i) => i.value.toLowerCase());
  const tbody = table.querySelector("tbody");
  if (!tbody) return;
  [...tbody.querySelectorAll("tr")].forEach((tr) => {
    const cells = [...tr.children];
    tr.style.display = filters.every((f, i) => !f || (cells[i]?.textContent || "").toLowerCase().includes(f)) ? "" : "none";
  });
  const activeSort = [...table.querySelectorAll(".column-sort")].find((select) => select.value);
  if (!activeSort) return;
  table.querySelectorAll(".column-sort").forEach((select) => {
    if (select !== activeSort) select.value = "";
  });
  const col = Number(activeSort.dataset.col || 0);
  const direction = activeSort.value === "desc" ? -1 : 1;
  const rows = [...tbody.querySelectorAll("tr")].filter((tr) => !tr.querySelector(".empty"));
  rows.sort((a, b) => compareTableValues(a.children[col]?.textContent || "", b.children[col]?.textContent || "") * direction);
  rows.forEach((tr) => tbody.appendChild(tr));
}

function compareTableValues(a, b) {
  const ax = String(a || "").trim();
  const bx = String(b || "").trim();
  const an = Number(ax.replace(/[$,%(),\s]/g, "").replace(/^-\s*/, "-"));
  const bn = Number(bx.replace(/[$,%(),\s]/g, "").replace(/^-\s*/, "-"));
  if (!Number.isNaN(an) && !Number.isNaN(bn) && (/\d/.test(ax) || /\d/.test(bx))) return an - bn;
  return ax.localeCompare(bx, undefined, { numeric: true, sensitivity: "base" });
}

function openModal(row = null) {
  if (currentView === "users") return openUserModal(row);
  editing = row;
  $("modalSave").onclick = saveModal;
  $("modalTitle").textContent = row ? `Edit ${currentCfg.title}` : `New ${currentCfg.title}`;
  $("modalBody").innerHTML = `<div class="form-grid">${currentCfg.heads.map((h) => formField(h, row?.[h] ?? "")).join("")}</div>`;
  $("modal").style.display = "flex";
}

function openUserModal(row = null) {
  editing = row;
  const chosen = row?.modules || ["dashboard"];
  const allChecked = chosen.includes("all");
  $("modalSave").onclick = saveUserModal;
  $("modalTitle").textContent = row ? `Edit user ${row.username || row.email || ""}` : "New company user";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      <div class="field"><label>Username</label><input data-user-field="username" value="${esc(row?.username || "")}" placeholder="Bryan.dy"></div>
      <div class="field"><label>Email used for login</label><input data-user-field="email" type="email" value="${esc(row?.email || "")}" placeholder="name@company.com"></div>
      <div class="field"><label>Full name</label><input data-user-field="full_name" value="${esc(row?.full_name || "")}"></div>
      <div class="field"><label>Role</label><input class="suggest-input" data-user-field="role" list="roleOptions" value="${esc(row?.role || "User")}" autocomplete="off"><datalist id="roleOptions"><option value="Administrator"></option><option value="Manager"></option><option value="Mechanic"></option><option value="Accounting"></option><option value="User"></option></datalist></div>
      <div class="field wide"><label>${row ? "New password (optional)" : "Password"}</label><input data-user-field="password" type="password" placeholder="${row ? "Leave blank to keep current password" : "Temporary password"}"></div>
    </div>
    <div class="field wide">
      <label>Module access</label>
      <div class="module-picker">
        <label class="checkline"><input type="checkbox" data-user-module="all" ${allChecked ? "checked" : ""}> All modules</label>
        ${modules.map((group) => `
          <div class="module-group">
            <strong>${esc(group.group)}</strong>
            ${group.items.map(([id, label]) => `<label class="checkline"><input type="checkbox" data-user-module="${esc(id)}" ${allChecked || chosen.includes(id) ? "checked" : ""}> ${esc(label)}</label>`).join("")}
          </div>
        `).join("")}
      </div>
    </div>
    <p class="notice">This creates the user login and the LMS module permissions together. Passwords are never saved in the visible table.</p>
  `;
  $("modal").style.display = "flex";
}

async function saveUserModal() {
  const read = (field) => document.querySelector(`[data-user-field="${field}"]`)?.value?.trim() || "";
  const modulesPicked = [...document.querySelectorAll("[data-user-module]:checked")].map((el) => el.dataset.userModule);
  const payload = {
    id: editing?.id || null,
    username: read("username"),
    email: read("email"),
    full_name: read("full_name"),
    role: read("role") || "User",
    password: read("password"),
    modules: modulesPicked.includes("all") ? ["all"] : modulesPicked.filter(Boolean),
  };
  if (!payload.modules.length) payload.modules = ["dashboard"];
  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let result = {};
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch {
    result = { error: raw };
  }
  if (!response.ok) {
    alert(result.error || `Could not save user. Server returned ${response.status}.`);
    return;
  }
  if (result.mechanic) alert("User saved and added to the Mechanic Master.");
  closeModal();
  loadView("users");
}

function formField(h, value) {
  const label = currentCfg.labels[currentCfg.heads.indexOf(h)] || h;
  if (/notes|description|address|reason/.test(h)) return `<div class="field wide"><label>${esc(label)}</label><textarea data-field="${h}">${esc(value)}</textarea></div>`;
  if (/date/.test(h)) return `<div class="field"><label>${esc(label)}</label><input type="date" data-field="${h}" value="${esc(String(value).slice(0, 10))}"></div>`;
  if (/amount|cost|price|rate|qty|reorder|debit|credit|deposit|hours|odometer|markup/.test(h)) return `<div class="field"><label>${esc(label)}</label><input type="number" step="0.01" data-field="${h}" value="${esc(value)}"></div>`;
  if (/status/.test(h)) return `<div class="field"><label>${esc(label)}</label><input class="suggest-input" data-field="${h}" list="${esc(h)}Options" value="${esc(value)}" placeholder="Type to search ${esc(label.toLowerCase())}" autocomplete="off"><datalist id="${esc(h)}Options">${["Active", "Open", "Draft", "Issued", "Reserved", "Out", "Complete", "Invoiced", "Paid", "Cancelled"].map((o) => `<option value="${esc(o)}"></option>`).join("")}</datalist></div>`;
  return `<div class="field"><label>${esc(label)}</label><input data-field="${h}" value="${esc(value)}"></div>`;
}

function closeModal() {
  $("modal").style.display = "none";
  document.querySelector(".modalbox")?.classList.remove("wide-modal");
  editing = null;
  $("modalSave").style.display = "";
  $("modalSave").textContent = "Save";
  $("modalSave").onclick = saveModal;
}

async function saveModal() {
  const record = {};
  document.querySelectorAll("[data-field]").forEach((el) => record[el.dataset.field] = el.value);
  try {
    normalizeBeforeSave(record);
  } catch (error) {
    alert(error.message);
    return;
  }
  const lockedField = Object.entries(record).find(([key, value]) => /date|posting/i.test(key) && isLockedAccountingDate(value));
  if (lockedField && ["accounting", "coa", "bank", "checkrun", "purchasing", "receipts", "invoices", "payments"].includes(currentView)) {
    alert("This record is inside the closed accounting period.");
    return;
  }
  const query = editing ? supabase.from(currentCfg.table).update(record).eq(currentCfg.key || "id", editing[currentCfg.key] || editing.id) : supabase.from(currentCfg.table).insert(record);
  const { error } = await query;
  if (error) {
    alert(error.message);
    return;
  }
  closeModal();
  loadView(currentView);
}

function normalizeBeforeSave(r) {
  if (currentView === "products") {
    if (r.selling_price === "") r.selling_price = null;
    if (r.markup_percent === "") r.markup_percent = null;
    if (r.cost === "") r.cost = null;
    if (r.selling_price && r.markup_percent) throw new Error("Enter Selling Price or Markup %, not both.");
  }
  Object.keys(r).forEach((k) => {
    if (r[k] === "") r[k] = null;
  });
}

async function deleteRow(key) {
  if (!confirm("Delete this record?")) return;
  const { error } = await supabase.from(currentCfg.table).delete().eq(currentCfg.key || "id", key);
  if (error) alert(error.message);
  loadView(currentView);
}

async function getAll(table) {
  const { data, error } = await supabase.from(table).select("*").limit(1000);
  if (error) return [];
  return data || [];
}

function exportCurrentCsv() {
  if (!currentCfg || !currentRows.length) return;
  const visible = visibleTableRowsForExport();
  const rows = visible.length ? visible : [currentCfg.labels, ...currentRows.map((r) => currentCfg.heads.map((h) => r[h] ?? ""))];
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentView}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function visibleTableRowsForExport() {
  const table = document.querySelector("#content table");
  if (!table) return [];
  const headers = [...table.querySelectorAll("thead tr:first-child th")].map((th) => th.textContent.trim());
  const usableIndexes = headers.map((h, i) => h || i === headers.length - 1 ? [h, i] : null).filter(Boolean);
  const finalIndexes = usableIndexes.filter(([h]) => h);
  if (!finalIndexes.length) return [];
  const bodyRows = [...table.querySelectorAll("tbody tr")]
    .filter((tr) => tr.style.display !== "none" && !tr.querySelector(".empty"))
    .map((tr) => finalIndexes.map(([, i]) => {
      const cell = tr.children[i];
      const checkbox = cell?.querySelector?.('input[type="checkbox"]');
      if (checkbox) return checkbox.checked ? "Yes" : "No";
      return (cell?.innerText || cell?.textContent || "").trim().replace(/\s+/g, " ");
    }));
  return [finalIndexes.map(([h]) => h), ...bodyRows];
}

async function importLocalJson() {
  const file = $("fileImport").files[0];
  if (!file) return;
  const local = JSON.parse(await file.text());
  if (!confirm("Import local browser data into Supabase? Existing rows with the same reference numbers/SKUs will be updated.")) return;
  try {
    await importLocalState(local);
    alert("Local data imported into Supabase.");
    loadView(currentView);
  } catch (error) {
    alert(error.message || error);
  }
}

async function loadSampleData() {
  if (!confirm("Clear existing test data and reload fresh sample data into Supabase? Your user profile will stay.")) return;
  try {
    await clearBusinessData();
    const local = sampleState();
    const pdfAssets = await loadEquipmentMasterAssets();
    if (pdfAssets.length) local.assets = pdfAssets;
    await importLocalState(local);
    alert("Fresh sample data loaded.");
    loadView(currentView);
  } catch (error) {
    alert(error.message || error);
  }
}

async function clearTestData() {
  if (!confirm("Clear test business data from Supabase? Master setup lists and your user profile will stay.")) return;
  try {
    await clearBusinessData();
    alert("Test data cleared.");
    loadView(currentView);
  } catch (error) {
    alert(error.message || error);
  }
}

async function clearBusinessData() {
  const tables = [
    "invoice_lines",
    "customer_payments",
    "invoices",
    "check_runs",
    "bank_transactions",
    "general_ledger",
    "work_order_labor",
    "work_order_parts",
    "work_order_issues",
    "work_orders",
    "rentals",
    "sales_order_lines",
    "sales_orders",
    "goods_receipts",
    "purchase_order_lines",
    "purchase_orders",
    "stock_movements",
    "product_alternates",
    "products",
    "assets",
    "asset_locations",
    "asset_types",
    "mechanics",
    "vendors",
    "customers",
    "categories",
    "units",
    "warehouses",
    "chart_of_accounts",
  ];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

function defaultChartOfAccounts() {
  const rows = [
    ["10000001", "FHB Checking", "Balance Sheet"],
    ["10040001", "Credit Card Receivable", "Balance Sheet"],
    ["10400001", "Accounts Receivable (A/R)", "Balance Sheet"],
    ["12000000", "Heavy Equipment Asset", "Balance Sheet"],
    ["12050001", "Acc Dep", "Balance Sheet"],
    ["12060001", "Other Fixed Asset", "Balance Sheet"],
    ["12061001", "Furniture & Fixture", "Balance Sheet"],
    ["12100001", "Parts Inventory", "Balance Sheet"],
    ["13000001", "Intercompany - LMS Main", "Balance Sheet"],
    ["13010001", "Intercompany - PFM", "Balance Sheet"],
    ["13020001", "Intercompany - GWM", "Balance Sheet"],
    ["13026000", "Intercompany - Salas Holdings", "Balance Sheet"],
    ["13027001", "Intercompany - Proferre", "Balance Sheet"],
    ["13028001", "Intercompany - The Pit", "Balance Sheet"],
    ["20000001", "Accounts Payable (A/P)", "Balance Sheet"],
    ["20020001", "Credit Card Payable - LMS Impo", "Balance Sheet"],
    ["20040001", "Customer Deposit", "Balance Sheet"],
    ["22000001", "Commission", "Balance Sheet"],
    ["23000001", "Parts Accrual", "Balance Sheet"],
    ["23050001", "Parts in Transit", "Balance Sheet"],
    ["29000001", "Retained Earnings", "Balance Sheet"],
    ["32000301", "Parts Sales", "Income Statement"],
    ["32031301", "Other Sales", "Income Statement"],
    ["34010401", "LMS Service - Sales", "Income Statement"],
    ["34050401", "DELIVERY CHARGE", "Income Statement"],
    ["34070401", "DIAGNOSTIC FEE", "Income Statement"],
    ["34080401", "DIAGNOSTIC FEE NAVAL BASE GUAM", "Income Statement"],
    ["35000501", "Sales - Equipment Rental", "Income Statement"],
    ["41022201", "COGS - Parts", "Income Statement"],
    ["44010401", "COGS - LMS Service", "Income Statement"],
    ["49100301", "QUOTE GAIN/LOSS", "Income Statement"],
    ["5000101", "Depreciation Expense", "Income Statement"],
    ["50010301", "Dues & subscription", "Income Statement"],
    ["51000401", "Job Supplies", "Income Statement"],
    ["51080401", "Indirect Labor", "Income Statement"],
    ["90000001", "Miscellaneous Expense", "Income Statement"],
    ["51150501", "Repairs & Maintenance", "Income Statement"],
    ["51200401", "Training Expense", "Income Statement"],
    ["53010301", "Freight", "Income Statement"],
    ["55000301", "Communications", "Income Statement"],
    ["57000301", "Bank Charges and Fees", "Income Statement"],
    ["60000301", "Misc Income", "Income Statement"],
    ["80000301", "Inventory Loss - Obsolete Part", "Income Statement"],
  ];
  return rows.map(([account_code, account, report_group]) => {
    const type = accountTypeFromStatement(account, report_group);
    return { account_code, account, report_group, type, normal_balance: /acc dep|accum/i.test(account) ? "Credit" : normalBalance(type), notes: "" };
  });
}

function accountTypeFromStatement(account, reportGroup) {
  if (/Income Statement/i.test(reportGroup || "")) {
    if (/sales|charge|fee|gain|income/i.test(account || "") && !/^cogs|expense|dues|supplies|labor|freight|communications|bank charges|inventory loss/i.test(account || "")) return "Revenue";
    return "Expense";
  }
  if (/payable|deposit|commission|accrual|in transit/i.test(account || "")) return "Liability";
  if (/retained earnings/i.test(account || "")) return "Equity";
  return "Asset";
}

function sampleState() {
  const products = [
    product("p1", "SKU-1001", "All-Purpose Cleaner", "Finished Goods", "Each", "Main", 96, 40, 3.25, 7.99, "A1", "North Coast Supply"),
    product("p2", "SKU-1002", "Glass Cleaner", "Finished Goods", "Each", "Main", 22, 30, 2.75, 6.99, "A2", "North Coast Supply"),
    product("p3", "SKU-1003", "Microfiber Cloth", "Supplies", "Box", "Back Room", 14, 10, 18, 32, "B1", "Metro Packaging"),
    product("p4", "SKU-1004", "Shipping Box Small", "Packaging", "Each", "Back Room", 84, 50, 0.48, 1.1, "B2", "Metro Packaging"),
    product("p5", "SKU-1005", "Forklift Hydraulic Hose", "Service Parts", "Each", "Back Room", 4, 4, 42, 85, "S1", "LiftPro Guam"),
    product("p6", "SKU-1006", "Engine Oil 5W-30", "Service Parts", "Quart", "Main", 48, 12, 6.5, 11.99, "S2", "Island Auto Service"),
    product("p7", "SKU-1007", "Diesel Fuel Filter", "Service Parts", "Each", "Main", 10, 5, 18.25, 34.5, "S3", "Island Auto Service"),
    product("p8", "SKU-1008", "Pallet Wrap", "Packaging", "Roll", "Back Room", 18, 10, 28, 45, "B3", "Metro Packaging"),
    product("p9", "SKU-1009", "Drive Belt A42", "Service Parts", "Each", "Back Room", 16, 6, 9.8, 18.5, "S4", "Guam Bearing & Belt"),
    product("p10", "SKU-1010", "Bearing 6205-2RS", "Service Parts", "Each", "Back Room", 24, 8, 5.25, 12.75, "S6", "Guam Bearing & Belt"),
    product("p11", "SKU-1011", "Hydraulic Oil ISO 46", "Service Parts", "Pail", "Main", 9, 4, 68, 120, "S7", "Blue Ocean Fuel"),
    product("p12", "SKU-1012", "DEF Fluid 2.5 gal", "Service Parts", "Each", "Main", 20, 8, 14.4, 24.95, "S8", "Blue Ocean Fuel"),
    product("p13", "SKU-1013", "Truck Tire LT245", "Service Parts", "Each", "Transit", 6, 4, 124, 185, "T1", "Pacific Tire Center"),
  ];
  const assets = [
    asset("a1", "TRK-01", "Vehicle", "Delivery Truck 1", "Ford", "Transit 250", "2022", "White", "1FTBR1C80NKA00001", "GU-1024", "Main", "In Service", 38420, 0, "Miguel", 18000),
    asset("a2", "EQ-14", "Heavy Equipment", "Compact Excavator", "Bobcat", "E35", "2020", "Orange", "B3WZ14001", "", "Job Site", "In Service", 0, 1840, "Ari", 28000),
    asset("a3", "FLT-03", "Heavy Equipment", "Forklift", "Toyota", "8FGCU25", "2019", "Red", "FGCU25-90112", "", "Warehouse", "Needs Repair", 0, 2925, "Warehouse Team", 30200),
    asset("a4", "TRL-02", "Trailer", "Flatbed Trailer", "Big Tex", "14OA", "2021", "Black", "BT14OA21001", "GU-8890", "Main", "Reserved", 0, 0, "Jae", 0),
    asset("a5", "TRK-02", "Vehicle", "Delivery Truck 2", "Isuzu", "NPR", "2021", "White", "JALC4W168M700002", "GU-2048", "Main", "In Service", 51210, 0, "Miguel", 15700),
    asset("a6", "EQ-22", "Heavy Equipment", "Skid Steer Loader", "Case", "SR210", "2022", "Yellow", "NJM452201", "", "Job Site", "In Service", 0, 920, "Ari", 0),
    asset("a7", "EQ-31", "Heavy Equipment", "Boom Lift", "JLG", "450AJ", "2018", "Orange", "JLG450-88421", "", "Yard", "Out of Service", 0, 2410, "Ari", 0),
    asset("a8", "ATT-14-BKT36", "Attachment", "36 in Excavator Bucket", "Bobcat", "E35 Bucket", "2020", "Black", "BKT36-EQ14", "", "Job Site", "In Service", 0, 0, "Ari", 1800, "EQ-14", "Attachment", "EQ-14, Bobcat E35, compact excavator quick coupler"),
  ];
  return {
    contacts: [
      contact("Supplier", "North Coast Supply", "orders@northcoast.example", "555-0101", "12 Harbor Rd", "Net 30", "V-1004", "Cleaning products"),
      contact("Supplier", "Metro Packaging", "sales@metro.example", "555-0102", "Warehouse Row", "Net 45", "V-1005", "Boxes and wrap"),
      contact("Supplier", "LiftPro Guam", "parts@liftpro.example", "555-0103", "Industrial Park", "Net 30", "V-1006", "Hydraulic and lift parts"),
      contact("Supplier", "Guam Bearing & Belt", "orders@bearing.example", "555-0104", "Dededo", "Net 30", "V-1007", "Bearings and belts"),
      contact("Supplier", "Blue Ocean Fuel", "ap@blueocean.example", "555-0105", "Fuel Depot", "Net 15", "V-1008", "Fuel and DEF"),
      contact("Supplier", "Pacific Tire Center", "tires@pacific.example", "555-0106", "Marine Corps Dr", "Net 30", "V-1009", "Tires"),
      contact("Customer", "Luna Market", "buyer@luna.example", "555-0190", "45 Palm St", "Net 15", "C-2201", "Weekly delivery"),
      contact("Customer", "Harbor Hotel", "maintenance@harbor.example", "555-0191", "Beach Rd", "Net 30", "C-2202", "Facility supply"),
      contact("Customer", "Pacific Builders", "ops@builders.example", "555-0192", "Route 8", "Net 30", "C-2203", "Construction customer"),
      contact("Customer", "Island Schools", "procurement@schools.example", "555-0193", "Central Office", "Net 45", "C-2204", "Central purchasing"),
      contact("Customer", "Coral Construction", "ap@coral.example", "555-0194", "Jobsite Office", "Net 30", "C-2205", "Rental and parts"),
      contact("Customer", "Talofofo Farms", "owner@farms.example", "555-0195", "Talofofo", "Net 15", "C-2206", "Farm account"),
    ],
    products,
    assets,
    mechanics: [
      { ref: "M-1001", name: "Miguel", hourlyRate: 45, phone: "555-0301", email: "miguel@example.com", specialty: "Fleet PM", status: "Active", notes: "" },
      { ref: "M-1002", name: "Ari", hourlyRate: 55, phone: "555-0302", email: "ari@example.com", specialty: "Hydraulics", status: "Active", notes: "" },
      { ref: "M-1003", name: "Jae", hourlyRate: 38, phone: "555-0303", email: "jae@example.com", specialty: "Rental checkout", status: "Active", notes: "" },
    ],
    purchaseOrders: [
      po("PO-7001", "Metro Packaging", "2026-05-15", "Matched", "INV-MP-8810", 48, "Matched", "Ready to Pay", [{ productId: "p4", qty: 100, cost: 0.48 }]),
      po("PO-7002", "North Coast Supply", "2026-05-15", "Partially Received", "INV-NC-4509", 378.5, "Mismatch", "Not Ready", [{ productId: "p1", qty: 50, cost: 3.25 }, { productId: "p2", qty: 40, cost: 2.75 }]),
      po("PO-7005", "Pacific Tire Center", "2026-04-29", "Goods Received", "PT-9007", 992, "Matched", "Ready to Pay", [{ productId: "p13", qty: 8, cost: 124 }]),
      po("PO-7006", "Blue Ocean Fuel", "2026-05-02", "Partially Received", "BOF-5101", 720, "Mismatch", "Hold", [{ productId: "p12", qty: 20, cost: 14.4 }, { productId: "p11", qty: 6, cost: 68 }]),
    ],
    orders: [
      so("SO-1001", "Luna Market", "LM-PO-5542", "2026-05-15", "Fulfilled", [{ productId: "p1", qty: 24, price: 7.99 }]),
      so("SO-1002", "Harbor Hotel", "", "2026-05-15", "Open", [{ productId: "p2", qty: 12, price: 6.99 }, { productId: "p3", qty: 2, price: 32 }], true),
      so("SO-1004", "Island Schools", "ISD-7781", "2026-04-28", "Open", [{ productId: "p9", qty: 12, price: 19.99 }, { productId: "p10", qty: 20, price: 12.5 }]),
    ],
    repairs: [
      repair("WO-1000", "a1", "2026-05-01", "Preventive Maintenance", "Island Auto Service", 38420, 0, "Oil change, tire rotation, brake inspection", [{ productId: "p6", qty: 6, unitCost: 6.5 }, { productId: "p3", qty: 1, unitCost: 18 }], [{ mechanic: "Miguel", clockIn: "2026-05-01T08:00", clockOut: "2026-05-01T12:00", rate: 45, note: "PM service" }], "Complete", "2026-08-01", 43420, 0),
      repair("WO-1001", "a3", "2026-05-03", "Repair", "LiftPro Guam", 0, 2925, "Hydraulic leak diagnosis and hose replacement", [{ productId: "p5", qty: 2, unitCost: 42 }], [{ mechanic: "Ari", clockIn: "2026-05-03T09:15", clockOut: "2026-05-03T14:45", rate: 55, note: "Replace hose and test lift" }], "Complete", "", 0, 3000),
      repair("WO-1004", "a7", "2026-05-02", "Breakdown", "LiftPro Guam", 0, 2410, "Boom lift will not extend under load", [{ productId: "p11", qty: 1, unitCost: 68, status: "Reserved" }], [{ mechanic: "Ari", clockIn: "2026-05-02T13:00", clockOut: "", rate: 55, note: "Diagnosis started, waiting parts" }], "Waiting Parts", "", 0, 2500),
    ],
    rentals: [
      { number: "R-3001", customer: "Luna Market", itemType: "Asset", itemId: "a4", startDate: "2026-05-15", endDate: "", invoiceTiming: "At start", rateType: "Daily", rate: 95, deposit: 200, status: "Out", checkoutReading: "visual OK", returnReading: "", notes: "Flatbed trailer rental" },
      { number: "R-3003", customer: "Coral Construction", itemType: "Asset", itemId: "a6", startDate: "2026-05-03", endDate: "", invoiceTiming: "At return", rateType: "Daily", rate: 260, deposit: 600, status: "Out", checkoutReading: "920 hr", returnReading: "", notes: "Skid steer at jobsite" },
    ],
    invoices: [
      { number: "INV-1001", date: "2026-05-15", dueDate: "2026-05-30", customer: "Luna Market", type: "Parts Sales", sourceRef: "SO-1001", status: "Open", notes: "Sales order invoice", lines: [{ description: "SKU-1001 - All-Purpose Cleaner", qty: 24, rate: 7.99 }] },
      { number: "WO-1000", date: "2026-05-01", dueDate: "2026-05-31", customer: "Internal", type: "Work Order", sourceRef: "WO-1000", status: "Open", notes: "Work order invoice", lines: [{ description: "PM service labor", qty: 4, rate: 45 }, { description: "Engine Oil 5W-30", qty: 6, rate: 6.5 }] },
    ],
    customerPayments: [
      { receiptNo: "PAY-1001", date: "2026-05-16", customer: "Luna Market", invoiceNumber: "INV-1001", amount: 100, method: "ACH", bankRef: "ACH-8891", status: "Posted", notes: "Partial payment" },
    ],
    accountingEntries: [
      { date: "2026-05-15", postingDate: "2026-05-15", account: "Accounts Receivable (A/R)", customer: "Luna Market", invoiceNumber: "INV-1001", invoiceDate: "2026-05-15", dueDate: "2026-05-30", description: "Parts invoice", reference: "INV-1001", debit: 191.76, credit: 0, source: "Invoice", status: "Posted" },
      { date: "2026-05-15", postingDate: "2026-05-15", account: "Parts Sales", customer: "Luna Market", invoiceNumber: "INV-1001", invoiceDate: "2026-05-15", dueDate: "2026-05-30", description: "Parts invoice", reference: "INV-1001", debit: 0, credit: 191.76, source: "Invoice", status: "Posted" },
      { date: "2026-05-15", postingDate: "2026-05-15", account: "COGS - Parts", customer: "Luna Market", invoiceNumber: "INV-1001", invoiceDate: "2026-05-15", dueDate: "2026-05-30", description: "Parts cost", reference: "INV-1001", debit: 78.00, credit: 0, source: "Invoice", status: "Posted" },
      { date: "2026-05-15", postingDate: "2026-05-15", account: "Parts Inventory", customer: "Luna Market", invoiceNumber: "INV-1001", invoiceDate: "2026-05-15", dueDate: "2026-05-30", description: "Parts cost", reference: "INV-1001", debit: 0, credit: 78.00, source: "Invoice", status: "Posted" },
      { date: "2026-05-16", postingDate: "2026-05-16", account: "FHB Checking", customer: "Luna Market", invoiceNumber: "INV-1001", invoiceDate: "2026-05-15", dueDate: "2026-05-30", description: "Customer payment", reference: "PAY-1001", debit: 100, credit: 0, source: "Customer Payment", status: "Posted" },
      { date: "2026-05-16", postingDate: "2026-05-16", account: "Accounts Receivable (A/R)", customer: "Luna Market", invoiceNumber: "INV-1001", invoiceDate: "2026-05-15", dueDate: "2026-05-30", description: "Customer payment", reference: "PAY-1001", debit: 0, credit: 100, source: "Customer Payment", status: "Posted" },
    ],
    bankTransactions: [
      { date: "2026-05-16", description: "Customer payment Luna Market", reference: "ACH-8891", amount: 100, status: "Matched", matchedReference: "INV-1001", notes: "" },
      { date: "2026-05-03", description: "Rental deposit Coral Construction", reference: "R-3003", amount: 600, status: "Unmatched", matchedReference: "", notes: "Match after invoice" },
    ],
    accounts: defaultChartOfAccounts(),
    accountTypes: Object.fromEntries(defaultChartOfAccounts().map((a) => [a.account, a.type])),
  };
}

async function loadEquipmentMasterAssets() {
  try {
    const response = await fetch("./equipment-master-assets.csv", { cache: "no-store" });
    if (!response.ok) return [];
    const text = await response.text();
    const sampleIds = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];
    return parseCsv(text).map((row, index) => ({
      id: sampleIds[index] || `pdf-asset-${index + 1}`,
      assetTag: row.asset_tag,
      type: row.type || "Equipment",
      generalType: row.general_type || "",
      name: row.name || row.asset_tag,
      make: row.make || "",
      model: row.model || "",
      year: row.year || "",
      color: row.color || "",
      vinSerial: row.vin_serial || "",
      plate: row.plate || "",
      location: row.location || "",
      oldQrCode: row.old_qr_code || row.old_qr || row.legacy_qr_code || row.qr_code || row.qr_printed_tagged || "",
      qrPrintedTagged: row.qr_printed_tagged || "",
      lastUpdateDate: row.last_update_date || row.last_updated || row.updated_date || "",
      status: row.status || "In Service",
      odometer: Number(row.odometer || 0),
      hours: Number(row.engine_hours || 0),
      operator: row.assigned_operator || "",
      purchaseCost: Number(row.purchase_cost || 0),
      registrationExpiry: row.registration_expiry || "",
      notes: row.notes || "",
    })).filter((row) => row.assetTag && row.name);
  } catch (error) {
    console.warn("Could not load PDF equipment master asset file", error);
    return [];
  }
}

async function importAssetMasterRows(localAssets) {
  await upsertMany("asset_types", uniqueMasterRows(localAssets.map((a) => a.type).concat(["Vehicle", "Heavy Equipment", "Trailer", "Attachment"])), "name");
  await upsertMany("asset_locations", uniqueMasterRows(localAssets.map((a) => a.location).concat(["Main", "Warehouse", "Yard", "Job Site"])), "name");
  const assets = localAssets.map(assetImportRow).filter((a) => a.asset_tag);
  await upsertMany("assets", assets, "asset_tag");
  const dbAssets = await getAll("assets");
  const assetByTag = new Map(dbAssets.map((row) => [row.asset_tag, row]));
  const relationshipUpdates = assets
    .filter((a) => a.parent_asset_tag)
    .map((a) => ({ ...a, parent_asset_id: assetByTag.get(a.parent_asset_tag)?.id || null }));
  await upsertMany("assets", relationshipUpdates, "asset_tag");
}

function assetImportRow(a) {
  return {
    asset_tag: a.assetTag,
    type: a.type || "Vehicle",
    general_type: a.generalType || null,
    name: a.name || a.assetTag,
    make: a.make || null,
    model: a.model || null,
    year: a.year || null,
    color: a.color || null,
    vin_serial: a.vinSerial || null,
    plate: a.plate || null,
    location: a.location || null,
    old_qr_code: a.oldQrCode || a.old_qr_code || a.oldQr || a.legacyQrCode || a.qrCode || a.qrPrintedTagged || null,
    last_update_date: a.lastUpdateDate || a.last_update_date || a.lastUpdated || a.updatedDate || null,
    qr_printed_tagged: a.qrPrintedTagged || null,
    gps_location: a.gpsLocation || null,
    scanned_date: a.scannedDate || null,
    status: a.status || "In Service",
    odometer: Number(a.odometer || 0),
    engine_hours: Number(a.hours || a.engineHours || 0),
    fuel_power: a.fuel || null,
    assigned_operator: a.operator || null,
    purchase_date: a.purchaseDate || null,
    purchase_cost: Number(a.purchaseCost || 0),
    insurance_policy: a.insurance || null,
    registration_expiry: a.registrationExpiry || null,
    photo_url: a.image || null,
    qr_update_url: a.qrUpdateUrl || assetQrUrl({ asset_tag: a.assetTag }),
    parent_asset_tag: a.parentAssetTag || null,
    relationship_type: a.relationshipType || (a.parentAssetTag ? "Attachment" : "Standalone"),
    compatible_with: a.compatibleWith || null,
    notes: a.notes || null,
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell !== "")) rows.push(row);
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function contact(type, name, email, phone, address, terms, taxId, notes) {
  return { type, name, email, phone, address, terms, taxId, notes };
}

function product(id, sku, name, category, unit, warehouse, qty, reorder, cost, price, location, supplier) {
  return { id, sku, name, category, unit, warehouse, qty, reorder, cost, price, location, supplier, status: qty <= reorder ? "Low" : "Active", notes: "", compatibleWith: "", alternateSkus: "" };
}

function asset(id, assetTag, type, name, make, model, year, color, vinSerial, plate, location, status, odometer, hours, operator, purchaseCost, parentAssetTag = "", relationshipType = "Standalone", compatibleWith = "") {
  return { id, assetTag, type, name, make, model, year, color, vinSerial, plate, location, status, odometer, hours, operator, purchaseCost, parentAssetTag, relationshipType, compatibleWith, fuel: "Diesel", purchaseDate: "2024-01-15", insurance: "", registrationExpiry: "2027-12-31", notes: "" };
}

function po(number, supplier, date, status, invoiceNumber, invoiceAmount, matchStatus, paymentStatus, lines) {
  return { number, supplier, date, expected: date, jobsiteProject: "Main Warehouse Restock", paymentTerms: "Net 30", incoterm: "FOB", freightAmount: 0, landedCostEnabled: false, landedCostMethod: "By Value", dutyAmount: 0, otherLandedCostAmount: 0, foreignOrder: false, foreignCountry: "", currencyCode: "USD", exchangeRate: 1, status, invoiceNumber, invoiceAmount, matchStatus, paymentStatus, lines, notes: "Sample PO" };
}

function so(number, customer, customerPO, date, status, lines, override = false, paymentMode = "PO") {
  return { number, customer, customerPO, paymentMode, managerOverride: override, overrideBy: override ? "Maria Manager" : "", overrideReason: override ? "Sample manager override" : "", date, status, lines, notes: "Sample sales order" };
}

function repair(workOrder, assetId, date, type, vendor, odometer, hours, description, parts, laborEntries, status, nextDueDate, nextDueOdometer, nextDueHours) {
  return { workOrder, assetId, date, type, vendor, odometer, hours, description, parts, laborEntries, status, nextDueDate, nextDueOdometer, nextDueHours, priority: status === "Waiting Parts" ? "High" : "Medium", customerPO: "INTERNAL-SAMPLE", managerOverride: false, overrideBy: "", overrideReason: "", notes: "Sample work order" };
}

async function importLocalState(local) {
  const vendors = (local.contacts || []).filter((c) => c.type === "Supplier").map((c, i) => ({
    reference: c.reference || `V-${1001 + i}`,
    name: c.name,
    email: c.email || null,
    phone: c.phone || null,
    address: c.address || null,
    terms: c.terms || null,
    tax_id: c.taxId || null,
    notes: c.notes || null,
  })).filter((r) => r.name);
  const customers = (local.contacts || []).filter((c) => c.type === "Customer").map((c, i) => ({
    reference: c.reference || `C-${1001 + i}`,
    name: c.name,
    email: c.email || null,
    phone: c.phone || null,
    address: c.address || null,
    terms: c.terms || null,
    tax_id: c.taxId || null,
    notes: c.notes || null,
  })).filter((r) => r.name);
  await upsertMany("vendors", vendors, "name");
  await upsertMany("customers", customers, "name");
  await upsertMany("categories", uniqueMasterRows((local.products || []).map((p) => p.category).concat(["Finished Goods", "Packaging", "Supplies", "Service Parts"])), "name");
  await upsertMany("units", uniqueMasterRows((local.products || []).map((p) => p.unit).concat(["Each", "Box", "Set", "Hour", "Day"])), "name");
  await upsertMany("warehouses", uniqueMasterRows((local.products || []).map((p) => p.warehouse).concat(["Main", "Back Room", "Showroom", "Transit"])), "name");

  const products = (local.products || []).map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category || "Finished Goods",
    unit: p.unit || "Each",
    warehouse: p.warehouse || "Main",
    bin_shelf: p.location || p.bin || null,
    qty: Number(p.qty || 0),
    reorder_point: Number(p.reorder || 0),
    cost: p.cost === "" ? null : Number(p.cost || 0),
    selling_price: p.price === "" ? null : Number(p.price || 0),
    markup_percent: p.markupPercent === "" ? null : p.markupPercent ? Number(p.markupPercent) : null,
    source_vendor: p.supplier || null,
    photo_url: p.image || null,
    barcode: p.barcode || null,
    batch_lot: p.batchLot || p.batch || null,
    expiry_date: p.expiryDate || p.expiry || null,
    status: p.status || "Active",
    compatible_with: p.compatibleWith || null,
    notes: p.notes || null,
  })).filter((p) => p.sku && p.name);
  products.forEach((p) => {
    if (p.selling_price && p.markup_percent) p.markup_percent = null;
    if (!p.selling_price && !p.markup_percent) p.selling_price = 0;
  });
  await upsertMany("products", products, "sku");
  const dbProducts = await getAll("products");
  const productByLocalId = new Map();
  (local.products || []).forEach((p) => {
    const db = dbProducts.find((row) => row.sku === p.sku);
    if (db) productByLocalId.set(p.id, db);
  });

  await importAssetMasterRows(local.assets || []);
  const assets = (local.assets || []).map(assetImportRow).filter((a) => a.asset_tag);
  const dbAssets = await getAll("assets");
  const assetByLocalId = new Map();
  (local.assets || []).forEach((a) => {
    const db = dbAssets.find((row) => row.asset_tag === a.assetTag);
    if (db) assetByLocalId.set(a.id, db);
  });

  await upsertMany("mechanics", (local.mechanics || []).map((m, i) => ({
    reference: m.ref || `M-${1001 + i}`,
    name: m.name,
    hourly_rate: Number(m.hourlyRate || 0),
    phone: m.phone || null,
    email: m.email || null,
    specialty: m.specialty || null,
    status: m.status || "Active",
    notes: m.notes || null,
  })).filter((m) => m.name), "name");

  await importPurchaseOrders(local.purchaseOrders || [], productByLocalId);
  await importSalesOrders(local.orders || [], productByLocalId);
  await importAssetsRepairs(local.repairs || [], assetByLocalId, productByLocalId);
  await importRentals(local.rentals || [], assetByLocalId, productByLocalId);
  await importInvoices(local);
  await importAccounting(local);
}

async function importPurchaseOrders(pos, productByLocalId) {
  for (const [poIndex, po] of pos.entries()) {
    const row = {
      po_no: po.number,
      vendor: po.supplier,
      po_date: po.date || today(),
      jobsite_project: po.jobsiteProject || po.jobsite_project || "General",
      expected_date: po.expected || null,
      payment_terms: po.paymentTerms || po.payment_terms || "Net 30",
      incoterm: po.incoterm || "FOB",
      foreign_order: !!(po.foreignOrder || po.foreign_order),
      foreign_country: po.foreignCountry || po.foreign_country || null,
      currency_code: po.currencyCode || po.currency_code || "USD",
      exchange_rate: Number(po.exchangeRate || po.exchange_rate || 1),
      freight_amount: Number(po.freightAmount || po.freight_amount || 0),
      landed_cost_enabled: !!(po.landedCostEnabled || po.landed_cost_enabled),
      landed_cost_method: po.landedCostMethod || po.landed_cost_method || "By Value",
      duty_amount: Number(po.dutyAmount || po.duty_amount || 0),
      other_landed_cost_amount: Number(po.otherLandedCostAmount || po.other_landed_cost_amount || 0),
      vendor_invoice_no: po.invoiceNumber || null,
      vendor_invoice_date: po.invoiceDate || null,
      due_date: po.dueDate || null,
      vendor_invoice_amount: Number(po.invoiceAmount || 0),
      posting_date: po.postingDate || po.invoiceDate || po.date || today(),
      match_status: po.matchStatus || "Pending",
      payment_status: po.paymentStatus || "Not Ready",
      status: po.status || "Draft",
      notes: po.notes || null,
    };
    const saved = await upsertOne("purchase_orders", row, "po_no");
    await supabase.from("purchase_order_lines").delete().eq("po_id", saved.id);
    await upsertMany("purchase_order_lines", (po.lines || []).map((line) => {
      const p = productByLocalId.get(line.productId);
      return { po_id: saved.id, wo_no: line.woNo || null, product_id: p?.id || null, sku: p?.sku || line.sku || "", product_name: p?.name || line.product || "", unit: p?.unit || line.unit || null, qty: Number(line.qty || 0), foreign_unit_cost: Number(line.foreignCost || line.foreign_unit_cost || 0), unit_cost: Number(line.cost || 0), allocated_landed_cost: 0, landed_unit_cost: Number(line.cost || 0) };
    }).filter((line) => line.sku), "id");
    if (/received|matched|paid/i.test(po.status || "") || Number(po.invoiceAmount || 0) > 0) {
      const receiptRows = (po.lines || []).map((line, lineIndex) => {
        const p = productByLocalId.get(line.productId);
        const ordered = Number(line.qty || 0);
        const received = /partial/i.test(po.status || "") ? Math.max(1, Math.round(ordered * 0.6)) : ordered;
        const cost = Number(line.cost || 0);
        return {
          gr_no: `GR-${6001 + poIndex}-${lineIndex + 1}`,
          gr_date: po.date || today(),
          po_id: saved.id,
          po_no: saved.po_no,
          vendor: saved.vendor,
          product_id: p?.id || null,
          sku: p?.sku || line.sku || "",
          product_name: p?.name || line.product || "",
          ordered_qty: ordered,
          received_qty: received,
          unit_cost: cost,
          vendor_invoice_no: po.invoiceNumber || null,
          vendor_invoice_date: po.invoiceDate || po.date || today(),
          vendor_invoice_amount: received * cost,
          received_by: profile?.full_name || profile?.username || "Owner",
          receipt_type: received >= ordered ? "Full" : "Partial",
          status: "Received",
          notes: "Sample goods receipt",
        };
      }).filter((gr) => gr.sku && gr.received_qty > 0);
      await supabase.from("goods_receipts").delete().eq("po_no", saved.po_no);
      await upsertMany("goods_receipts", receiptRows, "gr_no");
      await postGoodsReceiptLedger(receiptRows);
    }
  }
}

async function importSalesOrders(orders, productByLocalId) {
  for (const order of orders) {
    const row = {
      order_no: order.number,
      customer: order.customer,
      customer_po: order.customerPO || null,
      payment_mode: order.paymentMode || order.payment_mode || "PO",
      manager_override: !!order.managerOverride,
      override_by: order.overrideBy || null,
      override_reason: order.overrideReason || null,
      order_date: order.date || today(),
      status: order.status || "Open",
      invoice_no: order.invoiceNo || order.invoice || null,
      notes: order.notes || null,
    };
    if (!row.customer_po && !row.manager_override) {
      row.manager_override = true;
      row.override_by = "Imported";
      row.override_reason = "Imported local record without customer PO.";
    }
    const saved = await upsertOne("sales_orders", row, "order_no");
    await supabase.from("sales_order_lines").delete().eq("order_id", saved.id);
    await upsertMany("sales_order_lines", (order.lines || []).map((line) => {
      const p = productByLocalId.get(line.productId);
      return { order_id: saved.id, product_id: p?.id || null, sku: p?.sku || line.sku || "", product_name: p?.name || line.product || "", qty: Number(line.qty || 0), price: Number(line.price || 0) };
    }).filter((line) => line.sku), "id");
  }
}

async function importAssetsRepairs(repairs, assetByLocalId, productByLocalId) {
  for (const r of repairs) {
    const asset = assetByLocalId.get(r.assetId);
    const row = {
      wo_no: r.workOrder,
      wo_date: r.date || today(),
      asset_id: asset?.id || null,
      asset_tag: asset?.asset_tag || null,
      bill_to_customer: r.billToCustomer || null,
      customer_po: r.customerPO || null,
      manager_override: !!r.managerOverride,
      override_by: r.overrideBy || null,
      override_reason: r.overrideReason || null,
      work_type: r.type || "Repair",
      priority: r.priority || "Medium",
      vendor_shop: r.vendor || null,
      odometer: Number(r.odometer || 0),
      engine_hours: Number(r.hours || 0),
      description: r.description || null,
      status: r.status || "Open",
      next_due_date: r.nextDueDate || null,
      next_due_odometer: Number(r.nextDueOdometer || 0),
      next_due_hours: Number(r.nextDueHours || 0),
      invoice_no: r.invoice || null,
      notes: r.notes || null,
    };
    if (row.bill_to_customer && !row.customer_po && !row.manager_override) {
      row.manager_override = true;
      row.override_by = "Imported";
      row.override_reason = "Imported local work order without customer PO.";
    }
    const saved = await upsertOne("work_orders", row, "wo_no");
    await supabase.from("work_order_issues").delete().eq("wo_id", saved.id);
    await supabase.from("work_order_parts").delete().eq("wo_id", saved.id);
    await supabase.from("work_order_labor").delete().eq("wo_id", saved.id);
    const issues = (r.issues && r.issues.length ? r.issues : [{ issue: r.description || "General work order", status: r.status || "Open", date: r.date || today(), assignedMechanic: "", notes: "" }]);
    await upsertMany("work_order_issues", issues.map((i) => ({ wo_id: saved.id, issue_date: i.date || r.date || today(), issue: i.issue || "General work order", status: i.status || "Open", assigned_mechanic: i.assignedMechanic || i.mechanic || null, work_notes: i.notes || i.workNotes || null })), "id");
    await upsertMany("work_order_parts", (r.parts || []).map((part) => {
      const p = productByLocalId.get(part.productId);
      return { wo_id: saved.id, issue: part.issue || "General", product_id: p?.id || null, sku: p?.sku || part.sku || "", product_name: p?.name || part.product || "", qty_needed: Number(part.qty || part.qtyNeeded || 0), unit_cost: Number(part.unitCost || 0), availability: part.availability || "OK", status: part.status || "Accepted", accepted_qty: Number(part.acceptedQty || part.qty || 0), notes: part.notes || null };
    }).filter((part) => part.sku), "id");
    await upsertMany("work_order_labor", (r.laborEntries || []).map((l) => ({ wo_id: saved.id, mechanic: l.mechanic || "Unassigned", issue: l.issue || "General", clock_in: l.clockIn || null, clock_out: l.clockOut || null, hourly_rate: Number(l.rate || 0), work_done: l.note || l.workDone || null })), "id");
  }
}

async function importRentals(rentals, assetByLocalId, productByLocalId) {
  const rows = rentals.map((r) => {
    const item = r.itemType === "Asset" ? assetByLocalId.get(r.itemId) : productByLocalId.get(r.itemId);
    return { rental_no: r.number, customer: r.customer, item_type: r.itemType || "Asset", item_id: item?.id || null, item_ref: item?.asset_tag || item?.sku || r.itemId || null, start_date: r.startDate || today(), end_date: r.endDate || null, invoice_timing: r.invoiceTiming || "At start", rate_type: r.rateType || "Daily", rate: Number(r.rate || 0), deposit: Number(r.deposit || 0), status: r.status || "Reserved", checkout_reading: r.checkoutReading || null, return_reading: r.returnReading || null, invoice_no: r.invoiceNo || r.invoice || null, notes: r.notes || null };
  }).filter((r) => r.rental_no);
  await upsertMany("rentals", rows, "rental_no");
}

async function importInvoices(local) {
  for (const inv of local.invoices || []) {
    const row = { invoice_no: inv.number, invoice_date: inv.date || today(), due_date: inv.dueDate || inv.date || today(), customer: inv.customer, type: inv.type || "Other", source_ref: inv.sourceRef || null, status: inv.status || "Open", notes: inv.notes || null };
    const saved = await upsertOne("invoices", row, "invoice_no");
    await supabase.from("invoice_lines").delete().eq("invoice_id", saved.id);
    await upsertMany("invoice_lines", (inv.lines || []).map((line) => ({ invoice_id: saved.id, description: line.description || "", unit: line.unit || line.uom || "", qty: Number(line.qty || 1), rate: Number(line.rate || 0) })).filter((line) => line.description), "id");
  }
  await upsertMany("customer_payments", (local.customerPayments || []).map((p, i) => ({ receipt_no: p.receiptNo || p.reference || `PAY-${1001 + i}`, payment_date: p.date || today(), customer: p.customer, invoice_no: p.invoiceNumber || null, amount: Number(p.amount || 0), method: p.method || null, bank_reference: p.bankRef || p.bankReference || null, status: p.status || "Posted", notes: p.notes || null })).filter((p) => p.customer), "receipt_no");
}

async function importAccounting(local) {
  await ensureChartColumnsReady();
  await upsertMany("chart_of_accounts", (local.accounts || []).map((a) => {
    const account = typeof a === "string" ? a : a.account;
    const type = (typeof a === "object" && a.type) || local.accountTypes?.[account] || accountType(account);
    const row = { account, type, normal_balance: (typeof a === "object" && a.normal_balance) || normalBalance(type), notes: (typeof a === "object" && a.notes) || null };
    if (productMeta.chartExtraColumns) {
      row.account_code = typeof a === "object" ? a.account_code || null : null;
      row.report_group = typeof a === "object" ? a.report_group || statementGroup(type) : statementGroup(type);
    }
    return row;
  }).filter((a) => a.account), "account");
  await upsertMany("general_ledger", (local.accountingEntries || []).map((e, i) => ({ entry_date: e.date || today(), posting_date: e.postingDate || e.date || today(), account: e.account, customer: e.customer || null, vendor: e.vendor || null, invoice_no: e.invoiceNumber || null, invoice_date: e.invoiceDate || null, due_date: e.dueDate || null, mechanic: e.mechanic || null, asset: e.asset || null, description: e.description || e.notes || null, reference: e.reference || `IMP-GL-${i + 1}`, debit: e.debit ? Number(e.debit) : e.amount > 0 ? Number(e.amount) : 0, credit: e.credit ? Number(e.credit) : e.amount < 0 ? Math.abs(Number(e.amount)) : 0, source: e.source || e.type || "Import", status: e.status || "Posted" })).filter((e) => e.account), "id");
  await upsertMany("bank_transactions", (local.bankTransactions || []).map((b) => ({ tx_date: b.date || today(), description: b.description || null, reference: b.reference || null, amount: Number(b.amount || 0), status: b.status || "Unmatched", matched_reference: b.matchedReference || null, notes: b.notes || null })), "id");
}

async function ensureChartColumnsReady() {
  if (typeof productMeta.chartExtraColumns === "boolean") return productMeta.chartExtraColumns;
  const { error } = await supabase.from("chart_of_accounts").select("account_code,report_group").limit(1);
  productMeta.chartExtraColumns = !error;
  return productMeta.chartExtraColumns;
}

async function upsertOne(table, row, onConflict) {
  const { data, error } = await supabase.from(table).upsert(row, { onConflict }).select().single();
  if (error) throw error;
  return data;
}

async function insertOne(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

async function upsertMany(table, rows, onConflict) {
  if (!rows.length) return [];
  const chunkSize = 100;
  const out = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase.from(table).upsert(chunk, { onConflict }).select();
    if (error) throw error;
    out.push(...(data || []));
  }
  return out;
}

function uniqueMasterRows(values) {
  return [...new Set(values.map((v) => String(v || "").trim()).filter(Boolean))].map((name) => ({ name }));
}
