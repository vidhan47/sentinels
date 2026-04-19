def decide_tools(target):

    tools = []
    attack_surface = []
    risk = "low"

    target = target.lower()

    # WEB TARGET
    if "." in target or target.startswith("http"):
        attack_surface.append("web")
        tools += ["nmap", "nuclei"]

    # INTERNAL NETWORK
    if "192.168" in target or "10." in target:
        attack_surface.append("internal_network")
        tools.append("nmap")

    # HIGH VALUE TARGET DETECTION
    keywords = ["admin", "login", "dashboard", "api"]
    if any(k in target for k in keywords):
        risk = "medium"

    return {
        "attack_surface": attack_surface,
        "tools": list(set(tools)),
        "risk": risk
    }