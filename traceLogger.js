const traces = [];

export function startTrace(name, data = {}) {

    const trace = {

        id: Date.now(),

        name,

        startTime: Date.now(),

        endTime: null,

        latency: null,

        status: "running",

        data,

        events: [],

        error: null

    };

    traces.push(trace);

    console.log(
        `[TRACE START] ${name}`
    );

    return trace;

}


export function addTraceEvent(
    trace,
    event,
    data = {}
) {

    if (!trace) return;

    const traceEvent = {

        event,

        timestamp: Date.now(),

        data

    };

    trace.events.push(traceEvent);

    console.log(
        `[TRACE] ${event}`,
        data
    );

}


export function endTrace(
    trace,
    status = "success",
    error = null
) {

    if (!trace) return;

    trace.endTime = Date.now();

    trace.latency =
        trace.endTime -
        trace.startTime;


    // Handle object status correctly

    if (
        typeof status === "object" &&
        status !== null
    ) {

        trace.status =
            status.status || "success";

        trace.finalData =
            status;

    } else {

        trace.status =
            status;

    }


    trace.error =
        error;


    console.log(
        `[TRACE END] ${trace.name}`
    );

    console.log(
        `[TRACE STATUS] ${trace.status}`
    );

    console.log(
        `[TRACE LATENCY] ${trace.latency}ms`
    );


    // Print useful final trace details

    if (trace.finalData) {

        console.log(
            "[TRACE SUMMARY]",
            trace.finalData
        );

    }


    return trace;

}


export function getTraces() {

    return traces;

}