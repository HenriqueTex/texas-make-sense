import React, { useEffect, useState } from 'react';
import './MainView.scss';
import { TextButton } from '../Common/TextButton/TextButton';
import classNames from 'classnames';
import { ISize } from '../../interfaces/ISize';
import { ImageButton } from '../Common/ImageButton/ImageButton';
import { ISocialMedia, SocialMediaData } from '../../data/info/SocialMediaData';
import { styled, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import Fade from '@mui/material/Fade';
import ImagesDropZone from './ImagesDropZone/ImagesDropZone';
import ProjectList from './ProjectList/ProjectList';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../store';
import { ProjectMeta } from '../../store/projects/types';
import { deleteProject, listProjects } from '../../services/ProjectStore';
import { updateProjectList } from '../../store/projects/actionCreators';
import { openProject } from '../../logic/project/ProjectLoader';

const MainView: React.FC = () => {
    const [projectInProgress, setProjectInProgress] = useState(false);
    const [projectCanceled, setProjectCanceled] = useState(false);

    const dispatch = useDispatch();
    const projectList = useSelector((s: AppState) => s.projects.projectList);

    useEffect(() => {
        listProjects().then(list => dispatch(updateProjectList(list)));
    }, [dispatch]);

    const startProject = () => {
        setProjectInProgress(true);
    };

    const endProject = () => {
        setProjectInProgress(false);
        setProjectCanceled(true);
    };

    const handleOpenProject = async (project: ProjectMeta) => {
        await openProject(project.id);
    };

    const handleDeleteProject = async (id: string) => {
        await deleteProject(id);
        const list = await listProjects();
        dispatch(updateProjectList(list));
    };

    const getClassName = () => {
        return classNames(
            'MainView', {
            'InProgress': projectInProgress,
            'Canceled': !projectInProgress && projectCanceled
        }
        );
    };

    const DarkTooltip = styled(({ className, ...props }: TooltipProps) => (
        <Tooltip {...props} classes={{ popper: className }} />
    ))(({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
            backgroundColor: '#171717',
            color: '#ffffff',
            boxShadow: theme.shadows[1],
            fontSize: 11,
            maxWidth: 120
        },
    }));

    const getSocialMediaButtons = (size: ISize) => {
        return SocialMediaData.map((data: ISocialMedia, index: number) => {
            return <DarkTooltip
                key={index}
                disableFocusListener={true}
                title={data.tooltipMessage}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 600 }}
                placement='left'
            >
                <div>
                    <ImageButton
                        buttonSize={size}
                        image={data.imageSrc}
                        imageAlt={data.imageAlt}
                        href={data.href}
                    />
                </div>
            </DarkTooltip>;
        });
    };

    return (
        <div className={getClassName()}>
            <div className='Slider' id='lower'>
                <div className='TriangleVertical'>
                    <div className='TriangleVerticalContent' />
                </div>
            </div>

            <div className='Slider' id='upper'>
                <div className='TriangleVertical'>
                    <div className='TriangleVerticalContent' />
                </div>
            </div>

            <div className='LeftColumn'>
                <div className={'LogoWrapper'}>
                    <img
                        draggable={false}
                        alt={'main-logo'}
                        src={'ico/main-image-color.png'}
                    />
                </div>
                <div className='ProjectListWrapper'>
                    <ProjectList
                        projects={projectList}
                        onOpen={handleOpenProject}
                        onDelete={handleDeleteProject}
                    />
                </div>
                <div className='TriangleVertical'>
                    <div className='TriangleVerticalContent' />
                </div>
                {projectInProgress && <TextButton
                    label={'Go Back'}
                    onClick={endProject}
                />}
            </div>
            <div className='RightColumn'>
                <div />
                {projectInProgress && <ImagesDropZone />}
                <div className='SocialMediaWrapper'>
                    {getSocialMediaButtons({ width: 30, height: 30 })}
                </div>
                {!projectInProgress && <TextButton
                    label={'New Project'}
                    onClick={startProject}
                    externalClassName={'get-started-button'}
                />}
            </div>
        </div>
    );
};

export default MainView;
