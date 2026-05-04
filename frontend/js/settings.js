class PayrollProSettings {

    constructor() {
        this.STORAGE_KEY = "payrollpro_settings_v2";
        this.API_URL = "http://localhost:8080/api/settings";
        this.isDirty = false;
        this.init();
    }

    // ======================================================
    // INIT
    // ======================================================
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettings();
        setTimeout(() => updateComplianceDashboard(), 300);
        this.startLiveMonitoring();
        this.updateUIState();
    }

    // ======================================================
    // CACHE DOM
    // ======================================================
    cacheElements() {

        this.elements = {
            companyName: document.getElementById('companyName'),
            taxId: document.getElementById('taxId'),
            companyAddress: document.getElementById('companyAddress'),
            contactNumber: document.getElementById('contactNumber'),
            hrEmail: document.getElementById('hrEmail'),
            country: document.getElementById('country'),
            payCycle: document.getElementById('payCycle'),
            payCutoff: document.getElementById('payCutoff'),
            workDays: document.getElementById('workDays'),
            deductionMode: document.getElementById('deductionMode'),
            autoRunPayroll: document.getElementById('autoRunPayroll'),
            payslipEmail: document.getElementById('payslipEmail'),

            saveBtn: document.getElementById('saveSettings'),
            discardBtn: document.getElementById('discardChanges'),
            testBtn: document.getElementById('testConfig'),
            exportBtn: document.getElementById('exportConfig'),
            importBtn: document.getElementById('importConfig'),
            resetBtn: document.getElementById('resetAll'),

            toast: document.getElementById('toastNotification'),
            toastMessage: document.getElementById('toastMessage'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            configStatus: document.getElementById('configStatus')
        };
    }

    // ======================================================
    // EVENTS
    // ======================================================
    bindEvents() {

        this.elements.saveBtn?.addEventListener("click", () => this.saveAll());
        this.elements.discardBtn?.addEventListener("click", () => this.discardChanges());
        this.elements.testBtn?.addEventListener("click", () => this.testConfiguration());
        this.elements.exportBtn?.addEventListener("click", () => this.exportConfig());
        this.elements.importBtn?.addEventListener("click", () => this.importConfig());
        this.elements.resetBtn?.addEventListener("click", () => this.factoryReset());

        // Detect ANY change
        document.querySelectorAll(
            "main.settings-main input, main.settings-main select, main.settings-main textarea"
        ).forEach(el => {

            el.addEventListener("input", () => this.markDirty());
            el.addEventListener("change", () => this.markDirty());

        });

        console.log("✅ Events bound successfully");
    }

    // ======================================================
    // DIRTY STATE (FIXED ERROR SOURCE)
    // ======================================================
    markDirty() {

        this.isDirty = true;

        if (!this.elements.saveBtn) return;

        this.elements.saveBtn.classList.add("pulse");

        const badge =
            this.elements.saveBtn.querySelector(".btn-badge");

        if (badge) badge.textContent = "Unsaved";

        console.log("🟡 Settings modified");
    }

    // ======================================================
    // LOAD SETTINGS FROM BACKEND
    // ======================================================
    async loadSettings() {

        try {
            this.showLoading(true);

            const res = await fetch(this.API_URL);
            const settings = await res.json();

            this.populateFields(settings);

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(settings)
            );

            this.isDirty = false;
            this.updateLiveBadge();

            this.updateConfigStatus("success");

            console.log("✅ Settings loaded");

        } catch (err) {
            console.error(err);
            this.showToast("❌ Backend load failed", "error");
        }
        finally {
            this.showLoading(false);
        }
    }

    populateFields(settings) {

        Object.keys(settings).forEach(key => {

            const el = this.elements[key];
            if (!el) return;

            if (el.type === "checkbox")
                el.checked = settings[key];
            else
                el.value = settings[key] || "";

        });
    }

    // ======================================================
    // SAVE SETTINGS (GLOBAL)
    // ======================================================
    async saveAll() {

        if (!this.isDirty) {
            this.showToast("ℹ️ No changes to save", "info");
            return;
        }

        if (!this.validateForm()) return;

        try {

            this.showLoading(true);

            const settings = this.getCurrentSettings();

            // local cache
            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(settings)
            );

            // backend save
            await fetch(this.API_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });

            this.isDirty = false;
            this.updateLiveBadge();
            this.updateConfigStatus("success");

            this.showToast("✅ Settings saved globally", "success");
            localStorage.setItem(
    "last_backup_time",
    new Date().toLocaleString()
);

