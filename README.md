# 🚀 HireTrack — Job Application & Interview Tracker

<p align="center">
  <b>A full-stack job application and interview tracking platform built with the MERN stack.</b>
</p>

<p align="center">
  Manage applications, saved jobs, interviews, deadlines, and your complete job-search journey from one place.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React.js-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Mongoose-ODM-880000?style=for-the-badge&logo=mongoose&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/REST-API-02569B?style=for-the-badge" />
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>

---

## 📌 Overview

**HireTrack** is a full-stack job application and interview tracker designed to help job seekers organize their complete recruitment journey in one centralized platform.

Instead of managing applications through spreadsheets, notes, bookmarks, and multiple platforms, HireTrack provides a single dashboard for managing:

* 💼 Job applications
* 🔖 Saved jobs
* 📊 Application stages
* 📋 Kanban workflow
* 📅 Interviews
* ⏰ Application deadlines
* 🔐 User authentication
* 📈 Recruitment progress

The application follows a modern **client-server architecture** using **React.js, Node.js, Express.js, MongoDB, and Mongoose**.

---

# ✨ Features

## 🔐 Authentication & Authorization

* User registration
* User login
* JWT-based authentication
* Protected routes
* User-specific data
* Backend authorization
* Secure environment configuration

---

## 💼 Job Application Tracking

Users can manage their job applications throughout the recruitment process.

### Application management includes:

* Add applications
* View applications
* Update applications
* Delete applications
* Track application status
* Store company information
* Store job information
* Track application dates
* Track deadlines

---

## 📊 Application Kanban Board

HireTrack provides a Kanban-style application workflow to visually organize job applications.

Example workflow:

```text
┌────────────┐
│   Applied  │
└─────┬──────┘
      ↓
┌────────────┐
│ Screening  │
└─────┬──────┘
      ↓
┌────────────┐
│ Interview  │
└─────┬──────┘
      ↓
┌────────────┐
│   Offer    │
└────────────┘
```

Applications can be tracked according to their current recruitment stage.

---

# 🔖 Saved Jobs

Save interesting job opportunities and manage them from one place.

### Features include:

* Save jobs
* View saved jobs
* Search jobs
* Filter jobs
* Sort jobs
* Pagination
* Deadline tracking
* Manage saved-job status

---

# 🔄 Saved Job → Application

A saved job can be converted directly into a job application.

This avoids entering the same job information multiple times.

```text
Saved Job
    ↓
Convert
    ↓
Job Application
    ↓
Track Recruitment Process
```

---

# 📅 Interview Management

Manage interviews associated with job applications.

### Interview features:

* Schedule interviews
* Store interview details
* Track interview dates
* Link interviews to applications
* Manage interview information

---

# ⏰ Deadline Tracking

Keep track of important application deadlines.

Users can identify upcoming deadlines and manage their job-search activities more efficiently.

---

# 👤 User-Specific Data

Each authenticated user has their own:

* Applications
* Saved jobs
* Interviews
* Recruitment information

Data is associated with the authenticated user and protected through JWT authentication and backend authorization.

---

# 🛠️ Complete Tech Stack

## 🎨 Frontend Technologies

### React.js

Used to build the component-based user interface and manage the frontend application.

### Vite

Used as the frontend development server and build tool.

### JavaScript (ES6+)

Used for application logic, API integration, state handling, and frontend functionality.

### JSX

Used to write React components and combine JavaScript with UI structure.

### HTML5

Used for semantic page structure and frontend markup.

### CSS3

Used for styling, layouts, responsiveness, and visual presentation.

### ESLint

Used for maintaining JavaScript/React code quality and identifying potential issues.

---

## ⚙️ Backend Technologies

### Node.js

JavaScript runtime used to build and run the backend server.

### Express.js

Backend framework used to create the server and REST API endpoints.

### REST API

Used for communication between the React frontend and Express backend.

### JWT — JSON Web Token

Used for authentication and protecting private API routes.

---

## 🗄️ Database Technologies

### MongoDB

NoSQL database used to store:

* Users
* Applications
* Saved jobs
* Interviews
* Related recruitment information

### Mongoose

