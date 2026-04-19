const analyzeTarget = async (target) => {

    // CALL PYTHON AI (if running)
    try {
        const res = await fetch("http://127.0.0.1:8000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ target })
        });

        return await res.json();

    } catch (err) {
        // fallback if AI not running
        return {
            target,
            type: "web",
            suggested_tools: ["nmap", "nuclei"]
        };
    }
};


// 🔥 DUMMY NMAP (NO PYTHON IMPORT)
const runNmap = async (target) => {
    return {
        open_ports: [
            { port: 80, service: "http" },
            { port: 443, service: "https" }
        ]
    };
};


// 🔥 DUMMY NUCLEI
const runNuclei = async (target) => {
    return {
        vulnerabilities: [
            {
                severity: "medium",
                finding: "Sample vulnerability"
            }
        ]
    };
};


module.exports = {
    analyzeTarget,
    runNmap,
    runNuclei
};