lass GlobalSettings {

    static API_URL = "http://localhost:8080/api/settings";
    static CACHE_KEY = "payrollpro_global_settings";

    // ---------------------------
    // LOAD SETTINGS (from backend)
    // ---------------------------
    static async load() {
        try {

            // try cache first (fast UI)
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (cached) {
                this.settings = JSON.parse(cached);
            }

            // always sync from backend
            const res = await fetch(this.API_URL);
            const data = await res.json();

            this.settings = data;

            // update cache
            localStorage.setItem(
                this.CACHE_KEY,
                JSON.stringify(data)
            );

            console.log("🌍 Global settings synced");

            // notify whole app
            window.dispatchEvent(
                new CustomEvent("settingsUpdated", { detail: data })
            );

            return data;

        } catch (e) {
            console.error("Global settings load failed", e);
            return this.settings || {};
        }
    }

    // ---------------------------
    // GET VALUE ANYWHERE
    // ---------------------------
    static get(key) {
        return this.settings ? this.settings[key] : null;
    }

    static getAll() {
        return this.settings || {};
    }
}

// auto load once page opens
window.addEventListener("DOMContentLoaded", () => {
    GlobalSettings.load();
});

window.GlobalSettings = GlobalSettings;
