import React from 'react';
import moment from 'moment';

const TaskDetails = ({ selectedTask }) => {
  return (
    <div>
      <p><strong>Name:</strong> {selectedTask.title}</p>
      <p><strong>Location:</strong> {selectedTask.additionalData?.location || "N/A"}</p>
      <p><strong>Phone Number:</strong> {selectedTask.additionalData?.phoneNumber || "N/A"}</p>
      <p><strong>Status:</strong> {selectedTask.additionalData?.status || "N/A"}</p>
      <p><strong>Start Date:</strong> {moment(selectedTask.start).format('YYYY-MM-DD HH:mm')}</p>
      <p><strong>End Date:</strong> {moment(selectedTask.end).format('YYYY-MM-DD HH:mm')}</p>
      <p><strong>Investment Cost:</strong> {selectedTask.additionalData?.investmentCost || "N/A"}</p>
    </div>
  );
};

export default TaskDetails;
