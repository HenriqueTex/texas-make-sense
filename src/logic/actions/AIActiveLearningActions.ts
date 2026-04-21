import { ImageData, LabelName, LabelRect } from '../../store/labels/types';
import { v4 as uuidv4 } from 'uuid';
import { LabelStatus } from '../../data/enums/LabelStatus';
import { findLast } from 'lodash';
import { LabelsSelector } from '../../store/selectors/LabelsSelector';
import { store } from '../../index';
import { updateImageDataById } from '../../store/labels/actionCreators';
import { AISelector } from '../../store/selectors/AISelector';
import { updateActivePopupType } from '../../store/general/actionCreators';
import { PopupWindowType } from '../../data/enums/PopupWindowType';
import { AIActions } from './AIActions';
import { updateSuggestedLabelList } from '../../store/ai/actionCreators';
import axios from 'axios';
import { FileUtil } from '../../utils/FileUtil';

export interface BackendPrediction {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    suggestion: string;
}

export class AIActiveLearningActions {
    public static predict(imageData: ImageData): void {
        store.dispatch(updateActivePopupType(PopupWindowType.LOADER));
        
        const formData = new FormData();
        formData.append('file', imageData.fileData, imageData.fileData.name);

        axios.post('http://localhost:8000/api/predict', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((response) => {
            const predictions: BackendPrediction[] = response.data.predictions.map((p: any) => ({
                x: p.rect.x,
                y: p.rect.y,
                width: p.rect.width,
                height: p.rect.height,
                confidence: p.confidence,
                suggestion: p.suggestion
            }));

            const suggestedLabelNames = AIActiveLearningActions
                .extractNewSuggestedLabelNames(LabelsSelector.getLabelNames(), predictions);
            const rejectedLabelNames = AISelector.getRejectedSuggestedLabelList();

            const newlySuggestedNames = AIActions.excludeRejectedLabelNames(suggestedLabelNames, rejectedLabelNames);
            if (newlySuggestedNames.length > 0) {
                store.dispatch(updateSuggestedLabelList(newlySuggestedNames));
                store.dispatch(updateActivePopupType(PopupWindowType.SUGGEST_LABEL_NAMES));
            } else {
                store.dispatch(updateActivePopupType(null));
            }
            AIActiveLearningActions.saveRectPredictions(imageData, predictions);
        }).catch((err) => {
            console.error("Erro no Active Learning Backend:", err);
            store.dispatch(updateActivePopupType(null));
            alert("Erro ao conectar no servidor Backend. Verifique se ele está rodando na porta 8000.");
        });
    }

    public static saveRectPredictions(imageData: ImageData, predictions: BackendPrediction[]) {
        const predictedLabels: LabelRect[] = AIActiveLearningActions.mapPredictionsToRectLabels(predictions);
        const nextImageData: ImageData = {
            ...imageData,
            labelRects: imageData.labelRects.concat(predictedLabels)
        };
        store.dispatch(updateImageDataById(imageData.id, nextImageData));
    }

    private static mapPredictionsToRectLabels(predictions: BackendPrediction[]): LabelRect[] {
        return predictions.map((prediction: BackendPrediction) => {
            return {
                id: uuidv4(),
                labelIndex: null,
                labelId: null,
                rect: {
                    x: prediction.x,
                    y: prediction.y,
                    width: prediction.width,
                    height: prediction.height,
                },
                isVisible: true,
                isCreatedByAI: true,
                status: LabelStatus.UNDECIDED,
                suggestedLabel: prediction.suggestion
            }
        })
    }

    public static extractNewSuggestedLabelNames(labels: LabelName[], predictions: BackendPrediction[]): string[] {
        return predictions.reduce((acc: string[], prediction: BackendPrediction) => {
            if (!acc.includes(prediction.suggestion) && !findLast(labels, {name: prediction.suggestion})) {
                acc.push(prediction.suggestion)
            }
            return acc;
        }, [])
    }

    public static triggerTrain(projectId: string | null): void {
        if (!projectId) {
            alert("Erro: Projeto Base não encontrado para treinamento.");
            return;
        }

        axios.post(`http://localhost:8000/api/train/${projectId}`)
             .then((res) => {
                 alert("O retreinamento foi iniciado no Backend (Servidor). Cheque o console do backend para o log do Yolo.");
             })
             .catch((err) => {
                 console.error("Erro ao treinar", err);
                 alert("Erro ao conectar no servidor de Treinamento Active Learning.");
             });
    }
}
