const {
    analyzeTarget,
    runNmap,
    runNuclei
} = require("../services/aiService");

const { buildAttackGraph } = require("../graph/attackGraph");


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

        // -----------------------------
        // STEP 1: AI ANALYSIS
        // -----------------------------
        const analysis = await analyzeTarget(target);

        let results = {};

        // -----------------------------
        // STEP 2: TOOL EXECUTION
        // -----------------------------
        for (let tool of analysis.suggested_tools || []) {

            if (tool === "nmap") {
                results.nmap = await runNmap(target);
            }

            if (tool === "nuclei") {
                results.nuclei = await runNuclei(target);
            }
        }

        // -----------------------------
        // STEP 3: ATTACK GRAPH (UPGRADED)
        // -----------------------------
        const attack_graph = buildAttackGraph(target, results);

        // -----------------------------
        // FINAL RESPONSE
        // -----------------------------
        return res.json({
            success: true,
            target,
            analysis,
            results,
            attack_graph
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = { fullScan };


