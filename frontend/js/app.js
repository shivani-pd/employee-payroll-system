document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:8080/api/employees";

    /* ================= ELEMENTS ================= */

    const tableBody = document.getElementById("employeeTableBody");
    const totalCount = document.getElementById("totalCount");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");

    const nameInput = document.getElementById("employeeName");
    const emailInput = document.getElementById("employeeEmail");
    const salaryInput = document.getElementById("employeeSalary");
    const deptInput = document.getElementById("employeeDepartment");
    const positionInput = document.getElementById("employeePosition");

    const addBtn = document.getElementById("addEmployeeBtn");
    const cancelBtn = document.getElementById("cancelEditBtn");
    const addBtnTop = document.getElementById("addEmployeeBtnTop");
    const exportBtn = document.getElementById("exportCsvBtn");

    const modal = document.getElementById("detailsModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    let editingId = null;
    let allEmployees = [];

    /* ================= UTILITIES ================= */

    const formatRupees = amt =>
        new Intl.NumberFormat("en-IN").format(Number(amt || 0));

    const getStatusClass = s =>
        s === "ACTIVE" ? "status-active" : "status-inactive";

    async function apiCall(endpoint, options = {}) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: options.method || "GET",
                headers: { "Content-Type": "application/json" },
                ...(options.body && { body: JSON.stringify(options.body) })
            });
            return res.ok ? await res.json() : null;
        } catch {
            return null;
        }
    }

    function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

