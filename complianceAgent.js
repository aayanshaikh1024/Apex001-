// ==========================================
// AGENT 2 — COMPLIANCE ANALYSIS AGENT
// ==========================================

export async function complianceAgent(evidencePackage, control) {

    console.log("\n================================");
    console.log("COMPLIANCE AGENT STARTED");
    console.log("Control:", control);
    console.log("================================");

    try {

        const webResults =
            evidencePackage?.evidence?.web?.results || [];

        const researchResults =
            evidencePackage?.evidence?.research?.results || [];

        const totalEvidence =
            webResults.length + researchResults.length;

        let status;
        let reason;

        // Analyze the evidence collected by Agent 1
        if (totalEvidence === 0) {

            status = "Not Supported";

            reason =
                "No relevant evidence was found for the selected control.";

        } else if (totalEvidence < 3) {

            status = "Insufficient Evidence";

            reason =
                "Some evidence was found, but additional evidence is required to confidently support the control.";

        } else {

            status = "Supported";

            reason =
                "Sufficient evidence was collected from the available sources to support the control.";

        }

        const analysis = {

            control: control,

            status: status,

            evidenceCount: totalEvidence,

            reason: reason,

            sources: {
                web: webResults.length,
                research: researchResults.length
            }

        };

        console.log(
            "Compliance Result:",
            status
        );

        return {

            agent: "Compliance Analysis Agent",

            status: "success",

            analysis: analysis

        };

    } catch (error) {

        console.error(
            "Compliance Agent Error:",
            error.message
        );

        return {

            agent: "Compliance Analysis Agent",

            status: "error",

            analysis: null,

            error: error.message

        };
    }
}