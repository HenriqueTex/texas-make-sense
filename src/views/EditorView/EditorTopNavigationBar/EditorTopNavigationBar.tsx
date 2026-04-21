import { ContextType } from '../../../data/enums/ContextType';
import './EditorTopNavigationBar.scss';
import React from 'react';
import classNames from 'classnames';
import { AppState } from '../../../store';
import { connect } from 'react-redux';
import { updateCrossHairVisibleStatus, updateImageDragModeStatus } from '../../../store/general/actionCreators';
import { GeneralSelector } from '../../../store/selectors/GeneralSelector';
import { ViewPointSettings } from '../../../settings/ViewPointSettings';
import { ImageButton } from '../../Common/ImageButton/ImageButton';
import { ViewPortActions } from '../../../logic/actions/ViewPortActions';
import { LabelsSelector } from '../../../store/selectors/LabelsSelector';
import { LabelType } from '../../../data/enums/LabelType';
import { AISelector } from '../../../store/selectors/AISelector';
import { ISize } from '../../../interfaces/ISize';
import { AIActions } from '../../../logic/actions/AIActions';
import { AIActiveLearningActions } from '../../../logic/actions/AIActiveLearningActions';
import { LabelActions } from '../../../logic/actions/LabelActions';
import { ImageSimilarityActions } from '../../../logic/actions/ImageSimilarityActions';
import { Fade, styled, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
const BUTTON_SIZE: ISize = { width: 30, height: 30 };
const BUTTON_PADDING: number = 10;

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#171717',
        color: '#ffffff',
        boxShadow: theme.shadows[1],
        fontSize: 12,
        maxWidth: 200,
        textAlign: 'center'
    },
  }));

const getButtonWithTooltip = (
    key: string,
    tooltipMessage: string,
    imageSrc: string,
    imageAlt: string,
    isActive: boolean,
    isDisabled?: boolean,
    href?: string,
    onClick?: () => any
): React.ReactElement => {
    return <StyledTooltip
        key={key}
        disableFocusListener={true}
        title={tooltipMessage}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 600 }}
        placement='bottom'
    >
        <div>
            <ImageButton
                buttonSize={BUTTON_SIZE}
                padding={BUTTON_PADDING}
                image={imageSrc}
                imageAlt={imageAlt}
                href={href}
                onClick={onClick}
                isActive={isActive}
                isDisabled={isDisabled}
            />
        </div>
    </StyledTooltip>;
};

interface IProps {
    activeContext: ContextType;
    updateImageDragModeStatusAction: (imageDragMode: boolean) => any;
    updateCrossHairVisibleStatusAction: (crossHairVisible: boolean) => any;
    imageDragMode: boolean;
    crossHairVisible: boolean;
    activeLabelType: LabelType;
    activeImageIndex: number;
    activeProjectId: string | null;
    imagesCount: number;
}

