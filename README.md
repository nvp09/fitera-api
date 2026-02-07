# Fitera API (Personal Blog Backend)

Backend API สำหรับ Personal Blog Project  
พัฒนาด้วย Express + PostgreSQL (Supabase)

---

## 🚀 Live API (Deploy on Vercel)

Base URL:
`https://fitera-api.vercel.app`



Health Check:
`https://fitera-api.vercel.app/health`

---

## 📦 Tech Stack

- Node.js
- Express
- PostgreSQL
- Supabase
- Vercel

---

## 🛠 Run Locally

1.  Install dependencies

    ```
npm install
    ```
2.  Start server

    ```
npm run dev
    ```                   

---

## 📌 Available Endpoints

### 🔹 Health Check
GET /health

### 🔹 Get All Posts
GET /posts

### 🔹 Get Single Post
GET /posts/:id

### 🔹 Create Post
POST /posts

### 🔹 Update Post
PUT /posts/:id

### 🔹 Delete Post
DELETE /posts/:id

---

## 🌐 CORS

CORS is configured to allow:
- Local development
- Production frontend (Vercel)


---

## ⚙️ Environment Variables

Create a `.env` file:

```
PORT=4000
DATABASE_URL=your_supabase_connection_string
```
