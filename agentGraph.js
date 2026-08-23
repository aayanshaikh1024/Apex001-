import { StateGraph, START, END } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph-checkpoint";

import { evidenceAgent } from "./agents/evidenceAgent.js";
import { complianceAgent } from "./agents/complianceAgent.js";


// ==========================================
// ADVERSARIAL TEST MODE
// ==========================================

let simulateWebFailure = true;


// ==========================================
// MEMORY-BASED REASONING
// ==========================================

const taskMemory = [];


// ==========================================
// TOOL 1 — WEB SEARCH
// ==========================================

async function webSearch(query) {

    console.log("[GRAPH TOOL] Web Search:", query);

    if (simulateWebFailure) {

        simulateWebFailure = false;

        console.log(
            "[ADVERSARIAL TEST] Hacker News tool intentionally failed"
        );

        throw new Error(
            "Simulated Hacker News tool failure"
        );

    }

    const response = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`
    );

    if (!response.ok) {

        throw new Error(
            `Hacker News API error: ${response.status}`
        );

    }

    const data = await response.json();

    const hits = Array.isArray(data.hits)
        ? data.hits
        : [];

    const results = hits.map(item => ({

        title:
            item.title ||
            item.story_title ||
            "Untitled",

        url:
            item.url ||
            item.story_url ||
            "",

        source:
            "Hacker News"

    }));

    return {

        tool: "Web Search",
        status: "success",
        count: results.length,
        results

    };

}


// ==========================================
// TOOL 2A — OPENALEX
// ==========================================

async function searchOpenAlex(query) {

    console.log("[GRAPH TOOL] OpenAlex:", query);

    const response = await fetch(
        `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5`
    );

    if (!response.ok) {

        throw new Error(
            `OpenAlex API error: ${response.status}`
        );

    }

    const data = await response.json();

    const works = Array.isArray(data.results)
        ? data.results
        : [];

    return works.map(item => ({

        title:
            item.title ||
            "Untitled",

        url:
            item.doi
                ? `https://doi.org/${item.doi.replace(
                    "https://doi.org/",
                    ""
                )}`
                : "",

        publicationDate:
            item.publication_date ||
            "Unknown",

        citedBy:
            item.cited_by_count ?? 0,

        source:
            "OpenAlex"

    }));

}


// ==========================================
// TOOL 2B — CROSSREF FALLBACK
// ==========================================

async function searchCrossref(query) {

    console.log(
        "[GRAPH TOOL] Crossref Fallback:",
        query
    );

    const response = await fetch(
        `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=5`
    );

    if (!response.ok) {

        throw new Error(
            `Crossref API error: ${response.status}`
        );

    }

    const data = await response.json();

    const works =
        data.message &&
            Array.isArray(data.message.items)
            ? data.message.items
            : [];

    return works.map(item => {

        let publicationDate = "Unknown";

        if (
            item.published &&
            Array.isArray(
                item.published["date-parts"]
            )
        ) {

            const parts =
                item.published["date-parts"][0];

            if (parts) {

                publicationDate =
                    parts.join("-");

            }

        }

        return {

            title:
                Array.isArray(item.title) &&
                    item.title.length > 0
                    ? item.title[0]
                    : "Untitled",

            url:
                item.URL ||
                (
                    item.DOI
                        ? `https://doi.org/${item.DOI}`
                        : ""
                ),

            publicationDate,

            citedBy:
                item["is-referenced-by-count"] ?? 0,

            source:
                "Crossref"

        };

    });

}


// ==========================================
// RESEARCH SEARCH + FALLBACK
// ==========================================

async function researchSearch(query) {

    try {

        const results =
            await searchOpenAlex(query);

        console.log(
            "[GRAPH TOOL] OpenAlex Results:",
            results.length
        );

        return {

            tool: "Research Search",
            status: "success",
            count: results.length,
            results

        };

    } catch (openAlexError) {

        console.log(
            "[RECOVERY] OpenAlex failed:",
            openAlexError.message
        );

        console.log(
            "[RECOVERY] Automatically switching to Crossref..."
        );

        try {

            const results =
                await searchCrossref(query);

            console.log(
                "[RECOVERY] Crossref recovered research search"
            );

            return {

                tool: "Research Search",
                status: "success",
                count: results.length,
                results,
                fallback: "Crossref"

            };

        } catch (crossrefError) {

            return {

                tool: "Research Search",
                status: "error",
                count: 0,
                results: [],
                error:
                    `Research APIs failed: ${crossrefError.message}`

            };

        }

    }

}


