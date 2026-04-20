import {LabelsActionTypes, LabelsState, ImageData} from './types';
import {Action} from '../Actions';
import {applyLabelsHistorySnapshot, createLabelsHistorySnapshot} from './history';

const UNDO_STACK_LIMIT = 50;

const initialState: LabelsState = {
    activeImageIndex: null,
    activeLabelNameId: null,
    activeLabelType: null,
    activeLabelId: null,
    highlightedLabelId: null,
    imagesData: [],
    firstLabelCreatedFlag: false,
    labels: [],
    undoStack: []
};

const pushUndoSnapshot = (state: LabelsState, nextState: LabelsState): LabelsState => ({
    ...nextState,
    undoStack: [...state.undoStack, createLabelsHistorySnapshot(state)].slice(-UNDO_STACK_LIMIT)
});

export function labelsReducer(
    state = initialState,
    action: LabelsActionTypes
): LabelsState {
    switch (action.type) {
        case Action.UPDATE_ACTIVE_IMAGE_INDEX: {
            return {
                ...state,
                activeImageIndex: action.payload.activeImageIndex
            }
        }
        case Action.UPDATE_ACTIVE_LABEL_NAME_ID: {
            return {
                ...state,
                activeLabelNameId: action.payload.activeLabelNameId
            }
        }
        case Action.UPDATE_ACTIVE_LABEL_ID: {
            return {
                ...state,
                activeLabelId: action.payload.activeLabelId
            }
        }
        case Action.UPDATE_HIGHLIGHTED_LABEL_ID: {
            return {
                ...state,
                highlightedLabelId: action.payload.highlightedLabelId
            }
        }
        case Action.UPDATE_ACTIVE_LABEL_TYPE: {
            return {
                ...state,
                activeLabelType: action.payload.activeLabelType
            }
        }
        case Action.UPDATE_IMAGE_DATA_BY_ID: {
            const nextState = {
                ...state,
                imagesData: state.imagesData.map((imageData: ImageData) =>
                    imageData.id === action.payload.id ? action.payload.newImageData : imageData
                )
            };
            return action.payload.undoable === false ? nextState : pushUndoSnapshot(state, nextState);
        }
        case Action.ADD_IMAGES_DATA: {
            const nextState = {
                ...state,
                imagesData: state.imagesData.concat(action.payload.imageData)
            };
            return action.payload.undoable === false ? nextState : pushUndoSnapshot(state, nextState);
        }
        case Action.UPDATE_IMAGES_DATA: {
            const nextState = {
                ...state,
                imagesData: action.payload.imageData
            };
            return action.payload.undoable === false ? nextState : pushUndoSnapshot(state, nextState);
        }
        case Action.UPDATE_LABEL_NAMES: {
            const nextState = {
                ...state,
                labels: action.payload.labels
            };
            return action.payload.undoable === false ? nextState : pushUndoSnapshot(state, nextState);
        }
        case Action.UPDATE_FIRST_LABEL_CREATED_FLAG: {
            return {
                ...state,
                firstLabelCreatedFlag: action.payload.firstLabelCreatedFlag
            }
        }
        case Action.UNDO_LABELS_STATE: {
            if (state.undoStack.length === 0) {
                return state;
            }
            const previousSnapshot = state.undoStack[state.undoStack.length - 1];
            return {
                ...applyLabelsHistorySnapshot(state, previousSnapshot),
                undoStack: state.undoStack.slice(0, -1)
            };
        }
        case Action.CLEAR_LABELS_HISTORY: {
            return {
                ...state,
                undoStack: []
            };
        }
        default:
            return state;
    }
}
