import React from 'react'
import './FileExplorer.css'

const FileExplorer = ({ files, activeFile, onFileSelect, isOpen }) => {
    if (!isOpen) return null

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop()
        switch(ext) {
            case 'js': return '📄'
            case 'jsx': return '⚛️'
            case 'css': return '🎨'
            case 'html': return '🌐'
            case 'json': return '📋'
            default: return '📄'
        }
    }

    return (
        <div className="file-explorer">
            <div className="explorer-header">
                <h3>Explorer</h3>
                <button className="new-file-btn">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </button>
            </div>
            <div className="file-list">
                {files.map(file => (
                    <button
                        key={file.name}
                        className={`file-item ${activeFile === file.name ? 'active' : ''}`}
                        onClick={() => onFileSelect(file.name)}
                    >
                        <span className="file-icon">{getFileIcon(file.name)}</span>
                        <span className="file-name">{file.name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default FileExplorer