MongoDB object modeling library used for:

* Database schemas
* Data models
* Queries
* Validation
* Database operations

---

## 🔧 Development & Version Control

### npm

Used for package management and running project scripts.

### Git

Used for source-code version control.

### GitHub

Used for repository hosting, source-code management, and project collaboration.

### VS Code

Used as the primary development environment.

### Nodemon

Used during backend development to automatically restart the server when code changes.

---

# 📦 Technology Summary

| Technology          | Category             | Usage                          |
| ------------------- | -------------------- | ------------------------------ |
| **React.js**        | Frontend             | UI development                 |
| **Vite**            | Frontend Tool        | Development & production build |
| **JavaScript ES6+** | Programming Language | Application logic              |
| **JSX**             | Frontend             | React component structure      |
| **HTML5**           | Frontend             | Page structure                 |
| **CSS3**            | Frontend             | Styling & responsive design    |
| **Node.js**         | Backend              | JavaScript runtime             |
| **Express.js**      | Backend              | REST API & server              |
| **REST API**        | Architecture         | Frontend-backend communication |
| **MongoDB**         | Database             | Data storage                   |
| **Mongoose**        | Database/ODM         | MongoDB data modeling          |
| **JWT**             | Security             | Authentication                 |
| **ESLint**          | Development          | Code quality                   |
| **npm**             | Package Manager      | Dependency management          |
| **Nodemon**         | Development          | Automatic server restart       |
| **Git**             | Version Control      | Source-code management         |
| **GitHub**          | Repository           | Project hosting                |
| **VS Code**         | IDE                  | Development                    |

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │        USER          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React.js + JSX     │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                              REST API Requests
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Express.js      │
                         │      + Node.js       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ JWT Authentication   │
                         │    & Middleware      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Mongoose        │
                         │        ODM           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       MongoDB        │
                         │       Database       │
                         └──────────────────────┘
```

---

# 🔄 Application Workflow

```text
User
 │
 ▼
React.js Frontend
 │
 ▼
REST API Request
 │
 ▼
Express.js / Node.js
 │
 ▼
JWT Authentication
 │
 ▼
Controller / API Logic
 │
 ▼
Mongoose
 │
 ▼
MongoDB
 │
 ▼
Response
 │
 ▼
React.js UI
```

---

# 🔐 Authentication Flow

```text
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       ▼
 Register / Login
       │
       ▼
 Express.js Backend
       │
       ▼
 Authentication
       │
       ▼
 JWT Generated
       │
       ▼
 Client Receives Token
       │
       ▼
 Protected API Request
       │
       ▼
 JWT Verification
       │
       ▼
 Authorized Request
       │
       ▼
 User-Specific Data
```

---

# 🏛️ Project Architecture

```text
HireTrack/
│
├── client/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── ...
│
├── .env.example
├── package.json
├── README.md
└── ...
```

---

# ⚙️ Requirements

Make sure the following are installed:

* **Node.js**
* **npm**
* **MongoDB** — Local MongoDB or MongoDB Atlas
* **Git**
* **VS Code** — Recommended

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

Check Git:

```bash
git --version
```

---

# 🚀 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/Abhishek-2527/HireTrack.git
```

Navigate into the project:

```bash
cd HireTrack
```

---

## 2. Install Backend Dependencies

```bash
npm install
```

---

## 3. Install Frontend Dependencies

```bash
npm --prefix client install
```

---

# 🔐 Environment Configuration

Create your `.env` file using `.env.example`.

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_private_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

For the frontend, if the backend API is not available at the default URL, create:

```text
client/.env
```

and configure:

```env
VITE_API_URL=http://localhost:5000/api
```

### ⚠️ Important

Never commit:

```text
.env
```

or real database credentials and JWT secrets to GitHub.

---

# ▶️ Run the Application

From the root directory:

```bash
npm run dev
```

### Frontend

```text
http://localhost:5173
```

### Backend

```text
http://localhost:5000
```

MongoDB must be running and reachable before starting the backend.

---

# 📜 Available Scripts

### Run frontend + backend

```bash
npm run dev
```

### Run backend

```bash
npm run dev:server
```

