// ==========================================
// AGENT 1 — EVIDENCE COLLECTION AGENT
// ==========================================

export async function evidenceAgent(query, webSearch, researchSearch) {

    console.log("\n================================");
    console.log("EVIDENCE AGENT STARTED");
    console.log("Query:", query);
    console.log("================================");

    try {

        // Collect evidence from both available sources
        const webEvidence = await webSearch(query);
        const researchEvidence = await researchSearch(query);

        // Combine both sources
        const evidence = {
            query: query,

            web: webEvidence,

            research: researchEvidence
        };

        console.log(
            "Evidence collected successfully"
        );

        return {
            agent: "Evidence Collection Agent",
            status: "success",
            evidence: evidence
        };

    } catch (error) {

        console.error(
            "Evidence Agent Error:",
            error.message
        );

        return {
            agent: "Evidence Collection Agent",
            status: "error",
            evidence: null,
            error: error.message
        };
    }
}