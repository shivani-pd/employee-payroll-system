document.body.classList.add("loading");

const BASE = "http://localhost:8080/api/dashboard";

let payrollChart = null;
let docChart = null;

/* =====================================================
   SAFE ELEMENT GETTER 
===================================================== */
const $ = (id) => document.getElementById(id);

/* =====================================================
   KPI LOAD
===================================================== */

async function loadKPIs() {
    try {
        const res = await fetch(`${BASE}/kpis`);
        const data = await res.json();

        // ✅ NEW — animated KPI update
        await animateKPIs(data);

    } catch (err) {
        console.error("❌ KPI Load Failed:", err);
    }
}

/* =====================================================
   CHART INITIALIZATION
===================================================== */

function initCharts() {

/* ---------- PAYROLL ECG DESIGNER CHART ---------- */
const payrollCanvas = $("payrollChart");

if (payrollCanvas && !payrollChart) {

    const ctx = payrollCanvas.getContext("2d");

    /* ===== MULTI COLOR NEON GRADIENT ===== */
    const lineGradient = ctx.createLinearGradient(0,0,600,0);
    lineGradient.addColorStop(0,"#00f5ff");   // cyan
    lineGradient.addColorStop(0.3,"#7c4dff"); // violet
    lineGradient.addColorStop(0.6,"#ff4ecd"); // pink
    lineGradient.addColorStop(1,"#00ffa3");   // green

    const fillGradient = ctx.createLinearGradient(0,0,0,400);
    fillGradient.addColorStop(0,"rgba(0,245,255,0.35)");
    fillGradient.addColorStop(1,"rgba(0,0,0,0)");

    /* ===== ECG PULSE ANIMATION ===== */
    const ecgPulse = {
        id: "ecgPulse",
        afterDatasetsDraw(chart){
            const {ctx} = chart;
            const meta = chart.getDatasetMeta(0);
            if(!meta.data.length) return;

            const point = meta.data[meta.data.length-1];

            const t = Date.now()/400;
            const pulse = 8 + Math.sin(t)*3;

            ctx.save();

            /* outer glow */
            ctx.beginPath();
            ctx.arc(point.x, point.y, pulse+8,0,Math.PI*2);
            ctx.fillStyle="rgba(0,255,200,0.12)";
            ctx.fill();

            /* core point */
            ctx.beginPath();
            ctx.arc(point.x, point.y, pulse,0,Math.PI*2);
            ctx.fillStyle="#00ffd0";
            ctx.fill();

            ctx.restore();
        }
    };

    /* ===== VERTICAL TRACK LINE ===== */
    const hoverLine = {
        id:"hoverLine",
        afterDatasetsDraw(chart){
            const {ctx, tooltip, chartArea:{top,bottom}} = chart;

            if(!tooltip?._active?.length) return;

            const x = tooltip._active[0].element.x;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
            ctx.strokeStyle="rgba(255,255,255,0.15)";
            ctx.lineWidth=1;
            ctx.stroke();
            ctx.restore();
        }
    };

    payrollChart = new Chart(ctx,{
        type:"line",

        data:{
            labels:[],
            datasets:[{
                data:[],
                borderColor: lineGradient,
                backgroundColor: fillGradient,
                fill:true,

                /* ECG ZIG ZAG */
                tension:0,
                borderWidth:4,

                pointRadius:3,
                pointHoverRadius:8,
                pointBackgroundColor:"#fff",
                pointBorderWidth:2,
                pointBorderColor:"#00f5ff"
            }]
        },

        plugins:[ecgPulse, hoverLine],

        options:{
            responsive:true,
            maintainAspectRatio:false,

            animation:{
                duration:1600,
                easing:"easeOutQuart"
            },

            interaction:{
                mode:"index",
                intersect:false
            },

            plugins:{
                legend:{display:false},

                tooltip:{
                    backgroundColor:"#020617",
                    borderColor:"#00f5ff",
                    borderWidth:1,
                    padding:14,
                    displayColors:false,
                    titleColor:"#c7d2fe",
                    bodyColor:"#ffffff",
                    callbacks:{
                        label:(ctx)=>
                            "Payroll  ₹ "+
                            Number(ctx.raw)
                            .toLocaleString("en-IN")
                    }
                }
            },

            scales:{
                x:{
                    grid:{
                        color:"rgba(255,255,255,0.04)"
                    },
                    ticks:{
                        color:"#94a3b8"
                    }
                },
                y:{
                    grid:{
                        color:"rgba(255,255,255,0.06)",
                        borderDash:[6,6]
                    },
                    ticks:{
                        color:"#94a3b8",
                        callback:v=>"₹ "+Number(v)
                            .toLocaleString("en-IN")
                    }
                }
            }
        }
    });
}
    /* ---------- Document Chart ---------- */
    const docCanvas = $("docChart");

    if (docCanvas && !docChart) {
        docChart = new Chart(docCanvas, {
            type: "doughnut",
            data:{
                labels:[],
                datasets:[{
                    data:[],
                    backgroundColor:[
                        "#3b82f6","#22d3ee","#8b5cf6","#93c5fd"
                    ],
                    borderWidth:0
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                cutout:"72%",
                plugins:{
                    legend:{
                        position:"bottom",
                        labels:{ color:"#c7d2fe" }
                    }
                }
            }
        });
    }
}

/* =====================================================
   LOAD PAYROLL TREND
===================================================== */

async function loadPayrollChart() {

    if (!payrollChart) return;

    try {
        const res = await fetch(`${BASE}/payroll-trend`);
        const data = await res.json();

        if (!Array.isArray(data)) return;

        payrollChart.data.labels = data.map(r => r.month);
        payrollChart.data.datasets[0].data =
            data.map(r => Math.round(Number(r.total || 0)));

        payrollChart.update();

    } catch (err) {
        console.error("❌ Payroll chart failed:", err);
    }
}

/* =====================================================
   LOAD DOCUMENT STATS
===================================================== */

async function loadDocumentChart() {

    if (!docChart) return;

    try {
        const res = await fetch(`${BASE}/document-stats`);
        const data = await res.json();

        if (!Array.isArray(data)) return;

        docChart.data.labels = data.map(r => r.type);
        docChart.data.datasets[0].data =
            data.map(r => Number(r.total || 0));

        docChart.update();

    } catch (err) {
        console.error("❌ Document chart failed:", err);
    }
}

/* =====================================================
   RUN PAYROLL BUTTON
===================================================== */

function initPayrollRunner() {

    const runBtn = $("runPayrollBtn");
    if (!runBtn) return;

    runBtn.addEventListener("click", async () => {

        runBtn.innerText = "Running...";
        runBtn.disabled = true;

        try {
            const res = await fetch(`${BASE}/run-payroll`, {
                method: "POST"
            });

            const data = await res.json();
            alert("✅ " + data.message);

            await initDashboard();

        } catch (e) {
            alert("❌ Payroll execution failed");
            console.error(e);
        }

        runBtn.innerText = "Run Payroll";
        runBtn.disabled = false;
    });
}

/* =====================================================
   ENTERPRISE SEARCH NAVIGATION
===================================================== */

/* =====================================================
   GLOBAL LIVE SEARCH — ENTERPRISE VERSION
===================================================== */

function initSearch(){

    const overlay = document.getElementById("globalSearch");
    const topSearch = document.getElementById("dashboardSearch");
    const modalInput = document.getElementById("globalSearchInput");
    const resultsBox = document.getElementById("searchResults");

    if(!overlay || !topSearch || !modalInput) return;

    /* ================= OPEN OVERLAY ================= */
    topSearch.addEventListener("focus", () => {
        overlay.classList.add("active");
        modalInput.value = "";
        resultsBox.innerHTML = "";
        modalInput.focus();
    });

    /* ================= CLOSE (ESC KEY) ================= */
    document.addEventListener("keydown",(e)=>{
        if(e.key==="Escape"){
            overlay.classList.remove("active");
            modalInput.value="";
            resultsBox.innerHTML="";
        }
    });

    /* ================= CLOSE (CLICK OUTSIDE) ================= */
    overlay.addEventListener("click",(e)=>{
        if(e.target === overlay){
            overlay.classList.remove("active");
            modalInput.value="";
            resultsBox.innerHTML="";
        }
    });

    /* ================= LIVE SEARCH ================= */
    let debounce;

    modalInput.addEventListener("input",()=>{

        clearTimeout(debounce);

        const query = modalInput.value.trim();

        /* auto close if empty */
        if(!query){
            resultsBox.innerHTML="";
            overlay.classList.remove("active");
            return;
        }

        debounce=setTimeout(async()=>{

            try{
                const res = await fetch(
                    `http://localhost:8080/api/dashboard/search?q=${encodeURIComponent(query)}`
                );

                if(!res.ok){
                    resultsBox.innerHTML =
                        `<div class="search-item">No results</div>`;
                    return;
                }

                const data = await res.json();

                if(!data.length){
                    resultsBox.innerHTML =
                        `<div class="search-item">No results found</div>`;
                    return;
                }

                resultsBox.innerHTML = data.map(item=>`
                    <div class="search-item"
                         onclick="navigateSearch('${item.type}',${item.id}); closeSearch();">
                        <strong>${item.name}</strong>
                        <div class="type">${item.type}</div>
                    </div>
                `).join("");

            }catch(err){
                console.error("Search failed",err);
            }

        },300);
    });

    /* helper close function */
    function closeSearch(){
        overlay.classList.remove("active");
        modalInput.value="";
        resultsBox.innerHTML="";
    }
}
/* navigation */
function navigateSearch(type,id){

    if(type==="EMPLOYEE")
        location.href=`employees.html?id=${id}`;

    if(type==="DOCUMENT")
        location.href=`documents.html?id=${id}`;

    if(type==="PAYROLL")
        location.href=`payroll.html?id=${id}`;
}

/* =====================================================
   KPI CARD NAVIGATION (MNC SAFE)
===================================================== */

function initKpiNavigation() {

    document.querySelectorAll(".kpi-card").forEach(card => {

        card.style.cursor = "pointer";

        card.addEventListener("mouseenter", () =>
            card.style.transform = "translateY(-3px)");

        card.addEventListener("mouseleave", () =>
            card.style.transform = "translateY(0)");
    });
}

/* =====================================================
   DASHBOARD INITIALIZER
===================================================== */

async function initDashboard() {

    initCharts();

    await loadKPIs();
    await loadPayrollChart();
    await loadDocumentChart();

    document.body.classList.remove("loading");
}

/* =====================================================
   AUTO REFRESH (Single Scheduler)
===================================================== */

function startAutoRefresh() {
    setInterval(initDashboard, 30000);
}

/* =====================================================
   BOOTSTRAP (ENTERPRISE SAFE LOAD)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initPayrollRunner();
    initSearch();
    initKpiNavigation();

    initDashboard();
    startAutoRefresh();
});

/* =====================================================
   KPI COUNT-UP ANIMATION (Dashboard Only)
===================================================== */

function animateValue(element, start, end, duration = 900) {

    if (!element) return;

    let startTime = null;

    const step = (timestamp) => {

        if (!startTime) startTime = timestamp;

        const progress = Math.min((timestamp - startTime) / duration, 1);

        const value = Math.floor(progress * (end - start) + start);

        element.innerText = value.toLocaleString("en-IN");

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
}

function animateValue(element, start, end, duration = 900) {

    if (!element) return;

    let startTime = null;

    function step(timestamp) {

        if (!startTime) startTime = timestamp;

        const progress = Math.min((timestamp - startTime) / duration, 1);

        const value = Math.floor(progress * (end - start) + start);

        element.innerText = value.toLocaleString("en-IN");

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}


/* Hook animation after KPI load */
async function animateKPIs(data){

    animateValue(
        document.getElementById("empCount"),
        0,
        data.totalEmployees ?? 0
    );

    animateValue(
        document.getElementById("docCount"),
        0,
        data.documents ?? 0
    );

    const payrollEl = document.getElementById("payrollAmount");

    if(payrollEl){
        payrollEl.innerText =
            "₹ " + Number(data.monthlyPayroll || 0)
                .toLocaleString("en-IN");
    }
}
/* =====================================================
   DASHBOARD REACTIVE GLOW SYSTEM
===================================================== */

const glow = document.querySelector(".cursor-glow");

if (glow && document.body.classList.contains("dashboard-ui")) {

    document.addEventListener("mousemove", (e) => {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
    });

    /* enhance glow near cards */
    document.querySelectorAll(".kpi-card, .card")
        .forEach(el => {

            el.addEventListener("mouseenter", () => {
                document.body.classList.add("glow-active");
            });

            el.addEventListener("mouseleave", () => {
                document.body.classList.remove("glow-active");
            });

        });
}
