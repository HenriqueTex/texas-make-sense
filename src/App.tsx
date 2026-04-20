import React from 'react';
import './App.scss';
import {useAutoSave} from './hooks/useAutoSave';
import EditorView from './views/EditorView/EditorView';
import MainView from './views/MainView/MainView';
import {ProjectType} from './data/enums/ProjectType';
import {AppState} from './store';
import {connect} from 'react-redux';
import PopupView from './views/PopupView/PopupView';
import MobileMainView from './views/MobileMainView/MobileMainView';
import {ISize} from './interfaces/ISize';
import {Settings} from './settings/Settings';
import {SizeItUpView} from './views/SizeItUpView/SizeItUpView';
import {PlatformModel} from './staticModels/PlatformModel';
import classNames from 'classnames';
import NotificationsView from './views/NotificationsView/NotificationsView';
import { RoboflowAPIDetails } from './store/ai/types';
import {ImageData} from './store/labels/types';

interface IProps {
    projectType: ProjectType;
    windowSize: ISize;
    activeImageIndex: number;
    imagesData: ImageData[];
    isObjectDetectorLoaded: boolean;
    isPoseDetectionLoaded: boolean;
    isYOLOV5ObjectDetectorLoaded: boolean;
    roboflowAPIDetails: RoboflowAPIDetails;
}

const App: React.FC<IProps> = (
    {
        projectType,
        windowSize,
        activeImageIndex,
        imagesData,
        isObjectDetectorLoaded,
        isPoseDetectionLoaded,
        isYOLOV5ObjectDetectorLoaded,
        roboflowAPIDetails
    }
) => {
    useAutoSave();
    const hasActiveImage =
        activeImageIndex !== null &&
        activeImageIndex >= 0 &&
        activeImageIndex < imagesData.length;

    const selectRoute = () => {
        if (!!PlatformModel.mobileDeviceData.manufacturer && !!PlatformModel.mobileDeviceData.os)
            return <MobileMainView/>;
        if (!projectType)
            return <MainView/>;
        if (!hasActiveImage)
            return null;
        else {
            if (windowSize.height < Settings.EDITOR_MIN_HEIGHT || windowSize.width < Settings.EDITOR_MIN_WIDTH) {
                return <SizeItUpView/>;
            } else {
                return <EditorView/>;
            }
        }
    };
    const isAILoaded = isObjectDetectorLoaded
        || isPoseDetectionLoaded
        || isYOLOV5ObjectDetectorLoaded
        || (roboflowAPIDetails.model !== '' && roboflowAPIDetails.key !== '' && roboflowAPIDetails.status)

    return (
        <div className={classNames('App', {'AI': isAILoaded})} draggable={false}
        >
            {selectRoute()}
            <PopupView/>
            <NotificationsView/>
        </div>
    );
};


const mapStateToProps = (state: AppState) => ({
    projectType: state.general.projectData.type,
    windowSize: state.general.windowSize,
    activeImageIndex: state.labels.activeImageIndex,
    imagesData: state.labels.imagesData,
    isObjectDetectorLoaded: state.ai.isSSDObjectDetectorLoaded,
    isPoseDetectionLoaded: state.ai.isPoseDetectorLoaded,
    isYOLOV5ObjectDetectorLoaded: state.ai.isYOLOV5ObjectDetectorLoaded,
    roboflowAPIDetails: state.ai.roboflowAPIDetails
});

export default connect(
    mapStateToProps
)(App);