// ==========================================
// SAFE TOOL WRAPPER
// ==========================================

async function safeToolRun(
    toolName,
    toolFunction,
    query
) {

    try {

        return await toolFunction(query);

    } catch (error) {

        console.log(
            `[RECOVERY] ${toolName} unavailable`
        );

        return {

            tool: toolName,
            status: "error",
            count: 0,
            results: [],
            error: error.message

        };

    }

}


// ==========================================
// LANGGRAPH STATE
// ==========================================

const workflow = new StateGraph({

    channels: {

        query: {
            value: null
        },

        evidence: {
            value: null
        },

        compliance: {
            value: null
        },

        status: {
            value: null
        },

        retryCount: {
            value: null
        },

        failureRecovered: {
            value: null
        },

        plan: {
            value: null
        },

        memory: {
            value: null
        },

        loopCount: {
            value: null
        }

    }

});


// ==========================================
// PLANNER — DYNAMIC PLANNING
// ==========================================

workflow.addNode(
    "planner",
    async (state) => {

        console.log("\n[GRAPH] Dynamic Planner running");
        console.log("[GRAPH] Query:", state.query);

        const previousMemory =
            taskMemory.find(
                item => item.query === state.query
            );

        let plan;

        if (
            previousMemory &&
            previousMemory.status === "evidence_empty"
        ) {

            plan = [
                "Use broader search strategy",
                "Run independent evidence sources",
                "Verify uncertainty",
                "Make final compliance decision"
            ];

            console.log(
                "[MEMORY] Previous failure found → adapting plan"
            );

        } else {

            plan = [
                "Collect web evidence",
                "Collect research evidence",
                "Resolve source differences",
                "Evaluate compliance"
            ];

        }

        console.log(
            "[GRAPH] Adaptive Task Plan:",
            plan
        );

        return {

            status: "planned",

            retryCount:
                state.retryCount ?? 0,

            failureRecovered:
                state.failureRecovered ?? false,

            loopCount:
                state.loopCount ?? 0,

            plan,

            memory:
                previousMemory ?? null

        };

    }
);


// ==========================================
// EVIDENCE AGENT
// ==========================================

workflow.addNode(
    "evidenceAgent",
    async (state) => {

        console.log(
            "\n[GRAPH] Evidence Agent running"
        );

        console.log(
            "[GRAPH] Executing plan step: Parallel evidence collection"
        );

        const [
            webEvidence,
            researchEvidence
        ] =
            await Promise.all([

                safeToolRun(
                    "Web Search",
                    webSearch,
                    state.query
                ),

                safeToolRun(
                    "Research Search",
                    researchSearch,
                    state.query
                )

            ]);

        const recoveredFromFailure =
            webEvidence.status === "error" &&
            researchEvidence.status === "success";

        if (recoveredFromFailure) {

            console.log(
                "[RECOVERY] Tool failure recovered using independent source"
            );

        }

        const result =
            await evidenceAgent(

                state.query,

                async () => webEvidence,

                async () => researchEvidence

            );

        const webCount =
            result?.evidence?.web?.count || 0;

        const researchCount =
            result?.evidence?.research?.count || 0;

        const totalEvidence =
            webCount +
            researchCount;

        console.log(
            "[GRAPH] Total evidence:",
            totalEvidence
        );

        let nextStatus;

        if (totalEvidence === 0) {

            nextStatus =
                "evidence_empty";

        } else {

            nextStatus =
                "evidence_collected";

        }

        return {

            evidence: result,

            status: nextStatus,

            retryCount:
                state.retryCount ?? 0,

            failureRecovered:
                recoveredFromFailure,

            loopCount:
                (state.loopCount ?? 0) + 1

        };

    }
);


// ==========================================
// REPLANNER — AUTONOMOUS REPLANNING
// ==========================================

