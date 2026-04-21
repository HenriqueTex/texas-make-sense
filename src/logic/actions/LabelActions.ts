import {LabelsSelector} from '../../store/selectors/LabelsSelector';
import {ImageData, LabelLine, LabelName, LabelPoint, LabelPolygon, LabelRect} from '../../store/labels/types';
import {filter} from 'lodash';
import {store} from '../../index';
import {undoLabelsState, updateActiveLabelId, updateActiveLabelNameId, updateHighlightedLabelId, updateImageData, updateImageDataById} from '../../store/labels/actionCreators';
import {LabelType} from '../../data/enums/LabelType';
import {LabelUtil} from '../../utils/LabelUtil';
import {LabelStatus} from '../../data/enums/LabelStatus';
import {v4 as uuidv4} from 'uuid';
import {updateCategorizationModeStatus} from '../../store/general/actionCreators';
import {GeneralSelector} from '../../store/selectors/GeneralSelector';
import {submitNewNotification} from '../../store/notifications/actionCreators';
import {NotificationType} from '../../data/enums/NotificationType';
import {ImageActions} from './ImageActions';

type CategorizableAnnotation = LabelRect | LabelPoint | LabelLine | LabelPolygon;

export class LabelActions {
    public static undoLastAction() {
        store.dispatch(undoLabelsState());
    }

    public static deleteActiveLabel() {
        const activeImageData: ImageData = LabelsSelector.getActiveImageData();
        const activeLabelId: string = LabelsSelector.getActiveLabelId();
        LabelActions.deleteImageLabelById(activeImageData.id, activeLabelId);
    }

    public static deleteImageLabelById(imageId: string, labelId: string) {
        switch (LabelsSelector.getActiveLabelType()) {
            case LabelType.POINT:
                LabelActions.deletePointLabelById(imageId, labelId);
                break;
            case LabelType.RECT:
                LabelActions.deleteRectLabelById(imageId, labelId);
                break;
            case LabelType.POLYGON:
                LabelActions.deletePolygonLabelById(imageId, labelId);
                break;
        }
    }

    public static deleteRectLabelById(imageId: string, labelRectId: string) {
        const imageData: ImageData = LabelsSelector.getImageDataById(imageId);
        const newImageData = {
            ...imageData,
            labelRects: filter(imageData.labelRects, (currentLabel: LabelRect) => {
                return currentLabel.id !== labelRectId;
            })
        };
        store.dispatch(updateImageDataById(imageData.id, newImageData));
    }

    public static deletePointLabelById(imageId: string, labelPointId: string) {
        const imageData: ImageData = LabelsSelector.getImageDataById(imageId);
        const newImageData = {
            ...imageData,
            labelPoints: filter(imageData.labelPoints, (currentLabel: LabelPoint) => {
                return currentLabel.id !== labelPointId;
            })
        };
        store.dispatch(updateImageDataById(imageData.id, newImageData));
    }

    public static deleteLineLabelById(imageId: string, labelLineId: string) {
        const imageData: ImageData = LabelsSelector.getImageDataById(imageId);
        const newImageData = {
            ...imageData,
            labelLines: filter(imageData.labelLines, (currentLabel: LabelLine) => {
                return currentLabel.id !== labelLineId;
            })
        };
        store.dispatch(updateImageDataById(imageData.id, newImageData));
    }

    public static deletePolygonLabelById(imageId: string, labelPolygonId: string) {
        const imageData: ImageData = LabelsSelector.getImageDataById(imageId);
        const newImageData = {
            ...imageData,
            labelPolygons: filter(imageData.labelPolygons, (currentLabel: LabelPolygon) => {
                return currentLabel.id !== labelPolygonId;
            })
        };
        store.dispatch(updateImageDataById(imageData.id, newImageData));
    }

