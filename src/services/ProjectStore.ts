import {openDB, IDBPDatabase} from 'idb';
import {ProjectType} from '../data/enums/ProjectType';
import {ProjectData} from '../store/general/types';
import {ImageData, LabelName} from '../store/labels/types';
import {ProjectMeta} from '../store/projects/types';

const DB_NAME = 'make-sense-db';
const DB_VERSION = 2;
const PROJECTS_STORE = 'projects';
const PROJECTS_META_STORE = 'projects-meta';

export type StoredImageData = Omit<ImageData, 'fileData'> & {
    fileName: string;
    fileBlob: Blob;
}

export type StoredProject = {
    id: string;
    name: string;
    type: ProjectType;
    createdAt: number;
    updatedAt: number;
    labels: LabelName[];
    images: StoredImageData[];
}

export function canPersistProject(projectData: ProjectData, imagesData: ImageData[]): boolean {
    return Object.values(ProjectType).includes(projectData.type) && imagesData.length > 0;
}

export function isStoredProjectValid(project: StoredProject | undefined): project is StoredProject {
    if (!project) return false;

    const hasValidType = Object.values(ProjectType).includes(project.type);
    const hasImages = Array.isArray(project.images) && project.images.length > 0;
    const hasLabels = Array.isArray(project.labels);

    return hasValidType && hasImages && hasLabels;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            async upgrade(db, oldVersion, _newVersion, tx) {
                if (oldVersion < 1) {
                    db.createObjectStore(PROJECTS_STORE, {keyPath: 'id'});
                }
                if (oldVersion < 2) {
                    db.createObjectStore(PROJECTS_META_STORE, {keyPath: 'id'});
                    // Migrate metadata from v1 projects store
                    if (oldVersion >= 1) {
                        let cursor = await tx.objectStore(PROJECTS_STORE).openCursor();
                        while (cursor) {
                            const p = cursor.value as StoredProject;
                            const meta: ProjectMeta = {
                                id: p.id, name: p.name, type: p.type,
                                createdAt: p.createdAt, updatedAt: p.updatedAt,
                                imageCount: p.images.length
                            };
                            tx.objectStore(PROJECTS_META_STORE).put(meta);
                            cursor = await cursor.continue();
                        }
                    }
                }
            }
        });
        // Reset on failure so the next call retries opening the DB
        dbPromise.catch(() => { dbPromise = null; });
    }
    return dbPromise;
}

export async function saveProject(project: StoredProject): Promise<void> {
    const db = await getDB();
    const meta: ProjectMeta = {
        id: project.id,
        name: project.name,
        type: project.type,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        imageCount: project.images.length
    };
    const tx = db.transaction([PROJECTS_STORE, PROJECTS_META_STORE], 'readwrite');
    await Promise.all([
        tx.objectStore(PROJECTS_STORE).put(project),
        tx.objectStore(PROJECTS_META_STORE).put(meta),
        tx.done
    ]);
}

export async function loadProject(id: string): Promise<StoredProject | undefined> {
    const db = await getDB();
    return db.get(PROJECTS_STORE, id);
}

export async function deleteProject(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction([PROJECTS_STORE, PROJECTS_META_STORE], 'readwrite');
    await Promise.all([
        tx.objectStore(PROJECTS_STORE).delete(id),
        tx.objectStore(PROJECTS_META_STORE).delete(id),
        tx.done
    ]);
}

export async function listProjects(): Promise<ProjectMeta[]> {
    const db = await getDB();
    const all: ProjectMeta[] = await db.getAll(PROJECTS_META_STORE);
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function serializeImageData(imageData: ImageData): StoredImageData {
    const {fileData, ...rest} = imageData;
    return {
        ...rest,
        fileName: fileData.name,
        fileBlob: fileData
    };
}

export function deserializeImageData(stored: StoredImageData): ImageData {
    const {fileName, fileBlob, ...rest} = stored;
    const file = new File([fileBlob], fileName, {type: fileBlob.type});
    return {
        ...rest,
        fileData: file,
        loadStatus: false
    };
}
