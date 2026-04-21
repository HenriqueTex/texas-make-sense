import albumentations as A
import cv2
from app.services.workspace import get_project_images_dir, get_project_workspace

def augment_project_dataset(project_id: str):
    """
    Roda data augmentation para expandir as imagens do projeto
    focado na melhoria do Active Learning.
    """
    workspace_dir = get_project_workspace(project_id)
    images_dir = get_project_images_dir(project_id)
    aug_dir = workspace_dir / "augmented_images"
    
    if not images_dir.exists():
        return
        
    aug_dir.mkdir(parents=True, exist_ok=True)
    
    # Exemplo de Pipeline usando albumentations (pode escalar)
    transform = A.Compose([
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(p=0.2),
        A.GaussianBlur(p=0.2), # Ajuda no foco reverso
    ], bbox_params=A.BboxParams(format='yolo', label_fields=['class_labels']))
    
    for img_path in images_dir.rglob("*"):
        if not img_path.is_file():
            continue

        image = cv2.imread(str(img_path))
        
        # Em um cenario real de Active Learning, aqui cruzariamos o JSON de 
        # annotations com a imagem real antes de rodar o transform(...)
        # para que os rects (bounding boxes) sejam virados e ofuscados proporcionalmente.
        # ex:
        # annotations = load_yolo_labels(img_name)
        # transformed = transform(image=image, bboxes=annotations['boxes'], class_labels=annotations['classes'])
        # ...
        pass
    
    return {"status": "success", "augmented_records_count": 0}
