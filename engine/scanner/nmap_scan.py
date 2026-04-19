import subprocess

def run_nmap(target):
    result = subprocess.run(
        ["nmap", "-sV", target],
        capture_output=True,
        text=True
    )

    return {
        "tool": "nmap",
        "output": result.stdout
    }