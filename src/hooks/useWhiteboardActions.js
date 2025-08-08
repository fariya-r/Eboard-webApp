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
    const restoreState = useCallback((state) => {
        if (!state || !contextRef.current || !canvasRef.current) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setBackgroundSnapshot(null);
            setTextBoxes([]);
            setCircles([]);
            setTextEntries([]);
            return;
        }

        // Use Promise to handle the async image loading
        const img = new Image();
        img.src = state.canvasData;
        img.onload = () => {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            contextRef.current.drawImage(img, 0, 0);
            setBackgroundSnapshot(state.canvasData);
            setTextBoxes(state.textBoxes || []);
            setCircles(state.circles || []);
            setTextEntries(state.textEntries || []);
        };
    }, [canvasRef, contextRef, setBackgroundSnapshot, setTextBoxes, setCircles, setTextEntries]);


    const handleUndo = useCallback(() => {
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            setRedoStack(prev => [lastState, ...prev]);
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);

            const prevState = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
            restoreState(prevState);
        }
    }, [history, setHistory, setRedoStack, restoreState]);

    const handleRedo = useCallback(() => {
        if (redoStack.length > 0) {
            const nextState = redoStack[0];
            setHistory(prev => [...prev, nextState]);
            setRedoStack(redoStack.slice(1));
            restoreState(nextState);
        }
    }, [history, setHistory, redoStack, setRedoStack, restoreState]);


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