# 💰 Finance Tracker + AI Insights Platform

A startup-level smart personal finance management platform with AI-powered insights, real-time updates, and a premium dark UI.

## 🧠 Tech Stack

**Frontend:** Next.js 16, Tailwind CSS v4, Framer Motion, Recharts, Zustand  
**Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io  
**AI:** OpenAI GPT-3.5 (insights, predictions, chat assistant, auto-categorization)  
**Auth:** JWT + Google OAuth

## 🔥 Features

- Add income & expenses with AI auto-categorization
- Dashboard with live charts (income vs expense trends)
- AI-generated financial insights & spending warnings
- Expense prediction for next month
- Chat-based finance assistant (ask anything about your money)
- Budget tracking with real-time alerts via Socket.io
- Analytics page with pie charts, bar charts, category breakdown
- Transaction history with search, filter & pagination
- Multi-account support (cash, bank, wallet, credit)

## 🚀 Getting Started

### Backend

```bash
cd backend
npm install
# Configure .env (see .env.example)
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Configure .env.local (see .env.example)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⚙️ Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 📁 Project Structure

```
Finance Tracker/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, error handler
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── services/       # AI service (OpenAI)
│   └── server.js
└── frontend/
    ├── app/            # Next.js App Router pages
    ├── components/     # UI components
    ├── hooks/          # useSocket
    ├── lib/            # API client, constants
    ├── store/          # Zustand stores
    └── types/          # TypeScript types
```

## 🔐 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/transactions` | Get transactions |
| POST | `/api/transactions` | Add transaction |
| GET | `/api/transactions/analytics` | Analytics data |
| GET | `/api/budgets` | Get budgets |
| POST | `/api/budgets` | Create budget |
| GET | `/api/ai` | Get AI insights |
| POST | `/api/ai/refresh` | Regenerate insights |
| GET | `/api/ai/predict` | Predict next month |
| POST | `/api/ai/chat` | Chat with AI assistant |
