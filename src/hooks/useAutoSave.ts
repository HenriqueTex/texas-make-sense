import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {AppState} from '../store';
import {updateSaveStatus} from '../store/projects/actionCreators';
import {useSaveProject} from './useSaveProject';

export const AUTOSAVE_DEBOUNCE_MS = 2000;

export function useAutoSave() {
    const dispatch = useDispatch();
    const save = useSaveProject();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeProjectId = useSelector((s: AppState) => s.projects.activeProjectId);
    const isLoadingProject = useSelector((s: AppState) => s.projects.isLoadingProject);
    const projectData = useSelector((s: AppState) => s.general.projectData);
    const imagesData = useSelector((s: AppState) => s.labels.imagesData);
    const labels = useSelector((s: AppState) => s.labels.labels);

    useEffect(() => {
        // Don't react while openProject is dispatching multiple actions —
        // the store is in a transitional (potentially empty) state during load.
        if (!activeProjectId || isLoadingProject) return undefined;

        dispatch(updateSaveStatus('unsaved'));

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { save(); }, AUTOSAVE_DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeProjectId, isLoadingProject, projectData, imagesData, labels, dispatch, save]);
}

