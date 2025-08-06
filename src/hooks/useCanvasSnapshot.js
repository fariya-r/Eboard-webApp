// src/hooks/useCanvasSnapshot.js

import { useCallback } from 'react';

const useCanvasSnapshot = (canvasRef, contextRef, backgroundSnapshot) => {
    const drawElementsOnCanvas = useCallback(async () => {
        const ctx = contextRef.current;
        const canvas = canvasRef.current;

        if (!ctx || !canvas) {
            console.error('Canvas context or canvas reference not found.');
            return;
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    }, [canvasRef, contextRef, backgroundSnapshot]);

    const getSnapshotWithElements = useCallback(async (textBoxes, stickyNotes) => { // stickyNotes parameter is kept for consistency, even if not drawn here
        await drawElementsOnCanvas(); // This draws the background snapshot

        return canvasRef.current.toDataURL();
    }, [drawElementsOnCanvas, canvasRef]); // contextRef is no longer needed in dependencies here as we don't draw directly

    return { getSnapshotWithElements, drawElementsOnCanvas };
};

export default useCanvasSnapshot;