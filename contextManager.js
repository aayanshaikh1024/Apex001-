// ==========================================
// CONTEXT & MEMORY MANAGER
// ==========================================

// Short-term memory for the current investigation
const taskContext = {
    query: null,
    evidence: null,
    compliance: null,
    status: "idle"
};


// ==========================================
// START NEW TASK
// ==========================================

export function startContext(query) {

    taskContext.query = query;

    taskContext.evidence = null;

    taskContext.compliance = null;

    taskContext.status = "started";


    console.log("\n[CONTEXT] New task context created");

    console.log(
        "[CONTEXT] Query:",
        query
    );


    return getContext();
}


// ==========================================
// STORE EVIDENCE
// ==========================================

export function storeEvidence(evidence) {

    taskContext.evidence = evidence;

    taskContext.status = "evidence_collected";


    console.log(
        "[CONTEXT] Evidence stored"
    );


    return getContext();
}


// ==========================================
// STORE COMPLIANCE RESULT
// ==========================================

export function storeCompliance(compliance) {

    taskContext.compliance = compliance;

    taskContext.status = "compliance_analyzed";


    console.log(
        "[CONTEXT] Compliance result stored"
    );


    return getContext();
}


// ==========================================
// READ CURRENT CONTEXT
// ==========================================

export function getContext() {

    return {
        ...taskContext
    };

}


// ==========================================
// CLEAR CONTEXT
// ==========================================

export function clearContext() {

    taskContext.query = null;

    taskContext.evidence = null;

    taskContext.compliance = null;

    taskContext.status = "idle";


    console.log(
        "[CONTEXT] Context cleared"
    );

}
