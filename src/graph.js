import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dropdown, Modal, Form, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import TaskDetails from './Taskdetails';
import './App.css'

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
  const [subItems, setSubItems] = useState({}); 
  const [selectedSubitem, setSelectedSubitem] = useState(null);

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
      boards(ids: ${boardId}) {
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
        const dateColumn = item.column_values.find(col => col.column.title === dateField);
        const eventDate = dateColumn && dateColumn.text ? new Date(dateColumn.text).toISOString() : null;

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

        if (eventDate) {
          return {
            id: item.id,
            title: eventTitle, 
            originalTitle: item.name, 
            start: eventDate,
            end: eventDate,
            allDay: false,
            column_values: item.column_values, 
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
      boards(ids: ${boardId}) {
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
    <Container fluid>
      <Row>
        <Col md={9}>
          <h1>Calendar</h1>
          <div style={{ height: '600px', marginTop: '20px' }}>
            <Calendar
              localizer={localizer}
              events={events.map(event => ({
                ...event,
                title: event.title,
                start: moment.utc(event.start).local().toDate(), 
                end: moment.utc(event.end).local().toDate() 
              }))}
              views={['month', 'week', 'day']} // Removed 'agenda' view here
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleEventClick}
              style={{ height: '100%' }}
            />
          </div>
        </Col>
        <Col md={3}>
          <Dropdown className="mt-2">
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              Setting
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Form className="px-3">
                <Form.Label>Select to display in event details</Form.Label>
                <div style={{ maxHeight: '150px', overflowY: 'scroll' }}>
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
                </div>
                <hr />
                <Form.Label>Choose the date to base the event timing on</Form.Label>
                <div style={{ maxHeight: '150px', overflowY: 'scroll' }}>
                  {columns
                    .filter(col => col.title.includes('Date'))
                    .map(col => (
                      <Form.Check
                        key={col.id}
                        type="radio"
                        label={col.title}
                        value={col.title}
                        checked={dateField === col.title}
                        onChange={handleDateFieldChange}
                      />
                    ))}
                </div>
              </Form>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {loading && <p>Loading board data...</p>}

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
    </Container>
  );
};

export default App;
