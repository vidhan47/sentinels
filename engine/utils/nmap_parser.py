import re

def parse_nmap(raw_output):

    result = {
        "open_ports": []
    }

    for line in raw_output.split("\n"):

        match = re.search(r"(\d+)/tcp\s+open\s+(\w+)\s*(.*)", line)

        if match:
            result["open_ports"].append({
                "port": int(match.group(1)),
                "service": match.group(2),
                "version": match.group(3).strip() or "unknown"
            })

    return result