### Run frontend

```bash
npm run dev:client
```

### Run ESLint

```bash
npm --prefix client run lint
```

### Build frontend

```bash
npm --prefix client run build
```

---

# 🌐 REST API Architecture

HireTrack uses RESTful APIs for communication between the frontend and backend.

```text
React.js
   │
   │ HTTP
   │
   ▼
Express.js
   │
   ├── Authentication
   ├── Applications
   ├── Saved Jobs
   └── Interviews
          │
          ▼
      Mongoose
          │
          ▼
       MongoDB
```

---

# 🧩 Core Modules

## 👤 Authentication Module

Responsible for:

* Registration
* Login
* JWT generation
* JWT verification
* Protected routes
* Authorization

---

## 💼 Application Module

Responsible for:

* Creating applications
* Reading applications
* Updating applications
* Deleting applications
* Application status
* Kanban workflow

---

## 🔖 Saved Jobs Module

Responsible for:

* Saving jobs
* Searching jobs
* Filtering
* Sorting
* Pagination
* Deadline tracking
* Converting saved jobs into applications

---

## 📅 Interview Module

Responsible for:

* Scheduling interviews
* Managing interview details
* Linking interviews to applications
* Tracking interview dates

---

# 🔒 Security

HireTrack implements several security practices:

* JWT-based authentication
* Protected API routes
* Backend authorization
* User-specific data access
* Environment variables for sensitive configuration
* Private JWT secret
* MongoDB connection through environment configuration
* CORS configuration
* Frontend and backend separation

For a production deployment, additional security measures such as HTTPS, rate limiting, secure cookie/token handling, stronger validation, and production-specific CORS configuration should also be considered.

---

# 📱 Responsive Frontend

The React frontend is designed to provide a usable experience across:

* 💻 Desktop
* 💻 Laptop
* 📱 Mobile devices

The UI is built using **React.js, JSX, HTML5, and CSS3**.

---

# 📈 Future Improvements

Possible future enhancements include:

* 🤖 AI-powered job recommendations
* 📄 AI resume analysis
* 🎯 Resume-job compatibility scoring
* 📧 Email notifications
* 🔔 Interview reminders
* 📊 Advanced application analytics
* 📈 Recruitment statistics
* 🔗 Job-board API integrations
* 📄 Resume management
* 🌙 Dark/light theme
* 📱 Progressive Web App support

---

# 🎯 Project Goals

HireTrack was created to solve a practical problem faced by job seekers: managing multiple job applications across different companies and recruitment stages.

The project demonstrates practical implementation of:

* Full-stack web development
* MERN stack development
* React component architecture
* REST API development
* Node.js backend development
* Express.js server development
* MongoDB database management
* Mongoose data modeling
* JWT authentication
* Protected routes
* CRUD operations
* Frontend-backend integration
* Environment configuration
* Git version control
* GitHub project management

---

# 📚 Key Learning Outcomes

Through HireTrack, I gained practical experience with:

```text
React.js
   ↓
Vite
   ↓
JavaScript / JSX
   ↓
REST API
   ↓
Node.js
   ↓
Express.js
   ↓
JWT Authentication
   ↓
Mongoose
   ↓
MongoDB
   ↓
Git & GitHub
```

The project helped me understand how the frontend, backend, authentication layer, API layer, and database work together to create a complete full-stack application.

---

# 🚀 Deployment

HireTrack can be deployed using modern cloud platforms.

### Frontend

The React/Vite frontend can be deployed using platforms such as:

* Vercel
* Netlify

### Backend

The Node.js/Express backend can be deployed using platforms such as:

* Render
* Railway
* Other Node.js-compatible hosting platforms

### Database

MongoDB Atlas can be used for a cloud-hosted MongoDB database.

> Environment variables must be configured separately on the deployment platform.

---

# 👨‍💻 Author

## Abhishek Singh

**B.Tech Computer Science Engineering Student**

**Aspiring Software Developer | Full-Stack Developer | DSA Enthusiast**

📍 India

---

# ⭐ Show Your Support

If you found this project useful or interesting, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project was created for educational and portfolio purposes.
