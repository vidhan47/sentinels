const {
    analyzeTarget,
    runNmap,
    runNuclei,
    runBrain
} = require("../services/aiService");

const { createScan, updateScan, getScan } = require("../utils/scanStore");
const { crawlTarget } = require("../services/crawler");
const { buildAttackGraph } = require("../graph/attackGraph");
const executeAttacks = require("../services/attackService");

// ----------------------
// FULL SCAN (ASYNC)
// ----------------------
const fullScan = async (req, res) => {
    const { target } = req.body;
    const scanId = Date.now().toString();

    createScan(scanId);

    if (!target || typeof target !== "string") {
        return res.status(400).json({
            success: false,
            error: "Valid target is required"
        });
    }

    console.log("🚀 Starting full scan for:", target);

    // ✅ RETURN IMMEDIATELY (non-blocking)
    res.json({
        success: true,
        scanId
    });

    // 🔥 BACKGROUND EXECUTION STARTS HERE
    (async () => {
        try {
            const startTime = Date.now();

            updateScan(scanId, { stage: "analysis", progress: 10 });

            const analysis = await analyzeTarget(target);

            updateScan(scanId, { stage: "tools", progress: 25 });

            let results = {
                nmap: null,
                nuclei: { vulnerabilities: [] }
            };

            for (let tool of analysis.suggested_tools || []) {
                if (tool === "nmap") {
                    results.nmap = await runNmap(target);
                }
                if (tool === "nuclei") {
                    results.nuclei = await runNuclei(target);
                }
            }

            updateScan(scanId, { stage: "crawling", progress: 40 });

            const discoveredLinks = await crawlTarget(target);

            updateScan(scanId, { stage: "brain", progress: 55 });

            const brain = await runBrain(results.nuclei.vulnerabilities);

            updateScan(scanId, { stage: "attacks", progress: 75 });

            const attackResults = await executeAttacks(
                brain.actions,
                target,
                discoveredLinks
            );

            updateScan(scanId, { stage: "report", progress: 90 });

            // ✅ FINAL REPORT BUILD
            let riskScore = 0;

            if (Array.isArray(attackResults)) {
                for (let r of attackResults) {
                    if (r.vulnerable) {
                        if (r.type === "sqli") riskScore += 50;
                        else if (r.type === "xss") riskScore += 30;
                        else riskScore += 10;
                    }
                }
            }

            if (riskScore > 100) riskScore = 100;

            let riskLevel = "LOW";
            if (riskScore >= 70) riskLevel = "HIGH";
            else if (riskScore >= 40) riskLevel = "MEDIUM";

            const formattedResults = {
                target,
                risk_score: riskScore,
                risk_level: riskLevel,
                summary: {
                    total: Array.isArray(attackResults) ? attackResults.length : 0,
                    vulnerabilities: Array.isArray(attackResults)
                        ? attackResults.filter(r => r.vulnerable).length
                        : 0
                },
                findings: Array.isArray(attackResults)
                    ? attackResults.map(r => ({
                        type: r.type,
                        status: r.vulnerable ? "VULNERABLE" : "SAFE",
                        severity: r.type === "sqli" ? "HIGH" : "LOW",
                        technique: r.technique || null,
                        parameter: r.param || null,
                        payload: r.payload || null
                    }))
                    : []
            };

            updateScan(scanId, {
                stage: "completed",
                progress: 100,
                result: formattedResults
            });

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`⏱ Scan completed in ${duration}s`);

        } catch (err) {
            console.error("🔥 BACKGROUND ERROR:", err);

            updateScan(scanId, {
                stage: "error",
                progress: 100,
                error: err.message
            });
        }
    })();
};

// ----------------------
// GET SCAN STATUS
// ----------------------
const getScanStatus = (req, res) => {
    const { id } = req.params;

    const scan = getScan(id);

    if (!scan) {
        return res.status(404).json({
            success: false,
            error: "Scan not found"
        });
    }

    return res.json({
        success: true,
        scan
    });
};

module.exports = { fullScan, getScanStatus };