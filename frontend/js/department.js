document.addEventListener("DOMContentLoaded", () => {

    const DEPT_API = "http://localhost:8080/api/departments";
    const EMP_API  = "http://localhost:8080/api/employees";

    let ALL_DEPARTMENTS = [];
    let ALL_EMPLOYEES = [];


    

    /* =========================
       ELEMENTS
    ========================= */
    const locationFilter = document.getElementById("locationFilter");

    const grid = document.getElementById("departmentGrid");

    const deptCount    = document.getElementById("deptCount");
    const empCount     = document.getElementById("empCount");
    const payrollTotal = document.getElementById("payrollTotal");
    const alertCount   = document.getElementById("alertCount");
    


    const addBtn       = document.getElementById("addDeptBtn");
    const modal        = document.getElementById("deptModal");
    const modalTitle   = document.getElementById("modalTitle");
    const saveBtn      = document.getElementById("saveDeptBtn");

    const deptId       = document.getElementById("deptId");
    const deptName     = document.getElementById("deptName");
    const deptManager  = document.getElementById("deptManager");
    const deptBudget   = document.getElementById("deptBudget");
    const exportBtn = document.getElementById("exportDeptBtn");

const teamModal = document.getElementById("teamModal");
const teamTitle = document.getElementById("teamTitle");
const teamList  = document.getElementById("teamList");
const closeTeamBtn = document.getElementById("closeTeamBtn");

if (closeTeamBtn) {
  closeTeamBtn.onclick = () => teamModal.classList.add("hidden");
}

const costCenterCard = document.getElementById("costCenterCard");
const workforceCard = document.getElementById("workforceCard");
const complianceCard = document.getElementById("complianceCard");

const costCenterList = document.getElementById("costCenterList");
const workforceList = document.getElementById("workforceList");
const complianceList = document.getElementById("complianceList");



if (costCenterCard) {
  costCenterCard.onclick = () => {
    alert("📊 Cost Center\n\nDepartment-wise budget vs payroll details");
  };
}

if (workforceCard) {
  workforceCard.onclick = () => {
    alert("👥 Workforce Distribution\n\nDepartment-wise employee count");
  };
}

if (complianceCard) {
  complianceCard.onclick = () => {
    alert("⚖ Compliance Status\n\nActive vs Inactive departments");
  };
}


if (exportBtn) {
    exportBtn.onclick = async () => {
        try {
            const res = await fetch(DEPT_API);
            const departments = await res.json();

            let csv = "Department,Manager,Annual Budget,Status\n";

            departments.forEach(d => {
                csv += `"${d.name}","${d.manager || ""}",${d.annualBudget},${d.active ? "Active" : "Inactive"}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "departments.csv";
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            alert("Export failed");
            console.error(err);
        }
    };
}

    /* =========================
       LOAD EVERYTHING
    ========================= */
    async function loadDepartments() {
        try {
            const [deptRes, empRes] = await Promise.all([
                fetch(DEPT_API),
                fetch(EMP_API)
            ]);

            const departments = await deptRes.json();
            const employees   = await empRes.json();

            ALL_DEPARTMENTS = departments;
ALL_EMPLOYEES = employees;


            renderDashboard(departments, employees);
        } catch (e) {
            console.error("Department dashboard error", e);
        }
    }

    /* =========================
       ADD BUTTON
    ========================= */
    if (addBtn) {
        addBtn.onclick = () => {
            deptId.value = "";
            deptName.value = "";
            deptManager.value = "";
            deptBudget.value = "";
            modalTitle.textContent = "Add Department";
            modal.classList.remove("hidden");
        };
    }

    const cancelBtn = document.getElementById("cancelDeptBtn");

if (cancelBtn) {
  cancelBtn.onclick = () => modal.classList.add("hidden");
}

    /* =========================
       DASHBOARD + CARDS
    ========================= */

function renderDashboard(departments, employees) {

        grid.innerHTML = "";

        const deptMap = {};

        // Departments from DB
        departments.forEach(d => {
            deptMap[d.name.trim()] = {
                ...d,
                employees: [],
                payroll: 0
            };
        });

        // Employees mapping
        employees.forEach(e => {
            const deptName = (e.department || "Unknown").trim();

            if (!deptMap[deptName]) {
                deptMap[deptName] = {
                    name: deptName,
                    manager: deptName + " Manager",
                    annualBudget: 0,
                    active: true,
                    employees: [],
                    payroll: 0
                };

        

            }

            deptMap[deptName].employees.push(e);
            deptMap[deptName].payroll += (e.netSalary || e.salary || 0);
        });

        const deptList = Object.values(deptMap).filter(d => d.active);
        // ================== INSIGHTS REAL DATA ==================

// 📊 COST CENTER
if (costCenterList) {
    costCenterList.innerHTML = "";

    const sorted = [...deptList].sort((a, b) => b.payroll - a.payroll);

    if (sorted.length > 0) {
        costCenterList.innerHTML += `<li>🏦 Highest Cost: ${sorted[0].name}</li>`;
        costCenterList.innerHTML += `<li>📉 Lowest Cost: ${sorted[sorted.length - 1].name}</li>`;

        const risky = sorted.filter(
            d => d.annualBudget > 0 && d.payroll > d.annualBudget
        );

        costCenterList.innerHTML +=
            `<li>⚠ Budget Risk: ${risky.length ? risky.map(d => d.name).join(", ") : "None"}</li>`;
    }
}

// 👥 WORKFORCE
if (workforceList) {
    workforceList.innerHTML = "";

    deptList.forEach(d => {
        const percent = employees.length
            ? Math.round((d.employees.length / employees.length) * 100)
            : 0;

        workforceList.innerHTML += `<li>${d.name}: ${percent}%</li>`;
    });
}

// ⚖ COMPLIANCE
if (complianceList) {
    complianceList.innerHTML = "";

    const active = deptList.filter(d => d.active).length;
    const inactive = departments.length - active;

    complianceList.innerHTML += `<li>📄 Active Departments: ${active}</li>`;
    complianceList.innerHTML += `<li>❌ Inactive Departments: ${inactive}</li>`;
    complianceList.innerHTML += `<li>🔐 Audit Ready: Yes</li>`;
}


        // KPI CARDS
        deptCount.textContent = deptList.length;
        empCount.textContent  = employees.length;

        const totalDeptBudget = departments.reduce(
            (sum, d) => sum + (d.annualBudget || 0), 0
        );
        payrollTotal.textContent =
            "₹" + (totalDeptBudget / 1e7).toFixed(2) + " Cr";

        alertCount.textContent =
            deptList.filter(d => d.annualBudget > 0 && d.payroll > d.annualBudget).length;

        deptList.forEach(d => renderCard(d));
    }

    /* =========================
       RENDER CARD
    ========================= */
    function renderCard(dept) {

        let utilization = dept.annualBudget > 0
            ? Math.round((dept.payroll / dept.annualBudget) * 100)
            : 0;

        if (utilization > 150) utilization = 150;

        const barWidth = Math.min(utilization, 100);

        let level = "low";
        if (utilization > 100) level = "critical";
        else if (utilization > 80) level = "high";
        else if (utilization > 50) level = "medium";

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h3>${dept.name}</h3>
            <p>👥 Employees: ${dept.employees.length}</p>
            <p>💼 Manager: ${dept.manager || "-"}</p>
            <p>💰 Budget: ₹${dept.annualBudget.toLocaleString()}</p>

            <div class="progress">
                <div class="progress-bar ${level}" style="width:${barWidth}%"></div>
            </div>
            <small>Budget Utilization: ${utilization}%</small>

            <ul class="dept-actions">
  <li class="view">👥 View Team</li>
  <li class="edit">✏ Edit</li>
  <li class="delete">🗑 Deactivate</li>
</ul>

        `;

const viewBtn = card.querySelector(".view");

if (viewBtn) {
  viewBtn.onclick = () => {
    teamTitle.textContent = dept.name + " Team";
    teamList.innerHTML = "";

    if (!dept.employees || dept.employees.length === 0) {
      teamList.innerHTML = "<li>No employees found</li>";
    } else {
      dept.employees.forEach(e => {
        const li = document.createElement("li");
        li.textContent = `${e.name} (${e.position || "Employee"})`;
        teamList.appendChild(li);
      });
    }

    teamModal.classList.remove("hidden");
  };
}

        // EDIT
        card.querySelector(".edit").onclick = () => {
            deptId.value = dept.id;
            deptName.value = dept.name;
            deptManager.value = dept.manager || "";
            deptBudget.value = dept.annualBudget;
            modalTitle.textContent = "Edit Department";
            modal.classList.remove("hidden");
        };

        // DEACTIVATE (soft delete)
        card.querySelector(".delete").onclick = async () => {
            if (!confirm("Deactivate this department?")) return;
            await fetch(`${DEPT_API}/${dept.id}`, { method: "DELETE" });
            loadDepartments();
        };

        grid.appendChild(card);
    }

    

    /* =========================
       SAVE (ADD / EDIT)
    ========================= */
    if (saveBtn) {
        saveBtn.onclick = async () => {

            if (!deptName.value.trim()) {
                alert("Department name required");
                return;
            }

            const payload = {
                name: deptName.value,
                manager: deptManager.value,
                annualBudget: Number(deptBudget.value || 0),
                active: true
            };

            const isEdit = deptId.value;
            const url = isEdit ? `${DEPT_API}/${deptId.value}` : DEPT_API;
            const method = isEdit ? "PUT" : "POST";

            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            modal.classList.add("hidden");
            loadDepartments();
        };
    }

    /* ========================= */
    loadDepartments();

    /* =========================
   LOCATION FILTER (SAFE & COMPLETE)
========================= */
if (locationFilter) {
    locationFilter.onchange = () => {
        const selectedLocation = locationFilter.value;

        // ✅ All Locations → full data
        if (selectedLocation === "All Locations") {
            renderDashboard(ALL_DEPARTMENTS, ALL_EMPLOYEES);
            return;
        }

        // ✅ Filter employees by location
        const filteredEmployees = ALL_EMPLOYEES.filter(e =>
            (e.location || "Head Office") === selectedLocation
        );

        // ✅ Same departments, only employees change
        renderDashboard(ALL_DEPARTMENTS, filteredEmployees);
    };
}

    
});
