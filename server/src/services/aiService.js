const { exec, spawn } = require("child_process");

// --------------------
// AI ANALYSIS
// --------------------
const analyzeTarget = async (target) => {
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
        return {
            target,
            type: "web",
            suggested_tools: ["nmap", "nuclei"]
        };
    }
};

// --------------------
// NMAP
// --------------------
const runNmap = (target) => {
    return new Promise((resolve, reject) => {

        // 🔥 remove http/https for nmap
        let cleanTarget = target.replace(/^https?:\/\//, "");

        exec(`nmap -sV ${cleanTarget}`, (error, stdout) => {

            if (error) return reject(error);

            const lines = stdout.split("\n");
            const open_ports = [];

            lines.forEach(line => {
                if (line.includes("/tcp") && line.includes("open")) {

                    const parts = line.trim().split(/\s+/);
                    const port = parts[0].split("/")[0];
                    const service = parts[2] || "unknown";

                    open_ports.push({
                        port: parseInt(port),
                        service
                    });
                }
            });

            resolve({
                open_ports,
                raw: stdout
            });
        });
    });
};

// --------------------
// NUCLEI
// --------------------
const runNuclei = async (target) => {
    return {
        vulnerabilities: [
            {
                severity: "high",
                finding: "SQL Injection",
                template: "mock-sqli"
            },
            {
                severity: "medium",
                finding: "XSS",
                template: "mock-xss"
            }
        ],
        raw: "mocked data"
    };
};
// --------------------
// BRAIN
// --------------------
 const runBrain = async (vulnerabilities) => {
    const res = await fetch("http://127.0.0.1:8000/brain", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ vulnerabilities })
    });

    return await res.json();
};

module.exports = {
    analyzeTarget,
    runNmap,
    runNuclei,
    runBrain
};