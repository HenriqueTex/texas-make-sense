from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "message": "Make Sense Active Learning Backend is running!"}
