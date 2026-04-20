import {LabelsActionTypes, ImageData, LabelName} from './types';
import {Action} from '../Actions';
import {LabelType} from '../../data/enums/LabelType';

export function updateActiveImageIndex(activeImageIndex: number): LabelsActionTypes {
    return {
        type: Action.UPDATE_ACTIVE_IMAGE_INDEX,
        payload: {
            activeImageIndex,
        },
    };
}

export function undoLabelsState(): LabelsActionTypes {
    return {
        type: Action.UNDO_LABELS_STATE
    };
}

export function clearLabelsHistory(): LabelsActionTypes {
    return {
        type: Action.CLEAR_LABELS_HISTORY
    };
}

export function updateActiveLabelNameId(activeLabelNameId: string): LabelsActionTypes {
    return {
        type: Action.UPDATE_ACTIVE_LABEL_NAME_ID,
        payload: {
            activeLabelNameId,
        },
    };
}

export function updateActiveLabelId(activeLabelId: string): LabelsActionTypes {
    return {
        type: Action.UPDATE_ACTIVE_LABEL_ID,
        payload: {
            activeLabelId,
        },
    };
}

export function updateHighlightedLabelId(highlightedLabelId: string): LabelsActionTypes {
    return {
        type: Action.UPDATE_HIGHLIGHTED_LABEL_ID,
        payload: {
            highlightedLabelId,
        },
    };
}

export function updateActiveLabelType(activeLabelType: LabelType): LabelsActionTypes {
    return {
        type: Action.UPDATE_ACTIVE_LABEL_TYPE,
        payload: {
            activeLabelType,
        },
    };
}

export function updateImageDataById(id: string, newImageData: ImageData, undoable: boolean = true): LabelsActionTypes {
    return {
        type: Action.UPDATE_IMAGE_DATA_BY_ID,
        payload: {
            id,
            newImageData,
            undoable
        },
    };
}

export function addImageData(imageData: ImageData[], undoable: boolean = true): LabelsActionTypes {
    return {
        type: Action.ADD_IMAGES_DATA,
        payload: {
            imageData,
            undoable
        },
    };
}

export function updateImageData(imageData: ImageData[], undoable: boolean = true): LabelsActionTypes {
    return {
        type: Action.UPDATE_IMAGES_DATA,
        payload: {
            imageData,
            undoable
        },
    };
}

export function updateLabelNames(labels: LabelName[], undoable: boolean = true): LabelsActionTypes {
    return {
        type: Action.UPDATE_LABEL_NAMES,
        payload: {
            labels,
            undoable
        }
    }
}

export function updateFirstLabelCreatedFlag(firstLabelCreatedFlag: boolean): LabelsActionTypes {
    return {
        type: Action.UPDATE_FIRST_LABEL_CREATED_FLAG,
        payload: {
            firstLabelCreatedFlag
        }
    }
}
