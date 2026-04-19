from fastapi import FastAPI
from pydantic import BaseModel
from brain import decide_attacks
import subprocess

app = FastAPI(title="Sentinels AI Engine", version="1.0")


# -----------------------------
# REQUEST MODEL
# -----------------------------
class Target(BaseModel):
    target: str


@app.post("/brain")
def brain(data: dict):
    vulns = data.get("vulnerabilities", [])
    return {
        "actions": decide_attacks(vulns)
    }

# -----------------------------
# AI ANALYSIS LAYER
# -----------------------------
@app.post("/analyze")
def analyze(data: Target):

    target = data.target.lower()

    result = {
        "target": data.target,
        "attack_surface": [],
        "suggested_tools": [],
        "risk_level": "low"
    }

    # WEB TARGET DETECTION
    if "." in target or target.startswith("http"):
        result["attack_surface"].append("web_application")
        result["suggested_tools"].append("nmap")
        result["suggested_tools"].append("nuclei")

    # LOCAL NETWORK DETECTION
    if "192.168" in target or "10." in target:
        result["attack_surface"].append("internal_network")
        result["suggested_tools"].append("nmap")

    # RISK SCORING (simple logic)
    if "admin" in target or "login" in target:
        result["risk_level"] = "medium"

    return result

# -----------------------------
# NMAP SCANNER
# -----------------------------
@app.post("/scan/nmap")
def run_nmap(data: Target):
    try:
        cmd = ["nmap", "-sV", "-T4", data.target]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )

        return {
            "tool": "nmap",
            "target": data.target,
            "output": result.stdout if result.stdout else result.stderr
        }

    except Exception as e:
        return {
            "tool": "nmap",
            "error": str(e)
        }


# -----------------------------
# NUCLEI SCANNER
# -----------------------------
@app.post("/scan/nuclei")
def run_nuclei(data: Target):
    try:
        cmd = ["nuclei", "-u", data.target, "-json", "-severity", "low,medium,high,critical", "-timeout", "10"]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )

        # output = result.stdout.split("\n") if result.stdout else []
        import json

        output = []
        if result.stdout:
          for line in result.stdout.splitlines():
             try:
                output.append(json.loads(line))
             except:
                pass

        return {
            "tool": "nuclei",
            "target": data.target,
            "vulnerabilities": output
        }

    except Exception as e:
        return {
            "tool": "nuclei",
            "error": str(e)
        }
    
@app.post("/analyze")
def analyze(data: Target):

    target = data.target.lower()

    result = {
        "target": data.target,
        "attack_surface": [],
        "suggested_tools": [],
        "risk_level": "low"
    }

    # WEB TARGET DETECTION
    if "." in target or target.startswith("http"):
        result["attack_surface"].append("web_application")
        result["suggested_tools"].append("nmap")
        result["suggested_tools"].append("nuclei")

        
    # LOCAL NETWORK DETECTION
    if "192.168" in target or "10." in target:
        result["attack_surface"].append("internal_network")
        result["suggested_tools"].append("nmap")

    # RISK SCORING (simple logic)
    if "admin" in target or "login" in target:
        result["risk_level"] = "medium"

    return result