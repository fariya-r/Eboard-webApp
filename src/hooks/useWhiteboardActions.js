// src/hooks/useWhiteboardActions.js
import { useCallback } from 'react';

const useWhiteboardActions = (
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
) => {
    //
    // --- Undo and Redo Functions ---
    //
    const handleUndo = useCallback(() => {
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            setRedoStack(prev => [lastState, ...prev]);
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            
            const prevState = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
            
            if (contextRef.current && canvasRef.current) {
                // Clear the canvas
                contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                
                if (prevState) {
                    const img = new Image();
                    img.src = prevState.canvasData;
                    img.onload = () => {
                        contextRef.current.drawImage(img, 0, 0);
                        setBackgroundSnapshot(prevState.canvasData);
                    };
                } else {
                    setBackgroundSnapshot(null); // Clear the background
                }
                
                setTextBoxes(prevState ? prevState.textBoxes : []);
                setCircles(prevState ? prevState.circles : []);
                setTextEntries(prevState ? prevState.textEntries : []);
            }
        }
    }, [history, setHistory, redoStack, setRedoStack, canvasRef, contextRef, setBackgroundSnapshot, setTextBoxes, setCircles, setTextEntries]);

    const handleRedo = useCallback(() => {
        if (redoStack.length > 0) {
            const nextState = redoStack[0];
            setHistory(prev => [...prev, nextState]);
            setRedoStack(redoStack.slice(1));
            
            if (contextRef.current && canvasRef.current) {
                // Redraw the canvas to the redone state
                contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                const img = new Image();
                img.src = nextState.canvasData;
                img.onload = () => {
                    contextRef.current.drawImage(img, 0, 0);
                    setBackgroundSnapshot(nextState.canvasData);
                };
                
                setTextBoxes(nextState.textBoxes);
                setCircles(nextState.circles);
                setTextEntries(nextState.textEntries);
            }
        }
    }, [history, setHistory, redoStack, setRedoStack, canvasRef, contextRef, setBackgroundSnapshot, setTextBoxes, setCircles, setTextEntries]);


    //
    // --- Zoom and Reset Functions ---
    //
    const handleZoom = useCallback((zoomFactor) => {
        setScale(prev => prev * zoomFactor);
    }, [setScale]);

    const handleReset = useCallback(() => {
        if (contextRef.current && canvasRef.current) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setHistory([]);
            setRedoStack([]);
            setScale(1);
            setTool('pen');
            setShowRuler(false);
            setActiveTextBox(null);
            setTextBoxes([]);
            setCircles([]);
            
            // Compass states ko reset karein
            setPivotPoint(null);
            setCurrentPoint(null);
            setIsDrawingCircle(false);
            setIsDraggingCompass(false);
            
            // Add a check to make sure setCompassAngle is a function before calling it
            if (typeof setCompassAngle === 'function') {
                setCompassAngle(0);
            }
            
            setCompassPosition({ x: 100, y: 100 });
            
            setTextEntries([]);
            setBackgroundSnapshot(null);
            console.log("Whiteboard reset successfully.");
        }
    }, [contextRef, canvasRef, setHistory, setRedoStack, setScale, setTool, setShowRuler, setActiveTextBox, setTextBoxes, setCircles, setPivotPoint, setCurrentPoint, setIsDrawingCircle, setIsDraggingCompass, setCompassAngle, setCompassPosition, setTextEntries, setBackgroundSnapshot]);
    
    return {
        handleUndo,
        handleRedo,
        handleZoom,
        handleReset
    };
};

export default useWhiteboardActions;