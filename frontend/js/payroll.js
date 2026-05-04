document.addEventListener("DOMContentLoaded", () => {
    console.log("=== PAYROLL JS LOADED ===");            


    async function loadPayrollPeriods() {
    const res = await fetch("http://localhost:8080/api/payroll/runs");
    const runs = await res.json();

    periodSelect.innerHTML = "";

    runs.forEach(run => {
        const option = document.createElement("option");
        option.value = run.id;
        option.text = `${getMonthName(run.month)} ${run.year}  •  ${run.status}`;

        periodSelect.appendChild(option);
    });

    // Auto load first run
    if (runs.length > 0) {
        periodSelect.value = runs[0].id;
        loadTable(Number(periodSelect.value));
    }
}

function getMonthName(monthNumber) {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return months[monthNumber - 1];
}

    // 🔹 ELEMENTS
    const periodSelect = document.getElementById("payrollPeriod");
    // ===== PERIOD CHANGE HANDLER =====
if (periodSelect) {
    periodSelect.onchange = () => {
        const selectedRunId = Number(periodSelect.value);
        console.log("Period changed to:", selectedRunId);

        // Reload table + breakdown
        loadTable(selectedRunId);
        

    };
}

    const runBtn = document.getElementById("runPayrollBtn");
    const generateBtn = document.getElementById("generatePayslipsBtn");
    const createBtn = document.getElementById("createPayrollBtn");
    const tableBody = document.getElementById("payrollTableBody");
    const actionButtons = document.querySelectorAll(".action-btn");

// Safety check
if (actionButtons.length < 9) {
    console.error("❌ Expected 9 action buttons, found:", actionButtons.length);
    return;
}

// ========== PAYROLL ACTIONS ==========
actionButtons[0].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/salary-register/${runId}`;
};

actionButtons[1].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/tax-sheet/${runId}`;
};

actionButtons[2].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/bank-transfer/${runId}`;
};

// ========== STATUTORY COMPLIANCE ==========
actionButtons[3].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/compliance/pf-esic/${runId}`;
};

actionButtons[4].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/compliance/tds/${runId}`;
};

actionButtons[5].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/compliance/audit/${runId}`;
};

// ========== PAYROLL ALERTS ==========
actionButtons[6].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/alerts/pending/${runId}`;
};

actionButtons[7].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/alerts/overtime/${runId}`;
};

actionButtons[8].onclick = () => {
    const runId = Number(periodSelect.value);
    window.location.href =
        `http://localhost:8080/api/payroll/alerts/budget/${runId}`;
};



    if (!tableBody) {
        console.error("❌ payrollTableBody missing!");
        return;
    }

    const API_BASE = "http://localhost:8080/api/payroll";


const downloadRegisterBtn = document.getElementById("downloadRegisterBtn");
const generateTaxBtn = document.getElementById("generateTaxBtn");
const bankTransferBtn = document.getElementById("bankTransferBtn");


    // ================= RUN PAYROLL =================
    if (runBtn) {
    runBtn.onclick = async () => {
        const runId = Number(periodSelect.value);

        try {
            const res = await fetch(`${API_BASE}/process/${runId}`, {
                method: "POST"
            });

            if (!res.ok) {
                alert("❌ Payroll already processed or failed");
                return;
            }

            alert("✅ Payroll processed successfully");
            loadTable(runId);
        } catch (err) {
            alert("❌ Server error while processing payroll");
        }
    };
}
if (createBtn) {
  createBtn.onclick = async () => {

    // Example text: "Jan 2021  •  DRAFT"
    const text =
      periodSelect.options[periodSelect.selectedIndex].text;

    const parts = text.split(" ");
    const monthName = parts[0];
    const year = Number(parts[1]);

    const monthMap = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
    };

    const month = monthMap[monthName];

    try {
      const res = await fetch(
        `http://localhost:8080/api/payroll/create?month=${month}&year=${year}&hrName=HR`,
        { method: "POST" }
      );

      if (!res.ok) {
        alert("❌ Payroll already exists for this month");
        return;
      }

      alert("✅ Payroll created successfully");
      loadPayrollPeriods();   // dropdown reload

    } catch (e) {
      alert("❌ Error creating payroll");
    }
  };
}
    // ================= GENERATE PAYSLIPS =================
    if (generateBtn) {
    generateBtn.onclick = async () => {
        const runId = Number(periodSelect.value);

        try {
            const res = await fetch(`${API_BASE}/generate-payslips/${runId}`, {
                method: "POST"
            });

            if (!res.ok) {
                alert("❌ Payslip generation failed");
                return;
            }

            alert("📄 Payslips generated successfully (demo)");
        } catch {
            alert("❌ Server error while generating payslips");
        }
    };
}


//Buttons alert
// ===== DOWNLOAD SALARY REGISTER =====
if (downloadRegisterBtn) {
    downloadRegisterBtn.onclick = () => {
        const runId = Number(periodSelect.value);

        if (!runId) {
            alert("❌ Please select payroll period");
            return;
        }

        // 🔥 REAL DOWNLOAD
        window.location.href =
            `http://localhost:8080/api/payroll/salary-register/${runId}`;
    };
}



if (generateTaxBtn) {
    generateTaxBtn.onclick = () => {
        const runId = Number(periodSelect.value);

        window.location.href =
            `http://localhost:8080/api/payroll/tax-sheet/${runId}`;
    };
}



