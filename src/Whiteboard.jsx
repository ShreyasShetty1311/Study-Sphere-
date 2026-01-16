// src/Whiteboard.jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export default function Whiteboard({ groupId }) {
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const saveTimeout = useRef(null);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');

  // Real-time sync from Firestore (force update even if similar)
  useEffect(() => {
    if (!groupId) return;

    const whiteboardDoc = doc(db, "groups", groupId, "whiteboard", "current");

    const unsubscribe = onSnapshot(whiteboardDoc, (snap) => {
      if (snap.exists()) {
        const receivedLines = snap.data()?.lines || [];
        // Always update to received data (force sync across users)
        setLines(receivedLines);
      } else {
        setLines([]); // Clear if document doesn't exist
      }
    }, (err) => {
      console.error("Sync error:", err);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Save drawing throttled
  const saveDrawing = useCallback(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      if (groupId) {
        const whiteboardDoc = doc(db, "groups", groupId, "whiteboard", "current");
        setDoc(whiteboardDoc, { lines }, { merge: true })
          .then(() => console.log("Saved to Firestore"))
          .catch(err => console.error("Save failed:", err));
      }
    }, 1500);
  }, [groupId, lines]);

  const handleMouseDown = useCallback((e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines(prev => [...prev, { tool, color, points: [pos.x, pos.y] }]);
  }, [tool, color]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing.current) return;
    const point = e.target.getStage().getPointerPosition();
    setLines(prevLines => {
      const newLines = [...prevLines];
      const lastLine = newLines[newLines.length - 1];
      if (lastLine) {
        lastLine.points = [...lastLine.points, point.x, point.y];
      }
      return newLines;
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    saveDrawing();
  }, [saveDrawing]);

  const handleMouseOut = useCallback(() => {
    isDrawing.current = false;
    saveDrawing();
  }, [saveDrawing]);

  const clearCanvas = useCallback(() => {
    setLines([]);
    saveDrawing();
  }, [saveDrawing]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#1e293b' }}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 10,
        background: 'rgba(30,41,59,0.9)',
        padding: '10px',
        borderRadius: '8px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button onClick={() => setTool('pen')} style={{ background: tool === 'pen' ? '#667eea' : '#334155' }}>Pen</button>
        <button onClick={() => setTool('eraser')} style={{ background: tool === 'eraser' ? '#667eea' : '#334155' }}>Eraser</button>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
        />
        <button onClick={clearCanvas} style={{ background: '#ef4444' }}>Clear</button>
      </div>

      {/* Canvas */}
      <Stage
        width={window.innerWidth - 40}
        height={window.innerHeight - 140}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
        ref={stageRef}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.tool === 'eraser' ? '#1e293b' : line.color}
              strokeWidth={line.tool === 'eraser' ? 40 : 5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
            />
          ))}
        </Layer>
      </Stage>

      <div style={{ position: 'absolute', bottom: 10, left: 10, color: '#aaa', fontSize: '12px' }}>
        Syncs every ~2 seconds (visible on other accounts)
      </div>
    </div>
  );
}