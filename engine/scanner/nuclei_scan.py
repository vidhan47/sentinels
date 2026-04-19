import subprocess

def run_nuclei(target):
    result = subprocess.run(
        ["nuclei", "-u", target, "-silent"],
        capture_output=True,
        text=True
    )

    vulnerabilities = [
        line for line in result.stdout.split("\n") if line.strip()
    ]

    return {
        "tool": "nuclei",
        "vulnerabilities": vulnerabilities
    }