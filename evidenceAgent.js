// ==========================================
// AGENT 1 — EVIDENCE COLLECTION AGENT
// ==========================================

export async function evidenceAgent(
    query,
    webSearch,
    researchSearch
) {

    console.log("\n================================");
    console.log("EVIDENCE AGENT STARTED");
    console.log("Query:", query);
    console.log("================================");

    try {

        // ==========================================
        // PARALLEL EVIDENCE COLLECTION
        // ==========================================

        console.log(
            "[EVIDENCE] Running Web Search + Research Search in parallel..."
        );

        const [
            webEvidence,
            researchEvidence
        ] = await Promise.all([
            webSearch(query),
            researchSearch(query)
        ]);


        // ==========================================
        // SAFETY CHECK
        // ==========================================

        const safeWebEvidence =
            webEvidence || {
                tool: "Web Search",
                status: "error",
                count: 0,
                results: [],
                error: "No web evidence returned"
            };


        const safeResearchEvidence =
            researchEvidence || {
                tool: "Research Search",
                status: "error",
                count: 0,
                results: [],
                error: "No research evidence returned"
            };


        // ==========================================
        // COUNT TOTAL EVIDENCE
        // ==========================================

        const webCount =
            Number(safeWebEvidence.count) || 0;

        const researchCount =
            Number(safeResearchEvidence.count) || 0;

        const totalEvidence =
            webCount + researchCount;


        console.log(
            "[EVIDENCE] Web Results:",
            webCount
        );

        console.log(
            "[EVIDENCE] Research Results:",
            researchCount
        );

        console.log(
            "[EVIDENCE] Total Results:",
            totalEvidence
        );


        // ==========================================
        // COMBINE BOTH SOURCES
        // ==========================================

        const evidence = {

            query: query,

            web: safeWebEvidence,

            research: safeResearchEvidence,

            totalEvidence: totalEvidence

        };


        // ==========================================
        // HANDLE ZERO EVIDENCE
        // ==========================================

        if (totalEvidence === 0) {

            console.log(
                "[EVIDENCE] No evidence found"
            );

            return {

                agent:
                    "Evidence Collection Agent",

                status:
                    "empty",

                evidence:
                    evidence,

                error:
                    "No evidence found from available sources"

            };

        }


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "[EVIDENCE] Evidence collected successfully"
        );

        return {

            agent:
                "Evidence Collection Agent",

            status:
                "success",

            evidence:
                evidence

        };


    } catch (error) {

        console.error(
            "[EVIDENCE] Agent Error:",
            error.message
        );


        return {

            agent:
                "Evidence Collection Agent",

            status:
                "error",

            evidence:
                null,

            error:
                error.message

        };

    }

}
