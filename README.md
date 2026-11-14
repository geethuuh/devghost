# 👻 DevGhost

> **Autonomous Shell Interceptor & Self-Healing Terminal Companion**  
> *Passive error interception, zero-latency root-cause diagnosis, and 1-click terminal self-healing.*

---

## ⚡ The Problem
Developers waste hours every week context-switching between the terminal and browser search tabs whenever a command crashes (`EADDRINUSE`, missing dependencies, git diverged branches, typos, syntax errors).

**DevGhost** eliminates this friction. It hooks directly into your shell (PowerShell / Bash / Zsh). When any command exits with a non-zero code, DevGhost silently wakes up, captures the failure context, diagnoses the exact root cause, and provides a **1-click verified fix** right inside your terminal.

---

## ✨ Features

- **🎯 Zero-Friction Passive Interception:** No need to prefix commands or copy-paste errors. DevGhost only appears when a command actually fails.
- **⚡ Sub-Millisecond Heuristic Engine:** Offline rule engine instantly catches common developer headaches (port conflicts, missing npm/pip packages, git upstream issues, common CLI typos).
- **🧠 Optional AI Deep Diagnostics:** Seamlessly falls back to Gemini / LLM inference when encountering complex custom stack traces (activated simply by setting `GEMINI_API_KEY`).
- **🛡️ Sandboxed Interactive TUI:** Displays clean, structured diagnostic cards with `[Enter]` to execute the fix, `[e]` for a deep-dive explanation, and `[q]` to dismiss.
- **🔄 Cross-Platform Shell Support:** Native PowerShell `$PROFILE` integration on Windows; Bash/Zsh support on macOS & Linux.

---

## 🏗️ Architecture

```
[ Developer Terminal (PowerShell / Bash) ]
                 │
      (Runs command, e.g. "npm start")
                 │
           [ Fails: Exit Code != 0 ]
                 │
                 ▼
       ┌─────────────────────────┐
       │ 1. Shell Hook / Trap    │ ──► Captures command & error stream
       └───────────┬─────────────┘
                   │
                   ▼
       ┌─────────────────────────┐
       │ 2. Context Harvester    │ ──► Inspects cwd, git state & environment
       └───────────┬─────────────┘
                   │
                   ▼
       ┌─────────────────────────┐
       │ 3. Diagnostic Engine    │ ──► Fast Heuristics + Cloud AI fallback
       └───────────┬─────────────┘
                   │
                   ▼
       ┌─────────────────────────┐
       │ 4. Interactive TUI      │ ──► Renders root cause & fix preview
       └───────────┬─────────────┘
                   │
                   ▼
       ┌─────────────────────────┐
       │ 5. Safe Fix Executor    │ ──► [Enter] runs fix command in subshell
       └─────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Installation
Clone the repository and install dependencies:

```powershell
git clone <your-repo-url>
cd devghost
npm install
npm run build
npm link
```

### 2. Verify Installation
```powershell
devghost status
```

### 3. Run the Interactive Demo
See how DevGhost intercepts a simulated port 3000 collision:
```powershell
devghost demo
```

### 4. Enable Passive Shell Interception (PowerShell)
Automatically link DevGhost into your PowerShell profile:
```powershell
devghost setup
```
Then reload your shell:
```powershell
. $PROFILE
```

---

## 📄 How to Feature This on Your Resume

**DevGhost | Developer Tooling & CLI Automation** *(Node.js, TypeScript, PowerShell, Systems Architecture)*
- Engineered an open-source terminal companion CLI that hooks into Windows PowerShell and POSIX shells to passively intercept runtime command failures.
- Built a sub-millisecond heuristic diagnostic pipeline resolving common developer bottlenecks (port conflicts, missing dependencies, git divergence) with fallback to streaming LLM inference.
- Implemented an interactive terminal UI (TUI) providing root-cause explanations and 1-key sandboxed fix execution, eliminating manual browser context-switching.
- Architected environment and Git metadata harvesters to prune contextual noise and deliver precise, localized auto-healing patches.

---

## 📜 License
MIT © 2026