const EditorTopNavigationBar: React.FC<IProps> = (
    {
        activeContext,
        updateImageDragModeStatusAction,
        updateCrossHairVisibleStatusAction,
        imageDragMode,
        crossHairVisible,
        activeLabelType,
        activeImageIndex,
        activeProjectId,
        imagesCount
    }) => {
    const getClassName = () => {
        return classNames(
            'EditorTopNavigationBar',
            {
                'with-context': activeContext === ContextType.EDITOR
            }
        );
    };

    const imageDragOnClick = () => {
        if (imageDragMode) {
            updateImageDragModeStatusAction(!imageDragMode);
        }
        else if (GeneralSelector.getZoom() !== ViewPointSettings.MIN_ZOOM) {
            updateImageDragModeStatusAction(!imageDragMode);
        }
    };

    const crossHairOnClick = () => {
        updateCrossHairVisibleStatusAction(!crossHairVisible);
    };

    const withAI = (
        (activeLabelType === LabelType.RECT && AISelector.isAISSDObjectDetectorModelLoaded()) ||
        (activeLabelType === LabelType.RECT && AISelector.isAIYOLOObjectDetectorModelLoaded()) ||
        (activeLabelType === LabelType.RECT && AISelector.isRoboflowAPIModelLoaded()) ||
        (activeLabelType === LabelType.POINT && AISelector.isAIPoseDetectorModelLoaded())
    )

    return (
        <div className={getClassName()}>
            <div className='ButtonWrapper'>
                {
                    getButtonWithTooltip(
                        'zoom-in',
                        'zoom in',
                        'ico/zoom-in.png',
                        'zoom-in',
                        false,
                        false,
                        undefined,
                        () => ViewPortActions.zoomIn()
                    )
                }
                {
                    getButtonWithTooltip(
                        'zoom-out',
                        'zoom out',
                        'ico/zoom-out.png',
                        'zoom-out',
                        false,
                        false,
                        undefined,
                        () => ViewPortActions.zoomOut()
                    )
                }
                {
                    getButtonWithTooltip(
                        'zoom-fit',
                        'fit image to available space',
                        'ico/zoom-fit.png',
                        'zoom-fit',
                        false,
                        false,
                        undefined,
                        () => ViewPortActions.setDefaultZoom()
                    )
                }
                {
                    getButtonWithTooltip(
                        'zoom-max',
                        'maximum allowed image zoom',
                        'ico/zoom-max.png',
                        'zoom-max',
                        false,
                        false,
                        undefined,
                        () => ViewPortActions.setOneForOneZoom()
                    )
                }
            </div>
            <div className='ButtonWrapper'>
                {
                    getButtonWithTooltip(
                        'image-drag-mode',
                        imageDragMode ? 'turn-off image drag mode' : 'turn-on image drag mode - works only when image is zoomed',
                        'ico/hand.png',
                        'image-drag-mode',
                        imageDragMode,
                        false,
                        undefined,
                        imageDragOnClick
                    )
                }
                {
                    getButtonWithTooltip(
                        'cursor-cross-hair',
                        crossHairVisible ? 'turn-off cursor cross-hair' : 'turn-on cursor cross-hair',
                        'ico/cross-hair.png',
                        'cross-hair',
                        crossHairVisible,
                        false,
                        undefined,
                        crossHairOnClick
                    )
                }
                {
                    getButtonWithTooltip(
                        'reapply-previous-labels',
                        'reapply labels from the previous image',
                        'ico/refresh.png',
                        'reapply-previous-labels',
                        false,
                        activeImageIndex <= 0,
                        undefined,
                        () => activeImageIndex > 0 && LabelActions.reapplyLabelsFromPreviousImage()
                    )
                }
                {
                    getButtonWithTooltip(
                        'reorder-by-similarity',
                        'analyze image similarity on the backend and reorder the project sequence',
                        'ico/files.png',
                        'reorder-by-similarity',
                        false,
                        !activeProjectId || imagesCount < 2,
                        undefined,
                        () => activeProjectId && imagesCount > 1 && ImageSimilarityActions.orderProjectImages(activeProjectId)
                    )
                }
            </div>
            {withAI && <div className='ButtonWrapper'>
                    {
                        getButtonWithTooltip(
                            'accept-all',
                            'accept all proposed detections',
                            'ico/accept-all.png',
                            'accept-all',
                            false,
                            false,
                            undefined,
                            () => AIActions.acceptAllSuggestedLabels(LabelsSelector.getActiveImageData())
                        )
                    }
                    {
                        getButtonWithTooltip(
                            'reject-all',
                            'reject all proposed detections',
                            'ico/reject-all.png',
                            'reject-all',
                            false,
                            false,
                            undefined,
                            () => AIActions.rejectAllSuggestedLabels(LabelsSelector.getActiveImageData())
                        )
                    }
                </div>}
            
            {/* Active Learning Backend Tools */}
             <div className='ButtonWrapper'>
                 {
                     getButtonWithTooltip(
                         'al-predict',
                         'Active Learning: Auto-detect objects via Python Backend',
                         'ico/robot.png',
                         'al-predict',
                         false,
                         false,
                         undefined,
                         () => AIActiveLearningActions.predict(LabelsSelector.getActiveImageData())
                     )
                 }
                 {
                     getButtonWithTooltip(
                         'al-train',
                         'Active Learning: Retrain Model on Server',
                         'ico/ai.png',
                         'al-train',
                         false,
                         false,
                         undefined,
                         () => AIActiveLearningActions.triggerTrain(activeProjectId)
                     )
                 }
             </div>

        </div>
    );
};

const mapDispatchToProps = {
    updateImageDragModeStatusAction: updateImageDragModeStatus,
    updateCrossHairVisibleStatusAction: updateCrossHairVisibleStatus
};

const mapStateToProps = (state: AppState) => ({
    activeContext: state.general.activeContext,
    imageDragMode: state.general.imageDragMode,
    crossHairVisible: state.general.crossHairVisible,
    activeLabelType: state.labels.activeLabelType,
    activeImageIndex: state.labels.activeImageIndex,
    activeProjectId: state.projects.activeProjectId,
    imagesCount: state.labels.imagesData.length
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(EditorTopNavigationBar);
