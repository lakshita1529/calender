import React, { useMemo } from 'react';
import moment from 'moment';

const TaskDetails = ({ selectedTask }) => {
  // Memoize column values to avoid unnecessary re-renders
  const memoizedColumns = useMemo(() => {
    return selectedTask.column_values || [];
  }, [selectedTask.column_values]);

  return (
    <div>
      <p><strong>Name:</strong> {selectedTask.title}</p>
      <p><strong>Date:</strong> {moment.utc(selectedTask.start).local().format('YYYY-MM-DD HH:mm')}</p>

      {memoizedColumns.length > 0 ? (
        memoizedColumns.map((column) => (
          <p key={column.id}>
            <strong>{column.column.title}:</strong> {column.text || "N/A"}
          </p>
        ))
      ) : (
        <p>No additional data available</p>
      )}
    </div>
  );
};

export default TaskDetails;
