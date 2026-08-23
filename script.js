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


// ==========================================
// MAIN MULTI-AGENT SYSTEM
// ==========================================

async function runAgent() {

    const query = input.value.trim();

    if (!query) {
        input.focus();
        return;
    }

    const analysis = analyzeQuery(query);

    runButton.disabled = true;
    runButton.textContent = "Investigating...";

    steps.forEach(step => step.classList.remove("active"));


    // ==========================================
    // LIVE INVESTIGATION UI
    // ==========================================

    output.innerHTML = `
        <div class="live-investigation">

            <div class="live-header">
                <div>
                    <span class="live-dot"></span>
                    MULTI-AGENT INVESTIGATION
                </div>

                <span class="live-badge">RUNNING</span>
            </div>

            <div class="live-query">

                <small>RESEARCH QUERY</small>

                <h3>${escapeHTML(query)}</h3>

                <div class="detected-intent">

                    <span>🧠</span>

                    <div>
                        <small>DETECTED INTENT</small>
                        <b>${escapeHTML(analysis.intent)}</b>
                    </div>

                </div>

            </div>


            <div class="live-timeline">

                <div class="timeline-item active">

                    <div class="timeline-icon">🤖</div>

                    <div>
                        <b>Agent 1 — Evidence Collection</b>
                        <p>Collecting evidence from external sources...</p>
                    </div>

                </div>


                <div class="timeline-item">

                    <div class="timeline-icon">🔎</div>

                    <div>
                        <b>Evidence Processing</b>
                        <p>Waiting for Agent 1...</p>
                    </div>

                </div>


                <div class="timeline-item">

                    <div class="timeline-icon">🧠</div>

                    <div>
                        <b>Agent 2 — Compliance Analysis</b>
                        <p>Waiting for evidence...</p>
                    </div>

                </div>


                <div class="timeline-item">

                    <div class="timeline-icon">📊</div>

                    <div>
                        <b>Compliance Classification</b>
                        <p>Waiting for Agent 2...</p>
                    </div>

                </div>


                <div class="timeline-item">

                    <div class="timeline-icon">⚡</div>

                    <div>
                        <b>Generating Final Intelligence</b>
                        <p>Waiting...</p>
                    </div>

                </div>

            </div>

        </div>
    `;


    const items =
        document.querySelectorAll(".timeline-item");


    steps[0].classList.add("active");

    await delay(700);


    // ==========================================
    // CALL BACKEND
    // ==========================================

    let agentResult;

    try {

        console.log(
            "Sending query to multi-agent backend:",
            query
        );


        const response = await fetch(
            "http://localhost:3000/api/research",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    query: query,
                    control: query
                })
            }
        );


        if (!response.ok) {

            throw new Error(
                `Backend request failed: ${response.status}`
            );

        }


        agentResult =
            await response.json();


        console.log(
            "MULTI-AGENT RESPONSE:",
            agentResult
        );


    } catch (error) {

        console.error(
            "BACKEND ERROR:",
            error
        );


        output.innerHTML = `

            <div class="final-report">

                <div class="report-top">

                    <div>
                        <span class="complete-dot"></span>
                        CONNECTION ERROR
                    </div>

                    <span>ResearchAI</span>

                </div>


                <div class="ai-insight">

                    <h3>
                        ⚠️ Backend Not Available
                    </h3>

                    <p>
                        Please make sure the backend is running
                        at http://localhost:3000
                    </p>

                    <p>
                        Error:
                        ${escapeHTML(error.message)}
                    </p>

                </div>

            </div>

        `;


        runButton.disabled = false;
        runButton.textContent = "Run Agent →";

        return;
    }


    // ==========================================
    // AGENT 1 — EVIDENCE COLLECTION
    // ==========================================

    items[0].classList.add("active");

    items[0].querySelector("p").textContent =
        "Evidence Collection Agent is collecting data...";

    steps[1].classList.add("active");

    await delay(700);


    const evidenceAgent =
        agentResult.evidenceAgent || {};

    const evidence =
        evidenceAgent.evidence || {};

    const webEvidence =
        evidence.web || {};

    const researchEvidence =
        evidence.research || {};


    const webCount =
        webEvidence.count || 0;

    const researchCount =
        researchEvidence.count || 0;

    const totalEvidence =
        webCount + researchCount;


    // ==========================================
    // EVIDENCE PROCESSING
    // ==========================================

    items[1].classList.add("active");

    items[1].querySelector("p").textContent =
        `${totalEvidence} evidence items collected from Web + Research sources`;

    steps[2].classList.add("active");

    await delay(900);


    // ==========================================
    // AGENT 2 — COMPLIANCE ANALYSIS
    // ==========================================

    items[2].classList.add("active");

    items[2].querySelector("p").textContent =
        "Compliance Analysis Agent is analyzing collected evidence...";

    steps[3].classList.add("active");

    await delay(900);


    // ==========================================
    // COMPLIANCE RESULT
    // ==========================================

    const complianceAgent =
        agentResult.complianceAgent || {};

    const complianceAnalysis =
        complianceAgent.analysis || {};


    const complianceStatus =
        complianceAnalysis.status ||
        "Insufficient Evidence";


    items[3].classList.add("active");

    items[3].querySelector("p").textContent =
        `Classification: ${complianceStatus}`;

    steps[4].classList.add("active");

    await delay(900);


    // ==========================================
    // FINAL INTELLIGENCE
    // ==========================================

    items[4].classList.add("active");

    items[4].querySelector("p").textContent =
        `Combining ${totalEvidence} evidence items with compliance analysis`;

    await delay(900);


    showFinal(
        query,
        agentResult
    );


    runButton.disabled = false;
    runButton.textContent = "Run Agent →";
}


