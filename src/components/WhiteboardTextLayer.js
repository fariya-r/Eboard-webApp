import React, { useEffect, useCallback } from 'react';
import { FaBold, FaItalic, FaUnderline, FaTimes } from 'react-icons/fa';

const WhiteboardTextLayer = ({
  activeTextBox,
  setActiveTextBox,
  textBoxes,
  setTextBoxes,
  tool,
  setTool,
  sessionId,
  socket,
  hoveredBox,
  setHoveredBox,
  draggingIndex,
  setDraggingIndex,
  setDragOffset,
  dragOffset,
  saveState
}) => {
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingIndex === null) return;
      const { clientX, clientY } = e;

      setTextBoxes(prevBoxes =>
        prevBoxes.map((box, index) => {
          if (index === draggingIndex) {
            return {
              ...box,
              x: clientX - dragOffset.x,
              y: clientY - dragOffset.y
            };
          }
          return box;
        })
      );

      if (socket) {
        socket.emit('text-box-dragged', {
          room: sessionId,
          index: draggingIndex,
          x: clientX - dragOffset.x,
          y: clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      if (draggingIndex !== null) {
        saveState();
      }
      setDraggingIndex(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIndex, dragOffset, setTextBoxes, socket, sessionId, setDraggingIndex, saveState]);

  const handleFinalizeTextBox = useCallback(() => {
    if (activeTextBox && activeTextBox.text.trim() !== '') {
      const newTextBox = { ...activeTextBox };
      setTextBoxes(prev => [...prev, newTextBox]);
      if (socket) {
        socket.emit('text-box-created', {
          room: sessionId,
          textBox: newTextBox,
        });
      }
      saveState();
    }
    setActiveTextBox(null);
  }, [activeTextBox, setTextBoxes, socket, sessionId, setActiveTextBox, saveState]);

  return (
    <>
      {activeTextBox && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow flex items-center space-x-2 z-50">
          <select
            value={activeTextBox.font}
            onChange={(e) => setActiveTextBox({ ...activeTextBox, font: e.target.value })}
            className="p-1 border rounded"
          >
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
          <button
            className={`px-2 py-1 border rounded ${activeTextBox.bold ? 'bg-gray-300' : ''}`}
            onClick={() =>
              setActiveTextBox((prev) => ({ ...prev, bold: !prev.bold }))
            }
          >
            <FaBold />
          </button>
          <button
            className={`px-2 py-1 border rounded ${activeTextBox.italic ? 'bg-gray-300' : ''}`}
            onClick={() =>
              setActiveTextBox((prev) => ({ ...prev, italic: !prev.italic }))
            }
          >
            <FaItalic />
          </button>
          <button
            className={`px-2 py-1 border rounded ${activeTextBox.underline ? 'bg-gray-300' : ''}`}
            onClick={() =>
              setActiveTextBox((prev) => ({ ...prev, underline: !prev.underline }))
            }
          >
            <FaUnderline />
          </button>
          <select
            value={activeTextBox.size}
            onChange={(e) => setActiveTextBox({ ...activeTextBox, size: parseInt(e.target.value) })}
            className="p-1 border rounded"
          >
            <option value="14">14</option>
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="32">32</option>
          </select>
          <input
            type="color"
            value={activeTextBox.color}
            onChange={(e) => setActiveTextBox({ ...activeTextBox, color: e.target.value })}
            className="w-8 h-8 rounded"
          />
          <button
            onClick={handleFinalizeTextBox}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      )}

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
        <div
          key={index}
          onMouseEnter={() => setHoveredBox(index)}
          onMouseLeave={() => setHoveredBox(null)}
          style={{
            position: 'absolute',
            top: box.y,
            left: box.x,
            cursor: draggingIndex === index ? 'grabbing' : 'grab',
          }}
          onMouseDown={(e) => {
            setDraggingIndex(index);
            setDragOffset({
              x: e.clientX - box.x,
              y: e.clientY - box.y,
            });
          }}
        >
          <textarea
            readOnly
            value={box.text}
            onDoubleClick={() => {
              setTextBoxes(prev => prev.filter((_, i) => i !== index));
              setActiveTextBox(box);
              setTool('text');
              saveState();
            }}
            style={{
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
              fontWeight: box.bold ? 'bold' : 'normal',
              fontStyle: box.italic ? 'italic' : 'normal',
              textDecoration: box.underline ? 'underline' : 'none',
            }}
          />
          {hoveredBox === index && (
            <button
              onClick={() => {
                setTextBoxes(prev => prev.filter((_, i) => i !== index));
                saveState();
              }}
              className="absolute top-[-10px] right-[-10px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center p-0 cursor-pointer"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      ))}
    </>
  );
};

export default WhiteboardTextLayer;