import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;


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

    const words = query
        .toLowerCase()
        .split(" ")
        .filter(word => !stopWords.includes(word));

    return words.join(" ") || query;
}


// ==========================================
// TOOL 1 — HACKER NEWS API
// ==========================================

async function webSearch(query) {

    try {

        const searchQuery = cleanSearchQuery(query);

        console.log("Web Search Query:", searchQuery);

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


        // FALLBACK SEARCH
        if (hits.length === 0) {

            const firstWord = searchQuery.split(" ")[0];

            const fallbackResponse = await fetch(
                `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(firstWord)}&tags=story&hitsPerPage=5`
            );

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

            source: "Hacker News"

        }));


        console.log(
            "Hacker News Results:",
            results.length
        );


        return {

            tool: "Web Search",

            status: "success",

            count: results.length,

            results: results,

            message:
                `Found ${results.length} web/news results`

        };

    } catch (error) {

        console.error(
            "Web Search Error:",
            error.message
        );

        return {

            tool: "Web Search",

            status: "error",

            count: 0,

            results: [],

            error: error.message

        };

    }

}


// ==========================================
// TOOL 2A — OPENALEX RESEARCH API
// ==========================================

async function searchOpenAlex(searchQuery) {

    const response = await fetch(
        `https://api.openalex.org/works?search=${encodeURIComponent(searchQuery)}&per-page=5`
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
                ? `https://doi.org/${item.doi.replace("https://doi.org/", "")}`
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
// TOOL 2B — CROSSREF FALLBACK API
// ==========================================

async function searchCrossref(searchQuery) {

    console.log(
        "Using Crossref Research Fallback..."
    );

    const response = await fetch(
        `https://api.crossref.org/works?query=${encodeURIComponent(searchQuery)}&rows=5`
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
                (item.DOI
                    ? `https://doi.org/${item.DOI}`
                    : ""),

            publicationDate:
                publicationDate,

            citedBy:
                item["is-referenced-by-count"] ?? 0,

            source:
                "Crossref"

        };

    });

}


// ==========================================
// TOOL 2 — RESEARCH SEARCH
// OPENALEX + CROSSREF FALLBACK
// ==========================================

async function researchSearch(query) {

    const searchQuery =
        cleanSearchQuery(query);

    console.log(
        "Research Search Query:",
        searchQuery
    );


    // --------------------------------------
    // TRY OPENALEX FIRST
    // --------------------------------------

    try {

        console.log(
            "Trying OpenAlex API..."
        );

        let results =
            await searchOpenAlex(searchQuery);


        // If no results, try first word

        if (results.length === 0) {

            const firstWord =
                searchQuery.split(" ")[0];

            console.log(
                "OpenAlex fallback query:",
                firstWord
            );

            results =
                await searchOpenAlex(firstWord);

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

            results:
                results,

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


        // --------------------------------------
        // FALLBACK TO CROSSREF
        // --------------------------------------

        try {

            let results =
                await searchCrossref(searchQuery);


            // If no results, try first word

            if (results.length === 0) {

                const firstWord =
                    searchQuery.split(" ")[0];

                console.log(
                    "Crossref fallback query:",
                    firstWord
                );

                results =
                    await searchCrossref(firstWord);

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

                results:
                    results,

                message:
                    `Found ${results.length} research results using Crossref fallback`

            };

        } catch (crossrefError) {

            console.error(
                "Research Search Error:",
                crossrefError.message
            );


            return {

                tool:
                    "Research Search",

                status:
                    "error",

                count:
                    0,

                results:
                    [],

                error:
                    `Research APIs failed: ${crossrefError.message}`

            };

        }

    }

}


// ==========================================
// AGENT DECISION ENGINE
// ==========================================

function chooseTools(query) {

    const text = query.toLowerCase();


    if (
        text.includes("patent") ||
        text.includes("paper") ||
        text.includes("scientific") ||
        text.includes("research") ||
        text.includes("study")
    ) {

        return [
            "Research Search",
            "Web Search"
        ];

    }


    if (
        text.includes("competitor") ||
        text.includes("company") ||
        text.includes("tesla") ||
        text.includes("activity") ||
        text.includes("news") ||
        text.includes("latest")
    ) {

        return [
            "Web Search",
            "Research Search"
        ];

    }


    return [
        "Web Search",
        "Research Search"
    ];

}


// ==========================================
// AGENT API
// ==========================================

app.post("/api/research", async (req, res) => {

    try {

        const { query } = req.body;


        if (!query) {

            return res.status(400).json({

                error:
                    "Query is required"

            });

        }


        console.log(
            "\n=============================="
        );

        console.log(
            "NEW AGENT QUERY:",
            query
        );

        console.log(
            "=============================="
        );


        const selectedTools =
            chooseTools(query);

        const results = [];


        // --------------------------------------
        // AGENT EXECUTES SELECTED TOOLS
        // --------------------------------------

        for (const tool of selectedTools) {

            if (tool === "Web Search") {

                results.push(
                    await webSearch(query)
                );

            }


            if (tool === "Research Search") {

                results.push(
                    await researchSearch(query)
                );

            }

        }


        // --------------------------------------
        // RETURN AGENT OBSERVATIONS
        // --------------------------------------

        res.json({

            success:
                true,

            query:
                query,

            selectedTools:
                selectedTools,

            results:
                results

        });

    } catch (error) {

        console.error(
            "Agent Error:",
            error
        );


        res.status(500).json({

            error:
                "Agent failed to process the request"

        });

    }

});


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
Primary: OpenAlex
Fallback: Crossref

Research API:
POST /api/research

========================================

    `);

});