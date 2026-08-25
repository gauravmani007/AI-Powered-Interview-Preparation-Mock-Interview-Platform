<div align="center">

# 🚀 AI-Powered Mock Interview Platform

**Tailored interview strategies, real-time match scores, and automated skill-gap roadmaps powered by Gemini AI.**

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-8E44AD?logo=googlegemini&logoColor=white)](https://ai.google.dev/)

</div>

---

## 📌 Overview

**AI-Powered Mock Interview Platform** bridge the gap between job descriptions and candidate preparation. By analyzing target job specs against your resume or quick self-description, the platform generates personalized 3-day action plans, practice questions, match scores, and skill gap highlights in seconds.

---

## ✨ Key Features

* **🎯 Target Job Analysis** — Paste any Job Description (JD) to extract primary requirements and core technical stack.
* **📄 Smart Profile Ingestion** — Upload your resume (PDF/DOCX) or provide a quick text self-description.
* **📊 Match Score & Skill Gap Analysis** — Get an immediate percentage match score along with identified skill gaps (e.g., Cloud, Testing).
* **🗺️ 3-Day Preparation Roadmap** — Dynamic day-by-day action plan covering technical alignment, API/system design, and STAR behavioral stories.
* **💬 Behavioral & Technical Questions** — Context-aware interview practice questions tailored directly to the targeted job role.
* **📥 PDF Resume Export** — Download tailored resumes optimized for the position.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React.js (Vite)
* **Styling:** CSS3 / Modern UI Components

### **Backend**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB

### **AI & Services**
* **AI Engine:** Google Gemini API (`@google/genai`)

---

## 📸 Application Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <b>1. Target Job & Profile Upload</b><br><br>
      <img src="assets/strategy-input.png" alt="Strategy Input Screen" width="100%"/>
    </td>
    <td align="center" width="50%">
      <b>2. Preparation Roadmap & Score</b><br><br>
      <img src="assets/roadmap-screen.png" alt="Roadmap Screen" width="100%"/>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <b>3. Targeted Behavioral & Technical Questions</b><br><br>
      <img src="assets/questions-screen.png" alt="Questions Screen" width="85%"/>
    </td>
  </tr>
</table>

---

## 📁 Project Structure

```text
.
├── Backend/
│   ├── config/          # Database connection setup
│   ├── controllers/     # Route logic & AI strategy processing
│   ├── models/          # MongoDB schemas
│   ├── routes/          # Express API endpoints
│   ├── .env.example     # Environment variable template
│   └── package.json
│
├── Frontend/
│   ├── src/             # React components, styles, and context
│   ├── public/          # Static assets
│   └── package.json
│
└── assets/              # README screenshots & media
