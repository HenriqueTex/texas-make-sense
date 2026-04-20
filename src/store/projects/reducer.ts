import {Action} from '../Actions';
import {ProjectsActionTypes, ProjectsState} from './types';

const initialState: ProjectsState = {
    projectList: [],
    activeProjectId: null,
    saveStatus: 'idle',
    isLoadingProject: false
};

export function projectsReducer(
    state = initialState,
    action: ProjectsActionTypes
): ProjectsState {
    switch (action.type) {
        case Action.UPDATE_PROJECT_LIST:
            return {...state, projectList: action.payload.projectList};
        case Action.UPDATE_ACTIVE_PROJECT_ID:
            return {
                ...state,
                activeProjectId: action.payload.activeProjectId,
                // Reset status when closing a project
                saveStatus: action.payload.activeProjectId === null ? 'idle' : state.saveStatus
            };
        case Action.UPDATE_SAVE_STATUS:
            return {...state, saveStatus: action.payload.saveStatus};
        case Action.SET_PROJECT_LOADING:
            return {...state, isLoadingProject: action.payload.isLoadingProject};
        default:
            return state;
    }
}
