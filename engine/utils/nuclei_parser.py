def parse_nuclei(raw_output):

    vulnerabilities = []

    for line in raw_output.split("\n"):

        line = line.strip()
        if not line:
            continue

        severity = "low"

        if "high" in line.lower():
            severity = "high"
        elif "medium" in line.lower():
            severity = "medium"

        vulnerabilities.append({
            "finding": line,
            "severity": severity
        })

    return {
        "vulnerabilities": vulnerabilities
    }