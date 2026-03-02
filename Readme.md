# EduHub: K-12 Educational Coding Platform 

**EduHub** is a high-performance, production-ready educational platform designed to bridge the gap between visual block-based coding and professional text-based development. Built with real-time collaboration, hardware integration, and AI tutoring at its core.

---

##  Key Features

###  Gamified Learning
- **Smarter Dashboard**: Real-time tracking of XP, Level progression, and Day Streaks.
- **Badge Gallery**: Achievement system that rewards coding milestones (e.g., "Logic Master", "IoT Pioneer").
- **Global Leaderboard**: Competitive rankings categorized by Classroom, Friends, and Global cohorts.

###  Classroom & Pedagogical Tools
- **Classroom Hub**: Real-time chat and collaboration for students and teachers.
- **Teacher Analytics**: High-level ROI tracking with "Student Stuck" alerts and progress heatmaps.
- **Assignment System**: Effortless task distribution with unique 6-digit classroom join codes.


- **EduBot AI Tutor**: Grade-appropriate, Socratic AI guidance (K-12 adaptive tone).
- **Bidirectional Sync**: Real-time Blockly visual blocks to Python/C++ code synchronization.
- **Hardware Gateway**: Direct browser-to-hardware flashing for ESP32, Arduino, and Micro:bit.

---

##  Technology Stack
  
### Backend
- **Node.js & Express**: Scalable API architecture.
- **Socket.io**: Sub-millisecond real-time synchronization.
- **MongoDB**: Primary persistent storage for users, projects, and classrooms.
- **Redis**: High-speed caching for presence and collaboration state.

### Frontend
- **React 18 + Vite**: Modern, responsive UI framework.        
- **Framer Motion**: Smooth micro-animations and transitions.
- **Lucide Icons**: Consistent, premium iconography.
- **Zustand**: Lightweight, high-performance state management.

### Infrastructure
- **Docker**: Containerized services for sandboxed code execution.
- **Nginx**: High-performance reverse proxy and load balancer.

---

##  Quick Start

### 1. Prerequisite Setup
Ensure you have **Node.js 18+**, **MongoDB**, and **Redis** running on your system.

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The platform will be available at `http://localhost:3000`.

---

##  Project Structure

```text
eduhub/
├── backend/
│   ├── src/
│   │   ├── api/          # Auth, Projects, Classroom, AI routes
│   │   ├── models/       # MongoDB Schemas (User, Project, Classroom, etc.)
│   │   ├── services/     # AI Tutoring, Analytics, Socket management
│   │   ├── config/       # Database & Redis drivers
│   │   └── server.js     # Entry Point
├── frontend/
│   ├── src/
│   │   ├── pages/        # Dashboard, Leaderboard, Badges, Analytics
│   │   ├── components/   # ClassroomChat, Editor, Navbar
│   │   └── App.jsx       # Routing & Global State
└── infra/                # Docker & Deployment manifests
```
               
---

##  Security & Compliance
- **COPPA Ready**: No personal data collection for minors, specialized safety filters.
- **Code Sandboxing**: Student code execution is isolated in restricted Docker environments.
- **Auth**: Secure JWT-based authentication with encrypted password hashing.

---