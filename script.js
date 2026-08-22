const landingScreen = document.getElementById("landingScreen");
const agentApp = document.getElementById("agentApp");
const enterAgent = document.getElementById("enterAgent");

const input = document.querySelector(".search-box input");
const runButton = document.querySelector(".search-box button");
const output = document.querySelector(".output");
const steps = document.querySelectorAll(".step");

enterAgent.addEventListener("click", () => {
    landingScreen.classList.add("hide");

    setTimeout(() => {
        agentApp.classList.add("show");
    }, 500);
});

runButton.addEventListener("click", runAgent);

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAgent() {

    const query = input.value.trim();
    const analysis = analyzeQuery(query);
    if (!query) {
        input.focus();
        return;
    }

    runButton.disabled = true;
    runButton.textContent = "Investigating...";

    steps.forEach(s => s.classList.remove("active"));

    output.innerHTML = `
        <div class="live-investigation">

            <div class="live-header">
                <div>
                    <span class="live-dot"></span>
                    LIVE INVESTIGATION
                </div>

                <span class="live-badge">RUNNING</span>
            </div>

            <div class="live-query">

    <small>RESEARCH QUERY</small>

    <h3>${escapeHTML(query)}</h3>

    <div class="detected-intent">
        <span>🧠</span>     

        <div>
            <small>AGENT DETECTED INTENT</small>
            <b>${analysis.intent}</b>
        </div>
    </div>

</div>

            <div class="live-timeline">

                <div class="timeline-item active">
                    <div class="timeline-icon">🧠</div>
                    <div>
                        <b>Analyzing Query</b>
                        <p>Understanding research objective...</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-icon">🔎</div>
                    <div>
                        <b>Choosing Action</b>
                        <p>Waiting...</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-icon">👁</div>
                    <div>
                        <b>Observing Results</b>
                        <p>Waiting...</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-icon">📚</div>
                    <div>
                        <b>Next Investigation</b>
                        <p>Waiting...</p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-icon">⚡</div>
                    <div>
                        <b>Generating Insight</b>
                        <p>Waiting...</p>
                    </div>
                </div>

            </div>

        </div>
    `;

    const items = document.querySelectorAll(".timeline-item");

    steps[0].classList.add("active");
    await delay(800);

    items[1].classList.add("active");
    items[1].querySelector("p").textContent =
        `Action selected: ${analysis.tools[0]}`;

    steps[1].classList.add("active");
    await delay(1000);

    items[2].classList.add("active");
    items[2].querySelector("p").textContent =
        "Relevant competitor information collected";

    steps[2].classList.add("active");
    await delay(1000);

    items[3].classList.add("active");
    items[3].querySelector("p").textContent =
        `Next action: ${analysis.tools[1] || "Research"}`;

    steps[3].classList.add("active");
    await delay(1000);

    items[4].classList.add("active");
    items[4].querySelector("p").textContent =
        "Creating actionable intelligence report";

    steps[4].classList.add("active");
    await delay(900);

    showFinal(query);

    runButton.disabled = false;
    runButton.textContent = "Run Agent →";
}

function showFinal(query) {

    output.innerHTML = `
        <div class="final-report">

            <div class="report-top">

                <div>
                    <span class="complete-dot"></span>
                    INVESTIGATION COMPLETE
                </div>

                <span>ResearchAI</span>

            </div>

            <div class="report-query">

                <small>RESEARCH QUERY</small>

                <h2>${escapeHTML(query)}</h2>

            </div>

            <div class="report-summary">

                <div class="summary-card">
                    <span>🔎</span>
                    <div>
                        <b>Action</b>
                        <p>Web Search executed</p>
                    </div>
                </div>

                <div class="summary-card">
                    <span>👁</span>
                    <div>
                        <b>Observation</b>
                        <p>Competitor data analyzed</p>
                    </div>
                </div>

                <div class="summary-card">
                    <span>📚</span>
                    <div>
                        <b>Next Action</b>
                        <p>Research & patents reviewed</p>
                    </div>
                </div>

                <div class="summary-card">
                    <span>🧠</span>
                    <div>
                        <b>Reasoning</b>
                        <p>Insights synthesized</p>
                    </div>
                </div>

            </div>

            <div class="ai-insight">

                <h3>💡 Actionable Insight</h3>

                <p>
                    The autonomous agent completed a multi-step investigation
                    using a ReAct-style reasoning flow. In the production
                    version, live news, research papers and patent databases
                    will provide real-time intelligence.
                </p>

            </div>

        </div>
    `;
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
// ==========================================
// AGENT DECISION ENGINE
// ==========================================

function analyzeQuery(query) {

    const text = query.toLowerCase();

    let intent = "general research";
    let tools = ["Web Search", "Research"];

    if (
        text.includes("competitor") ||
        text.includes("company") ||
        text.includes("activities") ||
        text.includes("tesla")
    ) {
        intent = "competitor intelligence";
        tools = ["Web Search", "Competitor Analysis", "Patent Search"];
    }

    if (
        text.includes("patent") ||
        text.includes("technology") ||
        text.includes("invention")
    ) {
        intent = "technology & patent research";
        tools = ["Patent Search", "Research", "Web Search"];
    }

    if (
        text.includes("research") ||
        text.includes("paper") ||
        text.includes("scientific")
    ) {
        intent = "scientific research";
        tools = ["Research", "Web Search"];
    }

    return {
        intent: intent,
        tools: tools
    };
}


function decideNextAction(observation, currentStep) {

    if (currentStep === 0) {
        return {
            decision: "More information needed",
            nextAction: observation.tools[1] || "Research"
        };
    }

    if (currentStep === 1) {
        return {
            decision: "Cross-checking evidence",
            nextAction: observation.tools[2] || "Web Search"
        };
    }

    return {
        decision: "Sufficient information",
        nextAction: "Generate Final Insight"
    };
}