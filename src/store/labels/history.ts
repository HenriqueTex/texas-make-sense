import {ImageData, LabelLine, LabelName, LabelPoint, LabelPolygon, LabelRect, LabelsHistorySnapshot, LabelsState} from './types';

const cloneLabelRect = (labelRect: LabelRect): LabelRect => ({
    ...labelRect,
    rect: {...labelRect.rect}
});

const cloneLabelPoint = (labelPoint: LabelPoint): LabelPoint => ({
    ...labelPoint,
    point: {...labelPoint.point}
});

const cloneLabelLine = (labelLine: LabelLine): LabelLine => ({
    ...labelLine,
    line: {
        start: {...labelLine.line.start},
        end: {...labelLine.line.end}
    }
});

const cloneLabelPolygon = (labelPolygon: LabelPolygon): LabelPolygon => ({
    ...labelPolygon,
    vertices: labelPolygon.vertices.map((vertex) => ({...vertex}))
});

const cloneImageData = (imageData: ImageData): ImageData => ({
    ...imageData,
    labelRects: imageData.labelRects.map(cloneLabelRect),
    labelPoints: imageData.labelPoints.map(cloneLabelPoint),
    labelLines: imageData.labelLines.map(cloneLabelLine),
    labelPolygons: imageData.labelPolygons.map(cloneLabelPolygon),
    labelNameIds: [...imageData.labelNameIds]
});

const cloneLabelName = (labelName: LabelName): LabelName => ({
    ...labelName
});

export const createLabelsHistorySnapshot = (state: LabelsState): LabelsHistorySnapshot => ({
    activeImageIndex: state.activeImageIndex,
    activeLabelNameId: state.activeLabelNameId,
    activeLabelType: state.activeLabelType,
    activeLabelId: state.activeLabelId,
    highlightedLabelId: state.highlightedLabelId,
    imagesData: state.imagesData.map(cloneImageData),
    firstLabelCreatedFlag: state.firstLabelCreatedFlag,
    labels: state.labels.map(cloneLabelName)
});

export const applyLabelsHistorySnapshot = (state: LabelsState, snapshot: LabelsHistorySnapshot): LabelsState => ({
    ...state,
    activeImageIndex: snapshot.activeImageIndex,
    activeLabelNameId: snapshot.activeLabelNameId,
    activeLabelType: snapshot.activeLabelType,
    activeLabelId: snapshot.activeLabelId,
    highlightedLabelId: snapshot.highlightedLabelId,
    imagesData: snapshot.imagesData.map(cloneImageData),
    firstLabelCreatedFlag: snapshot.firstLabelCreatedFlag,
    labels: snapshot.labels.map(cloneLabelName)
});