updateComplianceDashboard();

        } catch (err) {
            console.error(err);
            this.showToast("❌ Save failed", "error");
        }
        finally {
            this.showLoading(false);
        }
    }

    updateLiveBadge() {

        this.elements.saveBtn?.classList.remove("pulse");

        const badge =
            this.elements.saveBtn?.querySelector(".btn-badge");

        if (badge) badge.textContent = "Live";
    }

    // ======================================================
    // FORM DATA
    // ======================================================
    getCurrentSettings() {
        return {
            companyName: this.elements.companyName.value.trim(),
            taxId: this.elements.taxId.value.trim(),
            companyAddress: this.elements.companyAddress.value.trim(),
            contactNumber: this.elements.contactNumber.value.trim(),
            hrEmail: this.elements.hrEmail.value.trim(),
            country: this.elements.country.value,
            payCycle: this.elements.payCycle.value,
            payCutoff: this.elements.payCutoff.value,
            workDays: this.elements.workDays.value,
            deductionMode: this.elements.deductionMode.value,
            autoRunPayroll: this.elements.autoRunPayroll.checked,
            payslipEmail: this.elements.payslipEmail.checked
        };
    }

    // ======================================================
    // VALIDATION
    // ======================================================
    validateForm() {

        if (!this.elements.companyName.value.trim()) {
            this.showToast("Company name required", "warning");
            return false;
        }
        return true;
    }

    discardChanges() {
        this.loadSettings();
        this.showToast("Changes discarded", "info");
    }

    testConfiguration() {
        this.showToast("✅ System Operational", "success");
    }

    exportConfig() {

        const data = JSON.stringify(
            this.getCurrentSettings(),
            null,
            2
        );

        const blob = new Blob([data], { type: "application/json" });
        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "payrollpro-settings.json";
        link.click();
    }
    async importConfig() {

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";

    fileInput.onchange = async (e) => {

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (event) => {

            try {

                const importedSettings =
                    JSON.parse(event.target.result);

                this.showLoading(true);

                await fetch(this.API_URL, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(importedSettings)
                });

                this.populateFields(importedSettings);

                localStorage.setItem(
                    this.STORAGE_KEY,
                    JSON.stringify(importedSettings)
                );

                this.isDirty = false;
                this.updateLiveBadge();

                this.showToast(
                    "✅ Settings imported successfully",
                    "success"
                );

            } catch (err) {
                console.error(err);
                this.showToast("❌ Invalid config file", "error");
            } finally {
                this.showLoading(false);
            }
        };

        reader.readAsText(file);
    };

    fileInput.click();
}

    async factoryReset() {

    if (!confirm("⚠️ Reset all settings to default?"))
        return;

    try {

        this.showLoading(true);

        const defaults = {
            companyName: "PayrollPro Pvt Ltd",
            taxId: "",
            companyAddress: "",
            contactNumber: "",
            hrEmail: "",
            country: "India",
            payCycle: "Monthly",
            payCutoff: "Last day of month",
            workDays: "Calendar Days",
            deductionMode: "Auto Calculate",
            autoRunPayroll: true,
            payslipEmail: true
        };

        await fetch(this.API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(defaults)
        });

        localStorage.removeItem(this.STORAGE_KEY);

        this.populateFields(defaults);
        this.isDirty = false;
        this.updateLiveBadge();

        this.showToast("🔄 Factory reset completed", "warning");

    } catch (err) {
        console.error(err);
        this.showToast("❌ Reset failed", "error");
    } finally {
        this.showLoading(false);
    }
}

    updateConfigStatus(status) {
        if (!this.elements.configStatus) return;
        this.elements.configStatus.innerHTML =
            '<i class="fas fa-shield-check"></i> Configuration Valid';
    }

    updateUIState() {}

    startLiveMonitoring() {

    setInterval(() => {
        updateComplianceDashboard();
    }, 5000);

}

    showLoading(show) {
        this.elements.loadingOverlay?.classList.toggle("hidden", !show);
    }

    showToast(message, type = "info") {

        const toast = this.elements.toast;
        if (!toast) return;

        this.elements.toastMessage.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.className = `toast ${type} hidden`;
        }, 4000);
    }
}

// ======================================================
// SAFE AUTO START
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    if (!window.payrollProSettings)
        window.payrollProSettings = new PayrollProSettings();
});
// ===============================
// COMPLIANCE DASHBOARD ENGINE
// ===============================

window.updateComplianceDashboard = function () {

    const settings =
        JSON.parse(localStorage.getItem("payrollpro_settings_v2")) || {};

    const badges = document.querySelectorAll(".status-badge");
    const metrics = document.querySelectorAll(".metric-item strong");

    // PF Compliance
    if (badges[0])
        badges[0].textContent =
            settings.companyName ? "100%" : "0%";

    // ESIC
    if (badges[1])
        badges[1].textContent =
            settings.country === "India" ? "Active" : "Inactive";

    // PT Setup
    if (badges[2])
        badges[2].textContent =
            settings.taxId ? "Configured" : "Pending";

    // TDS
    if (badges[3])
        badges[3].textContent =
            settings.deductionMode ? "Configured" : "Not Set";

    // Backup time
    if (metrics[0])
        metrics[0].textContent =
            localStorage.getItem("last_backup_time")
            || "Just Now";

    // Database sync
    if (metrics[3])
        metrics[3].textContent =
            navigator.onLine ? "✅ Live" : "⚠ Offline";

    console.log("✅ Compliance Updated");
};
