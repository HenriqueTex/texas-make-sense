import React, {useState} from 'react';
import './ExitProjectPopup.scss';
import {GenericYesNoPopup} from '../GenericYesNoPopup/GenericYesNoPopup';
import {
    updateActiveImageIndex as storeUpdateActiveImageIndex,
    updateActiveLabelNameId as storeUpdateActiveLabelNameId,
    updateFirstLabelCreatedFlag as storeUpdateFirstLabelCreatedFlag,
    updateImageData as storeUpdateImageData,
    updateLabelNames as storeUpdateLabelNames
} from '../../../store/labels/actionCreators';
import {AppState} from '../../../store';
import {connect} from 'react-redux';
import {ImageData, LabelName} from '../../../store/labels/types';
import {PopupActions} from '../../../logic/actions/PopupActions';
import {ProjectData} from '../../../store/general/types';
import {updateProjectData as storeUpdateProjectData} from '../../../store/general/actionCreators';
import {updateActiveProjectId as storeUpdateActiveProjectId} from '../../../store/projects/actionCreators';
import {saveProjectNow} from '../../../logic/project/ProjectLoader';

interface IProps {
    updateActiveImageIndex: (activeImageIndex: number) => any;
    updateActiveLabelNameId: (activeLabelId: string) => any;
    updateLabelNames: (labelNames: LabelName[]) => any;
    updateImageData: (imageData: ImageData[]) => any;
    updateFirstLabelCreatedFlag: (firstLabelCreatedFlag: boolean) => any;
    updateProjectData: (projectData: ProjectData) => any;
    updateActiveProjectId: (id: string | null) => any;
}

const ExitProjectPopup: React.FC<IProps> = ({
    updateActiveLabelNameId,
    updateLabelNames,
    updateActiveImageIndex,
    updateImageData,
    updateFirstLabelCreatedFlag,
    updateProjectData,
    updateActiveProjectId
}: IProps) => {
    const [isSaving, setIsSaving] = useState(false);

    const renderContent = () => {
        return (
            <div className="ExitProjectPopupContent">
                <div className="Message">
                    {isSaving
                        ? 'Saving your project…'
                        : 'Your project is saved automatically. You can return to it at any time from the home screen.'
                    }
                </div>
            </div>
        );
    };

    const onAccept = async () => {
        setIsSaving(true);
        try {
            await saveProjectNow();
        } catch {
            // Exit anyway even if save fails
        }
        // Close the popup FIRST so it is no longer visible while the store
        // resets — otherwise the popup with isSaving=true bleeds into the
        // main screen and leaves the UI with disabled buttons.
        PopupActions.close();
        updateActiveLabelNameId(null);
        updateLabelNames([]);
        updateProjectData({type: null, name: 'my-project-name'});
        updateActiveImageIndex(null);
        updateImageData([]);
        updateFirstLabelCreatedFlag(false);
        updateActiveProjectId(null);
    };

    const onReject = () => {
        PopupActions.close();
    };

    return (
        <GenericYesNoPopup
            title={'Exit project'}
            renderContent={renderContent}
            acceptLabel={'Exit'}
            onAccept={onAccept}
            disableAcceptButton={isSaving}
            disableRejectButton={isSaving}
            rejectLabel={'Back'}
            onReject={onReject}
        />
    );
};

const mapDispatchToProps = {
    updateActiveLabelNameId: storeUpdateActiveLabelNameId,
    updateLabelNames: storeUpdateLabelNames,
    updateProjectData: storeUpdateProjectData,
    updateActiveImageIndex: storeUpdateActiveImageIndex,
    updateImageData: storeUpdateImageData,
    updateFirstLabelCreatedFlag: storeUpdateFirstLabelCreatedFlag,
    updateActiveProjectId: storeUpdateActiveProjectId
};

const mapStateToProps = (state: AppState) => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ExitProjectPopup);
