import {useCallback, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppState} from '../store';
import {updateProjectList, updateSaveStatus} from '../store/projects/actionCreators';
import {listProjects, saveProject, serializeImageData, StoredProject} from '../services/ProjectStore';
import {ProjectMeta} from '../store/projects/types';
import {ImageData, LabelName} from '../store/labels/types';
import {ProjectData} from '../store/general/types';

type SaveSnapshot = {
    activeProjectId: string | null;
    projectList: ProjectMeta[];
    projectData: ProjectData;
    imagesData: ImageData[];
    labels: LabelName[];
};

export function useSaveProject(): () => Promise<void> {
    const dispatch = useDispatch();

    const activeProjectId = useSelector((s: AppState) => s.projects.activeProjectId);
    const projectList = useSelector((s: AppState) => s.projects.projectList);
    const projectData = useSelector((s: AppState) => s.general.projectData);
    const imagesData = useSelector((s: AppState) => s.labels.imagesData);
    const labels = useSelector((s: AppState) => s.labels.labels);

    // Keep a ref always current so the stable callback reads fresh state
    const snapshotRef = useRef<SaveSnapshot>({
        activeProjectId: null,
        projectList: [],
        projectData: {type: null, name: ''},
        imagesData: [],
        labels: []
    });
    snapshotRef.current = {activeProjectId, projectList, projectData, imagesData, labels};

    return useCallback(async () => {
        const {activeProjectId, projectList, projectData, imagesData, labels} = snapshotRef.current;
        if (!activeProjectId) return;

        dispatch(updateSaveStatus('saving'));
        try {
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
            await saveProject(project);
            dispatch(updateSaveStatus('saved'));
            const list = await listProjects();
            dispatch(updateProjectList(list));
        } catch (e) {
            console.error('Save failed', e);
            dispatch(updateSaveStatus('error'));
        }
    }, [dispatch]);
}
