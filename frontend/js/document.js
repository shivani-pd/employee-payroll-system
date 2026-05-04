const DOC_API = "http://127.0.0.1:8080/api/documents";
// GLOBAL DOCUMENT CACHE (used by preview & download)
let ALL_DOCUMENTS = [];




// ------------------------------------------------
// MODAL CONTROLS
// ------------------------------------------------
function openUploadModal() {
    const modal = document.getElementById("uploadModal");
    if (modal) modal.style.display = "block";
}

function closeUploadModal() {
    const modal = document.getElementById("uploadModal");
    if (modal) modal.style.display = "none";
}


// ------------------------------------------------
// MASTER REFRESH
// ------------------------------------------------
function refreshAll() {
    console.log("🔄 Refreshing ALL...");
    loadSummary();
    updateKPIs();
    loadDocuments();
    updateLatestUpload();
    loadGovernanceCards();
    updateCardTimestamps();
}


// ------------------------------------------------
// EXPORT SYSTEM
// ------------------------------------------------
function exportDocuments() {
    const choice = prompt("Export Format:\n1 = CSV\n2 = PDF Report");
    if (choice === "1") exportCSV();
    else if (choice === "2") exportPDF();
}

function exportCSV() {
    fetch(`${DOC_API}/summary`)
        .then(r => r.json())
        .then(data => {

            let csv =
                "Employee,Payslips,Contracts,Tax Docs,Reimbursements\n";

            data.forEach(row => {
                csv += `${row.employeeName},${row.payslips},${row.contracts},${row.tax},${row.reimbursements}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "Document_Summary.csv";
            a.click();

            URL.revokeObjectURL(url);
        });
}

function exportPDF() {
    fetch(`${DOC_API}/summary`)
        .then(r => r.json())
        .then(data => {

            const win = window.open("", "_blank");

            let rows = "";
            data.forEach(row => {
                rows += `
                    <tr>
                        <td>${row.employeeName}</td>
                        <td>${row.payslips}</td>
                        <td>${row.contracts}</td>
                        <td>${row.tax}</td>
                        <td>${row.reimbursements}</td>
                    </tr>`;
            });

            win.document.write(`
                <html>
                <head>
                <style>
                    body{font-family:Arial;padding:40px}
                    table{width:100%;border-collapse:collapse}
                    th,td{border:1px solid #ccc;padding:10px}
                    th{background:#f4f6f8}
                </style>
                </head>
                <body>
                    <h2>PayrollPro Document Report</h2>
                    <p>${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Payslips</th>
                                <th>Contracts</th>
                                <th>Tax</th>
                                <th>Reimbursements</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </body>
                </html>
            `);

            win.document.close();
            win.print();
        });
}


// ------------------------------------------------
// SAVE DOCUMENT
// ------------------------------------------------
// -------------------------------
// SAVE DOCUMENT (REAL FILE UPLOAD)
// -------------------------------
function saveDocument() {

    const nameInput = document.getElementById("docName");
    const categoryInput = document.getElementById("docCategory");
    const employeeInput = document.getElementById("employeeId");
    const fileInput = document.getElementById("docFile");

    if (!nameInput?.value || !fileInput?.files.length) {
        alert("Please select a file and enter document name");
        return;
    }

    const formData = new FormData();

    formData.append("file", fileInput.files[0]);
    formData.append("documentName", nameInput.value);
    formData.append("documentType", categoryInput.value);
    formData.append("employeeId", employeeInput.value);

    fetch(`${DOC_API}/upload`, {
        method: "POST",
        body: formData
        // ❌ DO NOT add Content-Type manually
        // browser sets multipart boundary automatically
    })
    .then(res => {
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
    })
    .then(() => {
        closeUploadModal();
        refreshAll();

        // reset form
        nameInput.value = "";
        employeeInput.value = "";
        fileInput.value = "";

        alert("✅ Document uploaded successfully");
    })
    .catch(err => {
        console.error("Upload Error:", err);
        alert("Upload failed");
    });
}
// ------------------------------------------------
// LOAD DOCUMENT TABLE
// ------------------------------------------------
function loadDocuments() {

    const categorySelect =
        document.getElementById("docFilter") ||
        document.querySelector(".workspace-actions select");

    const selectedType = categorySelect
        ? categorySelect.value
        : "All Categories";

    console.log("🔍 Filtering:", selectedType);

    const map = {
        "Payslips": "Payslip",
        "Tax Documents": "Tax",
        "Contracts": "Contract",
        "Reimbursements": "Reimbursement"
    };

    let url = DOC_API;

    if (selectedType !== "All Categories") {
        const backendType = map[selectedType];
        if (backendType) url += `?type=${backendType}`;
    }

    fetch(url)
.then(r => r.json())
.then(docs => {

    ALL_DOCUMENTS = docs; // ✅ GLOBAL CACHE

    const table = document.getElementById("documentTableBody");
            if (!table) return;

            if (!docs || docs.length === 0) {
                table.innerHTML =
                    `<tr>
                        <td colspan="6" class="empty-state">
                            📂 No documents found
                        </td>
                    </tr>`;
                return;
            }

            let html = "";

            // Enterprise behaviour → virtualized preview (first 50)
            docs.slice(0, 50).forEach(doc => {

                html += `
                <tr class="doc-row">

                    <td class="doc-id">${doc.id}</td>

                    <td class="doc-name">
                        ${getDocIcon(doc.documentType)}
                        <span class="file-name">
                            ${doc.documentName}
                        </span>
                    </td>

                    <td>
                        <span class="tag">${doc.documentType}</span>
                    </td>

                    <td>${doc.employeeName || "-"}</td>

                    <td>${formatDate(doc.uploadDate)}</td>

                    <td class="table-actions">

                        <!-- Preview -->
                        <button class="icon-btn preview"
                            title="Preview"
                            onclick="previewDocument(${doc.id})">
                            👁
                        </button>

                        <!-- Download -->
                        <button class="icon-btn download"
                            title="Download"
                            onclick="downloadDocument(${doc.id})">
                            ⬇
                        </button>

                        <!-- Delete -->
                        <button class="icon-btn delete"
                            title="Delete"
                            onclick="deleteDoc(${doc.id})">
                            🗑
                        </button>

                    </td>

                </tr>`;
            });

            table.innerHTML = html;

            console.log("📋 Loaded", docs.length, "documents");

        })
        .catch(err => console.error("Load error:", err));
}

// ------------------------------------------------
// SUMMARY TABLE
// ------------------------------------------------
function loadSummary() {

    fetch(`${DOC_API}/summary`)
        .then(r => r.json())
        .then(data => {

            const table =
                document.getElementById("documentSummaryBody");

            if (!table) return;

            let html = "";

            data.forEach(row => {
                html += `
                    <tr>
                        <td>${row.employeeName}</td>
                        <td>${row.payslips}</td>
                        <td>${row.contracts}</td>
                        <td>${row.tax}</td>
                        <td>${row.reimbursements}</td>
                    </tr>`;
            });

            table.innerHTML = html;
        });
}


// ------------------------------------------------
// DELETE
// ------------------------------------------------
function deleteDoc(id) {
    if (!confirm("Delete this document?")) return;

    fetch(`${DOC_API}/${id}`, { method: "DELETE" })
        .then(refreshAll);
}


// ------------------------------------------------
// KPI UPDATE
// ------------------------------------------------
function updateKPIs() {

    fetch(`${DOC_API}/stats`)
        .then(r => r.json())
        .then(stats => {

            setValue("kpi-total-value", stats.total);
            setValue("kpi-payslip-value", stats.payslips);
            setValue("kpi-tax-value", stats.tax);
            setValue("kpi-contract-value", stats.contracts);

            setValue("card-payslip-count", stats.payslips);
            setValue("card-tax-count", stats.tax);
            setValue("card-contract-count", stats.contracts);
            setValue("card-reimburse-count", stats.reimbursement);

            const count = document.getElementById("doc-count");
            if (count)
                count.textContent = `(${stats.total || 0} total)`;
        });
}


// ------------------------------------------------
// GOVERNANCE + STORAGE
// ------------------------------------------------
function loadGovernanceCards() {

    fetch(`${DOC_API}/stats`)
        .then(r => r.json())
        .then(stats => {

            setValue("access-hr", "Full Access");
            setValue("access-managers", "Limited");
            setValue("access-employees", "Self Docs");

            setValue("audit-retention", "7 Years");
            setValue("audit-logs", "Enabled");
            setValue("audit-legal", "Active");

            const totalDocs = Number(stats.total || 0);
            const usedGB = totalDocs * 0.002;
            const totalGB = 10;

            setValue("storage-used", usedGB.toFixed(1) + " GB");
            setValue("storage-available",
                (totalGB - usedGB).toFixed(1) + " GB");
            setValue("storage-encryption", "Enabled");

            const fill = document.getElementById("storage-fill");
            if (fill)
                fill.style.width =
                    Math.min((usedGB / totalGB) * 100, 100) + "%";
        });
}


// ------------------------------------------------
// HELPERS
// ------------------------------------------------
function updateLatestUpload() {
    fetch(DOC_API)
        .then(r => r.json())
        .then(docs => {
            if (!docs.length) return;
            setValue("latest-payslip",
                formatDate(docs[0].uploadDate));
        });
}

function updateCardTimestamps() {
    ["payslip", "tax", "contract", "reimburse"]
        .forEach(id =>
            setValue(`${id}-updated`, "Updated just now"));
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? 0;
}

function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
}


/* ===============================
   LIVE DOCUMENT SEARCH
=============================== */

const searchInput = document.getElementById("docSearch");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const value = searchInput.value.toLowerCase();

        document.querySelectorAll("#documentTableBody tr")
            .forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display =
                    text.includes(value) ? "" : "none";
            });
    });
}


function getDocIcon(type){
    switch(type){
        case "Payslip": return "📄";
        case "Tax": return "🧾";
        case "Contract": return "📁";
        case "Reimbursement": return "💳";
        default: return "📄";
    }
}

// =====================================================
// ENTERPRISE PDF GENERATOR (JS ONLY — NO BACKEND)
// =====================================================

async function downloadDocument(id) {

    try {

        // get document data from API (metadata only)
        const response = await fetch(`${DOC_API}`);
        const docs = await response.json();

        const doc = docs.find(d => d.id === id);
        if (!doc) {
            alert("Document not found");
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // ======== ENTERPRISE HEADER ========
        pdf.setFillColor(15, 35, 80);
        pdf.rect(0, 0, 210, 30, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.text("PayrollPro Enterprise", 14, 18);

        pdf.setFontSize(10);
        pdf.text("Official HR Document", 150, 18);

        // ======== TITLE ========
        pdf.setTextColor(20, 20, 20);
        pdf.setFontSize(16);
        pdf.text(doc.documentName, 14, 45);

        // divider
        pdf.setDrawColor(200);
        pdf.line(14, 50, 196, 50);

        // ======== DETAILS SECTION ========
        pdf.setFontSize(12);

        pdf.text("Employee:", 14, 65);
        pdf.text(doc.employeeName || "-", 60, 65);

        pdf.text("Document Type:", 14, 75);
        pdf.text(doc.documentType, 60, 75);

        pdf.text("Document ID:", 14, 85);
        pdf.text(String(doc.id), 60, 85);

        pdf.text("Generated Date:", 14, 95);
        pdf.text(new Date().toLocaleDateString(), 60, 95);

        // ======== ENTERPRISE CONTENT BOX ========
        pdf.setDrawColor(220);
        pdf.rect(14, 110, 182, 60);

        pdf.setFontSize(11);
        pdf.text(
            "This is an automatically generated enterprise HR document.",
            20,
            125
        );

        pdf.text(
            "Generated securely by PayrollPro Document Management System.",
            20,
            140
        );

        pdf.text(
            "For official use only.",
            20,
            155
        );

        // ======== FOOTER ========
        pdf.setFillColor(240, 240, 240);
        pdf.rect(0, 280, 210, 17, "F");

        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(
            "Confidential • PayrollPro HRMS • Enterprise Generated Document",
            14,
            290
        );

        // ======== DOWNLOAD ========
        pdf.save(`${doc.documentName}.pdf`);

    } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Download failed");
    }
}

// ===============================
// AUTO DEMO DOCUMENT UPLOADER
// (Enterprise Seeder via JS)
// ===============================
async function seedDemoDocuments() {

    console.log("📁 Seeding demo documents...");

    const demoDocs = [
        { name: "Salary Slip Jan 2026", type: "Payslip", emp: 1 },
        { name: "Employment Contract", type: "Contract", emp: 1 },
        { name: "Form 16 FY2025", type: "Tax", emp: 1 },
        { name: "Travel Reimbursement", type: "Reimbursement", emp: 1 }
    ];

    for (const doc of demoDocs) {

        // create fake file in browser memory
        const blob = new Blob(
            [`PayrollPro Enterprise Document\n${doc.name}`],
            { type: "text/plain" }
        );

        const file = new File([blob], `${doc.type}.txt`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentName", doc.name);
        formData.append("documentType", doc.type);
        formData.append("employeeId", doc.emp);

        try {
            await fetch(`${DOC_API}/upload`, {
                method: "POST",
                body: formData
            });

            console.log("✅ Uploaded:", doc.name);
        } catch (e) {
            console.error("Upload failed:", e);
        }
    }

    console.log("🚀 Demo documents ready");
    refreshAll();
}

async function generatePDF(id, name, type, employee) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ===== COMPANY HEADER =====
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255,255,255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PayrollPro Technologies Pvt. Ltd.", 14, 18);

    doc.setFontSize(10);
    doc.text("Enterprise HR & Payroll Management System", 14, 24);

    // ===== DOCUMENT TITLE =====
    doc.setTextColor(0,0,0);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(name, 14, 45);

    // divider
    doc.setDrawColor(200);
    doc.line(14, 50, 196, 50);

    // ===== META INFO =====
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const today = new Date().toLocaleDateString();

    doc.text(`Employee Name : ${employee}`, 14, 65);
    doc.text(`Document Type : ${type}`, 14, 75);
    doc.text(`Document ID   : ${id}`, 14, 85);
    doc.text(`Generated On  : ${today}`, 14, 95);

    // ===== CONTENT BOX =====
    doc.setFillColor(245,247,250);
    doc.rect(14, 105, 182, 80, "F");

    doc.setFontSize(11);
    doc.text(
        `This document is an official ${type.toLowerCase()} issued by PayrollPro.`,
        20,
        120
    );

    doc.text(
        "This file has been digitally generated through the",
        20,
        135
    );

    doc.text(
        "Enterprise HR Management System and is valid",
        20,
        145
    );

    doc.text(
        "without physical signature.",
        20,
        155
    );

    // ===== SIGNATURE AREA =====
    doc.line(140, 210, 190, 210);
    doc.setFontSize(10);
    doc.text("Authorized Signatory", 142, 218);

    // ===== FOOTER =====
    doc.setFillColor(15,23,42);
    doc.rect(0, 270, 210, 27, "F");

    doc.setTextColor(255,255,255);
    doc.setFontSize(9);
    doc.text(
        "Confidential • PayrollPro Enterprise System • Auto Generated Document",
        14,
        285
    );

    // ===== DOWNLOAD =====
    doc.save(`${name}.pdf`);
}

// ======================================================
// ENTERPRISE DOCUMENT VIEW (REAL GENERATED DOCUMENT)
// ======================================================

function previewDocument(id) {

    const doc = ALL_DOCUMENTS.find(d => d.id === id);
    if (!doc) return;
    CURRENT_DOC = doc;

    const modal = document.getElementById("previewModal");
    const frame = document.getElementById("previewFrame");
    const title = document.getElementById("previewTitle");

    title.innerText = doc.documentName;

    // -------------------------------
    // Dynamic document body
    // -------------------------------
    let documentBody = "";

    if (doc.documentType === "Payslip") {

        documentBody = `
            <h2>Employee Payslip</h2>

            <table class="doc-table-view">
                <tr><td>Employee</td><td>${doc.employeeName}</td></tr>
                <tr><td>Month</td><td>January 2026</td></tr>
                <tr><td>Basic Salary</td><td>₹50,000</td></tr>
                <tr><td>HRA</td><td>₹10,000</td></tr>
                <tr><td>Bonus</td><td>₹5,000</td></tr>
                <tr><td><b>Net Salary</b></td><td><b>₹65,000</b></td></tr>
            </table>
        `;

    } else if (doc.documentType === "Contract") {

        documentBody = `
            <h2>Employment Contract</h2>
            <p>
            This agreement confirms employment between
            <b>PayrollPro Pvt Ltd</b> and
            <b>${doc.employeeName}</b>.
            </p>

            <ul>
                <li>Role: Software Engineer</li>
                <li>Department: Technology</li>
                <li>Status: Full Time Employee</li>
                <li>Effective Date: ${formatDate(doc.uploadDate)}</li>
            </ul>
        `;

    } else if (doc.documentType === "Tax") {

        documentBody = `
            <h2>Tax Declaration (Form 16)</h2>

            <table class="doc-table-view">
                <tr><td>Employee</td><td>${doc.employeeName}</td></tr>
                <tr><td>Financial Year</td><td>2025-26</td></tr>
                <tr><td>Total Income</td><td>₹7,80,000</td></tr>
                <tr><td>Tax Paid</td><td>₹52,000</td></tr>
            </table>
        `;

    } else {

        documentBody = `
            <h2>Reimbursement Claim</h2>
            <p>Employee: <b>${doc.employeeName}</b></p>
            <p>Claim Amount: ₹4,200</p>
            <p>Status: Approved</p>
        `;
    }

    // -------------------------------
    // Enterprise Document Layout
    // -------------------------------
    const html = `
<html>
<head>
<style>

body{
    background:#dfe5ef;
    padding:40px;
    font-family:Segoe UI,Arial;
}

/* A4 PAPER */
.page{
    width:794px;
    min-height:1123px;
    margin:auto;
    background:white;
    padding:60px;
    box-shadow:0 15px 45px rgba(0,0,0,.25);
    border-radius:6px;
}

/* HEADER */
.header{
    font-size:24px;
    font-weight:700;
    color:#0b2a63;
    border-bottom:3px solid #0b2a63;
    padding-bottom:12px;
    margin-bottom:30px;
}

/* META */
.meta{
    color:#666;
    font-size:13px;
    margin-bottom:25px;
}

/* TABLE */
.doc-table-view{
    width:100%;
    border-collapse:collapse;
}

.doc-table-view td{
    padding:12px;
    border-bottom:1px solid #eee;
}

h2{
    color:#0b2a63;
}

/* FOOTER */
.footer{
    margin-top:80px;
    font-size:12px;
    color:#777;
    border-top:1px solid #ddd;
    padding-top:10px;
}

</style>
</head>

<body>

<div class="page">

<div class="header">
PayrollPro Enterprise HR Document
</div>

<div class="meta">
Document ID: ${doc.id} |
Generated: ${new Date().toLocaleString()}
</div>

${documentBody}

<div class="footer">
Confidential • PayrollPro Technologies Pvt Ltd • Auto Generated
</div>

</div>

</body>
</html>
`;

    frame.srcdoc = html;
    modal.style.display = "flex";
}

function downloadFromPreview(){

    if(!CURRENT_DOC){
        alert("No document selected");
        return;
    }

    // reuse your existing PDF generator
    downloadDocument(CURRENT_DOC.id);
}

let zoom = 1;
let CURRENT_DOC = null;

function zoomIn(){
    zoom += 0.1;
    applyZoom();
}

function zoomOut(){
    zoom = Math.max(0.6, zoom - 0.1);
    applyZoom();
}

function applyZoom(){
    const frame = document.getElementById("previewFrame");
    frame.style.transform = `scale(${zoom})`;
    frame.style.transformOrigin = "top center";
    document.getElementById("zoomLevel").innerText =
        Math.round(zoom*100)+"%";
}
function closePreview(){
    document.getElementById("previewModal").style.display = "none";
}


// ------------------------------------------------
// INITIALIZATION
// ------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {

    console.log("🚀 PAYROLLPRO DOCUMENTS LOADED");

    const dropdown = document.getElementById("docFilter");
    if (dropdown)
        dropdown.addEventListener("change", refreshAll);

    document.querySelectorAll(".clickable-card")
        .forEach(card => {
            card.onclick = () => {
                if (!dropdown) return;
                dropdown.value = card.dataset.filter;
                refreshAll();
            };
        });

    document.querySelectorAll(".doc-card")
        .forEach(card => {
            card.onclick = () => {
                const mapping = {
                    "📄 Payslips": "Payslips",
                    "📊 Tax Documents": "Tax Documents",
                    "📁 Contracts": "Contracts",
                    "🧾 Reimbursements": "Reimbursements"
                };

                const title =
                    card.querySelector("h3")?.textContent.trim();

                if (dropdown && mapping[title]) {
                    dropdown.value = mapping[title];
                    refreshAll();
                }
            };
        });

    window.addEventListener("click", e => {
        if (e.target.id === "uploadModal")
            closeUploadModal();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape")
            closeUploadModal();
    });
    seedDemoDocuments();
    refreshAll();
});
