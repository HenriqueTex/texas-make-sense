from fastapi import APIRouter, BackgroundTasks
from app.services.workspace import get_project_workspace

router = APIRouter()

# Dicionário de status em memória apenas para a PoC
# O certo seria salvar no banco de dados (SQLite/PostgreSQL) ou no Redis
training_jobs = {}

def execute_training(project_id: str):
    """
    Task de fundo que roda o YOLO Train.
    """
    workspace_dir = get_project_workspace(project_id)
    dataset_yaml = workspace_dir / "dataset.yaml"
    
    # 1. Checa se tem os requisitos pra treinar
    if not workspace_dir.exists():
        training_jobs[project_id] = "failed: workspace not found"
        return
        
    try:
        # Aqui ficará a chamada para o Yolo.
        # ex:
        # from ultralytics import YOLO
        # model = YOLO('yolov8n.yaml')
        # results = model.train(data=dataset_yaml, epochs=5, imgsz=640)
        
        training_jobs[project_id] = "running (stubbed)"
        
        # Simulação
        import time
        for i in range(1, 11):
            time.sleep(1)
            training_jobs[project_id] = f"running (epoch {i}/10)"
            
        training_jobs[project_id] = "completed"
        
    except Exception as e:
        training_jobs[project_id] = f"failed: {str(e)}"


@router.post("/train/{project_id}")
async def start_training(project_id: str, background_tasks: BackgroundTasks):
    """
    Inicia o retreinamento do modelo asssíncronamente com os dados 
    sincronizados da interface (Make Sense).
    """
    # Checando se já existe um treino atural
    if training_jobs.get(project_id, "").startswith("running"):
        return {"status": "error", "message": "Training already in progress."}
        
    training_jobs[project_id] = "starting"
    background_tasks.add_task(execute_training, project_id)
    
    return {"status": "success", "message": "Training job started."}

@router.get("/train/{project_id}/status")
async def get_training_status(project_id: str):
    """
    Acompanha o progresso atual.
    """
    status = training_jobs.get(project_id, "not started")
    return {"status": status}
