# RapiReport - AI-Powered Healthcare Ecosystem

RapiReport is a state-of-the-art, comprehensive healthcare management platform designed to bridge the gap between complex medical reports and actionable health insights. By leveraging advanced Artificial Intelligence (AI), Computer Vision, and OCR technology, RapiReport empowers users to take control of their health through automated report analysis, personalized risk assessment, and seamless telemedicine integration.

## 🚀 Vision & Problem Statement

Modern healthcare often leaves patients with dense, technical medical reports that are difficult to interpret without immediate professional assistance. RapiReport addresses this by:
- **Democratizing Health Data**: Turning clinical jargon into easy-to-understand summaries.
- **Proactive Risk Management**: Using historical data to predict and mitigate future health risks.
- **Universal Access**: Providing 24/7 AI-driven health support and streamlined booking for clinical consultations.

---

## ✨ Key Features

### 1. AI-Driven Report Analysis (Gemini Integration)
- **Automated Scanning**: Utilizes OCR (Tesseract.js & Backend PHP OCR) to digitize physical medical reports.
- **Smart Interpretation**: Integrates Google Gemini Pro to analyze blood tests, radiology reports, and clinical notes, providing context-aware summaries and health score improvements.

### 2. Intelligent Health Monitoring
- **Risk Analysis**: Advanced algorithms that assess chronic disease risks based on lifestyle and medical history.
- **Health Planner**: Personalized daily/weekly health goals and medication schedules.
- **Data Visualization**: Real-time health metrics tracking using Recharts.

### 3. Telemedicine & Consultation Hub
- **Booking Engine**: Advanced scheduling system for in-person or virtual doctor appointments.
- **Consultation Room**: Real-time communication interface for patient-doctor interaction.
- **Doctor/Admin Dashboards**: Specialized portals for medical professionals to manage patient records and appointments.

### 4. Interactive & Gamified Wellness
- **Quest Games**: Gamification of health education to keep users engaged and informed.
- **Rewards System**: Earn XP and badges for completing health-related activities and daily logs.
- **AI Exercise Tracking**: Built-in pose detection (TensorFlow.js) for monitoring physical therapy or fitness routines via webcam.

### 5. Family Health Management
- **Centralized Records**: Manage health profiles for multiple family members under a single account.
- **Shared History**: View and track health trends for the entire household.

---

## 🛠️ Technology Stack

### Frontend (Modern SPA)
- **Framework**: [React.js](https://reactjs.org/) (Vite for fast build times)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with **Vanilla CSS** for custom glassmorphism and premium aesthetics.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid, premium-feeling transitions.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for lightweight, high-performance state handling.
- **AI/ML**: 
  - `@google/generative-ai` (Gemini API)
  - `TensorFlow.js` (Pose detection)
  - `Tesseract.js` (Client-side OCR)
- **UI Components**: Headless UI, Lucide Icons, Leaflet (Maps), Recharts (Graphs).

### Backend (RESTful Architecture)
- **Language**: PHP (Vanilla for performance and modularity)
- **Database**: MySQL (Relational structure for complex health records)
- **Authentication**: Custom JWT-based authentication system with Google OAuth integration.
- **Storage**: Local filesystem for report uploads and image processing.

---

## 🧠 Technical Decisions & Architecture

- **Hybrid OCR Strategy**: 
  - *Decision*: Implementing both client-side (Tesseract.js) and server-side OCR.
  - *Rationale*: Ensures responsiveness for quick scans while maintaining high accuracy for complex documents processed on the backend.
- **Modular Component Design**:
  - *Decision*: Atomic design principles in `src/components`.
  - *Rationale*: Allows for high reusability across User, Doctor, and Admin dashboards.
- **Security-First Approach**:
  - *Decision*: Strict environment variable management and JWT-based session handling.
  - *Rationale*: Protecting sensitive medical data is paramount to user trust.
- **AI-Native Implementation**:
  - *Decision*: Designing the core experience around the Gemini LLM.
  - *Rationale*: Moving beyond simple data entry to a truly intelligent health assistant.
- **Gamification Engine**:
  - *Decision*: Integrating Quest gaming and Rewards at the architectural level.
  - *Rationale*: Increases user retention in a sector (healthcare) where consistent usage is traditionally low.

---

## 📦 Project Structure

- `src/components`: Reusable UI elements categorized by layout, features, and games.
- `src/pages`: Main application views including specialized Dashboards for different roles.
- `backend/api`: RESTful endpoints for health data, AI analysis, and user management.
- `backend/ocr_service`: Dedicated service for processing and extracting text from medical documents.
- `backend/auth`: Secure login and registration logic.

---

*Built with passion for a healthier future.*
