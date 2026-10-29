# September 2026 period-close reconciliation

- AP detail initially $91,065.75; control ledger $86,666.10.
- Exact difference $4,399.65: JCB $3,570.16 (CHK-1108), Rock Auto $642.34 (CHK-1102), WasteCorp Pump $187.15 (CHK-1101). Payments posted in September; corresponding bills posted in October.
- Report fix exposes dated, document-supported payment-before-posting credits. No AP dates, bills, payments, or control postings changed. Verified detail now $86,666.10 with zero party differences.
- Inventory: GR-6047-1 stock movement is 10 x $15.859 = $158.59; original GL inventory debit $158.60. Posted balanced correction ROUND-GR-6047-1-20260930 on September 30: debit Miscellaneous Expense $0.01, credit Parts Inventory $0.01. September is open; original entries retained. Verified inventory GL $1,191,456.08 matches stock detail.
- Forward receipt posting already uses quantity x full-precision unit cost; added this exact case to regression coverage.
- PO-7095 / GR-6096: user confirmed only 3 pins received. Recorded invoice $1,747.60 equals 10 x $174.76. Awaiting whether vendor invoice covers 3 or all 10; quantity and invoice not changed pending that clarification.
- Accounting period remains closed through August 31, 2026. No period was closed by this work.
