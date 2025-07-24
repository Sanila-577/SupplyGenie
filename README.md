# SupplyGenie - AI-Powered Supply Chain Management Platform

## Overview

SupplyGenie is a comprehensive AI-powered supply chain management platform that helps businesses discover, evaluate, and connect with reliable suppliers based on their exact requirements. The platform consists of two main components:

1. **AI Service**: A FastAPI-based backend with intelligent supplier discovery using LangChain and MongoDB
2. **Frontend**: A modern Next.js 15 web application with an interactive chat interface

## 🏗️ Architecture

```
SupplyGenie Platform
├── supplygenie-metamorphs-idealize-ai-service-main/    # Backend AI Service
│   ├── FastAPI + LangChain + MongoDB
│   └── AI Agents for Supplier Discovery
└── supplygenie-metamorphs-idealize-frontend/          # Frontend Application
    ├── Next.js 15 + React 18
    └── Interactive Chat Interface
```

## 🚀 Key Features

### AI Service Backend
- **Intelligent Supplier Discovery**: AI agents search and evaluate suppliers from multiple sources
- **MongoDB Integration**: Efficient storage and querying of supplier data
- **Web Research**: Real-time supplier information gathering via Tavily API
- **Smart Filtering**: Advanced search with location, price, and certification filters
- **RESTful API**: Clean, documented endpoints for frontend integration

### Frontend Application
- **AI-Powered Chat Interface**: Interactive chat system for supplier recommendations
- **User Authentication**: Secure Firebase-based authentication
- **Responsive Design**: Modern, mobile-first UI with Tailwind CSS and shadcn/ui
- **Speech-to-Text**: Voice input capability for hands-free interaction
- **Real-time Data**: Integration with the AI service for up-to-date supplier information
- **Dark Theme**: Professional interface optimized for business use

## 🛠️ Tech Stack

### Backend (AI Service)
- **Backend**: FastAPI with Python 3.12
- **AI/ML**: LangChain, LangGraph, OpenAI GPT models
- **Database**: MongoDB with text search indexing
- **Search**: Tavily API for web research
- **Logging**: Loguru for structured logging
- **Deployment**: Docker support with Cloud Run optimization

### Frontend
- **Framework**: Next.js 15.2.4 with React 18 and TypeScript 5
- **UI/Styling**: Tailwind CSS, shadcn/ui, Radix UI components
- **Authentication**: Firebase 11.9.1
- **Database**: MongoDB 6.17.0 for chat history
- **Forms**: React Hook Form with Zod validation
- **Voice**: Web Speech API for speech-to-text
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icon library
- **Deployment**: Vercel with automatic deployments

## 🔧 Prerequisites

- Python 3.12+ (for AI service)
- Node.js 18+ (for frontend)
- pnpm or npm
- MongoDB database (local or cloud)
- OpenAI API key
- Tavily API key
- Firebase account and project

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd supplygenie-metamorphs-idealize-merge
```

### 2. Backend Setup (AI Service)

```bash
cd supplygenie-metamorphs-idealize-ai-service-main

# Install dependencies
pip install -r requirements.txt
# or using uv (recommended)
uv sync

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys:
# OPENAI_API_KEY=your_openai_key
# TAVILY_API_KEY=your_tavily_key
# MONGO_URI=your_mongodb_uri

# Run the service
uvicorn src.main:app --reload --host 0.0.0.0 --port 8080
```

The AI service will be available at `http://localhost:8080`

### 3. Frontend Setup

```bash
cd supplygenie-metamorphs-idealize-frontend/supplygenie-frontend

# Install dependencies
pnpm install
# or npm install

# Set up environment variables
# Create .env.local file with:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# MONGODB_URI=your_mongodb_uri
# SUPPLY_CHAIN_API_URL=http://localhost:8080

# Run the frontend
pnpm dev
# or npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📖 API Documentation

### AI Service Endpoints

**Base URL**: `http://localhost:8080`

