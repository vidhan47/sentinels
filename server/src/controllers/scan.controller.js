const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const {
    analyzeTarget,
    runNmap,
    runNuclei,
    runBrain
} = require("../services/aiService");

const { createScan, updateScan, getScan } = require("../utils/scanStore");
const { crawlTarget } = require("../services/crawler");
const executeAttacks = require("../services/attackService");

// ----------------------
// FULL SCAN (ASYNC)
// ----------------------
const fullScan = async (req, res) => {
    const { target } = req.body;
    let cleanTarget = target;

    // Fix double protocol issue
    if (!cleanTarget.startsWith("http")) {
    cleanTarget = "http://" + cleanTarget;
    }

    if (!target || typeof target !== "string") {
        return res.status(400).json({
            success: false,
            error: "Valid target is required"
        });
    }

    const scanId = Date.now().toString();
    createScan(scanId);

    console.log("🚀 Starting full scan for:", target);

    // ✅ RETURN IMMEDIATELY
    res.json({
        success: true,
        scanId
    });

    // 🔥 BACKGROUND EXECUTION
    (async () => {
        try {
            const startTime = Date.now();

            // ---------------- ANALYSIS ----------------
            updateScan(scanId, { stage: "analysis", progress: 10 });

            const analysis = await analyzeTarget(target) || {};
            console.log("🧠 ANALYSIS:", analysis);

            // ---------------- TOOLS ----------------
            updateScan(scanId, { stage: "tools", progress: 25 });
            await sleep(1000);

            let results = {
                nmap: null,
                nuclei: { vulnerabilities: [] }
            };

            const tools = analysis?.suggested_tools || [];

            for (let tool of tools) {
                try {
                    if (tool === "nmap") {
                        results.nmap = await runNmap(cleanTarget);
                    }
                    if (tool === "nuclei") {
                        results.nuclei = await runNuclei(target) || { vulnerabilities: [] };
                    }
                } catch (toolErr) {
                    console.error(`⚠️ Tool failed: ${tool}`, toolErr.message);
                }
            }

            // ---------------- CRAWLING ----------------
            updateScan(scanId, { stage: "crawling", progress: 40 });
            await sleep(1000);

            let discoveredLinks = [];
            try {
                discoveredLinks = await crawlTarget(target) || [];
            } catch (err) {
                console.error("⚠️ Crawl failed:", err.message);
            }

            // ---------------- BRAIN ----------------
            updateScan(scanId, { stage: "brain", progress: 55 });
            await sleep(1500);

            let brain = {};
            try {
                brain = await runBrain(results.nuclei.vulnerabilities) || {};
            } catch (err) {
                console.error("⚠️ Brain failed:", err.message);
            }

            console.log("🧠 BRAIN ACTIONS:", brain);

            // 🚨 FALLBACK ATTACKS
            if (!brain.actions || brain.actions.length === 0) {
                console.log("⚠️ No AI actions — injecting default attacks");

                brain.actions = [
                    { type: "sqli", technique: "basic" },
                    { type: "xss", technique: "reflected" }
                ];
            }

            // ---------------- ATTACKS ----------------
            updateScan(scanId, { stage: "attacks", progress: 75 });
            await sleep(1500);

            let attackResults = [];
            try {
                attackResults =
                    (await executeAttacks(
                        brain.actions,
                        target,
                        discoveredLinks
                    )) || [];
            } catch (err) {
                console.error("⚠️ Attack execution failed:", err.message);
            }

            console.log("💣 ATTACK RESULTS:", attackResults);

            // ---------------- REPORT ----------------
            updateScan(scanId, { stage: "report", progress: 90 });
            await sleep(1000);

            let riskScore = 0;

            for (let r of attackResults) {
                if (r?.vulnerable) {
                    if (r.type === "sqli") riskScore += 50;
                    else if (r.type === "xss") riskScore += 30;
                    else riskScore += 10;
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
                    total: attackResults.length,
                    vulnerabilities: attackResults.filter(r => r?.vulnerable).length
                },
                findings: attackResults
                    .filter(r => r?.vulnerable)
                    .map(r => {
                        let explanation = null;
                        let recommendation = null;

                        if (r.type === "sqli") {
                            explanation = "SQL Injection allows attackers to manipulate database queries.";
                            recommendation = "Use prepared statements and parameterized queries.";
                        } else if (r.type === "xss") {
                            explanation = "XSS allows injection of malicious scripts into web pages.";
                            recommendation = "Sanitize inputs and implement CSP.";
                        }

                        return {
                            type: r.type,
                            status: "VULNERABLE",
                            severity:
                                r.type === "sqli"
                                    ? "HIGH"
                                    : r.type === "xss"
                                    ? "MEDIUM"
                                    : "LOW",
                            technique: r.technique || null,
                            parameter: r.param || null,
                            payload: r.payload || null,
                            explanation,
                            recommendation
                        };
                    })
            };

            console.log("📊 Final Report:", formattedResults);

            // ---------------- COMPLETE ----------------
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

    res.json({
        success: true,
        scan
    });
};

module.exports = { fullScan, getScanStatus };