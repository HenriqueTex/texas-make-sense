from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.routes import system, projects, predict, train, similarity

app = FastAPI(
    title="Make Sense Active Learning API",
    description="Backend para suporte a predições, retreinamento e augmentation",
    version="1.0.0"
)

# Cofigurando o CORS para permitir requisições do frontend (React local no :3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"], # Em prod, restrinja o '*'
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router, prefix="/api", tags=["System"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(predict.router, prefix="/api", tags=["Predict"])
app.include_router(train.router, prefix="/api", tags=["Train"])
app.include_router(similarity.router, prefix="/api", tags=["Similarity"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
