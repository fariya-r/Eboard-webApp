import React, { useRef, useEffect, useState, useCallback } from 'react';

// Main App component
const App = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // State for the compass position (top-left corner of its bounding box)
  const [compassPosition, setCompassPosition] = useState({ x: 100, y: 100 });
  // State to track if the entire compass is being dragged
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);
  // State to store the initial mouse position when dragging starts
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });

  // State for the fixed pivot point of the compass leg
  const [pivotPoint, setPivotPoint] = useState(null); // {x, y}
  // State for the current position of the moving compass leg
  const [currentPoint, setCurrentPoint] = useState(null); // {x, y}
  // State to track if the second leg is being dragged to draw a circle
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);

  // State to store all permanently drawn circles
  const [circles, setCircles] = useState([]); // [{x, y, radius}]

  // State for the rotation angle of the compass image
  const [compassAngle, setCompassAngle] = useState(0); // in radians

  // Constants for compass dimensions and appearance
  const COMPASS_WIDTH = 100;
  const COMPASS_HEIGHT = 100;
  const LEG_LENGTH = 40; // Length of the compass legs from the center
  const COMPASS_CENTER_OFFSET_X = COMPASS_WIDTH / 2;
  const COMPASS_CENTER_OFFSET_Y = COMPASS_HEIGHT / 2;

  // Function to draw the compass image (simple SVG-like representation)
  const drawCompass = useCallback((ctx, x, y, angle) => {
    ctx.save();
    // Translate to the center of the compass for rotation
    ctx.translate(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y);
    ctx.rotate(angle);
    ctx.translate(-(x + COMPASS_CENTER_OFFSET_X), -(y + COMPASS_CENTER_OFFSET_Y));

    // Draw the compass body (a circle)
    ctx.beginPath();
    ctx.arc(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y, COMPASS_WIDTH / 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4A5568'; // Dark gray
    ctx.fill();
    ctx.strokeStyle = '#2D3748'; // Even darker gray
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the two legs
    // Leg 1 (fixed leg)
    ctx.beginPath();
    ctx.moveTo(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y);
    ctx.lineTo(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y - LEG_LENGTH);
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Leg 2 (moving leg)
    ctx.beginPath();
    ctx.moveTo(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y);
    ctx.lineTo(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y + LEG_LENGTH);
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw a small circle at the tip of each leg
    ctx.beginPath();
    // Corrected typo here: COMPASS_CENTER_OFFSET_X
    ctx.arc(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y - LEG_LENGTH, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E0'; // Light gray
    ctx.fill();

    ctx.beginPath();
    // Corrected typo here: COMPASS_CENTER_OFFSET_X
    ctx.arc(x + COMPASS_CENTER_OFFSET_X, y + COMPASS_CENTER_OFFSET_Y + LEG_LENGTH, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#CBD5E0';
    ctx.fill();

    ctx.restore();
  }, [COMPASS_WIDTH, COMPASS_HEIGHT, LEG_LENGTH, COMPASS_CENTER_OFFSET_X, COMPASS_CENTER_OFFSET_Y]);

  // Main drawing function for the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all finalized circles
    circles.forEach(circle => {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#4299E1'; // Blue
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw the compass
    drawCompass(ctx, compassPosition.x, compassPosition.y, compassAngle);

    // Draw the fixed pivot point if set
    if (pivotPoint) {
      ctx.beginPath();
      ctx.arc(pivotPoint.x, pivotPoint.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#E53E3E'; // Red
      ctx.fill();
    }

    // Draw the preview circle if drawing is in progress
    if (pivotPoint && currentPoint && isDrawingCircle) {
      const dx = currentPoint.x - pivotPoint.x;
      const dy = currentPoint.y - pivotPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      ctx.beginPath();
      ctx.arc(pivotPoint.x, pivotPoint.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#ECC94B'; // Yellow (preview color)
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line for preview
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }
  }, [circles, compassPosition, compassAngle, pivotPoint, currentPoint, isDrawingCircle, drawCompass]);

  // Initialize canvas context and set up resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;

      // Set canvas dimensions to fill parent
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      // Handle canvas resizing
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
          draw(); // Redraw content on resize
        }
      });

      resizeObserver.observe(parent);

      return () => {
        resizeObserver.unobserve(parent);
      };
    }
  }, [draw]);

  // Redraw canvas whenever relevant state changes
  useEffect(() => {
    draw();
  }, [draw, circles, compassPosition, compassAngle, pivotPoint, currentPoint, isDrawingCircle]);

  // Mouse down handler for the canvas
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on the compass to drag it
    const isClickOnCompass =
      mouseX >= compassPosition.x &&
      mouseX <= compassPosition.x + COMPASS_WIDTH &&
      mouseY >= compassPosition.y &&
      mouseY <= compassPosition.y + COMPASS_HEIGHT;

    if (isClickOnCompass && !pivotPoint) { // Only drag compass if no pivot is set
      setIsDraggingCompass(true);
      setDragStartOffset({
        x: mouseX - compassPosition.x,
        y: mouseY - compassPosition.y,
      });
    } else if (!isDraggingCompass) { // If not dragging compass, handle drawing
      if (!pivotPoint) {
        // First click: set pivot point
        setPivotPoint({ x: mouseX, y: mouseY });
      } else {
        // Second click/drag: start drawing circle
        setIsDrawingCircle(true);
        setCurrentPoint({ x: mouseX, y: mouseY });
      }
    }
  };

  // Mouse move handler for the canvas
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingCompass) {
      // Update compass position
      setCompassPosition({
        x: mouseX - dragStartOffset.x,
        y: mouseY - dragStartOffset.y,
      });
    } else if (isDrawingCircle && pivotPoint) {
      // Update current point for preview
      setCurrentPoint({ x: mouseX, y: mouseY });

      // Calculate angle for compass rotation
      const dx = mouseX - pivotPoint.x;
      const dy = mouseY - pivotPoint.y;
      const angle = Math.atan2(dy, dx);
      setCompassAngle(angle + Math.PI / 2); // Adjust for compass vertical orientation
    }
  };

  // Mouse up handler for the canvas
  const handleMouseUp = () => {
    if (isDraggingCompass) {
      setIsDraggingCompass(false);
    } else if (isDrawingCircle && pivotPoint && currentPoint) {
      // Finalize the circle
      const dx = currentPoint.x - pivotPoint.x;
      const dy = currentPoint.y - pivotPoint.y;
      const radius = Math.sqrt(dx * dx + dy * dy);

      setCircles(prevCircles => [...prevCircles, { x: pivotPoint.x, y: pivotPoint.y, radius }]);

      // Reset drawing states
      setPivotPoint(null);
      setCurrentPoint(null);
      setIsDrawingCircle(false);
      setCompassAngle(0); // Reset compass angle
    }
  };

  // Reset button handler
  const handleReset = () => {
    setCircles([]);
    setPivotPoint(null);
    setCurrentPoint(null);
    setIsDrawingCircle(false);
    setIsDraggingCompass(false);
    setCompassAngle(0);
    setCompassPosition({ x: 100, y: 100 });
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleReset,
    draw,
  };
};

export default App;
