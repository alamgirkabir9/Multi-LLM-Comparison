import os
from typing import List, Dict, Any, Optional
import time
import asyncio
from fastapi import FastAPI, Request, Form, HTTPException, Depends, Cookie
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import secrets
from starlette.middleware.sessions import SessionMiddleware
app = FastAPI(title="Multi-LLM Comparison Dashboard")

# Add middleware
app.add_middleware(SessionMiddleware, secret_key=secrets.token_urlsafe(32))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")
from dotenv import load_dotenv

load_dotenv()
# Default API Keys configuration
DEFAULT_API_KEYS = {
    "llama3-70b-8192": os.environ.get("LLAMA3_70B_API_KEY", ""),
    "llama-3.1-8b-instant": os.environ.get("LLAMA_3_1_8B_API_KEY", ""),
    "mistral-saba-24b": os.environ.get("MISTRAL_SABA_API_KEY", ""),
    "qwen-qwq-32b": os.environ.get("QWEN_QWQ_API_KEY", ""),
    "deepseek-r1-distill-llama-70b": os.environ.get("DEEPSEEK_API_KEY", ""),
    "gpt-3.5-turbo": os.environ.get("OPENAI_API_KEY", "")
}

# Model configuration
MODELS = {
    "llama3-70b-8192": {
        "name": "LLaMA 3 70B",
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "description": "Meta's most powerful general-purpose LLM with 70B parameters",
        "color": "#4A76E8",
        "icon": "brain"
    },
    "llama-3.1-8b-instant": {
        "name": "LLaMA 3.1 8B",
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "description": "Smaller and faster LLaMA 3 model optimized for instant responses",
        "color": "#52C0FF",
        "icon": "bolt"
    },  
    "mistral-saba-24b": {
        "name": "Mistral Saba 24B",
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "description": "Mistral's production model balancing power and speed",
        "color": "#6554C0",
        "icon": "wind"
    },
    "qwen-qwq-32b": {
        "name": "QwQ 32B",
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "description": "Alibaba's general-purpose model with strong reasoning capabilities",
        "color": "#F66A0A",
        "icon": "cloud"
    },
    "deepseek-r1-distill-llama-70b": {
        "name": "DeepSeek R1 Distill 70B",
        "endpoint": "https://api.groq.com/openai/v1/chat/completions",
        "description": "Powerful distilled model with strong coding and reasoning abilities",
        "color": "#28A745",
        "icon": "code"
    },
    "gpt-3.5-turbo": {
    "name": "ChatGPT 3.5 Turbo",
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "description": "OpenAI's faster and cost-effective model suitable for everyday tasks.",
    "color": "#bae3ff",
    "icon": "zap"
}
}

QUERY_HISTORY = []
MODEL_RATINGS = {model_id: {"total_rating": 0, "count": 0, "avg_rating": 0, "response_times": []} for model_id in MODELS}

# Model for API key updates
class ApiKeyUpdate(BaseModel):
    model_id: str
    api_key: str

# Model for rating requests
class RatingRequest(BaseModel):
    model_id: str
    query_index: int
    rating: int

# Dependency to get API keys from session
async def get_api_keys(request: Request) -> Dict[str, str]:
    session = request.session
    if "api_keys" not in session:
        session["api_keys"] = DEFAULT_API_KEYS.copy()
    return session["api_keys"]

# Helper to save API keys to session
async def save_api_key(request: Request, model_id: str, api_key: str):
    session = request.session
    if "api_keys" not in session:
        session["api_keys"] = DEFAULT_API_KEYS.copy()
    session["api_keys"][model_id] = api_key
    request.session["api_keys"] = session["api_keys"]

@app.get("/", response_class=HTMLResponse)
async def home(request: Request, api_keys: Dict[str, str] = Depends(get_api_keys)):
    return templates.TemplateResponse("index.html", {
        "request": request, 
        "models": MODELS,
        "api_keys": api_keys,
        "page_title": "Multi-LLM Comparison Dashboard"
    })

@app.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request, api_keys: Dict[str, str] = Depends(get_api_keys)):
    return templates.TemplateResponse("settings.html", {
        "request": request, 
        "models": MODELS,
        "api_keys": api_keys,
        "page_title": "API Settings"
    })

@app.post("/api/settings/keys")
async def update_api_key(request: Request, data: ApiKeyUpdate):
    await save_api_key(request, data.model_id, data.api_key)
    return {"success": True, "message": f"API key for {MODELS[data.model_id]['name']} updated successfully"}

