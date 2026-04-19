const analyzeTarget = async (target) => {

    const analysis = {
        target,
        type: "unknown",
        confidence: 0,
        attack_surface: [],
        risk_level: "low",
        suggested_tools: []
    };

    const isUrl = target.includes(".") || target.startsWith("http");

    const isPrivateIP =
        target.startsWith("192.168") ||
        target.startsWith("10.") ||
        target.startsWith("172.");

    const hasSensitiveKeywords =
        ["admin", "login", "api", "dashboard", "auth"].some(k =>
            target.toLowerCase().includes(k)
        );

const { parseNmap } = require("../../../ai-engine/utils/nmap_parser");

const runNmap = async (target) => {

    const rawOutput = await executeNmap(target); // your existing logic

    return parseNmap(rawOutput);
};

const { parseNuclei } = require("../../../ai-engine/utils/nuclei_parser");

const runNuclei = async (target) => {

    const rawOutput = await executeNuclei(target); // your existing logic

    return parseNuclei(rawOutput);
};

    // -----------------------------
    // TYPE DETECTION
    // -----------------------------
    if (isUrl) {
        analysis.type = "web";
        analysis.attack_surface.push("web_application");
        analysis.suggested_tools.push("nmap", "nuclei");
    }

    if (isPrivateIP) {
        analysis.type = "internal_network";
        analysis.attack_surface.push("internal_network");
        analysis.suggested_tools.push("nmap");
    }

    // -----------------------------
    // RISK SCORING ENGINE
    // -----------------------------
    let riskScore = 0;

    if (hasSensitiveKeywords) riskScore += 2;
    if (isUrl) riskScore += 1;
    if (isPrivateIP) riskScore += 2;

    if (riskScore >= 3) analysis.risk_level = "high";
    else if (riskScore === 2) analysis.risk_level = "medium";
    else analysis.risk_level = "low";

    // -----------------------------
    // CONFIDENCE SCORE
    // -----------------------------
    analysis.confidence = Math.min(95, riskScore * 30);

    return analysis;
};

module.exports = {
    analyzeTarget
};