    public static toggleLabelVisibilityById(imageId: string, labelId: string) {
        const imageData: ImageData = LabelsSelector.getImageDataById(imageId);
        const newImageData = {
            ...imageData,
            labelPoints: imageData.labelPoints.map((labelPoint: LabelPoint) => {
                return labelPoint.id === labelId ? LabelUtil.toggleAnnotationVisibility(labelPoint) : labelPoint
            }),
            labelRects: imageData.labelRects.map((labelRect: LabelRect) => {
                return labelRect.id === labelId ? LabelUtil.toggleAnnotationVisibility(labelRect) : labelRect
            }),
            labelPolygons: imageData.labelPolygons.map((labelPolygon: LabelPolygon) => {
                return labelPolygon.id === labelId ? LabelUtil.toggleAnnotationVisibility(labelPolygon) : labelPolygon
            }),
            labelLines: imageData.labelLines.map((labelLine: LabelLine) => {
                return labelLine.id === labelId ? LabelUtil.toggleAnnotationVisibility(labelLine) : labelLine
            }),
        };
        store.dispatch(updateImageDataById(imageData.id, newImageData));
    }

    public static removeLabelNames(labelNamesIds: string[]) {
        const imagesData: ImageData[] = LabelsSelector.getImagesData();
        const newImagesData: ImageData[] = imagesData.map((imageData: ImageData) => {
            return LabelActions.removeLabelNamesFromImageData(imageData, labelNamesIds);
        });
        store.dispatch(updateImageData(newImagesData))
    }

    private static removeLabelNamesFromImageData(imageData: ImageData, labelNamesIds: string[]): ImageData {
        return {
            ...imageData,
            labelRects: imageData.labelRects.map((labelRect: LabelRect) => {
                if (labelNamesIds.includes(labelRect.id)) {
                    return {
                        ...labelRect,
                        id: null
                    }
                } else {
                    return labelRect
                }
            }),
            labelPoints: imageData.labelPoints.map((labelPoint: LabelPoint) => {
                if (labelNamesIds.includes(labelPoint.id)) {
                    return {
                        ...labelPoint,
                        id: null
                    }
                } else {
                    return labelPoint
                }
            }),
            labelPolygons: imageData.labelPolygons.map((labelPolygon: LabelPolygon) => {
                if (labelNamesIds.includes(labelPolygon.id)) {
                    return {
                        ...labelPolygon,
                        id: null
                    }
                } else {
                    return labelPolygon
                }
            }),
            labelNameIds: imageData.labelNameIds.filter((labelNameId: string) => {
                return !labelNamesIds.includes(labelNameId)
            })
        }
    }

    public static labelExistsInLabelNames(label: string): boolean {
        const labelNames: LabelName[] = LabelsSelector.getLabelNames();
        return labelNames
            .map((labelName: LabelName) => labelName.name)
            .includes(label)
    }

    public static reapplyLabelsFromPreviousImage(): void {
        const activeImageIndex = LabelsSelector.getActiveImageIndex();
        if (activeImageIndex === null || activeImageIndex <= 0) {
            return;
        }

        const currentImageData = LabelsSelector.getImageDataByIndex(activeImageIndex);
        const previousImageData = LabelsSelector.getImageDataByIndex(activeImageIndex - 1);

        const nextImageData: ImageData = {
            ...currentImageData,
            labelRects: previousImageData.labelRects
                .filter((labelRect: LabelRect) => labelRect.status === LabelStatus.ACCEPTED)
                .map((labelRect: LabelRect) => ({
                    ...labelRect,
                    id: uuidv4(),
                    isCreatedByAI: false,
                    status: LabelStatus.ACCEPTED,
                    suggestedLabel: null
                })),
            labelPoints: previousImageData.labelPoints
                .filter((labelPoint: LabelPoint) => labelPoint.status === LabelStatus.ACCEPTED)
                .map((labelPoint: LabelPoint) => ({
                    ...labelPoint,
                    id: uuidv4(),
                    isCreatedByAI: false,
                    status: LabelStatus.ACCEPTED,
                    suggestedLabel: null
                })),
            labelLines: previousImageData.labelLines.map((labelLine: LabelLine) => ({
                ...labelLine,
                id: uuidv4()
            })),
            labelPolygons: previousImageData.labelPolygons.map((labelPolygon: LabelPolygon) => ({
                ...labelPolygon,
                id: uuidv4()
            })),
            labelNameIds: [...previousImageData.labelNameIds]
        };

        store.dispatch(updateActiveLabelId(null));
        store.dispatch(updateHighlightedLabelId(null));
        store.dispatch(updateImageDataById(currentImageData.id, nextImageData));
    }

