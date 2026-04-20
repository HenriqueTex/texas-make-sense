import React, {useState} from 'react';
import './ProjectList.scss';
import {ProjectMeta} from '../../../store/projects/types';

interface IProps {
    projects: ProjectMeta[];
    onOpen: (project: ProjectMeta) => void;
    onDelete: (id: string) => void;
}

const ProjectList: React.FC<IProps> = ({projects, onOpen, onDelete}) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmDeleteId(id);
    };

    const handleConfirmDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmDeleteId) onDelete(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    const handleCancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteId(null);
    };

    return (
        <div className='ProjectList'>
            <div className='ProjectListTitle'>Saved Projects</div>
            {projects.length === 0 ? (
                <div className='ProjectListEmpty'>No saved projects yet.</div>
            ) : (
                projects.map(p => (
                    <div
                        key={p.id}
                        className='ProjectListItem'
                        onClick={() => confirmDeleteId === null && onOpen(p)}
                    >
                        <div className='ProjectListItemInfo'>
                            <div className='ProjectListItemName'>{p.name}</div>
                            <div className='ProjectListItemMeta'>
                                {p.imageCount} image{p.imageCount !== 1 ? 's' : ''} · updated {formatDate(p.updatedAt)}
                            </div>
                        </div>
                        <div className='ProjectListItemActions'>
                            {confirmDeleteId === p.id ? (
                                <div className='ProjectListDeleteConfirm'>
                                    <span className='ProjectListDeleteConfirmLabel'>Delete?</span>
                                    <button
                                        className='ProjectListDeleteConfirmYes'
                                        onClick={handleConfirmDelete}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        className='ProjectListDeleteConfirmNo'
                                        onClick={handleCancelDelete}
                                    >
                                        No
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className='ProjectListDeleteBtn'
                                    title='Delete project'
                                    onClick={(e) => handleDeleteClick(e, p.id)}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ProjectList;
