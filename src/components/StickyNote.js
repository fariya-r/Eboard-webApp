// src/components/StickyNote.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';

const StickyNote = ({ note, onUpdateText, onUpdatePosition, onDelete }) => {
    const [isEditing, setIsEditing] = useState(note.text === '');
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [tempPosition, setTempPosition] = useState({ x: note.x, y: note.y });

    useEffect(() => {
        setTempPosition({ x: note.x, y: note.y });
    }, [note.x, note.y]);

    const handleTextChange = (e) => {
        onUpdateText(note.id, e.target.value);
    };

    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        setIsEditing(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
    }, []);

    const handleMouseDown = useCallback((e) => {
        if (isEditing) return;
        
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - tempPosition.x,
            y: e.clientY - tempPosition.y
        };
        e.stopPropagation(); 
    }, [isEditing, tempPosition.x, tempPosition.y]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        
        setTempPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            onUpdatePosition(note.id, tempPosition);
        }
        setIsDragging(false);
    }, [isDragging, onUpdatePosition, note.id, tempPosition]);

    const handleDeleteClick = useCallback((e) => {
        e.stopPropagation();
        onDelete(note.id); // This line is causing the error
      }, [onDelete, note.id]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            className="group absolute p-2 rounded-lg shadow-md border border-gray-300 transition-shadow duration-200 ease-in-out hover:shadow-lg"
            style={{ 
                left: `${tempPosition.x}px`, 
                top: `${tempPosition.y}px`, 
                backgroundColor: note.color,
                width: '150px',
                minHeight: '100px',
                cursor: isEditing ? 'auto' : 'grab',
                zIndex: isDragging ? 20 : 10
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            <button 
                className="absolute top-1 right-1 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                onClick={handleDeleteClick}
                title="Delete note"
            >
                <FaTimes />
            </button>

            {isEditing ? (
                <textarea
                    className="w-full h-full bg-transparent resize-none focus:outline-none"
                    value={note.text}
                    onChange={handleTextChange}
                    onBlur={handleBlur}
                    autoFocus
                />
            ) : (
                <p className="whitespace-pre-wrap">{note.text || "Double-click to edit"}</p>
            )}
        </div>
    );
};

export default StickyNote;