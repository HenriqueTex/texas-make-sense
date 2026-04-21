import axios from 'axios';
import {store} from '../../index';
import {PopupWindowType} from '../../data/enums/PopupWindowType';
import {updateActivePopupType} from '../../store/general/actionCreators';
import {LabelsSelector} from '../../store/selectors/LabelsSelector';
import {ImageData} from '../../store/labels/types';
import {updateActiveImageIndex, updateImageData} from '../../store/labels/actionCreators';
import {submitNewNotification} from '../../store/notifications/actionCreators';
import {NotificationType} from '../../data/enums/NotificationType';
import {canPersistProject, serializeImageData, StoredProject, syncProjectToBackend} from '../../services/ProjectStore';

type SimilarityOrderingResponse = {
    status: string;
    ordered_image_ids: string[];
    ordered_file_names: string[];
    adjacent_scores: Array<{
        left_image_id: string;
        right_image_id: string;
        score: number;
    }>;
    summary: {
        image_count: number;
        average_adjacent_score: number;
    };
}

export class ImageSimilarityActions {
    public static async orderProjectImages(projectId: string | null): Promise<void> {
        if (!projectId) {
            ImageSimilarityActions.notify(
                NotificationType.ERROR,
                'Similarity ordering failed',
                'No active project was found for similarity ordering.'
            );
            return;
        }

        const imagesData = LabelsSelector.getImagesData();
        if (imagesData.length < 2) {
            ImageSimilarityActions.notify(
                NotificationType.WARNING,
                'Not enough images',
                'At least two images are required to compute a similarity-based order.'
            );
            return;
        }

        const state = store.getState();
        const {projectData} = state.general;
        const {projectList} = state.projects;

        if (!canPersistProject(projectData, imagesData)) {
            ImageSimilarityActions.notify(
                NotificationType.ERROR,
                'Similarity ordering failed',
                'The current project state is incomplete and could not be synchronized to the backend.'
            );
            return;
        }

        const activeImage = LabelsSelector.getActiveImageData();
        const activeImageId = activeImage ? activeImage.id : null;
        const existingMeta = projectList.find((project) => project.id === projectId);
        const projectSnapshot: StoredProject = {
            id: projectId,
            name: projectData.name,
            type: projectData.type,
            createdAt: existingMeta?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
            labels: state.labels.labels,
            images: imagesData.map(serializeImageData)
        };

        store.dispatch(updateActivePopupType(PopupWindowType.LOADER));

        try {
            await syncProjectToBackend(projectSnapshot, true);

            const response = await axios.post<SimilarityOrderingResponse>(
                `http://localhost:8000/api/projects/${projectId}/similarity/order`,
                {},
                {timeout: 120000}
            );

            const reorderedImages = ImageSimilarityActions.reorderImages(imagesData, response.data.ordered_image_ids);
            const nextActiveIndex = activeImageId
                ? reorderedImages.findIndex((imageData: ImageData) => imageData.id === activeImageId)
                : 0;

            store.dispatch(updateImageData(reorderedImages));
            if (nextActiveIndex >= 0) {
                store.dispatch(updateActiveImageIndex(nextActiveIndex));
            }
            store.dispatch(updateActivePopupType(null));

            ImageSimilarityActions.notify(
                NotificationType.SUCCESS,
                'Images reordered',
                `${response.data.summary.image_count} images were reordered by visual similarity.`
            );
        } catch (error) {
            store.dispatch(updateActivePopupType(null));

            const message = axios.isAxiosError(error)
                ? (error.response?.data?.detail || error.message)
                : 'Unknown error while ordering images by similarity.';

            ImageSimilarityActions.notify(
                NotificationType.ERROR,
                'Similarity ordering failed',
                message
            );
        }
    }

    private static reorderImages(imagesData: ImageData[], orderedImageIds: string[]): ImageData[] {
        if (orderedImageIds.length !== imagesData.length) {
            throw new Error('Similarity ordering did not return the full image set.');
        }

        const uniqueOrderedIds = new Set(orderedImageIds);
        if (uniqueOrderedIds.size !== orderedImageIds.length) {
            throw new Error('Similarity ordering returned duplicate image ids.');
        }

        const imageMap = new Map(imagesData.map((imageData: ImageData) => [imageData.id, imageData]));
        const reorderedImages = orderedImageIds.map((imageId: string) => {
            const imageData = imageMap.get(imageId);
            if (!imageData) {
                throw new Error(`Similarity ordering returned an unknown image id: ${imageId}`);
            }
            return imageData;
        });

        if (uniqueOrderedIds.size !== imageMap.size) {
            throw new Error('Similarity ordering did not cover the current image set exactly.');
        }

        return reorderedImages;
    }

    private static notify(type: NotificationType, header: string, description: string): void {
        store.dispatch(submitNewNotification({
            id: `similarity-ordering-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type,
            header,
            description
        }));
    }
}