    public static toggleCategorizationMode(): void {
        if (GeneralSelector.getCategorizationModeStatus()) {
            LabelActions.stopCategorizationMode();
        } else {
            LabelActions.startCategorizationMode();
        }
    }

    public static startCategorizationMode(): void {
        const activeLabelType = LabelsSelector.getActiveLabelType();
        if (!LabelActions.isCategorizationSupported(activeLabelType)) {
            LabelActions.notify(
                NotificationType.WARNING,
                'Categorization is unavailable',
                'Switch to bounding boxes, points, lines, or polygons before using categorization.'
            );
            return;
        }

        const hasShortcut = LabelsSelector.getLabelNames().some((labelName: LabelName) =>
            (labelName.shortcut || '').trim().length > 0
        );
        if (!hasShortcut) {
            LabelActions.notify(
                NotificationType.WARNING,
                'No label shortcuts available',
                'Add at least one label shortcut before starting categorization.'
            );
            return;
        }

        const startIndex = LabelsSelector.getActiveImageIndex() ?? 0;
        if (!LabelActions.focusFirstAvailableCategorizationTarget(startIndex)) {
            LabelActions.notify(
                NotificationType.WARNING,
                'No vectors available',
                'There are no visible vectors to categorize from the current image onward.'
            );
            return;
        }

        store.dispatch(updateCategorizationModeStatus(true));
    }

    public static stopCategorizationMode(): void {
        store.dispatch(updateCategorizationModeStatus(false));
    }

    public static applyShortcutToCategorization(shortcut: string): boolean {
        if (!GeneralSelector.getCategorizationModeStatus()) {
            return false;
        }

        const normalizedShortcut = shortcut.trim().toLowerCase();
        if (normalizedShortcut.length !== 1) {
            return false;
        }

        const activeLabelType = LabelsSelector.getActiveLabelType();
        if (!LabelActions.isCategorizationSupported(activeLabelType)) {
            LabelActions.stopCategorizationMode();
            LabelActions.notify(
                NotificationType.WARNING,
                'Categorization stopped',
                'The current label type no longer supports categorization shortcuts.'
            );
            return false;
        }

        const targetLabelName = LabelsSelector.getLabelNames().find((labelName: LabelName) =>
            (labelName.shortcut || '').trim().toLowerCase() === normalizedShortcut
        );
        if (!targetLabelName) {
            return false;
        }

        const activeImageIndex = LabelsSelector.getActiveImageIndex();
        if (activeImageIndex === null) {
            return false;
        }

        const activeImageData = LabelsSelector.getImageDataByIndex(activeImageIndex);
        const orderedAnnotations = LabelActions.getOrderedAnnotations(activeImageData, activeLabelType);
        if (orderedAnnotations.length === 0) {
            return LabelActions.focusFirstAvailableCategorizationTarget(activeImageIndex);
        }

        const currentAnnotation = LabelActions.getCurrentCategorizationTarget(orderedAnnotations);
        if (!currentAnnotation) {
            return LabelActions.focusCategorizationTarget(activeImageIndex, orderedAnnotations[0].id);
        }

        store.dispatch(updateImageDataById(
            activeImageData.id,
            LabelActions.updateAnnotationLabel(activeImageData, activeLabelType, currentAnnotation.id, targetLabelName.id)
        ));
        store.dispatch(updateActiveLabelNameId(targetLabelName.id));
        store.dispatch(updateHighlightedLabelId(null));

        LabelActions.advanceCategorizationTarget(activeImageIndex, currentAnnotation.id);
        return true;
    }

