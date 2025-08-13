# ARIA AI Service

Core AI service for the ARIA healthcare platform, providing machine learning-powered medical analysis for UMaT students.

## Features

- Real machine learning medical diagnosis using TF-IDF and similarity scoring
- RAG (Retrieval-Augmented Generation) for medical knowledge retrieval
- Ghana-specific medical knowledge base
- Advanced symptom analysis with confidence scoring

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python src/main.py
```

3. Access the API at `http://localhost:8000`
4. View API docs at `http://localhost:8000/docs`

## API Endpoints

- `POST /analyze-advanced` - Advanced symptom analysis with ML
- `POST /analyze-ml` - Direct ML analysis 
- `POST /rag/search` - Search medical knowledge base
- `GET /health` - Health check

## Architecture

- `src/main.py` - FastAPI application entry point
- `src/models/` - ML models and AI implementations
- `src/services/` - Business logic services (RAG, etc.)
- `src/data/` - Medical knowledge base and training data