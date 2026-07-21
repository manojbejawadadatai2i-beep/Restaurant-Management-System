# Ocean View RMS — Ollama Model Installation & Multi-Device Setup Guide

## 1. System Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

- **Node.js**: Version 18.x or higher
- **PostgreSQL**: Version 14.x or higher
- **Ollama**: Local LLM runner for 100% free, offline execution
- **Git**: For source control

---

## 2. PostgreSQL Database Configuration

### 2.1 Database Creation
Open PostgreSQL `psql` shell or pgAdmin and run:

```sql
CREATE DATABASE restaurant_portal;
```

### 2.2 Connection String
The Node.js backend connects using the following connection URI format:

```env
DATABASE_URL=postgresql://postgres:Manoj%404462@localhost:5432/restaurant_portal
```

*Note: Special characters in passwords (e.g. `@`) must be URL-encoded (e.g. `%40`).*

---

## 3. Standardized Local Ollama Model Setup (Multi-Device Compatible)

The Ocean View RMS backend dynamically autodetects any model installed in your local Ollama engine via `/api/tags`. To make installation easy and consistent across all devices, follow this standardized model installation guide based on system hardware:

### 3.1 Step 1: Download & Install Ollama
1. Visit the official website: [https://ollama.com/download](https://ollama.com/download)
2. Download the installer for your OS (`OllamaSetup.exe` for Windows, macOS, or Linux).
3. Run the installer to set up the Ollama background service.

### 3.2 Step 2: Install Standardized Model (Recommended for All Devices)

Open Windows Terminal / PowerShell / Command Prompt and run:

```powershell
# Standard Model Installation (Lightweight, High Speed, Works on all devices)
ollama pull llama3.2
```

#### Device Hardware Recommendations:
Depending on your target device hardware, you can pull any of the following supported models:

| Device Tier | RAM / GPU | Recommended Command | Model Size | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Standard / Low Spec** *(Default)* | 4GB - 8GB RAM | `ollama pull llama3.2` | ~2.0 GB | Ultra-fast execution on laptops & standard PCs |
| **Mid Spec** | 8GB - 16GB RAM | `ollama pull qwen2.5` | ~4.7 GB | High precision structured business insights |
| **High Spec** | 16GB+ RAM | `ollama pull llama3` | ~4.7 GB | Complex operational analysis |

### 3.3 Step 3: Start Ollama Service & Verify API
Ensure the Ollama service is active on port `11434`:

```powershell
# Start Ollama service (if not running in taskbar)
ollama serve

# Verify local REST endpoint and active models
curl http://127.0.0.1:11434/api/tags
```

---

## 4. Project Environment & Config (`.env`)

Create a `.env` file in the root of `frontend/sample`:

```env
PORT=5001
DATABASE_URL=postgresql://postgres:Manoj%404462@localhost:5432/restaurant_portal
GROQ_API_KEY=gsk_...
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

*Note: `server/index.js` automatically auto-discovers your installed Ollama model if `OLLAMA_MODEL` is left blank.*

---

## 5. Running the Application

### 5.1 Start Backend Express Server
In Terminal 1:
```powershell
cd c:\Users\maddi\OneDrive\Desktop\DataI2I\Restaurant-Management-System\frontend\sample
node server/index.js
```
*Output: Backend API server running on `http://localhost:5001`.*

### 5.2 Start Frontend Development Server
In Terminal 2:
```powershell
cd c:\Users\maddi\OneDrive\Desktop\DataI2I\Restaurant-Management-System\frontend\sample
npm run dev
```
*Output: Vite frontend running on `http://localhost:5173`.*

---

## 6. Building for Production

To validate TypeScript compilation and generate the production bundle:

```powershell
npm run build
```

---

## 7. Troubleshooting Guide

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **`connect ECONNREFUSED 127.0.0.1:11434`** | Ollama service is not running | Run `ollama serve` in terminal or start the Ollama desktop app. |
| **`No model found error`** | Ollama installed but no model pulled | Run `ollama pull llama3.2` in terminal. |
| **`Groq 429 Rate Limit Error`** | Cloud API quota exceeded | System automatically switches to local Ollama. Ensure Ollama is running. |
| **`PostgreSQL syntax error at "role"`** | Reserved keyword conflict | Use double-quotes `"role"` in SQL queries (e.g. `UPDATE users SET "role" = $1`). |
| **`Failed to connect to database`** | Password encoding issue | Encode `@` in password as `%40`. |