async def query_model(model_id: str, query: str, api_keys: Dict[str, str]) -> Dict[str, Any]:
    model = MODELS[model_id]
    
    # Check if API key is available
    api_key = api_keys.get(model_id, "")
    if not api_key:
        return {
            "model_id": model_id,
            "model_name": model["name"],
            "success": False,
            "error": "API key not configured. Please add your API key in settings."
        }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_id,
        "messages": [{"role": "user", "content": query}],
        "temperature": 0.7,
        "max_tokens": 500
    }

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(model["endpoint"], headers=headers, json=payload)
        duration = time.time() - start

        MODEL_RATINGS[model_id]["response_times"].append(duration)

        if response.status_code == 200:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            input_tokens = data.get("usage", {}).get("prompt_tokens", len(query.split()))
            output_tokens = data.get("usage", {}).get("completion_tokens", len(content.split()))

            return {
                "model_id": model_id,
                "model_name": model["name"],
                "success": True,
                "response": content,
                "metrics": {
                    "response_time_seconds": round(duration, 2),
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens
                },
                "color": model["color"],
                "icon": model["icon"]
            }
        else:
            error_msg = f"API Error ({response.status_code}): {response.text}"
            return {
                "model_id": model_id,
                "model_name": model["name"],
                "success": False, 
                "error": error_msg,
                "color": model["color"],
                "icon": model["icon"]
            }
    except Exception as e:
        return {
            "model_id": model_id, 
            "model_name": model["name"],
            "success": False, 
            "error": f"Request error: {str(e)}",
            "color": model["color"],
            "icon": model["icon"]
        }


@app.post("/compare", response_class=HTMLResponse)
async def compare_models(
    request: Request, 
    query: str = Form(...), 
    models: List[str] = Form(...),
    api_keys: Dict[str, str] = Depends(get_api_keys)
):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query is empty.")
    if not models:
        raise HTTPException(status_code=400, detail="No models selected.")

    tasks = [query_model(model_id, query, api_keys) for model_id in models]
    results = await asyncio.gather(*tasks)

    query_result = {
        "query": query,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "query_index": len(QUERY_HISTORY),
        "results": results
    }
    QUERY_HISTORY.append(query_result)

    return templates.TemplateResponse("results.html", {
        "request": request,
        "query": query,
        "results": results,
        "query_index": query_result["query_index"],
        "page_title": "Comparison Results"
    })


@app.get("/history", response_class=HTMLResponse)
async def view_history(request: Request):
    performance = calculate_model_performance()
    return templates.TemplateResponse("history.html", {
        "request": request,
        "history": QUERY_HISTORY,
        "model_performance": performance,
        "page_title": "Query History"
    })


@app.get("/leaderboard", response_class=HTMLResponse)
async def view_leaderboard(request: Request):
    perf = calculate_model_performance()
    ranked = sorted(perf.items(), key=lambda x: (x[1]["avg_rating"] or 0, -(x[1]["avg_response_time"] or 0)), reverse=True)
    return templates.TemplateResponse("leaderboard.html", {
        "request": request,
        "ranked_models": ranked,
        "models": MODELS,
        "page_title": "Model Leaderboard"
    })


@app.post("/api/rate")
async def rate_response(rating_data: RatingRequest):
    model_id = rating_data.model_id
    idx = rating_data.query_index
    rating = rating_data.rating

    if model_id not in MODEL_RATINGS or idx >= len(QUERY_HISTORY):
        raise HTTPException(status_code=404, detail="Invalid model or query index.")

    if not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be 1-5.")

    for result in QUERY_HISTORY[idx]["results"]:
        if result["model_id"] == model_id:
            result["rating"] = rating

    rating_info = MODEL_RATINGS[model_id]
    rating_info["total_rating"] += rating
    rating_info["count"] += 1
    rating_info["avg_rating"] = rating_info["total_rating"] / rating_info["count"]

    return {"success": True, "message": "Rating submitted successfully"}


@app.delete("/api/history/clear")
async def clear_history():
    global QUERY_HISTORY
    QUERY_HISTORY = []
    for m in MODEL_RATINGS:
        MODEL_RATINGS[m].update({"total_rating": 0, "count": 0, "avg_rating": 0, "response_times": []})
    return {"success": True, "message": "History and ratings cleared successfully"}


def calculate_model_performance():
    stats = {}
    for model_id, rating in MODEL_RATINGS.items():
        times = rating["response_times"]
        avg_time = sum(times) / len(times) if times else None
        stats[model_id] = {
            "name": MODELS[model_id]["name"],
            "description": MODELS[model_id]["description"],
            "queries_count": len(times),
            "avg_response_time": avg_time,
            "total_rating": rating["total_rating"],
            "ratings_count": rating["count"],
            "avg_rating": rating["avg_rating"],
            "color": MODELS[model_id]["color"],
            "icon": MODELS[model_id]["icon"]
        }
    return stats


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)