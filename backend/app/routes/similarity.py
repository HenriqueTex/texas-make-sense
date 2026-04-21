from fastapi import APIRouter, HTTPException

from app.services.similarity import order_project_images

router = APIRouter()


@router.post("/projects/{project_id}/similarity/order")
async def order_project_images_by_similarity(project_id: str):
    try:
        result = order_project_images(project_id)
        return {
            "status": "success",
            **result
        }
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Similarity ordering failed: {str(error)}"
        ) from error
