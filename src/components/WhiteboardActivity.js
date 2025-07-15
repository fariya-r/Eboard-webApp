// ... (imports remain unchanged)
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { saveWhiteboard, getWhiteboards, updateWhiteboard, deleteWhiteboard } from '../services/whiteboardService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import CanvasRecorder from '../components/CanvasRecorder';
import RulerTool from '../components/RulerTool';


const WhiteboardActivity = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [showRuler, setShowRuler] = useState(false);
  const [rulerPosition, setRulerPosition] = useState({ x: 100, y: 100 });
  const [isDraggingRuler, setIsDraggingRuler] = useState(false);

  const [compassPosition, setCompassPosition] = useState({ x: 100, y: 100 });
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [pivotPoint, setPivotPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);
  const [circles, setCircles] = useState([]);
  const [compassAngle, setCompassAngle] = useState(0);
  const COMPASS_WIDTH = 100;
  const COMPASS_HEIGHT = 100;
  const [savedBoards, setSavedBoards] = useState([]);
  const [showSavedBoards, setShowSavedBoards] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTextBox, setActiveTextBox] = useState(null); // { x, y, text, font, size }
  const [textBoxes, setTextBoxes] = useState([]); // stores permanent boxes

  const [backgroundSnapshot, setBackgroundSnapshot] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [lineStart, setLineStart] = useState(null);


  const getScaledCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    return { x, y };
  };


  const [textEntries, setTextEntries] = useState([]); // to store text objects

  const handleSave = async () => {
    if (!user) {
      alert('Login required to save');
      return;
    }

    const dataUrl = canvasRef.current.toDataURL();
    await saveWhiteboard(dataUrl, tool, color, lineWidth);
    alert('Whiteboard saved successfully!');
  };


  const fetchSavedBoards = async () => {
    if (showSavedBoards) {
      setShowSavedBoards(false); // hide if already showing
      return;
    }

    const boards = await getWhiteboards();
    setSavedBoards(boards);
    setShowSavedBoards(true);
  };


  const loadBoard = (board) => {
    const img = new Image();
    img.src = board.snapshot;
    img.onload = () => {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      contextRef.current.drawImage(img, 0, 0);

      // ✅ Restore draggable blue text boxes
      if (board.textBoxes && Array.isArray(board.textBoxes)) {
        setTextBoxes(board.textBoxes);
      } else {
        setTextBoxes([]); // fallback
      }

      setCurrentBoardId(board.id);
      setBackgroundSnapshot(board.snapshot); // ✅ important for drawing
      setShowSavedBoards(false);
    };
  };




  const saveCurrentWhiteboard = async () => {
    if (!user) {
      alert('Please log in to save');
      return;
    }

    // Force canvas to draw current background + text
    await drawTextBoxesOnCanvas(); // <- explicitly draw text before saving

    // Wait for canvas to update
    setTimeout(async () => {
      const dataUrl = canvasRef.current.toDataURL();

      if (currentBoardId) {
        await updateWhiteboard(currentBoardId, dataUrl, tool, color, lineWidth, textBoxes);
      } else {
        const newId = await saveWhiteboard(dataUrl, tool, color, lineWidth, textBoxes);

        setCurrentBoardId(newId);
      }

    }, 100);
  };

  const drawTextBoxesOnCanvas = async () => {
    const ctx = contextRef.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw previous canvas snapshot (if any)
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

    // ✅ Do NOT draw text boxes again here to avoid duplication
  };


  const handleTextCanvasClick = (e) => {
    const { x, y } = getScaledCoordinates(e);


    setActiveTextBox({
      x,
      y,
      text: '',
      font: 'Arial',
      size: 20,
      color: '#000000',
      bold: false,
      italic: false,
      underline: false,
    });

  };




  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 3000;
    canvas.height = 3000;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;
  }, []);

  useEffect(() => {
    contextRef.current.strokeStyle = color;
    contextRef.current.lineWidth = lineWidth;
  }, [color, lineWidth]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setUser(user); // ✅ now safe to call Firestore
      } else {
        alert('Please log in to access whiteboards.');
      }
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingIndex === null) return;

      setTextBoxes((prev) =>
        prev.map((box, i) =>
          i === draggingIndex
            ? {
              ...box,
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y,
            }
            : box
        )
      );
    };

    const handleMouseUp = () => {
      setDraggingIndex(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIndex, dragOffset]);


  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any existing transform
    ctx.scale(scale, scale);
    // Draw previous saved pen/text as background
    if (backgroundSnapshot) {
      const img = new Image();
      img.src = backgroundSnapshot;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Draw compass circles
        circles.forEach(circle => {
          ctx.beginPath();
          ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
          ctx.strokeStyle = circle.color || '#4299E1'; // allow dynamic color
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        if (pivotPoint && currentPoint && isDrawingCircle) {
          const dx = currentPoint.x - pivotPoint.x;
          const dy = currentPoint.y - pivotPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.arc(pivotPoint.x, pivotPoint.y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = '#ECC94B';
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    textBoxes.forEach(box => {
      const { x, y, text, font, size, color } = box;
      const fontStyle = `${box.italic ? 'italic ' : ''}${box.bold ? 'bold ' : ''}`;
      ctx.font = `${fontStyle}${size}px ${font}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + 40, y + 20); // adjust for padding
    });


  }, [backgroundSnapshot, circles, pivotPoint, currentPoint, isDrawingCircle, textEntries]);


  useEffect(() => {
    draw();
  }, [draw]);



  useEffect(() => {
    const handleMouseMove = (e) => {
      const { x, y } = getScaledCoordinates(e);


      if (isDraggingRuler) {
        setRulerPosition({ x, y });
      }

      if (tool === 'compass') {
        if (isDraggingCompass) {
          setCompassPosition({ x: x - dragStartOffset.x, y: y - dragStartOffset.y });
        } else if (isDrawingCircle && pivotPoint) {
          setCurrentPoint({ x, y });
          const dx = x - pivotPoint.x;
          const dy = y - pivotPoint.y;
          setCompassAngle(Math.atan2(dy, dx) + Math.PI / 2);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRuler(false);

      if (tool === 'compass') {
        setIsDraggingCompass(false);
        if (isDrawingCircle && pivotPoint && currentPoint) {
          const dx = currentPoint.x - pivotPoint.x;
          const dy = currentPoint.y - pivotPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          setCircles(prev => [...prev, { x: pivotPoint.x, y: pivotPoint.y, radius, color }]);
          setPivotPoint(null);
          setCurrentPoint(null);
          setIsDrawingCircle(false);
          setCompassAngle(0);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRuler, isDraggingCompass, isDrawingCircle, pivotPoint, currentPoint, rulerPosition, dragStartOffset, tool]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;

    if (tool === 'pen') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
    } else if (tool === 'line') {
      setLineStart({ x: offsetX, y: offsetY });
    }

    setIsDrawing(true);
  };



  const drawLine = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    if (!isDrawing) return;
    if (tool === 'pen') {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    } else if (tool === 'eraser') {
      contextRef.current.clearRect(offsetX - lineWidth, offsetY - lineWidth, lineWidth * 2, lineWidth * 2);
    }
  };

  const finishDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = nativeEvent;

    if (tool === 'pen') {
      contextRef.current.closePath();
    } else if (tool === 'line' && lineStart) {
      const ctx = contextRef.current;
      ctx.beginPath();

      // Determine whether to draw horizontal or vertical based on drag
      const dx = Math.abs(offsetX - lineStart.x);
      const dy = Math.abs(offsetY - lineStart.y);
      if (dx > dy) {
        // horizontal line
        ctx.moveTo(lineStart.x, lineStart.y);
        ctx.lineTo(offsetX, lineStart.y);
      } else {
        // vertical line
        ctx.moveTo(lineStart.x, lineStart.y);
        ctx.lineTo(lineStart.x, offsetY);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.closePath();

      setLineStart(null);
    }

    setIsDrawing(false);

    const snapshot = canvasRef.current.toDataURL();
    setHistory(prev => [...prev, snapshot]);
    setRedoStack([]);
    setBackgroundSnapshot(snapshot);
  };



  const handleMouseDown = (e) => {
    const { x, y } = getScaledCoordinates(e);

    const onCompass =
      x >= compassPosition.x &&
      x <= compassPosition.x + COMPASS_WIDTH &&
      y >= compassPosition.y &&
      y <= compassPosition.y + COMPASS_HEIGHT;

    if (onCompass && !pivotPoint) {
      setIsDraggingCompass(true);
      setDragStartOffset({ x: x - compassPosition.x, y: y - compassPosition.y });
    } else {
      if (!pivotPoint) {
        setPivotPoint({ x, y });
      } else {
        setIsDrawingCircle(true);
        setCurrentPoint({ x, y });
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = [...history].pop();
    setRedoStack([...redoStack, canvasRef.current.toDataURL()]);
    setHistory(prev => prev.slice(0, -1));
    const img = new Image();
    img.src = last;
    img.onload = () => {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      contextRef.current.drawImage(img, 0, 0);
    };
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const latest = [...redoStack].pop();
    setHistory([...history, canvasRef.current.toDataURL()]);
    setRedoStack(prev => prev.slice(0, -1));
    const img = new Image();
    img.src = latest;
    img.onload = () => {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      contextRef.current.drawImage(img, 0, 0);
    };
  };

  const handleZoom = (factor) => {
    setScale(prev => Math.max(0.1, Math.min(prev * factor, 3)));
  };

  const handleReset = () => {
    const ctx = contextRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any transforms
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Clear all state
    setCircles([]);
    setHistory([]);
    setRedoStack([]);
    setPivotPoint(null);
    setCurrentPoint(null);
    setIsDrawingCircle(false);
    setIsDraggingCompass(false);
    setCompassAngle(0);
    setCompassPosition({ x: 100, y: 100 });
    setTool(null);
    setShowRuler(false);
    setActiveTextBox(null);
    setTextEntries([]);
    setBackgroundSnapshot(null);
    setScale(1);
    setTextBoxes([]);
  };


  return (
    <div className="relative w-screen h-screen overflow-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <canvas
        ref={canvasRef}
        style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
        onMouseDown={tool === 'compass' ? handleMouseDown : startDrawing}
        onMouseMove={tool === 'compass' ? undefined : drawLine}
        onMouseUp={tool === 'compass' ? undefined : finishDrawing}
        onClick={tool === 'text' ? handleTextCanvasClick : undefined}  // ✅ Add this line
        className="absolute top-0 left-0 cursor-crosshair"
      />
      {activeTextBox && (
        <textarea
          autoFocus
          value={activeTextBox.text}
          onChange={(e) => setActiveTextBox({ ...activeTextBox, text: e.target.value })}
          style={{
            position: 'absolute',
            top: activeTextBox.y,
            left: activeTextBox.x,
            fontFamily: activeTextBox.font,
            fontSize: `${activeTextBox.size}px`,
            color: activeTextBox.color,
            border: '1px dashed #ccc',
            background: '#EBF8FF', // ✅ Light blue
            outline: 'none',
            resize: 'none',
            zIndex: 100,
          }}
        />
      )}


      {showSavedBoards && (
        <div className="absolute top-0 right-0 w-64 h-full overflow-auto z-40 p-4 shadow-lg bg-blue-600 rounded-l-xl text-white">
          <h3 className="text-lg font-bold mb-2">Saved Lessons:</h3>
          {savedBoards.map((board, index) => (
            <div key={index} className="mb-4 bg-white rounded-lg overflow-hidden shadow text-black">
              <img
                src={board.snapshot}
                alt={`Whiteboard ${index + 1}`}
                onClick={() => {
                  loadBoard(board);
                  const img = new Image();
                  img.src = board.snapshot;
                  img.onload = () => {
                    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    contextRef.current.drawImage(img, 0, 0);
                    setCurrentBoardId(board.id);
                    setShowSavedBoards(false);
                  };
                }}
                className="w-full h-auto cursor-pointer rounded-t-lg"
              />

              {/* 🔽 Date + Delete button */}
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
      {/* 1. Toolbar for current active textbox */}
      {activeTextBox && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow flex space-x-2 z-50">
          {/* Font dropdown */}
          <select
            value={activeTextBox.font}
            onChange={(e) => setActiveTextBox({ ...activeTextBox, font: e.target.value })}
          >
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>

          {/* Bold button */}
          <button
            className={`px-2 border ${activeTextBox.bold ? 'bg-gray-300' : ''}`}
            onClick={() =>
              setActiveTextBox((prev) => ({ ...prev, bold: !prev.bold }))
            }
          >
            <b>B</b>
          </button>

          {/* Italic button */}
          <button
            className={`px-2 border ${activeTextBox.italic ? 'bg-gray-300' : ''}`}
            onClick={() =>
              setActiveTextBox((prev) => ({ ...prev, italic: !prev.italic }))
            }
          >
            <i>I</i>
          </button>

          {/* Underline button */}
          <button
            className={`px-2 border ${activeTextBox.underline ? 'bg-gray-300' : ''}`}
            onClick={() =>
              setActiveTextBox((prev) => ({ ...prev, underline: !prev.underline }))
            }
          >
            <u>U</u>
          </button>


          {/* Font size dropdown */}
          <select
            value={activeTextBox.size}
            onChange={(e) => setActiveTextBox({ ...activeTextBox, size: parseInt(e.target.value) })}
          >
            <option value="14">14</option>
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="32">32</option>
          </select>

          {/* Color input */}
          <input
            type="color"
            value={activeTextBox.color}
            onChange={(e) => setActiveTextBox({ ...activeTextBox, color: e.target.value })}
          />

          {/* Done button */}
          <button
            onClick={() => {
              const newEntry = {
                text: activeTextBox.text,
                x: activeTextBox.x,
                y: activeTextBox.y + activeTextBox.size * 0.8,
                style: {
                  font: activeTextBox.font,
                  size: activeTextBox.size,
                  color: activeTextBox.color,
                }
              };
              setTextBoxes(prev => [...prev, activeTextBox]); // ✅ this keeps the box on screen
              setTimeout(() => {
                draw();
                setBackgroundSnapshot(canvasRef.current.toDataURL());
              }, 100);
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Done
          </button>
        </div>
      )}

      {/* 2. Editable light-blue textarea while typing */}
      {activeTextBox && (
        <textarea
          autoFocus
          value={activeTextBox.text}
          onChange={(e) =>
            setActiveTextBox({ ...activeTextBox, text: e.target.value })
          }
          style={{
            position: 'absolute',
            top: activeTextBox.y,
            left: activeTextBox.x,
            fontFamily: activeTextBox.font,
            fontSize: `${activeTextBox.size}px`,
            color: activeTextBox.color,
            background: '#c3e8ff',
            border: '1px dashed #6b7280',
            outline: 'none',
            resize: 'none',
            zIndex: 80,
            borderRadius: '8px',
            padding: '4px 8px',
            width: 'fit-content',
            maxWidth: '300px',
            textAlign: 'center',
            lineHeight: '1.2',
            fontWeight: activeTextBox.bold ? 'bold' : 'normal',
            fontStyle: activeTextBox.italic ? 'italic' : 'normal',
            textDecoration: activeTextBox.underline ? 'underline' : 'none',
          }}
        />
      )}


      {textBoxes.map((box, index) => (
        <textarea
          key={index}
          value={box.text}
          readOnly
          onMouseDown={(e) => {
            setDraggingIndex(index);
            setDragOffset({
              x: e.clientX - box.x,
              y: e.clientY - box.y,
            });
          }}
          style={{
            position: 'absolute',
            top: box.y,
            left: box.x,
            fontFamily: box.font,
            fontSize: `${box.size}px`,
            color: box.color,
            background: '#c3e8ff',
            border: '1px dashed #6b7280',
            outline: 'none',
            resize: 'none',
            zIndex: 80,
            borderRadius: '8px',
            padding: '6px 10px',
            width: 'fit-content',
            minWidth: '80px',
            textAlign: 'center',
            fontWeight: box.bold ? 'bold' : 'normal',        // ✅ FIXED
            fontStyle: box.italic ? 'italic' : 'normal',     // ✅ FIXED
            textDecoration: box.underline ? 'underline' : 'none', // ✅ FIXED
          }}
        />
      ))}





      <div className="fixed bottom-0 w-full bg-white p-2 shadow-inner flex justify-around items-center z-50">
        <button onClick={() => setTool('pen')}>🖊️</button>
        <button onClick={() => setTool('eraser')}>🧽</button>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
        <input type="range" min="1" max="30" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} />
        <button onClick={handleUndo}>↩️</button>
        <button onClick={handleRedo}>↪️</button>
        <button onClick={() => handleZoom(1.2)}>➕</button>
        <button onClick={() => handleZoom(0.8)}>➖</button>
        <button
          onClick={() => {
            setShowRuler((prev) => {
              const newState = !prev;
              setTool(newState ? 'line' : null); // enable line tool when showing ruler
              return newState;
            });
          }}
        >
          📏
        </button>
        

        <button onClick={() => setTool(prev => prev === 'compass' ? null : 'compass')}>🧭</button>
        <button onClick={saveCurrentWhiteboard}>💾 Save</button>
        <button onClick={fetchSavedBoards}>📂 All Lessons</button>
        <CanvasRecorder canvasRef={canvasRef} />

        <button onClick={() => {
          if (tool === 'text') {
            setTool(null);
            setActiveTextBox(null); // ❌ Hide toolbar + textarea
          } else {
            setTool('text');
          }
        }}>
          📝
        </button>
        <button onClick={handleReset} className="bg-red-500 text-white px-3 py-1 rounded">Reset</button>


      </div>
    </div>
  );
};

export default WhiteboardActivity;