    public static applyCurrentImageLabelsFromPreviousImage(): void {
        const activeImageIndex = LabelsSelector.getActiveImageIndex();
        const activeLabelType = LabelsSelector.getActiveLabelType();

        if (activeImageIndex === null || activeImageIndex <= 0 || !LabelActions.isCategorizationSupported(activeLabelType)) {
            return;
        }

        const currentImageData = LabelsSelector.getImageDataByIndex(activeImageIndex);
        const previousImageData = LabelsSelector.getImageDataByIndex(activeImageIndex - 1);
        const currentAnnotations = LabelActions.getOrderedAnnotations(currentImageData, activeLabelType);
        const previousAnnotations = LabelActions.getOrderedAnnotations(previousImageData, activeLabelType);

        if (currentAnnotations.length === 0 || previousAnnotations.length === 0) {
            return;
        }

        const nextImageData = LabelActions.applyPreviousLabelsToCurrentImage(
            currentImageData,
            previousAnnotations,
            activeLabelType
        );

        store.dispatch(updateImageDataById(currentImageData.id, nextImageData));
        if (previousAnnotations[0]?.labelId) {
            store.dispatch(updateActiveLabelNameId(previousAnnotations[0].labelId));
        }

        const activeAnnotationId = LabelsSelector.getActiveLabelId();
        const hasActiveAnnotation = !!activeAnnotationId && currentAnnotations.some((annotation) => annotation.id === activeAnnotationId);
        if (!hasActiveAnnotation) {
            store.dispatch(updateActiveLabelId(currentAnnotations[0].id));
        }
        store.dispatch(updateHighlightedLabelId(null));
    }

    private static isCategorizationSupported(activeLabelType: LabelType): boolean {
        return [
            LabelType.RECT,
            LabelType.POINT,
            LabelType.LINE,
            LabelType.POLYGON
        ].includes(activeLabelType);
    }

    private static getOrderedAnnotations(imageData: ImageData, labelType: LabelType): CategorizableAnnotation[] {
        switch (labelType) {
            case LabelType.RECT:
                return imageData.labelRects.filter((labelRect: LabelRect) => labelRect.status === LabelStatus.ACCEPTED);
            case LabelType.POINT:
                return imageData.labelPoints.filter((labelPoint: LabelPoint) => labelPoint.status === LabelStatus.ACCEPTED);
            case LabelType.LINE:
                return imageData.labelLines;
            case LabelType.POLYGON:
                return imageData.labelPolygons;
            default:
                return [];
        }
    }

    private static getCurrentCategorizationTarget(orderedAnnotations: CategorizableAnnotation[]): CategorizableAnnotation | null {
        const activeLabelId = LabelsSelector.getActiveLabelId();
        if (!activeLabelId) {
            return null;
        }

        return orderedAnnotations.find((annotation: CategorizableAnnotation) => annotation.id === activeLabelId) || null;
    }

    private static focusFirstAvailableCategorizationTarget(startImageIndex: number): boolean {
        const imagesData = LabelsSelector.getImagesData();
        const activeLabelType = LabelsSelector.getActiveLabelType();

        for (let imageIndex = Math.max(0, startImageIndex); imageIndex < imagesData.length; imageIndex += 1) {
            const annotations = LabelActions.getOrderedAnnotations(imagesData[imageIndex], activeLabelType);
            if (annotations.length > 0) {
                return LabelActions.focusCategorizationTarget(imageIndex, annotations[0].id);
            }
        }

        return false;
    }

    private static focusCategorizationTarget(imageIndex: number, annotationId: string): boolean {
        const targetImageData = LabelsSelector.getImageDataByIndex(imageIndex);
        if (!targetImageData) {
            return false;
        }

        if (LabelsSelector.getActiveImageIndex() !== imageIndex) {
            ImageActions.getImageByIndex(imageIndex);
        }
        store.dispatch(updateActiveLabelId(annotationId));
        store.dispatch(updateHighlightedLabelId(null));
        return true;
    }

    private static updateAnnotationLabel(
        imageData: ImageData,
        labelType: LabelType,
        annotationId: string,
        labelNameId: string
    ): ImageData {
        switch (labelType) {
            case LabelType.RECT:
                return {
                    ...imageData,
                    labelRects: imageData.labelRects.map((labelRect: LabelRect) => {
                        if (labelRect.id !== annotationId) {
                            return labelRect;
                        }

                        return {
                            ...labelRect,
                            labelId: labelNameId,
                            status: LabelStatus.ACCEPTED
                        };
                    })
                };
            case LabelType.POINT:
                return {
                    ...imageData,
                    labelPoints: imageData.labelPoints.map((labelPoint: LabelPoint) => {
                        if (labelPoint.id !== annotationId) {
                            return labelPoint;
                        }

                        return {
                            ...labelPoint,
                            labelId: labelNameId,
                            status: LabelStatus.ACCEPTED
                        };
                    })
                };
            case LabelType.LINE:
                return {
                    ...imageData,
                    labelLines: imageData.labelLines.map((labelLine: LabelLine) =>
                        labelLine.id === annotationId ? {
                            ...labelLine,
                            labelId: labelNameId
                        } : labelLine
                    )
                };
            case LabelType.POLYGON:
                return {
                    ...imageData,
                    labelPolygons: imageData.labelPolygons.map((labelPolygon: LabelPolygon) =>
                        labelPolygon.id === annotationId ? {
                            ...labelPolygon,
                            labelId: labelNameId
                        } : labelPolygon
                    )
                };
            default:
                return imageData;
        }
    }

