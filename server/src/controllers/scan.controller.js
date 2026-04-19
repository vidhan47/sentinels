const {
    analyzeTarget,
    runNmap,
    runNuclei,
    runBrain
} = require("../services/aiService");

const { crawlTarget } = require("../services/crawler");
const { buildAttackGraph } = require("../graph/attackGraph");
const executeAttacks  = require("../services/attackService");

const fullScan = async (req, res) => {

    const { target } = req.body;

    // -----------------------------
    // INPUT VALIDATION
    // -----------------------------
    if (!target || typeof target !== "string") {
        return res.status(400).json({
            success: false,
            error: "Valid target is required"
        });
    }

    try {

        console.log("🚀 Starting full scan for:", target);

        // -----------------------------
        // STEP 1: AI ANALYSIS
        // -----------------------------
        const analysis = await analyzeTarget(target);
        console.log("✅ Analysis done:", analysis);

        let results = {
            nmap: null,
            nuclei: { vulnerabilities: [] }
        };

        // -----------------------------
        // STEP 2: TOOL EXECUTION
        // -----------------------------
        for (let tool of analysis.suggested_tools || []) {

            if (tool === "nmap") {
                console.log("⚡ Running Nmap...");
                results.nmap = await runNmap(target);
            }

            if (tool === "nuclei") {
                console.log("⚡ Running Nuclei...");
                results.nuclei = await runNuclei(target);
            }
        }

        // SAFETY: avoid crash if nuclei didn't run
        const vulnerabilities = results.nuclei?.vulnerabilities || [];

        //crawler
        console.log("🕷 Crawling target...");
        const discoveredLinks = await crawlTarget(target);
        console.log("🔗 Links found:", discoveredLinks);

        // -----------------------------
        // STEP 3: BRAIN
        // -----------------------------
        console.log("🧠 Running brain...");
        const brain = await runBrain(vulnerabilities);

        console.log("RAW brain:", JSON.stringify(brain, null, 2)); // ← ADD THIS LINE

        console.log("🧠 Brain output:", brain);
        
        // -----------------------------
        // STEP 4: EXECUTE ATTACKS (FIXED)
        // -----------------------------
        let attackResults = null;
        let formattedResults = null;

        console.log("⚔️ Before executeAttacks");

        if (brain?.actions && Array.isArray(brain.actions) && brain.actions.length > 0) {
            try {
                attackResults = await executeAttacks(brain.actions, target, discoveredLinks);
                console.log("⚔️ After executeAttacks:", attackResults);
                // ✅ FORMAT RESULTS (ADD THIS)
                formattedResults = {
                    target,
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
                            technique: r.technique || null,
                            parameter: r.param || null,
                            payload: r.payload || null
                        }))
                     : []
                };

                console.log("📊 Final Report:", formattedResults);              
            } catch (attackErr) {
                console.error("❌ executeAttacks error:", attackErr);
                attackResults = { error: attackErr.message };
            }
        } else {
            console.log("⚠️ No actions from brain");
            attackResults = { message: "No actions to execute" };
        }

        // ✅ SAFETY FALLBACK (ADD THIS)
        if (!formattedResults) {
            formattedResults = {
                target,
                summary: {
                    total: 0,
                    vulnerabilities: 0
                },
                findings: []
            };
        }

        // -----------------------------
        // STEP 5: ATTACK GRAPH
        // -----------------------------
        const attack_graph = buildAttackGraph(target, results);

        // -----------------------------
        // FINAL RESPONSE
        // -----------------------------
        console.log("📦 Sending response");

        return res.json({
            success: true,
            target,
            analysis,
            results,
            attack_graph,
            brain,
            report: formattedResults   // ✅ NEW CLEAN OUTPUT
        });

    } catch (err) {
        console.error("🔥 FULL SCAN ERROR:", err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = { fullScan };