if (bankTransferBtn) {
    bankTransferBtn.onclick = () => {
        const runId = Number(periodSelect.value);

        window.location.href =
            `http://localhost:8080/api/payroll/bank-transfer/${runId}`;
    };
}
 // ================= LOAD TABLE + KPIs =================
    async function loadTable(periodId = 1) {

    console.log("LOAD TABLE CALLED WITH RUN ID:", periodId);
        // 🔄 RESET OLD DATA
    tableBody.innerHTML = "";

    document.getElementById("bdBasic").innerText = "₹0";
    document.getElementById("bdAllowance").innerText = "₹0";
    document.getElementById("bdIncentive").innerText = "₹0";
    document.getElementById("bdTax").innerText = "₹0";

    document.getElementById("kpiNetPay").innerText = "₹0";
    document.getElementById("kpiBonus").innerText = "₹0";
    document.getElementById("kpiDeduction").innerText = "₹0";
    document.getElementById("kpiCompliance").innerText = "0%";
        try {
            const res = await fetch(`${API_BASE}/entries/${periodId}`);
            const entries = await res.json();

            if (!entries.length) {
                tableBody.innerHTML =
                    `<tr><td colspan="7">No payroll data available</td></tr>`;
                return;
            }
            // ===== PAYROLL BREAKDOWN CALCULATION =====
let totalBasic = 0;
let totalAllowance = 0;
let totalIncentive = 0;
let totalTax = 0;

entries.forEach(e => {
    totalBasic += e.basic || 0;

    // ✅ Allowances = HRA + Special Allowance
    totalAllowance += (e.hra || 0) + (e.specialAllowance || 0);

    // ✅ Incentives (future ready)
    totalIncentive += e.incentive || 0;

    // ✅ Total tax & deductions
    totalTax += (e.pf || 0) + (e.incomeTax || 0) + (e.professionalTax || 0);
});

// ===== SET PAYROLL BREAKDOWN VALUES =====
document.getElementById("bdBasic").innerText = "₹" + totalBasic.toFixed(2);
document.getElementById("bdAllowance").innerText = "₹" + totalAllowance.toFixed(2);
document.getElementById("bdIncentive").innerText = "₹" + totalIncentive.toFixed(2);
document.getElementById("bdTax").innerText = "₹" + totalTax.toFixed(2);


            // -------- TABLE RENDER --------
            tableBody.innerHTML = entries.map(e => `
    <tr class="${e.payrollRun?.status === 'PROCESSED' ? 'row-processed' : ''}">

        <td>${e.employeeName}</td>
        <td>${e.department}</td>
        <td>₹${(e.basic ?? 0).toFixed(2)}</td>
        <td>₹${((e.hra ?? 0) + (e.specialAllowance ?? 0)).toFixed(2)}</td>
        <td>₹${((e.pf ?? 0) + (e.professionalTax ?? 0) + (e.incomeTax ?? 0)).toFixed(2)}</td>
        <!-- ✅ STATUS COLUMN -->
    <td>
  <span class="status-pill ${
    e.payrollRun?.status === "PROCESSED" ? "status-processed" : "status-draft"
  }">
    ${e.payrollRun?.status ?? "DRAFT"}
  </span>
</td>


        <td><b>₹${(e.netSalary ?? 0).toFixed(2)}</b></td>
        <td>
            <button class="btn-sm payslip-btn"
                onclick="downloadPayslip(${e.id})">
                📄 Payslip
            </button>
        </td>
    </tr>
`).join("");


            // -------- KPI CALCULATION --------
            let totalNet = 0;
            let totalBonus = 0;
            let totalDeduction = 0;

entries.forEach(e => {
    totalNet += e.netSalary ?? 0;

    // ✅ BONUS = INCENTIVES ONLY
    totalBonus += e.incentive ?? 0;

    // ✅ ALL DEDUCTIONS
    totalDeduction += (e.pf ?? 0)
        + (e.professionalTax ?? 0)
        + (e.incomeTax ?? 0);
});


            document.getElementById("kpiNetPay").innerText = "₹" + totalNet.toFixed(0);
            document.getElementById("kpiBonus").innerText = "₹" + totalBonus.toFixed(0);
            document.getElementById("kpiDeduction").innerText = "₹" + totalDeduction.toFixed(0);
            
            // Enable button by default
runBtn.disabled = false;
runBtn.innerText = "▶ Run Payroll";
runBtn.style.opacity = "1";
runBtn.style.cursor = "pointer";

// Disable ONLY if payroll is already processed
if (periodSelect.options[periodSelect.selectedIndex].text.includes("PROCESSED")) {
    runBtn.disabled = true;
    runBtn.innerText = "✔ Payroll Completed";
    runBtn.style.opacity = "0.6";
    runBtn.style.cursor = "not-allowed";
}
            // ===== LOAD COMPLIANCE % =====
fetch(`http://localhost:8080/api/payroll/compliance-percent/${periodId}`)
    .then(res => res.json())
    .then(percent => {
        document.getElementById("kpiCompliance").innerText = percent + "%";
    });

        } catch (err) {
            console.error("Payroll load error:", err);
            tableBody.innerHTML =
                `<tr><td colspan="7" style="color:red">Failed to load payroll data</td></tr>`;
        }
    }

    // ================= AUTO LOAD =================
    loadPayrollPeriods();

    window.downloadPayslip = function (entryId) {
    console.log("Payslip clicked for ENTRY ID:", entryId);

    if (!entryId) {
        alert("Invalid payslip entry");
        return;
    }

    const url = `http://localhost:8080/api/payroll/payslip/${entryId}`;
    console.log("Opening URL:", url);

    window.open(url, "_blank");
};



});
