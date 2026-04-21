# 🛡️ Sentinel AI – Automated AI-Powered Pentesting Platform

Sentinel AI is an intelligent penetration testing platform that automates target analysis, vulnerability scanning, and risk assessment using AI-driven decision making.

---

## 🚀 Features

* 🧠 **AI-Powered Target Analysis**

  * Automatically identifies target type (web, network, etc.)
  * Suggests appropriate security tools (e.g., Nmap, Nuclei)

* ⚙️ **Automated Scanning Pipeline**

  * Runs scans asynchronously
  * Supports modular tool integration

* 📊 **Risk Assessment Engine**

  * Generates risk score and severity level
  * Provides structured scan summaries

* 🔄 **Real-Time Scan Tracking**

  * Track scan progress using `scanId`
  * Fetch results via API

* 🌐 **Full Stack Architecture**

  * Backend: Node.js + Express
  * Frontend: React (Vite)

---

## 📁 Project Structure

```
sentinels/
│
├── client/sentinel/     # React frontend (Vite)
├── server/              # Express backend
├── engine/              # AI + scanning logic
├── package.json         # Root scripts
└── README.md
```

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/vidhan47/sentinels.git
cd sentinels
```

---

### 2. Install all dependencies

```bash
npm run install-all
```

---

## ▶️ Running the Project

```bash
npm run start-all
```

### 🌐 Access:

* Frontend → http://localhost:5173
* Backend → http://localhost:5000

---

## 🔌 API Endpoints

### 🔹 Start Full Scan

```
POST /api/full-scan
```

#### Body:

```json
{
  "target": "example.com"
}
```

#### Response:

```json
{
  "success": true,
  "scanId": "123456789"
}
```

---

### 🔹 Get Scan Status

```
GET /api/scan-status/:id
```

#### Response:

```json
{
  "success": true,
  "scan": {
    "stage": "completed",
    "progress": 100,
    "result": {
      "target": "example.com",
      "risk_score": 0,
      "risk_level": "LOW",
      "summary": {
        "total": 2,
        "vulnerabilities": 0
      },
      "findings": []
    }
  }
}
```

---

## ⚙️ Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Frontend  | React + Vite                      |
| Backend   | Node.js + Express                 |
| AI Engine | Custom Logic                      |
| Tools     | Nmap, Nuclei (planned/integrated) |

---

## 📌 Future Improvements

* 🔍 Real vulnerability scanning with Nmap & Nuclei
* 📈 Live progress UI (real-time updates)
* 📊 Advanced reporting dashboard
* 🔐 Authentication & user sessions
* ☁️ Deployment (Docker / Cloud)

---

## ⚠️ Notes

* External tools like **Nmap** and **Nuclei** must be installed separately if enabled
* Environment variables (if added later) should be stored in `.env`

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Vidhan**
GitHub: https://github.com/vidhan47

---

## ⭐ Support

If you found this project useful, consider giving it a star ⭐
