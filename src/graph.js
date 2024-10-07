import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import TaskDetails from './Taskdetails'; 

const monday = mondaySdk();
const localizer = momentLocalizer(moment);

const App = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]); 
  const [dateField, setDateField] = useState('start'); 
  const [showSettings, setShowSettings] = useState(false); 
  useEffect(() => {
    monday.listen("context", (res) => {
      setContext(res.data);
      if (res.data.boardIds && res.data.boardIds.length > 0) {
        fetchBoardData(res.data.boardIds[0]);
        fetchBoardColumns(res.data.boardIds[0]); 
      }
    });
  }, [selectedColumns, dateField]);

 
  const fetchBoardData = async (boardId) => {
    setLoading(true);

    const query = `query {
      boards(ids: 7557291696) {
        id
        name
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
              column {
                title
              }
            }
          }
        }
      }
    }`;

    try {
      const response = await monday.api(query);
      const newItems = response.data.boards[0].items_page.items;

      const transformedEvents = newItems.map(item => {
        const startDateColumn = item.column_values.find(col => col.column.title === 'Start Date');
        const endDateColumn = item.column_values.find(col => col.column.title === 'End Date');
        const locationColumn = item.column_values.find(col => col.column.title === 'Location');
        const phoneColumn = item.column_values.find(col => col.column.title === 'Phone Number');
        const investmentCostColumn = item.column_values.find(col => col.column.title === 'Investment Cost');
        const statusColumn = item.column_values.find(col => col.column.title === 'Status');

        const eventStartDate = startDateColumn && startDateColumn.text ? new Date(startDateColumn.text) : null;
        const eventEndDate = endDateColumn && endDateColumn.text ? new Date(endDateColumn.text) : null;

        
        let eventTitle = item.name;

        
        if (selectedColumns.length > 0) {
          const selectedDetails = selectedColumns.map(colId => {
            const columnValue = item.column_values.find(col => col.id === colId)?.text;
            return columnValue || ''; 
          }).filter(Boolean).join(', ');

          if (selectedDetails) {
            eventTitle = `${item.name} - ${selectedDetails}`; 
          }
        }

       
        const eventDate = dateField === 'start' ? eventStartDate : eventEndDate;

        if (eventDate) {
          return {
            id: item.id,
            title: eventTitle, 
            originalTitle: item.name, 
            start: eventDate,
            end: eventDate,
            allDay: false,
            column_values: item.column_values, 
            additionalData: {
              phoneNumber: phoneColumn?.text,
              investmentCost: investmentCostColumn?.text,
              location: locationColumn?.text,  
              status: statusColumn?.text,   
            }
          };
        }
        return null;
      }).filter(event => event !== null);

      setEvents(transformedEvents);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching board data:", error);
      setLoading(false);
    }
  };


  const fetchBoardColumns = async (boardId) => {
    const query = `query {
      boards(ids: 7557291696) {
        columns {
          id
          title
        }
      }
    }`;

    try {
      const response = await monday.api(query);
      const boardColumns = response.data.boards[0].columns;

      setColumns(boardColumns); 
    } catch (error) {
      console.error("Error fetching board columns:", error);
    }
  };

  const handleEventClick = (event) => {
   
    setSelectedTask({ ...event, title: event.originalTitle });
  };

  const handleModalClose = () => {
    setSelectedTask(null);
  };


  const handleColumnSelect = (column) => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns(selectedColumns.filter(col => col !== column));
    } else if (selectedColumns.length < 2) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleDateFieldChange = (e) => {
    setDateField(e.target.value);
  };

  return (
    <div>
      <h1>Calendar</h1>

    
      <Button variant="secondary" onClick={() => setShowSettings(true)} style={{ marginTop: '20px' }}>
        Settings
      </Button>

      <div style={{ height: '500px', marginTop: '20px' }}>
        <Calendar
          localizer={localizer}
          events={events.map(event => ({
            ...event,
            title: event.title
          }))}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleEventClick}
          style={{ height: 500 }}
        />
      </div>

      {loading && <p>Loading board data...</p>}

    
      {showSettings && (
        <Modal show={true} onHide={() => setShowSettings(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Label>Select up to 2 columns to display</Form.Label>
              {columns
                .filter(col => col.title !== 'Name') 
                .map(col => (
                  <Form.Check
                    key={col.id}
                    type="checkbox"
                    label={col.title}
                    checked={selectedColumns.includes(col.id)}
                    onChange={() => handleColumnSelect(col.id)}
                    disabled={selectedColumns.length >= 2 && !selectedColumns.includes(col.id)}
                  />
                ))}

              <hr />

              <Form.Label>Select Date Field for Event Placement</Form.Label>
              <Form.Check
                type="radio"
                label="Start Date"
                value="start"
                checked={dateField === 'start'}
                onChange={handleDateFieldChange}
              />
              <Form.Check
                type="radio"
                label="End Date"
                value="end"
                checked={dateField === 'end'}
                onChange={handleDateFieldChange}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* TaskList (Read-Only) */}
      {selectedTask && (
        <Modal show={true} onHide={handleModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>Task Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TaskDetails selectedTask={selectedTask} />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default App;
