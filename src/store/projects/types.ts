import {Action} from '../Actions';
import {ProjectType} from '../../data/enums/ProjectType';

export type SaveStatus = 'idle' | 'saved' | 'saving' | 'unsaved' | 'error';

export type ProjectMeta = {
    id: string;
    name: string;
    type: ProjectType;
    createdAt: number;
    updatedAt: number;
    imageCount: number;
}

export type ProjectsState = {
    projectList: ProjectMeta[];
    activeProjectId: string | null;
    saveStatus: SaveStatus;
}

interface UpdateProjectList {
    type: typeof Action.UPDATE_PROJECT_LIST;
    payload: {
        projectList: ProjectMeta[];
    }
}

interface UpdateActiveProjectId {
    type: typeof Action.UPDATE_ACTIVE_PROJECT_ID;
    payload: {
        activeProjectId: string | null;
    }
}

interface UpdateSaveStatus {
    type: typeof Action.UPDATE_SAVE_STATUS;
    payload: {
        saveStatus: SaveStatus;
    }
}

export type ProjectsActionTypes = UpdateProjectList | UpdateActiveProjectId | UpdateSaveStatus;