    private static advanceCategorizationTarget(currentImageIndex: number, currentAnnotationId: string): void {
        const activeLabelType = LabelsSelector.getActiveLabelType();
        const currentImageData = LabelsSelector.getImageDataByIndex(currentImageIndex);
        const currentAnnotations = LabelActions.getOrderedAnnotations(currentImageData, activeLabelType);
        const currentAnnotationIndex = currentAnnotations.findIndex((annotation: CategorizableAnnotation) => annotation.id === currentAnnotationId);

        if (currentAnnotationIndex >= 0 && currentAnnotationIndex < currentAnnotations.length - 1) {
            LabelActions.focusCategorizationTarget(currentImageIndex, currentAnnotations[currentAnnotationIndex + 1].id);
            return;
        }

        if (LabelActions.focusFirstAvailableCategorizationTarget(currentImageIndex + 1)) {
            return;
        }

        LabelActions.stopCategorizationMode();
        LabelActions.notify(
            NotificationType.SUCCESS,
            'Categorization completed',
            'You reached the last vector in the project sequence.'
        );
    }

    private static applyPreviousLabelsToCurrentImage(
        currentImageData: ImageData,
        previousAnnotations: CategorizableAnnotation[],
        labelType: LabelType
    ): ImageData {
        const previousLabelIds = previousAnnotations.map((annotation: CategorizableAnnotation) => annotation.labelId);

        switch (labelType) {
            case LabelType.RECT:
                let rectAnnotationIndex = 0;
                return {
                    ...currentImageData,
                    labelRects: currentImageData.labelRects.map((labelRect: LabelRect) => {
                        if (labelRect.status !== LabelStatus.ACCEPTED) {
                            return labelRect;
                        }
                        const nextLabelId = previousLabelIds[rectAnnotationIndex];
                        rectAnnotationIndex += 1;
                        if (nextLabelId === undefined) {
                            return labelRect;
                        }

                        return {
                            ...labelRect,
                            labelId: nextLabelId,
                            status: LabelStatus.ACCEPTED
                        };
                    })
                };
            case LabelType.POINT:
                let pointAnnotationIndex = 0;
                return {
                    ...currentImageData,
                    labelPoints: currentImageData.labelPoints.map((labelPoint: LabelPoint) => {
                        if (labelPoint.status !== LabelStatus.ACCEPTED) {
                            return labelPoint;
                        }
                        const nextLabelId = previousLabelIds[pointAnnotationIndex];
                        pointAnnotationIndex += 1;
                        if (nextLabelId === undefined) {
                            return labelPoint;
                        }

                        return {
                            ...labelPoint,
                            labelId: nextLabelId,
                            status: LabelStatus.ACCEPTED
                        };
                    })
                };
            case LabelType.LINE:
                return {
                    ...currentImageData,
                    labelLines: currentImageData.labelLines.map((labelLine: LabelLine, index: number) =>
                        previousLabelIds[index] === undefined ? labelLine : {
                            ...labelLine,
                            labelId: previousLabelIds[index]
                        }
                    )
                };
            case LabelType.POLYGON:
                return {
                    ...currentImageData,
                    labelPolygons: currentImageData.labelPolygons.map((labelPolygon: LabelPolygon, index: number) =>
                        previousLabelIds[index] === undefined ? labelPolygon : {
                            ...labelPolygon,
                            labelId: previousLabelIds[index]
                        }
                    )
                };
            default:
                return currentImageData;
        }
    }

    private static notify(type: NotificationType, header: string, description: string): void {
        store.dispatch(submitNewNotification({
            id: `categorization-${header.toLowerCase().replace(/\s+/g, '-')}`,
            type,
            header,
            description
        }));
    }
}
