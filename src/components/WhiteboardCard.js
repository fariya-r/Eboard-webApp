import React from 'react';
import { useNavigate } from 'react-router-dom';

const WhiteboardCard = ({ whiteboard }) => {
  const navigate = useNavigate();

  const openWhiteboard = () => {
    navigate(`/whiteboard/${whiteboard.id}`, {
      state: { whiteboard, userId: whiteboard.uid },
    });
  };

  return (
    <div
      onClick={openWhiteboard}
      className="cursor-pointer bg-white shadow rounded-xl p-4 hover:shadow-md transition"
    >
      <img
        src={whiteboard.snapshot}
        alt="Whiteboard Snapshot"
        className="w-full h-40 object-cover rounded"
      />
      <div className="mt-2 text-gray-700 text-sm">
        <div><strong>Tool:</strong> {whiteboard.tool}</div>
        <div><strong>User ID:</strong> {whiteboard.uid}</div>
        <div><strong>Created:</strong> {new Date(whiteboard.createdAt?.toDate()).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default WhiteboardCard;
