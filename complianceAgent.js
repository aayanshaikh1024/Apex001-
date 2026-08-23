// ==========================================
// AGENT 2 — COMPLIANCE ANALYSIS AGENT
// UNCERTAINTY + CONFLICT RESOLUTION
// ==========================================

export async function complianceAgent(
    evidencePackage,
    control
) {

    console.log("\n================================");
    console.log("COMPLIANCE AGENT STARTED");
    console.log("Control:", control);
    console.log("================================");

    try {

        // ======================================
        // READ SHARED EVIDENCE STATE
        // ======================================

        const webResults =
            evidencePackage?.evidence?.web?.results || [];

        const researchResults =
            evidencePackage?.evidence?.research?.results || [];

        const totalEvidence =
            webResults.length +
            researchResults.length;


        console.log(
            "[COMPLIANCE] Web evidence:",
            webResults.length
        );

        console.log(
            "[COMPLIANCE] Research evidence:",
            researchResults.length
        );

        console.log(
            "[COMPLIANCE] Total evidence:",
            totalEvidence
        );


        // ======================================
        // SOURCE DIVERSITY / CONFLICT ANALYSIS
        // ======================================

        let conflictDetected = false;

        if (
            webResults.length === 0 &&
            researchResults.length > 0
        ) {

            conflictDetected = true;

            console.log(
                "[COMPLIANCE] Limited source agreement: only research evidence available"
            );

        }

        if (
            researchResults.length === 0 &&
            webResults.length > 0
        ) {

            conflictDetected = true;

            console.log(
                "[COMPLIANCE] Limited source agreement: only web evidence available"
            );

        }


        // ======================================
        // UNCERTAINTY CALCULATION
        // ======================================

        let confidence = 0;
        let uncertainty = "High";

        if (
            totalEvidence >= 8 &&
            webResults.length > 0 &&
            researchResults.length > 0
        ) {

            confidence = 90;
            uncertainty = "Low";

        } else if (totalEvidence >= 5) {

            confidence = 75;
            uncertainty = "Medium";

        } else if (totalEvidence >= 3) {

            confidence = 60;
            uncertainty = "Medium";

        } else if (totalEvidence > 0) {

            confidence = 35;
            uncertainty = "High";

        } else {

            confidence = 0;
            uncertainty = "High";

        }


        // Reduce confidence when evidence comes
        // from only one source type

        if (conflictDetected) {

            confidence = Math.max(
                0,
                confidence - 15
            );

        }


        // ======================================
        // COMPLIANCE DECISION
        // ======================================

        let decisionStatus;
        let reason;

        if (totalEvidence === 0) {

            decisionStatus =
                "Not Supported";

            reason =
                "No relevant evidence was found. The system cannot support the control and requires additional investigation.";

        } else if (totalEvidence < 3) {

            decisionStatus =
                "Insufficient Evidence";

            reason =
                "A small amount of evidence was found, but the evidence is insufficient for a confident decision.";

        } else if (conflictDetected) {

            decisionStatus =
                "Partially Supported";

            reason =
                "Evidence was found, but source coverage is limited to one source type. Additional independent verification is recommended.";

        } else {

            decisionStatus =
                "Supported";

            reason =
                "Sufficient evidence was independently collected from both web and research sources.";

        }


        // ======================================
        // SELF-EVALUATION
        // ======================================

        let needsMoreEvidence =
            false;

        if (
            decisionStatus !== "Supported" ||
            confidence < 70
        ) {

            needsMoreEvidence = true;

        }


        console.log(
            "[COMPLIANCE] Decision:",
            decisionStatus
        );

        console.log(
            "[COMPLIANCE] Confidence:",
            `${confidence}%`
        );

        console.log(
            "[COMPLIANCE] Uncertainty:",
            uncertainty
        );

        console.log(
            "[COMPLIANCE] Conflict detected:",
            conflictDetected
        );

        console.log(
            "[COMPLIANCE] Self-evaluation — more evidence needed:",
            needsMoreEvidence
        );


        // ======================================
        // FINAL ANALYSIS
        // ======================================

        const analysis = {

            control: control,

            status: decisionStatus,

            evidenceCount: totalEvidence,

            confidence: confidence,

            uncertainty: uncertainty,

            conflictDetected: conflictDetected,

            needsMoreEvidence:
                needsMoreEvidence,

            reason: reason,

            sources: {

                web:
                    webResults.length,

                research:
                    researchResults.length

            }

        };


        return {

            agent:
                "Compliance Analysis Agent",

            status:
                "success",

            analysis:
                analysis

        };

    } catch (error) {

        console.error(
            "Compliance Agent Error:",
            error.message
        );

        return {

            agent:
                "Compliance Analysis Agent",

            status:
                "error",

            analysis:
                null,

            error:
                error.message

        };

    }

}
