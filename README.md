# 📄 Resume Analyzer

AI-powered full-stack application to analyze resumes, extract key information, and provide smart insights using the **Gemini API**.  
The app allows users to upload resumes in PDF format, parses important details, and stores them securely in a **PostgreSQL database**.

---

## 🚀 Features
- Upload resumes in PDF format
- Extract key details like **Name, Email, Phone, Skills**
- AI-powered insights using **Gemini API**
- Store and manage resumes with **PostgreSQL**
- Full-stack architecture with **React + Node.js**

---

## 🛠️ Tech Stack
- **Frontend:** React.js, HTML, CSS, JavaScript  
- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL  
- **AI Integration:** Gemini API  

---

## 📂 Project Structure
```

resume-analyzer/
│── backend/        # Node.js + Express + PostgreSQL
│── frontend/       # React.js app
│── .env            # Environment variables
│── README.md       # Documentation

````

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/ManojkumarBalini/resume-analyzer.git
cd resume-analyzer
````

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

* Create a PostgreSQL database (example: `resume_analyzer`)
* Update `.env` file with your **DB credentials** and **Gemini API Key**:

```env
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resume_analyzer
GEMINI_API_KEY=your_api_key
```

* Start backend server:

```bash
npm start
```

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

---

## ▶️ Running the App

* Frontend: `http://localhost:3000`
* Backend: `http://localhost:4000`

---

## 📸 Preview

![Resume Analyzer Screenshot](./assets/preview.png)

---

## 📌 Future Improvements

* Support for multiple file formats (DOCX, TXT)
* Advanced AI insights (job role matching, resume scoring)
* User authentication system

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📜 License

This project is licensed under the **MIT License**.

Do you want me to also create that **assets folder + link structure** for you so it’s plug-and-play?
```
