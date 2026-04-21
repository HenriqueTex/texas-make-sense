from fastapi import APIRouter, File, UploadFile, Form
from pydantic import BaseModel
import shutil
from typing import Optional

from app.services.workspace import get_project_images_dir, get_project_workspace, get_workspace_root

router = APIRouter()

# Pasta onde guardaremos os dados enviados pelo Front
get_workspace_root().mkdir(parents=True, exist_ok=True)

class ProjectMetaData(BaseModel):
    id: str
    name: str
    type: str

@router.post("/projects/{project_id}/sync")
async def sync_project_metadata(project_id: str, data: dict):
    """
    Sincroniza os metadados do projeto e as anotações (labels).
    """
    project_dir = get_project_workspace(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Salvando as anotações num arquivo (ex: annotations.json)
    import json
    with open(project_dir / "annotations.json", "w", encoding="utf-8") as f:
        json.dump(data, f)
        
    return {"status": "success", "message": f"Project {project_id} synced."}

@router.post("/projects/{project_id}/upload_image")
async def upload_project_image(
    project_id: str,
    file: UploadFile = File(...),
    image_id: Optional[str] = Form(default=None)
):
    """
    Faz o upload da imagem crua do Frontend para podermos usar no treino.
    """
    images_dir = get_project_images_dir(project_id)
    images_dir.mkdir(parents=True, exist_ok=True)

    if image_id:
        image_dir = images_dir / image_id
        if image_dir.exists():
            shutil.rmtree(image_dir)
        image_dir.mkdir(parents=True, exist_ok=True)
        file_path = image_dir / file.filename
    else:
        # Backward-compatible fallback for callers that still upload by plain filename only.
        file_path = images_dir / file.filename
    
    # Salva a imagem enviada no servidor
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"status": "success", "filename": file.filename, "image_id": image_id}
