import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal, Button, Form, Dropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const monday = mondaySdk();
const localizer = momentLocalizer(moment);

const App = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [filterOption, setFilterOption] = useState('name'); // Default filter to 'name'
  const [columns, setColumns] = useState([]); // To store columns of the board

  useEffect(() => {
    monday.listen("context", (res) => {
      setContext(res.data);
      if (res.data.boardIds && res.data.boardIds.length > 0) {
        fetchBoardData(res.data.boardIds[0]);
        fetchBoardColumns(res.data.boardIds[0]); // Fetch columns
      }
    });
  }, []);

  // Fetch the board data
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
        const dateColumn = item.column_values.find(col => col.column.title === 'Tenure End Period');
        const locationColumn = item.column_values.find(col => col.column.title === 'Location');

        if (dateColumn && dateColumn.text) {
          return {
            id: item.id,
            title: item.name, // Show name initially
            location: locationColumn ? locationColumn.text : "No Location",
            start: new Date(dateColumn.text),
            end: new Date(dateColumn.text),
            allDay: false,
            column_values: item.column_values, // Store all column values here for filtering
            additionalData: {
              phoneNumber: item.column_values.find(col => col.column.title === 'Phone Number')?.text,
              investmentCost: item.column_values.find(col => col.column.title === 'Investment Cost')?.text,
              joinedDate: item.column_values.find(col => col.column.title === 'Joined Date')?.text,
              tenureEndDate: dateColumn.text
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

  // Fetch the board columns dynamically
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

      setColumns(boardColumns); // Set columns in state
    } catch (error) {
      console.error("Error fetching board columns:", error);
    }
  };

  const handleEventClick = (event) => {
    setSelectedTask(event);
    setIsNew(false);
  };

  const handleSlotSelect = (slotInfo) => {
    setSelectedTask({
      title: '',
      location: '',
      start: slotInfo.start,
      end: slotInfo.end,
      additionalData: {
        phoneNumber: '',
        investmentCost: '',
        joinedDate: '',
        tenureEndDate: slotInfo.start.toISOString()
      }
    });
    setIsNew(true);
  };

  const handleModalClose = () => {
    setSelectedTask(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedTask({
      ...selectedTask,
      [name]: value
    });
  };

  const handleAdditionalDataChange = (e) => {
    const { name, value } = e.target;
    setSelectedTask({
      ...selectedTask,
      additionalData: {
        ...selectedTask.additionalData,
        [name]: value
      }
    });
  };

  // Function to handle filtering
  const handleFilterChange = (option) => {
    setFilterOption(option);
  };

  // Function to render titles based on the filter option
  const getFilteredTitle = (event) => {
    if (!event || !event.column_values) return event.title; // Fallback to the title if there's no column_values

    const columnValue = event.column_values.find(col => col.id === filterOption)?.text;
    return columnValue || event.title; // Default to name if no specific column is found
  };

  return (
    <div>
      <h1>Calendar</h1>

      {/* Dropdown Filter */}
      <Dropdown>
        <Dropdown.Toggle variant="primary" id="dropdown-basic">
          Filter: {filterOption}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {columns.map(col => (
            <Dropdown.Item key={col.id} onClick={() => handleFilterChange(col.id)}>
              {col.title}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <div style={{ height: '500px', marginTop: '20px' }}>
        <Calendar
          localizer={localizer}
          events={events.map(event => ({
            ...event,
            title: getFilteredTitle(event) // Dynamically show filtered value
          }))}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSlotSelect}
          onSelectEvent={handleEventClick}
          style={{ height: 500 }}
        />
      </div>

      {loading && <p>Loading board data...</p>}

      {selectedTask && (
        <Modal show={true} onHide={handleModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{isNew ? "Add New Task" : `Edit Task: ${selectedTask.title}`}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group>
                <Form.Label>Task Name</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={selectedTask.title}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  name="phoneNumber"
                  value={selectedTask.additionalData.phoneNumber}
                  onChange={handleAdditionalDataChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Investment Cost</Form.Label>
                <Form.Control
                  type="text"
                  name="investmentCost"
                  value={selectedTask.additionalData.investmentCost}
                  onChange={handleAdditionalDataChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Joined Date</Form.Label>
                <Form.Control
                  type="date"
                  name="joinedDate"
                  value={moment(selectedTask.additionalData.joinedDate).format('YYYY-MM-DD')}
                  onChange={handleAdditionalDataChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={selectedTask.location}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Tenure End Period</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="tenureEndDate"
                  value={moment(selectedTask.additionalData.tenureEndDate).format('YYYY-MM-DDTHH:mm')}
                  onChange={handleAdditionalDataChange}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              Close
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default App;
