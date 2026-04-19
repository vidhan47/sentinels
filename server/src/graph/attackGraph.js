const buildAttackGraph = (target, results) => {

    const graph = {
        nodes: [],
        edges: []
    };

    graph.nodes.push({
        id: target,
        type: "target"
    });

    const nmap = results.nmap?.open_ports || [];
    const nuclei = results.nuclei?.vulnerabilities || [];

    if (nmap.length > 0) {
        graph.nodes.push({ id: "services", type: "exposure" });
        graph.edges.push({ from: target, to: "services" });

        nmap.forEach(p => {
            graph.nodes.push({
                id: `port-${p.port}`,
                type: "service",
                label: `${p.port}/${p.service}`
            });

            graph.edges.push({
                from: "services",
                to: `port-${p.port}`
            });
        });
    }

    if (nuclei.length > 0) {
        graph.nodes.push({ id: "vulns", type: "risk" });
        graph.edges.push({ from: target, to: "vulns" });

        nuclei.forEach((v, i) => {
            graph.nodes.push({
                id: `vuln-${i}`,
                type: "vulnerability",
                label: v.finding || v.raw,
                severity: v.severity
            });

            graph.edges.push({
                from: "vulns",
                to: `vuln-${i}`
            });
        });
    }

    return graph;
};

module.exports = { buildAttackGraph };