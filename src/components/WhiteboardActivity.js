import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaEraser, FaPencilAlt, FaUndo, FaRedo, FaPlus, FaTextHeight, FaMinus, FaShareAlt, FaCompass, FaFileMedical, FaHandPaper } from 'react-icons/fa';
import { saveWhiteboard, getWhiteboards, uploadFile, updateWhiteboard, deleteWhiteboard } from '../services/whiteboardService';
import Tesseract from 'tesseract.js';
import useWhiteboardActions from '../hooks/useWhiteboardActions';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import CanvasRecorder from '../components/CanvasRecorder';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db } from '../firebase/firebase';
import RulerTool from '../components/RulerTool';
import SidePanel from './SidePanel';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { addDoc, collection } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';
import useWhiteboardSocket from '../hooks/useWhiteboardSocket';
import useBoardLoader from '../hooks/useBoardLoader';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import WhiteboardTextLayer from '../components/WhiteboardTextLayer';
import WhiteboardToolbar from '../components/WhiteboardToolbar';
import useCanvasDrawing from '../hooks/useCanvasDrawing'; 
import StickyNote from './StickyNote';
import useCanvasSnapshot from '../hooks/useCanvasSnapshot';
const WhiteboardActivity = () => {
    const canvasRef = useRef(null);
    const [board, setBoard] = useState(null);
    const contextRef = useRef(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedBoardId, setSelectedBoardId] = useState(null);
    const [userId, setUserId] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [fileUrls, setFileUrls] = useState([]);
    const [ocrTextBoxes, setOcrTextBoxes] = useState([]);
    const [lines, setLines] = useState([]);
    const { sessionId } = useParams();
    const auth = getAuth();
    const [socket, setSocket] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const [showRuler, setShowRuler] = useState(false);
    // ✅ ADDED: Ruler state ko wapas add kiya gaya hai, kyunki yeh `useCanvasDrawing` mein nahi hai.
    const [rulerPosition, setRulerPosition] = useState({ x: 50, y: 50 });
    const [isDraggingRuler, setIsDraggingRuler] = useState(false);
    
    const [savedBoards, setSavedBoards] = useState([]);
    const [showSavedBoards, setShowSavedBoards] = useState(false);
    const [currentBoardId, setCurrentBoardId] = useState(null);
    const [user, setUser] = useState(null);
    const [activeTextBox, setActiveTextBox] = useState(null);
    const [textBoxes, setTextBoxes] = useState([]);
    const [hoveredBox, setHoveredBox] = useState(null);
    const [extractedTextState, setExtractedTextState] = useState('');
    const [backgroundSnapshot, setBackgroundSnapshot] = useState(null);
    const [draggingIndex, setDraggingIndex] = useState(null);
    const textareaRef = useRef(null);
    const [resolved, setResolved] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [textEntries, setTextEntries] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setResolved(true);
            if (!currentUser) {
                alert('Please log in to access whiteboards.');
            }
        });
        return () => unsubscribe();
    }, [auth]);
  
    
    const {
        tool, setTool,
        color, setColor,
        lineWidth, setLineWidth,
        isDrawing, setIsDrawing,
        circles, setCircles,
        compassPosition, setCompassPosition,
        isDraggingCompass, setIsDraggingCompass,
        compassAngle, setCompassAngle,
        isDrawingCircle, setIsDrawingCircle,
        pivotPoint, setPivotPoint,
        currentPoint, setCurrentPoint,
        lineStart, setLineStart,
        stickyNotes, setStickyNotes,
        dragStartOffset, setDragStartOffset,
        startDrawing, drawLine, finishDrawing, handleMouseDown, getScaledCoordinates, draw
    } = useCanvasDrawing(
        canvasRef,
        contextRef,
        scale,
        sessionId,
        socket,
        backgroundSnapshot, // Pass the state variable here
        setBackgroundSnapshot // And the state setter here
    );
    
    const { getSnapshotWithElements } = useCanvasSnapshot(
        canvasRef, contextRef, backgroundSnapshot, textBoxes, stickyNotes
    );
    const { handleUndo, handleRedo, handleZoom, handleReset } = useWhiteboardActions(
        canvasRef,
        contextRef,
        history,
        setHistory,
        redoStack,
        setRedoStack,
        setScale,
        setTool,
        setShowRuler,
        setActiveTextBox,
        setTextBoxes,
        setCircles,
        setPivotPoint,
        setCurrentPoint,
        setIsDrawingCircle,
        setIsDraggingCompass,
        setCompassAngle,
        setCompassPosition,
        setTextEntries,
        setBackgroundSnapshot
    );
    const { isAdminView, teacherUid } = useBoardLoader(
        board,
        setBoard,
        resolved,
        user,
        setMediaFiles,
        auth
    );

    const handleUpdateStickyNoteText = useCallback((id, newText) => {
        setStickyNotes(prevNotes => 
            prevNotes.map(note => 
                note.id === id ? { ...note, text: newText } : note
            )
        );
    }, [setStickyNotes]);
    const handleUpdateStickyNotePosition = useCallback((id, newPosition) => {
        setStickyNotes(prevNotes => 
            prevNotes.map(note => 
                note.id === id ? { ...note, x: newPosition.x, y: newPosition.y } : note
            )
        );
    }, [setStickyNotes]);
    useWhiteboardSocket(
        sessionId,
        navigate,
        canvasRef,
        contextRef,
        socket,
        setSocket,
        setBackgroundSnapshot,
        setTextBoxes,
        setCircles,
        setLines
    );

    const textBoxesRef = useRef([]);
    textBoxesRef.current = textBoxes;

    const togglePanel = () => {
        setIsPanelOpen(prev => !prev);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const handleTouchStart = (e) => {
            if (e.target === canvas) {
                e.preventDefault();
            }
        };
        const handleTouchMove = (e) => {
            if (e.target === canvas) {
                e.preventDefault();
            }
        };
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    useEffect(() => {
        if (canvasRef.current) {
            contextRef.current = canvasRef.current.getContext('2d');
            canvasRef.current.width = 3000;
            canvasRef.current.height = 3000;
            contextRef.current.lineCap = 'round';
            contextRef.current.lineJoin = 'round';
        }
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [activeTextBox?.text]);

    // ✅ FIXED: yeh hook ab `useCanvasDrawing` se milne wale color aur lineWidth ko use kar raha hai
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth, contextRef]);
    
    const loadBoard = useCallback((boardToLoad) => {
        if (!canvasRef.current || !contextRef.current) {
            console.warn('Canvas or context is not available yet. Skipping board load.');
            return;
        }
        const img = new Image();
        img.src = boardToLoad.snapshot;
        img.onload = () => {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            contextRef.current.drawImage(img, 0, 0);
            setTextBoxes(Array.isArray(boardToLoad.textBoxes) ? boardToLoad.textBoxes : []);
            setCircles(Array.isArray(boardToLoad.circles) ? boardToLoad.circles : []);
            setStickyNotes(Array.isArray(boardToLoad.stickyNotes) ? boardToLoad.stickyNotes : []); // ✅ ADDED: Load sticky notes
            if (boardToLoad.ocrText) {
                setExtractedTextState(boardToLoad.ocrText);
            } else {
                setExtractedTextState("");
            }
            setCurrentBoardId(boardToLoad.id);
            setSelectedBoardId(boardToLoad.id);
            setBackgroundSnapshot(boardToLoad.snapshot);
            setShowSavedBoards(false);
        };
        img.onerror = (e) => {
            console.error("Error loading board snapshot image in loadBoard:", e);
        };
    }, [canvasRef, contextRef, setTextBoxes, setCircles, setExtractedTextState, setCurrentBoardId, setSelectedBoardId, setBackgroundSnapshot, setShowSavedBoards, setStickyNotes]); // ✅ UPDATED DEPENDENCY ARRAY


    useEffect(() => {
        if (board && resolved && canvasRef.current) {
            loadBoard(board);
        }
    }, [board, resolved, loadBoard, canvasRef]);

    const handleNewWhiteboard = () => {
        const userConfirmation = window.confirm("Are you sure you want to start a new whiteboard? All unsaved changes will be lost.");
        if (userConfirmation) {
            handleReset();
            setCurrentBoardId(null);
            setSelectedBoardId(null);
            alert('New whiteboard started. Click Save to create it.');
        }
    };

    const drawTextBoxesOnCanvas = async () => {
        const ctx = contextRef.current;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (backgroundSnapshot) {
            const img = new Image();
            img.src = backgroundSnapshot;
            await new Promise(resolve => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    resolve();
                };
            });
        }
    };

    const handleSave = async () => {
        if (!user) {
            alert('Please log in to save');
            return;
        }
        await drawTextBoxesOnCanvas();
        setTimeout(async () => {
            const canvas = canvasRef.current;
            const ocrText = extractedTextState || '';
    
            // Pass the state variables to the function.
            // Assuming you have access to `textBoxes` and `stickyNotes` here.
            const dataUrl = await getSnapshotWithElements(textBoxes, stickyNotes);
    
            if (currentBoardId) {
                await updateWhiteboard(currentBoardId, dataUrl, tool, color, lineWidth, textBoxes, circles, fileUrls, extractedTextState, stickyNotes);
            } else {
                const newId = await saveWhiteboard(dataUrl, tool, color, lineWidth, textBoxes, circles, fileUrls, extractedTextState, stickyNotes);
                setCurrentBoardId(newId);
            }
        }, 100);
    };

    const fetchSavedBoards = async () => {
        console.log('Attempting to fetch boards...');
        console.log('isAdminView:', isAdminView, 'teacherUid:', teacherUid, 'user.uid:', user?.uid);
        if (showSavedBoards) {
            setShowSavedBoards(false);
            return;
        }
        if (isAdminView && !teacherUid) {
            console.warn('Teacher UID is missing for admin view.');
            return;
        }
        try {
            const boards = await getWhiteboards(isAdminView, teacherUid);
            setSavedBoards(boards);
            setShowSavedBoards(true);
        } catch (error) {
            console.error('Error fetching saved boards:', error);
        }
    };

    const handleExtractedText = (text) => {
        try {
            setOcrTextBoxes([...ocrTextBoxes, { text, x: 50, y: 50 }]);
            setExtractedTextState(text);
        } catch (err) {
            console.error("Error processing extracted text in WhiteboardActivity:", err);
        }
    };

    const handleTextCanvasClick = (e) => {
        const { x, y } = getScaledCoordinates(e);
        setActiveTextBox({ x, y, text: '', font: 'Arial', size: 20, color: '#000000', bold: false, italic: false, underline: false });
    };
    const handleDeleteStickyNote = useCallback((id) => {
        setStickyNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    }, [setStickyNotes]);
    return (
        <div className="flex w-screen h-screen bg-white overflow-hidden">

{stickyNotes.map(note => (
    <StickyNote
        key={note.id}
        note={note}
        onUpdateText={handleUpdateStickyNoteText}
        onUpdatePosition={handleUpdateStickyNotePosition}
        onDelete={handleDeleteStickyNote} // ✅ Add this line
    />
))}

            {isPanelOpen && (
                <div className="w-[300px] h-full overflow-y-auto bg-white shadow-lg z-10" style={{ position: 'relative' }}>
                    <SidePanel
                        onTextExtracted={handleExtractedText}
                        ocrText={extractedTextState}
                        userId={isAdminView ? teacherUid : user?.uid}
                    />
                </div>
            )}
            <canvas
                ref={canvasRef}
                style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
                onMouseDown={tool === 'compass' ? handleMouseDown : startDrawing}
                onMouseMove={tool === 'compass' ? undefined : drawLine}
                onMouseUp={tool === 'compass' ? undefined : finishDrawing}
                onClick={tool === 'text' ? handleTextCanvasClick : undefined}
                onTouchStart={tool === 'compass' ? handleMouseDown : startDrawing}
                onTouchMove={tool === 'compass' ? undefined : drawLine}
                onTouchEnd={tool === 'compass' ? undefined : finishDrawing}
                className="absolute top-0 left-0 cursor-crosshair"
            />


            <WhiteboardTextLayer
                activeTextBox={activeTextBox}
                setActiveTextBox={setActiveTextBox}
                textBoxes={textBoxes}
                setTextBoxes={setTextBoxes}
                tool={tool}
                setTool={setTool}
                sessionId={sessionId}
                socket={socket}
                hoveredBox={hoveredBox}
                setHoveredBox={setHoveredBox}
                draggingIndex={draggingIndex}
                setDraggingIndex={setDraggingIndex}
                setDragOffset={setDragOffset}
                dragOffset={dragOffset}   
                         />


            {showSavedBoards && (
                <div className="absolute top-0 right-0 w-64 h-full overflow-auto z-40 p-4 shadow-lg bg-blue-600 rounded-l-xl text-white">
                    <h3 className="text-lg font-bold mb-2">Saved Lessons:</h3>
                    {savedBoards.map((board, index) => (
                        <div key={index} className="mb-4 bg-white rounded-lg overflow-hidden shadow text-black">
                            <img
                                src={board.snapshot}
                                alt={`Whiteboard ${index + 1}`}
                                onClick={() => loadBoard(board)}
                                className="w-full h-auto cursor-pointer rounded-t-lg"
                            />
                            <div className="flex justify-between items-center px-2 py-1 bg-blue-500 text-white text-xs rounded-b-lg">
                                <span className="truncate">{board.createdAt?.toDate?.().toLocaleString() || 'Unknown'}</span>
                                <button
                                    onClick={async () => {
                                        const confirmDelete = window.confirm('Delete this whiteboard?');
                                        if (confirmDelete) {
                                            await deleteWhiteboard(board.id);
                                            setSavedBoards(prev => prev.filter(b => b.id !== board.id));
                                        }
                                    }}
                                    className="hover:text-red-200"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showRuler && (
                <RulerTool
                    showRuler={showRuler}
                    setShowRuler={setShowRuler}
                    rulerPosition={rulerPosition}
                    setRulerPosition={setRulerPosition}
                    isDraggingRuler={isDraggingRuler}
                    setIsDraggingRuler={setIsDraggingRuler}
                    setTool={setTool}
                />
            )}
            {tool === 'compass' && (
                <img
                    src="/assets/compass.png"
                    alt="Compass"
                    style={{
                        position: 'absolute',
                        left: `${compassPosition.x}px`,
                        top: `${compassPosition.y}px`,
                        width: '100px',
                        height: '100px',
                        transform: `rotate(${compassAngle}rad)`,
                        transformOrigin: 'center center',
                        zIndex: 30,
                        pointerEvents: 'none',
                    }}
                />
            )}
            <WhiteboardToolbar
                tool={tool}
                setTool={setTool}
                color={color}
                setColor={setColor}
                lineWidth={lineWidth}
                setLineWidth={setLineWidth}
                history={history}
                redoStack={redoStack}
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                togglePanel={() => setIsPanelOpen(prev => !prev)}
                handleZoom={(factor) => setScale(prev => prev * factor)}
                handleNewWhiteboard={handleNewWhiteboard}
                sessionId={sessionId}
                setShowRuler={setShowRuler}
                handleSave={handleSave}
                fetchSavedBoards={fetchSavedBoards}
                canvasRef={canvasRef}
                setActiveTextBox={setActiveTextBox}
                handleReset={handleReset}
            />
        </div>
    );
};
export default WhiteboardActivity;