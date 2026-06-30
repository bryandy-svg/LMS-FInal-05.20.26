import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const modules = [
  { group: "Home", items: [["dashboard", "Dashboard"]] },
  { group: "Inventory", items: [["products", "Products"], ["movements", "Stock Movement"], ["inventory", "Inventory Balance"], ["purchasing", "Purchasing"], ["receipts", "Goods Receipts"]] },
  { group: "Sales & Billing", items: [["quotes", "Quotations"], ["orders", "Sales Orders"], ["salestopurchase", "Parts to Order"], ["rentals", "Rentals"], ["invoices", "Invoices"], ["payments", "Customer Payments"]] },
  { group: "Fleet & Repairs", items: [["assets", "Fleet & Equipment"], ["outsidefleet", "Outside Customer Fleet"], ["equipmentrequests", "Equipment Requests"], ["equipmentrepairqueue", "Equipment Subject to Repair"], ["equipmenthistory", "Equipment History"], ["repairs", "Repairs"], ["supplies", "Supplies Issuance"], ["partsrequests", "Parts Requests"], ["mechanics", "Mechanics"]] },
  { group: "Accounting", items: [["accounting", "Accounting"], ["coa", "Chart of Accounts"], ["bank", "Bank Reconciliation"], ["checkrun", "Check Run"], ["aging", "Aging Summary"]] },
  { group: "Masters", items: [["vendors", "Vendors"], ["customers", "Customers"], ["users", "Users"], ["settings", "Settings"]] },
];

const userModuleChoices = modules.flatMap((group) => group.items.map(([id, label]) => ({ id, label, group: group.group })));

const cloneTables = [
  "app_profiles",
  "app_sequences",
  "master_terms",
  "incoterms",
  "standard_po_notes",
  "vendors",
  "customers",
  "warehouses",
  "categories",
  "units",
  "products",
  "product_alternates",
  "asset_locations",
  "asset_types",
  "assets",
  "mechanics",
  "purchase_orders",
  "purchase_order_lines",
  "goods_receipts",
  "quotations",
  "quotation_lines",
  "sales_orders",
  "sales_order_lines",
  "equipment_requests",
  "outside_customer_fleet",
  "work_orders",
  "work_order_issues",
  "work_order_parts",
  "work_order_labor",
  "rentals",
  "invoices",
  "invoice_lines",
  "customer_payments",
  "chart_of_accounts",
  "general_ledger",
  "bank_transactions",
  "bank_beginning_balances",
  "accounting_periods",
  "check_runs",
  "stock_movements",
];

const cloneImportOrder = cloneTables;
const cloneDeleteOrder = [...cloneTables].reverse();
const cloneImportOptionalTables = new Set(["app_profiles"]);
const ACCOUNTING_SUMMARY_STORAGE_KEY = "lms.accountingSummaryCollapsed.v1";

const tableMap = {
  products: { table: "products", key: "sku", title: "Products", sub: "Manage SKUs, pricing, locations, reorder points, batches, compatible parts, and photos.", heads: ["photo_url", "sku", "name", "source_vendor", "category", "unit", "warehouse", "bin_shelf", "qty", "reorder_point", "cost", "selling_price", "markup_percent", "status"], labels: ["Photo", "SKU", "Product", "Preferred Vendor", "Category", "Unit", "Warehouse", "Bin / Shelf", "Qty", "Reorder", "Cost", "Price", "Markup %", "Status"] },
  movements: { table: "stock_movements", key: "reference_no", title: "Stock Movement", sub: "Receive, sell, adjust, transfer, reserve, and audit stock.", heads: ["movement_date", "reference_no", "type", "product_name", "vendor", "sold_to", "sold_date", "qty", "from_warehouse", "from_bin_shelf", "to_warehouse", "to_bin_shelf", "unit_fifo_cost", "total_fifo_cost", "document_no", "entered_by", "reason"], labels: ["Date", "Reference #", "Type", "Product", "Vendor", "Sold To", "Sold Date", "Qty", "From Warehouse", "From Bin", "To Warehouse", "To Bin", "Unit FIFO Cost", "Total FIFO Cost", "Document", "Entered By", "Reason"], readOnly: true },
  purchasing: { table: "purchase_orders", key: "po_no", title: "Purchasing", sub: "PO issue, goods receipt, matching, landed cost, AP posting, and payment readiness.", heads: ["po_no", "po_date", "vendor", "jobsite_project", "payment_terms", "incoterm", "currency_code", "freight_amount", "duty_amount", "other_landed_cost_amount", "landed_cost_enabled", "vendor_invoice_no", "vendor_invoice_amount", "match_status", "payment_status", "status"], labels: ["PO", "Date", "Vendor", "Jobsite / Project", "Terms", "Incoterm", "Currency", "Freight", "Duty", "Other Landed", "Landed Cost", "Invoice", "Invoice Amount", "Match", "Payment", "Status"] },
  receipts: { table: "goods_receipts", key: "gr_no", title: "Goods Receipts", sub: "Receive ordered goods only and track partial/full receipt.", heads: ["gr_no", "gr_date", "po_no", "vendor", "vendor_invoice_no", "vendor_invoice_date", "vendor_invoice_amount", "sku", "product_name", "ordered_qty", "received_qty", "unit_cost", "received_amount", "receipt_warehouse", "receipt_bin_shelf", "received_by", "receipt_type", "status"], labels: ["GR #", "Date", "PO", "Vendor", "Invoice #", "Invoice Date", "Invoice Amount", "SKU", "Product", "Ordered", "Received", "Unit Cost", "Amount", "Warehouse", "Bin / Shelf", "Received By", "Receipt Type", "Status"] },
  quotes: { table: "quotations", key: "quote_no", title: "Quotations", sub: "Create customer quotations and convert accepted quotes into sales orders.", heads: ["quote_no", "quote_date", "customer", "valid_until", "status", "sales_order_no"], labels: ["Quote", "Date", "Customer", "Valid Until", "Status", "Sales Order"] },
  orders: { table: "sales_orders", key: "order_no", title: "Sales Orders", sub: "Customer demand, customer PO controls, line items, fulfillment, and invoicing.", heads: ["order_no", "order_date", "customer", "customer_po", "payment_mode", "manager_override", "override_by", "status", "invoice_no"], labels: ["Order", "Date", "Customer", "Customer PO", "Payment Mode", "Override", "Override By", "Status", "Invoice"] },
  salestopurchase: { title: "Parts to Order", sub: "Customer sales demand that is reserved or backordered until stock is received.", derived: true },
  assets: { table: "assets", key: "asset_tag", title: "Fleet & Equipment", sub: "Track vehicles, heavy equipment, readings, ownership, locations, photos, QR codes, requests, and parent/child attachments.", heads: ["photo_url", "qr_update_url", "old_qr_code", "asset_tag", "name", "type", "general_type", "parent_asset_tag", "relationship_type", "compatible_with", "make", "model", "color", "size", "vin_serial", "plate", "location", "gps_location", "last_update_date", "scanned_date", "odometer", "engine_hours", "assigned_operator", "requested_by", "approved_by", "repair_po_no", "status"], labels: ["Photo", "New QR", "Old QR Code", "Asset #", "Description", "Type", "General Type", "Parent Asset", "Relationship", "Compatible With", "Make", "Model", "Color", "Size", "VIN / Serial", "Plate", "Location", "GPS", "Last Update Date", "Scanned Date", "Odometer", "Hours", "Operator", "Requested By", "Approved By", "Repair PO #", "Status"] },
  outsidefleet: { table: "outside_customer_fleet", key: "reference", title: "Outside Customer Fleet", sub: "Customer-owned equipment that can be requested, inspected, repaired, and billed without adding it to LMS owned fleet.", heads: ["reference", "customer_name", "po_no", "vin", "model", "make", "description", "status", "wo_no"], labels: ["Reference", "Customer Name", "PO #", "VIN #", "Model", "Make", "Description", "Status", "WO #"] },
  equipmentrequests: { table: "equipment_requests", key: "request_no", title: "Equipment Requests", sub: "Request one or multiple equipment items with date range, location, customer PO, email, signature, and approval tracking.", heads: ["request_no", "request_date", "equipment_photos", "asset_tag", "asset_name", "location", "requested_by", "email_address", "po_no", "po_attachment_name", "from_date", "to_date", "approved_by", "status"], labels: ["Request #", "Date", "Photo", "Asset #", "Equipment", "Location", "Requested By", "Email", "PO #", "PO File", "From", "To", "Approved By", "Status"] },
  repairs: { table: "work_orders", key: "wo_no", title: "Repairs", sub: "Work orders, issue details, parts, labor, priority, billing, and next service.", heads: ["wo_no", "wo_date", "asset_tag", "priority", "bill_to_customer", "customer_po", "work_type", "vendor_shop", "odometer", "engine_hours", "status", "invoice_no"], labels: ["WO #", "Date", "Asset", "Priority", "Bill To", "Customer PO", "Type", "Vendor / Shop", "Odometer", "Hours", "Status", "Invoice"] },
  supplies: { title: "Supplies Issuance", sub: "Issue supplies to employees or mechanics, with optional work order charging.", derived: true },
  partsrequests: { table: "work_order_parts", key: "id", title: "Parts Requests", sub: "Mechanic shortages and parts needing purchase.", heads: ["request_photo_url", "sku", "product_name", "qty_needed", "unit_cost", "amount", "availability", "status", "accepted_qty", "notes"], labels: ["Photo", "SKU", "Product", "Qty Needed", "Unit Cost", "Amount", "Availability", "Status", "Accepted Qty", "Notes"] },
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
let purchasingTab = "open";
let accountsPayableTab = "forcheck";
let accountingCloseDateCache = null;
let trainingMode = null;
let trainingIndex = 0;
let trainingAutoplay = null;
let productMeta = { vendors: [], categories: [], units: [], warehouses: [] };
let purchaseContext = { products: [], vendors: [], vendorRows: [] };
const productColumnDefs = [
  ["photo", "Photo"], ["sku", "SKU"], ["name", "Product"], ["source_vendor", "Preferred Vendor"], ["category", "Category"], ["unit", "Unit"],
  ["warehouse", "Warehouse"], ["bin_shelf", "Bin / Shelf"], ["qty", "Qty"], ["reorder_point", "Reorder"], ["cost", "Cost"],
  ["selling_price", "Price"], ["markup_percent", "Markup %"], ["status", "Status"], ["compatible_with", "Compatible With"], ["barcode", "Barcode"], ["batch_lot", "Batch / Lot"], ["expiry_date", "Expiry Date"], ["notes", "Notes"],
];
const assetColumnDefs = [
  ["photo", "Photo"], ["new_qr", "New QR"], ["old_qr_code", "Old QR Code"], ["needs_qr_code_printed", "Needs QR Code Printed"], ["asset_tag", "Asset #"], ["description", "Description"], ["type", "Type"],
  ["general_type", "General Type"], ["parent_asset", "Parent Asset"], ["relationship_type", "Relationship"], ["compatible_with", "Compatible With"],
  ["make_model", "Make / Model"], ["color", "Color"], ["size", "Size"], ["vin_serial", "VIN / Serial"], ["plate", "Plate"], ["location", "Location"], ["gps_location", "GPS"],
  ["last_update_date", "Last Update Date"], ["scanned_date", "Scanned Date"], ["return_date", "Return Date"], ["reading", "Reading"], ["assigned_operator", "Operator"], ["requested_by", "Requested By"], ["approved_by", "Approved By"], ["repair_po_no", "Repair PO #"], ["open_wo_issue", "WO / Issue"], ["status", "Status"],
];
const ASSET_COLUMN_STORAGE_KEY = "lms.assetColumns.v6";
const PRODUCT_RENDER_LIMIT = 500;
const ASSET_SUMMARY_STORAGE_KEY = "lms.assetSummaryCollapsed.v1";
const ASSET_FILTER_STORAGE_KEY = "lms.assetFiltersCollapsed.v1";

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
const today = () => new Date().toISOString().slice(0, 10);
const localToday = () => dateTimeLocalValue(new Date().toISOString()).slice(0, 10);

boot();

async function boot() {
  const publicScan = hasAssetHash();
  renderNav();
  bindChrome();
  const { data } = await supabase.auth.getSession();
  session = data.session;
  if (session) await loadProfile();
  if (session) await loadAccountingCloseDate();
  renderNav();
  updateAuthView();
  if (publicScan) {
    await handleAssetHash();
  } else if (session) {
    await loadView(defaultView());
  }
  window.addEventListener("hashchange", handleAssetHash);
}

function bindChrome() {
  $("loginBtn").onclick = login;
  $("logoutBtn").onclick = logout;
  $("refreshBtn").onclick = () => loadView(currentView);
  $("exportBtn").onclick = () => adminOnly(exportCurrentCsv);
  $("cloneExportBtn").onclick = () => adminOnly(exportSystemClone);
  $("offlineCloneBtn").onclick = () => adminOnly(exportOfflineCloneApp);
  $("importBtn").onclick = () => adminOnly(() => $("fileImport").click());
  $("sampleBtn").onclick = () => adminOnly(loadSampleData);
  $("clearBtn").onclick = () => adminOnly(clearTestData);
  $("fileImport").onchange = importLocalJson;
  $("quickTourBtn").onclick = () => startTraining("quick");
  $("fullTourBtn").onclick = () => startTraining("full");
  $("modalClose").onclick = closeModal;
  $("modalCancel").onclick = closeModal;
  $("modalSave").onclick = saveModal;
  setupSeamlessDropdowns();
  setupUiRecommendations();
  new MutationObserver(enhanceColumnFilters).observe($("content"), { childList: true, subtree: true });
}

let activeSuggestInput = null;
let activeSuggestMenu = null;

function isSuggestPicker(el) {
  return !!el?.matches?.("input.suggest-input[list], input.column-filter");
}

function datalistOptions(input) {
  const listId = input?.getAttribute?.("list");
  const list = listId ? document.getElementById(listId) : null;
  return list ? [...list.querySelectorAll("option")].map((option) => option.value || option.textContent || "") : [];
}

function columnFilterOptions(input) {
  const table = input?.closest?.("table");
  const col = Number(input?.dataset?.col || 0);
  if (!table || Number.isNaN(col)) return [];
  return [...table.querySelectorAll("tbody tr")]
    .filter((row) => row.style.display !== "none" && !row.querySelector(".empty"))
    .map((row) => (row.children[col]?.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function suggestOptions(input) {
  const values = input?.classList?.contains("column-filter") ? columnFilterOptions(input) : datalistOptions(input);
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function matchingSuggestOptions(input) {
  if (input?.dataset?.suggestShowAll === "1") {
    input.dataset.suggestShowAll = "";
    return suggestOptions(input)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .slice(0, 120);
  }
  const terms = String(input?.value || "").toLowerCase().split(/\s+/).filter(Boolean);
  return suggestOptions(input)
    .filter((value) => terms.every((term) => value.toLowerCase().includes(term)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .slice(0, 80);
}

function ensureSuggestMenu() {
  if (activeSuggestMenu) return activeSuggestMenu;
  activeSuggestMenu = document.createElement("div");
  activeSuggestMenu.className = "suggest-menu";
  activeSuggestMenu.hidden = true;
  document.body.appendChild(activeSuggestMenu);
  activeSuggestMenu.addEventListener("pointerdown", (event) => event.preventDefault());
  activeSuggestMenu.addEventListener("click", (event) => {
    const option = event.target.closest("[data-suggest-value]");
    if (!option || !activeSuggestInput) return;
    selectSuggestOption(activeSuggestInput, option.dataset.suggestValue || "");
  });
  return activeSuggestMenu;
}

function positionSuggestMenu(input) {
  const menu = ensureSuggestMenu();
  const rect = input.getBoundingClientRect();
  menu.style.left = `${Math.max(8, rect.left)}px`;
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.width = `${Math.max(220, rect.width)}px`;
  menu.style.maxWidth = `${Math.max(260, window.innerWidth - rect.left - 14)}px`;
}

function showSuggestMenu(input) {
  if (!isSuggestPicker(input)) return;
  activeSuggestInput = input;
  const menu = ensureSuggestMenu();
  const options = matchingSuggestOptions(input);
  positionSuggestMenu(input);
  menu.innerHTML = options.length
    ? options.map((value) => `<button type="button" class="suggest-option" data-suggest-value="${esc(value)}">${esc(value)}</button>`).join("")
    : `<div class="suggest-empty">No matching choices</div>`;
  menu.hidden = false;
  input.classList.add("picker-open");
}

function hideSuggestMenu() {
  if (activeSuggestInput) activeSuggestInput.classList.remove("picker-open");
  activeSuggestInput = null;
  if (activeSuggestMenu) activeSuggestMenu.hidden = true;
}

function refreshSuggestMenu() {
  if (activeSuggestInput && !activeSuggestMenu?.hidden) showSuggestMenu(activeSuggestInput);
}

function selectSuggestOption(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  hideSuggestMenu();
  input.focus();
}

function restorePendingSuggestInputs() {
  hideSuggestMenu();
}

function setupSeamlessDropdowns() {
  if (window.__lmsSeamlessDropdownsBound) return;
  window.__lmsSeamlessDropdownsBound = true;
  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.(".suggest-menu")) return;
    if (isSuggestPicker(event.target)) {
      event.target.dataset.suggestShowAll = "1";
      setTimeout(() => showSuggestMenu(event.target), 0);
    }
    else hideSuggestMenu();
  }, true);
  document.addEventListener("focusin", (event) => {
    if (isSuggestPicker(event.target)) {
      event.target.dataset.suggestShowAll = "1";
      showSuggestMenu(event.target);
    }
  });
  document.addEventListener("input", (event) => {
    if (isSuggestPicker(event.target)) showSuggestMenu(event.target);
  });
  document.addEventListener("keydown", (event) => {
    if (!isSuggestPicker(event.target)) return;
    if (event.key === "Escape") {
      hideSuggestMenu();
      event.target.blur();
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      ensureSuggestMenu().querySelector(".suggest-option")?.focus();
    }
  });
  document.addEventListener("focusout", (event) => {
    if (isSuggestPicker(event.target)) setTimeout(() => {
      if (!activeSuggestMenu?.contains(document.activeElement)) hideSuggestMenu();
    }, 120);
  });
  window.addEventListener("scroll", refreshSuggestMenu, true);
  window.addEventListener("resize", refreshSuggestMenu);
}

function setupUiRecommendations() {
  if (window.__lmsUiRecommendationsBound) return;
  window.__lmsUiRecommendationsBound = true;
  document.addEventListener("toggle", (event) => {
    const menu = event.target;
    if (!menu?.matches?.(".action-menu[open]")) return;
    document.querySelectorAll(".action-menu[open]").forEach((other) => {
      if (other !== menu) other.removeAttribute("open");
    });
  }, true);
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest?.(".action-menu")) {
      document.querySelectorAll(".action-menu[open]").forEach((menu) => menu.removeAttribute("open"));
    }
  });
  document.addEventListener("click", (event) => {
    const clearBtn = event.target.closest?.("[data-clear-table-filters]");
    const filterBtn = event.target.closest?.("[data-toggle-table-filters]");
    const densityBtn = event.target.closest?.("[data-toggle-table-density]");
    const chipBtn = event.target.closest?.("[data-clear-filter-chip]");
    const saveViewBtn = event.target.closest?.("[data-save-table-view]");
    const viewBtn = event.target.closest?.("[data-apply-table-view]");
    const deleteViewBtn = event.target.closest?.("[data-delete-table-view]");
    const notificationBtn = event.target.closest?.("[data-open-notifications]");
    const notificationJump = event.target.closest?.("[data-notification-jump]");
    const rowHistoryBtn = event.target.closest?.("[data-row-history]");
    if (clearBtn) clearTableFilters(clearBtn.closest(".table-tools")?.nextElementSibling);
    if (filterBtn) toggleTableFilters(filterBtn);
    if (densityBtn) toggleTableDensity(densityBtn);
    if (chipBtn) clearOneTableFilter(chipBtn);
    if (saveViewBtn) saveCurrentTableView(saveViewBtn);
    if (viewBtn) applySavedTableView(viewBtn);
    if (deleteViewBtn) deleteSavedTableView(deleteViewBtn);
    if (notificationBtn) openNotificationCenter();
    if (notificationJump) {
      closeModal();
      loadView(notificationJump.dataset.notificationJump);
    }
    if (rowHistoryBtn) openRowHistorySnapshot(rowHistoryBtn);
  });
  new MutationObserver(() => {
    enhanceColumnFilters();
    enhanceTables();
    enhanceNotificationButton();
    enhanceRowHistoryButtons();
    enhanceRowActionMenus();
    enhanceWorkflowBars();
  }).observe($("content"), { childList: true, subtree: true });
  enhanceTables();
  enhanceNotificationButton();
  enhanceRowHistoryButtons();
  enhanceRowActionMenus();
  enhanceWorkflowBars();
}

function enhanceTables() {
  document.querySelectorAll(".table-wrap").forEach((wrap, index) => {
    if (wrap.dataset.uiEnhanced === "1" || wrap.closest(".suggest-menu")) return;
    const table = wrap.querySelector("table");
    if (!table || !table.querySelector(".column-filter")) return;
    wrap.dataset.uiEnhanced = "1";
    const tools = document.createElement("div");
    tools.className = "table-tools";
    tools.innerHTML = `
      <div class="table-tools-label">View controls</div>
      <div class="table-tools-status" data-table-status>Showing table rows</div>
      <div class="table-filter-chips" data-table-filter-chips></div>
      <div class="table-tools-actions">
        <details class="table-view-menu">
          <summary>Saved views</summary>
          <div class="table-view-panel">
            <div class="saved-view-list" data-saved-view-list></div>
            <button type="button" class="rowbtn" data-save-table-view>Save current view</button>
          </div>
        </details>
        <button type="button" class="rowbtn" data-toggle-table-filters="${index}">Hide filters</button>
        <button type="button" class="rowbtn" data-clear-table-filters>Clear filters</button>
        <button type="button" class="rowbtn" data-toggle-table-density>Compact rows</button>
      </div>`;
    wrap.parentNode?.insertBefore(tools, wrap);
    refreshSavedViewList(wrap);
    updateTableState(wrap);
  });
}

function tableViewKey(wrap) {
  const table = wrap?.querySelector?.("table");
  const heads = [...(table?.querySelectorAll?.("thead tr:first-child th") || [])].map((th) => th.textContent.trim()).join("|");
  const title = wrap?.closest?.(".panel")?.querySelector?.(".panel-title strong")?.textContent?.trim()
    || $("title")?.textContent?.trim()
    || currentView
    || "table";
  return `lms-saved-table-views:${currentView || "home"}:${title}:${heads}`;
}

function readTableViews(wrap) {
  try {
    return JSON.parse(localStorage.getItem(tableViewKey(wrap)) || "[]").filter((view) => view?.name);
  } catch {
    return [];
  }
}

function writeTableViews(wrap, views) {
  localStorage.setItem(tableViewKey(wrap), JSON.stringify(views.slice(0, 12)));
  refreshSavedViewList(wrap);
}

function collectCurrentTableView(wrap) {
  return {
    filters: [...wrap.querySelectorAll(".column-filter")].map((input) => ({ col: input.dataset.col || "", value: input.value || "" })),
    sorts: [...wrap.querySelectorAll(".column-sort")].map((select) => ({ col: select.dataset.col || "", value: select.value || "" })),
    filtersHidden: wrap.classList.contains("filters-hidden"),
    compact: document.body.classList.contains("compact-tables"),
  };
}

function saveCurrentTableView(button) {
  const wrap = button.closest(".table-tools")?.nextElementSibling;
  if (!wrap) return;
  const name = prompt("Name this saved view", "My view");
  if (!name?.trim()) return;
  const views = readTableViews(wrap).filter((view) => view.name.toLowerCase() !== name.trim().toLowerCase());
  views.unshift({ name: name.trim(), ...collectCurrentTableView(wrap) });
  writeTableViews(wrap, views);
}

function applySavedTableView(button) {
  const wrap = button.closest(".table-tools")?.nextElementSibling;
  if (!wrap) return;
  const view = readTableViews(wrap).find((item) => item.name === button.dataset.applyTableView);
  if (!view) return;
  wrap.querySelectorAll(".column-filter").forEach((input) => {
    input.value = view.filters?.find((item) => item.col === (input.dataset.col || ""))?.value || "";
  });
  wrap.querySelectorAll(".column-sort").forEach((select) => {
    select.value = view.sorts?.find((item) => item.col === (select.dataset.col || ""))?.value || "";
  });
  wrap.classList.toggle("filters-hidden", !!view.filtersHidden);
  tableFilterRows(wrap).forEach((row) => { row.hidden = !!view.filtersHidden; });
  const filterBtn = wrap.previousElementSibling?.querySelector?.("[data-toggle-table-filters]");
  if (filterBtn) filterBtn.textContent = view.filtersHidden ? "Show filters" : "Hide filters";
  document.body.classList.toggle("compact-tables", !!view.compact);
  applyColumnFilters({ target: wrap.querySelector("table") });
  updateTableState(wrap);
}

function deleteSavedTableView(button) {
  const wrap = button.closest(".table-tools")?.nextElementSibling;
  if (!wrap) return;
  writeTableViews(wrap, readTableViews(wrap).filter((item) => item.name !== button.dataset.deleteTableView));
}

function refreshSavedViewList(wrap) {
  const tools = wrap?.previousElementSibling?.classList?.contains("table-tools") ? wrap.previousElementSibling : null;
  const list = tools?.querySelector?.("[data-saved-view-list]");
  if (!list) return;
  const views = readTableViews(wrap);
  list.innerHTML = views.length
    ? views.map((view) => `<div class="saved-view-row"><button type="button" class="rowbtn" data-apply-table-view="${esc(view.name)}">${esc(view.name)}</button><button type="button" class="rowbtn danger" title="Delete saved view" data-delete-table-view="${esc(view.name)}">x</button></div>`).join("")
    : `<div class="saved-view-empty">No saved views yet.</div>`;
}

function enhanceRowActionMenus() {
  document.querySelectorAll(".rowactions").forEach((actions) => {
    if (actions.dataset.actionMenuEnhanced === "1" || actions.closest(".row-action-menu")) return;
    const buttons = [...actions.children].filter((node) => node.tagName || node.textContent.trim());
    if (buttons.length <= 2) return;
    actions.dataset.actionMenuEnhanced = "1";
    const menu = document.createElement("details");
    menu.className = "row-action-menu";
    menu.innerHTML = `<summary>Actions</summary><div class="row-action-menu-panel"></div>`;
    const panel = menu.querySelector(".row-action-menu-panel");
    buttons.forEach((button) => panel.appendChild(button));
    actions.appendChild(menu);
  });
}

function enhanceNotificationButton() {
  const btnline = document.querySelector(".top .btnline");
  if (!btnline || btnline.querySelector("[data-open-notifications]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.openNotifications = "1";
  button.className = "notification-button";
  button.innerHTML = `Alerts <span class="notification-badge" data-notification-count>0</span>`;
  btnline.insertBefore(button, btnline.firstElementChild);
  updateNotificationBadge();
}

function updateNotificationBadge(count = null) {
  const badge = document.querySelector("[data-notification-count]");
  if (!badge) return;
  const value = count ?? (window.__lmsNotificationCount || 0);
  badge.textContent = String(value);
  badge.classList.toggle("has-alerts", Number(value) > 0);
}

function enhanceRowHistoryButtons() {
  document.querySelectorAll(".rowactions").forEach((actions) => {
    if (actions.dataset.historyEnhanced === "1") return;
    actions.dataset.historyEnhanced = "1";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rowbtn";
    button.dataset.rowHistory = "1";
    button.textContent = "History";
    actions.insertBefore(button, actions.firstChild);
  });
}

async function openNotificationCenter() {
  const modal = $("modal");
  if (!modal) return;
  $("modalTitle").textContent = "Notification Center";
  $("modalBody").innerHTML = `<div class="notification-loading">Checking system alerts...</div>`;
  $("modalSave").style.display = "none";
  $("modalCancel").textContent = "Close";
  $("modalCancel").onclick = closeModal;
  document.querySelector(".modalbox")?.classList.add("wide-modal");
  modal.style.display = "flex";
  const [products, purchaseOrders, workOrders, invoices, assets, equipmentRequests, payables] = await Promise.all([
    getAll("products"),
    getAll("purchase_orders"),
    getAll("work_orders"),
    getAll("invoices"),
    getAll("assets"),
    getAll("equipment_requests"),
    getAll("accounts_payable"),
  ]);
  const items = buildNotificationItems({ products, purchaseOrders, workOrders, invoices, assets, equipmentRequests, payables });
  window.__lmsNotificationCount = items.length;
  updateNotificationBadge(items.length);
  $("modalBody").innerHTML = items.length ? `
    <div class="notification-summary">${items.length} item${items.length === 1 ? "" : "s"} need attention.</div>
    <div class="notification-list">
      ${items.map((item) => `
        <div class="notification-card ${esc(item.level)}">
          <div>
            <strong>${esc(item.title)}</strong>
            <span>${esc(item.message)}</span>
            <small>${esc(item.meta || "")}</small>
          </div>
          <button type="button" class="rowbtn" data-notification-jump="${esc(item.view)}">Open</button>
        </div>`).join("")}
    </div>` : `<div class="notification-empty"><strong>No urgent alerts right now.</strong><span>The current live checks did not find low stock, open exceptions, or pending approvals.</span></div>`;
}

function buildNotificationItems(data) {
  const items = [];
  (data.products || []).forEach((row) => {
    const qty = Number(row.qty || 0);
    const reorder = Number(row.reorder_point || 0);
    if (qty < 0) items.push({ level: "critical", view: "products", title: "Negative inventory", message: `${row.sku || ""} ${row.name || ""}`.trim(), meta: `Qty ${qty}` });
    else if (reorder > 0 && qty <= reorder) items.push({ level: "warning", view: "products", title: "Low stock", message: `${row.sku || ""} ${row.name || ""}`.trim(), meta: `Qty ${qty}, reorder ${reorder}` });
  });
  (data.purchaseOrders || []).forEach((row) => {
    const status = String(row.status || "").toLowerCase();
    const match = String(row.match_status || "").toLowerCase();
    const payment = String(row.payment_status || "").toLowerCase();
    if (match.includes("mismatch")) items.push({ level: "critical", view: "purchasing", title: "PO mismatch", message: row.po_no || "Purchase order", meta: `${row.vendor || ""} ${row.vendor_invoice_no || ""}`.trim() });
    else if (!["closed", "paid", "cancelled", "voided"].some((word) => status.includes(word)) || payment.includes("not ready")) items.push({ level: "info", view: "purchasing", title: "Open purchasing item", message: row.po_no || "Purchase order", meta: `${row.vendor || ""} ${row.status || ""}`.trim() });
  });
  (data.workOrders || []).forEach((row) => {
    const status = String(row.status || "").toLowerCase();
    if (["closed", "invoiced", "voided", "cancelled"].some((word) => status.includes(word))) return;
    items.push({ level: status.includes("ready") ? "warning" : "info", view: "repairs", title: status.includes("ready") ? "WO ready to close" : "Open work order", message: row.wo_no || "Work order", meta: `${row.asset_tag || ""} ${row.priority || ""}`.trim() });
  });
  (data.invoices || []).forEach((row) => {
    const status = String(row.status || "").toLowerCase();
    if (!status.includes("paid") && !status.includes("void")) items.push({ level: "info", view: "invoices", title: "Open customer invoice", message: row.invoice_no || "Invoice", meta: `${row.customer || ""} ${row.due_date || ""}`.trim() });
  });
  (data.assets || []).forEach((row) => {
    if (truthy(row.needs_qr_printed) || String(row.status || "").toLowerCase().includes("repair")) {
      items.push({ level: "warning", view: "assets", title: truthy(row.needs_qr_printed) ? "Asset needs QR print" : "Asset needs repair", message: row.asset_tag || "Asset", meta: `${row.name || ""} ${row.location || ""}`.trim() });
    }
  });
  (data.equipmentRequests || []).forEach((row) => {
    const status = String(row.status || "").toLowerCase();
    if (!["approved", "denied", "closed", "cancelled"].some((word) => status.includes(word))) items.push({ level: "warning", view: "equipmentrequests", title: "Equipment request pending", message: row.request_no || row.asset_tag || "Request", meta: `${row.requested_by || ""} ${row.from_date || ""}`.trim() });
  });
  (data.payables || []).forEach((row) => {
    const payment = String(row.payment_status || row.status || "").toLowerCase();
    if (payment.includes("ready")) items.push({ level: "warning", view: "accounting", title: "Payable ready for check run", message: row.reference || row.invoice_no || "Payable", meta: `${row.vendor || ""} ${money(row.amount || row.invoice_amount || 0)}`.trim() });
  });
  return items.slice(0, 80);
}

function truthy(value) {
  return value === true || value === "true" || value === "Yes" || value === "yes" || value === 1 || value === "1";
}

function activeAuditUser() {
  return profile?.full_name || profile?.username || profile?.email || session?.user?.email || "System";
}

function auditRecordKey(tableName, row) {
  if (!tableName || !row) return "";
  const cfg = Object.values(tableMap).find((item) => item.table === tableName);
  const key = cfg?.key || "id";
  return String(row[key] ?? row.id ?? row.reference ?? row.sku ?? row.asset_tag ?? row.invoice_no ?? row.po_no ?? row.wo_no ?? "");
}

async function writeAuditLog({ tableName, action, beforeData = null, afterData = null, reason = "" }) {
  try {
    if (!tableName || !supabase) return;
    const recordKey = auditRecordKey(tableName, afterData || beforeData);
    await supabase.from("audit_log").insert({
      table_name: tableName,
      record_key: recordKey,
      action,
      module: currentCfg?.title || currentView,
      user_name: activeAuditUser(),
      user_email: profile?.email || session?.user?.email || "",
      reason,
      before_data: beforeData,
      after_data: afterData,
    });
  } catch (error) {
    console.warn("Audit log skipped", error?.message || error);
  }
}

async function fetchAuditRows(tableName, recordKey) {
  try {
    if (!tableName || !recordKey || !supabase) return { rows: [], available: false };
    const { data, error } = await supabase.from("audit_log")
      .select("*")
      .eq("table_name", tableName)
      .eq("record_key", String(recordKey))
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return { rows: [], available: false };
    return { rows: data || [], available: true };
  } catch (error) {
    return { rows: [], available: false };
  }
}

function auditChangeSummary(row) {
  const after = row.after_data || {};
  const before = row.before_data || {};
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null))
    .slice(0, 8);
  if (!fields.length) return row.reason || "Record touched.";
  return fields.map((key) => `${key}: ${before[key] ?? "blank"} -> ${after[key] ?? "blank"}`).join("; ");
}

async function openRowHistorySnapshot(button) {
  const row = button.closest("tr");
  const table = row?.closest("table");
  if (!row || !table) return;
  const headers = [...table.querySelectorAll("thead tr:first-child th")].map((th) => th.textContent.trim()).filter(Boolean);
  const cells = [...row.children];
  const values = headers.map((head, index) => ({ head, value: cells[index]?.innerText?.trim() || "" })).filter((item) => item.head && item.value && !/^actions?$/i.test(item.head));
  const keyIndex = currentCfg?.heads?.indexOf(currentCfg?.key);
  const reference = (keyIndex >= 0 ? cells[keyIndex]?.innerText?.trim() : "") || values.find((item) => item.value)?.value || currentView || "Record";
  const audit = await fetchAuditRows(currentCfg?.table, reference);
  $("modalTitle").textContent = `Record History: ${reference}`;
  $("modalBody").innerHTML = `
    <div class="audit-note">
      <strong>Visible record snapshot</strong>
      <span>This shows the current record details from the screen.${audit.available ? " Permanent audit history is shown below when entries exist." : " Run the audit SQL once to start permanent database history."}</span>
    </div>
    ${audit.rows.length ? `
      <div class="audit-timeline">
        ${audit.rows.map((entry) => `
          <div class="audit-event">
            <div>
              <strong>${esc(entry.action || "Updated")}</strong>
              <span>${esc(entry.user_name || "System")} ${entry.created_at ? `- ${esc(formatDateTime(entry.created_at))}` : ""}</span>
            </div>
            <p>${esc(auditChangeSummary(entry))}</p>
          </div>`).join("")}
      </div>` : ""}
    <div class="history-grid">
      ${values.map((item) => `<div class="history-field"><span>${esc(item.head)}</span><strong>${esc(item.value)}</strong></div>`).join("")}
    </div>`;
  $("modalSave").style.display = "none";
  $("modalCancel").textContent = "Close";
  $("modalCancel").onclick = closeModal;
  document.querySelector(".modalbox")?.classList.add("wide-modal");
  $("modal").style.display = "flex";
}

function workflowStepsForTitle(title) {
  const value = (title || "").toLowerCase();
  if (value.includes("purchase")) return ["Draft", "Issued", "Received", "Posted", "Paid"];
  if (value.includes("goods receipt")) return ["PO", "Received", "AP Ready", "Posted"];
  if (value.includes("sales order")) return ["Open", "Reserved", "Fulfilled", "Invoiced", "Paid"];
  if (value.includes("repair") || value.includes("work order")) return ["Open", "Ready to Close", "Closed", "Invoiced"];
  if (value.includes("accounts payable") || value.includes("check run")) return ["Received", "Posted", "For Check Run", "Paid"];
  if (value.includes("accounts receivable") || value.includes("invoice")) return ["Invoiced", "Open", "Part Paid", "Paid"];
  return [];
}

function enhanceWorkflowBars() {
  document.querySelectorAll(".panel").forEach((panel) => {
    if (panel.dataset.workflowEnhanced === "1" || panel.querySelector(".workflow-bar")) return;
    const title = panel.querySelector(".panel-title strong")?.textContent?.trim() || "";
    const steps = workflowStepsForTitle(title);
    if (!steps.length) return;
    panel.dataset.workflowEnhanced = "1";
    const bar = document.createElement("div");
    bar.className = "workflow-bar";
    bar.innerHTML = `<div class="workflow-label">Workflow</div>${steps.map((step, index) => `<div class="workflow-step${index === 0 ? " active" : ""}"><span>${index + 1}</span>${esc(step)}</div>`).join("")}`;
    const head = panel.querySelector(".panel-head");
    if (head) head.insertAdjacentElement("afterend", bar);
  });
}

function tableFilterRows(wrap) {
  return [...(wrap?.querySelectorAll?.("thead tr") || [])].filter((row) => row.querySelector(".column-filter, .column-sort"));
}

function toggleTableFilters(button) {
  const wrap = button.closest(".table-tools")?.nextElementSibling;
  if (!wrap) return;
  const nextHidden = !wrap.classList.contains("filters-hidden");
  wrap.classList.toggle("filters-hidden", nextHidden);
  tableFilterRows(wrap).forEach((row) => { row.hidden = nextHidden; });
  button.textContent = nextHidden ? "Show filters" : "Hide filters";
}

function clearTableFilters(wrap) {
  if (!wrap) return;
  wrap.querySelectorAll(".column-filter").forEach((input) => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  wrap.querySelectorAll(".column-sort").forEach((select) => {
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  applyColumnFilters({ target: wrap.querySelector("table") });
  updateTableState(wrap);
}

function toggleTableDensity(button) {
  const compact = !document.body.classList.contains("compact-tables");
  document.body.classList.toggle("compact-tables", compact);
  button.textContent = compact ? "Comfort rows" : "Compact rows";
}

function clearOneTableFilter(button) {
  const tools = button.closest(".table-tools");
  const wrap = tools?.nextElementSibling;
  const col = button.dataset.clearFilterChip;
  const input = wrap?.querySelector(`.column-filter[data-col="${CSS.escape(col || "")}"]`);
  if (!input) return;
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  applyColumnFilters({ target: input });
  updateTableState(wrap);
}

function updateTableState(wrap) {
  const table = wrap?.querySelector?.("table");
  const tools = wrap?.previousElementSibling?.classList?.contains("table-tools") ? wrap.previousElementSibling : null;
  if (!table || !tools) return;
  const rows = [...table.querySelectorAll("tbody tr")].filter((row) => !row.querySelector(".empty"));
  const visibleRows = rows.filter((row) => row.style.display !== "none");
  const status = tools.querySelector("[data-table-status]");
  if (status) status.textContent = `${visibleRows.length} of ${rows.length} rows shown`;
  const chips = tools.querySelector("[data-table-filter-chips]");
  if (!chips) return;
  const headers = [...table.querySelectorAll("thead tr:first-child th")].map((th) => th.textContent.trim());
  const active = [...table.querySelectorAll(".column-filter")]
    .filter((input) => input.value.trim())
    .map((input) => ({ col: input.dataset.col || "", label: headers[Number(input.dataset.col || 0)] || "Column", value: input.value.trim() }));
  chips.innerHTML = active.length
    ? active.map((item) => `<button type="button" class="filter-chip" data-clear-filter-chip="${esc(item.col)}" title="Clear this filter">${esc(item.label)}: ${esc(item.value)} <span>x</span></button>`).join("")
    : `<span class="filter-chip-empty">No active filters</span>`;
}

const trainingTours = {
  quick: [
    { view: "dashboard", title: "Quick overview", body: "This is the live dashboard. It gives management a fast view of inventory value, open sales, AP, fleet status, rentals, bank position, and action items.", target: "#content" },
    { view: "products", title: "Products", body: "Products is the SKU master. This is where you maintain photos, units, warehouses, bins, pricing or markup, alternate SKUs, and reorder points. Stock changes still come from documents, not manual edits.", target: "#addProductBtn" },
    { view: "purchasing", title: "Purchasing", body: "Purchasing starts the procure-to-pay flow: PO to vendor, goods receipt when items arrive, AP matching, then payment through check run.", target: "#newPoBtn" },
    { view: "orders", title: "Sales and billing", body: "Sales orders can reserve available inventory, keep out-of-stock parts in Parts to Order, and generate invoices when ready.", target: "#newSalesBtn" },
    { view: "assets", title: "Fleet and equipment", body: "Fleet tracks the asset master, photos, new QR codes, old QR codes, locations, parent-child equipment relationships, and repair status.", target: "#assetTableHost" },
    { view: "repairs", title: "Repairs", body: "Repairs controls work orders, issue details, mechanic time, requested parts, accepted parts, ready-to-close status, and invoicing.", target: "#newWoBtn" },
    { view: "accounting", title: "Accounting", body: "Accounting ties the operating modules to GL, AP, AR, reports, bank reconciliation, check runs, aging, and financial statements.", target: "#content" },
  ],
  full: [
    { view: "dashboard", title: "Dashboard", body: "Start here each day. The dashboard summarizes alerts and gives quick access to inventory, purchasing, sales, fleet, repairs, accounting, rentals, vendors, customers, mechanics, history, and reports.", target: ".quick-grid" },
    { view: "products", title: "Product master", body: "Use Add product for new SKUs. Required master data stays here; quantity is controlled by PO, goods receipt, sales issue, work order issue, or approved correction.", target: "#addProductBtn" },
    { view: "products", title: "Product columns and reporting", body: "Use Columns to show or hide fields before printing or exporting. Filters and sorting let you print only the information you need.", target: "#productColumnsBtn" },
    { view: "movements", title: "Stock movement", body: "This is the read-only stock ledger. Receipts, sales, work orders, reserves, releases, and corrections post here automatically with vendor, customer, date, FIFO cost, and document reference.", target: "#movementTableHost" },
    { view: "inventory", title: "Inventory as of date", body: "Use Inventory Balance to see current stock or an as-of balance for a selected period. This is useful for month-end inventory support.", target: "#inventoryApplyAsOf" },
    { view: "purchasing", title: "New purchase order", body: "Create a PO with vendor, jobsite or project, payment terms, incoterm, currency, freight, and product lines. The PO PDF can be sent to vendors.", target: "#newPoBtn" },
    { view: "receipts", title: "Goods receipt", body: "When items arrive, receive against the PO. Quantity received cannot exceed ordered quantity. Each receipt line can carry vendor invoice details and can be reversed if posted incorrectly.", target: "#receiptTableHost" },
    { view: "orders", title: "Sales orders", body: "Customer orders require a customer PO unless a manager override is entered. Out-of-stock items are allowed as reserved demand but stay blocked from issue and invoice until received.", target: "#newSalesBtn" },
    { view: "salestopurchase", title: "Parts to Order", body: "This module shows customer demand that still needs stock. Purchasing can use it to create the PO needed to fulfill the sales order.", target: "#partsToOrderHost" },
    { view: "rentals", title: "Rentals", body: "Rentals track the asset or item rented, customer PO, dates, deposits, rental rate, invoice timing, and return status.", target: "#newRentalBtn" },
    { view: "invoices", title: "Invoices", body: "Invoices come from parts sales, rentals, equipment sales, and work orders. Paid invoices are locked and should be reversed instead of deleted.", target: "#invoiceTableHost" },
    { view: "payments", title: "Customer payments", body: "Use Customer Payments to collect AR. Payments post to cash or bank accounts and clear customer invoice balances.", target: "#paymentTableHost" },
    { view: "assets", title: "Fleet asset master", body: "Fleet stores photos, new and old QR codes, asset number, description, type, make, model, location, readings, operator, QR print flag, and repair status.", target: "#newAssetBtn" },
    { view: "equipmentrepairqueue", title: "Equipment subject to repair", body: "When an asset QR scan requests repair, the asset appears here. Assigning a work order changes the asset repair status to the work order reference.", target: "#repairAssetHost" },
    { view: "equipmenthistory", title: "Equipment history", body: "Equipment History summarizes parts used, labor, work order issues, recurring problems, and repair cost by asset.", target: "#content" },
    { view: "repairs", title: "Repairs and work orders", body: "Repairs are separated into Open, Ready to Close, Closed Not Invoiced, Invoiced, and Voided work orders. Invoiced work orders are locked unless reversed; voided work orders stay for history.", target: "#repairTableHost" },
    { view: "repairs", title: "Mechanic mobile view", body: "Mechanic users see a simplified mobile workflow: assigned WOs only, active clock-in status, parts request, parts acceptance, helper request, and Ready to Close.", target: "#content" },
    { view: "supplies", title: "Supplies issuance", body: "Use Supplies Issuance when parts or shop supplies are issued to an employee, mechanic, or directly to a work order.", target: "#supplyTableHost" },
    { view: "accounting", title: "Accounting control", body: "Accounting shows GL, AP, AR, statements, and posting detail. The system follows the flow: goods receipt debits inventory and credits parts accrual; AP posting clears accrual to payables.", target: "#content" },
    { view: "bank", title: "Bank reconciliation", body: "Bank reconciliation is per bank or credit card account. It starts with beginning balance, lists cleared and uncleared transactions, then calculates ending balance and adjustment items.", target: "#bankRecHost" },
    { view: "checkrun", title: "Check run", body: "Check Run pays approved AP. Choose the vendor, select invoices, and choose the cash account or credit card payable account used for payment.", target: "#content" },
    { view: "aging", title: "Aging summary", body: "Aging Summary can show AR or AP by customer or vendor, or detailed invoice-level aging as of a selected date.", target: "#agingApply" },
    { view: "users", title: "Users and access", body: "Create users and restrict module access. Mechanic users should only get repair access and will automatically be part of the mechanic workflow.", target: "#content" },
  ],
};

function startTraining(mode) {
  if (!session) {
    alert("Log in first, then click Quick overview or Full tutorial.");
    return;
  }
  trainingMode = mode;
  trainingIndex = 0;
  document.body.classList.add("training-active");
  showTrainingStep();
}

async function showTrainingStep() {
  const steps = trainingTours[trainingMode] || [];
  const step = steps[trainingIndex];
  if (!step) return endTraining();
  closeModal();
  clearTimeout(trainingAutoplay);
  await loadView(step.view);
  setTimeout(() => renderTrainingOverlay(step), 250);
}

function renderTrainingOverlay(step) {
  removeTrainingHighlight();
  const target = document.querySelector(step.target) || $("content");
  target?.classList.add("training-highlight");
  target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  let overlay = $("trainingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "trainingOverlay";
    overlay.className = "training-overlay";
    document.body.appendChild(overlay);
  }
  const total = (trainingTours[trainingMode] || []).length;
  overlay.innerHTML = `
    <div class="training-card">
      <div class="training-kicker">${trainingMode === "quick" ? "Quick overview" : "Full tutorial"} ${trainingIndex + 1} of ${total}</div>
      <h2>${esc(step.title)}</h2>
      <p>${esc(step.body)}</p>
      <div class="training-actions">
        <button id="trainingBackBtn" ${trainingIndex === 0 ? "disabled" : ""}>Back</button>
        <button id="trainingNextBtn" class="primary">${trainingIndex >= total - 1 ? "Finish" : "Next"}</button>
        <button id="trainingAutoBtn">Auto play</button>
        <button id="trainingEndBtn">End training</button>
      </div>
    </div>`;
  $("trainingBackBtn").onclick = () => moveTraining(-1);
  $("trainingNextBtn").onclick = () => moveTraining(1);
  $("trainingAutoBtn").onclick = autoPlayTraining;
  $("trainingEndBtn").onclick = endTraining;
}

function moveTraining(delta) {
  clearTimeout(trainingAutoplay);
  const total = (trainingTours[trainingMode] || []).length;
  trainingIndex += delta;
  if (trainingIndex < 0) trainingIndex = 0;
  if (trainingIndex >= total) return endTraining();
  showTrainingStep();
}

function autoPlayTraining() {
  clearTimeout(trainingAutoplay);
  trainingAutoplay = setTimeout(() => {
    const total = (trainingTours[trainingMode] || []).length;
    if (trainingIndex >= total - 1) return endTraining();
    trainingIndex += 1;
    showTrainingStep();
  }, 8500);
}

function removeTrainingHighlight() {
  document.querySelectorAll(".training-highlight").forEach((el) => el.classList.remove("training-highlight"));
}

function endTraining() {
  clearTimeout(trainingAutoplay);
  removeTrainingHighlight();
  $("trainingOverlay")?.remove();
  document.body.classList.remove("training-active");
  trainingMode = null;
  trainingIndex = 0;
}

function renderNav() {
  const visibleModules = isMechanicUser()
    ? [{ group: "Mechanic", items: [["repairs", "Work Orders"]] }]
    : isEquipmentRequestUser()
      ? [{ group: "Equipment Request", items: [["equipmentrequests", "Equipment Requests"]] }]
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
  const role = String(profile?.role || "");
  const mods = userModules().filter((m) => m && m !== "dashboard");
  return /mechanic/i.test(role) || (!userModules().includes("all") && mods.length === 1 && mods[0] === "repairs");
}

function userModules() {
  const mods = normalizeModules(profile?.modules);
  return mods.length ? mods : ["dashboard"];
}

function normalizeModules(value) {
  if (Array.isArray(value)) return value.map((m) => String(m || "").trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  const text = value.trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((m) => String(m || "").trim()).filter(Boolean);
    } catch {}
  }
  return text
    .replace(/[{}"]/g, "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function normalizeProfile(row, user) {
  const email = String(user?.email || row?.email || "").trim().toLowerCase();
  const modules = normalizeModules(row?.modules);
  const ownerAdmin = isBryanOwner({ ...row, email });
  return {
    ...row,
    email: row?.email || email,
    username: row?.username || email,
    full_name: row?.full_name || row?.username || email,
    role: ownerAdmin ? "Administrator" : (row?.role || "User"),
    modules: ownerAdmin ? ["all"] : (modules.length ? modules : ["dashboard"]),
  };
}

function isBryanOwner(row = profile) {
  const email = String(row?.email || session?.user?.email || "").trim().toLowerCase();
  const username = String(row?.username || row?.full_name || "").trim().toLowerCase();
  return email === "bryan.dy@lmsfm.com" || username === "bryan.dy";
}

function isAdminUser() {
  const role = String(profile?.role || "");
  return isBryanOwner() || /admin|administrator|owner/i.test(role) || userModules().includes("all");
}

function adminOnly(action) {
  if (!isAdminUser()) {
    alert("Only administrators can use this control.");
    return;
  }
  return action();
}

function isEquipmentRequestUser() {
  const mods = userModules();
  const visible = mods.filter((m) => m && m !== "dashboard");
  return !isMechanicUser() && !mods.includes("all") && visible.length === 1 && visible[0] === "equipmentrequests";
}

function defaultView() {
  if (isMechanicUser()) return "repairs";
  if (isEquipmentRequestUser()) return "equipmentrequests";
  return "dashboard";
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
  const email = String(user.email || "").trim().toLowerCase();
  let { data } = await supabase.from("app_profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data && email) {
    const byEmail = await supabase.from("app_profiles").select("*").ilike("email", email).maybeSingle();
    data = byEmail.data;
  }
  if (!data && email) {
    const byUsername = await supabase.from("app_profiles").select("*").ilike("username", email).maybeSingle();
    data = byUsername.data;
  }
  const fallbackRole = /bryan\.dy@lmsfm\.com/i.test(email) ? "Administrator" : "User";
  const fallbackModules = fallbackRole === "Administrator" ? ["all"] : ["dashboard"];
  profile = normalizeProfile(data || { username: email, full_name: email, email, role: fallbackRole, modules: fallbackModules }, user);
}

function updateAuthView() {
  if (document.body.classList.contains("public-scan")) return;
  document.body.classList.toggle("logged-out", !session);
  document.body.classList.toggle("mechanic-mode", Boolean(session && isMechanicUser()));
  document.body.classList.toggle("equipment-request-mode", Boolean(session && isEquipmentRequestUser()));
  $("loginPanel").style.display = session ? "none" : "block";
  $("content").style.display = session ? "block" : "none";
  $("sessionBox").innerHTML = session ? `Logged in as<br><strong>${esc(profile?.full_name || session.user.email)}</strong><br>${esc(profile?.role || "User")}` : "Not logged in";
  $("logoutBtn").style.display = session ? "inline-block" : "none";
  ["importBtn", "sampleBtn", "clearBtn", "exportBtn", "cloneExportBtn", "offlineCloneBtn"].forEach((id) => {
    if ($(id)) $(id).style.display = session && isAdminUser() ? "" : "none";
  });
}

function hasAssetHash() {
  return /^#asset=/.test(location.hash || "");
}

function canAccess(view) {
  if (isMechanicUser()) return view === "repairs";
  if (isEquipmentRequestUser()) return view === "equipmentrequests";
  const mods = userModules();
  return mods.includes("all") || mods.includes(view) || view === "dashboard";
}

async function loadView(view) {
  if (!session) return;
  if (isMechanicUser()) view = "repairs";
  if (isEquipmentRequestUser()) view = "equipmentrequests";
  if (!canAccess(view)) {
    $("content").innerHTML = `<div class="panel"><div class="empty">Your user does not have access to this module.</div></div>`;
    return;
  }
  currentView = view;
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("content").innerHTML = `<div class="empty">Loading...</div>`;
  try {
    if (view === "dashboard") return await renderDashboard();
    if (view === "products") return await renderProductsView();
    if (view === "movements") return await renderStockMovementView();
    if (view === "inventory") return await renderInventoryBalanceView();
    if (view === "purchasing") return await renderPurchasingView();
    if (view === "receipts") return await renderGoodsReceiptsView();
    if (view === "quotes") return await renderQuotationsView();
    if (view === "orders") return await renderSalesOrdersView();
    if (view === "salestopurchase") return await renderSalesPartsToOrderView();
    if (view === "rentals") return await renderRentalsView();
    if (view === "invoices") return await renderInvoicesView();
    if (view === "payments") return await renderCustomerPaymentsView();
    if (view === "accounting") return await renderAccountingView();
    if (view === "checkrun") return await renderCheckRunView();
    if (view === "bank") return await renderBankReconciliationView();
    if (view === "assets") return await renderAssetsView();
    if (view === "outsidefleet") return await renderOutsideCustomerFleetView();
    if (view === "equipmentrequests") return await renderEquipmentRequestsView();
    if (view === "equipmentrepairqueue") return await renderEquipmentRepairQueueView();
    if (view === "repairs") return await renderRepairsView();
    if (view === "supplies") return await renderSuppliesIssuanceView();
    if (view === "aging") return await renderAgingSummaryView();
    if (view === "settings") return await renderSettingsView();
    if (tableMap[view]?.derived) return await renderDerived(view);
    currentCfg = tableMap[view];
    $("viewTitle").textContent = currentCfg.title;
    $("viewSub").textContent = currentCfg.sub;
    const { data, error } = await supabase.from(currentCfg.table).select("*").order(currentCfg.heads[0], { ascending: false }).limit(500);
    if (error) throw error;
    currentRows = data || [];
    renderTableModule();
  } catch (error) {
    console.error(error);
    $("content").innerHTML = `<section class="panel"><div class="panel-head"><div class="panel-title"><strong>Could not load ${esc(tableMap[view]?.title || view)}</strong><span>The module stopped on a database or browser error.</span></div><div class="actions"><button id="retryLoadView">Retry</button></div></div><div class="empty">${esc(error.message || error)}</div></section>`;
    $("retryLoadView").onclick = () => loadView(view);
  }
}

async function renderDashboard() {
  $("viewTitle").textContent = "Dashboard";
  $("viewSub").textContent = "A clear view of stock, value, alerts, and movement.";
  $("content").innerHTML = `<section class="panel"><div class="empty">Loading live dashboard summary...</div></section>`;
  const [products, sales, po, assets, repairs, rentals, invoices, gl] = await Promise.all([
    getDashboardRows("products", "qty,cost,reorder_point,status"),
    getDashboardRows("sales_orders", "status"),
    getDashboardRows("purchase_orders", "payment_status,match_status"),
    getDashboardRows("assets", "id,status"),
    getDashboardRows("work_orders", "status"),
    getDashboardRows("rentals", "status"),
    getDashboardRows("invoices", "status"),
    getDashboardRows("general_ledger", "debit,credit")
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
    <section class="panel accounting-panel">
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
        ${quick("equipmentrequests", "Equipment Requests", "Request equipment, signatures, approvals")}
        ${quick("equipmenthistory", "Equipment History", "Parts used, problems, repair timeline")}
        ${quick("repairs", "Repairs", "Work orders, parts, labor clocking")}
        ${quick("supplies", "Supplies", "Issue supplies to people or WOs")}
        ${quick("accounting", "Accounting", "GL, AP, AR, statements, bank rec")}
        ${quick("rentals", "Rentals", "Checkout, returns, deposits, income")}
      </div>
    </section>`;
  document.querySelectorAll("[data-jump],[data-quick]").forEach((b) => b.onclick = () => loadView(b.dataset.jump || b.dataset.quick));
}

async function getDashboardRows(table, columns = "*", limit = 1000) {
  try {
    const { data, error } = await supabase.from(table).select(columns).limit(limit);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn(`Dashboard skipped ${table}`, error);
    return [];
  }
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
  const productByKey = new Map();
  products.forEach((p) => {
    if (p.id) productByKey.set(String(p.id), p);
    if (p.sku) productByKey.set(String(p.sku), p);
  });
  const balances = new Map();
  const moveTouches = new Set();

  const addBalance = (product, warehouse, bin, qty, movement) => {
    if (!product || !qty) return;
    const normalizedWarehouse = cleanLocation(warehouse || product.warehouse || "Unassigned");
    const normalizedBin = cleanLocation(bin || product.bin_shelf || "");
    const key = [product.sku, normalizedWarehouse, normalizedBin].join("||");
    const existing = balances.get(key) || {
      as_of: asOf || "Current",
      sku: product.sku,
      product: product.name,
      vendor: product.source_vendor,
      warehouse: normalizedWarehouse,
      bin_shelf: normalizedBin,
      qty: 0,
      unit_cost: Number(movement?.unit_fifo_cost ?? product.cost ?? 0),
      value: 0,
      last_movement: "",
      status: product.status,
    };
    existing.qty += Number(qty || 0);
    if (movement?.movement_date && String(movement.movement_date) >= String(existing.last_movement || "")) {
      existing.last_movement = movement.movement_date;
      existing.unit_cost = Number(movement.unit_fifo_cost ?? existing.unit_cost ?? product.cost ?? 0);
    }
    existing.value = existing.qty * Number(existing.unit_cost || 0);
    balances.set(key, existing);
  };

  movements.forEach((movement) => {
    if (asOf && String(movement.movement_date || "") > asOf) return;
    const product = productByKey.get(String(movement.product_id || "")) || productByKey.get(String(movement.sku || ""));
    if (!product) return;
    moveTouches.add(product.sku);
    const qty = Number(movement.qty || 0);
    const isTransfer = /transfer/i.test(movement.type || "") && movement.from_warehouse && movement.to_warehouse;
    if (isTransfer) {
      addBalance(product, movement.from_warehouse, movement.from_bin_shelf, -Math.abs(qty), movement);
      addBalance(product, movement.to_warehouse, movement.to_bin_shelf, Math.abs(qty), movement);
    } else if (qty < 0) {
      addBalance(product, movement.from_warehouse || product.warehouse, movement.from_bin_shelf || product.bin_shelf, qty, movement);
    } else {
      addBalance(product, movement.to_warehouse || product.warehouse, movement.to_bin_shelf || product.bin_shelf, qty, movement);
    }
  });

  products.forEach((product) => {
    if (moveTouches.has(product.sku)) return;
    addBalance(product, product.warehouse, product.bin_shelf, Number(product.qty || 0), { movement_date: asOf ? "" : "", unit_fifo_cost: product.cost });
  });

  return [...balances.values()]
    .filter((row) => !asOf || Number(row.qty || 0) !== 0 || row.last_movement)
    .sort((a, b) => String(a.sku).localeCompare(String(b.sku)) || String(a.warehouse).localeCompare(String(b.warehouse)) || String(a.bin_shelf).localeCompare(String(b.bin_shelf)));
}

function cleanLocation(value) {
  return String(value ?? "").trim();
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
  await loadAccountingCloseDate();
  const reportFrom = localStorage.getItem("lms.accountingReportFrom") || "";
  const reportTo = localStorage.getItem("lms.accountingReportTo") || today();
  let [gl, coa, invoices, invoiceLines, payments, pos, poLines, receipts, salesOrders, salesLines, bankRows, products, movements] = await Promise.all([
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
    getAll("stock_movements"),
  ]);
  if (!coa.length) {
    await seedDefaultChartOfAccounts();
    coa = await getAll("chart_of_accounts");
  }
  if (!coa.some((account) => /landed cost accrual/i.test(account.account || ""))) {
    await seedRequiredChartOfAccounts();
    coa = await getAll("chart_of_accounts");
  }
  const data = buildAccountingData({ gl, coa, invoices, invoiceLines, payments, pos, poLines, receipts, salesOrders, salesLines, bankRows, products, movements, reportFrom, reportTo, reportTab: accountingTab });
  const s = data.summary;
  const accountingSummaryCollapsed = localStorage.getItem(ACCOUNTING_SUMMARY_STORAGE_KEY) === "1";
  $("content").innerHTML = `
    <div class="accounting-summary-shell ${accountingSummaryCollapsed ? "collapsed" : ""}">
      <div class="summary-toggle-line">
        <button id="toggleAccountingSummaryBtn">${accountingSummaryCollapsed ? "Show accounting dashboard" : "Hide accounting dashboard"}</button>
      </div>
      <div class="stats accounting-summary-grid">
        ${stat("Sales Revenue", money(s.revenue), "Posted sales, rental, service, and equipment revenue")}
        ${stat("Inventory Value", money(s.inventory), "Current cost value on hand")}
        ${stat("Expenses", money(s.expenses), "Posted costs and expense accounts")}
        ${stat("Net Position", money(s.net), "Revenue minus expenses")}
      </div>
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
        <div class="accounting-actions-bar">
          <div class="accounting-date-controls">
            <label>From <input type="date" id="accountingReportFrom" value="${esc(reportFrom)}"></label>
            <label>To / As of <input type="date" id="accountingReportTo" value="${esc(reportTo)}"></label>
            <button id="accountingApplyDatesBtn">Apply dates</button>
          </div>
          <div class="actions accounting-action-groups">
          <button class="primary" id="newJournalBtn">Add journal entry</button>
            <details class="action-menu accounting-action-menu">
              <summary>Setup</summary>
              <div class="action-menu-panel">
                <button id="newAccountBtn">Add account</button>
                <button id="newBankItemBtn">Add bank item</button>
              </div>
            </details>
            <details class="action-menu accounting-action-menu">
              <summary>Uploads</summary>
              <div class="action-menu-panel accounting-upload-menu">
                <button id="trialBalanceTemplateBtn">TB template</button>
                <button id="trialBalanceUploadBtn">Upload TB</button>
                <button id="beginningInventoryTemplateBtn">Inventory detail template</button>
                <button id="beginningInventoryUploadBtn">Upload inventory detail</button>
                <button id="beginningApTemplateBtn">AP detail template</button>
                <button id="beginningApUploadBtn">Upload AP detail</button>
                <button class="danger" id="clearBeginningApBtn">Clear Beginning AP</button>
                <button id="beginningArTemplateBtn">AR detail template</button>
                <button id="beginningArUploadBtn">Upload AR detail</button>
                <button class="danger" id="clearBeginningArBtn">Clear Beginning AR</button>
              </div>
            </details>
            <details class="action-menu accounting-action-menu">
              <summary>Reports</summary>
              <div class="action-menu-panel">
                <button id="accountingCsvBtn">Excel</button>
                <button id="accountingPrintBtn">PDF / Print</button>
              </div>
            </details>
          </div>
        </div>
      </div>
      <div id="accountingTableHost">${accountingPanelHtml(data, accountingTab)}</div>
    </section>`;
  bindAccountingView(data);
}

function buildAccountingData(source) {
  const reportFrom = source.reportFrom || "";
  const reportTo = source.reportTo || "";
  const reportTab = source.reportTab || accountingTab;
  const isAsOfReport = ["bs", "tb", "coa"].includes(reportTab);
  const inReportPeriod = (row) => {
    const date = String(row.posting_date || row.entry_date || "").slice(0, 10);
    if (!date) return true;
    if (reportTo && date > reportTo) return false;
    if (!isAsOfReport && reportFrom && date < reportFrom) return false;
    return true;
  };
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
    .filter(inReportPeriod)
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
  if (tab === "ap") {
    const apRows = accountsPayableRowsForTab(accountsPayableRows(data), accountsPayableTab);
    return `<div class="actions"><button id="postApFromPoBtn">Post AP from PO</button><button data-jump="checkrun">Open check run</button></div>
      <div class="tabs">
        <button class="${accountsPayableTab === "forcheck" ? "active" : ""}" data-ap-tab="forcheck">For Check Run ${accountsPayableRowsForTab(accountsPayableRows(data), "forcheck").length}</button>
        <button class="${accountsPayableTab === "posted" ? "active" : ""}" data-ap-tab="posted">Posted AP ${accountsPayableRowsForTab(accountsPayableRows(data), "posted").length}</button>
        <button class="${accountsPayableTab === "review" ? "active" : ""}" data-ap-tab="review">Needs Review ${accountsPayableRowsForTab(accountsPayableRows(data), "review").length}</button>
        <button class="${accountsPayableTab === "all" ? "active" : ""}" data-ap-tab="all">All AP ${accountsPayableRowsForTab(accountsPayableRows(data), "all").length}</button>
      </div>
      ${accountingTable(apRows, ["Vendor", "PO", "PO Date", "Invoice #", "Invoice Date", "Due Date", "PO Total", "Received", "Invoice Amount", "Match", "Payment", "Status", ""], (r) => [r.vendor, r.po_no, r.po_date, r.invoice_no, r.invoice_date, r.due_date, money(r.po_total), money(r.received), money(r.invoice_amount), badge(r.match), badge(r.payment), badge(r.status), apRowActions(r)])}`;
  }
  if (tab === "ar") return `<div class="actions"><button data-jump="payments">Receive payment</button><button data-jump="invoices">Open invoices</button></div>${accountingTable(accountsReceivableRows(data), ["Customer", "Invoice #", "Invoice Date", "Due Date", "Type", "Source", "Invoice Total", "Paid", "Balance", "Status", ""], (r) => [r.customer, r.invoice_no, r.invoice_date, r.due_date, r.type, r.source_ref, money(r.total), money(r.paid), money(r.balance), badge(r.status), arRowActions(r)])}`;
  if (tab === "sales") return accountingTable(salesAccountingRows(data), ["Date", "Sales Order", "Customer", "Customer PO", "Payment Mode", "Status", "Lines", "Subtotal", "Invoice", "AR Balance"], (r) => [r.date, r.order_no, r.customer, r.customer_po, r.payment_mode || "PO", badge(r.status), r.lines, money(r.total), r.invoice_no || "", money(r.balance)]);
  if (tab === "purchases") return accountingTable(purchaseAccountingRows(data), ["Date", "PO", "Vendor", "Invoice", "PO Total", "Received", "AP", "Match", "Payment", "Status", ""], (r) => [r.date, r.po_no, r.vendor, r.invoice_no, money(r.po_total), money(r.received), money(r.ap), badge(r.match), badge(r.payment), badge(r.status), apRowActions(r)]);
  if (tab === "tb") return `${beginningSupportHtml(data)}${accountingTable(trialBalanceRows(data), ["Account", "Type", "Debit", "Credit", "Detail"], (r) => [r.account, r.type, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : "", beginningDetailButton(r.account)])}`;
  if (tab === "bs") return financialStatementHtml("Balance Sheet", balanceSheetRows(data), ["Section", "Account", "Amount"], (r) => [r.section, accountDrillButton(r.account), money(r.amount)], data, "asOf");
  if (tab === "is") return financialStatementHtml("Income Statement", incomeStatementRows(data), ["Section", "Account", "Amount"], (r) => [r.section, accountDrillButton(r.account), money(r.amount)], data, "period");
  if (tab === "cf") return financialStatementHtml("Cash Flow", cashFlowRows(data), ["Section", "Description", "Amount"], (r) => [r.section, r.description, money(r.amount)], data, "period");
  if (tab === "bank") return `${bankSummaryHtml(data)}${accountingTable(bankReconciliationRows(data), ["Date", "Source", "Description", "Reference", "Debit", "Credit", "Bank Amount", "Status"], (r) => [r.date, r.source, r.description, r.reference, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : "", r.bank_amount !== "" ? money(r.bank_amount) : "", badge(r.status)])}`;
  return accountingTable(data.gl, ["Posting Date", "Account", "Customer", "Vendor", "Invoice #", "Invoice Date", "Due Date", "Mechanic", "Asset", "Description", "Reference", "Debit", "Credit", "Source", "Status"], (r) => [r.posting_date, r.account, r.customer, r.vendor, r.invoice_no, r.invoice_date, r.due_date, r.mechanic, r.asset, r.description, r.reference, r.debit ? money(r.debit) : "", r.credit ? money(r.credit) : "", r.source, badge(r.status)]);
}

function accountingTable(rows, heads, mapper) {
  currentRows = rows;
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${mapper(row).map((value) => `<td>${value ?? ""}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No records yet.</td></tr>`}</tbody></table></div>`;
}

function beginningInventorySupportHtml(data) {
  const support = beginningInventorySupportSummary(data);
  const status = Math.abs(support.difference) <= 0.005 ? "OK" : "Needs review";
  return `<div class="notice">
    <strong>Beginning inventory detail:</strong>
    Product detail ${money(support.detailValue)} | Parts Inventory TB ${money(support.glBalance)} | Difference ${money(support.difference)} (${esc(status)}).
    Use Inventory detail template and Upload inventory detail above to build the SKU/location detail behind the beginning balance.
  </div>`;
}

function beginningSupportHtml(data) {
  return `<div class="support-grid">
    ${beginningInventorySupportHtml(data)}
    ${beginningSubledgerSupportHtml("Accounts Payable", beginningApSupportSummary(data), "AP detail", "data-beginning-ap-upload")}
    ${beginningSubledgerSupportHtml("Accounts Receivable", beginningArSupportSummary(data), "AR detail", "data-beginning-ar-upload")}
  </div>`;
}

function beginningSubledgerSupportHtml(label, support, buttonLabel, attr) {
  const status = Math.abs(support.difference) <= 0.005 ? "OK" : "Needs review";
  return `<div class="notice">
    <strong>${esc(label)} detail:</strong>
    Detail ${money(support.detailValue)} | TB ${money(support.glBalance)} | Difference ${money(support.difference)} (${esc(status)}).
    <button class="rowbtn" type="button" ${attr}="1">${esc(buttonLabel)}</button>
  </div>`;
}

function beginningDetailButton(account) {
  if (/parts inventory/i.test(account || "")) return `<button class="rowbtn" type="button" data-beginning-inventory-upload="1">Inventory detail</button>`;
  if (/accounts payable/i.test(account || "")) return `<button class="rowbtn" type="button" data-beginning-ap-upload="1">AP detail</button>`;
  if (/accounts receivable/i.test(account || "")) return `<button class="rowbtn" type="button" data-beginning-ar-upload="1">AR detail</button>`;
  return "";
}

function beginningInventorySupportSummary(data) {
  const detailValue = (data.movements || [])
    .filter((row) => /beginning inventory detail|opening balance/i.test(`${row.type || ""} ${row.document_no || ""} ${row.reason || ""}`))
    .reduce((sum, row) => sum + Number(row.total_fifo_cost || 0), 0);
  const glBalance = (data.gl || [])
    .filter((row) => /parts inventory/i.test(row.account || "") && /trial balance upload/i.test(row.source || ""))
    .reduce((sum, row) => sum + Number(row.debit || 0) - Number(row.credit || 0), 0);
  return { detailValue, glBalance, difference: detailValue - glBalance };
}

function beginningApSupportSummary(data) {
  const detailValue = (data.pos || [])
    .filter((po) => /beginning ap/i.test(`${po.status || ""} ${po.notes || ""}`))
    .reduce((sum, po) => sum + Number(po.vendor_invoice_amount || 0), 0);
  const glBalance = (data.gl || [])
    .filter((row) => /accounts payable/i.test(row.account || "") && /trial balance upload/i.test(row.source || ""))
    .reduce((sum, row) => sum + Number(row.credit || 0) - Number(row.debit || 0), 0);
  return { detailValue, glBalance, difference: detailValue - glBalance };
}

function beginningArSupportSummary(data) {
  const detailValue = (data.invoices || [])
    .filter((inv) => /beginning ar/i.test(`${inv.type || ""} ${inv.notes || ""}`))
    .reduce((sum, inv) => sum + invoiceBalance(inv), 0);
  const glBalance = (data.gl || [])
    .filter((row) => /accounts receivable/i.test(row.account || "") && /trial balance upload/i.test(row.source || ""))
    .reduce((sum, row) => sum + Number(row.debit || 0) - Number(row.credit || 0), 0);
  return { detailValue, glBalance, difference: detailValue - glBalance };
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
  if (/payable|credit card|liabil|accrual|parts in transit/i.test(account || "")) return "Liability";
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
    const isBeginningAp = /beginning ap/i.test(`${po.status || ""} ${po.notes || ""}`);
    const isLandedAp = isLandedCostPayable(po);
    const apPosted = isBeginningAp || data.gl.some((row) => row.reference === po.po_no && ["Purchase Order", "Landed Cost Invoice"].includes(row.source));
    return { id: po.id, vendor: po.vendor, po_no: po.po_no, po_date: po.po_date, invoice_no: ap.invoice_no, invoice_date: ap.invoice_date, due_date: ap.due_date, po_total: poTotalAmount, received, invoice_amount: ap.invoice_amount, match: ap.match, payment: ap.payment, status: isBeginningAp ? "Beginning AP" : isLandedAp ? "Landed Cost AP" : apPosted ? "AP Posted" : ap.status, ap_posted: apPosted, beginning_ap: isBeginningAp, landed_cost_ap: isLandedAp };
  }).filter((row) => !/cancel/i.test(row.status) && Number(row.received || row.invoice_amount || 0) > 0).sort((a, b) => String(b.po_date || "").localeCompare(String(a.po_date || "")));
}

function accountsPayableRowsForTab(rows, tab = "forcheck") {
  if (tab === "all") return rows;
  if (tab === "posted") return rows.filter((row) => row.ap_posted && !/paid/i.test(`${row.payment || ""} ${row.status || ""}`));
  if (tab === "review") return rows.filter((row) => !row.ap_posted || /mismatch|pending|awaiting|not ready|hold/i.test(`${row.match || ""} ${row.payment || ""} ${row.status || ""}`));
  return rows.filter((row) => row.ap_posted && /matched/i.test(row.match || "") && /ready/i.test(row.payment || "") && !/paid/i.test(`${row.payment || ""} ${row.status || ""}`));
}

function poApSummary(po) {
  const received = poReceivedTotal(po);
  const active = activeReceipts(po);
  const receiptInvoiceNo = [...new Set(active.map((gr) => gr.vendor_invoice_no).filter(Boolean))].join(", ");
  const receiptInvoiceDates = active.map((gr) => gr.vendor_invoice_date).filter(Boolean).sort();
  const receiptInvoiceAmount = active.reduce((sum, gr) => sum + Number(gr.vendor_invoice_amount || gr.received_amount || goodsReceiptBaseAmount(po, gr)), 0);
  const invoiceAmount = Number(po.vendor_invoice_amount || receiptInvoiceAmount || received || 0);
  const landedClear = landedClearAmountForInvoice(po, invoiceAmount, received);
  const expectedInvoice = received + landedClear;
  const invoiceNo = po.vendor_invoice_no || receiptInvoiceNo || "";
  const invoiceDate = po.vendor_invoice_date || receiptInvoiceDates[0] || po.invoice_date || "";
  const dueDate = po.due_date || invoiceDate || po.expected_date || "";
  const isBeginningAp = /beginning ap/i.test(`${po.status || ""} ${po.notes || ""}`);
  const isLandedAp = isLandedCostPayable(po);
  const match = isBeginningAp || isLandedAp ? "Matched" : !received ? "Awaiting Goods" : !invoiceAmount ? "Pending" : Math.abs(invoiceAmount - expectedInvoice) <= 0.005 ? "Matched" : "Mismatch";
  const payment = isLandedAp && po.payment_status ? po.payment_status : po.payment_status && !/not ready/i.test(po.payment_status) ? po.payment_status : match === "Matched" ? "Ready to Pay" : "Not Ready";
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
  return `<div class="rowactions">${row.ap_posted ? "" : `<button class="rowbtn" type="button" data-ap-post="${esc(row.po_no)}">Post</button>`}${needsResolve && !row.landed_cost_ap ? `<button class="rowbtn" type="button" data-ap-resolve="${esc(row.po_no)}">Resolve</button>` : ""}${canPay ? `<button class="rowbtn" type="button" data-ap-check="${esc(row.po_no)}">Check</button>` : ""}</div>`;
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

function financialStatementHtml(title, rows, heads, mapper, data, basis = "period") {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const from = localStorage.getItem("lms.accountingReportFrom") || "Beginning";
  const to = localStorage.getItem("lms.accountingReportTo") || today();
  const label = basis === "asOf" ? `As of ${to}` : `Period ${from} to ${to}`;
  return `<div class="notice">${esc(title)} ${esc(label)} total ${money(total)}. Click an account line to review the posting details.</div>${accountingTable(rows, heads, mapper)}<div id="financialDetailHost"></div>`;
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
  const toggleAccountingSummaryBtn = $("toggleAccountingSummaryBtn");
  if (toggleAccountingSummaryBtn) toggleAccountingSummaryBtn.onclick = () => {
    const nextCollapsed = localStorage.getItem(ACCOUNTING_SUMMARY_STORAGE_KEY) !== "1";
    localStorage.setItem(ACCOUNTING_SUMMARY_STORAGE_KEY, nextCollapsed ? "1" : "0");
    renderAccountingView();
  };
  document.querySelectorAll("[data-accounting-tab]").forEach((btn) => btn.onclick = () => {
    accountingTab = btn.dataset.accountingTab;
    renderAccountingView();
  });
  document.querySelectorAll("[data-ap-tab]").forEach((btn) => btn.onclick = () => {
    accountsPayableTab = btn.dataset.apTab;
    renderAccountingView();
  });
  $("accountingApplyDatesBtn").onclick = () => {
    localStorage.setItem("lms.accountingReportFrom", $("accountingReportFrom").value || "");
    localStorage.setItem("lms.accountingReportTo", $("accountingReportTo").value || "");
    renderAccountingView();
  };
  document.querySelectorAll("[data-jump]").forEach((btn) => btn.onclick = () => loadView(btn.dataset.jump));
  const postBtn = $("postApFromPoBtn");
  if (postBtn) postBtn.onclick = () => openPostApFromPoModal(data);
  $("accountingSearch").oninput = applyAccountingSearch;
  $("newAccountBtn").onclick = () => openAccountingSourceModal("coa");
  $("newBankItemBtn").onclick = () => openAccountingSourceModal("bank");
  $("newJournalBtn").onclick = () => openAccountingSourceModal("accounting");
  $("trialBalanceTemplateBtn").onclick = downloadTrialBalanceTemplate;
  $("trialBalanceUploadBtn").onclick = () => $("trialBalanceFileImport").click();
  $("trialBalanceFileImport").onchange = importTrialBalanceFile;
  $("beginningInventoryTemplateBtn").onclick = downloadBeginningInventoryTemplate;
  $("beginningInventoryUploadBtn").onclick = () => $("beginningInventoryFileImport").click();
  $("beginningInventoryFileImport").onchange = importBeginningInventoryFile;
  $("beginningApTemplateBtn").onclick = downloadBeginningApTemplate;
  $("beginningApUploadBtn").onclick = () => $("beginningApFileImport").click();
  $("beginningApFileImport").onchange = importBeginningApFile;
  $("clearBeginningApBtn").onclick = clearBeginningApDetail;
  $("beginningArTemplateBtn").onclick = downloadBeginningArTemplate;
  $("beginningArUploadBtn").onclick = () => $("beginningArFileImport").click();
  $("beginningArFileImport").onchange = importBeginningArFile;
  $("clearBeginningArBtn").onclick = clearBeginningArDetail;
  document.querySelectorAll("[data-beginning-inventory-upload]").forEach((btn) => btn.onclick = () => $("beginningInventoryFileImport").click());
  document.querySelectorAll("[data-beginning-ap-upload]").forEach((btn) => btn.onclick = () => $("beginningApFileImport").click());
  document.querySelectorAll("[data-beginning-ar-upload]").forEach((btn) => btn.onclick = () => $("beginningArFileImport").click());
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

function downloadTrialBalanceTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Trial_Balance_Upload_Template.xlsx";
  a.download = "LMS_Trial_Balance_Upload_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadBeginningInventoryTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Beginning_Inventory_Detail_Template.xlsx";
  a.download = "LMS_Beginning_Inventory_Detail_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadBeginningApTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Beginning_AP_Detail_Template.xlsx";
  a.download = "LMS_Beginning_AP_Detail_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadBeginningArTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Beginning_AR_Detail_Template.xlsx";
  a.download = "LMS_Beginning_AR_Detail_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function importTrialBalanceFile() {
  const input = $("trialBalanceFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const rows = await readTrialBalanceRows(file);
    const entries = rows.map(trialBalanceRowToLedger).filter((row) => row.account && (Number(row.debit || 0) || Number(row.credit || 0)));
    if (!entries.length) throw new Error("No valid Trial Balance rows were found. Account plus Debit or Credit is required.");
    const locked = entries.find((row) => isLockedAccountingDate(row.posting_date));
    if (locked) throw new Error(`Posting date ${locked.posting_date} is inside a closed accounting period. Re-open that period first or use a later posting date.`);
    await ensureTrialBalanceAccounts(entries, rows);
    await supabase.from("general_ledger").delete().eq("source", "Trial Balance Upload").in("reference", entries.map((row) => row.reference));
    await upsertMany("general_ledger", entries, "id");
    input.value = "";
    accountingTab = "tb";
    alert(`${entries.length} beginning-balance line${entries.length === 1 ? "" : "s"} uploaded to General Ledger. Trial Balance, Balance Sheet, and Income Statement will now use these rows by posting date.`);
    await renderAccountingView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload Trial Balance.");
  }
}

async function importBeginningInventoryFile() {
  const input = $("beginningInventoryFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const asOfDate = prompt("Beginning inventory as-of date", $("accountingReportTo")?.value || today());
    if (asOfDate === null) {
      input.value = "";
      return;
    }
    const postingDate = parseFlexibleDate(asOfDate) || today();
    if (isLockedAccountingDate(postingDate)) throw new Error(`Posting date ${postingDate} is inside a closed accounting period. Re-open that period first or use a later posting date.`);
    const rows = await readProductTemplateRows(file);
    const products = rows.map(productTemplateRowToDbProduct).filter((row) => row.sku && row.name);
    if (!products.length) throw new Error("No valid inventory detail rows were found. SKU and Product Name are required.");
    const masterProducts = collapseBeginningInventoryProducts(products);
    await ensureProductUploadMasters(masterProducts);
    const savedProducts = await upsertManyWithOptionalColumns("products", masterProducts, "sku", ["source_vendor", "markup_percent", "barcode", "batch_lot", "expiry_date", "compatible_with", "notes"]);
    await saveProductUploadAlternates(savedProducts, rows);
    const detailValue = await postBeginningInventoryDetails(savedProducts, products, postingDate);
    const glBalance = await beginningInventoryGlBalance(postingDate);
    const difference = detailValue - glBalance;
    input.value = "";
    accountingTab = "tb";
    alert(`Beginning inventory detail uploaded.\n\nDetail value: ${money(detailValue)}\nParts Inventory beginning TB: ${money(glBalance)}\nDifference: ${money(difference)}\n\nThis upload updates Product Master and Stock Movement only. The Trial Balance upload remains the accounting control balance.`);
    await renderAccountingView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload beginning inventory detail.");
  }
}

async function importBeginningApFile() {
  const input = $("beginningApFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const asOfDate = prompt("Beginning AP as-of date", $("accountingReportTo")?.value || today());
    if (asOfDate === null) {
      input.value = "";
      return;
    }
    const postingDate = parseFlexibleDate(asOfDate) || today();
    if (isLockedAccountingDate(postingDate)) throw new Error(`Posting date ${postingDate} is inside a closed accounting period. Re-open that period first or use a later posting date.`);
    const rows = await readBeginningDetailRows(file, "Beginning AP Detail");
    const mappedPayables = rows.map(beginningApRowToRecord);
    const payables = mappedPayables.filter((row) => row.vendor && row.vendor_invoice_amount > 0);
    if (!payables.length) throw new Error("No valid AP detail rows were found. Vendor and Amount are required.");
    await upsertMany("vendors", uniqueNamedRows(payables.map((row) => ({ reference: row.vendor_ref, name: row.vendor, terms: row.payment_terms || "Net 30", address: row.address || null }))), "name");
    await replaceBeginningApDetail(payables, postingDate);
    const detailValue = payables.reduce((sum, row) => sum + Number(row.vendor_invoice_amount || 0), 0);
    const glBalance = await beginningSubledgerGlBalance("Accounts Payable", postingDate, "credit");
    input.value = "";
    accountingTab = "tb";
    alert(`Beginning AP detail uploaded.\n\nRows read: ${rows.length}\nRows imported: ${payables.length}\nRows skipped: ${rows.length - payables.length}\nDetail value: ${money(detailValue)}\nAccounts Payable beginning TB: ${money(glBalance)}\nDifference: ${money(detailValue - glBalance)}\n\nThese vendor invoices are now available for AP aging and check run. The Trial Balance upload remains the accounting control balance.`);
    await renderAccountingView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload beginning AP detail.");
  }
}

async function importBeginningArFile() {
  const input = $("beginningArFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const asOfDate = prompt("Beginning AR as-of date", $("accountingReportTo")?.value || today());
    if (asOfDate === null) {
      input.value = "";
      return;
    }
    const postingDate = parseFlexibleDate(asOfDate) || today();
    if (isLockedAccountingDate(postingDate)) throw new Error(`Posting date ${postingDate} is inside a closed accounting period. Re-open that period first or use a later posting date.`);
    const rows = await readBeginningDetailRows(file, "Beginning AR Detail");
    const mappedReceivables = rows.map(beginningArRowToRecord);
    const receivables = mappedReceivables.filter((row) => row.customer && row.amount > 0);
    if (!receivables.length) throw new Error("No valid AR detail rows were found. Customer and Amount are required.");
    await upsertMany("customers", uniqueNamedRows(receivables.map((row) => ({ reference: row.customer_ref, name: row.customer, terms: row.terms || "Net 30", address: row.address || null }))), "name");
    await replaceBeginningArDetail(receivables, postingDate);
    const detailValue = receivables.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const glBalance = await beginningSubledgerGlBalance("Accounts Receivable", postingDate, "debit");
    input.value = "";
    accountingTab = "tb";
    alert(`Beginning AR detail uploaded.\n\nRows read: ${rows.length}\nRows imported: ${receivables.length}\nRows skipped: ${rows.length - receivables.length}\nDetail value: ${money(detailValue)}\nAccounts Receivable beginning TB: ${money(glBalance)}\nDifference: ${money(detailValue - glBalance)}\n\nThese customer invoices are now available for AR aging and payment collection. The Trial Balance upload remains the accounting control balance.`);
    await renderAccountingView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload beginning AR detail.");
  }
}

async function clearBeginningApDetail() {
  if (!confirm("Clear Beginning AP detail only?\n\nThis removes uploaded Beginning AP vendor invoices from Accounts Payable and check run. It does not remove vendors, products, chart of accounts, or trial balance balances.")) return;
  try {
    const orders = await getAll("purchase_orders");
    const beginningAp = orders.filter((row) => /beginning ap/i.test(`${row.status || ""} ${row.notes || ""} ${row.source_ref || ""}`));
    const ids = beginningAp.map((row) => row.id).filter(Boolean);
    if (ids.length) {
      await deleteWhereIn("purchase_order_lines", "purchase_order_id", ids);
      await deleteWhereIn("purchase_orders", "id", ids);
    }
    alert(`Beginning AP cleared.\n\nRecords removed: ${beginningAp.length}\n\nYou can upload the AP beginning detail again now.`);
    await renderAccountingView();
  } catch (error) {
    alert(error.message || "Could not clear Beginning AP.");
  }
}

async function clearBeginningArDetail() {
  if (!confirm("Clear Beginning AR detail only?\n\nThis removes uploaded Beginning AR customer invoices from Accounts Receivable. It does not remove customers, chart of accounts, or trial balance balances.")) return;
  try {
    const invoices = await getAll("invoices");
    const beginningAr = invoices.filter((row) => /beginning ar/i.test(`${row.type || ""} ${row.notes || ""} ${row.source_ref || ""}`));
    const ids = beginningAr.map((row) => row.id).filter(Boolean);
    if (ids.length) {
      await deleteWhereIn("invoice_lines", "invoice_id", ids);
      await deleteWhereIn("invoices", "id", ids);
    }
    await clearBeginningArPayments();
    alert(`Beginning AR cleared.\n\nInvoices removed: ${beginningAr.length}\n\nYou can upload the AR beginning detail again now.`);
    await renderAccountingView();
  } catch (error) {
    alert(error.message || "Could not clear Beginning AR.");
  }
}

async function clearBeginningArPayments() {
  try {
    const payments = await getAll("customer_payments");
    const beginningPaymentIds = payments
      .filter((row) => /beginning ar/i.test(`${row.notes || ""} ${row.status || ""} ${row.source_ref || ""}`))
      .map((row) => row.id)
      .filter(Boolean);
    if (beginningPaymentIds.length) await deleteWhereIn("customer_payments", "id", beginningPaymentIds);
  } catch (error) {
    console.warn("Skipping Beginning AR payment cleanup", error);
  }
}

async function readBeginningDetailRows(file, preferredSheet) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return rowsFromAnyDetectedHeader(parseCsvMatrix(await file.text()), beginningDetailHeaderCandidates(preferredSheet));
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[preferredSheet] || workbook.Sheets[workbook.SheetNames[0]];
      return sheetToRowsWithDetectedHeader(XLSX, sheet, beginningDetailHeaderCandidates(preferredSheet));
    } catch (error) {
      throw new Error("Excel upload needs internet access to load the Excel reader. You can also save the template as CSV and upload that file.");
    }
  }
  throw new Error("Upload the detail template as .xlsx, .xls, or .csv.");
}

function beginningDetailHeaderCandidates(preferredSheet = "") {
  const common = ["name", "payee", "invoice #", "invoice no", "invoice number", "invoice date", "due date", "amount", "invoice amount", "invoice total", "amount due", "total due", "net amount", "balance", "balance due", "open balance", "current balance", "remaining balance", "debit", "credit", "po #", "po no", "work order #", "jobsite", "equipment", "description of parts"];
  return /ar/i.test(preferredSheet)
    ? common.concat(["customer", "customer name", "customer ref", "customer reference"])
    : common.concat(["vendor", "vendor name", "supplier", "vendor ref", "vendor reference"]);
}

function beginningDetailAmount(row, side = "debit") {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  const direct = nullableNumber(get("amount", "invoice_amount", "invoice_total", "total_amount", "amount_due", "total_due", "net_amount", "balance", "open_balance", "balance_due", "remaining_balance", "open_invoice_amount", "current_balance", "unpaid_balance", "ar_balance", "ap_balance", "receivable", "payable"));
  if (direct != null) return Math.abs(direct);
  const debit = nullableNumber(get("debit", "debit_balance"));
  const credit = nullableNumber(get("credit", "credit_balance"));
  if (side === "credit") return Math.abs(credit != null ? credit : debit || 0);
  const sideAmount = debit != null ? debit : credit;
  if (sideAmount != null) return Math.abs(sideAmount);
  const amountKey = /(amount|balance|total|due|open|current|debit|credit|receivable|payable|unpaid|net)/i;
  const nonAmountKey = /(date|invoice_no|invoice_number|po_no|wo_no|reference|source|customer|vendor|name|terms|address|status|phone|email)/i;
  const candidates = Object.entries(row || {})
    .filter(([key]) => amountKey.test(key) && !nonAmountKey.test(key))
    .map(([, value]) => nullableNumber(value))
    .filter((value) => value != null && Number.isFinite(value) && Math.abs(value) > 0)
    .map((value) => Math.abs(value));
  if (candidates.length) return Math.max(...candidates);
  return 0;
}

function beginningApRowToRecord(row) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  const vendor = String(get("vendor", "vendor_name", "supplier", "payee", "name")).trim();
  const invoiceNo = String(get("invoice_no", "vendor_invoice_no", "invoice")).trim();
  const invoiceDate = excelDateToIso(get("invoice_date", "vendor_invoice_date", "date")) || today();
  const amount = beginningDetailAmount(row, "credit") || 0;
  const suppliedPo = String(get("po_no", "reference", "ref")).trim();
  const poNo = suppliedPo && invoiceNo ? `${suppliedPo}-${invoiceNo}` : suppliedPo || `BBAP-${invoiceNo || vendor.replace(/\W+/g, "").slice(0, 10) || Date.now()}`;
  return {
    po_no: poNo,
    vendor,
    vendor_ref: String(get("vendor_ref", "vendor_reference")).trim() || `V-BB-${vendor.replace(/\W+/g, "").slice(0, 12) || "AP"}`,
    po_date: invoiceDate,
    expected_date: excelDateToIso(get("due_date")) || invoiceDate,
    payment_terms: String(get("terms", "payment_terms")).trim() || "Net 30",
    address: String(get("address", "vendor_address")).trim(),
    incoterm: String(get("incoterm")).trim() || null,
    vendor_invoice_no: invoiceNo || poNo,
    vendor_invoice_date: invoiceDate,
    due_date: excelDateToIso(get("due_date")) || invoiceDate,
    vendor_invoice_amount: amount,
    posting_date: invoiceDate,
    match_status: "Matched",
    payment_status: String(get("payment_status")).trim() || "Ready to Pay",
    status: "Beginning AP",
    notes: [String(get("notes", "description")).trim(), suppliedPo && suppliedPo !== poNo ? `Original PO: ${suppliedPo}` : "", "Beginning AP detail"].filter(Boolean).join("\n"),
  };
}

function beginningArRowToRecord(row) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  const customer = String(get("customer", "customer_name", "company_name", "payee", "name")).trim();
  const invoiceNo = String(get("invoice_no", "invoice", "reference")).trim() || `BBAR-${customer.replace(/\W+/g, "").slice(0, 10) || Date.now()}`;
  const invoiceDate = excelDateToIso(get("invoice_date", "date")) || today();
  return {
    invoice_no: invoiceNo,
    invoice_date: invoiceDate,
    due_date: excelDateToIso(get("due_date")) || invoiceDate,
    customer,
    customer_ref: String(get("customer_ref", "customer_reference")).trim() || `C-BB-${customer.replace(/\W+/g, "").slice(0, 12) || "AR"}`,
    terms: String(get("terms", "payment_terms")).trim() || "Net 30",
    address: String(get("address", "customer_address")).trim(),
    type: "Beginning AR",
    source_ref: String(get("source_ref", "customer_po", "po_no")).trim() || "Beginning Balance",
    status: String(get("status")).trim() || "Open",
    description: String(get("description", "notes")).trim() || "Beginning AR detail",
    amount: beginningDetailAmount(row, "debit") || 0,
    notes: "Beginning AR detail",
  };
}

async function replaceBeginningApDetail(payables, postingDate) {
  await supabase.from("purchase_orders").delete().eq("status", "Beginning AP");
  const rows = payables.map((row, index) => ({
    ...row,
    po_no: row.po_no || `BBAP-${postingDate}-${index + 1}`,
    po_date: row.po_date || postingDate,
    posting_date: row.posting_date || postingDate,
    jobsite_project: "Beginning Balance",
    currency_code: "USD",
    exchange_rate: 1,
    freight_amount: 0,
    landed_cost_enabled: false,
    landed_cost_method: "By Value",
    duty_amount: 0,
    other_landed_cost_amount: 0,
  }));
  await upsertManyWithOptionalColumns("purchase_orders", rows, "po_no", ["posting_date", "payment_terms", "incoterm"], "Some AP detail fields were skipped because the database schema needs the latest purchasing update.");
}

async function replaceBeginningArDetail(receivables, postingDate) {
  const existing = await getAll("invoices");
  const uploadInvoiceNos = new Set(receivables.map((row, index) => row.invoice_no || `BBAR-${postingDate}-${index + 1}`).filter(Boolean));
  const old = existing.filter((row) =>
    /beginning ar/i.test(`${row.type || ""} ${row.notes || ""}`) ||
    (uploadInvoiceNos.has(row.invoice_no) && /beginning balance/i.test(`${row.source_ref || ""} ${row.notes || ""}`))
  );
  if (old.length) {
    await supabase.from("invoice_lines").delete().in("invoice_id", old.map((row) => row.id));
    await supabase.from("invoices").delete().in("id", old.map((row) => row.id));
  }
  const invoiceRows = [];
  const seenInvoiceNos = new Set();
  receivables.forEach((row, index) => {
    const invoiceNo = row.invoice_no || `BBAR-${postingDate}-${index + 1}`;
    row.invoice_no = invoiceNo;
    if (seenInvoiceNos.has(invoiceNo)) return;
    seenInvoiceNos.add(invoiceNo);
    invoiceRows.push({
      invoice_no: invoiceNo,
      invoice_date: row.invoice_date || postingDate,
      due_date: row.due_date || row.invoice_date || postingDate,
      customer: row.customer,
      type: "Beginning AR",
      source_ref: row.source_ref || "Beginning Balance",
      status: row.status || "Open",
      notes: row.notes || "Beginning AR detail",
    });
  });
  const invoices = await upsertMany("invoices", invoiceRows, "invoice_no");
  const byNo = new Map(invoices.map((inv) => [inv.invoice_no, inv]));
  const invoiceIds = invoices.map((inv) => inv.id).filter(Boolean);
  if (invoiceIds.length) await supabase.from("invoice_lines").delete().in("invoice_id", invoiceIds);
  const lines = receivables.map((row) => {
    const invoice = byNo.get(row.invoice_no);
    return invoice ? { invoice_id: invoice.id, description: row.description || "Beginning AR detail", unit: "Balance", qty: 1, rate: Number(row.amount || 0) } : null;
  }).filter(Boolean);
  if (lines.length) await upsertMany("invoice_lines", lines, "id");
}

async function beginningSubledgerGlBalance(accountName, postingDate, normalSide) {
  const rows = await getAll("general_ledger");
  return rows
    .filter((row) => String(row.posting_date || row.entry_date || "").slice(0, 10) <= postingDate)
    .filter((row) => String(row.account || "").toLowerCase() === accountName.toLowerCase() && /trial balance upload/i.test(row.source || ""))
    .reduce((sum, row) => sum + (normalSide === "credit" ? Number(row.credit || 0) - Number(row.debit || 0) : Number(row.debit || 0) - Number(row.credit || 0)), 0);
}

async function readTrialBalanceRows(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return rowsFromDetectedHeader(parseCsvMatrix(await file.text()));
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets["Trial Balance Upload"] || workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      return rowsFromDetectedHeader(matrix);
    } catch (error) {
      throw new Error("Excel upload needs internet access to load the Excel reader. You can also save the template as CSV and upload that file.");
    }
  }
  throw new Error("Upload the Trial Balance template as .xlsx, .xls, or .csv.");
}

function rowsFromDetectedHeader(matrix) {
  return rowsFromAnyDetectedHeader(matrix, ["account", "account code", "debit", "credit", "debit balance", "credit balance"], 2);
}

function rowsFromAnyDetectedHeader(matrix, headerCandidates = [], minimumMatches = 1) {
  const rows = (matrix || []).filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim() !== ""));
  const candidates = new Set(headerCandidates.map(normalizeHeaderKey).filter(Boolean));
  const scored = rows.map((row, index) => {
    const headers = row.map(normalizeHeaderKey);
    const matches = headers.filter((header) => header && (!candidates.size || candidates.has(header))).length;
    const knownHeaders = headers.filter((header) => header && commonUploadHeaders().has(header)).length;
    return { index, score: matches || knownHeaders, knownHeaders };
  });
  const best = scored
    .filter((item) => item.score >= minimumMatches || item.knownHeaders >= Math.max(2, minimumMatches))
    .sort((a, b) => b.score - a.score || b.knownHeaders - a.knownHeaders || a.index - b.index)[0];
  if (!best) return [];
  const headers = rows[best.index].map(normalizeHeaderKey);
  return rows.slice(best.index + 1)
    .map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        if (header) item[header] = row[index] ?? "";
      });
      return item;
    })
    .map(normalizeAssetTemplateRow)
    .filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""));
}

function commonUploadHeaders() {
  return new Set([
    "date", "posting_date", "transaction_date", "posted_date", "account_code", "account", "report_group", "type", "normal_balance", "debit", "credit",
    "vendor", "customer", "invoice_no", "invoice_date", "due_date", "amount", "po_no", "wo_no", "jobsite", "equipment", "description",
    "sku", "product_name", "category", "unit", "warehouse", "bin_shelf", "qty", "cost", "selling_price", "markup_percent", "source_vendor",
    "asset_tag", "location", "scanned_date", "last_update_date", "email", "phone", "address", "terms", "tax_id", "status",
  ]);
}

function normalizeTemplateHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/[#/()]+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function trialBalanceRowToLedger(row) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  const accountCode = String(get("account_code", "code", "new_code")).trim();
  const account = String(get("account", "account_name", "name")).trim() || accountCode;
  const postingDate = excelDateToIso(get("posting_date", "date", "as_of_date")) || today();
  const debit = nullableNumber(get("debit", "debit_balance")) || 0;
  const credit = nullableNumber(get("credit", "credit_balance")) || 0;
  const reference = String(get("reference", "ref")).trim() || `TB-${postingDate}-${accountCode || account}`;
  return {
    entry_date: postingDate,
    posting_date: postingDate,
    account,
    customer: String(get("customer")).trim() || null,
    vendor: String(get("vendor")).trim() || null,
    invoice_no: String(get("invoice_no", "invoice")).trim() || null,
    invoice_date: excelDateToIso(get("invoice_date")) || null,
    due_date: excelDateToIso(get("due_date")) || null,
    mechanic: String(get("mechanic")).trim() || null,
    asset: String(get("asset", "asset_tag")).trim() || null,
    description: String(get("description")).trim() || "Beginning balance from Trial Balance upload",
    reference,
    debit,
    credit,
    source: "Trial Balance Upload",
    status: "Posted",
  };
}

async function ensureTrialBalanceAccounts(entries, rawRows) {
  const existing = await getAll("chart_of_accounts");
  const existingByName = new Set(existing.map((row) => row.account));
  const accountRows = [];
  entries.forEach((entry, index) => {
    if (existingByName.has(entry.account)) return;
    const row = rawRows[index] || {};
    const code = String(row.account_code || row.code || row.new_code || "").trim();
    const type = String(row.type || "").trim() || accountType(entry.account);
    accountRows.push({
      account_code: code || null,
      account: entry.account,
      report_group: String(row.report_group || row.report || "").trim() || statementGroup(type),
      type,
      normal_balance: String(row.normal_balance || "").trim() || normalBalance(type),
      notes: "Created from Trial Balance upload",
    });
    existingByName.add(entry.account);
  });
  if (accountRows.length) await upsertManyWithOptionalColumns("chart_of_accounts", accountRows, "account", ["account_code", "report_group"], "Some optional chart fields were skipped because the database needs the latest chart update.");
}

async function openPostApFromPoModal(data, poNo = "") {
  const pos = data.pos.filter((po) => !/cancel/i.test(po.status || ""));
  const po = pos.find((row) => row.po_no === poNo) || pos[0];
  const ap = po ? poApSummary(po) : {};
  const support = po ? poSupportDetails(data, po) : {};
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
      ${productInput("Work Order # (optional)", "support_wo_no", support.wo_no || "")}
      ${productInput("Jobsite", "support_jobsite", support.jobsite || "N/A")}
      ${productInput("Equipment", "support_equipment", support.equipment || "N/A")}
      ${productSelect("Match status", "match_status", ["Matched", "Mismatch", "Pending", "Awaiting Goods"], ap.match || "Matched")}
      ${productSelect("Payment status", "payment_status", ["Not Ready", "Ready to Pay", "Hold", "Paid"], ap.payment || "Ready to Pay")}
      ${productSelect("Document status", "status", ["Draft", "Partially Received", "Goods Received", "Matched", "Paid"], ap.status || "Matched")}
      <div class="field wide"><label>PO items purchased / received</label>${apPoLineTable(po)}</div>
      <div class="field wide"><label>Description of parts / items</label><textarea data-product-field="support_parts_description">${esc(support.parts_description || "")}</textarea></div>
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

function poSupportDetails(data, po, fallback = {}) {
  const rows = Array.isArray(po?._lines) ? po._lines : [];
  const receipts = activeReceipts(po || {});
  const workOrders = data?.workOrders || data?.work_orders || [];
  const assets = data?.assets || [];
  const woValues = uniqueTextList([
    fallback.wo_no,
    fallback.support_wo_no,
    po?.ap_support_wo_no,
    po?.wo_no,
    ...rows.map((line) => line.wo_no),
  ]).filter((value) => !/^n\/?a$/i.test(value));
  const wo = workOrders.find((row) => woValues.includes(row.wo_no));
  const poNo = fallback.po_no || po?.po_no || fallback.reference || "";
  const jobsite = fallback.jobsite || fallback.support_jobsite || po?.ap_support_jobsite || po?.jobsite_project || wo?.jobsite_location || wo?.location || "N/A";
  const equipment = fallback.equipment || fallback.support_equipment || po?.ap_support_equipment || supportEquipmentText(wo, assets) || "N/A";
  const parts = fallback.parts_description || fallback.support_parts_description || po?.ap_support_parts_description || supportPartsDescription(rows, receipts) || "N/A";
  return {
    wo_no: woValues.join(", ") || "N/A",
    po_no: poNo,
    jobsite,
    equipment,
    parts_description: parts,
  };
}

function supportPartsDescription(lines = [], receipts = []) {
  const lineText = (lines || []).map((line) => {
    const qty = Number(line.qty || 0);
    const unit = line.unit ? ` ${line.unit}` : "";
    const name = [line.sku, line.product_name].filter(Boolean).join(" - ");
    return name ? `${name}${qty ? ` (${qty}${unit})` : ""}` : "";
  });
  const receiptText = (receipts || []).map((gr) => {
    const qty = Number(gr.received_qty || 0);
    const name = [gr.sku, gr.product_name].filter(Boolean).join(" - ");
    return name ? `${name}${qty ? ` (${qty})` : ""}` : "";
  });
  return uniqueTextList([...lineText, ...receiptText]).join("; ");
}

function supportEquipmentText(wo, assets = []) {
  if (!wo) return "";
  const assetKey = wo.asset_tag || wo.asset || wo.asset_no || "";
  const asset = assets.find((row) => [row.asset_tag, row.asset_no, row.name].filter(Boolean).includes(assetKey));
  const parts = [
    asset?.asset_tag || assetKey,
    asset?.name || wo.asset_name,
    asset?.make,
    asset?.model,
    asset?.vin_serial || asset?.serial_no || asset?.vin,
  ].filter(Boolean);
  return uniqueTextList(parts).join(" | ");
}

function uniqueTextList(values) {
  return [...new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean))];
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
  const support = poSupportDetails(data, po, record);
  if (!support.po_no || !support.jobsite || !support.equipment || !support.parts_description) {
    alert("Invoice support details are required: PO #, jobsite, equipment, and parts/items.");
    return;
  }
  const isLandedAp = isLandedCostPayable(po);
  const receivedAmount = poReceivedTotal(po);
  if (!isLandedAp && receivedAmount <= 0) {
    alert("Receive goods before posting Accounts Payable. If the goods receipt was reversed, post a new goods receipt first.");
    return;
  }
  try {
    await supabase.from("purchase_orders").update({
      vendor_invoice_no: record.vendor_invoice_no,
      vendor_invoice_date: record.vendor_invoice_date,
      vendor_invoice_amount: invoiceAmount,
      due_date: record.due_date,
      ap_support_wo_no: support.wo_no,
      ap_support_jobsite: support.jobsite,
      ap_support_equipment: support.equipment,
      ap_support_parts_description: support.parts_description,
      match_status: record.match_status || "Matched",
      payment_status: record.payment_status || "Ready to Pay",
      status: record.status || "Matched",
      notes: record.notes || po.notes || null,
    }).eq("id", po.id);
    if (isLandedAp) {
      await postLandedCostInvoiceLedger({ ...po, ...record, po_no: po.po_no, vendor: po.vendor }, linkedLandedSourcePoNo(po) || po.po_no, "Separate AP");
    } else {
      await postPurchaseOrderLedger(po, record);
    }
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
  const isBeginningAp = /beginning ap/i.test(`${po.status || ""} ${po.notes || ""}`);
  const noReceiptPayable = isBeginningAp || isLandedCostPayable(po);
  if (!noReceiptPayable && poReceivedTotal(po) <= 0) {
    alert("This PO has no active goods receipt. Receive the goods again before creating a check run.");
    return;
  }
  if (!/ready to pay|paid/i.test(ap.payment || "")) {
    alert("This PO is not ready to pay yet. Post or resolve AP matching first.");
    return;
  }
  if (!noReceiptPayable && !await hasPostedApForPurchaseOrder(po.po_no)) {
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
  const support = poSupportDetails(data, po);
  const checkRunNo = await nextRefPreview("check", "CHK-", "check_runs", "check_run_no");
  $("modalTitle").textContent = `Create check run for ${po.po_no}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Check run #", "check_run_no", checkRunNo)}
      ${productInput("Payment date", "payment_date", today(), "date")}
      ${productSelect("Pay from account", "payment_account", accounts, accounts[0] || "FHB Checking")}
      ${productSelect("Payment mode", "payment_mode", ["Check", "ACH", "Wire", "Cash", "Credit Card", "Intercompany"], paymentModeForAccount(accounts[0] || "FHB Checking"))}
      ${productInput("Check # / EFT reference", "check_no", "")}
      ${productInput("Vendor", "vendor", po.vendor || "")}
      ${productInput("Reference", "reference", po.po_no)}
      ${productInput("Invoice #", "invoice_no", ap.invoice_no || "")}
      ${productInput("Invoice date", "invoice_date", ap.invoice_date || "", "date")}
      ${productInput("Due date", "due_date", ap.due_date || po.expected_date || "", "date")}
      ${productInput("Amount", "amount", amount, "number")}
      ${productInput("Work Order # (optional)", "wo_no", support.wo_no || "")}
      ${productInput("PO #", "po_no", support.po_no || po.po_no)}
      ${productInput("Jobsite", "jobsite", support.jobsite || "N/A")}
      ${productInput("Equipment", "equipment", support.equipment || "N/A")}
      ${productSelect("Status", "status", ["Posted", "Draft"], "Posted")}
      <div class="field wide"><label>Description of parts / items</label><textarea data-product-field="parts_description">${esc(support.parts_description || "")}</textarea></div>
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
        wo_no: record.wo_no || support.wo_no || "N/A",
        po_no: record.po_no || support.po_no || po.po_no,
        jobsite: record.jobsite || support.jobsite || "N/A",
        equipment: record.equipment || support.equipment || "N/A",
        parts_description: record.parts_description || support.parts_description || "N/A",
        amount: Number(record.amount || amount),
        status: record.status || "Posted",
        notes: checkRunNotesPayload(record.notes, [{
          ...po,
          ...runSupportRow(record, support, amount, po.po_no, ap),
          source: "Purchase Order",
        }]),
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
  const landedClear = landedClearAmountForInvoice(po, amount, received);
  const variance = amount - received - landedClear;
  const postingDate = record.posting_date || record.vendor_invoice_date || today();
  const rows = [
    { entry_date: postingDate, posting_date: postingDate, account: "Parts Accrual", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `Clear accrued receipt ${po.po_no}`, reference: po.po_no, debit: received, credit: 0, source: "Purchase Order", status: "Posted" },
    { entry_date: postingDate, posting_date: postingDate, account: "Accounts Payable (A/P)", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `Payable to ${po.vendor}`, reference: po.po_no, debit: 0, credit: amount, source: "Purchase Order", status: "Posted" },
  ];
  if (landedClear > 0) rows.splice(1, 0, { entry_date: postingDate, posting_date: postingDate, account: "Landed Cost Accrual", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `Clear landed cost on same invoice ${po.po_no}`, reference: po.po_no, debit: landedClear, credit: 0, source: "Purchase Order", status: "Posted" });
  if (variance > 0) rows.push({ entry_date: postingDate, posting_date: postingDate, account: "Inventory Loss - Obsolete Part", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `PO invoice variance ${po.vendor}`, reference: po.po_no, debit: variance, credit: 0, source: "Purchase Order", status: "Posted" });
  if (variance < 0) rows.push({ entry_date: postingDate, posting_date: postingDate, account: "Inventory Loss - Obsolete Part", vendor: po.vendor, invoice_no: record.vendor_invoice_no, invoice_date: record.vendor_invoice_date, due_date: record.due_date, description: `PO invoice variance ${po.vendor}`, reference: po.po_no, debit: 0, credit: Math.abs(variance), source: "Purchase Order", status: "Posted" });
  await supabase.from("general_ledger").delete().eq("reference", po.po_no).eq("source", "Purchase Order");
  await upsertMany("general_ledger", rows, "id");
}

async function purchaseOrderForReceipt(gr) {
  const { data: poRows, error: poError } = await supabase.from("purchase_orders").select("*").eq("po_no", gr.po_no).limit(1);
  if (poError && poError.code !== "PGRST116") throw poError;
  const po = (poRows || [])[0];
  if (!po) return null;
  const { data: lines, error: lineError } = await supabase.from("purchase_order_lines").select("*").eq("po_id", po.id);
  if (lineError && lineError.code !== "PGRST116") throw lineError;
  po._lines = lines || [];
  return po;
}

async function postGoodsReceiptLedger(receipts) {
  const poCache = new Map();
  const rows = [];
  for (const gr of receipts) {
    if (!poCache.has(gr.po_no)) poCache.set(gr.po_no, await purchaseOrderForReceipt(gr));
    const po = poCache.get(gr.po_no);
    const inventoryAmount = Number(gr.received_qty || 0) * Number(gr.unit_cost || 0);
    const productVendorAmount = goodsReceiptBaseAmount(po, gr);
    const landedAccrualAmount = Math.max(0, inventoryAmount - productVendorAmount);
    if (!inventoryAmount) continue;
    rows.push(
      { entry_date: gr.gr_date, posting_date: gr.gr_date, account: "Parts Inventory", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Goods receipt ${gr.sku}`, reference: gr.gr_no, debit: inventoryAmount, credit: 0, source: "Goods Receipt", status: "Posted" },
      { entry_date: gr.gr_date, posting_date: gr.gr_date, account: "Parts Accrual", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Accrued product receipt ${gr.sku}`, reference: gr.gr_no, debit: 0, credit: productVendorAmount || inventoryAmount, source: "Goods Receipt", status: "Posted" },
    );
    if (landedAccrualAmount) {
      rows.push({ entry_date: gr.gr_date, posting_date: gr.gr_date, account: "Landed Cost Accrual", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Estimated landed cost ${gr.sku}`, reference: gr.gr_no, debit: 0, credit: landedAccrualAmount, source: "Goods Receipt", status: "Posted" });
    }
  }
  for (const gr of receipts) {
    await supabase.from("general_ledger").delete().eq("reference", gr.gr_no).eq("source", "Goods Receipt");
  }
  if (rows.length) await upsertMany("general_ledger", rows, "id");
}

async function postGoodsReceiptReversalLedger(gr) {
  const po = await purchaseOrderForReceipt(gr);
  const amount = Number(gr.received_qty || 0) * Number(gr.unit_cost || 0);
  const productVendorAmount = goodsReceiptBaseAmount(po, gr);
  const landedAccrualAmount = Math.max(0, amount - productVendorAmount);
  if (!amount) return;
  const reference = `REV-${gr.gr_no}`;
  await supabase.from("general_ledger").delete().eq("reference", reference).eq("source", "Goods Receipt Reversal");
  const rows = [
    { entry_date: today(), posting_date: today(), account: "Parts Accrual", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Reverse product accrual ${gr.gr_no}`, reference, debit: productVendorAmount || amount, credit: 0, source: "Goods Receipt Reversal", status: "Posted" },
    { entry_date: today(), posting_date: today(), account: "Parts Inventory", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Reverse inventory ${gr.gr_no}`, reference, debit: 0, credit: amount, source: "Goods Receipt Reversal", status: "Posted" },
  ];
  if (landedAccrualAmount) rows.push({ entry_date: today(), posting_date: today(), account: "Landed Cost Accrual", vendor: gr.vendor, invoice_no: gr.vendor_invoice_no || null, invoice_date: gr.vendor_invoice_date || null, due_date: null, description: `Reverse landed cost accrual ${gr.gr_no}`, reference, debit: landedAccrualAmount, credit: 0, source: "Goods Receipt Reversal", status: "Posted" });
  await upsertMany("general_ledger", rows, "id");
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
  const [pos, poLines, receipts, runs, coa, gl, workOrders, assets] = await Promise.all([
    getAll("purchase_orders"),
    getAll("purchase_order_lines"),
    getAll("goods_receipts"),
    getAll("check_runs"),
    getAll("chart_of_accounts"),
    getAll("general_ledger"),
    getAll("work_orders"),
    getAll("assets"),
  ]);
  const data = buildAccountingData({ gl, coa, invoices: [], invoiceLines: [], payments: [], pos, poLines, receipts, salesOrders: [], salesLines: [], bankRows: [], products: [], workOrders, assets });
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
  $("checkRunCsvBtn").onclick = () => downloadCsv([["Check Run", "Date", "Mode", "Payment Account", "Check #", "Vendor", "Invoice #", "Invoice Date", "Amount", "Work Order #", "PO #", "Jobsite", "Equipment", "Description of Parts", "Status"], ...history.map((r) => [r.check_run_no, r.payment_date, r.payment_mode, r.payment_account, r.check_no, r.vendor, r.invoice_no, r.invoice_date, r.amount, r.wo_no, r.po_no || r.reference, r.jobsite, r.equipment, r.parts_description, r.status])], "check-run.csv");
  bindCheckRunRows();
}

function checkRunEligiblePayables(data) {
  return accountsPayableRows(data).filter((row) => row.ap_posted && /matched/i.test(row.match || "") && /ready/i.test(row.payment || "") && !/paid/i.test(row.payment || row.status || "")).map((row) => {
    const po = (data.pos || []).find((item) => item.po_no === row.po_no || item.po_no === row.reference);
    const support = poSupportDetails(data, po, row);
    return { ...row, ...support, amount: Number(row.invoice_amount || row.received || row.po_total || 0), source: "Purchase Order" };
  });
}

function checkRunHistoryRows(runs) {
  return [...runs].sort((a, b) => String(b.payment_date || "").localeCompare(String(a.payment_date || "")));
}

function checkRunPayablesTable(rows) {
  const heads = ["Include", "Vendor", "Invoice #", "Invoice Date", "Amount", "Work Order #", "PO #", "Jobsite", "Equipment", "Description of Parts", "Match", "Payment"];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => i ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr><td><input type="checkbox" data-check-payable="${esc(r.po_no)}" checked></td><td>${esc(r.vendor)}</td><td>${esc(r.invoice_no)}</td><td>${esc(r.invoice_date)}</td><td>${money(r.amount)}</td><td>${esc(r.wo_no || "N/A")}</td><td>${esc(r.po_no)}</td><td>${esc(r.jobsite || "N/A")}</td><td>${esc(r.equipment || "N/A")}</td><td>${esc(r.parts_description || "N/A")}</td><td>${badge(r.match)}</td><td>${badge(r.payment)}</td></tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No matched payables ready for check run.</td></tr>`}</tbody></table></div>`;
}

function checkRunHistoryTable(rows) {
  const heads = ["Check Run", "Date", "Payment Account", "Check #", "Vendor", "Invoice #", "Amount", "Work Order #", "PO #", "Jobsite", "Equipment", "Description of Parts", "Status", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((r) => `<tr><td>${esc(r.check_run_no)}</td><td>${esc(r.payment_date)}</td><td>${esc(r.payment_account)}</td><td>${esc(r.check_no || "")}</td><td>${esc(r.vendor)}</td><td>${esc(r.invoice_no || "")}</td><td>${money(r.amount)}</td><td>${esc(r.wo_no || "N/A")}</td><td>${esc(r.po_no || r.reference || "")}</td><td>${esc(r.jobsite || "N/A")}</td><td>${esc(r.equipment || "N/A")}</td><td>${esc(r.parts_description || "N/A")}</td><td>${badge(r.status)}</td><td><div class="rowactions"><button class="rowbtn" data-check-print="${esc(r.check_run_no)}">Print</button>${/draft/i.test(r.status || "") ? `<button class="rowbtn" data-check-post="${esc(r.check_run_no)}">Post</button>` : ""}${!/void/i.test(r.status || "") ? `<button class="rowbtn danger" data-check-void="${esc(r.check_run_no)}">Void</button>` : ""}</div></td></tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No check runs yet.</td></tr>`}</tbody></table></div>`;
}

function bindCheckRunRows() {
  document.querySelectorAll("[data-check-print]").forEach((btn) => btn.onclick = () => printCheckRun(btn.dataset.checkPrint));
  document.querySelectorAll("[data-check-post]").forEach((btn) => btn.onclick = () => postCheckRun(btn.dataset.checkPost));
  document.querySelectorAll("[data-check-void]").forEach((btn) => btn.onclick = () => voidCheckRun(btn.dataset.checkVoid));
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
      ${productSelect("Payment mode", "payment_mode", ["Check", "ACH", "Wire", "Cash", "Credit Card", "Intercompany"], "Check")}
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
      const isIntercompany = /intercompany/i.test(text);
      return isCash || isCreditCardPayable || isIntercompany;
    });
  return [...new Set([...(names.length ? names : []), "FHB Checking", "Credit Card Payable - LMS Impo", "Intercompany - LMS Main"])];
}

async function saveCheckRunModal(data, payables) {
  const record = collectProductModalFields();
  if (!String(record.check_no || "").trim() || String(record.check_no || "").trim() === "0") {
    alert("Check # is required. Enter the actual check number before saving the check run.");
    return;
  }
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
    const groups = groupPayablesByVendor(selected);
    for (const [index, group] of groups.entries()) {
      const checkNo = sequentialCheckNo(record.check_no, index);
      const refs = group.rows.map((row) => row.po_no).filter(Boolean);
      const invoiceNos = group.rows.map((row) => row.invoice_no).filter(Boolean);
      const detailNotes = checkRunNotesPayload(record.notes, group.rows);
      const support = summarizeCheckSupport(group.rows);
      await upsertOne("check_runs", {
        check_run_no: index ? `${record.check_run_no}-${index + 1}` : record.check_run_no,
        payment_date: record.payment_date,
        payment_mode: record.payment_mode || paymentModeForAccount(record.payment_account),
        payment_account: record.payment_account,
        bank_account: record.payment_account,
        check_no: checkNo,
        vendor: group.vendor,
        reference: refs.join(", "),
        invoice_no: invoiceNos.join(", "),
        invoice_date: group.rows[0]?.invoice_date || null,
        due_date: group.rows.map((row) => row.due_date).filter(Boolean).sort()[0] || null,
        wo_no: support.wo_no,
        po_no: support.po_no,
        jobsite: support.jobsite,
        equipment: support.equipment,
        parts_description: support.parts_description,
        amount: group.amount,
        status: "Posted",
        notes: detailNotes,
      }, "check_run_no");
      for (const row of group.rows) {
        await supabase.from("purchase_orders").update({ payment_status: "Paid", status: "Paid" }).eq("po_no", row.po_no);
      }
      await postCheckRunLedger({
        ...record,
        check_run_no: index ? `${record.check_run_no}-${index + 1}` : record.check_run_no,
        check_no: checkNo,
        vendor: group.vendor,
        reference: refs.join(", "),
        invoice_no: invoiceNos.join(", "),
        invoice_date: group.rows[0]?.invoice_date || null,
        due_date: group.rows.map((row) => row.due_date).filter(Boolean).sort()[0] || null,
        amount: group.amount,
        status: "Posted",
      });
    }
    await incrementSequence("check");
    closeModal();
    renderCheckRunView();
  } catch (error) {
    alert(error.message || error);
  }
}

function groupPayablesByVendor(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const vendor = row.vendor || "Unknown Vendor";
    if (!map.has(vendor)) map.set(vendor, { vendor, rows: [], amount: 0 });
    const group = map.get(vendor);
    group.rows.push(row);
    group.amount += Number(row.amount || 0);
  });
  return [...map.values()];
}

function summarizeCheckSupport(rows) {
  return {
    wo_no: combineSupportField(rows, "wo_no"),
    po_no: combineSupportField(rows, "po_no"),
    jobsite: combineSupportField(rows, "jobsite"),
    equipment: combineSupportField(rows, "equipment"),
    parts_description: combineSupportField(rows, "parts_description"),
  };
}

function combineSupportField(rows, key) {
  return uniqueTextList((rows || []).map((row) => row[key])).join("; ");
}

function runSupportRow(record, support, amount, poNo, ap = {}) {
  return {
    vendor: record.vendor || "",
    po_no: record.po_no || support.po_no || poNo || "",
    invoice_no: record.invoice_no || ap.invoice_no || "",
    invoice_date: record.invoice_date || ap.invoice_date || "",
    due_date: record.due_date || ap.due_date || "",
    amount: Number(record.amount || amount || 0),
    wo_no: record.wo_no || support.wo_no || "N/A",
    jobsite: record.jobsite || support.jobsite || "N/A",
    equipment: record.equipment || support.equipment || "N/A",
    parts_description: record.parts_description || support.parts_description || "N/A",
  };
}

function checkRunNotesPayload(userNotes, rows) {
  const payload = {
    userNotes: userNotes || "",
    invoices: rows.map((row) => ({
      vendor: row.vendor || "",
      reference: row.po_no || "",
      invoice_no: row.invoice_no || "",
      invoice_date: row.invoice_date || "",
      due_date: row.due_date || "",
      amount: Number(row.amount || 0),
      wo_no: row.wo_no || "N/A",
      po_no: row.po_no || row.reference || "",
      jobsite: row.jobsite || "N/A",
      equipment: row.equipment || "N/A",
      parts_description: row.parts_description || "N/A",
      source: row.source || "Purchase Order",
    })),
  };
  return `CHECK_RUN_DETAIL:${JSON.stringify(payload)}`;
}

function parseCheckRunNotes(notes) {
  const text = String(notes || "");
  if (!text.startsWith("CHECK_RUN_DETAIL:")) return { userNotes: text, invoices: [] };
  try {
    return JSON.parse(text.replace("CHECK_RUN_DETAIL:", ""));
  } catch {
    return { userNotes: text, invoices: [] };
  }
}

function sequentialCheckNo(start, index) {
  const n = Number(start);
  return Number.isFinite(n) && start !== "" ? String(n + index) : start || "";
}

function paymentModeForAccount(account) {
  if (/intercompany/i.test(account || "")) return "Intercompany";
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
  for (const ref of splitCheckRunReferences(run.reference)) {
    await supabase.from("purchase_orders").update({ payment_status: "Paid", status: "Paid" }).eq("po_no", ref);
  }
  renderCheckRunView();
}

function splitCheckRunReferences(reference) {
  return String(reference || "").split(",").map((ref) => ref.trim()).filter(Boolean);
}

async function postCheckRunLedger(run) {
  const amount = Number(run.amount || 0);
  if (!amount) return;
  await upsertOneWithOptionalColumns("bank_transactions", {
    tx_date: run.payment_date,
    bank_account: run.bank_account || run.payment_account || "FHB Checking",
    description: `Check run ${run.check_run_no || run.reference}`,
    reference: run.check_run_no || run.reference,
    amount: -Math.abs(amount),
    status: "Matched",
    matched_reference: run.reference,
    notes: `Account: ${run.bank_account || run.payment_account || "FHB Checking"}`,
  }, "id", ["bank_account"], "Payment posted. Run the bank account SQL update when you want the bank account stored in a separate bank transaction column.");
  await supabase.from("general_ledger").delete().eq("reference", run.check_run_no || run.reference).eq("source", "Check Run");
  await upsertMany("general_ledger", [
    { entry_date: run.payment_date, posting_date: run.payment_date, account: "Accounts Payable (A/P)", vendor: run.vendor, invoice_no: run.invoice_no || null, invoice_date: run.invoice_date || null, due_date: run.due_date || null, description: `Payment to ${run.vendor}`, reference: run.check_run_no || run.reference, debit: amount, credit: 0, source: "Check Run", status: run.status || "Posted" },
    { entry_date: run.payment_date, posting_date: run.payment_date, account: run.payment_account || "FHB Checking", vendor: run.vendor, invoice_no: run.invoice_no || null, invoice_date: run.invoice_date || null, due_date: run.due_date || null, description: `Check run ${run.check_no || run.check_run_no || ""}`, reference: run.check_run_no || run.reference, debit: 0, credit: amount, source: "Check Run", status: run.status || "Posted" },
  ], "id");
}

async function voidCheckRun(checkRunNo) {
  const rows = await getAll("check_runs");
  const run = rows.find((r) => r.check_run_no === checkRunNo);
  if (!run) return alert("Check run was not found.");
  if (/void/i.test(run.status || "")) return alert("This check run is already voided.");
  if (isLockedAccountingDate(today())) {
    alert("Today is inside the closed accounting period. Reopen the period or change the closing date before voiding this check.");
    return;
  }
  const reason = prompt(`Void check ${run.check_no || run.check_run_no}?\n\nReason for void:`) || "";
  if (!reason.trim()) return alert("Void reason is required.");
  if (!confirm(`Void check ${run.check_no || run.check_run_no} for ${run.vendor}?\n\nThe payable documents will return to the check run list.`)) return;
  const voidRef = `${run.check_run_no}-VOID`;
  const amount = Number(run.amount || 0);
  try {
    await supabase.from("general_ledger").delete().eq("reference", voidRef).eq("source", "Check Run Void");
    await upsertMany("general_ledger", [
      { entry_date: today(), posting_date: today(), account: run.payment_account || run.bank_account || "FHB Checking", vendor: run.vendor, invoice_no: run.invoice_no || null, invoice_date: run.invoice_date || null, due_date: run.due_date || null, description: `Void check ${run.check_no || run.check_run_no}`, reference: voidRef, debit: amount, credit: 0, source: "Check Run Void", status: "Posted" },
      { entry_date: today(), posting_date: today(), account: "Accounts Payable (A/P)", vendor: run.vendor, invoice_no: run.invoice_no || null, invoice_date: run.invoice_date || null, due_date: run.due_date || null, description: `Restore payable from voided check ${run.check_no || run.check_run_no}`, reference: voidRef, debit: 0, credit: amount, source: "Check Run Void", status: "Posted" },
    ], "id");
    await upsertOneWithOptionalColumns("bank_transactions", {
      tx_date: today(),
      bank_account: run.bank_account || run.payment_account || "FHB Checking",
      description: `Void check ${run.check_no || run.check_run_no}`,
      reference: voidRef,
      amount: Math.abs(amount),
      status: "Matched",
      matched_reference: run.reference,
      notes: `Void reason: ${reason.trim()}`,
    }, "id", ["bank_account"], "Void posted. Run the bank account SQL update when you want the bank account stored in a separate bank transaction column.");
    const notes = `${run.notes || ""}\n[VOID ${new Date().toLocaleString()}] ${reason.trim()}`.trim();
    await supabase.from("check_runs").update({ status: "Void", notes }).eq("check_run_no", checkRunNo);
    for (const ref of splitCheckRunReferences(run.reference)) {
      await supabase.from("purchase_orders").update({ payment_status: "Ready to Pay", status: "Matched" }).eq("po_no", ref);
    }
    alert("Check was voided. The related payable documents are back in Payables Ready for Check Run.");
    renderCheckRunView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function printCheckRun(checkRunNo) {
  const row = currentRows.find((r) => r.check_run_no === checkRunNo) || {};
  const vendors = await getAll("vendors").catch(() => []);
  const vendor = vendors.find((v) => String(v.name || "").trim().toLowerCase() === String(row.vendor || "").trim().toLowerCase());
  const detail = parseCheckRunNotes(row.notes);
  const invoices = detail.invoices.length ? detail.invoices : [{
    reference: row.reference || "",
    invoice_no: row.invoice_no || "",
    invoice_date: row.invoice_date || "",
    due_date: row.due_date || "",
    amount: Number(row.amount || 0),
    wo_no: row.wo_no || "N/A",
    po_no: row.po_no || row.reference || "",
    jobsite: row.jobsite || "N/A",
    equipment: row.equipment || "N/A",
    parts_description: row.parts_description || "N/A",
  }];
  const amount = Number(row.amount || 0);
  const html = checkPrintHtml(row, vendor, invoices, amount, detail.userNotes);
  const win = window.open("", "_blank");
  if (!win) return alert("Allow popups to print checks.");
  win.document.write(html);
  win.document.close();
}

function checkPrintHtml(row, vendor, invoices, amount, userNotes = "") {
  const dateText = formatShortDate(row.payment_date || today());
  const rawCheckNo = row.check_no || row.check_run_no || "";
  const checkNo = printableCheckNo(rawCheckNo);
  const vendorCode = vendor?.reference || vendor?.vendor_no || "";
  const payeeName = row.vendor || vendor?.name || "";
  const payeeAddress = [vendor?.address, vendor?.phone ? `Phone: ${vendor.phone}` : ""].filter(Boolean).join("<br>");
  const invoicesText = invoices.map((inv) => inv.invoice_no || inv.reference).filter(Boolean).join(", ");
  const invoiceRows = invoices.map((inv) => `<tr>
    <td>${esc(inv.invoice_no || inv.reference || "")}</td>
    <td>${esc(formatShortDate(inv.invoice_date || ""))}</td>
    <td>${money(inv.amount || 0)}</td>
    <td>${esc(inv.wo_no || "N/A")}</td>
    <td>${esc(inv.po_no || inv.reference || "")}</td>
    <td>${esc(inv.jobsite || "N/A")}</td>
    <td>${esc(inv.equipment || "N/A")}</td>
  </tr>`).join("");
  const supportRows = invoices.map((inv) => `<tr>
    <td>${esc(inv.invoice_no || inv.reference || "")}</td>
    <td>${esc(formatShortDate(inv.invoice_date || ""))}</td>
    <td>${money(inv.amount || 0)}</td>
    <td>${esc(inv.wo_no || "N/A")}</td>
    <td>${esc(inv.po_no || inv.reference || "")}</td>
    <td>${esc(inv.jobsite || "N/A")}</td>
    <td>${esc(inv.equipment || "N/A")}</td>
    <td>${esc(shortPartsDescription(inv.parts_description || ""))}</td>
  </tr>`).join("");
  return `<html><head><title>Check ${esc(checkNo)}</title><style>
    @page{size:Letter portrait;margin:0}
    *{box-sizing:border-box}
    body{margin:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:11px}
    .page{width:8.5in;height:11in;padding:.2in .38in .15in .38in;position:relative}
    .voucher-top{height:7.02in;position:relative;overflow:hidden;border-bottom:1px dashed #999;padding-bottom:.12in}
    .voucher-title{display:grid;grid-template-columns:1fr 2.25in;gap:.2in;align-items:start;margin-bottom:.18in}
    .company{font-weight:700;font-size:14px;letter-spacing:.02em}
    .voucher-name{font-size:18px;font-weight:700;margin-top:.04in}
    .voucher-box{border:1px solid #111;padding:.08in .1in;line-height:1.35;min-height:.58in}
    .voucher-meta{display:grid;grid-template-columns:1.15in 1.15in 1.3in 1.05in 1fr;gap:.08in;align-items:start;font-size:11px;margin-bottom:.14in}
    .voucher-meta div{border:1px solid #aaa;min-height:.38in;padding:.05in .07in}
    .voucher-meta strong{display:block;font-size:9px;text-transform:uppercase;color:#333}
    .voucher-table{width:100%;border-collapse:collapse;table-layout:fixed}
    .voucher-table th{font-size:9px;text-align:left;border-bottom:1px solid #222;border-top:1px solid #222;padding:5px 5px;text-transform:uppercase}
    .voucher-table td{padding:5px;border-bottom:1px solid #d8d8d8;vertical-align:top;height:.28in}
    .voucher-table th:nth-child(3),.voucher-table td:nth-child(3){text-align:right}
    .voucher-table th:nth-child(1){width:.9in}.voucher-table th:nth-child(2){width:.9in}.voucher-table th:nth-child(3){width:.85in}.voucher-table th:nth-child(4){width:1in}.voucher-table th:nth-child(5){width:.95in}.voucher-table th:nth-child(6){width:1.35in}
    .voucher-total{display:grid;grid-template-columns:1fr 1.1in 1.05in;margin-top:.12in;font-weight:700;font-size:12px;align-items:end}
    .voucher-total div{text-align:right;border-top:1px solid #222;padding-top:5px}
    .notes{margin-top:.12in;font-size:10px;color:#333;line-height:1.35}
    .check-body{position:absolute;left:.38in;right:.38in;top:7.38in;height:3.35in}
    .check-no-repeat{position:absolute;right:.05in;top:.04in;font-weight:700;font-size:13px}
    .check-date{position:absolute;right:1.55in;top:.28in;font-size:13px}
    .check-amount{position:absolute;right:.08in;top:.28in;font-size:13px;font-weight:700}
    .pay-label{position:absolute;left:.08in;top:.72in;font-size:9px;text-transform:uppercase}
    .payee-name{position:absolute;left:1.18in;right:.3in;top:.66in;border-bottom:1px solid #111;padding-bottom:4px;font-size:13px;font-weight:700;text-transform:uppercase}
    .words{position:absolute;left:.08in;right:.25in;top:1.12in;border-bottom:1px solid #111;padding-bottom:4px;font-size:12px;text-transform:uppercase}
    .address{position:absolute;left:1.18in;top:1.58in;font-size:11px;line-height:1.35;max-width:4.5in}
    .memo{position:absolute;left:.08in;bottom:.35in;font-size:10px;color:#333;max-width:4.6in}
    .signature{position:absolute;right:.15in;bottom:.35in;width:2.55in;border-top:1px solid #111;text-align:center;padding-top:4px;font-size:9px;text-transform:uppercase}
    .check-cut{position:absolute;left:0;right:0;top:7.25in;border-top:1px dashed #999}
    .support-page{page-break-before:always;break-before:page}
    .support-title{display:flex;justify-content:space-between;gap:.25in;align-items:flex-start;margin-bottom:.18in}
    .support-title h1{font-size:18px;margin:.02in 0 .04in 0}
    .support-title p{margin:0;color:#333;line-height:1.35}
    .support-table{width:100%;border-collapse:collapse;table-layout:fixed}
    .support-table th{font-size:9px;text-align:left;background:#f0f3f5;border:1px solid #c9d1d8;padding:6px;text-transform:uppercase}
    .support-table td{border:1px solid #d7dde3;padding:6px;vertical-align:top;line-height:1.3}
    .support-table th:nth-child(3),.support-table td:nth-child(3){text-align:right}
    .support-table th:nth-child(1){width:.85in}.support-table th:nth-child(2){width:.8in}.support-table th:nth-child(3){width:.85in}.support-table th:nth-child(4){width:.8in}.support-table th:nth-child(5){width:.9in}.support-table th:nth-child(6){width:1.2in}.support-table th:nth-child(7){width:1.4in}
    @media print{body{background:#fff}.page{box-shadow:none}}
  </style></head><body><div class="page">
    <section class="voucher-top">
      <div class="voucher-title">
        <div><div class="company">LMS IMPORTS</div><div class="voucher-name">Check Voucher</div></div>
        <div class="voucher-box"><strong>Payee</strong><br>${esc(payeeName)}${payeeAddress ? `<br>${payeeAddress}` : ""}</div>
      </div>
      <div class="voucher-meta">
        <div><strong>Date</strong>${esc(dateText)}</div>
        <div><strong>Check #</strong>${esc(checkNo)}</div>
        <div><strong>Vendor Code</strong>${esc(vendorCode)}</div>
        <div><strong>Bank</strong>${esc(row.payment_account || row.bank_account || "")}</div>
        <div><strong>Voucher / Batch</strong>${esc(row.check_run_no || "")}</div>
      </div>
      <table class="voucher-table">
        <thead><tr><th>Invoice #</th><th>Invoice Date</th><th>Amount</th><th>Work Order #</th><th>PO #</th><th>Jobsite</th><th>Equipment</th></tr></thead>
        <tbody>${invoiceRows}</tbody>
      </table>
      <div class="voucher-total"><span></span><span>Check Total</span><div>${money(amount)}</div></div>
      ${userNotes ? `<div class="notes">${esc(userNotes)}</div>` : ""}
    </section>
    <div class="check-cut"></div>
    <section class="check-body">
      <div class="check-no-repeat">${esc(checkNo)}</div>
      <div class="check-date">${esc(dateText)}</div>
      <div class="check-amount">${money(amount)}</div>
      <div class="pay-label">Pay to the order of</div>
      <div class="payee-name">${esc(payeeName)}</div>
      <div class="words">Exactly ${esc(amountInWords(amount))}</div>
      <div class="address">${payeeAddress}</div>
      <div class="memo">Memo: ${esc(invoicesText ? `Invoices ${invoicesText}` : row.check_run_no || "")}</div>
      <div class="signature">Authorized Signature</div>
    </section>
  </div><div class="page support-page">
    <div class="support-title">
      <div>
        <div class="company">LMS IMPORTS</div>
        <h1>Check Voucher Support</h1>
        <p>Invoice and parts detail for ${esc(row.check_run_no || checkNo || "check payment")}.</p>
      </div>
      <div class="voucher-box"><strong>Payee</strong><br>${esc(payeeName)}${payeeAddress ? `<br>${payeeAddress}` : ""}<br><strong>Check Total</strong> ${money(amount)}</div>
    </div>
    <table class="support-table">
      <thead><tr><th>Invoice #</th><th>Invoice Date</th><th>Amount</th><th>WO #</th><th>PO #</th><th>Jobsite</th><th>Equipment</th><th>Parts / Description</th></tr></thead>
      <tbody>${supportRows}</tbody>
    </table>
  </div><script>window.onload=()=>setTimeout(()=>print(),150)</script></body></html>`;
}

function printableCheckNo(value) {
  const text = String(value ?? "").trim();
  return text;
}

function shortPartsDescription(value) {
  const text = String(value || "").trim();
  if (!text) return "N/A";
  const cleaned = text
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bSKU[-\s:]*[A-Z0-9-]+\b/gi, " ")
    .replace(/\b[A-Z0-9]{6,}[-A-Z0-9]*\b/g, " ")
    .replace(/\b\d+\s*(each|ea|pcs|pc|box|set|unit|units)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const pieces = cleaned.split(/;|,|\n|\|/).map((p) => p.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  const unique = [...new Set(pieces.map((p) => p.length > 80 ? `${p.slice(0, 77)}...` : p))];
  return unique.slice(0, 6).join("; ") || text.slice(0, 120);
}

function formatShortDate(dateText) {
  if (!dateText) return "";
  const d = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateText;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

function amountInWords(amount) {
  const dollars = Math.floor(Number(amount || 0));
  const cents = Math.round((Number(amount || 0) - dollars) * 100);
  return `${numberToWords(dollars)} dollars & ${String(cents).padStart(2, "0")} cents`;
}

function numberToWords(n) {
  n = Math.max(0, Math.floor(Number(n || 0)));
  const ones = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  if (n < 20) return ones[n];
  if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
  if (n < 1000) return `${ones[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberToWords(n % 100)}` : ""}`;
  if (n < 1000000) return `${numberToWords(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${numberToWords(n % 1000)}` : ""}`;
  return `${numberToWords(Math.floor(n / 1000000))} million${n % 1000000 ? ` ${numberToWords(n % 1000000)}` : ""}`;
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
  const normalizedGl = gl.map(normalizeGlRow);
  const statement = buildBankStatement(normalizedGl, bankRows, selectedBank, periodFrom, periodTo, beg);
  const matchRows = buildBankMatchRows(normalizedGl, bankRows, selectedBank, periodFrom, periodTo);
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
        <button id="bankTemplateBtn">Bank upload template</button>
        <button id="bankUploadBtn">Upload bank transactions</button>
        <button id="bankAutoMatchBtn">Auto-match exact</button>
        <button id="bankCsvBtn">Excel</button>
        <button onclick="window.print()">PDF / Print</button>
      </div>
      <div id="bankRecHost">${bankStatementHtml(statement, selectedBank, periodFrom, periodTo, accountKind)}</div>
      ${bankMatchWorkbenchHtml(matchRows)}
    </section>`;
  $("bankRecBank").onchange = (e) => { localStorage.setItem("lms.bankRecBank", e.target.value); renderBankReconciliationView(); };
  $("bankRecFrom").onchange = (e) => { localStorage.setItem("lms.bankRecFrom", e.target.value); renderBankReconciliationView(); };
  $("bankRecTo").onchange = (e) => { localStorage.setItem("lms.bankRecTo", e.target.value); renderBankReconciliationView(); };
  $("bankBegBtn").onclick = () => openBankBeginningModal(selectedBank);
  $("bankItemBtn").onclick = () => openBankTransactionModal(selectedBank);
  $("bankTemplateBtn").onclick = downloadBankTransactionsTemplate;
  $("bankUploadBtn").onclick = () => uploadBankTransactionsFile(selectedBank);
  $("bankAutoMatchBtn").onclick = () => autoMatchExactBankTransactions(selectedBank, periodFrom, periodTo);
  $("bankCsvBtn").onclick = () => exportBankStatementCsv(statement, selectedBank, periodFrom, periodTo);
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  bindBankMatchRows();
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

function buildBankMatchRows(gl = [], bankRows = [], bank = "", from = "", to = "") {
  const inPeriod = (date) => String(date || "") >= from && String(date || "") <= to;
  const bookRows = gl
    .filter((r) => String(r.account || "").toLowerCase() === String(bank || "").toLowerCase() && inPeriod(r.posting_date))
    .map((r) => ({
      date: r.posting_date,
      reference: r.reference || "",
      description: r.description || r.vendor || r.customer || "",
      amount: Number(r.debit || 0) - Number(r.credit || 0),
    }));
  return bankRows
    .filter((row) => inPeriod(row.tx_date) && bankTransactionBank(row, bank))
    .sort((a, b) => String(b.tx_date || "").localeCompare(String(a.tx_date || "")))
    .map((row) => {
      const amount = Number(row.amount || 0);
      const ref = String(row.reference || "").trim().toLowerCase();
      const exact = bookRows.find((book) => ref && String(book.reference || "").trim().toLowerCase() === ref && sameMoney(book.amount, amount));
      const sameDateAmount = exact || bookRows.find((book) => book.date === row.tx_date && sameMoney(book.amount, amount));
      const suggestion = exact || sameDateAmount || null;
      return {
        ...row,
        _suggestion: suggestion,
        _confidence: exact ? "Exact" : sameDateAmount ? "Same date / amount" : "",
      };
    });
}

function bankMatchWorkbenchHtml(rows = []) {
  const unmatched = rows.filter((row) => !/matched|cleared|ignored/i.test(row.status || ""));
  const exact = unmatched.filter((row) => row._confidence === "Exact");
  const heads = ["Date", "Reference", "Description", "Bank Amount", "Status", "Suggested Book Match", "Action"];
  return `<div class="bank-match-workbench no-print">
    <div class="panel-head">
      <div class="panel-title"><strong>Matching Workbench</strong><span>${rows.length} bank rows, ${unmatched.length} unmatched, ${exact.length} exact match${exact.length === 1 ? "" : "es"} ready.</span></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>
          <tr>${heads.map((h, i) => i === heads.length - 1 ? "<th></th>" : `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr>
        </thead>
        <tbody>${rows.length ? rows.map(bankMatchRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No uploaded bank rows for this account and period.</td></tr>`}</tbody>
      </table>
    </div>
  </div>`;
}

function bankMatchRowHtml(row) {
  const suggestion = row._suggestion;
  const suggestedText = suggestion
    ? `${suggestion.reference || "No ref"} | ${formatDisplayDate(suggestion.date)} | ${money(suggestion.amount)} | ${suggestion.description || ""}`
    : "No book match found";
  const isMatched = /matched|cleared/i.test(row.status || "");
  const isIgnored = /ignored/i.test(row.status || "");
  const id = esc(row.id || "");
  return `<tr>
    <td>${formatDisplayDate(row.tx_date)}</td>
    <td>${esc(row.reference || "")}</td>
    <td>${esc(row.description || "")}</td>
    <td>${money(row.amount)}</td>
    <td>${badge(row.status || "Unmatched")}</td>
    <td>${esc(suggestedText)}${row._confidence ? ` <span class="badge good">${esc(row._confidence)}</span>` : ""}</td>
    <td><div class="rowactions">${suggestion && !isMatched ? `<button class="rowbtn" data-bank-match="${id}" data-bank-ref="${esc(suggestion.reference || "")}">Match</button>` : ""}${isMatched || isIgnored ? `<button class="rowbtn" data-bank-unmatch="${id}">Unmatch</button>` : `<button class="rowbtn" data-bank-ignore="${id}">Ignore</button>`}</div></td>
  </tr>`;
}

function bindBankMatchRows() {
  document.querySelectorAll("[data-bank-match]").forEach((button) => {
    button.onclick = () => updateBankMatchStatus(button.dataset.bankMatch, "Matched", button.dataset.bankRef || "");
  });
  document.querySelectorAll("[data-bank-unmatch]").forEach((button) => {
    button.onclick = () => updateBankMatchStatus(button.dataset.bankUnmatch, "Unmatched", "");
  });
  document.querySelectorAll("[data-bank-ignore]").forEach((button) => {
    button.onclick = () => updateBankMatchStatus(button.dataset.bankIgnore, "Ignored", "");
  });
}

async function updateBankMatchStatus(id, status, matchedReference = "") {
  if (!id) return;
  try {
    await supabase.from("bank_transactions").update({ status, matched_reference: matchedReference || null }).eq("id", id);
    renderBankReconciliationView();
  } catch (error) {
    alert(`Could not update bank match.\n\n${error.message || error}`);
  }
}

async function autoMatchExactBankTransactions(bank, from, to) {
  const [gl, bankRows] = await Promise.all([getAll("general_ledger"), getAll("bank_transactions")]);
  const rows = buildBankMatchRows(gl.map(normalizeGlRow), bankRows, bank, from, to)
    .filter((row) => row.id && row._confidence === "Exact" && !/matched|cleared|ignored/i.test(row.status || ""));
  if (!rows.length) {
    alert("No exact bank matches were found for this account and period.");
    return;
  }
  if (!confirm(`Match ${rows.length} exact bank transaction${rows.length === 1 ? "" : "s"} now?`)) return;
  try {
    await Promise.all(rows.map((row) => supabase.from("bank_transactions").update({ status: "Matched", matched_reference: row._suggestion?.reference || row.reference || null }).eq("id", row.id)));
    alert(`${rows.length} bank transaction${rows.length === 1 ? "" : "s"} matched.`);
    renderBankReconciliationView();
  } catch (error) {
    alert(`Could not auto-match bank transactions.\n\n${error.message || error}`);
  }
}

function sameMoney(a, b) {
  return Math.abs(Number(a || 0) - Number(b || 0)) < 0.005;
}

function bankPayeeName(row) {
  const text = row.description || row.notes || "";
  return text.replace(/^Check run\s*/i, "").trim() || row.matched_reference || "";
}

function downloadBankTransactionsTemplate() {
  downloadCsv([
    ["Date", "Bank Account", "Description", "Reference", "Amount", "Status", "Matched Reference", "Notes"],
    [today(), "FHB Checking", "Example deposit or check", "BANK-1001", "100.00", "Unmatched", "", ""],
  ], "LMS_Bank_Transactions_Upload_Template.csv");
}

function uploadBankTransactionsFile(defaultBank = "") {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.xlsx,.xls";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const rows = (await readBankTransactionRows(file, defaultBank)).filter((row) => row.tx_date && row.bank_account && Number.isFinite(Number(row.amount)));
      if (!rows.length) {
        alert("No valid bank transaction rows were found. Date, Bank Account, and Amount are required.");
        return;
      }
      const existing = await getAll("bank_transactions");
      const existingKeys = new Set(existing.map(bankTransactionUploadKey));
      const uniqueRows = rows.filter((row) => !existingKeys.has(bankTransactionUploadKey(row)));
      if (!uniqueRows.length) {
        alert(`No new bank transaction rows were uploaded.\n\n${rows.length} row${rows.length === 1 ? "" : "s"} matched transactions already in the system.`);
        return;
      }
      await supabase.from("bank_transactions").insert(uniqueRows);
      const skipped = rows.length - uniqueRows.length;
      alert(`${uniqueRows.length} bank transaction row${uniqueRows.length === 1 ? "" : "s"} uploaded.${skipped ? `\n${skipped} duplicate row${skipped === 1 ? "" : "s"} skipped.` : ""}`);
      renderBankReconciliationView();
    } catch (error) {
      alert(`Could not upload bank transactions.\n\n${error.message || error}`);
    }
  };
  input.click();
}

function bankTransactionUploadKey(row) {
  return [row.tx_date || "", row.bank_account || "", row.reference || "", Number(row.amount || 0).toFixed(2), row.description || ""]
    .map((part) => String(part).trim().toLowerCase())
    .join("|");
}

async function readBankTransactionRows(file, defaultBank = "") {
  const ext = file.name.toLowerCase().split(".").pop();
  let rows = [];
  if (["xlsx", "xls"].includes(ext)) {
    const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = sheetToRowsWithDetectedHeader(XLSX, sheet, ["date", "transaction date", "posted date", "amount", "description", "payee", "reference", "check #"]);
  } else {
    rows = rowsFromAnyDetectedHeader(parseCsvMatrix(await file.text()), ["date", "transaction date", "posted date", "amount", "description", "payee", "reference", "check #"]);
  }
  const batch = `BANK-UPLOAD-${Date.now()}`;
  return rows.map((row) => normalizeBankTransactionUploadRow(row, defaultBank, batch));
}

function normalizeBankTransactionUploadRow(row, defaultBank, batch) {
  const get = (...keys) => {
    for (const key of keys) {
      const exact = Object.keys(row).find((name) => normalizeHeaderKey(name) === normalizeHeaderKey(key));
      if (exact && row[exact] !== undefined && row[exact] !== null && String(row[exact]).trim() !== "") return String(row[exact]).trim();
    }
    return "";
  };
  return {
    tx_date: normalizeUploadDate(get("Date", "Transaction Date", "Posted Date", "Tx Date")),
    bank_account: get("Bank Account", "Account", "Bank") || defaultBank || "FHB Checking",
    description: get("Description", "Payee", "Vendor", "Memo"),
    reference: get("Reference", "Ref", "Check #", "Num", "Transaction #"),
    amount: parseMoneyAmount(get("Amount", "Debit/Credit", "Transaction Amount")),
    status: get("Status") || "Unmatched",
    matched_reference: get("Matched Reference", "Matched Ref", "Match"),
    notes: get("Notes", "Memo"),
    upload_batch: batch,
  };
}

function normalizeUploadDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }
  return text;
}

function parseMoneyAmount(value) {
  const text = String(value || "").trim();
  const negative = /^\(.*\)$/.test(text);
  const amount = Number(text.replace(/[$,\s()]/g, ""));
  if (!Number.isFinite(amount)) return 0;
  return negative ? -amount : amount;
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
  await loadAccountingCloseDate();
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
  $("saveCloseDateBtn").onclick = async () => {
    await setAccountingCloseDate($("closePostingDate").value);
    renderSettingsView();
  };
  $("openPeriodBtn").onclick = async () => {
    if (!confirm("Open prior accounting periods? This allows older transactions to be changed again.")) return;
    await setAccountingCloseDate("");
    renderSettingsView();
  };
}

function getAccountingCloseDate() {
  return accountingCloseDateCache || localStorage.getItem("lms.accountingCloseDate") || "";
}

async function loadAccountingCloseDate() {
  if (!session) return getAccountingCloseDate();
  const { data, error } = await supabase
    .from("accounting_periods")
    .select("closed_through_date,status")
    .eq("status", "Closed")
    .order("closed_through_date", { ascending: false })
    .limit(1);
  if (!error && data?.[0]?.closed_through_date) {
    accountingCloseDateCache = data[0].closed_through_date;
    localStorage.setItem("lms.accountingCloseDate", accountingCloseDateCache);
  } else if (!error && data && !data.length) {
    accountingCloseDateCache = "";
    localStorage.setItem("lms.accountingCloseDate", "");
  }
  return getAccountingCloseDate();
}

async function setAccountingCloseDate(value) {
  const closeDate = value || "";
  accountingCloseDateCache = closeDate;
  localStorage.setItem("lms.accountingCloseDate", closeDate);
  if (!session) return;
  if (!closeDate) {
    await supabase.from("accounting_periods").update({ status: "Open", reopened_by: profile?.username || profile?.email || "Admin", reopened_at: new Date().toISOString() }).eq("status", "Closed");
    return;
  }
  const periodName = closeDate.slice(0, 7);
  await supabase.from("accounting_periods").upsert({
    period_name: periodName,
    closed_through_date: closeDate,
    status: "Closed",
    closed_by: profile?.username || profile?.email || "Admin",
    closed_at: new Date().toISOString(),
  }, { onConflict: "period_name" });
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
      <div class="panel-head"><div class="panel-title"><strong>Product Master</strong><span>${currentRows.length} items available. Fast view draws ${Math.min(PRODUCT_RENDER_LIMIT, currentRows.length)} rows at a time; search narrows the full list.</span></div><div class="actions"><button id="productColumnsBtn">Columns</button><button id="productMassMarkupBtn">Mass markup %</button><button id="productTemplateBtn">Download product template</button><button id="productUploadBtn">Upload product list</button><button id="productQtyCostTemplateBtn">Download qty/cost template</button><button id="productQtyCostUploadBtn">Upload qty/cost update</button><button id="productsCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button></div></div>
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
  $("productMassMarkupBtn").onclick = openMassMarkupModal;
  $("productTemplateBtn").onclick = downloadProductImportTemplate;
  $("productUploadBtn").onclick = () => $("productFileImport").click();
  $("productFileImport").onchange = importProductTemplateFile;
  $("productQtyCostTemplateBtn").onclick = downloadProductQtyCostUpdateTemplate;
  $("productQtyCostUploadBtn").onclick = () => $("productQtyCostFileImport").click();
  $("productQtyCostFileImport").onchange = importProductQtyCostUpdateFile;
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
  const rows = filteredProductRows();
  $("productTableHost").innerHTML = productTableHtml(rows);
  bindProductRows();
}

function filteredProductRows() {
  const q = ($("productSearch")?.value || "").toLowerCase();
  const category = $("productCategoryFilter")?.value || "";
  const warehouse = $("productWarehouseFilter")?.value || "";
  const status = $("productStatusFilter")?.value || "";
  return currentRows.filter((p) => {
    const searchOk = !q || [p.sku, p.name, p.source_vendor, p.category, p.warehouse, p.bin_shelf, p.compatible_with].join(" ").toLowerCase().includes(q);
    return searchOk && (!category || p.category === category) && (!warehouse || p.warehouse === warehouse) && (!status || p.status === status);
  });
}

function openMassMarkupModal() {
  const filteredCount = filteredProductRows().length;
  $("modalTitle").textContent = "Mass adjust product markup";
  $("modalSave").onclick = saveMassMarkup;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      <div class="field"><label>Markup %</label><input id="massMarkupPercent" type="number" step="0.01" min="0" placeholder="Example: 35"></div>
      <div class="field"><label>Apply to</label><select id="massMarkupScope"><option value="filtered">Current filtered list (${filteredCount.toLocaleString()} products)</option><option value="all">All products (${currentRows.length.toLocaleString()} products)</option></select></div>
      <div class="field"><label>Round selling price to</label><select id="massMarkupRounding"><option value="2">Nearest cent</option><option value="0">Whole dollar</option><option value="99">End in .99</option></select></div>
      <div class="field"><label>Products with blank cost</label><select id="massMarkupBlankCost"><option value="skip">Skip blank/zero cost</option><option value="mark-only">Save markup only</option></select></div>
    </div>
    <p class="notice">This updates markup % in the Product Master and recalculates selling price from current cost. Use filters first if you only want a category, warehouse, vendor, or search result.</p>`;
  $("modal").style.display = "flex";
}

async function saveMassMarkup() {
  const markup = Number($("massMarkupPercent")?.value || 0);
  if (!(markup >= 0)) {
    alert("Enter a valid markup percent.");
    return;
  }
  const scope = $("massMarkupScope")?.value || "filtered";
  const rounding = $("massMarkupRounding")?.value || "2";
  const blankCostMode = $("massMarkupBlankCost")?.value || "skip";
  const sourceRows = scope === "all" ? currentRows : filteredProductRows();
  const rows = sourceRows.map((product) => {
    const cost = Number(product.cost || 0);
    if (!(cost > 0) && blankCostMode === "skip") return null;
    const sellingPrice = cost > 0 ? roundedMarkupPrice(cost, markup, rounding) : null;
    return {
      sku: product.sku,
      markup_percent: markup,
      ...(sellingPrice == null ? {} : { selling_price: sellingPrice }),
    };
  }).filter(Boolean);
  if (!rows.length) {
    alert("No products were eligible for markup update. Check your filters or blank-cost setting.");
    return;
  }
  if (!confirm(`Update markup for ${rows.length.toLocaleString()} product${rows.length === 1 ? "" : "s"}?`)) return;
  try {
    await upsertManyWithOptionalColumns("products", rows, "sku", ["markup_percent"], "Selling prices were updated, but the database needs the markup_percent column before markup can be stored.");
    closeModal();
    await renderProductsView();
    alert(`Markup updated for ${rows.length.toLocaleString()} product${rows.length === 1 ? "" : "s"}.`);
  } catch (error) {
    alert(error.message || error);
  }
}

function roundedMarkupPrice(cost, markup, rounding) {
  const raw = Number(cost || 0) * (1 + Number(markup || 0) / 100);
  if (rounding === "0") return Math.round(raw);
  if (rounding === "99") return Math.max(0.99, Math.ceil(raw) - 0.01);
  return Number(raw.toFixed(2));
}

function productTableHtml(rows) {
  const columns = productVisibleColumns();
  const heads = [...columns.map((col) => col[1]), ""];
  const visibleRows = rows.slice(0, PRODUCT_RENDER_LIMIT);
  const notice = rows.length > PRODUCT_RENDER_LIMIT ? `<div class="notice">Showing first ${PRODUCT_RENDER_LIMIT.toLocaleString()} of ${rows.length.toLocaleString()} matching products. Use search or filters to narrow the list; Excel export still uses all loaded rows.</div>` : "";
  return `${notice}<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${visibleRows.length ? visibleRows.map((p) => productRowHtml(p, columns)).join("") : `<tr><td colspan="${heads.length}" class="empty">No products yet.</td></tr>`}</tbody></table></div>`;
}

function productRowHtml(p, columns = productVisibleColumns()) {
  return `<tr>
    ${columns.map(([key]) => `<td>${productCellHtml(p, key)}</td>`).join("")}
    <td><div class="rowactions"><button class="rowbtn" data-product-edit="${esc(p.sku)}">Edit</button><button class="rowbtn danger" data-product-delete="${esc(p.sku)}">Delete</button></div></td>
  </tr>`;
}

function productCellHtml(p, key) {
  if (key === "photo") return p.photo_url ? `<button class="thumb-btn" type="button" data-product-photo="${esc(p.photo_url)}" data-product-photo-title="${esc(p.sku || p.name || "Product photo")}"><img class="thumb" src="${esc(p.photo_url)}" alt="Photo"></button>` : `<span class="badge">No photo</span>`;
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
  document.querySelectorAll("[data-product-photo]").forEach((b) => b.onclick = () => openEquipmentRequestPhoto(b.dataset.productPhoto, b.dataset.productPhotoTitle || "Product photo"));
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
  const [movements, products, receipts, salesOrders, salesLines, workOrders, workOrderParts, warehouses] = await Promise.all([
    getAll("stock_movements"),
    getAll("products"),
    getAll("goods_receipts"),
    getAll("sales_orders"),
    getAll("sales_order_lines"),
    getAll("work_orders"),
    getAll("work_order_parts"),
    getAll("warehouses"),
  ]);
  currentRows = buildLinkedStockMovements({ movements, products, receipts, salesOrders, salesLines, workOrders, workOrderParts });
  productMeta.products = products.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
  productMeta.warehouses = warehouses.map((v) => v.name).filter(Boolean).sort();
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
  const heads = ["Date", "Reference #", "Type", "Product", "Vendor", "Sold To", "Sold Date", "Qty", "From Warehouse", "From Bin", "To Warehouse", "To Bin", "Unit FIFO Cost", "Total FIFO Cost", "Document", "Entered By", "Reason"];
  const fields = ["movement_date", "reference_no", "type", "product_name", "vendor", "sold_to", "sold_date", "qty", "from_warehouse", "from_bin_shelf", "to_warehouse", "to_bin_shelf", "unit_fifo_cost", "total_fifo_cost", "document_no", "entered_by", "reason"];
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
    to_warehouse: gr.receipt_warehouse || productById.get(gr.product_id)?.warehouse || "",
    to_bin_shelf: gr.receipt_bin_shelf || productById.get(gr.product_id)?.bin_shelf || "",
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
      from_bin_shelf: p.bin_shelf || "",
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
      from_bin_shelf: p.bin_shelf || "",
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
      <div class="field"><label>From warehouse</label>${suggestInput("stockFromWarehouse", productMeta.warehouses || [], "", "From warehouse").replace(">", ' data-product-field="from_warehouse">')}</div>
      ${productInput("From bin / shelf", "from_bin_shelf", "")}
      <div class="field"><label>To warehouse</label>${suggestInput("stockToWarehouse", productMeta.warehouses || [], "", "To warehouse").replace(">", ' data-product-field="to_warehouse">')}</div>
      ${productInput("To bin / shelf", "to_bin_shelf", "")}
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
    await upsertOneWithOptionalColumns("stock_movements", {
      reference_no: record.reference_no,
      movement_date: record.movement_date || today(),
      type: record.type || "Adjustment",
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      qty,
      from_warehouse: record.from_warehouse,
      from_bin_shelf: record.from_bin_shelf,
      to_warehouse: record.to_warehouse || product.warehouse,
      to_bin_shelf: record.to_bin_shelf || product.bin_shelf,
      unit_fifo_cost: unitCost,
      total_fifo_cost: Math.abs(qty) * unitCost,
      document_no: record.document_no,
      entered_by: profile?.full_name || profile?.username || "Owner",
      reason: record.reason,
    }, "reference_no", ["from_bin_shelf", "to_bin_shelf"], "Stock correction saved. Run the multi-location SQL update so bin/shelf details can be stored.");
    const productQtyChange = /transfer/i.test(record.type || "") ? 0 : qty;
    await supabase.from("products").update({ qty: Number(product.qty || 0) + productQtyChange }).eq("id", product.id);
    if (productQtyChange) await postStockCorrectionLedger(record, product, qty, unitCost);
    closeModal();
    renderStockMovementView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function postStockCorrectionLedger(record, product, qty, unitCost) {
  const total = Math.abs(Number(qty || 0) * Number(unitCost || 0));
  if (!total) return;
  const date = record.movement_date || today();
  const reference = record.reference_no;
  const description = `${record.type || "Stock correction"} ${product.sku} - ${product.name || ""}`;
  await supabase.from("general_ledger").delete().eq("reference", reference).eq("source", "Stock Correction");
  const rows = Number(qty || 0) > 0
    ? [
        { entry_date: date, posting_date: date, account: "Parts Inventory", description, reference, debit: total, credit: 0, source: "Stock Correction", status: "Posted" },
        { entry_date: date, posting_date: date, account: "Inventory Loss - Obsolete Part", description, reference, debit: 0, credit: total, source: "Stock Correction", status: "Posted" },
      ]
    : [
        { entry_date: date, posting_date: date, account: "Inventory Loss - Obsolete Part", description, reference, debit: total, credit: 0, source: "Stock Correction", status: "Posted" },
        { entry_date: date, posting_date: date, account: "Parts Inventory", description, reference, debit: 0, credit: total, source: "Stock Correction", status: "Posted" },
      ];
  await upsertMany("general_ledger", rows, "id");
}

async function renderPurchasingView() {
  currentCfg = tableMap.purchasing;
  $("viewTitle").textContent = "Purchasing";
  $("viewSub").textContent = "Issue POs, receive goods, match invoices, and release payments.";
  const [pos, lines, receipts, vendors, products, workOrders, terms, incoterms, standardNotes, warehouses] = await Promise.all([
    getAll("purchase_orders"),
    getAll("purchase_order_lines"),
    getAll("goods_receipts"),
    getAll("vendors"),
    getAll("products"),
    getAll("work_orders"),
    getAll("master_terms"),
    getAll("incoterms"),
    getAll("standard_po_notes"),
    getAll("warehouses"),
  ]);
  currentRows = pos.sort((a, b) => String(b.po_date || "").localeCompare(String(a.po_date || "")));
  currentRows.forEach((po) => {
    po._lines = lines.filter((line) => line.po_id === po.id);
    po._receipts = receipts.filter((gr) => gr.po_id === po.id || gr.po_no === po.po_no);
  });
  productMeta.vendors = vendors.map((v) => v.name).filter(Boolean).sort();
  productMeta.products = products.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
  productMeta.warehouses = warehouses.map((v) => v.name).filter(Boolean).sort();
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
      <div class="panel-head"><div class="panel-title"><strong>Purchase Orders</strong><span>PO issued, goods receipt, invoice matching, and accounting payment readiness</span></div><div class="actions"><button id="poCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button id="newLandedPoBtn">New landed cost PO</button><button class="primary" id="newPoBtn">New PO</button></div></div>
      <div class="tabs">
        <button class="${purchasingTab === "open" ? "active" : ""}" data-po-tab="open">Open PO ${purchaseRowsForTab(currentRows, "open").length}</button>
        <button class="${purchasingTab === "closed" ? "active" : ""}" data-po-tab="closed">Closed PO ${purchaseRowsForTab(currentRows, "closed").length}</button>
      </div>
      <div id="poTableHost">${purchaseOrderTableHtml(purchaseRowsForTab(currentRows, purchasingTab))}</div>
    </section>`;
  $("poSearch").oninput = renderFilteredPurchaseOrders;
  $("poCsvBtn").onclick = exportPurchaseOrdersCsv;
  $("newPoBtn").onclick = () => openPurchaseOrderModal();
  $("newLandedPoBtn").onclick = () => openLandedCostInvoiceModal();
  document.querySelectorAll("[data-po-tab]").forEach((btn) => btn.onclick = () => {
    purchasingTab = btn.dataset.poTab;
    document.querySelectorAll("[data-po-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.poTab === purchasingTab));
    renderFilteredPurchaseOrders();
  });
  bindPurchaseRows();
}

function renderFilteredPurchaseOrders() {
  const q = $("poSearch").value.toLowerCase();
  const rows = purchaseRowsForTab(currentRows, purchasingTab).filter((po) => !q || [
    po.po_no, po.po_date, po.vendor, po.vendor_invoice_no, po.match_status, po.payment_status, po.status,
    ...(po._lines || []).map((line) => `${line.sku} ${line.product_name}`)
  ].join(" ").toLowerCase().includes(q));
  $("poTableHost").innerHTML = purchaseOrderTableHtml(rows);
  bindPurchaseRows();
}

function purchaseRowsForTab(rows, tab = "open") {
  return (rows || []).filter((po) => tab === "closed" ? isClosedPurchaseOrder(po) : !isClosedPurchaseOrder(po));
}

function isClosedPurchaseOrder(po) {
  const text = `${po?.status || ""} ${po?.payment_status || ""}`.toLowerCase();
  return /paid|closed|cancel|void|goods received/.test(text) || poReceiptStatus(po) === "Goods Received";
}

function purchaseOrderTableHtml(rows) {
  const heads = ["PO", "Date", "Vendor", "Jobsite / Project", "Terms", "Incoterm", "Currency", "Parts", "Freight", "Landed Add", "PO Total", "Received", "Invoice", "Match", "Payment", "Status", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(purchaseOrderRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No purchase orders yet.</td></tr>`}</tbody></table></div>`;
}

function purchaseOrderRowHtml(po) {
  const invoice = po.vendor_invoice_no ? `${esc(po.vendor_invoice_no)}<br>${money(po.vendor_invoice_amount)}` : "";
  const canPay = String(po.match_status || "").toLowerCase() === "matched" && String(po.payment_status || "").toLowerCase() !== "paid";
  const landedAp = isLandedCostPayable(po);
  const canClose = !isClosedPurchaseOrder(po) && (landedAp || /matched|goods received/i.test(`${po.match_status || ""} ${po.status || ""}`));
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
    <td>${landedAp ? money(Number(po.vendor_invoice_amount || 0)) : money(poTotal(po))}<br>${po.landed_cost_enabled ? `<small>Inventory ${money(poInventoryCostTotal(po))}</small>` : ""}</td>
    <td>${landedAp ? "Separate AP" : money(poReceivedTotal(po))}</td>
    <td>${invoice}</td>
    <td>${badge(po.match_status || "Pending")}</td>
    <td>${badge(po.payment_status || "Not Ready")}</td>
    <td>${badge(po.status || "Draft")}</td>
    <td><div class="rowactions"><button class="rowbtn" type="button" data-po-sign="${esc(po.po_no)}">Sign</button>${landedAp ? "" : `<button class="rowbtn" type="button" data-po-pdf="${esc(po.po_no)}">PDF</button><button class="rowbtn" type="button" data-po-email="${esc(po.po_no)}">Email</button><button class="rowbtn" type="button" data-po-gr="${esc(po.po_no)}">GR</button><button class="rowbtn" type="button" data-po-landed="${esc(po.po_no)}">Landed AP</button><button class="rowbtn" type="button" data-po-match="${esc(po.po_no)}">=</button>`}${canClose ? `<button class="rowbtn" type="button" data-po-close="${esc(po.po_no)}">Close PO</button>` : ""}${canPay ? `<button class="rowbtn" type="button" data-po-pay="${esc(po.po_no)}">$</button>` : ""}<button class="rowbtn" type="button" data-po-edit="${esc(po.po_no)}">Edit</button><button class="rowbtn danger" type="button" data-po-delete="${esc(po.po_no)}">Delete</button></div></td>
  </tr>`;
}

function poTotal(po) {
  return poPartsSubtotal(po);
}

function poInventoryCostTotal(po) {
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
  return activeReceipts(po).reduce((sum, line) => sum + goodsReceiptBaseAmount(po, line), 0);
}

function poReceivedInventoryTotal(po) {
  return activeReceipts(po).reduce((sum, line) => sum + Number(line.received_qty || 0) * Number(line.unit_cost || 0), 0);
}

function poReceivedLandedAccrualTotal(po) {
  return Math.max(0, poReceivedInventoryTotal(po) - poReceivedTotal(po));
}

function landedClearAmountForInvoice(po, invoiceAmount, receivedAmount = poReceivedTotal(po)) {
  const landedReceived = poReceivedLandedAccrualTotal(po);
  if (landedReceived <= 0) return 0;
  const invoiceExtra = Number(invoiceAmount || 0) - Number(receivedAmount || 0);
  return Math.max(0, Math.min(landedReceived, invoiceExtra));
}

function goodsReceiptBaseAmount(po, gr) {
  const line = (po?._lines || []).find((row) => row.id === gr.po_line_id || row.sku === gr.sku || row.product_id === gr.product_id);
  const baseUnit = Number(line?.unit_cost || gr.base_unit_cost || gr.unit_cost || 0);
  return Number(gr.received_qty || 0) * baseUnit;
}

function isLandedCostPayable(po) {
  return /landed cost ap/i.test(`${po?.status || ""} ${po?.notes || ""}`);
}

function linkedLandedSourcePoNo(po) {
  return linkedLandedSourcePoNos(po)[0] || "";
}

function linkedLandedSourcePoNos(po) {
  const notes = String(po?.notes || "");
  const plural = notes.match(/Linked landed cost POs:\s*([^\n]+)/i);
  if (plural) return plural[1].split(",").map((value) => value.trim()).filter(Boolean);
  const single = notes.match(/Linked landed cost PO:\s*([^\n]+)/i);
  return single ? [single[1].trim()].filter(Boolean) : [];
}

function landedAllocationMap(po) {
  const map = new Map();
  String(po?.notes || "").split(/\r?\n/).forEach((line) => {
    const match = line.match(/^Allocation:\s*([^|]+)\|\s*([0-9.,-]+)\s*\|\s*(.+)$/i);
    if (!match) return;
    const poNo = match[1].trim();
    const amount = Number(String(match[2]).replace(/,/g, ""));
    if (poNo && Number.isFinite(amount)) map.set(poNo, amount);
  });
  return map;
}

function landedAllocationAmountForSource(landedPo, sourcePoNo) {
  const allocations = landedAllocationMap(landedPo);
  if (allocations.has(sourcePoNo)) return Number(allocations.get(sourcePoNo) || 0);
  const linked = linkedLandedSourcePoNos(landedPo);
  if (linked.length === 1 && linked[0] === sourcePoNo) return Number(landedPo.vendor_invoice_amount || 0);
  return 0;
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
  const receiptInvoiceAmount = activeReceipts(po).reduce((sum, gr) => sum + Number(gr.vendor_invoice_amount || gr.received_amount || goodsReceiptBaseAmount(po, gr)), 0);
  const invoice = Number(po.vendor_invoice_amount || receiptInvoiceAmount || 0);
  const landedClear = landedClearAmountForInvoice(po, invoice, received);
  const expectedInvoice = received + landedClear;
  if (!received) return "Awaiting Goods";
  if (!invoice) return "Pending";
  return Math.abs(invoice - expectedInvoice) <= 0.005 ? "Matched" : "Mismatch";
}

function landedCostAllocationBase(po, method = "By Value") {
  if (String(method || "").toLowerCase().includes("qty")) {
    return (po?._lines || []).reduce((sum, line) => sum + Number(line.qty || 0), 0);
  }
  return poPartsSubtotal(po);
}

function calculateMultiPoLandedAllocations(pos, amount, method = "By Value", selectedPoNos = null) {
  const selected = (pos || []).filter((po) => !selectedPoNos || selectedPoNos.has(po.po_no));
  if (!selected.length || !Number(amount || 0)) return selected.map((po) => ({ po_no: po.po_no, amount: 0 }));
  const baseTotal = selected.reduce((sum, po) => sum + landedCostAllocationBase(po, method), 0);
  if (!baseTotal) return selected.map((po) => ({ po_no: po.po_no, amount: 0 }));
  let allocatedSoFar = 0;
  return selected.map((po, index) => {
    const allocation = index === selected.length - 1
      ? Number(amount || 0) - allocatedSoFar
      : Math.round((Number(amount || 0) * (landedCostAllocationBase(po, method) / baseTotal)) * 100) / 100;
    allocatedSoFar += allocation;
    return { po_no: po.po_no, amount: Math.round(allocation * 100) / 100 };
  });
}

function receiptInvoiceSummary(rows, fallbackDate = today()) {
  const invoiceRows = rows.filter((row) => row.vendor_invoice_no || row.vendor_invoice_date || Number(row.vendor_invoice_amount || 0));
  if (!invoiceRows.length) return null;
  const invoiceNos = [...new Set(invoiceRows.map((row) => row.vendor_invoice_no).filter(Boolean))];
  const invoiceDates = invoiceRows.map((row) => row.vendor_invoice_date).filter(Boolean).sort();
  const amount = invoiceRows.reduce((sum, row) => sum + Number(row.vendor_invoice_amount || row.received_qty * (row.base_unit_cost || row.unit_cost) || 0), 0);
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
  const apPosted = await hasPostedApForPurchaseOrder(po.po_no);
  const paymentStatus = keepPaid && /paid/i.test(po.payment_status || "") ? "Paid" : apPosted && match === "Matched" ? "Ready to Pay" : "Not Ready";
  const finalStatus = status === "Goods Received" ? "Closed PO" : status;
  await supabase.from("purchase_orders").update({ status: finalStatus, match_status: match, payment_status: paymentStatus }).eq("id", po.id);
  if (!activeReceipts(po).length) {
    await supabase.from("general_ledger").delete().eq("reference", po.po_no).eq("source", "Purchase Order");
  }
  return { ...po, status: finalStatus, match_status: match, payment_status: paymentStatus };
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
  document.querySelectorAll("[data-po-landed]").forEach((b) => b.onclick = () => openLandedCostInvoiceModal(currentRows.find((po) => po.po_no === b.dataset.poLanded)));
  document.querySelectorAll("[data-po-match]").forEach((b) => b.onclick = () => openPostApFromPoModal({ pos: currentRows }, b.dataset.poMatch));
  document.querySelectorAll("[data-po-pay]").forEach((b) => b.onclick = () => createCheckRunFromPo({ pos: currentRows }, b.dataset.poPay));
  document.querySelectorAll("[data-po-close]").forEach((b) => b.onclick = () => closePurchaseOrder(b.dataset.poClose));
  document.querySelectorAll("[data-po-sign]").forEach((b) => b.onclick = () => openSavedSignatureModal("purchase_orders", "po_no", b.dataset.poSign, `Save signature for ${b.dataset.poSign}`, () => renderPurchasingView()));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function closePurchaseOrder(poNo) {
  const po = currentRows.find((row) => row.po_no === poNo);
  if (!po) return;
  const ok = confirm(`Move ${poNo} to Closed PO?\n\nThis does not post accounting. It only closes the purchasing workflow view.`);
  if (!ok) return;
  try {
    await supabase.from("purchase_orders").update({ status: "Closed PO" }).eq("id", po.id);
    await loadData();
    renderPurchasingView();
  } catch (error) {
    alert(`Could not close ${poNo}.\n\n${error.message || error}`);
  }
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
      ${productSelect("Landed cost allocation", "landed_cost_method", ["By Value", "By Qty", "By Weight"], po?.landed_cost_method || "By Value")}
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
    <p class="notice">Jobsite / Project, vendor, terms, and lines are required. If freight, duty, or fees are entered, the system automatically allocates them into landed inventory cost. If those fees are on the same vendor invoice, AP clears the landed-cost accrual automatically. If they are from a separate freight forwarder or broker, use Landed AP after the PO is saved.</p>`;
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
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Product</th><th>WO #</th><th>UOM</th><th>On Hand</th><th>Qty</th><th>Weight</th><th>Foreign Cost</th><th>USD Cost</th><th>Landed Unit</th><th>Amount</th></tr></thead><tbody id="poLineBody">${lines.map((line, i) => purchaseLineRowHtml(line, i)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addPoLineBtn">Add row</button></div>`;
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
    <td><input type="number" step="0.01" data-po-line="weight" data-line-index="${index}" value="${esc(line._allocation_weight || "")}" placeholder="Optional"></td>
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
  return !/closed|invoiced|complete|void|cancel/i.test(wo?.status || "");
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
  if (poLandedAddOn(record) > 0) record.landed_cost_enabled = true;
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
    await upsertMany("purchase_order_lines", lineRows.map((line) => {
      const { _allocation_weight, ...cleanLine } = line;
      return { ...cleanLine, po_id: saved.id };
    }), "id");
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
    rows.push({ product_id: product?.id || null, sku, product_name: product?.name || get("sku"), unit: product?.unit || get("unit") || null, wo_no: workOrder?.wo_no || null, qty: Number(get("qty") || 0), _allocation_weight: Number(get("weight") || 0), foreign_unit_cost: foreignUnitCost, unit_cost: unitCost, allocated_landed_cost: 0, landed_unit_cost: unitCost });
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
  const baseTotal = method.includes("weight")
    ? lines.reduce((sum, line) => sum + Number(line._allocation_weight || 0), 0)
    : method.includes("qty")
    ? lines.reduce((sum, line) => sum + Number(line.qty || 0), 0)
    : lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unit_cost || 0), 0);
  if (!baseTotal) return lines;
  let allocatedSoFar = 0;
  return lines.map((line, index) => {
    const base = method.includes("weight") ? Number(line._allocation_weight || 0) : method.includes("qty") ? Number(line.qty || 0) : Number(line.qty || 0) * Number(line.unit_cost || 0);
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

async function nextLandedCostRef() {
  const rows = await getAll("purchase_orders");
  const nums = rows.map((row) => Number(String(row.po_no || "").match(/^LC-(\d+)/i)?.[1] || 0)).filter(Boolean);
  return `LC-${Math.max(1000, ...nums) + 1}`;
}

async function openLandedCostInvoiceModal(sourcePo) {
  const eligiblePos = currentRows
    .filter((po) => !isLandedCostPayable(po) && !/cancel|void|paid/i.test(`${po.status || ""} ${po.payment_status || ""}`) && (po.landed_cost_enabled || poLandedAddOn(po) > 0))
    .sort((a, b) => String(a.po_no || "").localeCompare(String(b.po_no || "")));
  if (!eligiblePos.length) {
    alert("No product POs with landed cost are available. Turn on landed cost or enter freight/duty/other landed cost on the product PO first.");
    return;
  }
  const refNo = await nextLandedCostRef();
  const sourceSet = new Set(sourcePo?.po_no ? [sourcePo.po_no] : []);
  const estimatedRemaining = sourcePo ? Math.max(0, poLandedAddOn(sourcePo) - landedCostApTotalForSource(sourcePo.po_no)) : 0;
  $("modalTitle").textContent = `Landed cost AP allocation`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Landed AP #", "po_no", refNo)}
      ${productSelect("Payable vendor", "vendor", productMeta.vendors || [], "", "New vendor")}
      ${productSelect("Cost type", "cost_type", ["Freight Forwarder", "Duty / Customs", "Broker Fee", "Port Charge", "Other"], "Freight Forwarder")}
      ${productSelect("Allocation method across POs", "allocation_method", ["By Value", "By Qty", "By Weight", "Manual", "Custom"], "By Value")}
      ${productInput("Custom allocation name", "custom_allocation_method", "")}
      ${productInput("Invoice #", "vendor_invoice_no", "")}
      ${productInput("Invoice date", "vendor_invoice_date", today(), "date")}
      ${productInput("Due date", "due_date", today(), "date")}
      ${productInput("Invoice amount", "vendor_invoice_amount", estimatedRemaining || (sourcePo ? poLandedAddOn(sourcePo) : 0), "number")}
      ${productSelect("Payment status", "payment_status", ["Not Ready", "Ready to Pay", "Hold", "Paid"], "Not Ready")}
      <div class="field wide"><label>Allocate to product POs</label>${landedCostAllocationRows(eligiblePos, sourceSet)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">Separate landed cost invoice allocated to product POs. This clears Landed Cost Accrual and creates AP to the selected freight/customs/vendor.</textarea></div>
    </div>
    <p class="notice">Use this when one freight forwarder, broker, customs, or port invoice covers items from multiple product vendors. Tick the product POs included in the shipment, choose the allocation method, review the allocated amounts, then save. Accounting still posts AP later before check run.</p>`;
  const recalc = () => refreshLandedCostAllocationPreview();
  document.querySelectorAll("[data-landed-include]").forEach((input) => input.onchange = recalc);
  document.querySelectorAll("[data-landed-weight]").forEach((input) => input.oninput = recalc);
  document.querySelectorAll("[data-landed-amount]").forEach((input) => input.oninput = () => {
    const method = document.querySelector('[data-product-field="allocation_method"]')?.value || "By Value";
    if (/manual|custom/i.test(method)) refreshLandedCostAllocationTotal();
  });
  document.querySelector('[data-product-field="vendor_invoice_amount"]')?.addEventListener("input", recalc);
  document.querySelector('[data-product-field="allocation_method"]')?.addEventListener("change", recalc);
  refreshLandedCostAllocationPreview();
  $("modalSave").onclick = async () => {
    const record = collectProductModalFields();
    const allocations = collectLandedCostAllocations();
    if (!record.vendor || !record.vendor_invoice_no || !Number(record.vendor_invoice_amount || 0)) {
      alert("Choose the payable vendor, invoice #, and invoice amount.");
      return;
    }
    if (!allocations.length) {
      alert("Choose at least one product PO to allocate this landed cost invoice.");
      return;
    }
    const allocatedTotal = allocations.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    if (Math.abs(allocatedTotal - Number(record.vendor_invoice_amount || 0)) > 0.01) {
      alert(`Allocated landed cost must equal the invoice amount. Invoice is ${money(record.vendor_invoice_amount)}, allocated is ${money(allocatedTotal)}.`);
      return;
    }
    if (isLockedAccountingDate(record.vendor_invoice_date || today())) {
      alert("This invoice date is inside the closed accounting period.");
      return;
    }
    try {
      const landedPo = {
        po_no: record.po_no,
        vendor: record.vendor,
        po_date: record.vendor_invoice_date || today(),
        jobsite_project: sourcePo?.jobsite_project || `Landed cost for ${allocations.map((row) => row.po_no).join(", ")}`,
        expected_date: record.due_date || record.vendor_invoice_date || today(),
        payment_terms: sourcePo?.payment_terms || "Net 30",
        incoterm: sourcePo?.incoterm || "",
        freight_amount: 0,
        duty_amount: 0,
        other_landed_cost_amount: 0,
        landed_cost_enabled: false,
        landed_cost_method: "Separate AP",
        foreign_order: false,
        currency_code: "USD",
        exchange_rate: 1,
        vendor_invoice_no: record.vendor_invoice_no,
        vendor_invoice_date: record.vendor_invoice_date || today(),
        due_date: record.due_date || record.vendor_invoice_date || today(),
        vendor_invoice_amount: Number(record.vendor_invoice_amount || 0),
        match_status: "Matched",
        payment_status: record.payment_status || "Not Ready",
        status: "Landed Cost AP",
        posting_date: record.vendor_invoice_date || today(),
        notes: [
          `Linked landed cost POs: ${allocations.map((row) => row.po_no).join(", ")}`,
          `Cost type: ${record.cost_type || "Other"}`,
          `Allocation method: ${record.allocation_method || "By Value"}${record.custom_allocation_method ? ` - ${record.custom_allocation_method}` : ""}`,
          ...allocations.map((row) => `Allocation: ${row.po_no} | ${Number(row.amount || 0).toFixed(2)} | ${record.allocation_method || "By Value"}${record.custom_allocation_method ? ` (${record.custom_allocation_method})` : ""}${row.weight ? ` | Weight ${row.weight}` : ""} | PO lines ${row.line_method || "By Value"}`),
          record.notes || ""
        ].filter(Boolean).join("\n"),
      };
      if (record.vendor && !(productMeta.vendors || []).some((vendor) => vendor.toLowerCase() === record.vendor.toLowerCase())) {
        await upsertOne("vendors", { reference: await nextRefPreview("vendor", "V-", "vendors", "reference"), name: record.vendor.trim(), terms: sourcePo?.payment_terms || "Net 30" }, "name");
      }
      const saved = await upsertOne("purchase_orders", landedPo, "po_no");
      await supabase.from("general_ledger").delete().eq("reference", saved.po_no).eq("source", "Landed Cost Invoice");
      closeModal();
      renderPurchasingView();
    } catch (error) {
      alert(error.message || error);
    }
  };
  $("modal").style.display = "flex";
}

function landedCostAllocationRows(pos, selectedPoNos = new Set()) {
  const heads = ["Use", "PO", "Vendor", "Jobsite / Project", "Parts", "Qty", "Shipment Weight", "Estimated Landed", "Already AP", "Allocate", "Distribute Inside PO"];
  return `<div class="table-wrap"><table class="mini-table landed-allocation-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${pos.map((po) => {
    const remaining = Math.max(0, poLandedAddOn(po) - landedCostApTotalForSource(po.po_no));
    const checked = selectedPoNos.has(po.po_no) ? "checked" : "";
    return `<tr data-landed-po="${esc(po.po_no)}" data-landed-value="${esc(poPartsSubtotal(po))}" data-landed-qty="${esc((po._lines || []).reduce((sum, line) => sum + Number(line.qty || 0), 0))}">
      <td><input type="checkbox" data-landed-include value="${esc(po.po_no)}" ${checked}></td>
      <td>${esc(po.po_no)}</td>
      <td>${esc(po.vendor || "")}</td>
      <td>${esc(po.jobsite_project || "")}</td>
      <td>${money(poPartsSubtotal(po))}</td>
      <td>${esc((po._lines || []).reduce((sum, line) => sum + Number(line.qty || 0), 0))}</td>
      <td><input type="number" step="0.01" data-landed-weight value=""></td>
      <td>${money(poLandedAddOn(po))}</td>
      <td>${money(landedCostApTotalForSource(po.po_no))}</td>
      <td><input type="number" step="0.01" data-landed-amount value="${esc(checked ? remaining : 0)}"></td>
      <td><select data-landed-line-method><option>By Value</option><option>By Qty</option><option>By Weight</option><option>Manual</option></select></td>
    </tr>`;
  }).join("")}</tbody><tfoot><tr><td colspan="9" class="num"><strong>Allocated total</strong></td><td id="landedAllocationTotal">${money(0)}</td><td></td></tr></tfoot></table></div>`;
}

function refreshLandedCostAllocationPreview() {
  const method = document.querySelector('[data-product-field="allocation_method"]')?.value || "By Value";
  if (/manual|custom/i.test(method)) {
    refreshLandedCostAllocationTotal();
    return;
  }
  const amount = Number(document.querySelector('[data-product-field="vendor_invoice_amount"]')?.value || 0);
  const rows = [...document.querySelectorAll("[data-landed-po]")];
  const selected = new Set(rows.filter((tr) => tr.querySelector("[data-landed-include]")?.checked).map((tr) => tr.dataset.landedPo));
  const pos = rows.map((tr) => ({
    po_no: tr.dataset.landedPo,
    _lines: [],
    _allocationValue: Number(tr.dataset.landedValue || 0),
    _allocationQty: Number(tr.dataset.landedQty || 0),
    _allocationWeight: Number(tr.querySelector("[data-landed-weight]")?.value || 0),
  })).filter((po) => selected.has(po.po_no));
  const baseTotal = pos.reduce((sum, po) => sum + (/weight/i.test(method) ? po._allocationWeight : /qty/i.test(method) ? po._allocationQty : po._allocationValue), 0);
  let allocatedSoFar = 0;
  pos.forEach((po, index) => {
    const input = rows.find((tr) => tr.dataset.landedPo === po.po_no)?.querySelector("[data-landed-amount]");
    if (!input) return;
    const base = /weight/i.test(method) ? po._allocationWeight : /qty/i.test(method) ? po._allocationQty : po._allocationValue;
    const allocation = index === pos.length - 1 ? amount - allocatedSoFar : baseTotal ? Math.round((amount * (base / baseTotal)) * 100) / 100 : 0;
    allocatedSoFar += allocation;
    input.value = Number(allocation || 0).toFixed(2);
  });
  rows.filter((tr) => !selected.has(tr.dataset.landedPo)).forEach((tr) => {
    const input = tr.querySelector("[data-landed-amount]");
    if (input) input.value = "0.00";
  });
  refreshLandedCostAllocationTotal();
}

function refreshLandedCostAllocationTotal() {
  const total = collectLandedCostAllocations().reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const host = $("landedAllocationTotal");
  if (host) host.textContent = money(total);
}

function collectLandedCostAllocations() {
  return [...document.querySelectorAll("[data-landed-po]")]
    .filter((tr) => tr.querySelector("[data-landed-include]")?.checked)
    .map((tr) => ({ po_no: tr.dataset.landedPo, amount: Number(tr.querySelector("[data-landed-amount]")?.value || 0), weight: Number(tr.querySelector("[data-landed-weight]")?.value || 0), line_method: tr.querySelector("[data-landed-line-method]")?.value || "By Value" }))
    .filter((row) => row.po_no && Number(row.amount || 0) > 0);
}

function landedCostApTotalForSource(sourcePoNo) {
  return currentRows
    .filter((row) => isLandedCostPayable(row) && linkedLandedSourcePoNos(row).includes(sourcePoNo) && !/cancel/i.test(row.status || ""))
    .reduce((sum, row) => sum + landedAllocationAmountForSource(row, sourcePoNo), 0);
}

async function landedCostReadyForReceipt(po) {
  if (!po?.landed_cost_enabled || poLandedAddOn(po) <= 0) return true;
  const linked = currentRows.filter((row) => isLandedCostPayable(row) && linkedLandedSourcePoNos(row).includes(po.po_no) && !/cancel/i.test(row.status || ""));
  if (!linked.length) return false;
  const posted = await Promise.all(linked.map(async (row) => {
    const { data, error } = await supabase.from("general_ledger").select("id").eq("reference", row.po_no).eq("source", "Landed Cost Invoice").limit(1);
    if (error && error.code !== "PGRST116") throw error;
    return (data || []).length ? landedAllocationAmountForSource(row, po.po_no) : 0;
  }));
  return posted.reduce((sum, amount) => sum + amount, 0) + 0.005 >= poLandedAddOn(po);
}

function landedCostReceiptBlockMessage(po) {
  return `${po.po_no} has landed cost included (${money(poLandedAddOn(po))}). Post the Landed AP first, then receive the goods. This keeps inventory, landed cost accrual, and AP tied correctly.`;
}

async function postLandedCostInvoiceLedger(landedPo, sourcePoNo, costType = "Other") {
  const amount = Number(landedPo.vendor_invoice_amount || 0);
  if (!amount) return;
  const linked = linkedLandedSourcePoNos(landedPo);
  const sourceLabel = linked.length ? linked.join(", ") : sourcePoNo;
  const postingDate = landedPo.posting_date || landedPo.vendor_invoice_date || today();
  await supabase.from("general_ledger").delete().eq("reference", landedPo.po_no).eq("source", "Landed Cost Invoice");
  await upsertMany("general_ledger", [
    { entry_date: postingDate, posting_date: postingDate, account: "Landed Cost Accrual", vendor: landedPo.vendor, invoice_no: landedPo.vendor_invoice_no, invoice_date: landedPo.vendor_invoice_date, due_date: landedPo.due_date, description: `Clear landed cost accrual ${sourceLabel} - ${costType}`, reference: landedPo.po_no, debit: amount, credit: 0, source: "Landed Cost Invoice", status: "Posted" },
    { entry_date: postingDate, posting_date: postingDate, account: "Accounts Payable (A/P)", vendor: landedPo.vendor, invoice_no: landedPo.vendor_invoice_no, invoice_date: landedPo.vendor_invoice_date, due_date: landedPo.due_date, description: `Landed cost payable for ${sourceLabel}`, reference: landedPo.po_no, debit: 0, credit: amount, source: "Landed Cost Invoice", status: "Posted" },
  ], "id");
}

async function openGoodsReceiptModal(po) {
  if (!po) return;
  if (!await landedCostReadyForReceipt(po)) {
    alert(landedCostReceiptBlockMessage(po));
    return;
  }
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
  return `<div class="table-wrap gr-wrap"><table class="line-table gr-line-table"><thead><tr><th>Receive</th><th>SKU</th><th>Product</th><th>Ordered</th><th>Received Before</th><th>Remaining</th><th>Qty Received</th><th>Unit Cost</th><th>Warehouse</th><th>Bin / Shelf</th><th>Invoice #</th><th>Invoice Date</th><th>Invoice Amount</th><th>Receipt Type</th></tr></thead><tbody>${rows.map((line, index) => {
    const receivedBefore = activeReceipts(po).filter((gr) => gr.sku === line.sku).reduce((sum, gr) => sum + Number(gr.received_qty || 0), 0);
    const remaining = Math.max(0, Number(line.qty || 0) - receivedBefore);
    const receiptUnitCost = po.landed_cost_enabled ? Number(line.landed_unit_cost || line.unit_cost || 0) : Number(line.unit_cost || 0);
    const defaultAmount = remaining * Number(line.unit_cost || 0);
    const product = (productMeta.products || []).find((p) => p.id === line.product_id || p.sku === line.sku) || {};
    return `<tr data-gr-line="${index}">
      <td class="tight"><input type="checkbox" data-gr-field="include" ${remaining > 0 ? "checked" : ""}></td>
      <td>${esc(line.sku)}</td>
      <td>${esc(line.product_name || "")}</td>
      <td class="numcell">${esc(line.qty || 0)}</td>
      <td class="numcell">${esc(receivedBefore)}</td>
      <td class="numcell" data-gr-remaining="${remaining}">${esc(remaining)}</td>
      <td><input type="number" step="0.01" min="0" max="${remaining}" data-gr-field="received_qty" value="${remaining}"></td>
      <td><input type="number" step="0.01" min="0" data-gr-field="unit_cost" value="${esc(receiptUnitCost)}"></td>
      <td>${suggestInput(`receiptWarehouse${index}`, productMeta.warehouses || [], product.warehouse || "", "Warehouse").replace(">", ' data-gr-field="receipt_warehouse">')}</td>
      <td><input data-gr-field="receipt_bin_shelf" value="${esc(product.bin_shelf || "")}" placeholder="Bin / shelf"></td>
      <td><input data-gr-field="vendor_invoice_no" placeholder="Vendor invoice #"></td>
      <td><input type="date" data-gr-field="vendor_invoice_date"></td>
      <td><input type="number" step="0.01" min="0" data-gr-field="vendor_invoice_amount" value="${esc(defaultAmount || "")}"></td>
      <td>${suggestInput(`receiptType${index}`, ["Partial", "Full"], remaining >= Number(line.qty || 0) ? "Full" : "Partial", "Receipt type").replace(">", ' data-gr-field="receipt_type">')}</td>
      <input type="hidden" data-gr-field="sku" value="${esc(line.sku)}">
      <input type="hidden" data-gr-field="product_name" value="${esc(line.product_name || "")}">
      <input type="hidden" data-gr-field="ordered_qty" value="${esc(line.qty || 0)}">
      <input type="hidden" data-gr-field="product_id" value="${esc(line.product_id || "")}">
      <input type="hidden" data-gr-field="base_unit_cost" value="${esc(line.unit_cost || 0)}">
    </tr>`;
  }).join("")}</tbody></table></div>`;
}

async function saveGoodsReceiptModal() {
  const po = editing;
  if (!po) return;
  if (!await landedCostReadyForReceipt(po)) {
    alert(landedCostReceiptBlockMessage(po));
    return;
  }
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
      base_unit_cost: Number(get("base_unit_cost") || get("unit_cost") || 0),
      vendor_invoice_no: get("vendor_invoice_no") || null,
      vendor_invoice_date: get("vendor_invoice_date") || null,
      vendor_invoice_amount: Number(get("vendor_invoice_amount") || 0),
      receipt_warehouse: get("receipt_warehouse") || null,
      receipt_bin_shelf: get("receipt_bin_shelf") || null,
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
      base_unit_cost: row.base_unit_cost,
      landed_unit_cost: row.unit_cost,
      landed_cost_amount: Math.max(0, row.received_qty * (row.unit_cost - row.base_unit_cost)),
      receipt_warehouse: row.receipt_warehouse,
      receipt_bin_shelf: row.receipt_bin_shelf,
        received_by: profile?.full_name || profile?.username || "Owner",
        receipt_type: row.receipt_type,
        status: "Received",
        notes: [header.notes, productMeta.receiptInvoiceColumns ? "" : invoiceNote].filter(Boolean).join(" | ") || null,
      };
      if (productMeta.receiptInvoiceColumns) {
        receiptRow.vendor_invoice_no = row.vendor_invoice_no;
        receiptRow.vendor_invoice_date = row.vendor_invoice_date;
        receiptRow.vendor_invoice_amount = row.vendor_invoice_amount || row.received_qty * row.base_unit_cost;
      }
      return receiptRow;
    });
    await upsertManyWithOptionalColumns("goods_receipts", receiptRows, "gr_no", ["receipt_warehouse", "receipt_bin_shelf"], "Goods receipt saved. Run the multi-location SQL update so warehouse/bin receipt details can be stored.");
    await postGoodsReceiptLedger(receiptRows);
    for (const [index, row] of rows.entries()) {
      const product = (productMeta.products || []).find((p) => p.id === row.product_id || p.sku === row.sku);
      const movementRef = rows.length === 1 ? `SM-${grNo}` : `SM-${grNo}-${index + 1}`;
      await upsertOneWithOptionalColumns("stock_movements", {
        reference_no: movementRef,
        movement_date: grDate,
        type: "Goods Receipt",
        product_id: product?.id || row.product_id,
        sku: row.sku,
        product_name: row.product_name,
        vendor: po.vendor,
        qty: row.received_qty,
        to_warehouse: row.receipt_warehouse || product?.warehouse || "",
        to_bin_shelf: row.receipt_bin_shelf || product?.bin_shelf || "",
        unit_fifo_cost: row.unit_cost,
        total_fifo_cost: row.received_qty * row.unit_cost,
        document_no: po.po_no,
        entered_by: profile?.full_name || profile?.username || "Owner",
        reason: `${po.po_no} ${row.receipt_type.toLowerCase()} receipt${row.vendor_invoice_no ? ` / invoice ${row.vendor_invoice_no}` : ""}`,
      }, "reference_no", ["to_bin_shelf"], "Stock movement saved. Run the multi-location SQL update so bin/shelf details can be stored.");
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
    .sig-pad,.saved-signature{width:100%;height:92px;border:1px solid #cfd6df;border-radius:6px;background:#fff;touch-action:none;object-fit:contain}
    .sig-actions,.sig-save-actions{display:flex;gap:8px;margin:8px 0;align-items:center;flex-wrap:wrap}.sig-actions button,.sig-save-actions button{padding:6px 9px;border:1px solid #cfd6df;border-radius:6px;background:#fff}.sig-save-actions{grid-column:1 / -1;border-top:1px solid #d8dee8;padding-top:10px}.sig-save-actions button{font-weight:700}.sig-save-actions span{font-size:12px;color:#506178}
    .sig-input{width:100%;border:0;border-bottom:1px solid #cfd6df;padding:6px 0;margin:2px 0 5px;font-size:12px}
    .sig-line{border-bottom:1px solid #cfd6df;height:26px;margin-top:4px}
    .sig-label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#506178;margin-top:5px}
    @media print{.print-btn,.sig-actions,.sig-save-actions{display:none}.sheet{max-width:none}.sig-pad,.saved-signature{border:0;border-bottom:1px solid #0f172a;border-radius:0}}
  </style></head><body><button class="print-btn" onclick="window.print()">Print / Save PDF</button><main class="sheet" data-signature-table="purchase_orders" data-signature-key-field="po_no" data-signature-key-value="${esc(po.po_no)}"><div class="top"><div><div class="logo">lms <small>imports</small></div><h1>${esc(title)}</h1></div><div class="doc-meta"><strong>${esc(po.po_no)}</strong><br>Date ${esc(po.po_date || "")}${po.expected_date ? `<br>Expected ${esc(po.expected_date)}` : ""}</div></div><div class="boxes"><div class="box"><strong>Vendor</strong><br>${vendorDetails.map(esc).join("<br>") || "No vendor details on file"}</div><div class="box">${poDetails.map(([label, value]) => `<div class="meta-line"><span>${esc(label)}</span><span>${esc(value)}</span></div>`).join("")}</div></div><table><thead><tr><th class="sku">SKU</th><th>Item</th><th class="uom">UOM</th><th class="qty num">Qty</th><th class="cost num">Unit Cost</th><th class="amount num">Amount</th></tr></thead><tbody>${lines.map((line) => `<tr><td>${esc(line.sku)}</td><td>${esc(line.product_name || "")}${line.wo_no ? `<br><small>WO ${esc(line.wo_no)}</small>` : ""}${po.landed_cost_enabled ? `<br><small>Internal landed unit ${money(line.landed_unit_cost || line.unit_cost)} / allocation ${money(line.allocated_landed_cost || 0)}</small>` : ""}</td><td>${esc(line.unit || "")}</td><td class="num">${esc(line.qty)}</td><td class="num">${money(line.unit_cost)}</td><td class="num">${money(Number(line.qty || 0) * Number(line.unit_cost || 0))}</td></tr>`).join("")}<tr class="subtotal-row"><td colspan="5" class="subtotal-label">Parts subtotal</td><td class="num">${money(partsSubtotal)}</td></tr>${po.landed_cost_enabled ? `<tr class="subtotal-row"><td colspan="5" class="subtotal-label">Internal landed estimate - freight</td><td class="num">${money(freight)}</td></tr><tr class="subtotal-row"><td colspan="5" class="subtotal-label">Internal landed estimate - duty/customs</td><td class="num">${money(duty)}</td></tr><tr class="subtotal-row"><td colspan="5" class="subtotal-label">Internal landed estimate - other</td><td class="num">${money(otherLanded)}</td></tr><tr class="subtotal-row"><td colspan="5" class="subtotal-label">Inventory landed cost estimate</td><td class="num">${money(poInventoryCostTotal(po))}</td></tr>` : ""}<tr class="total-row"><td colspan="5" class="num total">Vendor PO Total</td><td class="num total">${money(poTotal(po))}</td></tr></tbody></table>${po.notes ? `<div class="notes"><strong>Notes</strong><br>${esc(po.notes)}</div>` : ""}${signatureBlockHtml("Vendor acknowledgement", po.signature_data_url || "", { saveButtons: true, customerField: "signature_data_url", customerNameField: "signature_printed_name", customerDateField: "signature_signed_date", customerName: po.signature_printed_name || "", customerDate: po.signature_signed_date || today(), internalField: "internal_signature_data_url", internalNameField: "internal_signature_name", internalRemarksField: "internal_signature_remarks", internalSignature: po.internal_signature_data_url || "", internalName: po.internal_signature_name || "", internalRemarks: po.internal_signature_remarks || "" })}</main>${signatureScriptHtml()}</body></html>`;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow popups to print or save PDF.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

window.savePdfSignatures = async function savePdfSignatures(request) {
  const table = request?.table;
  const keyField = request?.keyField;
  const keyValue = request?.keyValue;
  const values = request?.values || {};
  if (table !== "purchase_orders" || keyField !== "po_no" || !keyValue) {
    return { ok: false, message: "This PDF signature can only be saved against a purchase order." };
  }
  const allowedColumns = [
    "signature_data_url",
    "signature_printed_name",
    "signature_signed_date",
    "internal_signature_data_url",
    "internal_signature_name",
    "internal_signature_remarks",
  ];
  const optionalColumns = [
    "signature_printed_name",
    "signature_signed_date",
    "internal_signature_data_url",
    "internal_signature_name",
    "internal_signature_remarks",
  ];
  let row = Object.fromEntries(Object.entries(values)
    .filter(([key, value]) => allowedColumns.includes(key) && value !== undefined)
    .map(([key, value]) => [key, value === "" ? null : value]));
  if (!Object.keys(row).length) return { ok: false, message: "There is no signature or signature detail to save yet." };
  const skipped = [];
  for (let attempt = 0; attempt <= optionalColumns.length; attempt += 1) {
    try {
      const { error } = await supabase.from("purchase_orders").update(row).eq("po_no", keyValue);
      if (error) throw error;
      currentRows = currentRows.map((record) => record.po_no === keyValue ? { ...record, ...row } : record);
      if (skipped.length) {
        return {
          ok: true,
          message: `Signature saved. Some extra signature fields were skipped because the database is missing: ${skipped.join(", ")}. Run the PO signature SQL update when ready.`,
        };
      }
      return { ok: true, message: "Signature saved on this purchase order." };
    } catch (error) {
      const missing = optionalColumns.find((column) => column in row && isMissingSchemaColumn(error, column));
      if (!missing) return { ok: false, message: error.message || String(error) };
      const { [missing]: _removed, ...nextRow } = row;
      row = nextRow;
      skipped.push(missing);
      if (!Object.keys(row).length) {
        return { ok: false, message: `The database is missing the signature storage fields: ${skipped.join(", ")}. Run the PO signature SQL update first.` };
      }
    }
  }
  return { ok: false, message: "Could not save the signature." };
};

async function emailPurchaseOrder(poNo) {
  const po = currentRows.find((row) => row.po_no === poNo);
  if (!po) return;
  const vendor = (purchaseContext.vendorRows || []).find((row) => String(row.name || "").toLowerCase() === String(po.vendor || "").toLowerCase()) || {};
  if (!vendor.email) {
    const email = prompt(`No email is saved for ${po.vendor || "this vendor"}.\n\nEnter the vendor email to save in Vendor Master:`, "");
    if (!email) return;
    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    const update = { email: email.trim() };
    const query = vendor.id
      ? supabase.from("vendors").update(update).eq("id", vendor.id)
      : supabase.from("vendors").update(update).ilike("name", po.vendor || "");
    const { error } = await query;
    if (error) {
      alert(`Could not save vendor email: ${error.message || error}`);
      return;
    }
    vendor.email = email.trim();
    purchaseContext.vendorRows = (purchaseContext.vendorRows || []).map((row) => String(row.name || "").toLowerCase() === String(po.vendor || "").toLowerCase() ? { ...row, email: email.trim() } : row);
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
    po.landed_cost_enabled ? `Internal landed estimate: ${money(poLandedAddOn(po))}` : "",
    `Vendor PO Total: ${money(poTotal(po))}`,
    "",
    "The PDF opened in a separate tab so it can be saved and attached to this email.",
    "",
    "Thank you,",
    "LMS Imports",
  ].filter((line) => line !== "").join("\n");
  window.location.href = `mailto:${encodeURIComponent(vendor.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function exportPurchaseOrdersCsv() {
  currentCfg = { labels: ["PO", "Date", "Vendor", "Jobsite / Project", "Terms", "Incoterm", "Foreign Order", "Country", "Currency", "Exchange Rate", "Landed Cost Enabled", "Allocation Method", "Parts Subtotal", "Freight", "Duty", "Other Landed", "Vendor PO Total", "Inventory Cost Total", "Received Vendor Cost", "Received Inventory Cost", "Invoice", "Invoice Amount", "Match", "Payment", "Status"], heads: [] };
  currentRows = currentRows.map((po) => ({ PO: po.po_no, Date: po.po_date, Vendor: po.vendor, "Jobsite / Project": po.jobsite_project, Terms: po.payment_terms, Incoterm: po.incoterm, "Foreign Order": po.foreign_order ? "Yes" : "No", Country: po.foreign_country, Currency: po.currency_code, "Exchange Rate": po.exchange_rate, "Landed Cost Enabled": po.landed_cost_enabled ? "Yes" : "No", "Allocation Method": po.landed_cost_method, "Parts Subtotal": poPartsSubtotal(po), Freight: poFreight(po), Duty: po.duty_amount, "Other Landed": po.other_landed_cost_amount, "Vendor PO Total": poTotal(po), "Inventory Cost Total": poInventoryCostTotal(po), "Received Vendor Cost": poReceivedTotal(po), "Received Inventory Cost": poReceivedInventoryTotal(po), Invoice: po.vendor_invoice_no, "Invoice Amount": po.vendor_invoice_amount, Match: po.match_status, Payment: po.payment_status, Status: po.status }));
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
    await upsertOneWithOptionalColumns("stock_movements", {
      reference_no: `REV-${gr.gr_no}`,
      movement_date: today(),
      type: "Goods Receipt Reversal",
      product_id: gr.product_id || product?.id || null,
      sku: gr.sku,
      product_name: gr.product_name,
      vendor: gr.vendor,
      qty: -Math.abs(qty),
      from_warehouse: gr.receipt_warehouse || product?.warehouse || "",
      from_bin_shelf: gr.receipt_bin_shelf || product?.bin_shelf || "",
      unit_fifo_cost: unitCost,
      total_fifo_cost: Math.abs(qty) * unitCost,
      document_no: gr.po_no || gr.gr_no,
      entered_by: profile?.full_name || profile?.username || "Owner",
      reason: `Reversal of ${gr.gr_no}${gr.vendor_invoice_no ? ` / invoice ${gr.vendor_invoice_no}` : ""}`,
    }, "reference_no", ["from_bin_shelf"], "Receipt reversed. Run the multi-location SQL update so bin/shelf details can be stored.");
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

async function renderQuotationsView() {
  currentCfg = tableMap.quotes;
  $("viewTitle").textContent = "Quotations";
  $("viewSub").textContent = "Create customer quotes and convert accepted quotes to sales orders.";
  const [quotes, lines, customers, products] = await Promise.all([
    getAll("quotations"),
    getAll("quotation_lines"),
    getAll("customers"),
    getAll("products"),
  ]);
  currentRows = quotes.sort((a, b) => String(b.quote_date || "").localeCompare(String(a.quote_date || "")));
  currentRows.forEach((quote) => quote._lines = lines.filter((line) => line.quote_id === quote.id));
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  productMeta.products = products.sort((a, b) => String(a.sku || "").localeCompare(String(b.sku || "")));
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="quoteSearch" placeholder="Search quotations by quote, customer, product, status">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Quotations</strong><span>No accounting entry is posted until the accepted quote becomes a sales order.</span></div><div class="actions"><button id="quoteCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newQuoteBtn">New quote</button></div></div>
      <div id="quoteTableHost">${quotationTableHtml(currentRows)}</div>
    </section>`;
  $("quoteSearch").oninput = renderFilteredQuotations;
  $("quoteCsvBtn").onclick = exportQuotationsCsv;
  $("newQuoteBtn").onclick = () => openQuotationModal();
  bindQuotationRows();
}

function renderFilteredQuotations() {
  const q = $("quoteSearch").value.toLowerCase();
  const rows = currentRows.filter((quote) => !q || [
    quote.quote_no, quote.customer, quote.status, quote.sales_order_no,
    ...(quote._lines || []).map((line) => `${line.sku} ${line.product_name}`)
  ].join(" ").toLowerCase().includes(q));
  $("quoteTableHost").innerHTML = quotationTableHtml(rows);
  bindQuotationRows();
}

function quotationTableHtml(rows) {
  const heads = ["Quote", "Date", "Customer", "Valid Until", "Status", "Lines", "Total", "Sales Order", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map(quotationRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No quotations yet.</td></tr>`}</tbody></table></div>`;
}

function quotationRowHtml(quote) {
  const status = String(quote.status || "Draft");
  const converted = Boolean(quote.sales_order_no) || /converted/i.test(status);
  return `<tr>
    <td>${esc(quote.quote_no)}</td>
    <td>${esc(quote.quote_date || "")}</td>
    <td>${esc(quote.customer || "")}</td>
    <td>${esc(quote.valid_until || "")}</td>
    <td>${badge(status)}</td>
    <td>${esc((quote._lines || []).length)}</td>
    <td>${money(quotationTotal(quote))}</td>
    <td>${esc(quote.sales_order_no || "")}</td>
    <td><div class="rowactions"><button class="rowbtn" type="button" data-quote-pdf="${esc(quote.quote_no)}">PDF</button>${converted ? "" : `<button class="rowbtn" type="button" data-quote-accept="${esc(quote.quote_no)}">Accept</button>`}<button class="rowbtn" type="button" data-quote-edit="${esc(quote.quote_no)}">Edit</button><button class="rowbtn danger" type="button" data-quote-delete="${esc(quote.quote_no)}">Delete</button></div></td>
  </tr>`;
}

function quotationTotal(quote) {
  return (quote._lines || []).reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0), 0);
}

function bindQuotationRows() {
  document.querySelectorAll("[data-quote-edit]").forEach((b) => b.onclick = () => openQuotationModal(currentRows.find((quote) => quote.quote_no === b.dataset.quoteEdit)));
  document.querySelectorAll("[data-quote-delete]").forEach((b) => b.onclick = () => deleteQuotation(b.dataset.quoteDelete));
  document.querySelectorAll("[data-quote-pdf]").forEach((b) => b.onclick = () => printQuotation(b.dataset.quotePdf));
  document.querySelectorAll("[data-quote-accept]").forEach((b) => b.onclick = () => acceptQuotation(b.dataset.quoteAccept));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function openQuotationModal(quote = null) {
  editing = quote;
  if (!productMeta.products?.length) productMeta.products = await getAll("products");
  if (!productMeta.customers?.length) productMeta.customers = (await getAll("customers")).map((c) => c.name).filter(Boolean).sort();
  const quoteNo = quote?.quote_no || await nextRefPreview("quote", "QT-", "quotations", "quote_no");
  const firstProduct = productMeta.products?.[0] || {};
  const lines = quote?._lines?.length ? quote._lines : [{ sku: firstProduct.sku || "", product_name: firstProduct.name || "", unit: firstProduct.unit || "", qty: 1, price: firstProduct.selling_price || 0 }];
  $("modalTitle").textContent = quote ? "Edit quotation" : "New quotation";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Quote #", "quote_no", quoteNo)}
      ${productSelect("Customer", "customer", productMeta.customers || [], quote?.customer || "", "New customer")}
      ${productInput("Date", "quote_date", quote?.quote_date || today(), "date")}
      ${productInput("Valid until", "valid_until", quote?.valid_until || "", "date")}
      ${productInput("Customer PO #", "customer_po", quote?.customer_po || "")}
      ${productSelect("Status", "status", ["Draft", "Sent", "Accepted", "Converted", "Cancelled"], quote?.status || "Draft")}
      <div class="field wide"><label>Line items</label>${quotationLineRows(lines)}</div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(quote?.notes || "")}</textarea></div>
    </div>
    <p class="notice">Quote pricing follows the product sales price from inventory. Change a line price only when you intentionally override the quoted price.</p>`;
  $("modalSave").onclick = saveQuotationModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateQuotationCustomer(quote));
  const addLineBtn = $("addQuoteLineBtn");
  if (addLineBtn) addLineBtn.onclick = addQuotationLineRow;
  wireQuotationLinePricing();
}

function quotationLineRows(lines) {
  return `<div class="table-wrap"><table class="line-table"><thead><tr><th>Product</th><th>On Hand</th><th>Unit</th><th>Qty</th><th>Sales Price</th><th>Amount</th></tr></thead><tbody id="quoteLineBody">${lines.map((line, i) => quotationLineRowHtml(line, i)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addQuoteLineBtn">Add row</button></div>`;
}

function quotationLineRowHtml(line = {}, index = 0) {
  const sku = line.sku || "";
  const product = productMeta.products?.find((p) => p.sku === sku) || {};
  const label = sku ? `${sku} - ${line.product_name || product.name || ""}` : "";
  const price = line.price ?? product.selling_price ?? 0;
  const unit = line.unit || product.unit || "";
  return `<tr>
    <td><input class="suggest-input" list="poProductOptions" data-quote-line="sku" data-line-index="${index}" value="${esc(label)}" placeholder="Search SKU, name, vendor" autocomplete="off">${productOptionsDatalist()}</td>
    <td data-quote-onhand>${esc(product.qty ?? "")}</td>
    <td data-quote-unit>${esc(unit)}</td>
    <td><input type="number" step="0.01" data-quote-line="qty" data-line-index="${index}" value="${esc(line.qty || "")}"></td>
    <td><input type="number" step="0.01" data-quote-line="price" data-line-index="${index}" value="${esc(price)}"></td>
    <td data-quote-amount>${money(Number(line.qty || 0) * Number(price || 0))}</td>
  </tr>`;
}

function addQuotationLineRow() {
  const body = $("quoteLineBody");
  if (!body) return;
  const index = body.querySelectorAll("tr").length;
  body.insertAdjacentHTML("beforeend", quotationLineRowHtml({}, index));
  wireQuotationLinePricing();
}

function wireQuotationLinePricing() {
  document.querySelectorAll("#quoteLineBody tr").forEach((tr) => {
    const skuInput = tr.querySelector('[data-quote-line="sku"]');
    const qtyInput = tr.querySelector('[data-quote-line="qty"]');
    const priceInput = tr.querySelector('[data-quote-line="price"]');
    const refreshAmount = () => {
      const qty = Number(qtyInput?.value || 0);
      const price = Number(priceInput?.value || 0);
      const amountCell = tr.querySelector("[data-quote-amount]");
      if (amountCell) amountCell.textContent = money(qty * price);
    };
    if (skuInput) skuInput.onchange = () => {
      const product = resolveProductLookup(skuInput.value);
      if (!product) return;
      skuInput.value = `${product.sku} - ${product.name || ""}`;
      const onHandCell = tr.querySelector("[data-quote-onhand]");
      const unitCell = tr.querySelector("[data-quote-unit]");
      if (onHandCell) onHandCell.textContent = product.qty ?? "";
      if (unitCell) unitCell.textContent = product.unit || "";
      if (priceInput) priceInput.value = product.selling_price ?? 0;
      refreshAmount();
    };
    if (qtyInput) qtyInput.oninput = refreshAmount;
    if (priceInput) priceInput.oninput = refreshAmount;
  });
}

function parseQuotationLineRows() {
  return [...document.querySelectorAll("#quoteLineBody tr")].map((tr) => {
    const get = (field) => tr.querySelector(`[data-quote-line="${field}"]`)?.value || "";
    const product = resolveProductLookup(get("sku"));
    if (!product) return null;
    const qty = Number(get("qty") || 0);
    const price = Number(get("price") || product.selling_price || 0);
    return { product_id: product.id, sku: product.sku, product_name: product.name, unit: product.unit || "", qty, price };
  }).filter((line) => line && line.qty > 0);
}

async function quickCreateQuotationCustomer(quote) {
  const name = prompt("Customer name to create");
  if (!name) return;
  try {
    await upsertOne("customers", { reference: await nextRefPreview("customer", "C-", "customers", "reference"), name: name.trim(), terms: "30 days" }, "name");
    await renderQuotationsView();
    await openQuotationModal(quote);
    const customerField = document.querySelector('[data-product-field="customer"]');
    if (customerField) customerField.value = name.trim();
  } catch (error) {
    alert(error.message || error);
  }
}

async function saveQuotationModal() {
  const record = {};
  document.querySelectorAll("[data-product-field]").forEach((el) => record[el.dataset.productField] = el.value || null);
  if (!record.customer) {
    alert("Customer is required for a quotation.");
    return;
  }
  const lineRows = parseQuotationLineRows();
  if (!lineRows.length) {
    alert("Add at least one quote line.");
    return;
  }
  try {
    const wasNew = !editing;
    const saved = await upsertOne("quotations", record, "quote_no");
    await supabase.from("quotation_lines").delete().eq("quote_id", saved.id);
    const { error } = await supabase.from("quotation_lines").insert(lineRows.map((line) => ({ ...line, quote_id: saved.id })));
    if (error) throw error;
    if (wasNew) await incrementSequence("quote");
    closeModal();
    renderQuotationsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function deleteQuotation(quoteNo) {
  if (!confirm("Delete this quotation and its lines?")) return;
  const quote = currentRows.find((row) => row.quote_no === quoteNo);
  if (quote?.id) await supabase.from("quotation_lines").delete().eq("quote_id", quote.id);
  const { error } = await supabase.from("quotations").delete().eq("quote_no", quoteNo);
  if (error) alert(error.message);
  renderQuotationsView();
}

async function acceptQuotation(quoteNo) {
  const quote = currentRows.find((row) => row.quote_no === quoteNo);
  if (!quote) return;
  if (quote.sales_order_no) {
    alert(`This quote is already converted to ${quote.sales_order_no}.`);
    return;
  }
  if (!confirm(`Accept ${quoteNo} and convert it to a sales order?`)) return;
  const lines = quote._lines || [];
  if (!lines.length) {
    alert("Cannot convert. Add at least one quotation line first.");
    return;
  }
  try {
    const orderNo = await nextRefPreview("so", "SO-", "sales_orders", "order_no");
    const order = await upsertOne("sales_orders", {
      order_no: orderNo,
      customer: quote.customer,
      customer_po: quote.customer_po || null,
      payment_mode: "PO",
      manager_override: quote.customer_po ? false : true,
      override_by: quote.customer_po ? null : (profile?.full_name || profile?.username || "Manager"),
      override_reason: quote.customer_po ? null : `Converted from accepted quotation ${quote.quote_no} without customer PO.`,
      order_date: today(),
      status: "Open",
      notes: `Converted from quotation ${quote.quote_no}${quote.notes ? `\n${quote.notes}` : ""}`,
    }, "order_no");
    const orderLines = lines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      sku: line.sku,
      product_name: line.product_name,
      qty: Number(line.qty || 0),
      price: Number(line.price || 0),
    }));
    if (orderLines.length) {
      const { error } = await supabase.from("sales_order_lines").insert(orderLines);
      if (error) throw error;
    }
    await supabase.from("quotations").update({ status: "Converted", accepted_date: today(), sales_order_no: orderNo }).eq("id", quote.id);
    await incrementSequence("so");
    alert(`Quotation accepted. Sales Order ${orderNo} was created.`);
    renderQuotationsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function printQuotation(quoteNo) {
  const quote = currentRows.find((row) => row.quote_no === quoteNo);
  if (!quote) return;
  const html = printableDocumentHtml({
    title: "Quotation",
    number: quote.quote_no,
    date: quote.quote_date,
    partyLabel: "Customer",
    partyName: quote.customer,
    meta: [["Valid Until", quote.valid_until || ""], ["Status", quote.status || "Draft"], ["Customer PO #", quote.customer_po || ""], ["Sales Order", quote.sales_order_no || ""]],
    heads: ["SKU", "Item", "Unit", "Qty", "Sales Price", "Amount"],
    lines: (quote._lines || []).map((line) => [line.sku, line.product_name || "", line.unit || "", line.qty, money(line.price), money(Number(line.qty || 0) * Number(line.price || 0))]),
    total: quotationTotal(quote),
    notes: quote.notes || "",
  });
  openPrintWindow(html, quote.quote_no);
}

function exportQuotationsCsv() {
  const heads = ["Quote", "Date", "Customer", "Valid Until", "Status", "Lines", "Total", "Sales Order"];
  const rows = [heads, ...currentRows.map((quote) => [quote.quote_no, quote.quote_date, quote.customer, quote.valid_until, quote.status, (quote._lines || []).length, quotationTotal(quote), quote.sales_order_no || ""])];
  downloadCsv(rows, "quotations.csv");
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
    <td><div class="rowactions"><button class="rowbtn" type="button" data-sales-sign="${esc(order.order_no)}">Sign</button><button class="rowbtn" type="button" data-sales-pdf="${esc(order.order_no)}">PDF</button><button class="rowbtn" type="button" data-sales-invoice="${esc(order.order_no)}">Inv</button>${order.status !== "Fulfilled" ? `<button class="rowbtn" type="button" data-sales-issue="${esc(order.order_no)}">Issue</button>` : ""}<button class="rowbtn" type="button" data-sales-edit="${esc(order.order_no)}">Edit</button><button class="rowbtn danger" type="button" data-sales-delete="${esc(order.order_no)}">Delete</button></div></td>
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
  document.querySelectorAll("[data-sales-sign]").forEach((b) => b.onclick = () => openSavedSignatureModal("sales_orders", "order_no", b.dataset.salesSign, `Save signature for ${b.dataset.salesSign}`, () => renderSalesOrdersView()));
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
    const saved = await upsertOneWithOptionalColumns("sales_orders", record, "order_no", ["payment_mode"], "Saved the sales order. Add the sales-order payment mode database update when you want payment mode stored.");
    await supabase.from("sales_order_lines").delete().eq("order_id", saved.id);
    await upsertMany("sales_order_lines", lineRows.map((line) => ({ ...line, order_id: saved.id })), "id");
    await syncSalesOrderInitialAccounting({ ...saved, payment_mode: record.payment_mode }, lineRows, productMeta.products || [], { forceAvailable: /fulfilled|posted|paid/i.test(saved.status || "") });
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
      await upsertOneWithOptionalColumns("stock_movements", {
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
        from_bin_shelf: product.bin_shelf || "",
        unit_fifo_cost: unitCost,
        total_fifo_cost: qty * unitCost,
        document_no: order.order_no,
        entered_by: profile?.full_name || profile?.username || "Owner",
        reason: `Order ${order.order_no}`,
      }, "reference_no", ["from_bin_shelf"], "Sale issued. Run the multi-location SQL update so bin/shelf details can be stored.");
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
    signatureDataUrl: order.signature_data_url || "",
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
  const [workOrders, issues, parts, labor, assets, outsideFleet, mechanics, customers, products, stockMovements] = await Promise.all([
    getAll("work_orders"),
    getAll("work_order_issues"),
    getAll("work_order_parts"),
    getAll("work_order_labor"),
    getAll("assets"),
    getAll("outside_customer_fleet").catch(() => []),
    getAll("mechanics"),
    getAll("customers"),
    getAll("products"),
    getAll("stock_movements"),
  ]);
  productMeta.assets = assets;
  productMeta.outsideFleet = outsideFleet;
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
      ${statCard("Voided WO", repairRowsByTab("void").length, "Kept for audit trail")}
    </div>
    <div class="toolbar"><input class="searchbox" id="repairSearch" placeholder="Search repairs by WO, asset, mechanic, customer PO, status, issue"></div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Repair & Service History</strong><span>Work orders with mechanic time, inventory parts, labor, and next service</span></div><div class="actions"><button id="repairCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newWoBtn">New work order</button></div></div>
      <div class="tabbar"><button class="tabbtn active" data-repair-tab="open">Open WO ${openRows.length}</button><button class="tabbtn" data-repair-tab="ready">Ready to Close ${repairRowsByTab("ready").length}</button><button class="tabbtn" data-repair-tab="closed">Closed Not Invoiced ${repairRowsByTab("closed").length}</button><button class="tabbtn" data-repair-tab="invoiced">Invoiced WO ${repairRowsByTab("invoiced").length}</button><button class="tabbtn" data-repair-tab="void">Voided WO ${repairRowsByTab("void").length}</button></div>
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
  if (tab === "void") return currentRows.filter((wo) => /void|cancel/i.test(wo.status || ""));
  if (tab === "invoiced") return currentRows.filter((wo) => wo.invoice_no || /invoiced/i.test(wo.status || ""));
  if (tab === "ready") return currentRows.filter((wo) => !wo.invoice_no && /ready to close/i.test(wo.status || ""));
  if (tab === "closed") return currentRows.filter((wo) => !wo.invoice_no && !/void|cancel/i.test(wo.status || "") && /closed|complete/i.test(wo.status || ""));
  return currentRows.filter((wo) => !wo.invoice_no && !/ready to close|closed|complete|invoiced|void|cancel/i.test(wo.status || ""));
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
  const voided = /void|cancel/i.test(wo.status || "");
  const locked = wo.invoice_no || /invoiced/i.test(wo.status || "") || voided;
  const canClose = !locked && !/closed|complete|cancel|void/i.test(wo.status || "");
  const canVoid = !wo.invoice_no && !/invoiced|void|cancel/i.test(wo.status || "");
  const canInvoice = !voided;
  return `<tr>
    <td>${esc(wo.wo_no)}</td><td>${esc(wo.wo_date || "")}</td><td>${esc(wo.asset_tag || "")}</td><td>${badge(wo.priority || "Medium")}</td>
    <td>${esc((wo._issues || []).map((i) => i.issue).filter(Boolean).join("; ") || wo.description || "")}</td>
    <td>${wo.customer_po ? badge(wo.customer_po) : wo.manager_override ? badge(`Override: ${wo.override_by || "Manager"}`) : ""}</td>
    <td>${esc(mechanics || "")}</td><td>${esc(wo.work_type || "")}</td><td>${money(repairPartsTotal(wo))}</td><td>${repairLaborHours(wo).toFixed(2)} hr<br>${money(repairLaborTotal(wo))}</td><td>${money(repairTotal(wo))}</td><td>${badge(wo.status || "Open")}</td><td>${esc(wo.invoice_no || "")}</td>
    <td><div class="rowactions">${locked ? "" : `<button class="rowbtn" type="button" data-wo-time="${esc(wo.wo_no)}">Time</button><button class="rowbtn" type="button" data-wo-edit="${esc(wo.wo_no)}">Edit</button>${canClose ? `<button class="rowbtn" type="button" data-wo-close="${esc(wo.wo_no)}">Close</button>` : ""}${canVoid ? `<button class="rowbtn danger" type="button" data-wo-void="${esc(wo.wo_no)}">Void</button>` : ""}`}${canInvoice ? `<button class="rowbtn" type="button" data-wo-invoice="${esc(wo.wo_no)}">Inv</button>` : ""}</div></td>
  </tr>`;
}

function bindRepairRows() {
  document.querySelectorAll("[data-wo-time]").forEach((b) => b.onclick = () => openMechanicTimeModal(currentRows.find((wo) => wo.wo_no === b.dataset.woTime)));
  document.querySelectorAll("[data-wo-edit]").forEach((b) => b.onclick = () => openWorkOrderEditModal(currentRows.find((wo) => wo.wo_no === b.dataset.woEdit)));
  document.querySelectorAll("[data-wo-close]").forEach((b) => b.onclick = () => closeWorkOrder(b.dataset.woClose));
  document.querySelectorAll("[data-wo-void]").forEach((b) => b.onclick = () => voidWorkOrder(b.dataset.woVoid));
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
  return mechanicPortalRows("open");
}

function mechanicWorkOrderOpenForPortal(wo) {
  if (!wo || wo.invoice_no) return false;
  return !/ready to close|closed|complete|invoiced|void|cancel/i.test(wo.status || "");
}

function mechanicWorkOrderClosedForPortal(wo) {
  if (!wo) return false;
  if (/void|cancel/i.test(wo.status || "")) return false;
  return !!wo.invoice_no || /ready to close|closed|complete|invoiced/i.test(wo.status || "");
}

function mechanicPortalRows(tab = "open") {
  return currentRows.filter((wo) => tab === "closed" ? mechanicWorkOrderClosedForPortal(wo) : mechanicWorkOrderOpenForPortal(wo));
}

function renderMechanicRepairPortal() {
  const mechanic = currentMechanicName();
  const active = activeLaborForMechanic(mechanic);
  const tab = localStorage.getItem("lms.mechanicWoTab") || "open";
  const openCount = mechanicPortalRows("open").length;
  const closedCount = mechanicPortalRows("closed").length;
  const rows = mechanicPortalRows(tab);
  currentCfg = { title: "Mechanic Work Orders", sub: "Clock in and out, request parts, and review closed work." };
  $("viewTitle").textContent = "My Work Orders";
  $("viewSub").textContent = "Search open and closed work orders, clock labor, request parts, and review history.";
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
      <div class="tabbar mechanic-tabs">
        <button class="tabbtn ${tab === "open" ? "active" : ""}" data-mech-tab="open">Open Work Orders ${openCount}</button>
        <button class="tabbtn ${tab === "closed" ? "active" : ""}" data-mech-tab="closed">Closed Work Orders ${closedCount}</button>
      </div>
      <div class="mechanic-search-wrap"><input class="searchbox" id="mechanicWoSearch" placeholder="Search WO, asset, issue, status, part"></div>
      ${productOptionsDatalist()}
      <div class="mechanic-card-list">
        ${rows.length ? rows.map((wo) => mechanicWorkOrderCard(wo, mechanic, active, tab)).join("") : `<div class="panel"><div class="empty">No ${esc(tab)} work orders found.</div></div>`}
      </div>
    </section>`;
  $("mechanicRefreshBtn").onclick = () => renderRepairsView();
  document.querySelectorAll("[data-mech-tab]").forEach((b) => b.onclick = () => {
    localStorage.setItem("lms.mechanicWoTab", b.dataset.mechTab || "open");
    renderMechanicRepairPortal();
  });
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
    ? filtered.map((wo) => mechanicWorkOrderCard(wo, mechanic, active, localStorage.getItem("lms.mechanicWoTab") || "open")).join("")
    : `<div class="panel"><div class="empty">No work orders match your search.</div></div>`;
  bindMechanicPortalActions();
}

function bindMechanicPortalActions() {
  document.querySelectorAll("[data-mech-clock-in]").forEach((b) => b.onclick = () => mechanicQuickClockIn(b.dataset.mechClockIn));
  document.querySelectorAll("[data-mech-clock-out]").forEach((b) => b.onclick = () => mechanicQuickClockOut(b.dataset.mechClockOut));
  document.querySelectorAll("[data-mech-request-parts]").forEach((b) => b.onclick = () => mechanicQuickRequestParts(b.dataset.mechRequestParts));
  document.querySelectorAll("[data-part-request-photo]").forEach((b) => b.onclick = () => openEquipmentRequestPhoto(b.dataset.partRequestPhoto, b.dataset.partRequestPhotoTitle || "Part request photo"));
  document.querySelectorAll("[data-mech-part-photo]").forEach((input) => {
    input.onchange = () => setMechanicPartPhotoStatus(input.dataset.mechPartPhoto, input.files?.[0] ? "Photo ready. It will be compressed when you save." : "");
  });
  document.querySelectorAll("[data-mech-ask-help]").forEach((b) => b.onclick = () => mechanicPortalAskHelp(b.dataset.mechAskHelp));
  document.querySelectorAll("[data-mech-accept-full]").forEach((b) => b.onclick = () => mechanicPortalAcceptPart(b.dataset.mechAcceptFull, "full"));
  document.querySelectorAll("[data-mech-accept-partial]").forEach((b) => b.onclick = () => mechanicPortalAcceptPart(b.dataset.mechAcceptPartial, "partial"));
  document.querySelectorAll("[data-mech-release-part]").forEach((b) => b.onclick = () => mechanicPortalReleasePart(b.dataset.mechReleasePart));
  document.querySelectorAll("[data-mech-ready-close]").forEach((b) => b.onclick = () => mechanicPortalReadyToClose(b.dataset.mechReadyClose));
}

function mechanicWorkOrderCard(wo, mechanic, active, tab = "open") {
  const isActiveHere = active?._wo?.id === wo.id;
  const blockedByOther = active && !isActiveHere;
  const closedView = tab === "closed" || mechanicWorkOrderClosedForPortal(wo);
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
        ${partsRows.length ? partsRows.map((p) => `<div><b>${esc(partDisplayName(p))}</b><small>Needed ${esc(p.qty_needed ?? "")} | Accepted ${esc(p.accepted_qty ?? 0)} | ${esc(effectivePartStatus(p))} | ${esc(p.availability || "")}</small>${partRequestPhotoButton(p.request_photo_url, partDisplayName(p))}</div>`).join("") : `<small>No parts requested yet.</small>`}
      </details>
      ${closedView ? "" : `<details class="mechanic-detail" open>
        <summary>Accept or release reserved parts</summary>
        ${acceptRows.length ? `<div class="mechanic-accept-list">${acceptRows.map((p) => mechanicPortalAcceptRow(p)).join("")}</div>` : `<small>No reserved parts waiting for acceptance.</small>`}
      </details>`}
      <details class="mechanic-detail">
        <summary>Labor history</summary>
        ${laborRows.length ? laborRows.map((l) => `<div><b>${esc(l.mechanic || "")} - ${esc(l.issue || "General work order")}</b><small>${formatDateTime(l.clock_in)} ${l.clock_out ? `to ${formatDateTime(l.clock_out)} (${laborHours(l).toFixed(2)} hr)` : "- still clocked in"}${l.work_done ? ` | ${esc(l.work_done)}` : ""}</small></div>`).join("") : `<small>No labor entries yet.</small>`}
      </details>
      ${closedView ? `<div class="mechanic-active muted">Closed work order. View only.</div>` : `
      <label class="mechanic-label">Issue worked on</label>
      <select data-mech-issue="${esc(wo.wo_no)}">${(issueOptions.length ? issueOptions : ["General work order"]).map((i) => `<option value="${esc(i)}">${esc(i)}</option>`).join("")}</select>
      <div class="mechanic-request">
        <strong>Request parts</strong>
        <input class="suggest-input" list="poProductOptions" data-mech-part-lookup="${esc(wo.wo_no)}" placeholder="Search SKU, name, vendor, or leave blank" autocomplete="off">
        <input data-mech-part-desc="${esc(wo.wo_no)}" placeholder="Describe part needed if SKU is unknown">
        <label class="camera-upload">Take / upload part photo<input type="file" accept="image/*" capture="environment" data-mech-part-photo="${esc(wo.wo_no)}"></label>
        <small data-mech-part-photo-status="${esc(wo.wo_no)}"></small>
        <div class="mechanic-request-row">
          <input type="number" step="0.01" min="0" data-mech-part-qty="${esc(wo.wo_no)}" placeholder="Qty needed">
          <button type="button" data-mech-request-parts="${esc(wo.wo_no)}">Request part</button>
        </div>
        <small>If SKU is unknown, enter a description or take a photo. Known SKUs reserve available stock. Unknown or short parts go to Parts Requests.</small>
      </div>
      <div class="mechanic-request">
        <strong>Ask mechanic help</strong>
        <select data-mech-helper="${esc(wo.wo_no)}">${["", ...(productMeta.mechanics || []).filter((name) => String(name || "").toLowerCase() !== String(mechanic || "").toLowerCase())].map((name) => `<option value="${esc(name)}">${esc(name || "Select helper mechanic")}</option>`).join("")}</select>
        <button type="button" data-mech-ask-help="${esc(wo.wo_no)}">Ask help</button>
        <small>The helper will see this work order when they log in and can clock in/out for their own hours.</small>
      </div>
      ${isActiveHere ? `<label class="mechanic-label">Work note for clock out</label><textarea data-mech-note="${esc(wo.wo_no)}" placeholder="What was completed?"></textarea>` : ""}`}
    </div>
    ${closedView ? "" : `<div class="mechanic-card-actions">
      ${isActiveHere
        ? `<button class="primary" data-mech-clock-out="${esc(wo.wo_no)}">Clock out now</button>`
        : `<button class="primary" data-mech-clock-in="${esc(wo.wo_no)}" ${blockedByOther ? "disabled" : ""}>Clock in now</button>`}
      <button type="button" data-mech-ready-close="${esc(wo.wo_no)}" ${isActiveHere || blockedByOther ? "disabled" : ""}>Ready to close</button>
      ${blockedByOther ? `<small>Clock out from ${esc(active._wo?.wo_no || "current WO")} first.</small>` : ""}
      ${isActiveHere ? `<small>Clock out before marking ready to close.</small>` : ""}
    </div>`}
  </article>`;
}

function partRequestPhotoButton(src, title = "Part request photo") {
  return src ? `<button class="thumb-btn part-request-photo-btn" type="button" data-part-request-photo="${esc(src)}" data-part-request-photo-title="${esc(title)}" title="Open part request photo"><img class="thumb" src="${esc(src)}" alt="Part request photo"></button>` : "";
}

function setMechanicPartPhotoStatus(woNo, text) {
  const el = [...document.querySelectorAll("[data-mech-part-photo-status]")].find((node) => node.dataset.mechPartPhotoStatus === woNo);
  if (el) el.textContent = text || "";
}

function setClockPartPhotoStatus(text) {
  const el = $("clockPartPhotoStatus");
  if (el) el.textContent = text || "";
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
  const photoFile = document.querySelector(`[data-mech-part-photo="${key}"]`)?.files?.[0];
  const issue = document.querySelector(`[data-mech-issue="${key}"]`)?.value || "General work order";
  const product = resolveProductLookup(lookup);
  const descriptionText = description.trim();
  const partText = product ? partDisplayName(product) : descriptionText || (photoFile ? "Photo request - parts team to identify" : "");
  if (!wo) return;
  if (!product && !descriptionText && !photoFile) {
    alert("Select a SKU, describe the part, or take/upload a photo so the parts team can identify it.");
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
    if (photoFile) setMechanicPartPhotoStatus(wo.wo_no, "Compressing and uploading photo...");
    const requestPhotoUrl = photoFile ? await uploadWorkOrderPartPhoto(wo.wo_no, photoFile) : "";
    const partRow = {
      wo_id: wo.id,
      issue,
      product_id: product?.id || null,
      sku: product?.sku || "TBD",
      product_name: product?.name || descriptionText || "Photo request - parts team to identify",
      qty_needed: qty,
      accepted_qty: 0,
      unit_cost: Number(product?.cost || 0),
      status,
      availability,
      notes: `Requested by ${mechanic}${product ? "" : " - parts team to assign SKU"}`,
    };
    if (requestPhotoUrl) partRow.request_photo_url = requestPhotoUrl;
    await insertOneWithOptionalColumns("work_order_parts", partRow, ["request_photo_url"], "Part request was saved, but the database needs the part request photo SQL update before photos can be stored.");
    if (photoFile) setMechanicPartPhotoStatus(wo.wo_no, "Photo uploaded.");
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
    await upsertOneWithOptionalColumns("stock_movements", {
      reference_no: `SM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      movement_date: today(),
      type: "Repair",
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      vendor: product.source_vendor || "Internal",
      qty: -qty,
      from_warehouse: product.warehouse || null,
      from_bin_shelf: product.bin_shelf || null,
      unit_fifo_cost: unitCost,
      total_fifo_cost: qty * unitCost,
      document_no: wo.wo_no,
      entered_by: currentMechanicName(),
      reason: `${wo.wo_no} - ${part.issue || "Work order part"}`,
    }, "reference_no", ["from_bin_shelf"], "Part accepted. Run the multi-location SQL update so bin/shelf details can be stored.");
    await postWorkOrderPartAcceptanceLedger(wo, part, product, qty, unitCost);
    alert("Part accepted and inventory deducted.");
    await renderRepairsView();
  } catch (error) {
    alert(error.message || error);
  }
}

async function postWorkOrderPartAcceptanceLedger(wo, part, product, qty, unitCost) {
  const total = Number(qty || 0) * Number(unitCost || 0);
  if (!total) return;
  const customer = wo.bill_to_customer && !/internal/i.test(wo.bill_to_customer) ? wo.bill_to_customer : null;
  const debitAccount = customer ? "COGS - Parts" : "Repairs & Maintenance";
  const reference = `${wo.wo_no}-PART-${part.id || product.sku}-${Date.now()}`;
  await upsertMany("general_ledger", [
    { entry_date: today(), posting_date: today(), account: debitAccount, customer, asset: wo.asset_tag || null, description: `WO part used ${product.sku} - ${product.name || part.product_name || ""}`, reference, debit: total, credit: 0, source: "Work Order Parts", status: "Posted" },
    { entry_date: today(), posting_date: today(), account: "Parts Inventory", customer, asset: wo.asset_tag || null, description: `Inventory relief ${product.sku} - ${product.name || part.product_name || ""}`, reference, debit: 0, credit: total, source: "Work Order Parts", status: "Posted" },
  ], "id");
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
  await ensureWorkOrderModalMeta();
  const woNo = await nextRefPreview("wo", "WO-", "work_orders", "wo_no");
  const prefillAsset = prefill.assetTag ? (productMeta.assets || []).find((asset) => asset.asset_tag === prefill.assetTag) : null;
  const outsideAsset = prefill.outsideReference ? (productMeta.outsideFleet || []).find((asset) => asset.reference === prefill.outsideReference) : null;
  const assetLookup = prefillAsset ? assetOptionLabel(prefillAsset) : outsideAsset ? outsideFleetOptionLabel(outsideAsset) : "";
  $("modalTitle").textContent = `New work order ${woNo}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Work order #", "wo_no", woNo)}
      ${productInput("Date", "wo_date", today(), "date")}
      ${productSelect("Bill to customer", "bill_to_customer", productMeta.customers || [], prefill.billToCustomer || "", "New customer")}
      ${productInput("Customer PO #", "customer_po", prefill.customerPO || "")}
      <div class="field"><label>Opening mechanic</label><input class="suggest-input" list="registeredMechanicOptions" data-product-field="opening_mechanic" value="${esc(prefill.openingMechanic || "")}" placeholder="Search registered mechanic" autocomplete="off">${registeredMechanicDatalist()}</div>
      ${productSelect("Manager override", "manager_override", ["No", "Yes"], "No")}
      ${productInput("Override by", "override_by", "")}
      <div class="field wide"><label>Asset search</label><input class="suggest-input" list="workOrderAssetOptions" data-product-field="asset_lookup" value="${esc(assetLookup)}" placeholder="Search asset tag, name, make, model, serial, plate, location" autocomplete="off">${assetOptionsDatalist()}</div>
      ${productSelect("Work type", "work_type", ["Repair", "Preventive Maintenance", "Breakdown", "Inspection", "Rental Checkout"], "Repair")}
      ${productSelect("Priority", "priority", ["Low", "Medium", "High"], "Medium")}
      ${productInput("Jobsite / Location", "jobsite_location", prefill.jobsiteLocation || prefill.location || prefillAsset?.location || outsideAsset?.location || "")}
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

async function ensureWorkOrderModalMeta() {
  const loaders = [];
  if (!Array.isArray(productMeta.mechanics) || !productMeta.mechanics.length) {
    loaders.push(getAll("mechanics").then((rows) => {
      productMeta.mechanicsRows = rows;
      productMeta.mechanics = rows.map((m) => m.name).filter(Boolean).sort();
    }).catch(() => {
      productMeta.mechanicsRows = [];
      productMeta.mechanics = [];
    }));
  }
  if (!Array.isArray(productMeta.customers) || !productMeta.customers.length) {
    loaders.push(getAll("customers").then((rows) => {
      productMeta.customers = rows.map((c) => c.name).filter(Boolean).sort();
    }).catch(() => { productMeta.customers = []; }));
  }
  if (!Array.isArray(productMeta.assets) || !productMeta.assets.length) {
    loaders.push(getAll("assets").then((rows) => { productMeta.assets = rows; }).catch(() => { productMeta.assets = []; }));
  }
  if (!Array.isArray(productMeta.outsideFleet)) {
    loaders.push(getAll("outside_customer_fleet").then((rows) => { productMeta.outsideFleet = rows; }).catch(() => { productMeta.outsideFleet = []; }));
  }
  if (!Array.isArray(productMeta.workOrders) || !productMeta.workOrders.length) {
    loaders.push(getAll("work_orders").then((rows) => { productMeta.workOrders = rows; }).catch(() => { productMeta.workOrders = []; }));
  }
  if (loaders.length) await Promise.all(loaders);
}

function assetOptionsDatalist() {
  const options = [
    ...(productMeta.assets || []).map((a) => [a.asset_tag, a.name, [a.make, a.model].filter(Boolean).join(" "), a.vin_serial, a.plate, a.location, a.assigned_operator, a.status].filter(Boolean).join(" | ")),
    ...(productMeta.outsideFleet || []).map(outsideFleetOptionLabel),
  ];
  return `<datalist id="workOrderAssetOptions">${options.map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist>`;
}

function registeredMechanicNames() {
  return [...new Set((productMeta.mechanics || []).map((name) => String(name || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function registeredMechanicDatalist(id = "registeredMechanicOptions") {
  return `<datalist id="${esc(id)}">${registeredMechanicNames().map((name) => `<option value="${esc(name)}"></option>`).join("")}</datalist>`;
}

function resolveRegisteredMechanic(name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return "";
  return registeredMechanicNames().find((mechanic) => mechanic.toLowerCase() === key) || "";
}

function outsideFleetOptionLabel(row) {
  return [row.reference, row.customer_name, row.po_no, row.vin, row.make, row.model, row.description, "Outside Customer"].filter(Boolean).join(" | ");
}

function resolveAssetLookup(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const key = text.split("|")[0].trim().toLowerCase();
  const owned = (productMeta.assets || []).find((asset) => String(asset.asset_tag || "").toLowerCase() === key || text.toLowerCase().includes(String(asset.asset_tag || "").toLowerCase()));
  if (owned) return owned;
  const outside = (productMeta.outsideFleet || []).find((asset) => String(asset.reference || "").toLowerCase() === key || String(asset.vin || "").toLowerCase() === key || text.toLowerCase().includes(String(asset.reference || "").toLowerCase()));
  return outside ? { id: null, asset_tag: outside.reference || outside.vin, name: outside.description, make: outside.make, model: outside.model, vin_serial: outside.vin, status: outside.status, _outsideFleetReference: outside.reference } : null;
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
  const openingMechanic = resolveRegisteredMechanic(record.opening_mechanic);
  record.manager_override = String(record.manager_override || "").toLowerCase() === "yes";
  record.asset_id = asset?.id || null;
  record.asset_tag = asset?.asset_tag || null;
  delete record.asset_lookup;
  delete record.opening_mechanic;
  ["odometer", "engine_hours", "next_due_odometer", "next_due_hours"].forEach((k) => record[k] = Number(record[k] || 0));
  if (!record.wo_no || !record.wo_date || !record.asset_tag || !record.work_type || !record.priority || !record.status) {
    alert("Work order #, date, asset, work type, priority, and status are required.");
    return;
  }
  if (!registeredMechanicNames().length) {
    alert("Create at least one mechanic in Mechanic Master before opening a work order.");
    return;
  }
  if (!openingMechanic) {
    alert("Choose the Opening mechanic from the registered Mechanic Master list.");
    return;
  }
  const workOrders = productMeta.workOrders?.length ? productMeta.workOrders : await getAll("work_orders");
  const existingOpen = workOrders.find((wo) => wo.wo_no && String(wo.asset_tag || "").toLowerCase() === String(record.asset_tag || "").toLowerCase() && !wo.invoice_no && !/closed|complete|invoiced|void|cancel/i.test(wo.status || ""));
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
  issueRows.forEach((row) => {
    if (!row.assigned_mechanic) row.assigned_mechanic = openingMechanic;
  });
  record.notes = [record.notes, `Opened by mechanic: ${openingMechanic}`].filter(Boolean).join("\n");
  try {
    const saved = await upsertOneWithOptionalColumns("work_orders", record, "wo_no", ["jobsite_location"], "Jobsite / Location was not saved because the database needs the latest work-order update.");
    await upsertMany("work_order_issues", issueRows.map((row) => ({ ...row, wo_id: saved.id })), "id");
    if (asset?._outsideFleetReference) {
      await supabase.from("outside_customer_fleet").update({ status: "WO Assigned", wo_no: saved.wo_no, notes: record.description || null }).eq("reference", asset._outsideFleetReference);
    } else {
      await supabase.from("assets").update({ status: saved.wo_no, notes: record.description || null }).eq("asset_tag", saved.asset_tag);
    }
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
  if (/void|cancel/i.test(wo.status || "")) {
    alert(`Work order ${wo.wo_no} is voided and kept for audit only.`);
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
      ${productInput("Jobsite / Location", "jobsite_location", wo.jobsite_location || "")}
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
    await upsertOneWithOptionalColumns("work_orders", record, "wo_no", ["jobsite_location"], "Jobsite / Location was not saved because the database needs the latest work-order update.");
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

async function voidWorkOrder(woNo) {
  const wo = currentRows.find((row) => row.wo_no === woNo);
  if (!wo) return;
  if (wo.invoice_no || /invoiced/i.test(wo.status || "")) {
    alert(`Cannot void ${wo.wo_no}.\n\nProblem: this work order is already invoiced.\n\nHow to fix: reverse the invoice first, then return to Repairs if the work order still needs to be voided.`);
    return;
  }
  if (/void|cancel/i.test(wo.status || "")) {
    alert(`${wo.wo_no} is already voided.`);
    return;
  }
  const activeLabor = (wo._labor || []).filter((labor) => labor.clock_in && !labor.clock_out);
  if (activeLabor.length) {
    alert(`Cannot void ${wo.wo_no}.\n\nProblem: ${activeLabor.map((l) => l.mechanic || "Mechanic").join(", ")} still has active clock-in time.\n\nHow to fix: clock out all active mechanics first, then void the work order.`);
    return;
  }
  const acceptedParts = (wo._parts || []).filter((part) => Number(part.accepted_qty || 0) > 0);
  const acceptedWarning = acceptedParts.length
    ? `\n\nNote: ${acceptedParts.length} accepted/issued part line(s) will stay posted for audit. Use inventory correction separately if those parts need to be returned to stock.`
    : "";
  const reason = prompt(`Reason for voiding ${wo.wo_no}:${acceptedWarning}`);
  if (!reason || !reason.trim()) {
    alert("Void reason is required.");
    return;
  }
  if (!confirm(`Void ${wo.wo_no}?\n\nThis keeps the work order in the Voided tab and releases open/reserved part requests.`)) return;
  try {
    const user = profile?.full_name || profile?.username || profile?.email || session?.user?.email || "Owner";
    const voidNote = `Voided by ${user}. Reason: ${reason.trim()}`;
    const openParts = (wo._parts || []).filter((part) => {
      if (Number(part.accepted_qty || 0) > 0) return false;
      return !/released|removed|cancelled|accepted|issued|complete/i.test(effectivePartStatus(part));
    });
    await Promise.all(openParts.map((part) => supabase.from("work_order_parts").update({
      status: "Released",
      notes: appendDatedNote(part.notes, `${voidNote}. Open part request released.`),
    }).eq("id", part.id).then(({ error }) => {
      if (error) throw error;
    })));
    await Promise.all((wo._issues || []).map((issue) => supabase.from("work_order_issues").update({
      status: "Void",
      work_notes: appendDatedNote(issue.work_notes, voidNote),
    }).eq("id", issue.id).then(({ error }) => {
      if (error) throw error;
    })));
    await updateOneWithOptionalColumns("work_orders", {
      status: "Void",
      voided_at: new Date().toISOString(),
      voided_by: user,
      void_reason: reason.trim(),
      notes: appendDatedNote(wo.notes, voidNote),
    }, "id", wo.id, ["voided_at", "voided_by", "void_reason"], "Work order was voided, but the database is missing the latest void audit columns. Run the work-order void SQL update to store void date, user, and reason in separate fields.");
    if (wo.asset_tag) {
      const asset = productMeta.assets?.find((a) => String(a.asset_tag || "").toLowerCase() === String(wo.asset_tag || "").toLowerCase());
      if (asset && String(asset.status || "") === wo.wo_no) {
        const { error } = await supabase.from("assets").update({
          status: "For Repair",
          notes: appendDatedNote(asset.notes, `${wo.wo_no} voided. ${reason.trim()}`),
        }).eq("asset_tag", wo.asset_tag);
        if (error) throw error;
      }
    }
    closeModal();
    await renderRepairsView();
  } catch (error) {
    alert(`Could not void ${wo.wo_no}.\n\nProblem: ${error.message || error}\n\nHow to fix: refresh Repairs, confirm the work order is not invoiced and all mechanics are clocked out, then try again.`);
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
  document.querySelectorAll("[data-part-request-photo]").forEach((b) => b.onclick = () => openEquipmentRequestPhoto(b.dataset.partRequestPhoto, b.dataset.partRequestPhotoTitle || "Part request photo"));
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
  return `${productOptionsDatalist()}<div class="table-wrap" data-clock-table="part"><table class="line-table"><thead><tr><th>Part / SKU</th><th>Description Needed</th><th>Photo</th><th>On Hand</th><th>Available</th><th>Qty Needed</th><th>Unit Cost</th><th>Issue</th><th>In-stock Alternatives</th></tr></thead><tbody id="clockPartBody">${rows.join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" data-add-clock-row="part">Add part row</button></div><p class="muted" id="clockPartPhotoStatus"></p><p class="notice">Mechanics may enter only a description or attach a photo when they do not know the exact SKU. Parts team can fill the SKU later in Parts Requests.</p>`;
}

function mechanicReservePartRow(index = 0, issueOptions = []) {
  return `<tr>
    <td><input class="suggest-input" list="poProductOptions" data-clock-part="product_lookup" data-line-index="${index}" placeholder="Search part or leave blank" autocomplete="off"></td>
    <td><input data-clock-part="description" data-line-index="${index}" placeholder="Describe part needed"></td>
    <td><input class="file-cell-input" type="file" accept="image/*" capture="environment" data-clock-part="request_photo" data-line-index="${index}"></td>
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
  const heads = ["Photo", "Part / Description", "Issue", "Needed", "Accepted", "Unit Cost", "Status", "Availability", "Notes"];
  return `<div class="table-wrap"><table class="line-table"><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((p) => `<tr><td>${partRequestPhotoButton(p)}</td><td>${esc(partDisplayName(p))}</td><td>${esc(p.issue || "")}</td><td>${esc(p.qty_needed ?? "")}</td><td>${esc(p.accepted_qty ?? 0)}</td><td>${money(p.unit_cost || 0)}</td><td>${badge(effectivePartStatus(p))}</td><td>${esc(p.availability || "")}</td><td>${esc(p.notes || "")}</td></tr>`).join("") : `<tr><td colspan="${heads.length}" class="empty">No parts requested yet.</td></tr>`}</tbody></table></div>`;
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
  const rows = [];
  const photoRows = [...document.querySelectorAll('#clockPartBody [data-clock-part="request_photo"]')].filter((input) => input.files?.[0]).length;
  if (photoRows) setClockPartPhotoStatus(`Compressing and uploading ${photoRows} part photo${photoRows === 1 ? "" : "s"}...`);
  for (const tr of [...document.querySelectorAll("#clockPartBody tr")]) {
    const get = (field) => tr.querySelector(`[data-clock-part="${field}"]`)?.value || "";
    const product = resolveProductLookup(get("product_lookup"));
    const description = get("description").trim();
    const qty = Number(get("qty") || 0);
    const photoFile = tr.querySelector('[data-clock-part="request_photo"]')?.files?.[0];
    if ((!product && !description && !photoFile) || qty <= 0) continue;
    const issue = get("issue") && get("issue") !== "Use clock-in issue" ? get("issue") : activeIssue || "General work order";
    const requestPhotoUrl = photoFile ? await uploadWorkOrderPartPhoto(wo.wo_no, photoFile) : "";
    let row;
    if (!product) {
      row = {
        wo_id: wo.id,
        issue,
        product_id: null,
        sku: "TBD",
        product_name: description || "Photo request - parts team to identify",
        qty_needed: qty,
        unit_cost: Number(get("unit_cost") || 0),
        availability: "Needs part number",
        status: "Requested",
        accepted_qty: 0,
        notes: `Mechanic requested by description only by ${mechanic} on ${new Date().toLocaleString()}`,
      };
    } else {
      const available = Number(product.qty || 0);
      const shortage = Math.max(0, qty - available);
      row = {
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
    }
    if (requestPhotoUrl) row.request_photo_url = requestPhotoUrl;
    rows.push(row);
  }
  if (!rows.length) {
    if (photoRows) setClockPartPhotoStatus("Enter the quantity needed before saving the photo request.");
    return;
  }
  await upsertManyWithOptionalColumns("work_order_parts", rows, "id", ["request_photo_url"], "Part requests were saved, but the database needs the part request photo SQL update before photos can be stored.");
  if (photoRows) setClockPartPhotoStatus("Part photo upload complete.");
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
    await upsertOneWithOptionalColumns("stock_movements", {
      reference_no: `SM-${wo.wo_no}-${part.sku}-${Date.now().toString().slice(-5)}`,
      movement_date: today(),
      type: "Repair",
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      vendor: product.source_vendor || "",
      qty: -Math.abs(qty),
      from_warehouse: product.warehouse || "",
      from_bin_shelf: product.bin_shelf || "",
      unit_fifo_cost: Number(part.unit_cost || product.cost || 0),
      total_fifo_cost: qty * Number(part.unit_cost || product.cost || 0),
      document_no: wo.wo_no,
      entered_by: mechanic,
      reason: `Accepted for ${part.issue || "General"} on ${wo.wo_no}`,
    }, "reference_no", ["from_bin_shelf"], "Part accepted. Run the multi-location SQL update so bin/shelf details can be stored.");
    await postWorkOrderPartAcceptanceLedger(wo, part, product, qty, Number(part.unit_cost || product.cost || 0));
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
      return { description: `${p.sku} - ${p.product_name}`, unit: product.unit || p.unit || "", qty: Number(p.accepted_qty || 0), rate: Number(p.unit_cost || 0), revenue_account: "Parts Sales" };
    }),
    ...(wo._labor || []).filter((l) => laborHours(l) > 0).map((l) => ({ description: `${l.mechanic} - ${l.issue || "Labor"}${l.work_done ? `: ${l.work_done}` : ""}`, unit: "Hour", qty: Number(laborHours(l).toFixed(2)), rate: Number(l.hourly_rate || 0), revenue_account: "LMS Service - Sales" })),
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
      <div class="panel-head"><div class="panel-title"><strong>Customer Invoices</strong><span>Parts sales, equipment sales, equipment rental, and work order billing</span></div><div class="actions"><button id="invoiceCsvBtn">Excel</button><button id="combinedInvoicePdfBtn">Combined PDF</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newInvoiceBtn">New invoice</button></div></div>
      <div id="invoiceTableHost">${invoiceTableHtml(currentRows)}</div>
    </section>`;
  $("invoiceSearch").oninput = renderFilteredInvoices;
  $("invoiceCsvBtn").onclick = exportInvoicesCsv;
  $("combinedInvoicePdfBtn").onclick = printSelectedCustomerInvoices;
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
  const heads = ["Select", "Invoice #", "Date", "Due", "Customer", "Type", "Source", "Amount", "Paid", "Balance", "Status", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => i === 0 || !h ? "<th></th>" : `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(invoiceRowHtml).join("") : `<tr><td colspan="${heads.length}" class="empty">No invoices yet.</td></tr>`}</tbody></table></div>`;
}

function invoiceRowHtml(inv) {
  const displayStatus = invoiceDisplayStatus(inv);
  const locked = /paid|void|reversed/i.test(displayStatus);
  const canPay = invoiceBalance(inv) > 0 && !/void|reversed/i.test(displayStatus);
  return `<tr>
    <td><input type="checkbox" class="invoice-select" value="${esc(inv.invoice_no)}"></td><td>${esc(inv.invoice_no)}</td><td>${esc(inv.invoice_date || "")}</td><td>${esc(inv.due_date || "")}</td><td>${esc(inv.customer || "")}</td><td>${esc(inv.type || "")}</td><td>${esc(inv.source_ref || "")}</td>
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

function selectedInvoiceRows() {
  const selected = new Set([...document.querySelectorAll(".invoice-select:checked")].map((box) => box.value));
  return currentRows.filter((inv) => selected.has(inv.invoice_no));
}

function printSelectedCustomerInvoices() {
  const invoices = selectedInvoiceRows();
  if (!invoices.length) {
    alert("Select at least one invoice to combine into one PDF.");
    return;
  }
  openPrintWindow(combinedInvoicesHtml(invoices), `combined-invoices-${today()}`);
}

function combinedInvoicesHtml(invoices) {
  const sections = invoices.map(invoicePrintableSection).join("");
  return `<!doctype html><html><head><title>Combined Customer Invoices</title><style>
    @page{size:Letter;margin:.45in}
    *{box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;color:#102033;margin:0;background:#fff}
    .print-btn{position:fixed;right:18px;top:18px;padding:9px 13px;border:1px solid #cfd6df;border-radius:7px;background:#fff}
    .sheet{max-width:7.6in;margin:0 auto 26px;page-break-after:always}
    .sheet:last-child{page-break-after:auto}
    .top{display:flex;justify-content:space-between;gap:20px;border-bottom:4px solid #075f6d;padding:12px 0 18px;margin-bottom:24px}
    .logo{font-size:38px;line-height:1;font-weight:900;font-style:italic;color:#075f6d}
    .logo small{font-size:13px;font-style:normal;text-transform:uppercase;letter-spacing:2px}
    h1{color:#075f6d;margin:14px 0 0;font-size:28px}
    .doc-meta{text-align:right;font-size:15px;line-height:1.65}
    .boxes{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px}
    .box{border:1px solid #cfd6df;border-radius:7px;padding:13px;min-height:84px}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th,td{border-bottom:1px solid #d8dee8;padding:10px 9px;text-align:left;word-break:break-word}
    th{font-size:11px;text-transform:uppercase;color:#1f3145;background:#eef3f6}
    .num{text-align:right}.total-row td{border-bottom:2px solid #cfd6df}.total{font-weight:900;font-size:21px;color:#075f6d}
    .narrative{margin-top:22px}.narrative h2{font-size:16px;color:#075f6d;margin:0 0 8px;border-bottom:1px solid #d8dee8;padding-bottom:6px}.narrative li{margin-bottom:8px;font-size:12px;line-height:1.45}
    .notes{margin-top:18px;border-top:1px solid #d8dee8;padding-top:12px;font-size:12px;color:#506178}
    @media print{.print-btn{display:none}.sheet{max-width:none;margin-bottom:0}}
  </style></head><body><button class="print-btn" onclick="window.print()">Print / Save PDF</button>${sections}</body></html>`;
}

function invoicePrintableSection(inv) {
  const customer = (productMeta.customerRows || []).find((c) => c.name === inv.customer) || {};
  const narrative = inv._workOrder ? workOrderInvoiceNarrativeHtml(inv) : "";
  return `<main class="sheet">
    <div class="top"><div><div class="logo">lms <small>imports</small></div><h1>Customer Invoice</h1></div><div class="doc-meta"><strong>${esc(inv.invoice_no || "")}</strong><br>Date ${esc(inv.invoice_date || "")}</div></div>
    <div class="boxes"><div class="box"><strong>Customer</strong><br>${esc(inv.customer || "")}${customer.address ? `<br>${esc(customer.address)}` : ""}</div><div class="box"><strong>Due Date</strong> ${esc(inv.due_date || "")}<br><strong>Type</strong> ${esc(inv.type || "")}<br><strong>Source</strong> ${esc(inv.source_ref || "")}<br><strong>Status</strong> ${esc(invoiceDisplayStatus(inv))}</div></div>
    <table><thead><tr><th>Description</th><th>UOM</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${(inv._lines || []).map((line) => `<tr><td>${esc(line.description || "")}</td><td>${esc(line.unit || "")}</td><td class="num">${esc(line.qty || "")}</td><td class="num">${money(line.rate)}</td><td class="num">${money(Number(line.qty || 0) * Number(line.rate || 0))}</td></tr>`).join("")}<tr class="total-row"><td colspan="4" class="num total">Total</td><td class="num total">${money(invoiceTotal(inv))}</td></tr></tbody></table>
    ${narrative}${inv.notes ? `<div class="notes"><strong>Notes</strong><br>${esc(inv.notes)}</div>` : ""}
  </main>`;
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
  const rows = [
    { entry_date: invoice.invoice_date, posting_date: invoice.invoice_date, account: "Accounts Receivable (A/R)", customer: invoice.customer, invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, due_date: invoice.due_date, description: `${invoice.type} invoice`, reference: invoice.invoice_no, debit: total, credit: 0, source: "Invoice", status: "Posted" },
  ];
  const byRevenue = new Map();
  (lines || []).forEach((line) => {
    const account = line.revenue_account || revenueAccount;
    const amount = Number(line.qty || 0) * Number(line.rate || 0);
    if (!amount) return;
    byRevenue.set(account, Number(byRevenue.get(account) || 0) + amount);
  });
  byRevenue.forEach((amount, account) => {
    rows.push({ entry_date: invoice.invoice_date, posting_date: invoice.invoice_date, account, customer: invoice.customer, invoice_no: invoice.invoice_no, invoice_date: invoice.invoice_date, due_date: invoice.due_date, description: `${invoice.type} invoice`, reference: invoice.invoice_no, debit: 0, credit: amount, source: "Invoice", status: "Posted" });
  });
  await supabase.from("general_ledger").delete().eq("reference", invoice.invoice_no).eq("source", "Invoice");
  await upsertMany("general_ledger", rows, "id");
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
  if (workOrder && (workOrder.invoice_no || /invoiced|void|cancelled/i.test(workOrder.status || ""))) {
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
      await upsertOneWithOptionalColumns("stock_movements", {
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
        from_bin_shelf: product.bin_shelf || "",
        unit_fifo_cost: unitCost,
        total_fifo_cost: qty * unitCost,
        document_no: record.reference_no,
        entered_by: profile?.full_name || profile?.username || "Owner",
        reason: record.notes || "Supplies issued to employee/mechanic",
      }, "reference_no", ["from_bin_shelf"], "Supply issue saved. Run the multi-location SQL update so bin/shelf details can be stored.");
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
    { entry_date: record.movement_date, posting_date: record.movement_date, account: "Parts Inventory", mechanic: record.issued_to, asset: workOrder?.asset_tag || null, description: `${record.issue || "Supplies issue"} ${product.sku}`, reference: record.reference_no, debit: 0, credit: total, source: "Supplies Issue", status: "Posted" },
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

function printableDocumentHtml({ title, number, date, partyLabel, partyName, partyAddress = "", meta = [], heads = [], lines = [], total = 0, totalLabel = "Total", notes = "", extraHtml = "", signatureDataUrl = "" }) {
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
    .sig-pad,.saved-signature{width:100%;height:92px;border:1px solid #cfd6df;border-radius:6px;background:#fff;touch-action:none;object-fit:contain}
    .sig-actions{display:flex;gap:8px;margin:8px 0}.sig-actions button{padding:6px 9px;border:1px solid #cfd6df;border-radius:6px;background:#fff}
    .sig-input{width:100%;border:0;border-bottom:1px solid #cfd6df;padding:6px 0;margin:2px 0 5px;font-size:12px}
    @media print{.print-btn,.sig-actions{display:none}.sheet{max-width:none}.sig-pad,.saved-signature{border:0;border-bottom:1px solid #0f172a;border-radius:0}}
  </style></head><body><button class="print-btn" onclick="window.print()">Print / Save PDF</button><main class="sheet"><div class="top"><div><div class="logo">lms <small>imports</small></div><h1>${esc(title)}</h1></div><div class="doc-meta"><strong>${esc(number || "")}</strong><br>Date ${esc(date || "")}</div></div><div class="boxes"><div class="box"><strong>${esc(partyLabel || "Customer")}</strong><br>${esc(partyName || "")}${partyAddress ? `<br>${esc(partyAddress)}` : ""}</div><div class="box">${meta.map(([label, value]) => `<strong>${esc(label)}</strong> ${esc(value || "")}`).join("<br>")}</div></div><table><thead><tr>${heads.map((h, i) => `<th class="${i >= 2 ? "num" : ""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${lines.map((line) => `<tr>${line.map((cellValue, i) => `<td class="${i >= 2 ? "num" : ""}">${esc(cellValue)}</td>`).join("")}</tr>`).join("")}<tr class="total-row"><td colspan="${Math.max(1, heads.length - 1)}" class="num total">${esc(totalLabel)}</td><td class="num total">${money(total)}</td></tr></tbody></table>${extraHtml || ""}${notes ? `<div class="notes"><strong>Notes</strong><br>${esc(notes)}</div>` : ""}${signatureBlockHtml(`${partyLabel || "Customer"} acceptance`, signatureDataUrl)}</main>${signatureScriptHtml()}</body></html>`;
}

function signatureBlockHtml(title = "Customer acceptance", savedSignature = "", options = {}) {
  const customerField = options.customerField || "signature_data_url";
  const customerNameField = options.customerNameField || "";
  const customerDateField = options.customerDateField || "";
  const internalField = options.internalField || "internal_signature_data_url";
  const internalNameField = options.internalNameField || "";
  const internalRemarksField = options.internalRemarksField || "";
  const customerSignature = savedSignature
    ? `<img class="saved-signature" src="${esc(savedSignature)}" alt="Saved signature" data-signature-image data-signature-field="${esc(customerField)}"><div class="sig-actions"><span>Saved signature prints on this document</span></div>`
    : `<canvas class="sig-pad" width="560" height="150" data-signature-pad data-signature-field="${esc(customerField)}"></canvas><div class="sig-actions"><button type="button" data-clear-signature>Clear signature</button><span>Sign online before printing or saving PDF</span></div>`;
  const internalSignature = options.internalSignature
    ? `<img class="saved-signature" src="${esc(options.internalSignature)}" alt="Saved internal signature" data-signature-image data-signature-field="${esc(internalField)}"><div class="sig-actions"><span>Saved internal approval prints on this document</span></div>`
    : `<canvas class="sig-pad" width="560" height="150" data-signature-pad data-signature-field="${esc(internalField)}"></canvas><div class="sig-actions"><button type="button" data-clear-signature>Clear signature</button><span>Internal approval signature</span></div>`;
  const saveButtons = options.saveButtons ? `
    <div class="sig-save-actions">
      <button type="button" data-save-signatures>Save signatures</button>
      <button type="button" data-save-signatures-close>Save and close PDF</button>
      <span>Save before printing if you want this signature to stay on the PO.</span>
    </div>` : "";
  return `<section class="signatures">
    <div class="sig-box">
      <div class="sig-title">${esc(title)}</div>
      ${customerSignature}
      <input class="sig-input" placeholder="Printed name" value="${esc(options.customerName || "")}" ${customerNameField ? `data-signature-meta="${esc(customerNameField)}"` : ""}>
      <div class="sig-label">Printed name</div>
      <input class="sig-input" placeholder="Date" value="${esc(options.customerDate || "")}" ${customerDateField ? `data-signature-meta="${esc(customerDateField)}"` : ""}>
      <div class="sig-label">Date</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Received / Approved by LMS Imports</div>
      ${internalSignature}
      <input class="sig-input" placeholder="Name" value="${esc(options.internalName || "")}" ${internalNameField ? `data-signature-meta="${esc(internalNameField)}"` : ""}>
      <div class="sig-label">Name / Signature</div>
      <input class="sig-input" placeholder="Remarks" value="${esc(options.internalRemarks || "")}" ${internalRemarksField ? `data-signature-meta="${esc(internalRemarksField)}"` : ""}>
      <div class="sig-label">Remarks</div>
    </div>
    ${saveButtons}
  </section>`;
}

function openSavedSignatureModal(table, keyField, keyValue, title, onSaved) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = `
    <p class="notice">Sign below and save. This saved signature will print on the PDF until you replace it.</p>
    <canvas id="savedSignatureCanvas" class="sig-pad saved-signature-canvas" width="900" height="240"></canvas>
    <div class="btnline"><button type="button" id="clearSavedSignatureBtn">Clear signature</button></div>`;
  $("modalSave").onclick = async () => {
    const canvas = $("savedSignatureCanvas");
    try {
      await supabase.from(table).update({ signature_data_url: canvas.toDataURL("image/png") }).eq(keyField, keyValue);
      closeModal();
      if (onSaved) await onSaved();
    } catch (error) {
      alert(`Could not save signature.\n\n${error.message || error}`);
    }
  };
  $("modal").style.display = "flex";
  const canvas = $("savedSignatureCanvas");
  wireSignatureCanvas(canvas);
  $("clearSavedSignatureBtn").onclick = () => canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}

function wireSignatureCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#0f172a";
  let drawing = false;
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  canvas.addEventListener("pointerup", () => { drawing = false; });
  canvas.addEventListener("pointercancel", () => { drawing = false; });
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
      canvas.dataset.dirty = "1";
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
      canvas.dataset.dirty = "";
    });
  });
  const collectSignatureValues = () => {
    const values = {};
    document.querySelectorAll("[data-signature-pad][data-signature-field]").forEach((canvas) => {
      if (canvas.dataset.dirty === "1") values[canvas.dataset.signatureField] = canvas.toDataURL("image/png");
    });
    document.querySelectorAll("[data-signature-image][data-signature-field]").forEach((img) => {
      if (img.getAttribute("src")) values[img.dataset.signatureField] = img.getAttribute("src");
    });
    document.querySelectorAll("[data-signature-meta]").forEach((input) => {
      values[input.dataset.signatureMeta] = input.value || "";
    });
    return values;
  };
  const saveSignatures = async (closeAfter) => {
    const root = document.querySelector("[data-signature-table]");
    if (!root || !window.opener || !window.opener.savePdfSignatures) {
      alert("Could not connect this PDF window to the main system. Please keep the main LMS Imports window open and try again.");
      return;
    }
    const result = await window.opener.savePdfSignatures({
      table: root.dataset.signatureTable,
      keyField: root.dataset.signatureKeyField,
      keyValue: root.dataset.signatureKeyValue,
      values: collectSignatureValues(),
    });
    alert(result && result.message ? result.message : (result && result.ok ? "Signature saved." : "Could not save signature."));
    if (result && result.ok && closeAfter) window.close();
  };
  document.querySelectorAll("[data-save-signatures]").forEach((button) => {
    button.addEventListener("click", () => saveSignatures(false));
  });
  document.querySelectorAll("[data-save-signatures-close]").forEach((button) => {
    button.addEventListener("click", () => saveSignatures(true));
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
  const summaryCollapsed = assetSummaryCollapsed();
  $("content").innerHTML = `
    <section class="panel fleet-summary-panel">
      <div class="panel-head compact-head"><div class="panel-title"><strong>Fleet Snapshot</strong><span>Counts, repair exposure, and repair spend</span></div><div class="actions"><button id="assetSummaryToggle">${summaryCollapsed ? "Show summary" : "Hide summary"}</button></div></div>
      <div id="assetSummaryBody" ${summaryCollapsed ? "hidden" : ""}>
        <div class="stats fleet-stats">
          ${statCard("Fleet Assets", currentRows.length, `${currentRows.filter((a) => /in service/i.test(a.status || "")).length} in service`)}
          ${statCard("Needs Repair", stats.needsRepair, "Down or flagged assets")}
          ${statCard("Open Repair Jobs", stats.openJobs, "Scheduled or in progress")}
          ${statCard("Repair Spend", money(stats.repairSpend), "All logged work")}
        </div>
      </div>
    </section>
    <section class="panel fleet-panel">
      <div class="panel-head"><div class="panel-title"><strong>Vehicles & Heavy Equipment</strong><span>Ownership, readings, location, operator, and condition</span></div><div class="actions"><button id="assetFilterToggle">${assetFiltersCollapsed() ? "Show filters" : "Hide filters"}</button><button id="assetColumnsBtn">Show / Hide Columns</button><button id="assetTemplateBtn">Download asset template</button><button id="assetUploadBtn">Upload asset list</button><button id="assetLocationTemplateBtn">Location template</button><button id="assetLocationUploadBtn">Upload locations</button><button id="assetCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button id="addLocationBtn">Add location</button><button id="assetQrCsvBtn">Excel + QR</button><button class="danger" id="clearFleetAssetsBtn">Clear assets</button><button class="primary" id="newAssetBtn">Add asset</button></div></div>
      <div class="toolbar fleet-toolbar">
        <input class="searchbox" id="assetSearch" placeholder="Search fleet and equipment by tag, name, make, model, serial, plate, location">
      </div>
      <div class="column-chooser" id="assetColumnChooser" hidden>${assetColumnChooserHtml()}</div>
      <div id="assetTableHost">${assetTableHtml(currentRows)}</div>
    </section>`;
  $("assetSearch").oninput = renderFilteredAssets;
  $("assetSummaryToggle").onclick = toggleAssetSummary;
  $("assetFilterToggle").onclick = toggleAssetFilters;
  $("assetColumnsBtn").onclick = () => $("assetColumnChooser").hidden = !$("assetColumnChooser").hidden;
  $("assetTemplateBtn").onclick = downloadAssetImportTemplate;
  $("assetUploadBtn").onclick = () => $("assetFileImport").click();
  $("assetFileImport").onchange = importAssetTemplateFile;
  $("assetLocationTemplateBtn").onclick = downloadAssetLocationUpdateTemplate;
  $("assetLocationUploadBtn").onclick = () => $("assetLocationFileImport").click();
  $("assetLocationFileImport").onchange = importAssetLocationUpdateFile;
  $("assetCsvBtn").onclick = exportCurrentCsv;
  $("assetQrCsvBtn").onclick = exportAssetsWithQrCsv;
  $("addLocationBtn").onclick = () => quickCreateAssetMaster("location");
  $("clearFleetAssetsBtn").onclick = clearFleetAssetsOnly;
  $("newAssetBtn").onclick = () => openAssetModal();
  document.querySelectorAll("[data-asset-column]").forEach((box) => box.onchange = saveAssetColumnChoice);
  bindAssetRows();
}

function assetStats(assets, workOrders) {
  return {
    needsRepair: assets.filter((a) => /repair|out|down/i.test(a.status || "")).length,
    openJobs: workOrders.filter((wo) => !/closed|invoiced|complete|void|cancel/i.test(wo.status || "")).length,
    repairSpend: workOrders.reduce((sum, wo) => sum + Number(wo.total || 0), 0),
  };
}

async function renderEquipmentRepairQueueView() {
  currentCfg = { heads: ["asset_tag", "name", "location", "gps_location", "assigned_operator", "requested_by", "approved_by", "repair_po_no", "status", "_openWoIssue", "wo_no"], labels: ["Asset #", "Description", "Location", "GPS", "Operator", "Requested By", "Approved By", "PO #", "Status", "Issue / Request", "Assigned WO"] };
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
  currentRows = productMeta.assets.filter((asset) => /repair|subject/i.test(asset.status || "") || asset._openWo);
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

async function renderOutsideCustomerFleetView() {
  currentCfg = tableMap.outsidefleet;
  $("viewTitle").textContent = "Outside Customer Fleet";
  $("viewSub").textContent = "Customer-owned equipment that can be requested, inspected, repaired, and billed.";
  const [rows, workOrders, customers] = await Promise.all([
    getAll("outside_customer_fleet").catch(() => []),
    getAll("work_orders"),
    getAll("customers"),
  ]);
  productMeta.customers = customers.map((c) => c.name).filter(Boolean).sort();
  productMeta.outsideFleet = rows;
  productMeta.workOrders = workOrders;
  currentRows = rows.map((row) => {
    const openWo = workOrders.find((wo) => [row.reference, row.vin].filter(Boolean).some((key) => String(wo.asset_tag || "").toLowerCase() === String(key || "").toLowerCase()) && !/closed|complete|invoiced|void|cancel/i.test(wo.status || ""));
    return { ...row, wo_no: row.wo_no || openWo?.wo_no || "" };
  }).sort((a, b) => String(a.customer_name || "").localeCompare(String(b.customer_name || "")) || String(a.reference || "").localeCompare(String(b.reference || "")));
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="outsideFleetSearch" placeholder="Search customer, PO, VIN, make, model, description, WO">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Outside Customer Fleet</strong><span>${esc(currentRows.length)} customer-owned unit${currentRows.length === 1 ? "" : "s"} shown.</span></div><div class="actions"><button id="outsideFleetCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newOutsideFleetBtn">New outside customer unit</button></div></div>
      <div id="outsideFleetHost">${outsideFleetTable(currentRows)}</div>
    </section>`;
  $("outsideFleetSearch").oninput = renderFilteredOutsideFleet;
  $("outsideFleetCsvBtn").onclick = exportCurrentCsv;
  $("newOutsideFleetBtn").onclick = () => openOutsideFleetModal();
  bindOutsideFleetRows();
}

function outsideFleetTable(rows) {
  const labels = [...tableMap.outsidefleet.labels, ""];
  return `<div class="table-wrap"><table><thead><tr>${labels.map((label) => `<th>${esc(label)}</th>`).join("")}</tr><tr>${labels.map((label, i) => label ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(label)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>
    <td>${esc(row.reference || "")}</td>
    <td>${esc(row.customer_name || "")}</td>
    <td>${esc(row.po_no || "")}</td>
    <td>${esc(row.vin || "")}</td>
    <td>${esc(row.model || "")}</td>
    <td>${esc(row.make || "")}</td>
    <td>${esc(row.description || "")}</td>
    <td>${badge(row.status || "Open")}</td>
    <td>${row.wo_no ? `<button class="rowbtn" data-outside-open-wo="${esc(row.wo_no)}">${esc(row.wo_no)}</button>` : ""}</td>
    <td><div class="rowactions"><button class="rowbtn" data-outside-create-wo="${esc(row.reference)}">${row.wo_no ? "New WO" : "Create WO"}</button><button class="rowbtn" data-outside-edit="${esc(row.reference)}">Edit</button><button class="rowbtn danger" data-outside-delete="${esc(row.reference)}">Delete</button></div></td>
  </tr>`).join("") : `<tr><td colspan="${labels.length}" class="empty">No outside customer fleet records yet.</td></tr>`}</tbody></table></div>`;
}

function renderFilteredOutsideFleet() {
  const q = ($("outsideFleetSearch")?.value || "").toLowerCase();
  const rows = currentRows.filter((row) => !q || Object.values(row).join(" ").toLowerCase().includes(q));
  $("outsideFleetHost").innerHTML = outsideFleetTable(rows);
  bindOutsideFleetRows();
}

function bindOutsideFleetRows() {
  document.querySelectorAll("[data-outside-edit]").forEach((b) => b.onclick = () => openOutsideFleetModal(currentRows.find((row) => row.reference === b.dataset.outsideEdit)));
  document.querySelectorAll("[data-outside-delete]").forEach((b) => b.onclick = () => deleteOutsideFleetRow(b.dataset.outsideDelete));
  document.querySelectorAll("[data-outside-create-wo]").forEach((b) => b.onclick = () => createOutsideFleetWorkOrder(b.dataset.outsideCreateWo));
  document.querySelectorAll("[data-outside-open-wo]").forEach((b) => b.onclick = async () => {
    await renderRepairsView();
    const wo = currentRows.find((row) => row.wo_no === b.dataset.outsideOpenWo);
    if (wo) openWorkOrderEditModal(wo);
  });
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  enhanceColumnFilters();
}

async function openOutsideFleetModal(row = null) {
  editing = row;
  const reference = row?.reference || await nextRefPreview("outside_fleet", "OC-", "outside_customer_fleet", "reference");
  $("modalTitle").textContent = row ? `Edit outside customer unit ${row.reference}` : "New outside customer unit";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productInput("Reference", "reference", reference)}
      ${productSelect("Customer name", "customer_name", productMeta.customers || [], row?.customer_name || "", "New customer")}
      ${productInput("PO #", "po_no", row?.po_no || "")}
      ${productInput("VIN #", "vin", row?.vin || "")}
      ${productInput("Model", "model", row?.model || "")}
      ${productInput("Make", "make", row?.make || "")}
      ${productSelect("Status", "status", ["Open", "For Repair", "WO Assigned", "Closed", "Inactive"], row?.status || "Open")}
      ${productInput("WO #", "wo_no", row?.wo_no || "")}
      <div class="field wide"><label>Description</label><textarea data-product-field="description">${esc(row?.description || "")}</textarea></div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(row?.notes || "")}</textarea></div>
    </div>`;
  $("modalSave").onclick = saveOutsideFleetModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateCustomerInOpenModal());
}

async function saveOutsideFleetModal() {
  const record = collectProductModalFields();
  if (!record.reference || !record.customer_name) return alert("Reference and Customer Name are required.");
  try {
    await upsertOne("outside_customer_fleet", record, "reference");
    if (!editing) await incrementSequence("outside_fleet");
    closeModal();
    await renderOutsideCustomerFleetView();
  } catch (error) {
    alert(error.message || "Could not save outside customer fleet record. Please run the outside-customer fleet database update if this is the first time using this module.");
  }
}

async function deleteOutsideFleetRow(reference) {
  if (!confirm(`Delete outside customer fleet record ${reference}?`)) return;
  const { error } = await supabase.from("outside_customer_fleet").delete().eq("reference", reference);
  if (error) return alert(error.message || "Could not delete record.");
  renderOutsideCustomerFleetView();
}

async function createOutsideFleetWorkOrder(reference) {
  const row = currentRows.find((item) => item.reference === reference) || (productMeta.outsideFleet || []).find((item) => item.reference === reference);
  if (!row) return;
  productMeta.outsideFleet = productMeta.outsideFleet?.length ? productMeta.outsideFleet : await getAll("outside_customer_fleet").catch(() => []);
  await renderRepairsView();
  openNewWorkOrderModal({
    outsideReference: row.reference,
    billToCustomer: row.customer_name,
    customerPO: row.po_no,
    description: row.description || [row.make, row.model, row.vin].filter(Boolean).join(" "),
  });
}

async function renderEquipmentRequestsView() {
  currentCfg = tableMap.equipmentrequests;
  $("viewTitle").textContent = "Equipment Requests";
  $("viewSub").textContent = isEquipmentRequestUser()
    ? "Request equipment from your phone. Search, sign, and submit."
    : "Equipment requests with date ranges, PO numbers, signatures, and approvals.";
  const [requests, assets] = await Promise.all([
    getAll("equipment_requests").catch(() => []),
    getAll("assets"),
  ]);
  productMeta.assets = assets;
  currentRows = requests.sort((a, b) => String(b.request_date || "").localeCompare(String(a.request_date || "")) || String(b.request_no || "").localeCompare(String(a.request_no || "")));
  if (isEquipmentRequestUser()) return renderEquipmentRequestMobile();
  $("content").innerHTML = `
    <div class="toolbar">
      <input class="searchbox" id="equipmentRequestSearch" placeholder="Search request, equipment, requested by, PO, approved by, status">
    </div>
    <section class="panel">
      <div class="panel-head"><div class="panel-title"><strong>Equipment Requests</strong><span>${esc(currentRows.length)} request${currentRows.length === 1 ? "" : "s"} shown.</span></div><div class="actions"><button id="equipmentRequestCsvBtn">Excel</button><button onclick="window.print()">PDF / Print</button><button class="primary" id="newEquipmentRequestBtn">New request</button></div></div>
      <div id="equipmentRequestHost">${equipmentRequestTable(currentRows)}</div>
    </section>`;
  $("equipmentRequestSearch").oninput = renderFilteredEquipmentRequests;
  $("equipmentRequestCsvBtn").onclick = exportCurrentCsv;
  $("newEquipmentRequestBtn").onclick = () => handleOpenEquipmentRequestModal();
  bindEquipmentRequestRows();
}

function renderEquipmentRequestMobile() {
  $("content").innerHTML = `
    <section class="request-portal">
      <div class="request-hero">
        <div>
          <h2>Equipment Requests</h2>
          <p>Request the equipment needed, attach the PO, sign, and submit.</p>
        </div>
        <button class="primary" id="mobileNewEquipmentRequestBtn">New request</button>
      </div>
      <div id="equipmentRequestHost" class="request-card-list"><div class="empty">Opening request form...</div></div>
    </section>`;
  $("mobileNewEquipmentRequestBtn").onclick = () => handleOpenEquipmentRequestModal();
  setTimeout(() => handleOpenEquipmentRequestModal(), 50);
}

function equipmentRequestTable(rows) {
  const labels = [...tableMap.equipmentrequests.labels, "PDI WO", "Signature", ""];
  return `<div class="table-wrap"><table><thead><tr>${labels.map((label) => `<th>${esc(label)}</th>`).join("")}</tr><tr>${labels.map((label, i) => label ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(label)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>
    <td>${esc(row.request_no || "")}</td>
    <td>${esc(row.request_date || "")}</td>
    <td>${equipmentRequestPhotosHtml(row)}</td>
    <td>${esc(row.asset_tag || "")}</td>
    <td>${equipmentRequestItemsHtml(row)}</td>
    <td>${esc(row.location || "")}</td>
    <td>${esc(row.requested_by || "")}</td>
    <td>${esc(row.email_address || "")}</td>
    <td>${esc(row.po_no || "")}</td>
    <td>${equipmentRequestPoAttachmentHtml(row)}</td>
    <td>${esc(row.from_date || "")}</td>
    <td>${esc(row.to_date || "")}</td>
    <td>${esc(row.approved_by || "")}</td>
    <td>${badge(row.status || "")}</td>
    <td>${equipmentRequestPdiWoBadge(row)}</td>
    <td>${row.requested_signature ? `<img class="signature-thumb" src="${esc(row.requested_signature)}" alt="Signature">` : `<span class="badge">No signature</span>`}</td>
    <td><div class="rowactions">${equipmentRequestActionButtons(row)}<button class="rowbtn" data-equipment-request-edit="${esc(row.request_no)}">Edit</button><button class="rowbtn danger" data-equipment-request-delete="${esc(row.request_no)}">Delete</button></div></td>
  </tr>`).join("") : `<tr><td colspan="${labels.length}" class="empty">No equipment requests yet.</td></tr>`}</tbody></table></div>`;
}

function equipmentRequestActionButtons(row) {
  const status = String(row.status || "");
  if (/denied|cancelled|issued|returned|pdi created/i.test(status)) return "";
  return `<button class="rowbtn primary" data-equipment-request-approve="${esc(row.request_no)}">Approve</button><button class="rowbtn" data-equipment-request-deny="${esc(row.request_no)}">Deny</button>`;
}

function equipmentRequestPoAttachmentHtml(row = {}) {
  if (!row.po_attachment) return `<span class="badge warn">Required</span>`;
  const name = row.po_attachment_name || "Customer PO";
  return `<button class="rowbtn" type="button" data-open-po-attachment="${esc(row.request_no || "")}">${esc(name)}</button>`;
}

function equipmentRequestPdiWos(row) {
  const fromItems = equipmentRequestItems(row).map((item) => item.wo_no).filter(Boolean);
  const fromNotes = [...String(row.notes || "").matchAll(/WO-\d+/gi)].map((match) => match[0].toUpperCase());
  return [...new Set(fromItems.concat(fromNotes))];
}

function equipmentRequestPdiWo(row) {
  return equipmentRequestPdiWos(row)[0] || "";
}

function equipmentRequestPdiWoBadge(row) {
  const wos = equipmentRequestPdiWos(row);
  return wos.map((wo) => `<button class="rowbtn" type="button" data-equipment-request-open-wo="${esc(wo)}">${esc(wo)}</button>`).join("");
}

function equipmentRequestItems(row = {}) {
  row = row || {};
  if (Array.isArray(row.asset_items)) return row.asset_items.filter((item) => item?.asset_tag);
  if (typeof row.asset_items === "string" && row.asset_items.trim()) {
    try {
      const parsed = JSON.parse(row.asset_items);
      if (Array.isArray(parsed)) return parsed.filter((item) => item?.asset_tag);
    } catch {
      return [];
    }
  }
  return row.asset_tag ? [{ asset_id: row.asset_id || null, asset_tag: row.asset_tag, asset_name: row.asset_name || "", location: row.location || "" }] : [];
}

function equipmentRequestAssetForItem(item = {}) {
  return (productMeta.assets || []).find((asset) => {
    if (item.asset_id && asset.id === item.asset_id) return true;
    return asset.asset_tag && item.asset_tag && asset.asset_tag === item.asset_tag;
  }) || item;
}

function equipmentRequestPhotosHtml(row = {}) {
  const items = equipmentRequestItems(row);
  const photos = items.map((item) => {
    const asset = equipmentRequestAssetForItem(item);
    const src = asset.photo_url || item.photo_url || "";
    if (!src) return "";
    const label = asset.asset_tag || item.asset_tag || "Equipment photo";
    return `<button class="thumb-btn" type="button" data-equipment-request-photo="${esc(src)}" data-equipment-request-photo-title="${esc(label)}" title="Open ${esc(label)} photo"><img class="thumb" src="${esc(src)}" alt="${esc(label)}"></button>`;
  }).filter(Boolean);
  return photos.length ? `<div class="thumb-stack">${photos.join("")}</div>` : `<span class="badge">No photo</span>`;
}

function openEquipmentRequestPhoto(src, title = "Equipment photo") {
  if (!src) return;
  const win = window.open("", "_blank");
  if (!win) return alert("Allow popups to view the equipment photo.");
  const safeTitle = esc(title || "Equipment photo");
  win.document.write(`<title>${safeTitle}</title><body style="margin:0;background:#f5f7fa;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${esc(src)}" alt="${safeTitle}" style="max-width:96vw;max-height:96vh;box-shadow:0 10px 28px rgba(0,0,0,.18)"></body>`);
  win.document.close();
}

function equipmentRequestItemsText(row = {}) {
  const items = equipmentRequestItems(row);
  if (!items.length) return "";
  return items.map((item) => [item.asset_tag, item.asset_name, item.location].filter(Boolean).join(" - ")).join("; ");
}

function equipmentRequestItemsHtml(row = {}) {
  const items = equipmentRequestItems(row);
  if (!items.length) return esc(row.asset_name || "");
  return items.map((item) => `<div><strong>${esc(item.asset_tag || "")}</strong>${item.asset_name ? ` - ${esc(item.asset_name)}` : ""}${item.location ? `<br><small>${esc(item.location)}</small>` : ""}</div>`).join("");
}

function equipmentRequestCards(rows) {
  return rows.length ? rows.map((row) => `<article class="request-card" data-equipment-request-card="${esc(row.request_no)}">
    <div class="request-card-top"><strong>${esc(row.request_no || "New request")}</strong>${badge(row.status || "Requested")}</div>
    <div class="request-card-photos">${equipmentRequestPhotosHtml(row)}</div>
    <div class="request-card-main">${equipmentRequestItemsHtml(row)}</div>
    ${row.location ? `<div class="request-card-meta">Location: ${esc(row.location)}</div>` : ""}
    <div class="request-card-meta">Needed ${esc(row.from_date || "")} to ${esc(row.to_date || "")}</div>
    <div class="request-card-meta">Requested by ${esc(row.requested_by || "")}${row.po_no ? ` | PO ${esc(row.po_no)}` : ""}${row.email_address ? ` | ${esc(row.email_address)}` : ""}</div>
    <button class="rowbtn" data-equipment-request-edit="${esc(row.request_no)}">Open</button>
  </article>`).join("") : `<div class="empty">No equipment requests yet.</div>`;
}

function renderFilteredEquipmentRequests() {
  const q = ($("equipmentRequestSearch")?.value || "").toLowerCase();
  const rows = currentRows.filter((row) => !q || Object.values(row).join(" ").toLowerCase().includes(q));
  $("equipmentRequestHost").innerHTML = isEquipmentRequestUser() ? equipmentRequestCards(rows) : equipmentRequestTable(rows);
  bindEquipmentRequestRows();
}

function bindEquipmentRequestRows() {
  document.querySelectorAll("[data-equipment-request-edit]").forEach((b) => b.onclick = () => handleOpenEquipmentRequestModal(currentRows.find((row) => row.request_no === b.dataset.equipmentRequestEdit)));
  document.querySelectorAll("[data-equipment-request-delete]").forEach((b) => b.onclick = () => deleteEquipmentRequest(b.dataset.equipmentRequestDelete));
  document.querySelectorAll("[data-equipment-request-approve]").forEach((b) => b.onclick = () => approveEquipmentRequest(b.dataset.equipmentRequestApprove));
  document.querySelectorAll("[data-equipment-request-deny]").forEach((b) => b.onclick = () => denyEquipmentRequest(b.dataset.equipmentRequestDeny));
  document.querySelectorAll("[data-open-po-attachment]").forEach((b) => b.onclick = () => openEquipmentRequestPoAttachment(b.dataset.openPoAttachment));
  document.querySelectorAll("[data-equipment-request-photo]").forEach((b) => b.onclick = () => openEquipmentRequestPhoto(b.dataset.equipmentRequestPhoto, b.dataset.equipmentRequestPhotoTitle));
  document.querySelectorAll("[data-equipment-request-open-wo]").forEach((b) => b.onclick = () => {
    loadView("repairs").then(() => {
      const wo = currentRows.find((row) => row.wo_no === b.dataset.equipmentRequestOpenWo);
      if (wo) openWorkOrderEditModal(wo);
    });
  });
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
  enhanceColumnFilters();
}

function openEquipmentRequestPoAttachment(requestNo) {
  const row = currentRows.find((item) => item.request_no === requestNo);
  if (!row?.po_attachment) return alert("No PO attachment is saved on this request.");
  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow popups to view the PO attachment.");
    return;
  }
  const name = esc(row.po_attachment_name || "Customer PO");
  if (String(row.po_attachment_type || "").includes("pdf")) {
    win.document.write(`<title>${name}</title><iframe src="${esc(row.po_attachment)}" style="border:0;width:100vw;height:100vh"></iframe>`);
  } else {
    win.document.write(`<title>${name}</title><body style="margin:0;background:#f5f7fa;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${esc(row.po_attachment)}" alt="${name}" style="max-width:96vw;max-height:96vh;box-shadow:0 10px 28px rgba(0,0,0,.18)"></body>`);
  }
  win.document.close();
}

async function handleOpenEquipmentRequestModal(row = null) {
  try {
    await openEquipmentRequestModal(row);
  } catch (error) {
    const message = error?.message || "Could not open equipment request form.";
    alert(`${message}\n\nPlease refresh the page and try again. If it still happens, the equipment request database update may need to be loaded.`);
  }
}

async function openEquipmentRequestModal(row = null) {
  editing = row;
  $("modalTitle").textContent = row ? `Edit equipment request ${row.request_no || ""}` : "New equipment request";
  $("modalBody").innerHTML = `<div class="empty">Loading equipment request form...</div>`;
  $("modalSave").onclick = null;
  $("modal").style.display = "flex";
  const [assets, locations] = await Promise.all([
    Array.isArray(productMeta.assets) && productMeta.assets.length ? productMeta.assets : getAll("assets").catch(() => []),
    Array.isArray(productMeta.locations) && productMeta.locations.length ? productMeta.locations : getAll("asset_locations").then((rows) => rows.map((row) => row.name || row.location || row.value).filter(Boolean)).catch(() => []),
  ]);
  productMeta.assets = assets || [];
  productMeta.locations = locations || [];
  const requestNo = row?.request_no || await nextRefPreview("equipment_request", "ER-", "equipment_requests", "request_no");
  const items = equipmentRequestItems(row);
  $("modalSave").onclick = saveEquipmentRequestModal;
  $("modalTitle").textContent = row ? `Edit equipment request ${row.request_no}` : `New equipment request ${requestNo}`;
  $("modalBody").innerHTML = `
    <div class="form-grid equipment-request-form">
      <div class="field"><label>Request #</label><input data-equipment-request-field="request_no" value="${esc(requestNo)}" readonly></div>
      <div class="field"><label>Request date</label><input type="date" data-equipment-request-field="request_date" value="${esc(row?.request_date || localToday())}"></div>
      <div class="field wide"><label>Equipment requested</label>${equipmentRequestItemRows(items)}${assetOptionsDatalist()}</div>
      ${equipmentRequestLocationField(row?.location || "")}
      <div class="field"><label>Requested by</label><input data-equipment-request-field="requested_by" value="${esc(row?.requested_by || profile?.full_name || profile?.username || "")}" required></div>
      <div class="field"><label>Email address</label><input type="email" data-equipment-request-field="email_address" value="${esc(row?.email_address || session?.user?.email || "")}" placeholder="Approval notification email"></div>
      <div class="field"><label>PO #</label><input data-equipment-request-field="po_no" value="${esc(row?.po_no || "")}"></div>
      <div class="field wide"><label>Customer PO upload</label>${row?.po_attachment ? `<div class="attachment-current"><button class="rowbtn" type="button" id="viewExistingEquipmentPoBtn">${esc(row.po_attachment_name || "View uploaded PO")}</button><span>${esc(formatFileSize(row.po_attachment_size || 0))}</span></div>` : ""}<input type="file" accept="image/*,.pdf,application/pdf" data-equipment-po-file><input type="hidden" data-equipment-request-field="po_attachment" value="${esc(row?.po_attachment || "")}"><input type="hidden" data-equipment-request-field="po_attachment_name" value="${esc(row?.po_attachment_name || "")}"><input type="hidden" data-equipment-request-field="po_attachment_type" value="${esc(row?.po_attachment_type || "")}"><input type="hidden" data-equipment-request-field="po_attachment_size" value="${esc(row?.po_attachment_size || "")}"><small>Required. Drop or choose the customer PO. Images are compressed before saving; PDFs should be kept small.</small></div>
      <div class="field"><label>From when</label><input type="date" data-equipment-request-field="from_date" value="${esc(row?.from_date || localToday())}" required></div>
      <div class="field"><label>To when</label><input type="date" data-equipment-request-field="to_date" value="${esc(row?.to_date || row?.from_date || localToday())}" required></div>
      <div class="field"><label>Approved by</label><input data-equipment-request-field="approved_by" value="${esc(row?.approved_by || "")}" readonly placeholder="Admin approval only"></div>
      <div class="field"><label>Status</label><input data-equipment-request-field="status" value="${esc(row?.status || "Requested")}" readonly></div>
      <div class="field wide"><label>Signature box</label><canvas id="equipmentRequestSignature" class="signature-pad" width="760" height="170"></canvas><div class="actions"><button type="button" class="rowbtn" id="clearSignatureBtn">Clear signature</button></div><input type="hidden" data-equipment-request-field="requested_signature" value="${esc(row?.requested_signature || "")}"><small>Sign inside the box using a finger, mouse, or stylus.</small></div>
      <div class="field wide"><label>Notes</label><textarea data-equipment-request-field="notes">${esc(row?.notes || "")}</textarea></div>
    </div>`;
  setupSignaturePad(row?.requested_signature || "");
  const addButton = $("addEquipmentRequestItemBtn");
  if (addButton) addButton.onclick = addEquipmentRequestItemRow;
  const viewPoButton = $("viewExistingEquipmentPoBtn");
  if (viewPoButton) viewPoButton.onclick = () => openInlinePoAttachment(row);
  setupPoAttachmentUpload();
  setupEquipmentRequestItemPickers();
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateAssetMaster(b.dataset.productQuick, row));
}

function equipmentRequestItemRows(items = []) {
  const rows = items.length ? items : [{}];
  return `<div class="table-wrap"><table class="line-table equipment-request-line-table"><thead><tr><th>Photo</th><th>Equipment</th><th></th></tr></thead><tbody id="equipmentRequestItemBody">${rows.map((item, index) => equipmentRequestItemRowHtml(item, index)).join("")}</tbody></table></div><div class="actions table-actions"><button class="rowbtn" type="button" id="addEquipmentRequestItemBtn">Add equipment row</button></div>`;
}

function equipmentRequestItemRowHtml(item = {}, index = 0) {
  const asset = (productMeta.assets || []).find((row) => row.asset_tag === item.asset_tag) || item;
  const value = item.asset_tag ? assetOptionLabel(asset) : "";
  const photo = asset?.photo_url || item.photo_url || "";
  const photoHtml = photo ? `<button class="thumb-btn" type="button" data-equipment-request-photo="${esc(photo)}" data-equipment-request-photo-title="${esc(asset?.asset_tag || item.asset_tag || "Equipment photo")}"><img class="thumb" src="${esc(photo)}" alt="Equipment photo"></button>` : `<span class="badge">No photo</span>`;
  return `<tr>
    <td class="equipment-request-line-photo">${photoHtml}</td>
    <td><input class="suggest-input" list="workOrderAssetOptions" data-equipment-request-item="asset_lookup" data-line-index="${index}" value="${esc(value)}" placeholder="Search asset tag, description, make, model, serial, plate, location" autocomplete="off"></td>
    <td><button class="rowbtn danger" type="button" onclick="this.closest('tr').remove()">Remove</button></td>
  </tr>`;
}

function addEquipmentRequestItemRow() {
  const body = $("equipmentRequestItemBody");
  const index = body?.querySelectorAll("tr").length || 0;
  body?.insertAdjacentHTML("beforeend", equipmentRequestItemRowHtml({}, index));
  setupEquipmentRequestItemPickers();
}

function setupEquipmentRequestItemPickers() {
  document.querySelectorAll('[data-equipment-request-item="asset_lookup"]').forEach((input) => {
    if (input.dataset.assetPreviewReady) return;
    input.dataset.assetPreviewReady = "1";
    input.addEventListener("input", () => updateEquipmentRequestItemPhoto(input));
    input.addEventListener("change", () => updateEquipmentRequestItemPhoto(input));
  });
  document.querySelectorAll("[data-equipment-request-photo]").forEach((b) => b.onclick = () => openEquipmentRequestPhoto(b.dataset.equipmentRequestPhoto, b.dataset.equipmentRequestPhotoTitle));
}

function updateEquipmentRequestItemPhoto(input) {
  const tr = input.closest("tr");
  if (!tr) return;
  const cell = tr.querySelector(".equipment-request-line-photo");
  if (!cell) return;
  const asset = resolveAssetLookup(input.value);
  if (asset?.photo_url) {
    cell.innerHTML = `<button class="thumb-btn" type="button" data-equipment-request-photo="${esc(asset.photo_url)}" data-equipment-request-photo-title="${esc(asset.asset_tag || "Equipment photo")}"><img class="thumb" src="${esc(asset.photo_url)}" alt="Equipment photo"></button>`;
  } else {
    cell.innerHTML = `<span class="badge">No photo</span>`;
  }
  cell.querySelector("[data-equipment-request-photo]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    openEquipmentRequestPhoto(button.dataset.equipmentRequestPhoto, button.dataset.equipmentRequestPhotoTitle);
  });
}

function assetLocationOptionsDatalist() {
  if ($("assetLocationOptions")) return "";
  return `<datalist id="assetLocationOptions">${(productMeta.locations || []).map((value) => `<option value="${esc(value)}"></option>`).join("")}</datalist>`;
}

function equipmentRequestLocationField(value = "") {
  return `<div class="field"><label>Location</label><input class="suggest-input" list="assetLocationOptions" data-equipment-request-field="location" value="${esc(value || "")}" placeholder="Type to search location" autocomplete="off">${assetLocationOptionsDatalist()}</div>`;
}

function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function openInlinePoAttachment(row = {}) {
  if (!row?.po_attachment) return alert("No PO attachment is saved yet.");
  const win = window.open("", "_blank");
  if (!win) return alert("Allow popups to view the PO attachment.");
  const name = esc(row.po_attachment_name || "Customer PO");
  if (String(row.po_attachment_type || "").includes("pdf")) {
    win.document.write(`<title>${name}</title><iframe src="${esc(row.po_attachment)}" style="border:0;width:100vw;height:100vh"></iframe>`);
  } else {
    win.document.write(`<title>${name}</title><body style="margin:0;background:#f5f7fa;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${esc(row.po_attachment)}" alt="${name}" style="max-width:96vw;max-height:96vh;box-shadow:0 10px 28px rgba(0,0,0,.18)"></body>`);
  }
  win.document.close();
}

function setupPoAttachmentUpload() {
  const input = document.querySelector("[data-equipment-po-file]");
  if (!input) return;
  const field = input.closest(".field") || input.parentElement;
  if (field && !field.dataset.poDropzoneReady) {
    field.dataset.poDropzoneReady = "1";
    field.classList.add("file-dropzone");
    const hint = document.createElement("div");
    hint.className = "file-drop-hint";
    hint.textContent = "Drop customer PO here or click Choose File. Image POs are compressed automatically.";
    input.insertAdjacentElement("afterend", hint);
    const stop = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    ["dragenter", "dragover"].forEach((name) => field.addEventListener(name, (event) => {
      stop(event);
      field.classList.add("drag-over");
    }));
    ["dragleave", "drop"].forEach((name) => field.addEventListener(name, (event) => {
      stop(event);
      field.classList.remove("drag-over");
    }));
    field.addEventListener("drop", (event) => {
      const file = [...(event.dataTransfer?.files || [])].find((item) => item.type.startsWith("image/") || item.type === "application/pdf" || /\.pdf$/i.test(item.name));
      if (!file) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  input.onchange = () => previewEquipmentPoFile(input);
}

function previewEquipmentPoFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  const field = input.closest(".field") || input.parentElement;
  let preview = field.querySelector(".po-upload-preview");
  if (!preview) {
    preview = document.createElement("div");
    preview.className = "attachment-current po-upload-preview";
    input.insertAdjacentElement("beforebegin", preview);
  }
  preview.textContent = `${file.name} (${formatFileSize(file.size)})`;
}

async function prepareEquipmentRequestPoAttachment(file) {
  if (!file) return null;
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const prepared = isPdf ? file : await resizeImageForUpload(file, { maxSide: 1100, quality: 0.62 });
  const maxBytes = isPdf ? 6 * 1024 * 1024 : 1.8 * 1024 * 1024;
  if (prepared.size > maxBytes) {
    throw new Error(isPdf
      ? "The PO PDF is too large. Please upload a PDF under 6 MB."
      : "The PO image is still too large after compression. Please choose a smaller image.");
  }
  const dataUrl = await fileToDataUrl(prepared);
  return {
    po_attachment: dataUrl,
    po_attachment_name: prepared.name || file.name || "customer-po",
    po_attachment_type: prepared.type || file.type || "application/octet-stream",
    po_attachment_size: prepared.size || file.size || 0,
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function setupSignaturePad(existing = "") {
  const canvas = $("equipmentRequestSignature");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hidden = document.querySelector('[data-equipment-request-field="requested_signature"]');
  const drawBase = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#d3dee8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.stroke();
  };
  drawBase();
  if (existing) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = existing;
  }
  let drawing = false;
  let signed = Boolean(existing);
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches?.[0] || event;
    return { x: (touch.clientX - rect.left) * (canvas.width / rect.width), y: (touch.clientY - rect.top) * (canvas.height / rect.height) };
  };
  const start = (event) => {
    drawing = true;
    signed = true;
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    event.preventDefault();
  };
  const move = (event) => {
    if (!drawing) return;
    const p = point(event);
    ctx.strokeStyle = "#122333";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hidden.value = canvas.toDataURL("image/png");
    event.preventDefault();
  };
  const end = () => {
    if (signed) hidden.value = canvas.toDataURL("image/png");
    drawing = false;
  };
  canvas.onmousedown = start;
  canvas.onmousemove = move;
  canvas.onmouseup = end;
  canvas.onmouseleave = end;
  canvas.ontouchstart = start;
  canvas.ontouchmove = move;
  canvas.ontouchend = end;
  $("clearSignatureBtn").onclick = () => {
    drawBase();
    signed = false;
    hidden.value = "";
  };
}

async function saveEquipmentRequestModal() {
  const read = (field) => document.querySelector(`[data-equipment-request-field="${field}"]`)?.value?.trim() || "";
  try {
    const items = parseEquipmentRequestItemRows();
    const asset = items[0];
    const fromDate = read("from_date");
    const toDate = read("to_date");
    if (!items.length) return alert("Choose at least one equipment asset from the search list.");
    if (!read("requested_by")) return alert("Requested by is required.");
    if (!fromDate || !toDate) return alert("From when and To when are required.");
    if (toDate < fromDate) return alert("To when cannot be earlier than From when.");
    const poFile = document.querySelector("[data-equipment-po-file]")?.files?.[0];
    const preparedPo = poFile ? await prepareEquipmentRequestPoAttachment(poFile) : null;
    if (!preparedPo && !read("po_attachment")) return alert("Customer PO upload is required before submitting the equipment request.");
    const record = {
      request_no: read("request_no"),
      request_date: read("request_date") || localToday(),
      asset_id: asset.id || null,
      asset_tag: asset.asset_tag,
      asset_name: asset.name || asset.description || "",
      location: read("location") || null,
      asset_items: items,
      requested_by: read("requested_by"),
      email_address: read("email_address") || null,
      requested_signature: read("requested_signature") || null,
      po_no: read("po_no") || null,
      po_attachment: preparedPo?.po_attachment || read("po_attachment") || null,
      po_attachment_name: preparedPo?.po_attachment_name || read("po_attachment_name") || null,
      po_attachment_type: preparedPo?.po_attachment_type || read("po_attachment_type") || null,
      po_attachment_size: preparedPo?.po_attachment_size || Number(read("po_attachment_size") || 0) || null,
      from_date: fromDate,
      to_date: toDate,
      approved_by: read("approved_by") || null,
      status: editing?.status || "Requested",
      notes: read("notes") || null,
    };
    await upsertOneWithOptionalColumns("equipment_requests", record, "request_no", ["location", "email_address", "asset_items"], "Saved the equipment request. Some multi-equipment request columns need the latest equipment request database update before they can be stored.");
    if (!editing) await incrementSequence("equipment_request");
    for (const item of items) {
      await supabase.from("assets").update({ requested_by: record.requested_by, approved_by: record.approved_by }).eq("asset_tag", item.asset_tag);
    }
    closeModal();
    await loadView("equipmentrequests");
  } catch (error) {
    alert(error.message || "Could not save equipment request.");
  }
}

function parseEquipmentRequestItemRows() {
  const rows = [];
  const invalid = [];
  const requestLocation = document.querySelector('[data-equipment-request-field="location"]')?.value?.trim() || "";
  [...document.querySelectorAll("#equipmentRequestItemBody tr")].forEach((tr) => {
    const lookup = tr.querySelector('[data-equipment-request-item="asset_lookup"]')?.value || "";
    const asset = resolveAssetLookup(lookup);
    if (!lookup.trim()) return;
    if (!asset?.asset_tag) {
      invalid.push(lookup.trim());
      return;
    }
    if (rows.some((row) => row.asset_tag === asset.asset_tag)) return;
    rows.push({
      asset_id: asset.id || null,
      asset_tag: asset.asset_tag,
      asset_name: asset.name || asset.description || "",
      location: requestLocation,
    });
  });
  if (invalid.length) throw new Error(`Choose equipment from the dropdown for: ${invalid.join(", ")}`);
  return rows;
}

async function deleteEquipmentRequest(requestNo) {
  if (!confirm(`Delete equipment request ${requestNo}?`)) return;
  const { error } = await supabase.from("equipment_requests").delete().eq("request_no", requestNo);
  if (error) return alert(error.message);
  await renderEquipmentRequestsView();
}

async function approveEquipmentRequest(requestNo) {
  const request = currentRows.find((row) => row.request_no === requestNo);
  if (!request) return;
  if (!confirm(`Approve equipment request ${requestNo}?`)) return;
  try {
    if (!productMeta.assets?.length) productMeta.assets = await getAll("assets");
    const requestItems = equipmentRequestItems(request);
    if (!requestItems.length) throw new Error("This request has no valid equipment lines. Edit the request and choose at least one equipment asset first.");
    const approver = profile?.full_name || profile?.username || session?.user?.email || "Approved";
    const workOrders = await getAll("work_orders");
    const decisions = [];
    for (const item of requestItems) {
      const asset = (productMeta.assets || []).find((row) => row.id === item.asset_id || row.asset_tag === item.asset_tag) || item;
      if (!asset?.asset_tag) throw new Error(`Could not find equipment ${item.asset_tag || item.asset_name || ""}. Edit the request and choose an equipment asset from the list.`);
      const label = [asset.asset_tag, item.asset_name || asset.name].filter(Boolean).join(" - ");
      const createPdi = confirm(`Create a Pre Delivery Inspection work order for ${label}?\n\nOK = create PDI for this equipment\nCancel = approve this equipment without PDI`);
      let woNo = item.wo_no || "";
      if (createPdi) {
        const existing = workOrders.find((wo) => String(wo.notes || "").includes(`equipment request ${requestNo}`) && String(wo.asset_tag || "") === asset.asset_tag);
        woNo = existing?.wo_no || item.wo_no || await createEquipmentRequestPdiWorkOrder(request, item, asset, approver);
        if (!existing && !workOrders.some((wo) => wo.wo_no === woNo)) workOrders.push({ wo_no: woNo, asset_tag: asset.asset_tag, notes: `equipment request ${requestNo}` });
      }
      decisions.push({ ...item, asset_id: asset.id || item.asset_id || null, asset_tag: asset.asset_tag, asset_name: item.asset_name || asset.name || "", location: item.location || request.location || asset.location || "", pdi_required: Boolean(createPdi), wo_no: woNo || "", status: createPdi ? "Approved - PDI Created" : "Approved" });
      await updateOneWithOptionalColumns("assets", {
        requested_by: request.requested_by || null,
        approved_by: approver,
        location: item.location || request.location || asset.location || null,
        return_date: request.to_date || null,
        last_update_date: localToday(),
        status: createPdi ? woNo : (asset.status || "Approved"),
        notes: appendDatedNote(asset.notes, createPdi ? `Equipment request ${requestNo} approved; PDI work order ${woNo} created.` : `Equipment request ${requestNo} approved without PDI work order.`),
      }, "asset_tag", asset.asset_tag, ["return_date", "requested_by", "approved_by"], "Request approved. Some optional fleet fields need the latest asset database update before they can be stored.");
    }
    const pdiCount = decisions.filter((item) => item.wo_no).length;
    const status = pdiCount === decisions.length ? "Approved - PDI Created" : pdiCount ? "Approved - Partial PDI" : "Approved";
    const summary = decisions.map((item) => `${item.asset_tag}: ${item.wo_no ? `PDI ${item.wo_no}` : "no PDI"}`).join("; ");
    const notes = appendDatedNote(request.notes, `${approver} approved request. ${summary}.`);
    await updateOneWithOptionalColumns("equipment_requests", {
      status,
      approved_by: approver,
      notes,
      asset_items: decisions,
    }, "request_no", requestNo, ["asset_items"], "Approved the request. The multi-equipment item detail needs the latest equipment request database update before it can be stored.");
    notifyEquipmentRequestApproved({ ...request, status, approved_by: approver, asset_items: decisions }, decisions, approver);
    await renderEquipmentRequestsView();
  } catch (error) {
    alert(error.message || "Could not approve equipment request.");
  }
}

async function createEquipmentRequestPdiWorkOrder(request, item, asset, approver) {
  const woNo = await nextRefPreview("wo", "WO-", "work_orders", "wo_no");
  const description = [
    `Pre Delivery Inspection for equipment request ${request.request_no}.`,
    `Asset: ${asset.asset_tag} ${item.asset_name || asset.name || ""}.`,
    request.requested_by ? `Requested by: ${request.requested_by}.` : "",
    request.po_no ? `PO #: ${request.po_no}.` : "",
    request.from_date || request.to_date ? `Needed ${request.from_date || ""} to ${request.to_date || ""}.` : "",
  ].filter(Boolean).join(" ");
  const saved = await upsertOne("work_orders", {
    wo_no: woNo,
    wo_date: localToday(),
    asset_id: asset.id || item.asset_id || null,
    asset_tag: asset.asset_tag,
    bill_to_customer: null,
    customer_po: null,
    manager_override: false,
    override_by: null,
    override_reason: null,
    work_type: "Pre Delivery Inspection",
    priority: "Medium",
    vendor_shop: null,
    odometer: Number(asset.odometer || 0),
    engine_hours: Number(asset.engine_hours || 0),
    description,
    status: "Open",
    next_due_date: null,
    next_due_odometer: 0,
    next_due_hours: 0,
    invoice_no: null,
    notes: `Auto-created from equipment request ${request.request_no}. PDI work order ${woNo}. Approved by ${approver}.`,
  }, "wo_no");
  await upsertMany("work_order_issues", [{
    wo_id: saved.id,
    issue_date: localToday(),
    issue: "Pre Delivery Inspection",
    status: "Open",
    assigned_mechanic: null,
    work_notes: `Created from equipment request ${request.request_no}.`,
  }], "id");
  await incrementSequence("wo");
  return woNo;
}

function notifyEquipmentRequestApproved(request, decisions = [], approver) {
  const email = String(request?.email_address || "").trim();
  if (!email) return;
  const subject = `Equipment request ${request.request_no} approved`;
  const lines = (decisions.length ? decisions : equipmentRequestItems(request)).map((item) => {
    const pdi = item.wo_no ? `PDI work order: ${item.wo_no}` : "PDI: not required";
    return `${item.asset_tag || ""} ${item.asset_name || ""}${item.location ? ` | Location: ${item.location}` : ""} | ${pdi}`;
  });
  const body = [
    `Your equipment request ${request.request_no} has been approved.`,
    lines.length ? `Equipment:\n${lines.join("\n")}` : "",
    request.from_date || request.to_date ? `Requested dates: ${request.from_date || ""} to ${request.to_date || ""}` : "",
    approver ? `Approved by: ${approver}` : "",
  ].filter(Boolean).join("\n");
  openEmailDraftPrompt({
    title: "Approval email ready",
    message: `Equipment request ${request.request_no} was approved. Open an email draft to ${email}?`,
    email,
    subject,
    body,
  });
}

function openEmailDraftPrompt({ title, message, email, subject, body }) {
  $("modalTitle").textContent = title || "Email draft";
  $("modalBody").innerHTML = `
    <div class="email-draft-card">
      <p>${esc(message || "Open an email draft?")}</p>
      <div class="kv-list">
        <div><strong>To</strong><span>${esc(email || "")}</span></div>
        <div><strong>Subject</strong><span>${esc(subject || "")}</span></div>
      </div>
      <textarea readonly class="email-preview">${esc(body || "")}</textarea>
      <p class="notice">This uses the email account already set up on this computer. Review the draft, then click Send in your email app.</p>
    </div>`;
  $("modalSave").style.display = "";
  $("modalSave").textContent = "Open Email Draft";
  $("modalSave").onclick = () => {
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    closeModal();
  };
  $("modalCancel").textContent = "Close";
  $("modal").style.display = "flex";
}

async function denyEquipmentRequest(requestNo) {
  const request = currentRows.find((row) => row.request_no === requestNo);
  if (!request) return;
  const reason = prompt(`Deny ${requestNo}? Optional reason:`, "");
  if (reason === null) return;
  try {
    const deniedBy = profile?.full_name || profile?.username || session?.user?.email || "Denied";
    const { error } = await supabase.from("equipment_requests").update({
      status: "Denied",
      approved_by: deniedBy,
      notes: appendDatedNote(request.notes, `${deniedBy} denied request.${reason ? ` Reason: ${reason}` : ""}`),
    }).eq("request_no", requestNo);
    if (error) throw error;
    if (request.asset_tag) {
      const asset = (productMeta.assets || []).find((row) => row.asset_tag === request.asset_tag);
      await supabase.from("assets").update({
        requested_by: request.requested_by || null,
        approved_by: deniedBy,
        notes: appendDatedNote(asset?.notes, `Equipment request ${requestNo} denied.${reason ? ` Reason: ${reason}` : ""}`),
      }).eq("asset_tag", request.asset_tag);
    }
    await renderEquipmentRequestsView();
  } catch (error) {
    alert(error.message || "Could not deny equipment request.");
  }
}

function appendDatedNote(existing, note) {
  const line = `[${new Date().toLocaleString()}] ${note}`;
  return [existing, line].filter(Boolean).join("\n");
}

function equipmentRepairQueueTable(rows) {
  const heads = ["Asset #", "Description", "Location", "GPS", "Operator", "Requested By", "Approved By", "PO #", "Status", "Issue / Request", "Assigned WO", ""];
  return `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th>${esc(h)}</th>`).join("")}</tr><tr>${heads.map((h, i) => h ? `<th><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(h)}"></th>` : "<th></th>").join("")}</tr></thead><tbody>${rows.length ? rows.map((asset) => `<tr>
    <td>${esc(asset.asset_tag || "")}</td>
    <td>${esc(asset.name || "")}</td>
    <td>${esc(asset.location || "")}</td>
    <td>${gpsCellHtml(asset.gps_location)}</td>
    <td>${esc(asset.assigned_operator || "")}</td>
    <td>${esc(asset.requested_by || "")}</td>
    <td>${esc(asset.approved_by || "")}</td>
    <td>${esc(asset.repair_po_no || "")}</td>
    <td>${badge(asset.status || "")}</td>
    <td>${esc(asset._openWo?.description || repairRequestText(asset) || "")}</td>
    <td>${asset._openWo ? badge(asset._openWo.wo_no || "") : ""}</td>
    <td><div class="rowactions">${asset._openWo ? `<button class="rowbtn" type="button" data-open-wo="${esc(asset._openWo.wo_no)}">Open WO</button>` : `<button class="rowbtn primary" type="button" data-create-wo-asset="${esc(asset.asset_tag)}">Assign WO</button><button class="rowbtn" type="button" data-asset-operational="${esc(asset.asset_tag)}">Make operational</button>`}</div></td>
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
  document.querySelectorAll("[data-asset-operational]").forEach((b) => b.onclick = () => markAssetOperational(b.dataset.assetOperational));
  document.querySelectorAll("[data-open-wo]").forEach((b) => b.onclick = () => {
    loadView("repairs").then(() => {
      const wo = currentRows.find((row) => row.wo_no === b.dataset.openWo);
      if (wo) openWorkOrderEditModal(wo);
    });
  });
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

async function markAssetOperational(assetTag) {
  const asset = currentRows.find((row) => row.asset_tag === assetTag) || (productMeta.assets || []).find((row) => row.asset_tag === assetTag);
  if (!asset) return;
  if (!confirm(`Mark ${asset.asset_tag} as operational?\n\nThis clears it from Equipment Subject to Repair without creating a work order.`)) return;
  try {
    const stamp = new Date().toLocaleString();
    const notes = [asset.notes || "", `Marked operational ${stamp}`].filter(Boolean).join("\n");
    const { error } = await supabase.from("assets").update({ status: "Operational", notes, last_update_date: localToday() }).eq("asset_tag", asset.asset_tag);
    if (error) throw error;
    await renderEquipmentRepairQueueView();
  } catch (error) {
    alert(error.message || error);
  }
}

function attachOpenWorkOrderToAssets(assets, workOrders) {
  const openByAsset = new Map();
  (workOrders || [])
    .filter((wo) => wo.asset_tag && !wo.invoice_no && !/closed|complete|invoiced|void|cancel/i.test(wo.status || ""))
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

function assetSummaryCollapsed() {
  return localStorage.getItem(ASSET_SUMMARY_STORAGE_KEY) === "1";
}

function assetFiltersCollapsed() {
  return localStorage.getItem(ASSET_FILTER_STORAGE_KEY) === "1";
}

function toggleAssetSummary() {
  const collapsed = !assetSummaryCollapsed();
  localStorage.setItem(ASSET_SUMMARY_STORAGE_KEY, collapsed ? "1" : "0");
  const body = $("assetSummaryBody");
  if (body) body.hidden = collapsed;
  const button = $("assetSummaryToggle");
  if (button) button.textContent = collapsed ? "Show summary" : "Hide summary";
}

function toggleAssetFilters() {
  const collapsed = !assetFiltersCollapsed();
  localStorage.setItem(ASSET_FILTER_STORAGE_KEY, collapsed ? "1" : "0");
  const wrap = document.querySelector(".asset-table-wrap");
  if (wrap) wrap.classList.toggle("filters-collapsed", collapsed);
  const button = $("assetFilterToggle");
  if (button) button.textContent = collapsed ? "Show filters" : "Hide filters";
}

function assetTableHtml(rows) {
  const columns = assetVisibleColumns();
  const heads = [...columns.map((col) => col[1]), ""];
  const header = columns.map(([key, label]) => `<th class="asset-col-${esc(key)}" data-col-key="${esc(key)}">${esc(label)}</th>`).join("");
  const filters = columns.map(([key, label], i) => `<th class="asset-col-${esc(key)}" data-col-key="${esc(key)}"><input class="column-filter" data-col="${i}" placeholder="Filter ${esc(label)}"></th>`).join("");
  return `<div class="table-wrap asset-table-wrap ${assetFiltersCollapsed() ? "filters-collapsed" : ""}"><table class="asset-table"><thead><tr>${header}<th class="asset-col-actions"></th></tr><tr class="asset-filter-row">${filters}<th class="asset-col-actions"></th></tr></thead><tbody>${rows.length ? rows.map((asset) => assetRowHtml(asset, columns)).join("") : `<tr><td colspan="${heads.length}" class="empty">No fleet or equipment yet.</td></tr>`}</tbody></table></div>`;
}

function assetRowHtml(asset, columns = assetVisibleColumns()) {
  const woButton = asset._openWo
    ? `<button class="rowbtn" type="button" data-asset-open-wo="${esc(asset.asset_tag)}">Open WO</button>`
    : `<button class="rowbtn" type="button" data-asset-new-wo="${esc(asset.asset_tag)}">New WO</button>`;
  return `<tr data-asset-row="${esc(asset.asset_tag || "")}">
    ${columns.map(([key]) => `<td class="asset-col-${esc(key)}" data-col-key="${esc(key)}">${assetCellHtml(asset, key)}</td>`).join("")}
    <td class="asset-col-actions"><div class="rowactions">${woButton}<button class="rowbtn" type="button" data-asset-history="${esc(asset.asset_tag)}">History</button><button class="rowbtn" type="button" data-asset-loc="${esc(asset.asset_tag)}">Loc</button><button class="rowbtn" type="button" data-asset-edit="${esc(asset.asset_tag)}">Edit</button><button class="rowbtn danger" type="button" data-asset-delete="${esc(asset.asset_tag)}">Delete</button></div></td>
  </tr>`;
}

function assetCellHtml(asset, key) {
  const qrText = assetQrUrl(asset);
  const reading = asset.odometer ? `${asset.odometer} mi` : asset.engine_hours ? `${asset.engine_hours} hr` : "";
  const parent = asset.parent_asset_tag ? currentRows.find((row) => row.asset_tag === asset.parent_asset_tag) : null;
  const parentText = parent ? `${parent.asset_tag} - ${parent.name || ""}` : asset.parent_asset_tag || "";
  const oldQrCode = assetOldQrCode(asset);
  const lastUpdateDate = assetLastUpdateDate(asset);
  const photoTitle = asset.asset_tag || asset.name || "Asset photo";
  const cells = {
    photo: asset.photo_url ? `<button class="thumb-btn asset-photo-btn" type="button" data-asset-photo="${esc(asset.asset_tag || "")}" title="Enlarge ${esc(photoTitle)} photo"><img class="thumb" src="${esc(asset.photo_url)}" alt="Photo"><span class="photo-zoom" aria-hidden="true">&#128269;</span></button>` : `<span class="badge">No photo</span>`,
    new_qr: `<button class="qr-button qr-tag" type="button" data-asset-qr="${esc(asset.asset_tag)}" title="Open QR code"><img class="qr" src="${qrCodeUrl(qrText)}" alt="QR"><span>${esc(asset.asset_tag || "")}</span></button>`,
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
    size: esc(asset.size || ""),
    vin_serial: esc(asset.vin_serial || ""),
    plate: esc(asset.plate || ""),
    location: esc(asset.location || ""),
    gps_location: gpsCellHtml(asset.gps_location),
    last_update_date: esc(lastUpdateDate || ""),
    scanned_date: esc(asset.scanned_date || ""),
    return_date: esc(asset.return_date || ""),
    reading: esc(reading),
    assigned_operator: esc(asset.assigned_operator || ""),
    requested_by: esc(asset.requested_by || ""),
    approved_by: esc(asset.approved_by || ""),
    repair_po_no: esc(asset.repair_po_no || ""),
    open_wo_issue: asset._openWo ? `<strong>${esc(asset._openWo.wo_no || "")}</strong><br>${esc(asset._openWo.description || asset._openWo.status || "")}` : esc(asset.notes && /repair requested/i.test(asset.notes) ? asset.notes : ""),
    status: badge(asset.status || ""),
  };
  return cells[key] ?? esc(asset[key] || "");
}

function gpsCellHtml(value) {
  const gps = String(value || "").trim();
  if (!gps) return "";
  const mapsUrl = /^https?:\/\//i.test(gps) ? gps : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gps)}`;
  return `<a class="linkbtn" href="${esc(mapsUrl)}" target="_blank" rel="noopener">${esc(gps)}</a>`;
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
  document.querySelectorAll("[data-asset-new-wo]").forEach((b) => b.onclick = () => openAssetWorkOrder(b.dataset.assetNewWo, false));
  document.querySelectorAll("[data-asset-open-wo]").forEach((b) => b.onclick = () => openAssetWorkOrder(b.dataset.assetOpenWo, true));
  document.querySelectorAll("[data-asset-history]").forEach((b) => b.onclick = () => openAssetHistoryModal(b.dataset.assetHistory));
  document.querySelectorAll("[data-asset-qr]").forEach((b) => b.onclick = () => openAssetQrModal(currentRows.find((asset) => asset.asset_tag === b.dataset.assetQr)));
  document.querySelectorAll("[data-asset-photo]").forEach((b) => b.onclick = () => openAssetPhotoModal(currentRows.find((asset) => asset.asset_tag === b.dataset.assetPhoto)));
  document.querySelectorAll("[data-asset-needs-qr]").forEach((box) => box.onchange = () => updateAssetQrPrintNeed(box.dataset.assetNeedsQr, box.checked));
  document.querySelectorAll(".column-filter").forEach((input) => input.oninput = applyColumnFilters);
}

function openAssetPhotoModal(asset) {
  if (!asset?.photo_url) return;
  const title = asset.asset_tag || asset.name || "Asset photo";
  $("modalTitle").textContent = `Asset photo - ${title}`;
  $("modalBody").innerHTML = `
    <div class="image-preview-panel">
      <img class="image-preview-large" src="${esc(asset.photo_url)}" alt="${esc(title)} photo">
      <div class="image-preview-caption">
        <strong>${esc(asset.asset_tag || "")}</strong>
        <span>${esc(asset.name || asset.description || "")}</span>
      </div>
    </div>`;
  $("modalSave").onclick = closeModal;
  $("modalSave").textContent = "Close";
  $("modal").style.display = "flex";
}

async function openAssetWorkOrder(assetTag, preferOpen = false) {
  const asset = currentRows.find((row) => row.asset_tag === assetTag) || (productMeta.assets || []).find((row) => row.asset_tag === assetTag);
  if (!asset) return;
  const openWo = asset._openWo || (productMeta.workOrders || []).find((wo) => String(wo.asset_tag || "").toLowerCase() === String(assetTag || "").toLowerCase() && mechanicWorkOrderOpenForPortal(wo));
  await loadView("repairs");
  if (preferOpen && openWo) {
    const fullWo = currentRows.find((wo) => wo.wo_no === openWo.wo_no) || openWo;
    openWorkOrderEditModal(fullWo);
    return;
  }
  openNewWorkOrderModal({ assetTag, description: asset._openWoIssue || "" });
}

async function openAssetHistoryModal(assetTag) {
  const asset = currentRows.find((row) => row.asset_tag === assetTag) || (productMeta.assets || []).find((row) => row.asset_tag === assetTag);
  if (!asset) return;
  $("modalTitle").textContent = `Equipment history - ${assetTag}`;
  $("modalBody").innerHTML = `<div class="empty">Loading equipment history...</div>`;
  $("modalSave").onclick = closeModal;
  $("modalSave").textContent = "Close";
  $("modal").style.display = "flex";
  try {
    const [workOrders, parts, labor, issues] = await Promise.all([
      getAll("work_orders"),
      getAll("work_order_parts"),
      getAll("work_order_labor"),
      getAll("work_order_issues"),
    ]);
    const assetWos = workOrders.filter((wo) => String(wo.asset_tag || "").toLowerCase() === String(assetTag || "").toLowerCase());
    const woIds = new Set(assetWos.map((wo) => wo.id));
    const woNoById = new Map(assetWos.map((wo) => [wo.id, wo.wo_no]));
    const partRows = parts.filter((part) => woIds.has(part.wo_id));
    const laborRows = labor.filter((row) => woIds.has(row.wo_id));
    const issueRows = issues.filter((row) => woIds.has(row.wo_id));
    $("modalBody").innerHTML = `
      <div class="form-grid compact">
        <div class="stat"><span>Work orders</span><strong>${assetWos.length}</strong></div>
        <div class="stat"><span>Parts lines</span><strong>${partRows.length}</strong></div>
        <div class="stat"><span>Labor hours</span><strong>${laborRows.reduce((sum, row) => sum + laborHours(row), 0).toFixed(2)}</strong></div>
      </div>
      <section class="subpanel">
        <div class="panel-title"><strong>Work order history</strong><span>Repair status, issues, parts, and labor tied to this asset.</span></div>
        <div class="table-wrap"><table><thead><tr><th>WO #</th><th>Date</th><th>Status</th><th>Issues</th><th>Parts Used</th><th>Labor</th></tr></thead><tbody>
          ${assetWos.length ? assetWos.map((wo) => {
            const woIssues = issueRows.filter((row) => row.wo_id === wo.id).map((row) => row.issue).filter(Boolean).join("; ") || wo.description || "";
            const woParts = partRows.filter((row) => row.wo_id === wo.id).map((row) => `${partDisplayName(row)} (${row.accepted_qty || row.qty_needed || 0})`).join("; ") || "No parts";
            const woLabor = laborRows.filter((row) => row.wo_id === wo.id).reduce((sum, row) => sum + laborHours(row), 0);
            return `<tr><td>${esc(wo.wo_no)}</td><td>${esc(wo.wo_date || "")}</td><td>${badge(wo.status || "Open")}</td><td>${esc(woIssues)}</td><td>${esc(woParts)}</td><td>${woLabor.toFixed(2)} hr</td></tr>`;
          }).join("") : `<tr><td colspan="6" class="empty">No work orders found for this asset.</td></tr>`}
        </tbody></table></div>
      </section>
      <section class="subpanel">
        <div class="panel-title"><strong>Parts detail</strong><span>Every requested, reserved, accepted, or released part tied to this asset.</span></div>
        <div class="table-wrap"><table><thead><tr><th>WO #</th><th>Part</th><th>Needed</th><th>Accepted</th><th>Status</th><th>Cost</th></tr></thead><tbody>
          ${partRows.length ? partRows.map((row) => `<tr><td>${esc(woNoById.get(row.wo_id) || "")}</td><td>${esc(partDisplayName(row))}</td><td>${esc(row.qty_needed ?? "")}</td><td>${esc(row.accepted_qty ?? 0)}</td><td>${badge(effectivePartStatus(row))}</td><td>${money(row.unit_cost || 0)}</td></tr>`).join("") : `<tr><td colspan="6" class="empty">No parts history found for this asset.</td></tr>`}
        </tbody></table></div>
      </section>`;
  } catch (error) {
    $("modalBody").innerHTML = `<div class="notice error">${esc(error.message || error)}</div>`;
  }
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
  const qrText = assetQrUrl(asset);
  $("modalTitle").textContent = `QR code - ${asset.asset_tag}`;
  $("modalBody").innerHTML = `
    <div class="qr-card">
      <div class="qr-tag qr-tag-large">
        <img class="qr-large" src="${qrCodeUrl(qrText, 420)}" alt="QR code for ${esc(asset.asset_tag)}">
        <span>${esc(asset.asset_tag || "")}</span>
      </div>
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
    .qr-label{display:inline-flex;flex-direction:column;align-items:center;gap:10px;border:3px solid #111827;border-radius:10px;padding:18px;background:#fff}
    img{width:360px;height:360px}
    .asset-no{font-size:34px;font-weight:800;letter-spacing:.03em;line-height:1}
    h1{font-size:32px;margin:18px 0 8px}
    p{margin:0 0 10px;color:#4b5563}
    code{display:block;word-break:break-all;font-size:11px;color:#4b5563;margin-top:16px}
  </style></head><body>
    <div class="qr-label">
      <img src="${qrCodeUrl(qrText, 480)}" alt="QR">
      <div class="asset-no">${esc(asset.asset_tag || "")}</div>
    </div>
    <h1>${esc(asset.asset_tag)}</h1>
    <p>${esc(asset.name || "")}</p>
    <code>${esc(qrText)}</code>
    <script>window.onload=()=>{window.print();};<\/script>
  </body></html>`);
  win.document.close();
}

async function openAssetModal(asset = null) {
  editing = asset;
  const defaultType = asset?.type || "Vehicle";
  const assetTag = asset?.asset_tag || await nextAssetTagForType(defaultType);
  const qrPreviewUrl = assetQrUrl(asset || { asset_tag: assetTag, vin_serial: "" });
  const parentOptions = (productMeta.assets || [])
    .filter((row) => row.asset_tag && row.asset_tag !== assetTag)
    .map((row) => assetOptionLabel(row));
  const parentValue = asset?.parent_asset_tag
    ? assetOptionLabel((productMeta.assets || []).find((row) => row.asset_tag === asset.parent_asset_tag) || { asset_tag: asset.parent_asset_tag, name: "" })
    : "";
  const compatibleOptions = compatibleAssetOptions(assetTag);
  const generalTypeOptions = [...new Set((productMeta.assets || [])
    .map((row) => row.general_type || row.type)
    .concat(["Vehicle", "Heavy Equipment", "Trailer", "Attachment", "Generator", "Equipment"])
    .map((value) => String(value || "").trim())
    .filter(Boolean))];
  $("modalTitle").textContent = asset ? "Edit vehicle or equipment" : "Add vehicle or equipment";
  $("modalBody").innerHTML = `
    <div class="form-grid">
      <div class="field"><label>Equipment photo</label>${asset?.photo_url ? `<img class="thumb large" src="${esc(asset.photo_url)}" alt="Photo">` : ""}<input type="file" accept="image/*" data-asset-file="photo_url"><input type="hidden" data-product-field="photo_url" value="${esc(asset?.photo_url || "")}"></div>
      <div class="field"><label>New scan QR code</label><img class="qr" src="${qrCodeUrl(qrPreviewUrl)}" alt="QR"><input type="hidden" data-product-field="qr_update_url" value="${esc(qrPreviewUrl)}"></div>
      ${productInput("Asset tag", "asset_tag", assetTag)}
      ${productSelect("Type of equipment", "type", productMeta.assetTypes || ["Vehicle", "Heavy Equipment", "Trailer"], defaultType, "New type")}
      ${productSelect("General type", "general_type", generalTypeOptions, asset?.general_type || "", "New general type")}
      ${productInput("Name", "name", asset?.name || "")}
      ${productInput("Make", "make", asset?.make || "")}
      ${productInput("Model", "model", asset?.model || "")}
      ${productInput("Year", "year", asset?.year || "")}
      ${productInput("Color", "color", asset?.color || "")}
      ${productInput("Size", "size", asset?.size || "")}
      ${productInput("VIN / Serial", "vin_serial", asset?.vin_serial || "")}
      ${productInput("Plate", "plate", asset?.plate || "")}
      ${productInput("Old QR Code", "old_qr_code", assetOldQrCode(asset || { asset_tag: assetTag }))}
      ${productInput("QR printed / tagged", "qr_printed_tagged", asset?.qr_printed_tagged || "")}
      ${productSelect("Parent asset", "parent_asset_tag", parentOptions, parentValue)}
      ${productSelect("Relationship", "relationship_type", ["Standalone", "Parent equipment", "Attachment", "Component", "Compatible accessory"], asset?.relationship_type || "Standalone")}
      <div class="field wide"><label>Compatible with</label><input class="suggest-input" list="assetCompatibleOptions" data-product-field="compatible_with" value="${esc(asset?.compatible_with || "")}" placeholder="Type asset, model, attachment family, or keyword" autocomplete="off"><datalist id="assetCompatibleOptions">${compatibleOptions.map((value) => `<option value="${esc(value)}"></option>`).join("")}</datalist><small>Optional. Choose an asset from the list or type your own compatibility note.</small></div>
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
      ${productInput("Last update date", "last_update_date", assetLastUpdateDate(asset || {}), "date")}
      ${productInput("Latest scanned date", "scanned_date", asset?.scanned_date || "", "datetime-local")}
      ${productInput("Return date", "return_date", asset?.return_date || "", "date")}
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(asset?.notes || "")}</textarea></div>
    </div>`;
  $("modalSave").onclick = saveAssetModal;
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateAssetMaster(b.dataset.productQuick, asset));
  const tagInput = document.querySelector('[data-product-field="asset_tag"]');
  const typeInput = document.querySelector('[data-product-field="type"]');
  if (tagInput && typeInput && !asset) {
    tagInput.dataset.autoAssetTag = "1";
    tagInput.addEventListener("input", () => tagInput.dataset.autoAssetTag = "0");
    typeInput.addEventListener("change", async () => {
      if (tagInput.dataset.autoAssetTag !== "1") return;
      tagInput.value = await nextAssetTagForType(typeInput.value);
    });
  }
  setupImageDropzones($("modalBody"));
}

async function nextAssetTagForType(type) {
  const typeText = String(type || "").trim();
  const assets = (productMeta.assets || currentRows || []).filter((row) => String(row.type || "").trim().toLowerCase() === typeText.toLowerCase());
  let best = null;
  assets.forEach((asset) => {
    const tag = String(asset.asset_tag || "").trim();
    const match = tag.match(/^(.*?)(\d+)$/);
    if (!match) return;
    const num = Number(match[2]);
    if (!best || num > best.num) best = { prefix: match[1], num, width: match[2].length };
  });
  if (best) return `${best.prefix}${String(best.num + 1).padStart(best.width, "0")}`;
  const initials = typeText
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 4) || "AST";
  const prefix = `LMS-${initials}-`;
  const allAssets = productMeta.assets || currentRows || [];
  const max = allAssets.reduce((highest, asset) => {
    const tag = String(asset.asset_tag || "");
    const match = tag.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`, "i"));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function compatibleAssetOptions(currentAssetTag = "") {
  const options = [];
  (productMeta.assets || []).forEach((asset) => {
    if (!asset?.asset_tag || asset.asset_tag === currentAssetTag) return;
    options.push(assetOptionLabel(asset));
    if (asset.name) options.push(`${asset.asset_tag} - ${asset.name}`);
    if (asset.make || asset.model) options.push([asset.asset_tag, asset.make, asset.model].filter(Boolean).join(" | "));
    if (asset.type) options.push(`${asset.asset_tag} | ${asset.type}`);
  });
  return [...new Set(options.map((value) => String(value || "").trim()).filter(Boolean))];
}

async function quickCreateAssetMaster(field, asset = editing) {
  if (field === "general_type") {
    const name = prompt("New general type name");
    if (!name) return;
    const value = name.trim();
    const input = document.querySelector('[data-product-field="general_type"]');
    const list = input?.getAttribute("list") ? document.getElementById(input.getAttribute("list")) : null;
    if (list && ![...list.querySelectorAll("option")].some((option) => option.value === value)) {
      list.insertAdjacentHTML("beforeend", `<option value="${esc(value)}"></option>`);
    }
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return;
  }
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
  document.querySelectorAll("[data-product-field]").forEach((el) => {
    const value = String(el.value ?? "").trim();
    record[el.dataset.productField] = value === "" ? null : value;
  });
  if (!record.asset_tag || !record.type || !record.name) {
    alert("Asset tag, type, and name are required.");
    return;
  }
  const duplicate = (productMeta.assets || []).find((row) => {
    const sameTag = String(row.asset_tag || "").trim().toLowerCase() === String(record.asset_tag || "").trim().toLowerCase();
    const sameRecord = editing && (row.id === editing.id || String(row.asset_tag || "") === String(editing.asset_tag || ""));
    return sameTag && !sameRecord;
  });
  if (duplicate) {
    alert(`Asset # ${record.asset_tag} already exists. Please use the next available number for this equipment type.`);
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
  record.compatible_with = String(record.compatible_with || "").trim() || null;
  const wasNew = !editing;
  try {
    const file = document.querySelector("[data-asset-file]")?.files?.[0];
    if (file) record.photo_url = await uploadAssetPhoto(record.asset_tag, file);
    record.qr_update_url = editing?.qr_update_url || assetQrUrl(record, { regenerate: true });
    ["odometer", "engine_hours", "purchase_cost"].forEach((field) => record[field] = Number(record[field] || 0));
    const saved = await upsertOneWithOptionalColumns("assets", record, "asset_tag", [
      "parent_asset_id",
      "parent_asset_tag",
      "relationship_type",
      "compatible_with",
      "size",
      "old_qr_code",
      "qr_printed_tagged",
      "last_update_date",
      "return_date",
      "gps_location",
      "requested_by",
      "approved_by",
      "repair_po_no",
    ], "Saved the asset. Some optional fleet fields need the latest asset database update before they can be stored.");
    if (wasNew) await incrementSequence("asset");
    closeModal();
    renderAssetsView();
  } catch (error) {
    alert(error.message || error);
  }
}

function setupImageDropzones(root = document) {
  root.querySelectorAll('input[type="file"][accept^="image/"]').forEach((input) => {
    const field = input.closest(".field") || input.parentElement;
    if (!field || field.dataset.dropzoneReady === "1") return;
    field.dataset.dropzoneReady = "1";
    field.classList.add("file-dropzone");
    const hint = document.createElement("div");
    hint.className = "file-drop-hint";
    hint.textContent = "Drop photo here or click Choose File. Large images are resized automatically.";
    input.insertAdjacentElement("afterend", hint);
    const status = document.createElement("small");
    status.className = "muted upload-compression-status";
    status.textContent = "Photos are compressed before saving.";
    hint.insertAdjacentElement("afterend", status);
    const stop = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    ["dragenter", "dragover"].forEach((name) => field.addEventListener(name, (event) => {
      stop(event);
      field.classList.add("drag-over");
    }));
    ["dragleave", "drop"].forEach((name) => field.addEventListener(name, (event) => {
      stop(event);
      field.classList.remove("drag-over");
    }));
    field.addEventListener("drop", (event) => {
      const file = [...(event.dataTransfer?.files || [])].find((item) => item.type.startsWith("image/"));
      if (!file) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    input.addEventListener("change", () => {
      previewDroppedImage(input, field);
      const selected = input.files?.[0];
      status.textContent = selected ? `Ready to compress: ${selected.name}` : "Photos are compressed before saving.";
    });
  });
}

function previewDroppedImage(input, field) {
  const file = input.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  let preview = field.querySelector(".upload-preview");
  if (!preview) {
    preview = document.createElement("img");
    preview.className = "thumb large upload-preview";
    input.insertAdjacentElement("beforebegin", preview);
  }
  if (preview.dataset.previewUrl) URL.revokeObjectURL(preview.dataset.previewUrl);
  const url = URL.createObjectURL(file);
  preview.dataset.previewUrl = url;
  preview.src = url;
  preview.alt = "Selected photo";
}

async function resizeImageForUpload(file, options = {}) {
  if (!file || !file.type.startsWith("image/")) return file;
  document.querySelectorAll(".upload-compression-status").forEach((el) => {
    if (/ready to compress|compressed before saving/i.test(el.textContent || "")) el.textContent = "Compressing photo...";
  });
  const maxSide = options.maxSide || 1400;
  const quality = options.quality || 0.78;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  const originalName = file.name.replace(/\.[^.]+$/, "");
  document.querySelectorAll(".upload-compression-status").forEach((el) => {
    if (/compressing photo/i.test(el.textContent || "")) el.textContent = `Compressed for upload (${Math.max(1, Math.round(blob.size / 1024))} KB).`;
  });
  return new File([blob], `${originalName || "photo"}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

async function upsertOneWithOptionalColumns(table, row, onConflict, optionalColumns = [], warning = "") {
  const retryRow = { ...row };
  const skipped = [];
  for (let attempt = 0; attempt <= optionalColumns.length; attempt += 1) {
    try {
      const saved = await upsertOne(table, retryRow, onConflict);
      if (skipped.length && warning) alert(warning);
      return saved;
    } catch (error) {
      const missing = optionalColumns.find((column) => column in retryRow && isMissingSchemaColumn(error, column));
      if (!missing) throw error;
      delete retryRow[missing];
      skipped.push(missing);
    }
  }
  return upsertOne(table, retryRow, onConflict);
}

async function updateOneWithOptionalColumns(table, row, matchColumn, matchValue, optionalColumns = [], warning = "") {
  const retryRow = { ...row };
  const skipped = [];
  for (let attempt = 0; attempt <= optionalColumns.length; attempt += 1) {
    try {
      const { error } = await supabase.from(table).update(retryRow).eq(matchColumn, matchValue);
      if (error) throw error;
      if (skipped.length && warning) alert(warning);
      return;
    } catch (error) {
      const missing = optionalColumns.find((column) => column in retryRow && isMissingSchemaColumn(error, column));
      if (!missing) throw error;
      delete retryRow[missing];
      skipped.push(missing);
    }
  }
  const { error } = await supabase.from(table).update(retryRow).eq(matchColumn, matchValue);
  if (error) throw error;
}

function isMissingSchemaColumn(error, column) {
  const message = String(error?.message || error || "");
  return message.includes(column) && /schema cache|could not find|column/i.test(message);
}

function assetOptionLabel(asset) {
  return [asset?.asset_tag, asset?.name, asset?.make, asset?.model, asset?.size, asset?.location]
    .filter(Boolean)
    .join(" | ");
}

function parseAssetTag(value) {
  return String(value || "").split("|")[0].trim();
}

async function uploadAssetPhoto(assetTag, file) {
  const resized = await resizeImageForUpload(file);
  const path = `${assetTag}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("asset-photos").upload(path, resized, { upsert: true, contentType: resized.type || "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("asset-photos").getPublicUrl(path);
  return data.publicUrl;
}

async function uploadWorkOrderPartPhoto(woNo, file) {
  const resized = await resizeImageForUpload(file);
  const path = `part-requests/${safeStorageName(woNo || "work-order")}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("asset-photos").upload(path, resized, { upsert: true, contentType: resized.type || "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("asset-photos").getPublicUrl(path);
  return data.publicUrl;
}

function safeStorageName(value) {
  return String(value || "file").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "file";
}

function openAssetLocationModal(asset, options = {}) {
  if (!asset) return;
  editing = asset;
  const scannedAt = new Date();
  $("modalTitle").textContent = `Scanned asset ${asset.asset_tag}`;
  $("modalBody").innerHTML = `
    <div class="form-grid">
      ${productSelect("Scan action", "scan_action", ["Update location", "Update photo", "Update location and photo", "Ask for repair"], "Update location")}
      ${productSelect("Location", "location", productMeta.locations || [], asset.location || "", "New location")}
      ${productInput("Operator", "assigned_operator", asset.assigned_operator || "")}
      ${productInput("Requested by", "requested_by", asset.requested_by || "")}
      ${productInput("Approved by", "approved_by", asset.approved_by || "")}
      ${productInput("PO # for repair request", "repair_po_no", asset.repair_po_no || "")}
      <div class="field"><label>GPS stamp from phone</label><input data-product-field="gps_location" value="${esc(asset.gps_location || "")}" readonly placeholder="Capturing GPS..."></div>
      <div class="field"><label>Phone timestamp</label><input value="${esc(scannedAt.toLocaleString())}" readonly><input type="hidden" data-product-field="scanned_date" value="${esc(scannedAt.toISOString())}"><input type="hidden" data-product-field="last_update_date" value="${esc(localToday())}"></div>
      <div class="field wide"><label>Update equipment photo</label>${asset.photo_url ? `<img class="thumb large" src="${esc(asset.photo_url)}" alt="Current asset photo">` : ""}<input type="file" accept="image/*" data-asset-scan-photo="photo_url"><small>Optional. Choose a photo only if you want to replace or add the equipment photo.</small></div>
      <div class="field wide"><label>Repair issue</label><textarea data-product-field="repair_issue" placeholder="Describe the issue if this scan is asking for repair"></textarea></div>
      <div class="field wide"><label>Notes</label><textarea data-product-field="notes">${esc(asset.notes || "")}</textarea></div>
    </div>
    <p class="notice" id="gpsCaptureNotice">Phone timestamp captured. Capturing GPS from this phone when browser location permission is allowed.</p>`;
  $("modalSave").onclick = saveAssetLocationModal;
  $("modalSave").textContent = "Submit scan";
  $("modalCancel").textContent = options.publicScan ? "Close" : "Cancel";
  $("modal").style.display = "flex";
  document.querySelectorAll("[data-product-quick]").forEach((b) => b.onclick = () => quickCreateAssetMaster(b.dataset.productQuick, asset));
  setupImageDropzones($("modalBody"));
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
  record.scanned_date = new Date().toISOString();
  record.last_update_date = localToday();
  const action = record.scan_action || "Update location";
  const repairIssue = String(record.repair_issue || "").trim();
  if (!String(record.assigned_operator || "").trim()) return alert("Operator is required before submitting the scan.");
  if (!String(record.requested_by || "").trim()) return alert("Requested by is required before submitting the scan.");
  if (!String(record.approved_by || "").trim()) return alert("Approved by is required before submitting the scan.");
  delete record.scan_action;
  delete record.repair_issue;
  const file = document.querySelector("[data-asset-scan-photo]")?.files?.[0];
  if (/photo/i.test(action) && !file) {
    alert("Choose a photo to upload, or change Scan action to Update location.");
    return;
  }
  if (/repair/i.test(action)) {
    if (!repairIssue) {
      alert("Please enter the repair issue so it can appear in Equipment Subject to Repair.");
      return;
    }
    const stamp = new Date().toLocaleString();
    record.status = "Subject to Repair";
    record.notes = [record.notes || asset.notes || "", `Repair requested ${stamp}: ${repairIssue}`].filter(Boolean).join("\n");
  } else {
    record.repair_po_no = null;
  }
  try {
    if (file) record.photo_url = await uploadAssetPhoto(asset.asset_tag, file);
    await updateOneWithOptionalColumns("assets", record, "id", asset.id, ["repair_po_no", "gps_location", "requested_by", "approved_by"], "Scan saved. Some optional fleet fields need the latest asset database update before they can be stored.");
    closeModal();
    if (document.body.classList.contains("public-scan")) {
      showPublicScanSuccess(asset, action);
    } else {
      /repair/i.test(action) ? loadView("equipmentrepairqueue") : renderAssetsView();
    }
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

async function clearFleetAssetsOnly() {
  const count = currentRows.length;
  if (!count) {
    alert("There are no Fleet & Equipment assets to clear.");
    return;
  }
  const typed = prompt(`This will remove all ${count} Fleet & Equipment asset rows so you can upload a fresh asset list.\n\nIt will not delete products, vendors, customers, users, invoices, or accounting.\n\nType CLEAR ASSETS to continue.`);
  if (typed !== "CLEAR ASSETS") return;
  try {
    await clearFleetAssetRows();
    alert("Fleet & Equipment asset rows were cleared. You can now load a fresh asset list.");
    await renderAssetsView();
  } catch (error) {
    alert(error.message || "Could not clear Fleet & Equipment assets.");
  }
}

async function clearFleetAssetRows() {
  const unlinkWorkOrders = await supabase.from("work_orders").update({ asset_id: null }).not("asset_id", "is", null);
  if (unlinkWorkOrders.error) throw new Error(`Work order asset links: ${unlinkWorkOrders.error.message}`);
  const unlinkRentals = await supabase.from("rentals").update({ item_id: null }).eq("item_type", "Asset");
  if (unlinkRentals.error) throw new Error(`Rental asset links: ${unlinkRentals.error.message}`);
  const unlinkRequests = await supabase.from("equipment_requests").update({ asset_id: null }).not("asset_id", "is", null);
  if (unlinkRequests.error) throw new Error(`Equipment request asset links: ${unlinkRequests.error.message}`);
  const clearParents = await supabase.from("assets").update({ parent_asset_id: null, parent_asset_tag: null }).not("parent_asset_id", "is", null);
  if (clearParents.error && !/parent_asset/i.test(clearParents.error.message || "")) throw new Error(`Parent asset links: ${clearParents.error.message}`);
  const clearAssets = await supabase.from("assets").delete().not("id", "is", null);
  if (clearAssets.error) throw new Error(`Asset delete: ${clearAssets.error.message}`);
}

function assetPurchaseYear(asset = {}) {
  const raw = asset.purchase_date || asset.purchaseDate || asset.purchase_year || asset.purchaseYear || "";
  const text = String(raw || "").trim();
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return yearMatch[0];
  const date = text ? new Date(text) : null;
  return date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : "";
}

function assetQrUrl(asset = {}, options = {}) {
  if (asset.qr_update_url && !options.regenerate) return asset.qr_update_url;
  const assetTag = encodeURIComponent(asset.asset_tag || "");
  const serial = encodeURIComponent(asset.vin_serial || asset.serial || "");
  const purchaseYear = encodeURIComponent(assetPurchaseYear(asset));
  return `${location.origin}${location.pathname}#asset=${assetTag}${serial ? `&serial=${serial}` : ""}${purchaseYear ? `&purchaseYear=${purchaseYear}` : ""}`;
}

function qrCodeUrl(text, size = 120) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(text || "")}`;
}

function exportAssetsWithQrCsv() {
  const columns = assetVisibleColumns();
  const heads = columns.map(([, label]) => label);
  const rows = filteredAssetRowsFromDom();
  const csvRows = [heads, ...rows.map((a) => {
    const qrText = assetQrUrl(a);
    return columns.map(([key]) => {
      if (key === "new_qr") return `=IMAGE("${qrCodeUrl(qrText, 220)}","${String(a.asset_tag || "").replace(/"/g, '""')}",0)`;
      if (key === "photo") return a.photo_url ? `=IMAGE("${String(a.photo_url).replace(/"/g, '""')}","${String(a.asset_tag || "Asset photo").replace(/"/g, '""')}",0)` : "";
      return assetExportValue(a, key);
    });
  })];
  const csv = csvRows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadBlob(csv, "fleet-equipment-with-in-cell-qr.csv", "text/csv;charset=utf-8");
}

function downloadAssetImportTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Asset_List_Import_Template.xlsx";
  a.download = "LMS_Asset_List_Import_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadAssetLocationUpdateTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Asset_Location_Update_Template.xlsx";
  a.download = "LMS_Asset_Location_Update_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function importAssetLocationUpdateFile() {
  const input = $("assetLocationFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const rows = await readAssetTemplateRows(file);
    const updates = rows.map(assetLocationUpdateRow).filter((row) => row.asset_tag && row.location);
    if (!updates.length) throw new Error("No valid location rows were found. Asset # and Location are required.");
    const duplicate = updates.find((row, index) => updates.findIndex((item) => item.asset_tag === row.asset_tag) !== index);
    if (duplicate) throw new Error(`Duplicate Asset # in upload file: ${duplicate.asset_tag}. Use one location update row per asset.`);
    const existingAssets = await getAll("assets");
    const assetTags = new Set(existingAssets.map((asset) => String(asset.asset_tag || "").trim().toLowerCase()));
    const missing = updates.filter((row) => !assetTags.has(row.asset_tag.toLowerCase()));
    if (missing.length) {
      throw new Error(`These Asset # values were not found in Fleet & Equipment: ${missing.slice(0, 10).map((row) => row.asset_tag).join(", ")}${missing.length > 10 ? "..." : ""}. Add the asset first, then upload locations.`);
    }
    await upsertMany("asset_locations", uniqueMasterRows(updates.map((row) => row.location)), "name");
    for (const row of updates) {
      const { error } = await supabase
        .from("assets")
        .update({ location: row.location, scanned_date: row.scanned_date, last_update_date: row.scanned_date })
        .eq("asset_tag", row.asset_tag);
      if (error) throw error;
    }
    input.value = "";
    alert(`${updates.length} fleet location update${updates.length === 1 ? "" : "s"} posted.`);
    await renderAssetsView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload fleet location updates.");
  }
}

function assetLocationUpdateRow(row) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  return {
    asset_tag: String(get("asset_tag", "asset", "asset_no", "asset_number", "asset_id")).trim(),
    location: String(get("location", "new_location", "current_location")).trim(),
    scanned_date: excelDateToIso(get("date", "scan_date", "scanned_date", "updated_date", "last_update_date")) || today(),
  };
}

async function importAssetTemplateFile() {
  const input = $("assetFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const rows = await readAssetTemplateRows(file);
    const assets = rows.map(assetTemplateRowToLocalAsset).filter((row) => row.assetTag && row.name && row.type);
    if (!assets.length) throw new Error("No valid asset rows were found. Asset #, Description, and Type are required.");
    const replace = confirm(`Found ${assets.length} asset row${assets.length === 1 ? "" : "s"}.\n\nChoose OK to replace the current Fleet & Equipment list.\nChoose Cancel to only add/update matching asset tags.`);
    if (replace) await clearFleetAssetRows();
    await importAssetMasterRows(assets);
    input.value = "";
    alert(`${assets.length} asset row${assets.length === 1 ? "" : "s"} loaded into Fleet & Equipment.`);
    await renderAssetsView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload the asset list.");
  }
}

async function readAssetTemplateRows(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return rowsFromAnyDetectedHeader(parseCsvMatrix(await file.text()), ["asset #", "asset tag", "asset no", "description", "equipment", "type"]);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets["Asset Import Template"] || workbook.Sheets[workbook.SheetNames[0]];
      return sheetToRowsWithDetectedHeader(XLSX, sheet, ["asset #", "asset tag", "asset no", "description", "equipment", "type"]);
    } catch (error) {
      throw new Error("Excel upload needs internet access to load the Excel reader. You can also save the template as CSV and upload that file.");
    }
  }
  throw new Error("Upload the asset template as .xlsx, .xls, or .csv.");
}

function normalizeAssetTemplateRow(row) {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const cleanKey = String(key || "")
      .trim()
      .toLowerCase()
      .replace(/^\ufeff/, "")
      .replace(/[#/()]+/g, " ")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    normalized[cleanKey] = value == null ? "" : value;
  });
  return normalized;
}

function assetTemplateRowToLocalAsset(row) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  const yesNo = (value) => /^(yes|y|true|1|need|needs|pending)$/i.test(String(value || "").trim());
  const needsQr = yesNo(get("needs_qr_code_printed", "needs_qr_printed", "needs_qr"));
  const qrPrinted = get("qr_printed_tagged", "qr_printed", "qr_tagged");
  return {
    assetTag: String(get("asset_tag", "asset", "asset_no", "asset_number", "asset_id")).trim(),
    name: String(get("description", "name", "asset_description", "equipment", "equipment_name")).trim(),
    type: String(get("type", "type_of_equipment", "equipment_type")).trim(),
    generalType: String(get("general_type", "general_equipment_type", "group")).trim(),
    make: String(get("make", "manufacturer", "brand")).trim(),
    model: String(get("model")).trim(),
    year: String(get("year")).trim(),
    color: String(get("color")).trim(),
    size: String(get("size", "asset_size", "equipment_size")).trim(),
    vinSerial: String(get("vin_serial", "vin", "serial", "serial_no", "serial_number")).trim(),
    plate: String(get("plate", "plate_no", "plate_number")).trim(),
    location: String(get("location", "current_location")).trim(),
    oldQrCode: String(get("old_qr_code", "old_qr", "legacy_qr_code")).trim(),
    qrPrintedTagged: needsQr ? "Needs Print" : String(qrPrinted || "Printed").trim(),
    lastUpdateDate: excelDateToIso(get("last_update_date", "last_updated", "updated_date")),
    status: String(get("status")).trim() || "Operable",
    odometer: numberValue(get("odometer", "reading")),
    hours: numberValue(get("engine_hours", "hours")),
    operator: String(get("assigned_operator", "operator")).trim(),
    purchaseDate: excelDateToIso(get("purchase_date")),
    purchaseCost: numberValue(get("purchase_cost", "cost")),
    fuel: String(get("fuel_power", "fuel", "power")).trim(),
    insurance: String(get("insurance_policy", "insurance")).trim(),
    registrationExpiry: excelDateToIso(get("registration_expiry", "registration_expiration")),
    parentAssetTag: String(get("parent_asset_tag", "parent_asset")).trim(),
    relationshipType: String(get("relationship_type", "relationship")).trim(),
    compatibleWith: String(get("compatible_with", "compatible")).trim(),
    requestedBy: String(get("requested_by")).trim(),
    approvedBy: String(get("approved_by")).trim(),
    image: String(get("photo_url", "photo", "image")).trim(),
    notes: String(get("notes")).trim(),
  };
}

function numberValue(value) {
  const num = Number(String(value ?? "").replace(/[$,]/g, "").trim());
  return Number.isFinite(num) ? num : 0;
}

function excelDateToIso(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value > 25000) {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
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
    size: asset.size || "",
    vin_serial: asset.vin_serial || "",
    plate: asset.plate || "",
    location: asset.location || "",
    gps_location: asset.gps_location || "",
    last_update_date: lastUpdateDate || "",
    scanned_date: asset.scanned_date || "",
    reading: asset.odometer ? `${asset.odometer} mi` : asset.engine_hours ? `${asset.engine_hours} hr` : "",
    assigned_operator: asset.assigned_operator || "",
    requested_by: asset.requested_by || "",
    approved_by: asset.approved_by || "",
    repair_po_no: asset.repair_po_no || "",
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
  const params = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
  const assetTag = params.get("asset");
  if (!assetTag) return;
  await renderPublicAssetScan(assetTag);
}

async function renderPublicAssetScan(assetTag) {
  document.body.classList.add("public-scan");
  document.body.classList.remove("logged-out", "mechanic-mode");
  $("loginPanel").style.display = "none";
  $("content").style.display = "block";
  $("content").innerHTML = `<div class="public-scan-card"><h1>Asset Scan</h1><p>Loading ${esc(assetTag)}...</p></div>`;
  try {
    const [{ data: asset, error }, { data: locations }] = await Promise.all([
      supabase.from("assets").select("*").eq("asset_tag", assetTag).maybeSingle(),
      supabase.from("asset_locations").select("name").order("name"),
    ]);
    if (error) throw error;
    if (!asset) {
      $("content").innerHTML = `<div class="public-scan-card"><h1>Asset not found</h1><p>${esc(assetTag)} was not found in Fleet & Equipment.</p></div>`;
      return;
    }
    productMeta.locations = (locations || []).map((row) => row.name).filter(Boolean);
    currentRows = [asset];
    $("content").innerHTML = `<div class="public-scan-card"><h1>${esc(asset.asset_tag)}</h1><p>${esc(asset.name || "Fleet asset")}</p><p>${esc(asset.location || "No location")} ${asset.status ? `- ${esc(asset.status)}` : ""}</p><button class="primary" id="publicScanOpenBtn">Update scan</button></div>`;
    $("publicScanOpenBtn").onclick = () => openAssetLocationModal(asset, { publicScan: true });
    openAssetLocationModal(asset, { publicScan: true });
  } catch (error) {
    $("content").innerHTML = `<div class="public-scan-card"><h1>Scan cannot load</h1><p>${esc(error.message || error)}</p><p class="notice">If this is the first time using public QR scans, run the public scan access SQL in Supabase.</p></div>`;
  }
}

function showPublicScanSuccess(asset, action) {
  $("content").innerHTML = `<div class="public-scan-card">
    <h1>Submitted</h1>
    <p>${esc(asset.asset_tag)} was updated.</p>
    <p>${esc(action || "Scan")} saved at ${esc(new Date().toLocaleString())}.</p>
    <button class="primary" id="publicScanAgainBtn">Update again</button>
  </div>`;
  $("publicScanAgainBtn").onclick = () => handleAssetHash();
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
  setupImageDropzones($("modalBody"));
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
    if (file) {
      setProductPhotoStatus("Compressing and uploading product photo...");
      record.photo_url = await uploadProductPhoto(record.sku, file);
      setProductPhotoStatus("Product photo uploaded.");
    }
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

function setProductPhotoStatus(text) {
  const status = document.querySelector(".product-form .upload-compression-status");
  if (status) status.textContent = text || "";
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
  const resized = await resizeImageForUpload(file);
  const path = `${sku}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("product-photos").upload(path, resized, { upsert: true, contentType: resized.type || "image/jpeg" });
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

function downloadProductImportTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Product_Import_Template.xlsx";
  a.download = "LMS_Product_Import_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function downloadProductQtyCostUpdateTemplate() {
  const a = document.createElement("a");
  a.href = "./LMS_Product_Qty_Cost_Update_Template.xlsx";
  a.download = "LMS_Product_Qty_Cost_Update_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function importProductTemplateFile() {
  const input = $("productFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const rows = await readProductTemplateRows(file);
    const products = await productUploadRowsWithAutoSku(rows);
    if (!products.length) throw new Error("No valid product rows were found. Product Name or Description is required. If SKU is blank, the system will create one automatically.");
    const duplicate = products.find((row, index) => products.findIndex((item) => item.sku === row.sku) !== index);
    if (duplicate) throw new Error(`Duplicate SKU in upload file: ${duplicate.sku}. Each SKU must be unique.`);
    await ensureProductUploadMasters(products);
    const savedProducts = await upsertManyWithOptionalColumns("products", products, "sku", ["source_vendor", "markup_percent", "barcode", "batch_lot", "expiry_date", "compatible_with", "notes"]);
    await saveProductUploadAlternates(savedProducts, rows);
    await postProductOpeningBalances(savedProducts);
    input.value = "";
    alert(`${products.length} product row${products.length === 1 ? "" : "s"} uploaded. Beginning quantities were tied to Product Master and Stock Movement as Opening Balance rows.`);
    await renderProductsView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload the product list.");
  }
}

async function productUploadRowsWithAutoSku(rows) {
  const products = rows.map(productTemplateRowToDbProduct).filter((row) => row.name);
  if (!products.length) return [];
  const existing = await getAll("products");
  const usedSkus = new Set(existing.map((row) => String(row.sku || "").trim()).filter(Boolean));
  let nextNumber = Math.max(
    1000,
    ...[...usedSkus].map((sku) => Number(String(sku).replace(/\D/g, ""))).filter(Boolean),
  ) + 1;
  products.forEach((product) => {
    if (product.sku) {
      usedSkus.add(product.sku);
      return;
    }
    let sku = `SKU-${nextNumber}`;
    while (usedSkus.has(sku)) {
      nextNumber += 1;
      sku = `SKU-${nextNumber}`;
    }
    product.sku = sku;
    usedSkus.add(sku);
    nextNumber += 1;
  });
  return products;
}

async function importProductQtyCostUpdateFile() {
  const input = $("productQtyCostFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const rows = await readProductTemplateRows(file);
    const updates = rows.map(productQtyCostUpdateRow).filter((row) => row.sku);
    if (!updates.length) throw new Error("No valid rows were found. SKU is required; Qty and/or Cost may be included.");
    const duplicate = updates.find((row, index) => updates.findIndex((item) => item.sku === row.sku) !== index);
    if (duplicate) throw new Error(`Duplicate SKU in upload file: ${duplicate.sku}. Each SKU must be listed once for this update.`);
    const existing = await getAll("products");
    const bySku = new Map(existing.map((row) => [String(row.sku || "").trim(), row]));
    const missing = updates.filter((row) => !bySku.has(row.sku)).map((row) => row.sku);
    if (missing.length) throw new Error(`These SKUs are not in Product Master yet:\n\n${missing.join("\n")}\n\nUse Upload product list first for new products.`);
    const savedRows = updates.map((row) => {
      const current = bySku.get(row.sku);
      const next = { ...current };
      if (row.qty !== null) next.qty = row.qty;
      if (row.cost !== null) next.cost = row.cost;
      if (row.warehouse) next.warehouse = row.warehouse;
      if (row.bin_shelf) next.bin_shelf = row.bin_shelf;
      return next;
    });
    await upsertManyWithOptionalColumns("products", savedRows, "sku", ["source_vendor", "markup_percent", "barcode", "batch_lot", "expiry_date", "compatible_with", "notes"]);
    await postProductQtyCostUpdateMovements(updates, bySku);
    input.value = "";
    alert(`${updates.length} product row${updates.length === 1 ? "" : "s"} updated. Quantity changes were posted to Stock Movement as upload adjustments.`);
    await renderProductsView();
  } catch (error) {
    input.value = "";
    alert(error.message || "Could not upload the product quantity/cost update.");
  }
}

function productQtyCostUpdateRow(row) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  return {
    sku: String(get("sku", "product_sku", "item_code", "part_no", "part_number", "item_number")).trim(),
    qty: nullableNumber(get("qty", "quantity", "on_hand", "quantity_on_hand")),
    cost: nullableNumber(get("cost", "unit_cost")),
    warehouse: String(get("warehouse", "location")).trim(),
    bin_shelf: String(get("bin_shelf", "bin", "shelf")).trim(),
  };
}

async function postProductQtyCostUpdateMovements(updates, bySku) {
  const batch = Date.now().toString().slice(-6);
  const rows = updates.flatMap((row, index) => {
    if (row.qty === null) return [];
    const current = bySku.get(row.sku);
    const delta = Number(row.qty || 0) - Number(current.qty || 0);
    if (!delta) return [];
    const unitCost = row.cost ?? nullableNumber(current.cost) ?? 0;
    return [{
      movement_date: localToday(),
      reference_no: `SM-UPD-${batch}-${index + 1}`,
      type: "Upload Adjustment",
      product_id: current.id || null,
      product_sku: current.sku,
      product_name: current.name,
      vendor: current.source_vendor || null,
      qty: delta,
      from_warehouse: delta < 0 ? (row.warehouse || current.warehouse || null) : null,
      from_bin_shelf: delta < 0 ? (row.bin_shelf || current.bin_shelf || null) : null,
      to_warehouse: delta > 0 ? (row.warehouse || current.warehouse || null) : null,
      to_bin_shelf: delta > 0 ? (row.bin_shelf || current.bin_shelf || null) : null,
      unit_fifo_cost: unitCost,
      total_fifo_cost: Math.abs(delta) * unitCost,
      document_no: "Product Qty/Cost Upload",
      entered_by: profile?.username || profile?.email || "Upload",
      reason: `Quantity set from ${current.qty || 0} to ${row.qty}`,
    }];
  });
  if (rows.length) await upsertMany("stock_movements", rows, "reference_no");
}

async function readProductTemplateRows(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return rowsFromAnyDetectedHeader(parseCsvMatrix(await file.text()), ["sku", "product sku", "item code", "part no", "part number", "item number", "product name", "description"]);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets["Product Import Template"] || workbook.Sheets[workbook.SheetNames[0]];
      return sheetToRowsWithDetectedHeader(XLSX, sheet, ["sku", "product_sku", "item_code", "part_no", "part_number", "item_number"]);
    } catch (error) {
      throw new Error("Excel upload needs internet access to load the Excel reader. You can also save the template as CSV and upload that file.");
    }
  }
  throw new Error("Upload the product template as .xlsx, .xls, or .csv.");
}

function sheetToRowsWithDetectedHeader(XLSX, sheet, headerCandidates = []) {
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const rows = rowsFromAnyDetectedHeader(matrix, headerCandidates);
  return rows.length ? rows : XLSX.utils.sheet_to_json(sheet, { defval: "" }).map(normalizeAssetTemplateRow);
}

function normalizeHeaderKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, "")
    .replace(/[#/()]+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const aliases = {
    as_of: "posting_date",
    as_of_date: "posting_date",
    account_no: "account_code",
    account_number: "account_code",
    acct_code: "account_code",
    gl_code: "account_code",
    old_code: "account_code",
    new_code: "account_code",
    account_title: "account",
    account_name: "account",
    gl_account: "account",
    invoice: "invoice_no",
    invoice_number: "invoice_no",
    invoice_num: "invoice_no",
    invoice_ref: "invoice_no",
    vendor_invoice_no: "invoice_no",
    vendor_invoice_number: "invoice_no",
    customer_invoice_no: "invoice_no",
    invoice_amount: "amount",
    invoice_total: "amount",
    total_amount: "amount",
    gross_amount: "amount",
    net_amount: "amount",
    amount_due: "amount",
    total_due: "amount",
    open_invoice_amount: "amount",
    open_amount: "amount",
    open_amt: "amount",
    open_balance: "amount",
    current_balance: "amount",
    balance_due: "amount",
    remaining_balance: "amount",
    balance_remaining: "amount",
    remaining_amount: "amount",
    unpaid_balance: "amount",
    original_amount: "amount",
    ar_balance: "amount",
    ap_balance: "amount",
    receivable: "amount",
    receivables: "amount",
    payable: "amount",
    payables: "amount",
    balance: "amount",
    total: "amount",
    vendor_name: "vendor",
    supplier: "vendor",
    supplier_name: "vendor",
    customer_name: "customer",
    company_name: "customer",
    po: "po_no",
    po_number: "po_no",
    purchase_order: "po_no",
    purchase_order_no: "po_no",
    customer_po: "po_no",
    work_order: "wo_no",
    work_order_no: "wo_no",
    wo: "wo_no",
    job_site: "jobsite",
    jobsite_project: "jobsite",
    project: "jobsite",
    description_of_parts: "description",
    parts_description: "description",
    item_description: "description",
    product_description: "description",
    notes: "notes",
    product: "product_name",
    item: "product_name",
    item_name: "product_name",
    part_name: "product_name",
    product_sku: "sku",
    item_code: "sku",
    item_no: "sku",
    item_number: "sku",
    part_no: "sku",
    part_number: "sku",
    quantity: "qty",
    quantity_on_hand: "qty",
    on_hand: "qty",
    unit_cost: "cost",
    unit_price: "selling_price",
    price: "selling_price",
    sales_price: "selling_price",
    uom: "unit",
    unit_of_measurement: "unit",
    bin: "bin_shelf",
    shelf: "bin_shelf",
    preferred_vendor: "source_vendor",
    source_supplier: "source_vendor",
    vendor_reference: "vendor_ref",
    customer_reference: "customer_ref",
    email_address: "email",
    phone_number: "phone",
    contact_no: "phone",
    mailing_address: "address",
    billing_address: "address",
    taxid: "tax_id",
    tin: "tax_id",
    asset: "asset_tag",
    asset_no: "asset_tag",
    asset_number: "asset_tag",
    asset_id: "asset_tag",
    asset_description: "description",
    equipment_name: "description",
    equipment_type: "type",
    type_of_equipment: "type",
    serial: "vin_serial",
    serial_no: "vin_serial",
    serial_number: "vin_serial",
    vin: "vin_serial",
    scan_date: "scanned_date",
    updated_date: "last_update_date",
    last_updated: "last_update_date",
  };
  return aliases[key] || key;
}

function downloadCurrentMasterTemplate() {
  const isVendor = currentView === "vendors";
  const a = document.createElement("a");
  a.href = isVendor ? "./LMS_Vendor_Master_Template.xlsx" : "./LMS_Customer_Master_Template.xlsx";
  a.download = isVendor ? "LMS_Vendor_Master_Template.xlsx" : "LMS_Customer_Master_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function importContactMasterFile(view) {
  const input = $(view === "vendors" ? "vendorFileImport" : "customerFileImport");
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const rows = await readContactMasterRows(file, view);
    const prefix = view === "vendors" ? "V-UP-" : "C-UP-";
    const batch = Date.now().toString().slice(-6);
    const existingRows = await getAll(view);
    const byReference = new Map(existingRows.map((row) => [contactMasterKey(row.reference), row]).filter(([key]) => key));
    const byName = new Map(existingRows.map((row) => [contactMasterKey(row.name), row]).filter(([key]) => key));
    const records = rows.map((row, index) => {
      const uploaded = contactMasterRowToDb(row, prefix, batch, index);
      const existing = byReference.get(contactMasterKey(uploaded.reference)) || byName.get(contactMasterKey(uploaded.name));
      return mergeContactMasterUpload(uploaded, existing);
    }).filter((row) => row.name);
    if (!records.length) throw new Error("No valid rows were found. Name is required.");
    const duplicate = records.find((row, index) => records.findIndex((item) => item.reference === row.reference) !== index);
    if (duplicate) throw new Error(`Duplicate Reference in upload file: ${duplicate.reference}.`);
    for (const row of records) {
      if (row.terms) await rememberMasterTerm(row.terms);
    }
    const oldReferences = [...new Set(records.map((row) => row._previous_reference).filter(Boolean))];
    if (oldReferences.length) await deleteWhereIn(view, "reference", oldReferences);
    const cleanRecords = records.map(({ _generated_reference, _previous_reference, ...row }) => row);
    await upsertMany(view, cleanRecords, "reference");
    input.value = "";
    alert(`${records.length} ${view === "vendors" ? "vendor" : "customer"} row${records.length === 1 ? "" : "s"} uploaded or updated. Existing rows are matched by Reference first, then Name.`);
    await loadView(view);
  } catch (error) {
    input.value = "";
    alert(error.message || `Could not upload ${view === "vendors" ? "vendor" : "customer"} master.`);
  }
}

async function readContactMasterRows(file, view) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return rowsFromAnyDetectedHeader(parseCsvMatrix(await file.text()), contactMasterHeaderCandidates(view));
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const preferred = view === "vendors" ? "Vendor Master Template" : "Customer Master Template";
      const sheet = workbook.Sheets[preferred] || workbook.Sheets[workbook.SheetNames[0]];
      return sheetToRowsWithDetectedHeader(XLSX, sheet, contactMasterHeaderCandidates(view));
    } catch (error) {
      throw new Error("Excel upload needs internet access to load the Excel reader. You can also save the template as CSV and upload that file.");
    }
  }
  throw new Error("Upload the master template as .xlsx, .xls, or .csv.");
}

function contactMasterHeaderCandidates(view) {
  return view === "vendors"
    ? ["reference", "ref", "vendor reference", "vendor ref", "vendor code", "vendor no", "vendor number", "supplier code", "supplier no", "supplier number", "account no", "account number", "name", "vendor name", "supplier name"]
    : ["reference", "ref", "customer reference", "customer ref", "customer code", "customer no", "customer number", "account no", "account number", "name", "customer name", "company name"];
}

function contactMasterRowToDb(row, prefix, batch, index) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  const uploadedReference = String(get(
    "reference",
    "ref",
    "vendor_reference",
    "vendor_ref",
    "vendor_code",
    "vendor_no",
    "vendor_number",
    "supplier_code",
    "supplier_no",
    "supplier_number",
    "customer_reference",
    "customer_ref",
    "customer_code",
    "customer_no",
    "customer_number",
    "account_no",
    "account_number"
  )).trim();
  return {
    _generated_reference: !uploadedReference,
    reference: uploadedReference || `${prefix}${batch}-${index + 1}`,
    name: String(get("name", "vendor", "customer", "vendor_name", "supplier_name", "customer_name", "company_name")).trim(),
    email: String(get("email", "email_address")).trim() || null,
    phone: String(get("phone", "phone_number", "contact_no")).trim() || null,
    address: String(get("address", "mailing_address", "billing_address")).trim() || null,
    terms: String(get("terms", "payment_terms")).trim() || null,
    tax_id: String(get("tax_id", "taxid", "tin")).trim() || null,
    notes: String(get("notes")).trim() || null,
  };
}

function contactMasterKey(value) {
  return String(value || "").trim().toLowerCase();
}

function mergeContactMasterUpload(uploaded, existing = null) {
  if (!existing) return uploaded;
  const keep = (field) => {
    const value = uploaded[field];
    if (value === null || value === undefined || String(value).trim() === "") return existing[field] ?? null;
    return value;
  };
  const uploadedReference = uploaded._generated_reference ? "" : uploaded.reference;
  const referenceChanged = uploadedReference && uploadedReference !== existing.reference;
  return {
    _generated_reference: uploaded._generated_reference,
    _previous_reference: referenceChanged ? existing.reference : null,
    reference: uploadedReference || existing.reference || uploaded.reference,
    name: keep("name"),
    email: keep("email"),
    phone: keep("phone"),
    address: keep("address"),
    terms: keep("terms"),
    tax_id: keep("tax_id"),
    notes: keep("notes"),
  };
}

function productTemplateRowToDbProduct(row) {
  const get = (...keys) => keys.map((key) => row[key]).find((value) => String(value ?? "").trim() !== "") ?? "";
  const sku = String(get("sku", "product_sku", "item_code", "part_no", "part_number", "item_number")).trim();
  const cost = nullableNumber(get("cost", "unit_cost"));
  const sellingPrice = nullableNumber(get("selling_price", "price", "sales_price"));
  const markup = nullableNumber(get("markup_percent", "markup", "markup_pct"));
  const computedPrice = sellingPrice == null && markup != null && cost != null ? Number((cost * (1 + markup / 100)).toFixed(2)) : sellingPrice;
  const productName = String(get("product_name", "product", "name", "item", "item_name", "part_name", "description", "item_description", "product_description")).trim();
  return {
    sku,
    name: productName || sku,
    category: String(get("category")).trim() || "Service Parts",
    unit: String(get("unit", "uom", "unit_of_measurement")).trim() || "Each",
    warehouse: String(get("warehouse", "location")).trim() || "Main",
    bin_shelf: String(get("bin_shelf", "bin", "shelf")).trim() || "Unassigned",
    qty: Number(numberValue(get("qty", "quantity", "on_hand", "quantity_on_hand")) || 0),
    reorder_point: Number(numberValue(get("reorder_point", "reorder")) || 0),
    cost,
    selling_price: computedPrice,
    markup_percent: computedPrice != null ? null : markup,
    source_vendor: String(get("source_vendor", "preferred_vendor", "vendor", "supplier")).trim() || null,
    photo_url: String(get("photo_url", "photo", "image")).trim() || null,
    barcode: String(get("barcode")).trim() || null,
    batch_lot: String(get("batch_lot", "batch", "lot")).trim() || null,
    expiry_date: excelDateToIso(get("expiry_date", "expiration_date")) || null,
    status: String(get("status")).trim() || "Active",
    compatible_with: String(get("compatible_with", "compatible")).trim() || null,
    notes: String(get("notes")).trim() || null,
  };
}

function nullableNumber(value) {
  const text = String(value ?? "").trim();
  const negative = /^\(.*\)$/.test(text);
  const raw = text.replace(/[$,%()\s]/g, "").replace(/,/g, "").trim();
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? (negative ? -num : num) : null;
}

async function ensureProductUploadMasters(products) {
  const batch = Date.now().toString().slice(-6);
  const vendorRows = [...new Set(products.map((p) => p.source_vendor).filter(Boolean))].map((name, index) => ({ reference: `V-UP-${batch}-${index + 1}`, name }));
  await Promise.all([
    upsertMany("categories", uniqueMasterRows(products.map((p) => p.category)), "name"),
    upsertMany("units", uniqueMasterRows(products.map((p) => p.unit)), "name"),
    upsertMany("warehouses", uniqueMasterRows(products.map((p) => p.warehouse)), "name"),
    upsertMany("vendors", vendorRows, "name"),
  ]);
}

async function saveProductUploadAlternates(savedProducts, rawRows) {
  const bySku = new Map(savedProducts.map((p) => [p.sku, p]));
  const alternates = [];
  rawRows.forEach((row) => {
    const sku = String(row.sku || row.product_sku || "").trim();
    const product = bySku.get(sku);
    if (!product) return;
    const values = [row.alternate_sku, row.alternate_skus, row.alternative_sku, row.alternative_skus]
      .flatMap((value) => String(value || "").split(/[,\n;|]+/))
      .map((value) => value.trim())
      .filter(Boolean);
    values.forEach((alternate_sku) => alternates.push({ product_id: product.id, alternate_sku }));
  });
  if (savedProducts.length) await supabase.from("product_alternates").delete().in("product_id", savedProducts.map((p) => p.id));
  if (alternates.length) await upsertMany("product_alternates", alternates, "id");
}

async function postProductOpeningBalances(products) {
  const openingRows = products.filter((p) => Number(p.qty || 0) > 0).map((p) => ({
    reference_no: `OPEN-${p.sku}`,
    movement_date: today(),
    type: "Opening Balance",
    product_id: p.id,
    sku: p.sku,
    product_name: p.name,
    vendor: p.source_vendor || "",
    qty: Number(p.qty || 0),
    to_warehouse: p.warehouse || "Main",
    to_bin_shelf: p.bin_shelf || "",
    unit_fifo_cost: Number(p.cost || 0),
    total_fifo_cost: Number(p.qty || 0) * Number(p.cost || 0),
    document_no: "Product Upload",
    entered_by: profile?.username || profile?.email || "Upload",
    reason: "Opening balance from product upload",
  }));
  if (!openingRows.length) return;
  await supabase.from("stock_movements").delete().in("reference_no", openingRows.map((row) => row.reference_no));
  await upsertMany("stock_movements", openingRows, "reference_no");
}

function collapseBeginningInventoryProducts(products) {
  const bySku = new Map();
  products.forEach((line) => {
    const sku = String(line.sku || "").trim();
    if (!sku) return;
    const qty = Number(line.qty || 0);
    const cost = Number(line.cost || 0);
    if (!bySku.has(sku)) {
      bySku.set(sku, { ...line, qty: 0, cost: cost || null });
    }
    const product = bySku.get(sku);
    const oldQty = Number(product.qty || 0);
    const oldCost = Number(product.cost || 0);
    const newQty = oldQty + qty;
    product.qty = newQty;
    if (newQty > 0 && (oldQty || qty)) product.cost = Number(((oldQty * oldCost + qty * cost) / newQty).toFixed(4));
    ["name", "category", "unit", "warehouse", "bin_shelf", "source_vendor", "status"].forEach((key) => {
      if (!product[key] && line[key]) product[key] = line[key];
    });
  });
  return [...bySku.values()];
}

async function postBeginningInventoryDetails(savedProducts, detailLines, postingDate) {
  const bySku = new Map(savedProducts.map((p) => [p.sku, p]));
  const openingRows = detailLines.filter((p) => Number(p.qty || 0) !== 0).map((p, index) => {
    const product = bySku.get(p.sku) || p;
    const qty = Number(p.qty || 0);
    const cost = Number(p.cost || 0);
    return {
      reference_no: `BBINV-${postingDate}-${p.sku}-${index + 1}`,
      movement_date: postingDate,
      type: "Beginning Inventory Detail",
      product_id: product.id,
      sku: p.sku,
      product_name: p.name || product.name,
      vendor: p.source_vendor || "",
      qty,
      to_warehouse: p.warehouse || product.warehouse || "Main",
      to_bin_shelf: p.bin_shelf || product.bin_shelf || "",
      unit_fifo_cost: cost,
      total_fifo_cost: qty * cost,
      document_no: "Beginning Inventory Detail",
      entered_by: profile?.username || profile?.email || "Upload",
      reason: `Beginning inventory supporting detail as of ${postingDate}`,
    };
  });
  await supabase.from("stock_movements").delete().eq("document_no", "Beginning Inventory Detail");
  if (openingRows.length) await upsertMany("stock_movements", openingRows, "reference_no");
  return openingRows.reduce((sum, row) => sum + Number(row.total_fifo_cost || 0), 0);
}

async function beginningInventoryGlBalance(postingDate) {
  const rows = await getAll("general_ledger");
  return rows
    .filter((row) => String(row.posting_date || row.entry_date || "").slice(0, 10) <= postingDate)
    .filter((row) => /parts inventory/i.test(row.account || "") && /trial balance upload/i.test(row.source || ""))
    .reduce((sum, row) => sum + Number(row.debit || 0) - Number(row.credit || 0), 0);
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
  const masterUploadActions = ["vendors", "customers"].includes(currentView)
    ? `<button id="masterTemplateBtn">Download template</button><button id="masterUploadBtn">Upload master</button>`
    : "";
  $("content").innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <input class="searchbox" id="search" placeholder="Search this module">
        ${currentCfg.readOnly ? "" : `<button class="primary" id="newBtn">New</button>`}
      </div>
      <div class="panel-head"><div class="panel-title"><strong>${esc(currentCfg.title)}</strong><span>${esc(currentRows.length)} records shown.</span></div><div class="actions">${masterUploadActions}<button id="csvBtn">Excel CSV</button><button id="printBtn">PDF / Print</button></div></div>
      <div id="tableHost">${tableHtml(currentRows)}</div>
    </section>`;
  $("search").oninput = () => {
    const q = $("search").value.toLowerCase();
    $("tableHost").innerHTML = tableHtml(currentRows.filter((r) => Object.values(r).join(" ").toLowerCase().includes(q)));
    bindRows();
  };
  if ($("newBtn")) $("newBtn").onclick = () => openModal();
  if ($("masterTemplateBtn")) $("masterTemplateBtn").onclick = downloadCurrentMasterTemplate;
  if ($("masterUploadBtn")) $("masterUploadBtn").onclick = () => $(currentView === "vendors" ? "vendorFileImport" : "customerFileImport").click();
  if ($("vendorFileImport")) $("vendorFileImport").onchange = () => importContactMasterFile("vendors");
  if ($("customerFileImport")) $("customerFileImport").onchange = () => importContactMasterFile("customers");
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
  if (/photo/.test(head)) return value ? `<button class="thumb-btn" type="button" data-part-request-photo="${esc(value)}" data-part-request-photo-title="Photo"><img class="thumb" src="${esc(value)}" alt="Photo"></button>` : `<span class="badge">No photo</span>`;
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
  document.querySelectorAll("[data-part-request-photo]").forEach((b) => b.onclick = () => openEquipmentRequestPhoto(b.dataset.partRequestPhoto, b.dataset.partRequestPhotoTitle || "Photo"));
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
  if (!activeSort) {
    updateTableState(table.closest(".table-wrap"));
    return;
  }
  table.querySelectorAll(".column-sort").forEach((select) => {
    if (select !== activeSort) select.value = "";
  });
  const col = Number(activeSort.dataset.col || 0);
  const direction = activeSort.value === "desc" ? -1 : 1;
  const rows = [...tbody.querySelectorAll("tr")].filter((tr) => !tr.querySelector(".empty"));
  rows.sort((a, b) => compareTableValues(a.children[col]?.textContent || "", b.children[col]?.textContent || "") * direction);
  rows.forEach((tr) => tbody.appendChild(tr));
  updateTableState(table.closest(".table-wrap"));
}

function compareTableValues(a, b) {
  const ax = String(a || "").trim();
  const bx = String(b || "").trim();
  const an = Number(ax.replace(/[$,%(),\s]/g, "").replace(/^-\s*/, "-"));
  const bn = Number(bx.replace(/[$,%(),\s]/g, "").replace(/^-\s*/, "-"));
  if (!Number.isNaN(an) && !Number.isNaN(bn) && (/\d/.test(ax) || /\d/.test(bx))) return an - bn;
  return ax.localeCompare(bx, undefined, { numeric: true, sensitivity: "base" });
}

async function openModal(row = null) {
  if (currentView === "users") return openUserModal(row);
  if (currentView === "partsrequests") return openPartRequestReviewModal(row);
  editing = row;
  if (["vendors", "customers"].includes(currentView)) await loadMasterTermsForModal();
  $("modalSave").onclick = saveModal;
  $("modalTitle").textContent = row ? `Edit ${currentCfg.title}` : `New ${currentCfg.title}`;
  $("modalBody").innerHTML = `<div class="form-grid">${currentCfg.heads.map((h) => formField(h, row?.[h] ?? "")).join("")}</div>`;
  $("modal").style.display = "flex";
  const termBtn = $("newMasterTermBtn");
  if (termBtn) termBtn.onclick = quickCreateMasterTermInModal;
}

async function openPartRequestReviewModal(row = null) {
  editing = row;
  if (!Array.isArray(productMeta.products) || !productMeta.products.length) productMeta.products = await getAll("products");
  if (!Array.isArray(productMeta.workOrders) || !productMeta.workOrders.length) productMeta.workOrders = await getAll("work_orders").catch(() => []);
  const wo = row?.wo_id ? (productMeta.workOrders || []).find((item) => item.id === row.wo_id) : null;
  const currentPhoto = row?.request_photo_url || "";
  $("modalSave").onclick = savePartRequestReviewModal;
  $("modalTitle").textContent = row ? "Review part request" : "New part request";
  $("modalBody").innerHTML = `
    ${productOptionsDatalist()}
    <div class="part-request-review">
      <section class="part-request-photo-panel">
        <label>Requested photo</label>
        ${currentPhoto ? `<button class="thumb-btn photo-review-open" type="button" data-part-request-photo="${esc(currentPhoto)}" data-part-request-photo-title="${esc(partDisplayName(row) || "Part request photo")}"><img class="part-request-review-image" src="${esc(currentPhoto)}" alt="Requested part photo"></button>` : `<div class="empty photo-empty">No photo attached.</div>`}
        <input type="file" accept="image/*" capture="environment" data-part-request-review-file="request_photo_url">
        <input type="hidden" data-part-request-review="request_photo_url" value="${esc(currentPhoto)}">
        <small class="muted" id="partRequestPhotoStatus">Photos are compressed before saving.</small>
      </section>
      <section class="form-grid part-request-fields">
        <div class="field"><label>Work order</label><input value="${esc(wo?.wo_no || row?.wo_no || row?.wo_id || "")}" disabled></div>
        <div class="field"><label>Product lookup</label><input class="suggest-input" list="poProductOptions" data-part-request-lookup value="${esc(partDisplayName(row))}" placeholder="Search SKU, name, vendor" autocomplete="off"></div>
        ${partRequestInput("SKU", "sku", row?.sku || "")}
        ${partRequestInput("Product", "product_name", row?.product_name || "")}
        ${partRequestInput("Issue", "issue", row?.issue || "")}
        ${partRequestInput("Qty needed", "qty_needed", row?.qty_needed ?? 0, "number")}
        ${partRequestInput("Unit cost", "unit_cost", row?.unit_cost ?? 0, "number")}
        ${partRequestInput("Accepted qty", "accepted_qty", row?.accepted_qty ?? 0, "number")}
        ${partRequestSelect("Status", "status", ["Requested", "Reserved", "Shortage", "Accepted", "Released", "Removed"], row?.status || "Requested")}
        ${partRequestInput("Availability", "availability", row?.availability || "Needs part number")}
        <div class="field wide"><label>Notes</label><textarea data-part-request-review="notes">${esc(row?.notes || "")}</textarea></div>
      </section>
    </div>
    <p class="notice">If the mechanic did not know the SKU, assign the product here before the part is accepted or the work order is closed.</p>`;
  $("modal").style.display = "flex";
  document.querySelector("[data-part-request-photo]")?.addEventListener("click", (event) => {
    const target = event.currentTarget;
    openEquipmentRequestPhoto(target.dataset.partRequestPhoto, target.dataset.partRequestPhotoTitle || "Part request photo");
  });
  const lookup = document.querySelector("[data-part-request-lookup]");
  lookup.oninput = () => fillPartRequestFromLookup(lookup.value);
  const fileInput = document.querySelector("[data-part-request-review-file]");
  fileInput.onchange = () => {
    $("partRequestPhotoStatus").textContent = fileInput.files?.[0] ? "Photo ready. It will be compressed when you save." : "Photos are compressed before saving.";
  };
  setupImageDropzones($("modalBody"));
}

function partRequestInput(label, field, value, type = "text") {
  return `<div class="field"><label>${esc(label)}</label><input ${type === "number" ? 'step="0.01"' : ""} type="${type}" data-part-request-review="${esc(field)}" value="${esc(value ?? "")}"></div>`;
}

function partRequestSelect(label, field, values, value) {
  return `<div class="field"><label>${esc(label)}</label><select data-part-request-review="${esc(field)}">${values.map((item) => `<option value="${esc(item)}" ${String(item) === String(value) ? "selected" : ""}>${esc(item)}</option>`).join("")}</select></div>`;
}

function fillPartRequestFromLookup(value) {
  const product = resolveProductLookup(value);
  if (!product) return;
  const set = (field, val) => {
    const input = document.querySelector(`[data-part-request-review="${field}"]`);
    if (input) input.value = val ?? "";
  };
  set("sku", product.sku || "");
  set("product_name", product.name || "");
  set("unit_cost", product.cost ?? 0);
  set("availability", Number(product.qty || 0) > 0 ? "OK" : "Out of stock");
}

async function savePartRequestReviewModal() {
  const read = (field) => document.querySelector(`[data-part-request-review="${field}"]`)?.value?.trim() || "";
  const file = document.querySelector("[data-part-request-review-file]")?.files?.[0];
  const sku = read("sku");
  const productName = read("product_name");
  const photoUrl = read("request_photo_url");
  if (!sku && !productName && !photoUrl && !file) {
    alert("Add a SKU, product description, or photo before saving this request.");
    return;
  }
  if (!(Number(read("qty_needed") || 0) > 0)) {
    alert("Qty needed must be greater than zero.");
    return;
  }
  try {
    let requestPhotoUrl = photoUrl;
    if (file) {
      $("partRequestPhotoStatus").textContent = "Compressing and uploading photo...";
      requestPhotoUrl = await uploadWorkOrderPartPhoto(editing?.wo_no || editing?.id || "part-request", file);
    }
    const product = resolveProductLookup(`${sku} ${productName}`) || (productMeta.products || []).find((p) => p.sku === sku);
    const record = {
      issue: read("issue") || "General",
      product_id: product?.id || editing?.product_id || null,
      sku: product?.sku || sku || "TBD",
      product_name: product?.name || productName || "Photo request - parts team to identify",
      qty_needed: Number(read("qty_needed") || 0),
      unit_cost: Number(read("unit_cost") || 0),
      accepted_qty: Number(read("accepted_qty") || 0),
      status: read("status") || "Requested",
      availability: read("availability") || (product ? "OK" : "Needs part number"),
      notes: read("notes"),
    };
    if (requestPhotoUrl) record.request_photo_url = requestPhotoUrl;
    if (editing?.id) {
      await updateOneWithOptionalColumns("work_order_parts", record, "id", editing.id, ["request_photo_url"], "Part request saved, but the database needs the part request photo SQL update before photos can be stored.");
    } else {
      await insertOneWithOptionalColumns("work_order_parts", record, ["request_photo_url"], "Part request saved, but the database needs the part request photo SQL update before photos can be stored.");
    }
    closeModal();
    await loadView("partsrequests");
  } catch (error) {
    alert(error.message || error);
  }
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
  bindUserRoleAccessDefaults();
}

function bindUserRoleAccessDefaults() {
  const roleInput = document.querySelector('[data-user-field="role"]');
  if (!roleInput) return;
  const apply = () => {
    if (!/mechanic/i.test(roleInput.value || "")) return;
    document.querySelectorAll("[data-user-module]").forEach((box) => {
      box.checked = box.dataset.userModule === "repairs";
    });
  };
  roleInput.onchange = apply;
  roleInput.oninput = apply;
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
  if (h === "terms" && ["vendors", "customers"].includes(currentView)) return termsMasterField(value);
  if (/notes|description|address|reason/.test(h)) return `<div class="field wide"><label>${esc(label)}</label><textarea data-field="${h}">${esc(value)}</textarea></div>`;
  if (/date/.test(h)) return `<div class="field"><label>${esc(label)}</label><input type="date" data-field="${h}" value="${esc(String(value).slice(0, 10))}"></div>`;
  if (/amount|cost|price|rate|qty|reorder|debit|credit|deposit|hours|odometer|markup/.test(h)) return `<div class="field"><label>${esc(label)}</label><input type="number" step="0.01" data-field="${h}" value="${esc(value)}"></div>`;
  if (/status/.test(h)) return `<div class="field"><label>${esc(label)}</label><input class="suggest-input" data-field="${h}" list="${esc(h)}Options" value="${esc(value)}" placeholder="Type to search ${esc(label.toLowerCase())}" autocomplete="off"><datalist id="${esc(h)}Options">${["Active", "Open", "Draft", "Issued", "Reserved", "Out", "Complete", "Invoiced", "Paid", "Cancelled"].map((o) => `<option value="${esc(o)}"></option>`).join("")}</datalist></div>`;
  return `<div class="field"><label>${esc(label)}</label><input data-field="${h}" value="${esc(value)}"></div>`;
}

function termsMasterField(value = "") {
  const options = masterTermOptions(value);
  return `<div class="field"><label>Terms</label><input class="suggest-input" data-field="terms" list="masterTermsOptions" value="${esc(value || "")}" placeholder="Type to search terms" autocomplete="off"><datalist id="masterTermsOptions">${options.map((term) => `<option value="${esc(term)}"></option>`).join("")}</datalist><button class="rowbtn" type="button" id="newMasterTermBtn">New term</button></div>`;
}

function masterTermOptions(selected = "") {
  const defaults = ["Due on receipt", "COD", "Net 7", "Net 10", "Net 15", "Net 30", "Net 45", "Net 60", "Net 90"];
  const rowTerms = (currentRows || []).map((row) => row.terms);
  const savedTerms = productMeta.terms || [];
  return [...new Set([...defaults, ...savedTerms, ...rowTerms, selected].map((term) => String(term || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

async function loadMasterTermsForModal() {
  let terms = [];
  try {
    terms = await getAll("master_terms");
  } catch (error) {
    if (!/master_terms|schema cache|relation/i.test(error.message || "")) throw error;
  }
  const [vendors, customers] = await Promise.all([
    getAll("vendors"),
    getAll("customers"),
  ]);
  productMeta.terms = [...new Set([
    ...(terms || []).map((row) => row.name),
    ...(vendors || []).map((row) => row.terms),
    ...(customers || []).map((row) => row.terms),
  ].map((term) => String(term || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

async function rememberMasterTerm(term) {
  const value = String(term || "").trim();
  if (!value) return;
  productMeta.terms = [...new Set([...(productMeta.terms || []), value])]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  const daysMatch = value.match(/\d+/);
  const { error } = await supabase.from("master_terms").upsert({ name: value, days: daysMatch ? Number(daysMatch[0]) : 0 }, { onConflict: "name" });
  if (error && !/master_terms|schema cache|relation/i.test(error.message || "")) throw error;
}

async function quickCreateMasterTermInModal() {
  const name = prompt("Payment term name, for example Net 30 or 50% payment upon order");
  if (!name) return;
  const value = name.trim();
  try {
    await rememberMasterTerm(value);
    const field = document.querySelector('[data-field="terms"]');
    if (field) field.value = value;
  } catch (error) {
    alert(error.message || error);
  }
}

function closeModal() {
  $("modal").style.display = "none";
  document.querySelector(".modalbox")?.classList.remove("wide-modal");
  editing = null;
  $("modalSave").style.display = "";
  $("modalSave").textContent = "Save";
  $("modalCancel").textContent = "Cancel";
  $("modalSave").onclick = saveModal;
}

async function saveModal() {
  const record = {};
  document.querySelectorAll("[data-field]").forEach((el) => record[el.dataset.field] = el.value);
  const beforeData = editing ? { ...editing } : null;
  try {
    normalizeBeforeSave(record);
    if (record.terms && ["vendors", "customers"].includes(currentView)) await rememberMasterTerm(record.terms);
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
  await writeAuditLog({
    tableName: currentCfg.table,
    action: editing ? "Updated" : "Created",
    beforeData,
    afterData: editing ? { ...beforeData, ...record } : record,
  });
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
  const beforeData = currentRows.find((row) => String(row[currentCfg.key || "id"] ?? row.id) === String(key)) || null;
  const { error } = await supabase.from(currentCfg.table).delete().eq(currentCfg.key || "id", key);
  if (error) alert(error.message);
  else await writeAuditLog({ tableName: currentCfg.table, action: "Deleted", beforeData });
  loadView(currentView);
}

async function getAll(table) {
  const pageSize = 1000;
  const { count, error: countError } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (!countError && Number(count || 0) > pageSize) {
    const ranges = [];
    for (let from = 0; from < count; from += pageSize) ranges.push([from, Math.min(from + pageSize - 1, count - 1)]);
    const pages = await Promise.all(ranges.map(([from, to]) => supabase.from(table).select("*").range(from, to)));
    return pages.flatMap((page) => page.error ? [] : (page.data || []));
  }
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + pageSize - 1);
    if (error) return rows.length ? rows : [];
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
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
  if (local?.__lmsClone) {
    if (!confirm("Import this full LMS clone into this Supabase database? Matching rows will be updated and linked records will be restored.")) return;
    try {
      await importSystemClone(local);
      alert("Full LMS clone imported into this Supabase database.");
      loadView(currentView);
    } catch (error) {
      alert(error.message || error);
    } finally {
      $("fileImport").value = "";
    }
    return;
  }
  if (!confirm("Import local browser data into Supabase? Existing rows with the same reference numbers/SKUs will be updated.")) return;
  try {
    await importLocalState(local);
    alert("Local data imported into Supabase.");
    loadView(currentView);
  } catch (error) {
    alert(error.message || error);
  } finally {
    $("fileImport").value = "";
  }
}

async function exportSystemClone() {
  if (!confirm("Export a full LMS clone file from this system? This includes masters, products, fleet, purchasing, sales, repairs, accounting, users, and linked records.")) return;
  const tables = {};
  for (const table of cloneTables) {
    tables[table] = await getAll(table);
  }
  const payload = {
    __lmsClone: true,
    version: "2026-06-03",
    exportedAt: new Date().toISOString(),
    source: location.origin || "local",
    tables,
  };
  downloadBlob(JSON.stringify(payload, null, 2), `lms-imports-full-clone-${today()}.json`, "application/json;charset=utf-8");
}

async function exportOfflineCloneApp() {
  if (!confirm("Download a standalone offline LMS clone? It will include current system data for local testing and will not touch Supabase.")) return;
  const tables = {};
  for (const table of cloneTables) {
    tables[table] = await getAll(table);
  }
  const payload = {
    __lmsOfflineClone: true,
    version: "2026-06-03",
    exportedAt: new Date().toISOString(),
    source: location.origin || "local",
    tables,
  };
  downloadBlob(buildOfflineCloneHtml(payload), `LMS-Imports-Offline-Test-${today()}.html`, "text/html;charset=utf-8");
}

function buildOfflineCloneHtml(payload) {
  const tableLabels = Object.fromEntries(Object.entries(tableMap).filter(([, cfg]) => cfg.table).map(([view, cfg]) => [cfg.table, cfg.title || view]));
  const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c").replace(/<\/script/gi, "<\\/script");
  const safeLabels = JSON.stringify(tableLabels).replace(/</g, "\\u003c").replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LMS Imports Offline Test Clone</title>
  <style>
    :root { --bg:#f4f6f8; --panel:#fff; --line:#d8e0e8; --text:#17212b; --muted:#657386; --accent:#3d5965; --soft:#eef3f5; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Arial, sans-serif; color:var(--text); background:var(--bg); display:grid; grid-template-columns:230px 1fr; min-height:100vh; }
    aside { background:#26343d; color:#fff; padding:18px 12px; overflow:auto; }
    .brand { font-size:18px; font-weight:800; margin-bottom:16px; }
    .brand span { display:block; font-size:11px; color:#c7d3db; font-weight:600; margin-top:4px; }
    nav button { display:block; width:100%; text-align:left; margin:4px 0; padding:10px 12px; border:1px solid rgba(255,255,255,.12); background:transparent; color:#edf4f7; border-radius:6px; font-weight:700; cursor:pointer; }
    nav button.active { background:#405662; }
    main { min-width:0; }
    header { background:var(--panel); border-bottom:1px solid var(--line); padding:22px 28px; display:flex; gap:16px; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; }
    h1 { margin:0; font-size:26px; }
    .sub { color:var(--muted); margin-top:6px; }
    .actions { display:flex; gap:8px; flex-wrap:wrap; }
    button { border:1px solid var(--line); background:#fff; border-radius:6px; padding:9px 12px; font-weight:700; cursor:pointer; color:var(--text); }
    button.primary { background:var(--accent); color:#fff; border-color:var(--accent); }
    button.danger { color:#9d241d; border-color:#efc7c3; background:#fff6f5; }
    .content { padding:20px 28px; }
    .cards { display:grid; grid-template-columns:repeat(4,minmax(160px,1fr)); gap:12px; margin-bottom:16px; }
    .card, .panel { background:var(--panel); border:1px solid var(--line); border-radius:8px; box-shadow:0 8px 22px rgba(24,40,56,.05); }
    .card { padding:14px 16px; }
    .card span { display:block; color:var(--muted); font-size:12px; font-weight:800; text-transform:uppercase; }
    .card strong { font-size:28px; display:block; margin-top:8px; }
    .panel-head { padding:14px 16px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center; }
    input, textarea, select { border:1px solid var(--line); border-radius:6px; padding:10px; font:inherit; width:100%; }
    .search { max-width:520px; margin-bottom:14px; }
    .table-wrap { overflow:auto; max-height:68vh; }
    table { width:100%; border-collapse:collapse; min-width:900px; }
    th { position:sticky; top:0; background:#eaf0f4; z-index:1; font-size:12px; text-transform:uppercase; letter-spacing:.03em; }
    th, td { padding:10px 12px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
    tr:hover td { background:#f9fbfc; }
    .muted { color:var(--muted); }
    .modalback { position:fixed; inset:0; background:rgba(16,24,32,.28); display:none; align-items:flex-start; justify-content:center; overflow:auto; padding:10px 18px 18px; }
    .modalback.show { display:flex; }
    .modalbox { background:#fff; border-radius:8px; width:min(920px, 96vw); max-height:calc(100vh - 20px); overflow:hidden; display:flex; flex-direction:column; box-shadow:0 18px 46px rgba(0,0,0,.20); }
    .modalhead, .modalfoot { padding:14px 16px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; gap:10px; align-items:center; }
    .modalfoot { border-bottom:0; border-top:1px solid var(--line); }
    .modalbody { padding:16px; overflow:auto; }
    textarea { min-height:420px; font-family:Consolas, monospace; }
    @media(max-width:800px) { body { grid-template-columns:1fr; } aside { position:static; } .cards { grid-template-columns:1fr 1fr; } header, .content { padding:16px; } }
  </style>
</head>
<body>
  <aside>
    <div class="brand">LMS Imports<span>Offline test clone. Changes stay on this computer.</span></div>
    <nav id="nav"></nav>
  </aside>
  <main>
    <header>
      <div><h1 id="title">Dashboard</h1><div class="sub" id="sub">Offline clone exported ${esc(payload.exportedAt)}.</div></div>
      <div class="actions">
        <button id="jsonBtn">Export JSON</button>
        <button id="csvBtn">Export CSV</button>
        <button id="resetBtn" class="danger">Reset Offline Changes</button>
      </div>
    </header>
    <section class="content" id="content"></section>
  </main>
  <div class="modalback" id="modal">
    <div class="modalbox">
      <div class="modalhead"><strong>Edit offline record</strong><button id="closeBtn">x</button></div>
      <div class="modalbody"><textarea id="recordText"></textarea></div>
      <div class="modalfoot"><button id="deleteBtn" class="danger">Delete</button><div><button id="cancelBtn">Cancel</button> <button id="saveBtn" class="primary">Save Offline</button></div></div>
    </div>
  </div>
  <script>
    const embeddedClone = ${safePayload};
    const tableLabels = ${safeLabels};
    const storageKey = "lms.offlineClone." + (embeddedClone.exportedAt || "snapshot");
    let data = JSON.parse(localStorage.getItem(storageKey) || JSON.stringify(embeddedClone.tables || {}));
    let current = "products";
    let editing = null;
    const tableOrder = ${JSON.stringify(cloneTables)};
    const $ = id => document.getElementById(id);
    const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
    function save() { localStorage.setItem(storageKey, JSON.stringify(data)); }
    function rows(table) { return Array.isArray(data[table]) ? data[table] : []; }
    function boot() {
      $("nav").innerHTML = ["dashboard", ...tableOrder.filter(t => rows(t).length || tableLabels[t])].map(t => '<button data-table="'+esc(t)+'">'+esc(t === "dashboard" ? "Dashboard" : (tableLabels[t] || t))+'</button>').join("");
      document.querySelectorAll("nav button").forEach(b => b.onclick = () => { current = b.dataset.table; render(); });
      $("jsonBtn").onclick = exportJson;
      $("csvBtn").onclick = exportCsv;
      $("resetBtn").onclick = resetData;
      $("closeBtn").onclick = closeModal;
      $("cancelBtn").onclick = closeModal;
      $("saveBtn").onclick = saveRecord;
      $("deleteBtn").onclick = deleteRecord;
      render();
    }
    function render() {
      document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.table === current));
      if (current === "dashboard") return renderDashboard();
      renderTable(current);
    }
    function renderDashboard() {
      $("title").textContent = "Dashboard";
      $("sub").textContent = "Offline clone exported " + (embeddedClone.exportedAt || "") + ".";
      const totalRows = Object.values(data).reduce((s, r) => s + (Array.isArray(r) ? r.length : 0), 0);
      $("content").innerHTML = '<div class="cards">'
        + card("Total Records", totalRows)
        + card("Products", rows("products").length)
        + card("Fleet Assets", rows("assets").length)
        + card("GL Rows", rows("general_ledger").length)
        + '</div><div class="panel"><div class="panel-head"><strong>Offline Clone</strong><span class="muted">Use this file for local review and safe practice. It does not connect to Supabase.</span></div><div class="table-wrap"><table><thead><tr><th>Module</th><th>Rows</th></tr></thead><tbody>'
        + tableOrder.map(t => '<tr><td>'+esc(tableLabels[t] || t)+'</td><td>'+rows(t).length+'</td></tr>').join("")
        + '</tbody></table></div></div>';
    }
    function card(label, value) { return '<div class="card"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>'; }
    function renderTable(table) {
      const all = rows(table);
      $("title").textContent = tableLabels[table] || table;
      $("sub").textContent = all.length + " offline record" + (all.length === 1 ? "" : "s") + ". Click a row to edit this local copy.";
      const columns = [...new Set(all.flatMap(r => Object.keys(r || {})))].slice(0, 24);
      const q = document.querySelector("#offlineSearch")?.value?.toLowerCase() || "";
      const filtered = q ? all.filter(r => JSON.stringify(r).toLowerCase().includes(q)) : all;
      $("content").innerHTML = '<input id="offlineSearch" class="search" placeholder="Search this offline module" value="'+esc(q)+'">'
        + '<div class="panel"><div class="panel-head"><strong>'+esc(tableLabels[table] || table)+'</strong><div class="actions"><button class="primary" id="addBtn">Add offline row</button></div></div><div class="table-wrap"><table><thead><tr>'
        + columns.map(c => '<th>'+esc(c)+'</th>').join("")
        + '</tr></thead><tbody>'
        + (filtered.length ? filtered.map((r) => '<tr data-id="'+esc(rowIdentity(r))+'">'+columns.map(c => '<td>'+esc(formatCell(r[c]))+'</td>').join("")+'</tr>').join("") : '<tr><td class="muted">No records.</td></tr>')
        + '</tbody></table></div></div>';
      $("offlineSearch").oninput = render;
      $("addBtn").onclick = () => openRecord({});
      document.querySelectorAll("tbody tr[data-id]").forEach(tr => tr.onclick = () => openRecord(all.find(r => rowIdentity(r) === tr.dataset.id)));
    }
    function rowIdentity(r) { return String(r?.id || r?.sku || r?.asset_tag || r?.po_no || r?.order_no || r?.wo_no || r?.invoice_no || r?.reference || JSON.stringify(r)); }
    function formatCell(v) {
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v).length > 160 ? String(v).slice(0, 160) + "..." : v;
    }
    function openRecord(record) {
      editing = record;
      $("recordText").value = JSON.stringify(record, null, 2);
      $("modal").classList.add("show");
    }
    function closeModal() { $("modal").classList.remove("show"); editing = null; }
    function saveRecord() {
      let parsed;
      try { parsed = JSON.parse($("recordText").value); } catch (e) { alert("Fix the JSON before saving: " + e.message); return; }
      const list = rows(current);
      const oldId = editing ? rowIdentity(editing) : "";
      const index = list.findIndex(r => rowIdentity(r) === oldId);
      if (index >= 0) list[index] = parsed; else list.push(parsed);
      data[current] = list;
      save();
      closeModal();
      render();
    }
    function deleteRecord() {
      if (!editing || !confirm("Delete this offline row?")) return;
      data[current] = rows(current).filter(r => rowIdentity(r) !== rowIdentity(editing));
      save();
      closeModal();
      render();
    }
    function exportJson() {
      download(JSON.stringify({ ...embeddedClone, exportedAt: new Date().toISOString(), tables: data }, null, 2), "lms-offline-edited-clone.json", "application/json");
    }
    function exportCsv() {
      if (current === "dashboard") return;
      const all = rows(current);
      const columns = [...new Set(all.flatMap(r => Object.keys(r || {})))];
      const csv = [columns, ...all.map(r => columns.map(c => r[c] ?? ""))].map(row => row.map(v => '"'+String(typeof v === "object" ? JSON.stringify(v) : v ?? "").replace(/"/g, '""')+'"').join(",")).join("\\n");
      download(csv, current + ".csv", "text/csv");
    }
    function resetData() {
      if (!confirm("Reset this offline file back to the embedded clone snapshot?")) return;
      localStorage.removeItem(storageKey);
      data = JSON.parse(JSON.stringify(embeddedClone.tables || {}));
      render();
    }
    function download(content, fileName, type) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([content], { type }));
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    boot();
  </script>
</body>
</html>`;
}

async function importSystemClone(clone) {
  if (!clone?.tables || typeof clone.tables !== "object") throw new Error("This clone file is not valid.");
  const rowCount = Object.values(clone.tables).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
  if (!rowCount) throw new Error("This clone file does not contain any records.");
  const skipped = [];
  for (const table of cloneImportOrder) {
    const rows = Array.isArray(clone.tables[table]) ? clone.tables[table].map(cleanCloneRow) : [];
    if (!rows.length) continue;
    try {
      await upsertCloneRows(table, rows);
    } catch (error) {
      if (!cloneImportOptionalTables.has(table)) throw error;
      skipped.push(`${table}: ${error.message || error}`);
    }
  }
  if (skipped.length) alert(`Clone imported, but these optional records were skipped:\n\n${skipped.join("\n")}\n\nFor users, create the matching Supabase Auth users in the test project, then recreate module access in User Master.`);
}

function cleanCloneRow(row) {
  const copy = { ...row };
  Object.keys(copy).forEach((key) => {
    if (copy[key] === undefined) delete copy[key];
  });
  return copy;
}

async function upsertCloneRows(table, rows) {
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function loadSampleData() {
  if (!confirm("Clear existing sample/test data and reload fresh sample data into Supabase? Your company setup and real entries will stay.")) return;
  try {
    await clearBusinessData();
    await seedDefaultChartOfAccounts();
    const local = sampleState();
    await importLocalState(local);
    alert("Fresh sample data loaded.");
    loadView(currentView);
  } catch (error) {
    alert(error.message || error);
  }
}

async function clearTestData() {
  if (!confirm("Clear only the built-in sample/test data from Supabase? Your Chart of Accounts, users, and non-sample records will stay.")) return;
  try {
    await clearBusinessData();
    await seedDefaultChartOfAccounts();
    alert("Test data cleared.");
    loadView(currentView);
  } catch (error) {
    alert(error.message || error);
  }
}

async function clearBusinessData() {
  await clearSampleDataOnly();
}

async function clearSampleDataOnly() {
  const sample = sampleState();
  const poNos = (sample.purchaseOrders || []).map((po) => po.number);
  const soNos = (sample.orders || []).map((so) => so.number);
  const woNos = (sample.repairs || []).map((wo) => wo.workOrder);
  const invoiceNos = (sample.invoices || []).map((inv) => inv.number).concat(woNos);
  const rentalNos = (sample.rentals || []).map((r) => r.number);
  const requestNos = (sample.equipmentRequests || []).map((r) => r.requestNo);
  const skus = (sample.products || []).map((p) => p.sku);
  const assetTags = (sample.assets || []).map((a) => a.assetTag);
  const vendorNames = (sample.contacts || []).filter((c) => c.type === "Supplier").map((c) => c.name);
  const customerNames = (sample.contacts || []).filter((c) => c.type === "Customer").map((c) => c.name);
  const mechanicNames = (sample.mechanics || []).map((m) => m.name);
  const categoryNames = [...new Set((sample.products || []).map((p) => p.category).filter(Boolean))];
  const unitNames = [...new Set((sample.products || []).map((p) => p.unit).filter(Boolean))];
  const warehouseNames = [...new Set((sample.products || []).map((p) => p.warehouse).filter(Boolean))];
  const assetTypeNames = [...new Set((sample.assets || []).map((a) => a.type).filter(Boolean))];
  const assetLocationNames = [...new Set((sample.assets || []).map((a) => a.location).filter(Boolean))];

  const poIds = await idsFor("purchase_orders", "po_no", poNos);
  const soIds = await idsFor("sales_orders", "order_no", soNos);
  const woIds = await idsFor("work_orders", "wo_no", woNos);
  const invoiceIds = await idsFor("invoices", "invoice_no", invoiceNos);

  await deleteWhereIn("invoice_lines", "invoice_id", invoiceIds);
  await deleteWhereIn("work_order_labor", "wo_id", woIds);
  await deleteWhereIn("work_order_parts", "wo_id", woIds);
  await deleteWhereIn("work_order_issues", "wo_id", woIds);
  await deleteWhereIn("sales_order_lines", "order_id", soIds);
  await deleteWhereIn("purchase_order_lines", "po_id", poIds);

  await deleteWhereIn("customer_payments", "receipt_no", (sample.customerPayments || []).map((p) => p.receiptNo));
  await deleteWhereIn("invoices", "invoice_no", invoiceNos);
  await deleteWhereIn("check_runs", "reference", invoiceNos.concat(poNos));
  await deleteWhereIn("bank_transactions", "reference", ["ACH-8891", "R-3003"].concat(invoiceNos, poNos, soNos));
  await deleteWhereIn("general_ledger", "reference", invoiceNos.concat(poNos, soNos, woNos, (sample.customerPayments || []).map((p) => p.receiptNo)));
  await deleteWhereIn("work_orders", "wo_no", woNos);
  await deleteWhereIn("rentals", "rental_no", rentalNos);
  await deleteWhereIn("sales_orders", "order_no", soNos);
  await deleteWhereIn("goods_receipts", "po_no", poNos);
  await deleteWhereIn("purchase_orders", "po_no", poNos);
  await deleteWhereIn("stock_movements", "document_no", poNos.concat(soNos, woNos));
  await deleteWhereIn("product_alternates", "sku", skus);
  await deleteWhereIn("products", "sku", skus);
  await deleteWhereIn("equipment_requests", "request_no", requestNos);
  await deleteWhereIn("assets", "asset_tag", assetTags);
  await deleteWhereIn("mechanics", "name", mechanicNames);
  await deleteWhereIn("vendors", "name", vendorNames);
  await deleteWhereIn("customers", "name", customerNames);
  await deleteWhereIn("categories", "name", categoryNames);
  await deleteWhereIn("units", "name", unitNames);
  await deleteWhereIn("warehouses", "name", warehouseNames);
  await deleteWhereIn("asset_locations", "name", assetLocationNames);
  await deleteWhereIn("asset_types", "name", assetTypeNames);
}

async function idsFor(table, column, values) {
  const clean = [...new Set(values.filter(Boolean))];
  if (!clean.length) return [];
  const { data, error } = await supabase.from(table).select("id").in(column, clean);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data || []).map((row) => row.id).filter(Boolean);
}

async function deleteWhereIn(table, column, values, chunkSize = 150) {
  const clean = [...new Set((values || []).filter((value) => value !== null && value !== undefined && value !== ""))];
  if (!clean.length) return;
  for (let i = 0; i < clean.length; i += chunkSize) {
    const chunk = clean.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).delete().in(column, chunk);
    if (error) {
      if (/does not exist|schema cache|column/i.test(error.message || "")) {
        console.warn(`Skipped ${table}.${column} cleanup`, error);
        continue;
      }
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

async function seedDefaultChartOfAccounts() {
  await ensureChartColumnsReady();
  await upsertMany("chart_of_accounts", defaultChartOfAccounts().map((account) => {
    const row = {
      account: account.account,
      type: account.type,
      normal_balance: account.normal_balance,
      notes: account.notes || null,
    };
    if (productMeta.chartExtraColumns) {
      row.account_code = account.account_code || null;
      row.old_account = account.old_account || null;
      row.old_account_code = account.old_account_code || null;
      row.report_group = account.report_group || statementGroup(account.type);
    }
    return row;
  }), "account");
}

async function seedRequiredChartOfAccounts() {
  await ensureChartColumnsReady();
  const required = defaultChartOfAccounts().filter((account) => ["Landed Cost Accrual", "Parts in Transit", "Parts Accrual"].includes(account.account));
  await upsertMany("chart_of_accounts", required.map((account) => {
    const row = {
      account: account.account,
      type: account.type,
      normal_balance: account.normal_balance,
      notes: account.notes || null,
    };
    if (productMeta.chartExtraColumns) {
      row.account_code = account.account_code || null;
      row.old_account = account.old_account || null;
      row.old_account_code = account.old_account_code || null;
      row.report_group = account.report_group || statementGroup(account.type);
    }
    return row;
  }), "account");
}

function defaultChartOfAccounts() {
  const rows = [
    ["FHB Checking", "10000001", "FHB Checking", "10000001", "Balance Sheet"],
    ["Credit Card Receivable", "10040001", "Credit Card Receivable", "10040001", "Balance Sheet"],
    ["Accounts Receivable (A/R)", "10400001", "Accounts Receivable (A/R)", "10400001", "Balance Sheet"],
    ["New Sany", "12008001", "Heavy Equipment Asset", "12000000", "Balance Sheet"],
    ["New Rubblemaster", "12012001", "Heavy Equipment Asset", "12000000", "Balance Sheet"],
    ["New Other Equipment", "12014001", "Heavy Equipment Asset", "12000000", "Balance Sheet"],
    ["Acc Dep", "12050001", "Acc Dep", "12050001", "Balance Sheet"],
    ["Fixed Asset - Equipment", "12060001", "Other Fixed Asset", "12060001", "Balance Sheet"],
    ["Furniture & Fixture", "12061001", "Furniture & Fixture", "12061001", "Balance Sheet"],
    ["Parts Inventory - Service Oil", "12100001", "Parts Inventory", "12100001", "Balance Sheet"],
    ["Parts Inventory - Taylor", "12101001", "Parts Inventory", "12100001", "Balance Sheet"],
    ["Parts Inventory - Napa", "12102001", "Parts Inventory", "12100001", "Balance Sheet"],
    ["Parts Inventory - Hustler", "12103001", "Parts Inventory", "12100001", "Balance Sheet"],
    ["Parts Inventory - Other", "12104001", "Parts Inventory", "12100001", "Balance Sheet"],
    ["Intercompany - LMS Main", "13000001", "Intercompany - LMS Main", "13000001", "Balance Sheet"],
    ["Intercompany - PFM", "13010001", "Intercompany - PFM", "13010001", "Balance Sheet"],
    ["Intercompany - GWM", "13020001", "Intercompany - GWM", "13020001", "Balance Sheet"],
    ["Intercompany - Salas Holdings", "13026000", "Intercompany - Salas Holdings", "13026000", "Balance Sheet"],
    ["Intercompany - Proferre", "13027001", "Intercompany - Proferre", "13027001", "Balance Sheet"],
    ["Intercompany - The Pit", "13028001", "Intercompany - The Pit", "13028001", "Balance Sheet"],
    ["Accounts Payable (A/P)", "20000001", "Accounts Payable (A/P)", "20000001", "Balance Sheet"],
    ["Credit Card Payable - LMS Impo", "20020001", "Credit Card Payable - LMS Impo", "20020001", "Balance Sheet"],
    ["Customer Deposit", "20040001", "Customer Deposit", "20040001", "Balance Sheet"],
    ["Commission", "22000001", "Commission", "22000001", "Balance Sheet"],
    ["Parts Accrual", "23000001", "Parts Accrual", "23000001", "Balance Sheet"],
    ["Landed Cost Accrual", "23010001", "Landed Cost Accrual", "23010001", "Balance Sheet"],
    ["Parts in Transit", "23050001", "Parts in Transit", "23050001", "Balance Sheet"],
    ["Retained Earnings", "29000001", "Retained Earnings", "29000001", "Balance Sheet"],
    ["Counter Taylor Sales", "32000301", "Parts Sales", "32000301", "Income Statement"],
    ["Shop Taylor Sales", "32001301", "Parts Sales", "32000301", "Income Statement"],
    ["Internal Taylor Sales", "32003301", "Parts Sales", "32000301", "Income Statement"],
    ["Counter Napa Sales", "32010301", "Parts Sales", "32000301", "Income Statement"],
    ["Shop Napa Sales", "32011301", "Parts Sales", "32000301", "Income Statement"],
    ["Internal Napa Sales", "32013301", "Parts Sales", "32000301", "Income Statement"],
    ["Counter Hustler Sales", "32020301", "Parts Sales", "32000301", "Income Statement"],
    ["Shop Hustler Sales", "32021301", "Parts Sales", "32000301", "Income Statement"],
    ["Counter Other Parts Sales", "32030301", "Parts Sales", "32000301", "Income Statement"],
    ["Shop Other Parts Sales", "32031301", "Other Sales", "32031301", "Income Statement"],
    ["Internal Other Parts Sales", "32033301", "Other Sales", "32031301", "Income Statement"],
    ["LMS Service", "34010401", "LMS Service - Sales", "34010401", "Income Statement"],
    ["DELIVERY CHARGE", "34050401", "DELIVERY CHARGE", "34050401", "Income Statement"],
    ["DIAGNOSTIC FEE", "34070401", "DIAGNOSTIC FEE", "34070401", "Income Statement"],
    ["DIAGNOSTIC FEE NAVAL BASE GUAM", "34080401", "DIAGNOSTIC FEE NAVAL BASE GUAM", "34080401", "Income Statement"],
    ["Sales - Equipment Rental", "35000501", "Sales - Equipment Rental", "35000501", "Income Statement"],
    ["COGS - Used Sale Other", "41022201", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Counter Taylor Sales", "42000301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Shop Taylor Sales", "42001301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Internal Taylor Sales", "42003301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Counter Napa Sales", "42010301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Shop Napa Sales", "42011301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Internal Napa Sales", "42013301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Counter Hustler Sales", "42020301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Shop Hustler Sales", "42021301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Counter Other Parts Sales", "42030301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Shop Other Parts Sales", "42031301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - Internal Other Parts Sa", "42033301", "COGS - Parts", "41022201", "Income Statement"],
    ["COGS - LMS Service", "44010401", "COGS - LMS Service", "44010401", "Income Statement"],
    ["QUOTE GAIN/LOSS", "49100301", "QUOTE GAIN/LOSS", "49100301", "Income Statement"],
    ["QUOTE GAIN/LOSS", "49100401", "QUOTE GAIN/LOSS", "49100301", "Income Statement"],
    ["QUOTE GAIN/LOSS OTHER", "49500401", "QUOTE GAIN/LOSS", "49100301", "Income Statement"],
    ["Depreciation Expense", "5000101", "Depreciation Expense", "5000101", "Income Statement"],
    ["Depreciation Expense", "5000201", "Depreciation Expense", "5000101", "Income Statement"],
    ["Depreciation Expense", "5000301", "Depreciation Expense", "5000101", "Income Statement"],
    ["Depreciation Expense", "5000401", "Depreciation Expense", "5000101", "Income Statement"],
    ["Dues & subscription", "50010301", "Dues & subscription", "50010301", "Income Statement"],
    ["Job Supplies", "51000401", "Job Supplies", "51000401", "Income Statement"],
    ["Operation Supplies", "51040401", "Job Supplies", "51000401", "Income Statement"],
    ["Personnel Expenses", "51080401", "Indirect Labor", "51080401", "Income Statement"],
    ["RESTOCKING FEE", "51090301", "Miscellaneous Expense", "90000001", "Income Statement"],
    ["Repairs & Maintenance", "51150501", "Repairs & Maintenance", "51150501", "Income Statement"],
    ["Training Expense", "51200401", "Training Expense", "51200401", "Income Statement"],
    ["Freight", "53010301", "Freight", "53010301", "Income Statement"],
    ["Finance Charges", "53030101", "Freight", "53010301", "Income Statement"],
    ["Communications", "55000301", "Communications", "55000301", "Income Statement"],
    ["Bank Charges and Fees", "57000301", "Bank Charges and Fees", "57000301", "Income Statement"],
    ["Misc Income", "60000301", "Misc Income", "60000301", "Income Statement"],
    ["Inventory Loss - Obsolete Part", "80000301", "Inventory Loss - Obsolete Part", "80000301", "Income Statement"],
  ];
  const grouped = new Map();
  rows.forEach(([old_account, old_account_code, account, account_code, report_group]) => {
    const existing = grouped.get(account) || { oldNames: new Set(), oldCodes: new Set(), account_code, account, report_group };
    if (old_account) existing.oldNames.add(old_account);
    if (old_account_code) existing.oldCodes.add(old_account_code);
    grouped.set(account, existing);
  });
  return [...grouped.values()].map(({ oldNames, oldCodes, account_code, account, report_group }) => {
    const type = accountTypeFromStatement(account, report_group);
    const oldNameText = [...oldNames].filter((name) => name !== account).join(", ");
    const oldCodeText = [...oldCodes].filter((code) => code !== account_code).join(", ");
    return {
      account_code,
      old_account: oldNameText,
      old_account_code: oldCodeText,
      account,
      report_group,
      type,
      normal_balance: /acc dep|accum/i.test(account) ? "Credit" : normalBalance(type),
      notes: oldNameText || oldCodeText ? `Old mapping: ${[oldNameText, oldCodeText].filter(Boolean).join(" | ")}` : "",
    };
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
    equipmentRequests: [
      { requestNo: "ER-1001", requestDate: today(), assetTag: "TRK-01", assetName: "Delivery Truck 1", requestedBy: "Miguel", poNo: "EQREQ-001", fromDate: today(), toDate: today(), approvedBy: "Bryan.dy", status: "Approved", notes: "Sample daily equipment request" },
      { requestNo: "ER-1002", requestDate: today(), assetTag: "EQ-14", assetName: "Compact Excavator", requestedBy: "Ari", poNo: "EQREQ-002", fromDate: today(), toDate: today(), approvedBy: "", status: "Requested", notes: "Sample jobsite equipment request" },
    ],
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
      size: row.size || row.asset_size || row.equipment_size || "",
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
  await upsertManyWithOptionalColumns("assets", assets, "asset_tag", ["parent_asset_id", "parent_asset_tag", "relationship_type", "compatible_with", "old_qr_code", "qr_printed_tagged", "last_update_date", "gps_location", "requested_by", "approved_by", "repair_po_no", "size"]);
  const dbAssets = await getAll("assets");
  const assetByTag = new Map(dbAssets.map((row) => [row.asset_tag, row]));
  const relationshipUpdates = assets
    .filter((a) => a.parent_asset_tag)
    .map((a) => ({ ...a, parent_asset_id: assetByTag.get(a.parent_asset_tag)?.id || null }));
  await upsertManyWithOptionalColumns("assets", relationshipUpdates, "asset_tag", ["parent_asset_id", "parent_asset_tag", "relationship_type", "compatible_with", "old_qr_code", "qr_printed_tagged", "last_update_date", "gps_location", "requested_by", "approved_by", "repair_po_no", "size"]);
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
    size: a.size || null,
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
    qr_update_url: a.qrUpdateUrl || assetQrUrl({ asset_tag: a.assetTag, vin_serial: a.vinSerial, purchaseDate: a.purchaseDate }),
    parent_asset_tag: a.parentAssetTag || null,
    relationship_type: a.relationshipType || (a.parentAssetTag ? "Attachment" : "Standalone"),
    compatible_with: a.compatibleWith || null,
    requested_by: a.requestedBy || null,
    approved_by: a.approvedBy || null,
    notes: a.notes || null,
  };
}

function parseCsv(text) {
  const rows = parseCsvMatrix(text);
  const headers = rows.shift() || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function parseCsvMatrix(text) {
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
  return rows;
}

function contact(type, name, email, phone, address, terms, taxId, notes) {
  return { type, name, email, phone, address, terms, taxId, notes };
}

function product(id, sku, name, category, unit, warehouse, qty, reorder, cost, price, location, supplier) {
  return { id, sku, name, category, unit, warehouse, qty, reorder, cost, price, location, supplier, status: qty <= reorder ? "Low" : "Active", notes: "", compatibleWith: "", alternateSkus: "" };
}

function asset(id, assetTag, type, name, make, model, year, color, vinSerial, plate, location, status, odometer, hours, operator, purchaseCost, parentAssetTag = "", relationshipType = "Standalone", compatibleWith = "", size = "") {
  return { id, assetTag, type, name, make, model, year, color, size, vinSerial, plate, location, status, odometer, hours, operator, purchaseCost, parentAssetTag, relationshipType, compatibleWith, fuel: "Diesel", purchaseDate: "2024-01-15", insurance: "", registrationExpiry: "2027-12-31", notes: "" };
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
  const assetByTag = new Map(dbAssets.map((row) => [row.asset_tag, row]));
  const assetByLocalId = new Map();
  (local.assets || []).forEach((a) => {
    const db = dbAssets.find((row) => row.asset_tag === a.assetTag);
    if (db) assetByLocalId.set(a.id, db);
  });
  await upsertMany("equipment_requests", (local.equipmentRequests || []).map((r, i) => {
    const rawItems = Array.isArray(r.assetItems) ? r.assetItems : (Array.isArray(r.asset_items) ? r.asset_items : []);
    const items = rawItems.map((item) => {
      const itemAsset = assetByTag.get(item.assetTag || item.asset_tag);
      return {
        asset_id: itemAsset?.id || item.asset_id || null,
        asset_tag: item.assetTag || item.asset_tag || itemAsset?.asset_tag || "",
        asset_name: item.assetName || item.asset_name || itemAsset?.name || "",
        location: item.location || itemAsset?.location || "",
        pdi_required: Boolean(item.pdiRequired || item.pdi_required),
        wo_no: item.woNo || item.wo_no || "",
        status: item.status || "",
      };
    }).filter((item) => item.asset_tag);
    const asset = assetByTag.get(r.assetTag || r.asset_tag) || (items[0]?.asset_tag ? assetByTag.get(items[0].asset_tag) : null);
    const requestItems = items.length ? items : (asset || r.assetTag || r.asset_tag ? [{
      asset_id: asset?.id || null,
      asset_tag: r.assetTag || r.asset_tag || asset?.asset_tag || "",
      asset_name: r.assetName || r.asset_name || asset?.name || "",
      location: r.location || asset?.location || "",
    }] : []);
    const firstItem = requestItems[0] || {};
    return {
      request_no: r.requestNo || r.request_no || `ER-${1001 + i}`,
      request_date: r.requestDate || r.request_date || today(),
      asset_id: firstItem.asset_id || asset?.id || null,
      asset_tag: firstItem.asset_tag || r.assetTag || r.asset_tag || null,
      asset_name: firstItem.asset_name || r.assetName || r.asset_name || asset?.name || null,
      location: r.location || firstItem.location || asset?.location || null,
      asset_items: requestItems,
      requested_by: r.requestedBy || r.requested_by || "Requester",
      email_address: r.emailAddress || r.email_address || r.email || null,
      requested_signature: r.requestedSignature || r.requested_signature || null,
      po_no: r.poNo || r.po_no || null,
      from_date: r.fromDate || r.from_date || today(),
      to_date: r.toDate || r.to_date || r.fromDate || today(),
      approved_by: r.approvedBy || r.approved_by || null,
      status: r.status || "Requested",
      notes: r.notes || null,
    };
  }).filter((r) => r.request_no && r.asset_tag && r.requested_by), "request_no");

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
          receipt_warehouse: p?.warehouse || null,
          receipt_bin_shelf: p?.bin_shelf || null,
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
      await upsertManyWithOptionalColumns("goods_receipts", receiptRows, "gr_no", ["receipt_warehouse", "receipt_bin_shelf"]);
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
    const saved = await upsertOneWithOptionalColumns("sales_orders", row, "order_no", ["payment_mode"], "Saved sample sales orders. Add the sales-order payment mode database update when you want payment mode stored.");
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
  const { error } = await supabase.from("chart_of_accounts").select("account_code,old_account,old_account_code,report_group").limit(1);
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

async function insertOneWithOptionalColumns(table, row, optionalColumns = [], warning = "") {
  let retryRow = { ...row };
  const skipped = [];
  for (let attempt = 0; attempt <= optionalColumns.length; attempt += 1) {
    try {
      const saved = await insertOne(table, retryRow);
      if (skipped.length && warning) alert(warning);
      return saved;
    } catch (error) {
      const missing = optionalColumns.find((column) => column in retryRow && isMissingSchemaColumn(error, column));
      if (!missing) throw error;
      delete retryRow[missing];
      skipped.push(missing);
    }
  }
  return insertOne(table, retryRow);
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

async function upsertManyWithOptionalColumns(table, rows, onConflict, optionalColumns = [], warning = "") {
  if (!rows.length) return [];
  let retryRows = rows.map((row) => ({ ...row }));
  const skipped = [];
  for (let attempt = 0; attempt <= optionalColumns.length; attempt += 1) {
    try {
      const saved = await upsertMany(table, retryRows, onConflict);
      if (skipped.length && warning) alert(warning);
      return saved;
    } catch (error) {
      const missing = optionalColumns.find((column) => retryRows.some((row) => column in row) && isMissingSchemaColumn(error, column));
      if (!missing) throw error;
      retryRows = retryRows.map((row) => {
        const copy = { ...row };
        delete copy[missing];
        return copy;
      });
      skipped.push(missing);
    }
  }
  return upsertMany(table, retryRows, onConflict);
}

function uniqueMasterRows(values) {
  return [...new Set(values.map((v) => String(v || "").trim()).filter(Boolean))].map((name) => ({ name }));
}

function uniqueNamedRows(rows) {
  const byName = new Map();
  (rows || []).forEach((row) => {
    const name = String(row?.name || "").trim();
    if (!name || byName.has(name.toLowerCase())) return;
    byName.set(name.toLowerCase(), { ...row, name });
  });
  return [...byName.values()];
}