workflow.addNode(
    "replanner",
    async (state) => {

        const nextRetry =
            (state.retryCount ?? 0) + 1;

        console.log(
            "\n[GRAPH] AUTONOMOUS REPLANNING"
        );

        console.log(
            "[GRAPH] Retry:",
            nextRetry
        );

        const newPlan = [

            "Simplify query strategy",

            "Retry failed evidence path",

            "Use available fallback tools",

            "Stop safely if evidence remains unavailable"

        ];

        console.log(
            "[GRAPH] New adaptive plan:",
            newPlan
        );

        return {

            status: "replanning",

            retryCount:
                nextRetry,

            plan:
                newPlan

        };

    }
);


// ==========================================
// COMPLIANCE AGENT
// ==========================================

workflow.addNode(
    "complianceAgent",
    async (state) => {

        console.log(
            "\n[GRAPH] Compliance Agent running"
        );

        console.log(
            "[GRAPH] Resolving evidence and evaluating uncertainty"
        );

        const result =
            await complianceAgent(
                state.evidence,
                state.query
            );

        const memoryRecord = {

            query:
                state.query,

            status:
                state.status,

            finalDecision:
                result?.analysis?.status,

            confidence:
                result?.analysis?.confidence,

            timestamp:
                new Date().toISOString()

        };

        taskMemory.push(
            memoryRecord
        );

        console.log(
            "[MEMORY] Task outcome stored"
        );

        return {

            compliance:
                result,

            status:
                "compliance_analyzed"

        };

    }
);


// ==========================================
// CONDITIONAL ROUTER
// LOOP / DEADLOCK DETECTION
// ==========================================

function routeAfterEvidence(state) {

    console.log(
        "\n[GRAPH] Conditional Router"
    );

    const retryCount =
        state.retryCount ?? 0;

    const loopCount =
        state.loopCount ?? 0;


    // LOOP / DEADLOCK PROTECTION

    if (loopCount > 3) {

        console.log(
            "[SAFETY] Loop/deadlock risk detected"
        );

        console.log(
            "[SAFETY] Stopping retry cycle safely"
        );

        return "complianceAgent";

    }


    if (
        state.status ===
        "evidence_collected"
    ) {

        console.log(
            "[GRAPH] Evidence available → Compliance"
        );

        return "complianceAgent";

    }


    if (
        state.status ===
        "evidence_empty" &&
        retryCount < 1
    ) {

        console.log(
            "[GRAPH] Evidence insufficient → Autonomous Replanning"
        );

        return "replanner";

    }


    console.log(
        "[GRAPH] Retry/resource limit reached → Final evaluation"
    );

    return "complianceAgent";

}


// ==========================================
// GRAPH ROUTING
// ==========================================

workflow.addEdge(
    START,
    "planner"
);

workflow.addEdge(
    "planner",
    "evidenceAgent"
);

workflow.addConditionalEdges(
    "evidenceAgent",
    routeAfterEvidence,
    {

        complianceAgent:
            "complianceAgent",

        replanner:
            "replanner"

    }
);

workflow.addEdge(
    "replanner",
    "evidenceAgent"
);

workflow.addEdge(
    "complianceAgent",
    END
);


// ==========================================
// CHECKPOINTING
// ==========================================

const checkpointer =
    new MemorySaver();


// ==========================================
// COMPILE
// ==========================================

export const agentGraph =
    workflow.compile({

        checkpointer

    });


// ==========================================
// TASK 5 ADVERSARIAL LIVE TEST
// ==========================================

const testConfig = {

    configurable: {

        thread_id:
            "task5-final-adversarial-test"

    }

};


const testResult =
    await agentGraph.invoke(

        {

            query:
                "cyber security",

            evidence:
                null,

            compliance:
                null,

            status:
                null,

            retryCount:
                0,

            failureRecovered:
                false,

            plan:
                null,

            memory:
                null,

            loopCount:
                0

        },

        testConfig

    );


// ==========================================
// FINAL TEST OUTPUT
// ==========================================

console.log(
    "\n========================================"
);

console.log(
    "[TASK 5 FINAL ADVERSARIAL TEST]"
);

console.log(
    "========================================"
);

console.log(
    JSON.stringify(
        testResult,
        null,
        2
    )
);

console.log(
    "\n[TEST SUMMARY]"
);

console.log(
    "Failure Recovered:",
    testResult.failureRecovered
);

console.log(
    "Final Status:",
    testResult.status
);

console.log(
    "Decision:",
    testResult.compliance?.analysis?.status
);

console.log(
    "Dynamic Plan:",
    testResult.plan
);

console.log(
    "Loop Count:",
    testResult.loopCount
);
