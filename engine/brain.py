def decide_attacks(vulnerabilities):
    actions = []

    for vuln in vulnerabilities:
        name = vuln.get("finding", "").lower()

        if "sql" in name:
            actions.append({
                "type": "sqli",
                "action": "run_sql_injection"
            })

        elif "xss" in name:
            actions.append({
                "type": "xss",
                "action": "run_xss_test"
            })

    return actions