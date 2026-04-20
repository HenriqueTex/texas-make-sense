import {store} from '../..';
import {updateProjectData} from '../../store/general/actionCreators';
import {NotificationType} from '../../data/enums/NotificationType';
import {submitNewNotification} from '../../store/notifications/actionCreators';
import {
    clearLabelsHistory,
    updateImageData,
    updateLabelNames,
    updateActiveImageIndex,
    updateActiveLabelNameId,
    updateActiveLabelType,
    updateHighlightedLabelId,
    updateActiveLabelId,
    updateFirstLabelCreatedFlag
} from '../../store/labels/actionCreators';
import {updateActiveProjectId, updateProjectList, updateSaveStatus, setProjectLoading} from '../../store/projects/actionCreators';
import {canPersistProject, deserializeImageData, isStoredProjectValid, listProjects, loadProject, saveProject, serializeImageData, StoredProject} from '../../services/ProjectStore';

export async function openProject(projectId: string): Promise<boolean> {
    const stored = await loadProject(projectId);
    if (!isStoredProjectValid(stored)) {
        store.dispatch(submitNewNotification({
            id: `invalid-project-${projectId}`,
            type: NotificationType.ERROR,
            header: 'Project could not be opened',
            description: 'The saved project data is incomplete or invalid in local storage.'
        }));
        return false;
    }

    // Block autosave while we dispatch multiple actions that transition the store
    // from one project to another — prevents saving a partial/empty snapshot
    // which would corrupt the project and cause a black screen on next open.
    store.dispatch(setProjectLoading(true));
    store.dispatch(clearLabelsHistory());

    // Reset all transient UI state before loading new project
    store.dispatch(updateActiveLabelNameId(null));
    store.dispatch(updateActiveLabelType(null));
    store.dispatch(updateActiveLabelId(null));
    store.dispatch(updateHighlightedLabelId(null));
    store.dispatch(updateFirstLabelCreatedFlag(false));

    store.dispatch(updateSaveStatus('saved'));
    store.dispatch(updateLabelNames(stored.labels, false));
    store.dispatch(updateImageData(stored.images.map(deserializeImageData), false));
    store.dispatch(updateActiveImageIndex(0));
    store.dispatch(updateActiveProjectId(stored.id));
    store.dispatch(updateProjectData({name: stored.name, type: stored.type}));

    // All state is now consistent — allow autosave again
    store.dispatch(setProjectLoading(false));

    return true;
}

export async function saveProjectNow(): Promise<void> {
    const state = store.getState();
    const {activeProjectId} = state.projects;
    if (!activeProjectId) return;

    const {projectList} = state.projects;
    const {projectData} = state.general;
    const {imagesData, labels} = state.labels;
    if (!canPersistProject(projectData, imagesData)) return;

    const existingMeta = projectList.find(p => p.id === activeProjectId);
    const project: StoredProject = {
        id: activeProjectId,
        name: projectData.name,
        type: projectData.type,
        createdAt: existingMeta?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        labels,
        images: imagesData.map(serializeImageData)
    };

    store.dispatch(updateSaveStatus('saving'));
    await saveProject(project);
    store.dispatch(updateSaveStatus('saved'));
    const list = await listProjects();
    store.dispatch(updateProjectList(list));
}
