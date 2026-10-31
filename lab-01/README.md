# Lab 1: Node.js and Express server

**POTRU. SRI RAMCHARAN · 252U1R1199 · 214**

**Live link:** Render deployment ready (Pending cloud service activation - see [Deployment Guide](#deployment-to-render) below)

---

## Objective
The objective of this laboratory assignment is to build foundational competency in backend web development using Node.js and Express.js:
1. Build a basic HTTP server using Node's native `http` module.
2. Build and structure a modular web API using the `Express.js` framework.
3. Implement request routing, dynamic payload generation, JSON responses, and custom 404 fallback handling.
4. Prepare the project for version control, cloud deployment, and automated testing.

---

## How to Run

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later installed)
- npm (Node Package Manager)

### 2. Installation
Navigate into the lab folder and install the required dependencies:
```bash
cd lab-01
npm install
```

### 3. Environment Variables
Create an optional `.env` file in the `lab-01` root directory to configure the port or student details if desired (do not commit real values):
```env
PORT=3000
STUDENT_NAME=POTRU. SRI RAMCHARAN
STUDENT_SECTION=214
```
*(Default values are provided in `server.js` if `.env` is omitted.)*

### 4. Start Commands

- **Run Basic HTTP Server:**
  ```bash
  npm run basic
  ```
  *Output:* `Server is running at http://localhost:3000/`

- **Run Production Express Server:**
  ```bash
  npm start
  ```
  *Output:* `Express server running on http://localhost:3000`

---

## Endpoints / Scripts Table

### Available Scripts
| Script Command | Target File | Purpose |
|---|---|---|
| `npm run basic` | `basic-server.js` | Starts the native Node.js HTTP server on port 3000 |
| `npm start` | `server.js` | Starts the production Express server on port 3000 / dynamic port |

### API Endpoints
| Method | Path | Expected Status | Response Format | One-line Description |
|---|---|---|---|---|
| `GET` | `/` | `200 OK` | `text/html` | Returns a welcome message greeting the client. |
| `GET` | `/about` | `200 OK` | `application/json` | Returns JSON object containing student's full name and section. |
| `GET` | `/time` | `200 OK` | `application/json` | Returns current date and timestamp generated dynamically per request. |
| `*` (All) | `/*` (Invalid) | `404 Not Found` | `application/json` | Returns structured 404 error JSON for unmapped routes. |

---

## Verified Test Results

| Test Case | Route Tested | Expected Status | Actual Status | Result |
|---|---|---|---|---|
| 1 | `GET /` (Basic Server) | `200 OK` | `200 OK` | **PASSED** |
| 2 | `GET /` (Express Server) | `200 OK` | `200 OK` | **PASSED** |
| 3 | `GET /about` (Express Server) | `200 OK` | `200 OK` | **PASSED** |
| 4 | `GET /time` (Express Server) | `200 OK` | `200 OK` | **PASSED** |
| 5 | `GET /invalid-route` (Express Server) | `404 Not Found` | `404 Not Found` | **PASSED** |

---

## Screenshots

The following screenshots demonstrate verified responses captured from the running Express server:

### 1. Home Endpoint (`GET /`)
![Home Endpoint](screenshots/home.png)

### 2. About Endpoint (`GET /about`)
![About Endpoint](screenshots/about.png)

### 3. Dynamic Time Endpoint (`GET /time`)
![Time Endpoint](screenshots/time.png)

### 4. 404 Route Not Found
![Not Found Endpoint](screenshots/not-found.png)

---

## Notes: Problems Faced and How You Solved Them

1. **PowerShell Script Execution Policy on Windows (`npm.ps1` restricted):**
   - *Problem:* Running `npm` inside Windows PowerShell threw a `PSSecurityException` because script execution was disabled (`running scripts is disabled on this system`).
   - *Solution:* Executed commands via `npm.cmd` directly, which circumvents PowerShell's script-execution restriction.
2. **Network Access in Sandboxed Environments:**
   - *Problem:* Sandboxed execution blocked outbound internet access, causing `npm install express` to hang while resolving package manifests from `registry.npmjs.org`.
   - *Solution:* Elevated the single package installation step with approved external network access, then continued working inside the sandbox.
3. **Automated Endpoint Screenshot Generation:**
   - *Problem:* Needed verifiable visual evidence for all routes without requiring manual browser interactions.
   - *Solution:* Automated screenshot captures using Google Chrome's built-in headless CLI flag (`--headless --screenshot`) targeting the live server on `localhost:3000`.

---

## Deployment to Render

This repository is structured for seamless zero-config deployment on [Render](https://render.com):
1. **Dynamic Port:** The server uses `process.env.PORT || 3000`.
2. **Start Script:** `npm start` is configured to run `node server.js`.
3. **Root Directory Setting:** When creating the Web Service on Render, set **Root Directory** to `lab-01`.
4. **Build & Start Commands:**
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Once deployed, paste your live service link (`https://<service-name>.onrender.com`) at the top of this file.

---

## Viva Questions and Answers

### Q1: What is the primary difference between Node's `http` module and Express.js?
**A:** The `http` module is a low-level standard library built into Node.js. It requires manual parsing of URLs, HTTP headers, request bodies, and manual stream management. Express.js is a minimalist web framework built on top of `http` that provides higher-level abstractions like intuitive routing (`app.get`), middleware chaining, automated Content-Type negotiation, and helper methods like `res.json()`.

### Q2: Why is `process.env.PORT || 3000` preferred over hardcoding port 3000?
**A:** In cloud environments like Render, Heroku, or AWS, the hosting platform dynamically assigns an open port via the `PORT` environment variable. If port 3000 were hardcoded, the deployed container would fail to bind to the router's expected port, causing connection timeouts. Using `process.env.PORT || 3000` allows the server to run locally on port 3000 while automatically adapting to the cloud host's assigned port.

### Q3: Why is `node_modules` added to `.gitignore`?
**A:** The `node_modules` directory contains thousands of installed dependency files and can be tens or hundreds of megabytes in size. Storing it in Git creates repository bloat and potential cross-platform binary compatibility issues. Since `package.json` and `package-lock.json` track the exact packages and versions required, running `npm install` reconstructs `node_modules` deterministically.

### Q4: Why must the 404 handler middleware be placed after all route definitions?
**A:** Express executes middleware and routes in the sequential order they are defined in code. If the 404 catch-all handler (`app.use((req, res) => ...)`) were placed at the top, it would intercept and respond to every incoming request, preventing any actual routes defined below it from ever executing. Placing it at the very bottom ensures it only triggers when no previous route matched the requested URL.
