import {Action} from '../Actions';
import {ProjectMeta, ProjectsActionTypes, SaveStatus} from './types';

export function updateProjectList(projectList: ProjectMeta[]): ProjectsActionTypes {
    return {
        type: Action.UPDATE_PROJECT_LIST,
        payload: {projectList}
    };
}

export function updateActiveProjectId(activeProjectId: string | null): ProjectsActionTypes {
    return {
        type: Action.UPDATE_ACTIVE_PROJECT_ID,
        payload: {activeProjectId}
    };
}

export function setProjectLoading(isLoadingProject: boolean): ProjectsActionTypes {
    return {
        type: Action.SET_PROJECT_LOADING,
        payload: {isLoadingProject}
    };
}

export function updateSaveStatus(saveStatus: SaveStatus): ProjectsActionTypes {
    return {
        type: Action.UPDATE_SAVE_STATUS,
        payload: {saveStatus}
    };
}
