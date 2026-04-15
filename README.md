# 🎓 Smart Face Recognition Based Attendance System

An AI-powered smart attendance system that uses **face recognition and CCTV analytics** to automate attendance tracking, monitor campus activity, and provide real-time insights.

---

## 📌 Overview

Traditional attendance systems are time-consuming, error-prone, and vulnerable to proxy attendance.  
This project solves these issues using:

- Real-time face detection & recognition
- Multi-camera tracking
- Automated attendance marking
- Video activity summarization
- Role-based web dashboard

---

## ✨ Features

- 🎯 Real-time face detection using YOLOv9e
- 🧠 Custom CNN-based face recognition model
- 🎥 Multi-camera CCTV integration
- 📊 Attendance analytics & reporting dashboard
- 📍 Absentee tracking with last known location
- 👥 Role-based access (Admin / Teacher / Student)
- 🔐 Secure authentication using JWT & bcrypt
- 📩 Email notifications for absentees
- 📈 Occupancy monitoring (people count per area)
- 🎬 Video activity summarization

---

## 🧠 AI/ML Details

- **Face Detection:** YOLOv9e
- **Face Recognition:** Custom CNN
- **Dataset:**  
  - 10,000 images  
  - 40 students  
  - Data augmentation (rotation, brightness, zoom)

- **Model Performance:**
  - ✅ Training Accuracy: **99.62%**
  - ✅ Test Accuracy: **99.44%**
  - ✅ F1 Score: **0.99**

---

## ⚙️ Tech Stack

| Layer        | Technology |
|-------------|------------|
| Frontend     | React.js |
| Backend      | Node.js, Express |
| ML Backend   | Flask |
| Database     | MongoDB |
| AI/ML        | TensorFlow / CNN / YOLOv9 |
| Realtime     | Socket.IO |
| Security     | JWT, bcrypt |

---

## 🏗️ System Architecture

1. CCTV cameras capture video
2. YOLOv9 detects faces in real-time
3. Faces are sent to CNN model for recognition
4. Identity matched with database
5. Attendance is marked automatically
6. Data stored in MongoDB
7. Dashboard displays analytics & reports

---

## 📂 Project Structure
├── backend-flask # ML inference server (face recognition)
├── backend # Node.js API & authentication
├── frontend # React dashboard
├── README.md


---

## 🔧 Installation & Setup

### 1️⃣ Clone the Repository
git clone https://github.com/your-username/Smart-Face-Recognition-Based-Attendance-System.git
cd Smart-Face-Recognition-Based-Attendance-System

## .env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
PORT=5000
JWT_EXPIRY=1d
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password

## Backend
cd backend
npm install
npm start

## Frontend
cd frontend
npm install
npm run dev

## BackendFlaskk
cd backend-flask
pip install -r requirements.txt
python face_recognition_server.py

🔐 Security Features
- JWT-based authentication
- Password hashing using bcrypt
- Role-Based Access Control (RBAC)
- Consent-based face enrollment
- Data privacy compliance (GDPR & DPDP)
  
📊 Performance
- ⏱️ Latency: ~81 ms per frame
- 🎥 FPS: ~13 FPS (single camera)
- 📉 Only ~15% drop with multiple cameras
- 💾 Model RAM Usage: ~1.5 GB
  
🚀 Key Highlights
- Reduces manual attendance time from 5–10 minutes → seconds
- Reduces admin workload by ~90%
- Supports real-time campus monitoring
- Scalable for multiple CCTV cameras
  
🔮 Future Improvements
- 📱 Mobile app integration
- 🌐 Multi-campus deployment
- 🧬 ArcFace integration for higher accuracy
- 🤖 Federated learning for privacy
- 🎯 Better handling of extreme angles & occlusions
  
👨‍💻 Authors
- Boddepalli Kiran Kumar
- Pothumahanty Karthik Kumar
- Sudheer Kovvuru
- Satagopam Sai Harish
- Bongu Bharadwaj
🎓 AITAM - CSE (AI & ML)

📜 License
This project is for educational purposes.
