import React from 'react';
import moment from 'moment';

const TaskDetails = ({ selectedTask }) => {

  return (
    <div>
      <p><strong>Name:</strong> {selectedTask.title}</p>
      <p><strong>Date:</strong> {moment.utc(selectedTask.start).local().format('YYYY-MM-DD HH:mm')}</p>

     
      {selectedTask.column_values && selectedTask.column_values.length > 0 ? (
        selectedTask.column_values.map((column) => (
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