// ==========================================
// FINAL MULTI-AGENT REPORT
// ==========================================

function showFinal(query, agentResult) {

    const evidenceAgent =
        agentResult.evidenceAgent || {};

    const complianceAgent =
        agentResult.complianceAgent || {};


    const evidence =
        evidenceAgent.evidence || {};

    const webResult =
        evidence.web || {};

    const researchResult =
        evidence.research || {};


    const analysis =
        complianceAgent.analysis || {};


    const webResults =
        Array.isArray(webResult.results)
            ? webResult.results
            : [];


    const researchResults =
        Array.isArray(researchResult.results)
            ? researchResult.results
            : [];


    const totalEvidence =
        webResults.length +
        researchResults.length;


    const status =
        analysis.status ||
        "Insufficient Evidence";


    const reason =
        analysis.reason ||
        "Evidence analysis completed.";


    // ==========================================
    // BUILD SOURCE RESULTS
    // ==========================================

    let resultHTML = "";


    // ------------------------------------------
    // WEB RESULTS
    // ------------------------------------------

    if (webResults.length > 0) {

        resultHTML += `

            <div class="tool-results">

                <div class="tool-results-header">

                    <h3>
                        Web Evidence
                    </h3>

                    <span>
                        ${webResults.length} RESULTS
                    </span>

                </div>

        `;


        webResults.forEach(
            (item, index) => {

                const title =
                    item.title ||
                    "Untitled Result";

                const url =
                    item.url || "";


                resultHTML += `

                    <div class="result-item">

                        <div class="result-number">
                            ${index + 1}
                        </div>

                        <div class="result-content">

                            ${url
                        ? `
                                        <a
                                            href="${escapeHTML(url)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="result-title"
                                        >
                                            ${escapeHTML(title)}
                                        </a>
                                    `
                        : `
                                        <div class="result-title">
                                            ${escapeHTML(title)}
                                        </div>
                                    `
                    }

                            <div class="result-meta">

                                <span>
                                    📌 Hacker News
                                </span>

                            </div>

                        </div>

                    </div>

                `;

            }
        );


        resultHTML += `
            </div>
        `;

    }


    // ------------------------------------------
    // RESEARCH RESULTS
    // ------------------------------------------

    if (researchResults.length > 0) {

        resultHTML += `

            <div class="tool-results">

                <div class="tool-results-header">

                    <h3>
                        Research Evidence
                    </h3>

                    <span>
                        ${researchResults.length} RESULTS
                    </span>

                </div>

        `;


        researchResults.forEach(
            (item, index) => {

                const title =
                    item.title ||
                    "Untitled Research";


                const url =
                    item.url || "";


                const date =
                    item.publicationDate
                        ? `Published: ${item.publicationDate}`
                        : "";


                const citations =
                    item.citedBy !== undefined
                        ? `Citations: ${item.citedBy}`
                        : "";


                resultHTML += `

                    <div class="result-item">

                        <div class="result-number">
                            ${index + 1}
                        </div>

                        <div class="result-content">

                            ${url
                        ? `
                                        <a
                                            href="${escapeHTML(url)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="result-title"
                                        >
                                            ${escapeHTML(title)}
                                        </a>
                                    `
                        : `
                                        <div class="result-title">
                                            ${escapeHTML(title)}
                                        </div>
                                    `
                    }

                            <div class="result-meta">

                                <span>
                                    📚 ${escapeHTML(
                        item.source ||
                        "Research Source"
                    )}
                                </span>

                                ${date
                        ? `
                                            <span>
                                                📅 ${escapeHTML(date)}
                                            </span>
                                        `
                        : ""
                    }

                                ${citations
                        ? `
                                            <span>
                                                📊 ${escapeHTML(citations)}
                                            </span>
                                        `
                        : ""
                    }

                            </div>

                        </div>

                    </div>

                `;

            }
        );


        resultHTML += `
            </div>
        `;

    }


    // ==========================================
    // FINAL UI
    // ==========================================

    output.innerHTML = `

        <div class="final-report">


            <!-- REPORT HEADER -->

            <div class="report-top">

                <div>

                    <span class="complete-dot"></span>

                    INVESTIGATION COMPLETE

                </div>

                <span>
                    ResearchAI
                </span>

            </div>


            <!-- QUERY -->

            <div class="report-query">

                <small>
                    RESEARCH QUERY
                </small>

                <h2>
                    ${escapeHTML(query)}
                </h2>

            </div>


            <!-- ==================================
                 MULTI-AGENT ARCHITECTURE
                 ================================== -->

            <div
                class="ai-insight"
                style="margin-bottom:20px;"
            >

                <h3>
                    🤖 Multi-Agent Architecture
                </h3>

                <p>
                    Two specialized agents collaborated
                    sequentially to complete the investigation.
                </p>

            </div>


            <!-- AGENT CARDS -->

            <div class="report-summary">


                <!-- AGENT 1 -->

                <div class="summary-card">

                    <span>
                        🔎
                    </span>

                    <div>

                        <b>
                            Agent 1 — Evidence Collection
                        </b>

                        <p>
                            Collected
                            ${totalEvidence}
                            evidence items
                            from external sources.
                        </p>

                    </div>

                </div>


                <!-- COLLABORATION -->

                <div class="summary-card">

                    <span>
                        🔄
                    </span>

                    <div>

                        <b>
                            Agent Collaboration
                        </b>

                        <p>
                            Evidence Agent →
                            Compliance Agent
                        </p>

                    </div>

                </div>


                <!-- AGENT 2 -->

                <div class="summary-card">

                    <span>
                        🧠
                    </span>

                    <div>

                        <b>
                            Agent 2 — Compliance Analysis
                        </b>

                        <p>
                            Analyzed evidence and
                            classified the control.
                        </p>

                    </div>

                </div>


            </div>


            <!-- ==================================
                 COMPLIANCE RESULT
                 ================================== -->

            <div
                class="ai-insight"
                style="margin-top:20px;"
            >

                <h3>
                    ${status === "Supported"
            ? "✅"
            : status === "Insufficient Evidence"
                ? "⚠️"
                : "❌"
        }

                    Compliance Result:
                    ${escapeHTML(status)}
                </h3>

                <p>
                    ${escapeHTML(reason)}
                </p>

                <p>
                    <strong>
                        Evidence analyzed:
                    </strong>

                    ${totalEvidence}
                </p>

            </div>


            <!-- SOURCE RESULTS -->

            ${resultHTML}


            <!-- FINAL INSIGHT -->

            <div class="ai-insight">

                <h3>
                    💡 Actionable Insight
                </h3>

                <p>
                    The Evidence Collection Agent gathered
                    external evidence and passed it to the
                    Compliance Analysis Agent. The second
                    agent evaluated the evidence and produced
                    the final compliance classification.
                </p>

            </div>


        </div>

    `;
}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text ?? "");

    return div.innerHTML;
}


// ==========================================
// FRONTEND INTENT ANALYSIS
// ==========================================

function analyzeQuery(query) {

    const text =
        query.toLowerCase();


    let intent =
        "general research";


    let tools = [
        "Web Search",
        "Research Search"
    ];


    if (
        text.includes("competitor") ||
        text.includes("company") ||
        text.includes("activities") ||
        text.includes("tesla") ||
        text.includes("market")
    ) {

        intent =
            "competitor intelligence";

        tools = [
            "Web Search",
            "Research Search"
        ];

    }


    if (
        text.includes("patent") ||
        text.includes("technology") ||
        text.includes("invention")
    ) {

        intent =
            "technology & patent research";

        tools = [
            "Research Search",
            "Web Search"
        ];

    }


    if (
        text.includes("research") ||
        text.includes("paper") ||
        text.includes("scientific") ||
        text.includes("study")
    ) {

        intent =
            "scientific research";

        tools = [
            "Research Search",
            "Web Search"
        ];

    }


    return {

        intent:
            intent,

        tools:
            tools

    };

}