function showSalaryPreview(value) {
    const gross = Number(value || 0);
    if (!gross) return;

    const basic = Math.round(gross * 0.4);
    const hra = Math.round(gross * 0.2);
    const pf = Math.round(basic * 0.12);
    const tax = Math.round(gross * 0.08);
    const net = gross - pf - tax;

    let preview = document.getElementById("salaryPreview");
    if (!preview) {
        preview = document.createElement("div");
        preview.id = "salaryPreview";
        preview.style.marginTop = "10px";
        preview.style.fontSize = "13px";
        preview.style.color = "#64748b";
        salaryInput.parentNode.appendChild(preview);
    }

    preview.innerHTML = `
        Estimated Net Pay: <b>₹${formatRupees(net)}</b><br>
        PF: ₹${formatRupees(pf)} | Tax: ₹${formatRupees(tax)}
    `;
}


    /* ================= LOAD ================= */

    async function loadEmployees(search = "", status = "ALL") {
        let list = await apiCall("");
        if (!Array.isArray(list)) list = [];

        if (search) {
        const q = search.toLowerCase();
        list = list.filter(e =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        String(e.id).includes(q)
    );
}


        if (status !== "ALL")
            list = list.filter(e => e.status === status);

        allEmployees = list;
        totalCount.textContent = list.length;
        renderTable(list);
    }

    /* ================= TABLE ================= */

    function renderTable(list) {
        tableBody.innerHTML = list.length ? list.map(emp => `
            <tr>
                <td>EMP${String(emp.id).padStart(4,"0")}</td>
                <td>${emp.name}</td>
                <td><span class="dept-badge dept-${emp.department}">${emp.department}</span></td>
                <td>${emp.position}</td>
                <td>₹${formatRupees(emp.netSalary || emp.salary)}</td>
                <td><span class="status-badge ${getStatusClass(emp.status)}"title="${emp.status === 'ACTIVE' ? 'Employee is currently active'
        : 'Employee is inactive and locked'}">
    ${emp.status}
</span>
</td>
                <td>
                    <button class="btn btn-sm view-btn"
        data-id="${emp.id}"
        title="View Employee Profile">
    👁️
</button>

<button class="btn btn-sm edit-btn"
        data-id="${emp.id}"
        title="Edit Employee Details">
    ✏️
</button>

<button class="btn btn-sm payslip-btn"
        data-id="${emp.id}"
        title="Download Payslip">
    📄
</button>

<button class="btn btn-sm delete-btn"
        data-id="${emp.id}"
        title="Mark Employee Inactive">
    🗑️
</button>

                </td>
            </tr>
        `).join("") :
        `<tr><td colspan="7" class="no-data">No employees found</td></tr>`;

        attachRowEvents();
    }

    function attachRowEvents() {
        document.querySelectorAll(".view-btn").forEach(b =>
            b.onclick = () => showDetails(b.dataset.id)
        );
        document.querySelectorAll(".edit-btn").forEach(b =>
            b.onclick = () => editEmployee(b.dataset.id)
        );
        document.querySelectorAll(".delete-btn").forEach(b =>
            b.onclick = () => deleteEmployee(b.dataset.id)
        );
        document.querySelectorAll(".payslip-btn").forEach(b =>
            b.onclick = () => openPayslipSelector(b.dataset.id)
        );
        // 🔒 MNC RULE: lock inactive employees
       document.querySelectorAll("tr").forEach(row => {
       const statusBadge = row.querySelector(".status-badge");
       if (statusBadge && statusBadge.textContent === "INACTIVE") {
        row.style.opacity = "0.6";
        row.querySelectorAll(".edit-btn,.payslip-btn").forEach(btn => {
            btn.disabled = true;
            btn.title = "Inactive employee";
        });
    }
});


    }

    /* ================= VIEW ================= */

    async function showDetails(id) {
        const emp = await apiCall(`/${id}`);
        if (!emp) return;
        

        

        modalTitle.textContent = "Employee Profile";
        modalBody.innerHTML = `
<div class="profile-header">
    <div class="avatar">👤</div>
    <div>
        <h3>${emp.name}</h3>
        <p>${emp.position}</p>
        <span class="status-pill ${getStatusClass(emp.status)}">
            ${emp.status}
        </span>
    </div>
</div>

<div class="profile-section">
    <h4>📌 Employee Information</h4>
    <div class="detail-row">
        <span>Employee ID</span>
        <span>EMP${String(emp.id).padStart(4,"0")}</span>
    </div>
    <div class="detail-row">
        <span>Email</span>
        <span>${emp.email || "—"}</span>
    </div>
</div>

<div class="profile-section">
    <h4>💼 Work Details</h4>
    <div class="detail-row">
        <span>Department</span>
        <span>${emp.department}</span>
    </div>
    <div class="detail-row">
        <span>Designation</span>
        <span>${emp.position}</span>
    </div>
</div>

<div class="profile-section">
    <h4>💰 Payroll Snapshot</h4>
    <div class="detail-row">
        <span>Gross Salary</span>
        <span>₹${formatRupees(emp.salary)}</span>
    </div>
    <div class="detail-row">
        <span>Net Salary</span>
        <span>₹${formatRupees(emp.netSalary || "—")}</span>
    </div>
</div>

<div class="profile-section muted">
    <div class="detail-row">
        <span>Last Viewed</span>
        <span>${new Date().toLocaleString("en-IN")}</span>
    </div>
</div>
<div style="font-size:12px;color:#64748b;margin-top:12px">
    ℹ️ This profile is read-only. Use Edit to modify details.
</div>

`;

        const lastUpdate = localStorage.getItem(`emp_${emp.id}_lastUpdated`);
        if (lastUpdate) {
        modalBody.innerHTML += `
        <div class="detail-row">
        <span>Last Updated</span>
        <span>${new Date(lastUpdate).toLocaleString("en-IN")}</span>
        </div>
    `;
}

        modal.style.display = "flex";
    }

    window.closeModal = () => modal.style.display = "none";

    /* ================= EDIT ================= */

    async function editEmployee(id) {
    const emp = await apiCall(`/${id}`);
    if (!emp) return;

    // 🔥 FORCE NUMBER (THIS FIXES UPDATE)
    editingId = Number(emp.id);

    nameInput.value = emp.name;
    emailInput.value = emp.email || "";
    salaryInput.value = emp.salary;
    deptInput.value = emp.department;
    positionInput.value = emp.position;

    addBtn.textContent = "Update Employee";
    cancelBtn.style.display = "inline-block";

    document.querySelector(".card")
        .scrollIntoView({ behavior: "smooth" });
}

    /* ================= DELETE ================= */

    async function deleteEmployee(id) {
        if (!confirm("Mark employee as INACTIVE?")) return;
        await apiCall(`/${id}`, { method: "DELETE" });
        loadEmployees(searchInput.value, statusFilter.value);
    }

    /* ================= PAYSLIP ================= */

    async function openPayslipSelector(id) {
        const emp = await apiCall(`/${id}`);
        if (!emp) return;

        modalTitle.textContent = "Generate Payslip";
        modalBody.innerHTML = `
            <div class="salary-breakdown">
                <strong>${emp.name}</strong><br/>
                ${emp.position} · ${emp.department}<br/>
                EMP${String(emp.id).padStart(4,"0")}
            </div>

            <div class="form-grid">
                <select id="psMonth">
                    ${Array.from({ length: 12 }, (_, i) =>
                        `<option value="${i}">${new Date(0, i).toLocaleString("en-IN",{month:"long"})}</option>`
                    ).join("")}
                </select>

                <select id="psYear">
                    ${[2024,2025,2026,2027].map(y =>
                        `<option value="${y}" ${y===2026?"selected":""}>${y}</option>`
                    ).join("")}
                </select>
            </div>

            <button class="btn secondary" id="downloadPayslipBtn"> ✅ View Payslip </button>

        `;

        modal.style.display = "flex";

        document.getElementById("downloadPayslipBtn").onclick = () => {
        generatePayslip(emp,
        document.getElementById("psMonth").value,
        document.getElementById("psYear").value
    );
};


        document.getElementById("genPayslipBtn").onclick = () => {
            generatePayslip(emp,
                document.getElementById("psMonth").value,
                document.getElementById("psYear").value
            );
            closeModal();
        };
    }

    /* ================= ENTERPRISE PAYSLIP ================= */

    function generatePayslip(emp, month, year) {

        const monthName = new Date(year, month).toLocaleString("en-IN",{month:"long"});
        const gross = Number(emp.salary);

        const basic = Math.round(gross * 0.40);
        const hra = Math.round(gross * 0.20);
        const special = Math.round(gross * 0.20);

        const pf = Math.round(basic * 0.12);
        const professionalTax = 200;
        const incomeTax = Math.round(gross * 0.08);

        const totalEarnings = basic + hra + special;
        const totalDeductions = pf + professionalTax + incomeTax;
        const netPay = totalEarnings - totalDeductions;

        const win = window.open("", "_blank", "width=900,height=1100");
        win.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Payslip - ${monthName} ${year}</title>
<style>
body{
    font-family: "Segoe UI", "Inter", system-ui, -apple-system, sans-serif;
    background:#f4f6f8;
    padding:40px;
}

.payslip{max-width:900px;margin:auto;background:#fff;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.15)}
.header{background:#0f172a;color:#fff;padding:30px}
.section{padding:25px 30px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{padding:12px;border-bottom:1px solid #e5e7eb;font-size:14px}
th{background:#f1f5f9;text-align:left}
.right{text-align:right}
.net{background:#0f766e;color:#fff;text-align:center;padding:25px;font-size:22px;font-weight:700}
.footer{text-align:center;font-size:12px;color:#555;padding:15px}
.watermark{
    position: fixed;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 80px;
    font-weight: 700;
    color: rgba(0,0,0,0.05);
    pointer-events: none;
    user-select: none;
    z-index: 0;
}

</style>
</head>
<body onload="window.print();window.onafterprint=()=>window.close();">
<div class="watermark">PAYROLLPRO</div>

<div class="payslip">
<div class="header" style="display:flex;align-items:center;gap:20px">
    

    <div>
        <h2 style="margin:0">PAYROLLPRO SOLUTIONS PVT. LTD.</h2>
        <p style="margin:4px 0">
            Salary Slip – ${monthName} ${year}
        </p>
        <p style="font-size:12px;opacity:.85;line-height:1.5">
        Registered Office: Bengaluru, Karnataka – 560103<br>
        CIN: U74999KA2023PTC000001
        </p>

        <p style="font-size:12px;opacity:.8">
            Confidential – Internal Use Only
        </p>
    </div>
</div>

    <div class="section grid">
        <div><b>Employee:</b> ${emp.name}</div>
        <div><b>Employee ID:</b> EMP${String(emp.id).padStart(4,"0")}</div>
        <div><b>Department:</b> ${emp.department}</div>
        <div><b>Designation:</b> ${emp.position}</div>
        <div><b>Pay Period:</b> ${monthName} ${year}</div>
        <div><b>Pay Date:</b> ${new Date().toLocaleDateString("en-IN")}</div>
        <div><b>Payment Mode:</b> Bank Transfer</div>
        <div><b>Currency:</b> INR (₹)</div>

    </div>

    <div class="section">
        <table>
            <tr>
                <th>Earnings</th><th class="right">₹</th>
                <th>Deductions</th><th class="right">₹</th>
            </tr>
            <tr>
                <td>Basic Salary</td><td class="right">${formatRupees(basic)}</td>
                <td>Provident Fund</td><td class="right">${formatRupees(pf)}</td>
            </tr>
            <tr>
                <td>House Rent Allowance</td><td class="right">${formatRupees(hra)}</td>
                <td>Professional Tax</td><td class="right">${formatRupees(professionalTax)}</td>
            </tr>
            <tr>
                <td>Special Allowance</td><td class="right">${formatRupees(special)}</td>
                <td>Income Tax</td><td class="right">${formatRupees(incomeTax)}</td>
            </tr>
            <tr style="font-weight:700">
                <td>Total Earnings</td><td class="right">${formatRupees(totalEarnings)}</td>
                <td>Total Deductions</td><td class="right">${formatRupees(totalDeductions)}</td>
            </tr>
        </table>
    </div>

    <div class="net">Net Salary Payable: ₹${formatRupees(netPay)}</div>
    <div style="padding:30px;display:flex;justify-content:flex-end">
    <div style="text-align:center">
        <div style="font-weight:600;margin-top:6px">
            Shivani Pandey
        </div>
        <div style="font-size:12px;color:#555">
            HR Manager
        </div>
    </div>
</div>


    <div class="footer">
    Generated on ${new Date().toLocaleString("en-IN")}
   • Payslip ID: EMP${emp.id}-${month}-${year}
   <p style="font-size:11px;color:#555;margin-top:10px;line-height:1.4">
   This is a system-generated payslip and does not require a physical signature.
   In case of any discrepancy, please contact HR within 7 working days.
   </p>

    </div>

</div>
</body>
</html>
        `);
        win.document.close();
    }

    /* ================= SAVE ================= */

    addBtn.onclick = async () => {

        const salaryVal = Number(salaryInput.value.replace(/,/g, ""));
        if (salaryVal < 5000) {
        showToast("Salary seems too low. Please verify.", "warning");
        return;
}


    let payload;

    if (editingId) {
        const existing = allEmployees.find(
            e => Number(e.id) === Number(editingId)
        );
        if (!existing) return alert("Employee not found");

        payload = {
            ...existing,

            // updated fields
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                salary: Number(salaryInput.value.replace(/,/g, "")),
                netSalary: null,

                department: deptInput.value,
                position: positionInput.value,
                status: existing.status

        };
    } else {
        payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            salary: Number(salaryInput.value.replace(/,/g, "")),
            department: deptInput.value,
            position: positionInput.value,
            status: "ACTIVE"
        };
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/${editingId}` : "";

    await apiCall(url, { method, body: payload });

    showToast(
    editingId ? "Employee updated successfully" : "Employee added successfully",
    editingId ? "update" : "success"
    
);
if (editingId) {
    localStorage.setItem(
        `emp_${editingId}_lastUpdated`,
        new Date().toISOString()
    );
}




    resetForm();
    loadEmployees();
};
   function resetForm() {
        editingId = null;
        nameInput.value = "";
        emailInput.value = "";
        salaryInput.value = "";
        deptInput.value = "";
        positionInput.value = "";
        addBtn.textContent = "Add Employee";
        cancelBtn.style.display = "none";
    }

    cancelBtn.onclick = resetForm;
    addBtnTop.onclick = () =>
        document.querySelector(".card").scrollIntoView();

    /* ================= CSV ================= */

    exportBtn.onclick = () => {
        if (!allEmployees.length) return alert("No data to export");

        const csv = [
            "ID,Name,Email,Department,Position,Salary,Status",
            ...allEmployees.map(e =>
                `${e.id},"${e.name}","${e.email||""}",${e.department},${e.position},${e.salary},${e.status}`
            )
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "employees.csv";
        a.click();
    };

    searchInput.oninput = () =>
        loadEmployees(searchInput.value, statusFilter.value);

    statusFilter.onchange = () =>
        loadEmployees(searchInput.value, statusFilter.value);

    window.onclick = e => { if (e.target === modal) closeModal(); };

    loadEmployees();
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.style.display === "flex") {
        closeModal();
    }
    if (e.key === "Enter" && document.activeElement === salaryInput) {
        addBtn.click();
    }
});