- **Interactive Documentation**: `http://localhost:8080/docs`
- **ReDoc**: `http://localhost:8080/redoc`

#### Main Endpoint

**POST** `/api/v1/supply-chain/recommendations`

Get AI-powered supplier recommendations based on requirements.

**Request:**
```json
{
  "query": "I need electronics manufacturers in Asia with ISO certifications",
  "chat_history": [] // optional
}
```

**Response:**
```json
{
  "suppliers": [
    {
      "company_name": "TechSource Electronics",
      "location": "Shenzhen, China",
      "rating": 4.8,
      "price_range": "$50-100 USD",
      "lead_time": "15-20 days",
      "moq": "1000 units",
      "certifications": ["ISO 9001", "RoHS"],
      "specialties": ["Electronics", "IoT Components"],
      "response_time": "2-4 hours",
      "contact": "sales@techsource.com"
    }
  ]
}
```

## 💡 Usage Examples

### Example Query
"I need suppliers for electronic components, specifically microcontrollers and sensors. Looking for reliable manufacturers in Asia with competitive pricing, ISO certifications, and fast response times."

### Example Response
```
🏭 Found 3 suppliers matching your criteria:

1. TechSource Electronics (Shenzhen, China)
   ⭐ Rating: 4.8/5 | 📅 Lead Time: 15-20 days
   💰 Price Range: Competitive
   📞 Contact: +86-755-xxxx | tech@techsource.com

2. Pacific Components (Taipei, Taiwan)
   ⭐ Rating: 4.6/5 | 📅 Lead Time: 10-15 days
   💰 Price Range: Premium
   🌐 Website: www.pacificcomp.tw

3. ElectroAsia Manufacturing (Bangkok, Thailand)
   ⭐ Rating: 4.4/5 | 📅 Lead Time: 20-25 days
   💰 Price Range: Budget-friendly
   📧 Contact: sales@electroasia.th
```

## 🐳 Docker Deployment

### Backend
```bash
cd supplygenie-metamorphs-idealize-ai-service-main
docker build -t supply-genie-backend .
docker run -p 8080:8080 --env-file .env supply-genie-backend
```

### Full Stack with Docker Compose
```yaml
version: "3.8"
services:
  backend:
    build: ./supplygenie-metamorphs-idealize-ai-service-main
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - MONGO_URI=${MONGO_URI}

  frontend:
    build: ./supplygenie-metamorphs-idealize-frontend/supplygenie-frontend
    ports:
      - "3000:3000"
    environment:
      - SUPPLY_CHAIN_API_URL=http://backend:8080
    depends_on:
      - backend
```

## 🔍 How It Works

1. **User Input**: Users interact via the chat interface or direct API calls
2. **AI Processing**: LangChain agents analyze requirements and search criteria
3. **Multi-Source Search**: System queries MongoDB database and performs web research
4. **Data Extraction**: AI extracts detailed supplier information from multiple sources
5. **Intelligent Ranking**: Suppliers are evaluated and ranked based on user criteria
6. **Response Generation**: Structured supplier recommendations with complete details

## 🧪 Testing

### Backend Tests
```bash
cd supplygenie-metamorphs-idealize-ai-service-main
pytest
pytest --cov=src
```

### Frontend Tests
```bash
cd supplygenie-metamorphs-idealize-frontend/supplygenie-frontend
pnpm test
# or npm test
```

## 🔒 Security & Environment Variables

### Required Environment Variables

**Backend (.env):**
```env
OPENAI_API_KEY=sk-proj-your-openai-key
TAVILY_API_KEY=tvly-dev-your-tavily-key
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
MODEL_NAME=gpt-4o-mini
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
MONGODB_URI=your_mongodb_uri
SUPPLY_CHAIN_API_URL=http://localhost:8080
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `http://localhost:8080/docs`
- Review the logs for error details
- Ensure all environment variables are set correctly
- Verify MongoDB connection and API keys

**Built with ❤️ by the SupplyGenie Team**
