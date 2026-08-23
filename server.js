import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { evidenceAgent } from "./agents/evidenceAgent.js";
import { complianceAgent } from "./agents/complianceAgent.js";

import {
    startContext,
    storeEvidence,
    storeCompliance,
    getContext
} from "./contextManager.js";

import {
    startTrace,
    addTraceEvent,
    endTrace
} from "./traceLogger.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;


// ==========================================
// HELPER — CREATE SMART SEARCH QUERY
// ==========================================

function cleanSearchQuery(query) {

    const stopWords = [
        "latest",
        "activities",
        "activity",
        "about",
        "news",
        "research",
        "find",
        "search",
        "show",
        "me"
    ];

    const words = String(query || "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .filter(word => !stopWords.includes(word));

    return words.join(" ") || String(query || "");
}


// ==========================================
// TOOL 1 — HACKER NEWS API
// ==========================================

async function webSearch(query, trace = null) {

    const toolStart = Date.now();

    if (trace) {
        addTraceEvent(trace, "tool_start", {
            tool: "Hacker News API",
            query
        });
    }

    try {

        // ======================================
        // CONTROLLED FAILURE TEST
        // ======================================

        if (
            String(query)
                .toLowerCase()
                .includes("testfailure")
        ) {

            throw new Error(
                "Controlled Web Search Failure for tracing test"
            );

        }


        const searchQuery = cleanSearchQuery(query);

        console.log(
            "Web Search Query:",
            searchQuery
        );


        const response = await fetch(
            `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchQuery)}&tags=story&hitsPerPage=5`
        );


        if (!response.ok) {

            throw new Error(
                `Hacker News API error: ${response.status}`
            );

        }


        const data = await response.json();


        let hits = Array.isArray(data.hits)
            ? data.hits
            : [];


        // ======================================
        // FALLBACK SEARCH
        // ======================================

        if (hits.length === 0) {

            const firstWord =
                searchQuery.split(" ")[0] || query;


            console.log(
                "Hacker News fallback query:",
                firstWord
            );


            if (trace) {

                addTraceEvent(
                    trace,
                    "tool_fallback",
                    {
                        tool: "Hacker News API",
                        reason:
                            "No results from original query",
                        fallbackQuery:
                            firstWord
                    }
                );

            }


            const fallbackResponse = await fetch(
                `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(firstWord)}&tags=story&hitsPerPage=5`
            );


            if (!fallbackResponse.ok) {

                throw new Error(
                    `Hacker News fallback API error: ${fallbackResponse.status}`
                );

            }


            const fallbackData =
                await fallbackResponse.json();


            hits = Array.isArray(fallbackData.hits)
                ? fallbackData.hits
                : [];

        }


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


        const latency =
            Date.now() - toolStart;


        console.log(
            "Hacker News Results:",
            results.length
        );


        if (trace) {

            addTraceEvent(
                trace,
                "tool_success",
                {
                    tool:
                        "Hacker News API",

                    resultCount:
                        results.length,

                    latencyMs:
                        latency
                }
            );

        }


        return {

            tool:
                "Web Search",

            status:
                "success",

            count:
                results.length,

            results,

            latencyMs:
                latency,

            message:
                `Found ${results.length} web/news results`

        };

    } catch (error) {

        const latency =
            Date.now() - toolStart;


        console.error(
            "Web Search Error:",
            error.message
        );


        if (trace) {

            addTraceEvent(
                trace,
                "tool_error",
                {
                    tool:
                        "Hacker News API",

                    error:
                        error.message,

                    latencyMs:
                        latency,

                    rootCause:
                        "Controlled or external web search failure"
                }
            );

        }


        return {

            tool:
                "Web Search",

            status:
                "error",

            count:
                0,

            results:
                [],

            latencyMs:
                latency,

            error:
                error.message

        };

    }

}


// ==========================================
// TOOL 2A — OPENALEX RESEARCH API
// ==========================================

async function searchOpenAlex(
    searchQuery,
    trace = null
) {

    const toolStart =
        Date.now();


    if (trace) {

        addTraceEvent(
            trace,
            "tool_start",
            {
                tool:
                    "OpenAlex API",

                query:
                    searchQuery
            }
        );

    }


    try {

        const response = await fetch(
            `https://api.openalex.org/works?search=${encodeURIComponent(searchQuery)}&per-page=5`
        );


        if (!response.ok) {

            throw new Error(
                `OpenAlex API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        const works =
            Array.isArray(data.results)
                ? data.results
                : [];


        const results =
            works.map(item => ({

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


        const latency =
            Date.now() - toolStart;


        if (trace) {

            addTraceEvent(
                trace,
                "tool_success",
                {
                    tool:
                        "OpenAlex API",

                    resultCount:
                        results.length,

                    latencyMs:
                        latency
                }
            );

        }


        return results;

    } catch (error) {

        const latency =
            Date.now() - toolStart;


        if (trace) {

            addTraceEvent(
                trace,
                "tool_error",
                {
                    tool:
                        "OpenAlex API",

                    error:
                        error.message,

                    latencyMs:
                        latency,

                    rootCause:
                        "Primary research API unavailable"
                }
            );

        }

        throw error;

    }

}


// ==========================================
// TOOL 2B — CROSSREF FALLBACK API
// ==========================================

async function searchCrossref(
    searchQuery,
    trace = null
) {

    const toolStart =
        Date.now();


    console.log(
        "Using Crossref Research Fallback..."
    );


    if (trace) {

        addTraceEvent(
            trace,
            "tool_start",
            {
                tool:
                    "Crossref API",

                query:
                    searchQuery
            }
        );

    }


    try {

        const response =
            await fetch(
                `https://api.crossref.org/works?query=${encodeURIComponent(searchQuery)}&rows=5`
            );


        if (!response.ok) {

            throw new Error(
                `Crossref API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        const works =
            data.message &&
                Array.isArray(data.message.items)
                ? data.message.items
                : [];


        const results =
            works.map(item => {

                let publicationDate =
                    "Unknown";


                if (
                    item.published &&
                    Array.isArray(
                        item.published["date-parts"]
                    )
                ) {

                    const dateParts =
                        item.published["date-parts"][0];


                    if (dateParts) {

                        publicationDate =
                            dateParts.join("-");

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


        const latency =
            Date.now() - toolStart;


        if (trace) {

            addTraceEvent(
                trace,
                "tool_success",
                {
                    tool:
                        "Crossref API",

                    resultCount:
                        results.length,

                    latencyMs:
                        latency
                }
            );

        }


        return results;

    } catch (error) {

        const latency =
            Date.now() - toolStart;


        if (trace) {

            addTraceEvent(
                trace,
                "tool_error",
                {
                    tool:
                        "Crossref API",

                    error:
                        error.message,

                    latencyMs:
                        latency,

                    rootCause:
                        "Fallback research API unavailable"
                }
            );

        }

        throw error;

    }

}


// ==========================================
// TOOL 2 — RESEARCH SEARCH
// ==========================================

async function researchSearch(
    query,
    trace = null
) {

    const searchStart =
        Date.now();


    const searchQuery =
        cleanSearchQuery(query);


    console.log(
        "Research Search Query:",
        searchQuery
    );


    // ======================================
    // TRY OPENALEX
    // ======================================

    try {

        console.log(
            "Trying OpenAlex API..."
        );


        let results =
            await searchOpenAlex(
                searchQuery,
                trace
            );


        // ==================================
        // OPENALEX EMPTY RESULT FALLBACK
        // ==================================

        if (results.length === 0) {

            const firstWord =
                searchQuery.split(" ")[0] ||
                searchQuery;


            console.log(
                "OpenAlex fallback query:",
                firstWord
            );


            if (trace) {

                addTraceEvent(
                    trace,
                    "decision",
                    {
                        decision:
                            "OpenAlex returned no results",

                        action:
                            "Retry using simplified query",

                        fallbackQuery:
                            firstWord
                    }
                );

            }


            results =
                await searchOpenAlex(
                    firstWord,
                    trace
                );

        }


        console.log(
            "OpenAlex Results:",
            results.length
        );


        return {

            tool:
                "Research Search",

            status:
                "success",

            count:
                results.length,

            results,

            latencyMs:
                Date.now() -
                searchStart,

            provider:
                "OpenAlex",

            message:
                `Found ${results.length} research results using OpenAlex`

        };

    } catch (openAlexError) {

        console.log(
            "OpenAlex unavailable:",
            openAlexError.message
        );


        console.log(
            "Switching to Crossref..."
        );


        if (trace) {

            addTraceEvent(
                trace,
                "recovery",
                {
                    failedTool:
                        "OpenAlex API",

                    rootCause:
                        openAlexError.message,

                    diagnosis:
                        "Primary research source unavailable",

                    recoveryAction:
                        "Switch to Crossref fallback"
                }
            );

        }


        // ==================================
        // TRY CROSSREF FALLBACK
        // ==================================

        try {

            let results =
                await searchCrossref(
                    searchQuery,
                    trace
                );


            if (results.length === 0) {

                const firstWord =
                    searchQuery.split(" ")[0] ||
                    searchQuery;


                if (trace) {

                    addTraceEvent(
                        trace,
                        "decision",
                        {
                            decision:
                                "Crossref returned no results",

                            action:
                                "Retry using simplified query",

                            fallbackQuery:
                                firstWord
                        }
                    );

                }


                results =
                    await searchCrossref(
                        firstWord,
                        trace
                    );

            }


            console.log(
                "Crossref Results:",
                results.length
            );


            return {

                tool:
                    "Research Search",

                status:
                    "success",

                count:
                    results.length,

                results,

                latencyMs:
                    Date.now() -
                    searchStart,

                provider:
                    "Crossref",

                message:
                    `Found ${results.length} research results using Crossref fallback`

            };

        } catch (crossrefError) {

            const errorMessage =
                `Research APIs failed: ${crossrefError.message}`;


            console.error(
                "Research Search Error:",
                crossrefError.message
            );


            if (trace) {

                addTraceEvent(
                    trace,
                    "tool_error",
                    {
                        tool:
                            "Research Search",

                        error:
                            errorMessage,

                        latencyMs:
                            Date.now() -
                            searchStart,

                        rootCause:
                            "Both primary and fallback research APIs failed"
                    }
                );

            }


            return {

                tool:
                    "Research Search",

                status:
                    "error",

                count:
                    0,

                results:
                    [],

                latencyMs:
                    Date.now() -
                    searchStart,

                error:
                    errorMessage

            };

        }

    }

}


// ==========================================
// MULTI-AGENT API
// ==========================================

app.post(
    "/api/research",
    async (req, res) => {

        let workflowTrace = null;

        try {

            const {
                query,
                control
            } = req.body || {};


            // ==================================
            // START TRACE
            // ==================================

            workflowTrace =
                startTrace(
                    "ResearchAI Multi-Agent Workflow",
                    {
                        endpoint:
                            "/api/research",

                        query,

                        agents:
                            [
                                "Evidence Collection Agent",
                                "Compliance Analysis Agent"
                            ]
                    }
                );


            addTraceEvent(
                workflowTrace,
                "request_received",
                {
                    query,

                    control:
                        control || query
                }
            );


            // ==================================
            // VALIDATION
            // ==================================

            if (
                !query ||
                !String(query).trim()
            ) {

                addTraceEvent(
                    workflowTrace,
                    "validation_error",
                    {
                        error:
                            "Query is required"
                    }
                );


                const completedTrace =
                    endTrace(
                        workflowTrace,
                        "failed",
                        "Missing query"
                    );


                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Query is required",

                    trace: {
                        id:
                            completedTrace?.id,

                        name:
                            completedTrace?.name,

                        status:
                            completedTrace?.status,

                        latencyMs:
                            completedTrace?.latency,

                        events:
                            completedTrace?.events || []
                    }

                });

            }


            const cleanQuery =
                String(query).trim();


            // ==================================
            // CONTEXT START
            // ==================================

            addTraceEvent(
                workflowTrace,
                "context_start",
                {
                    query:
                        cleanQuery
                }
            );


            startContext(
                cleanQuery
            );


            console.log(
                "\n>>> AGENT 1: EVIDENCE COLLECTION"
            );


            // ==================================
            // AGENT 1 — EVIDENCE
            // ==================================

            const evidenceStart =
                Date.now();


            addTraceEvent(
                workflowTrace,
                "agent_start",
                {
                    agent:
                        "Evidence Collection Agent",

                    task:
                        "Collect evidence from web and research sources"
                }
            );


            const tracedWebSearch =
                async agentQuery =>
                    webSearch(
                        agentQuery,
                        workflowTrace
                    );


            const tracedResearchSearch =
                async agentQuery =>
                    researchSearch(
                        agentQuery,
                        workflowTrace
                    );


            const evidenceResult =
                await evidenceAgent(
                    cleanQuery,
                    tracedWebSearch,
                    tracedResearchSearch
                );


            const webEvidence =
                evidenceResult?.evidence?.web || {};

            const researchEvidence =
                evidenceResult?.evidence?.research || {};


            const totalEvidence =
                evidenceResult?.evidence?.totalEvidence ??
                (
                    (webEvidence.count || 0) +
                    (researchEvidence.count || 0)
                );


            addTraceEvent(
                workflowTrace,
                "agent_complete",
                {
                    agent:
                        "Evidence Collection Agent",

                    latencyMs:
                        Date.now() -
                        evidenceStart,

                    webEvidence:
                        webEvidence.count || 0,

                    researchEvidence:
                        researchEvidence.count || 0,

                    totalEvidence
                }
            );


            // ==================================
            // STORE EVIDENCE
            // ==================================

            storeEvidence(
                evidenceResult
            );


            addTraceEvent(
                workflowTrace,
                "context_update",
                {
                    action:
                        "Evidence stored and passed to Compliance Agent"
                }
            );


            // ==================================
            // RECOVERY DIAGNOSIS
            // ==================================

            const webStatus =
                webEvidence.status;

            const researchStatus =
                researchEvidence.status;


            if (
                webStatus === "error" &&
                researchStatus === "success"
            ) {

                addTraceEvent(
                    workflowTrace,
                    "recovery",
                    {
                        rootCause:
                            webEvidence.error,

                        diagnosis:
                            "Web evidence tool failed but independent research tool succeeded",

                        recoveryAction:
                            "Continue workflow using research evidence",

                        improvement:
                            "System avoided complete workflow failure"
                    }
                );

            }


            console.log(
                "\n>>> AGENT 2: COMPLIANCE ANALYSIS"
            );


            // ==================================
            // AGENT 2 — COMPLIANCE
            // ==================================

            const complianceStart =
                Date.now();


            addTraceEvent(
                workflowTrace,
                "agent_start",
                {
                    agent:
                        "Compliance Analysis Agent",

                    task:
                        "Analyze evidence, confidence and uncertainty"
                }
            );


            const complianceResult =
                await complianceAgent(
                    evidenceResult,
                    control || cleanQuery
                );


            const complianceAnalysis =
                complianceResult?.analysis || {};


            addTraceEvent(
                workflowTrace,
                "decision",
                {
                    agent:
                        "Compliance Analysis Agent",

                    status:
                        complianceAnalysis.status,

                    confidence:
                        complianceAnalysis.confidence,

                    uncertainty:
                        complianceAnalysis.uncertainty,

                    conflictDetected:
                        complianceAnalysis.conflictDetected,

                    needsMoreEvidence:
                        complianceAnalysis.needsMoreEvidence
                }
            );


            addTraceEvent(
                workflowTrace,
                "agent_complete",
                {
                    agent:
                        "Compliance Analysis Agent",

                    latencyMs:
                        Date.now() -
                        complianceStart
                }
            );


            // ==================================
            // STORE COMPLIANCE
            // ==================================

            storeCompliance(
                complianceResult
            );


            addTraceEvent(
                workflowTrace,
                "context_update",
                {
                    action:
                        "Compliance result stored"
                }
            );


            // ==================================
            // FINAL CONTEXT
            // ==================================

            const finalContext =
                getContext();


            // ==================================
            // CREATE FINAL SUMMARY
            // ==================================

            const finalData = {

                status:
                    "success",

                finalStatus:
                    finalContext?.status,

                evidenceCount:
                    totalEvidence,

                complianceStatus:
                    complianceAnalysis.status,

                webStatus:
                    webStatus,

                researchStatus:
                    researchStatus,

                researchProvider:
                    researchEvidence.provider ||
                    (
                        Array.isArray(
                            researchEvidence.results
                        ) &&
                            researchEvidence.results[0]
                            ? researchEvidence.results[0].source
                            : "Unknown"
                    )

            };


            // ==================================
            // END TRACE
            // ==================================

            const completedTrace =
                endTrace(
                    workflowTrace,
                    "success"
                );


            completedTrace.finalData =
                finalData;


            console.log(
                "\n[TRACE] Workflow completed"
            );


            console.log(
                "[TRACE] Trace ID:",
                completedTrace?.id
            );


            console.log(
                "[TRACE] Final Summary:",
                finalData
            );


            // ==================================
            // FINAL RESPONSE
            // ==================================

            res.json({

                success:
                    true,

                query:
                    cleanQuery,

                context: {
                    status:
                        finalContext?.status,

                    query:
                        finalContext?.query,

                    hasEvidence:
                        !!finalContext?.evidence,

                    hasCompliance:
                        !!finalContext?.compliance
                },

                evidenceAgent:
                    evidenceResult,

                complianceAgent:
                    complianceResult,

                trace: {

                    id:
                        completedTrace?.id,

                    name:
                        completedTrace?.name,

                    status:
                        completedTrace?.status,

                    latencyMs:
                        completedTrace?.latency,

                    eventCount:
                        completedTrace?.events?.length || 0,

                    // IMPORTANT:
                    // Frontend can now see all actual events
                    events:
                        completedTrace?.events || [],

                    finalData,

                    observability:
                        [
                            "Agent tracing",
                            "Tool calls",
                            "Decisions",
                            "Latency",
                            "Errors",
                            "Recovery events",
                            "Root cause diagnosis"
                        ]
                }

            });

        } catch (error) {

            console.error(
                "Multi-Agent Error:",
                error.message
            );


            let failedTrace = null;


            if (workflowTrace) {

                addTraceEvent(
                    workflowTrace,
                    "workflow_error",
                    {
                        error:
                            error.message,

                        rootCause:
                            "Unhandled workflow error"
                    }
                );


                failedTrace =
                    endTrace(
                        workflowTrace,
                        "failed",
                        error.message
                    );

            }


            res.status(500).json({

                success:
                    false,

                error:
                    error.message,

                trace:
                    failedTrace
                        ? {
                            id:
                                failedTrace.id,

                            name:
                                failedTrace.name,

                            status:
                                failedTrace.status,

                            latencyMs:
                                failedTrace.latency,

                            events:
                                failedTrace.events || [],

                            error:
                                failedTrace.error
                        }
                        : null

            });

        }

    }
);


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(`

========================================
       ResearchAI Backend
========================================

Server running at:
http://localhost:${PORT}

Tool 1: Hacker News API
Tool 2: Research API

Primary Research Source:
OpenAlex

Fallback Research Source:
Crossref

Multi-Agent System:
Agent 1: Evidence Collection Agent
Agent 2: Compliance Analysis Agent

Observability:
End-to-End Agent Tracing
Tool Calls
Latency
Errors
Root Cause Diagnosis
Recovery Events
Decisions

Controlled Failure Test:
Search query containing "testfailure"

Research API:
POST /api/research

========================================

    `);

});
