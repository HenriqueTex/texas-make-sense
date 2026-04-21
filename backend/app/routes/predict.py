from fastapi import APIRouter, File, UploadFile
from ultralytics import YOLO
import io
import cv2
import numpy as np

router = APIRouter()

# Vamos manter o modelo leve, pre-treinado na memória do servidor
# Se for a primeira vez que você roda, ele baixará o arquivo yolov8n.pt (~6MB) via internet.
model = YOLO("yolov8n.pt") 

@router.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    """
    Recebe um buffer de File do frontend, decodifica no formato OpenCV
    e joga no modelo YOLO para prever o objeto.
    """
    # 1. Carregar os bytes de imagem para array numpy/OpenCV
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. Fazer inferência
    results = model(image)
    
    # 3. Converter os reultados para um JSON tratável para a UI
    predictions = []
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # coords normalizas
            b = box.xywhn[0].tolist()  # center_x, center_y, width, height (normalized)
            
            # Precisamos converter o formato do YOLO (x_center, y_center, w, h)
            # Para o formato do Make Sense [x, y, width, height] (canto superior esquerdo)
            x_center, y_center, w, h = b
            x_top_left = x_center - (w / 2)
            y_top_left = y_center - (h / 2)
            
            cls_id = int(box.cls[0].item())
            class_name = model.names[cls_id]
            conf = float(box.conf[0].item())
            
            if conf > 0.4: # Filtramos só os mais confiantes (>40%)
                predictions.append({
                    "suggestion": class_name,
                    "confidence": conf,
                    "rect": {
                        "x": x_top_left,
                        "y": y_top_left,
                        "width": w,
                        "height": h
                    }
                })
                
    return {"status": "success", "predictions": predictions}
