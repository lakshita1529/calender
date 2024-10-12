import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dropdown, Modal, Form, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import TaskDetails from './Taskdetails';
import './App.css';

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
  const [highlightedEventId, setHighlightedEventId] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // Default view to 'month'

  // Load settings and events from local storage on component mount
  useEffect(() => {
    monday.listen("context", (res) => {
      const { boardIds } = res.data;
      setContext(res.data);
      if (boardIds && boardIds.length > 0) {
        const boardId = boardIds[0];
        loadBoardSettings(boardId); // Load settings for the specific board
        fetchBoardData(boardId);
        fetchBoardColumns(boardId);
      }
    });
  }, []);

  // Fetch settings for the specific board
  const loadBoardSettings = (boardId) => {
    const savedColumns = JSON.parse(localStorage.getItem(`selectedColumns_${boardId}`)) || [];
    const savedDateField = localStorage.getItem(`dateField_${boardId}`) || 'start';
    const savedCalendarView = localStorage.getItem(`calendarView_${boardId}`) || 'month';
    const savedEvents = JSON.parse(localStorage.getItem(`events_${boardId}`)) || []; // Load events for the specific board

    setSelectedColumns(savedColumns);
    setDateField(savedDateField);
    setCalendarView(savedCalendarView);
    setEvents(savedEvents);
  };

  useEffect(() => {
    if (context?.boardIds) {
      fetchBoardData(context.boardIds[0]);
    }
  }, [selectedColumns, dateField]);

  // Fetch board data and transform it into events
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
      const items = response.data.boards[0].items_page.items;
      const transformedEvents = transformItemsToEvents(items);
      setEvents(transformedEvents);

      // Save events to local storage for the specific board
      localStorage.setItem(`events_${boardId}`, JSON.stringify(transformedEvents));
    } catch (error) {
      console.error("Error fetching board data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available columns for the board
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
      console.log("Fetched columns for board:", boardId, response.data.boards[0].columns);
      setColumns(response.data.boards[0].columns);

      // Check if previously selected columns are valid for the current board
      const savedColumns = JSON.parse(localStorage.getItem(`selectedColumns_${boardId}`)) || [];
      const validColumns = savedColumns.filter(colId => response.data.boards[0].columns.some(col => col.id === colId));
      setSelectedColumns(validColumns);
    } catch (error) {
      console.error("Error fetching board columns:", error);
    }
  };

  // Transform board items to calendar events
  const transformItemsToEvents = (items) => {
    return items.map(item => {
      const dateColumn = item.column_values.find(col => col.column.title === dateField);
      const eventDate = dateColumn?.text ? new Date(dateColumn.text).toISOString() : null;

      if (!eventDate) {
        console.warn(`Event skipped due to missing date field:`, item);
        return null;
      }

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

      return {
        id: item.id,
        title: eventTitle,
        originalTitle: item.name,
        start: eventDate,
        end: eventDate,
        allDay: false,
        column_values: item.column_values,
      };
    }).filter(event => event !== null);
  };

  const handleEventClick = (event) => {
    setSelectedTask({ ...event, title: event.originalTitle });
    setHighlightedEventId(event.id);
  };

  const handleModalClose = () => {
    setSelectedTask(null);
    setHighlightedEventId(null);
  };

  const handleColumnSelect = (column) => {
    setSelectedColumns((prevColumns) => {
      let updatedColumns;
      if (prevColumns.includes(column)) {
        updatedColumns = prevColumns.filter(col => col !== column);
      } else if (prevColumns.length < 2) {
        updatedColumns = [...prevColumns, column];
      } else {
        return prevColumns;
      }

      // Save selected columns to local storage for the specific board
      const boardId = context.boardIds[0];
      localStorage.setItem(`selectedColumns_${boardId}`, JSON.stringify(updatedColumns));
      return updatedColumns;
    });
  };

  const handleDateFieldChange = (e) => {
    const newDateField = e.target.value;
    setDateField(newDateField);
    
    // Save selected date field to local storage for the specific board
    const boardId = context.boardIds[0];
    localStorage.setItem(`dateField_${boardId}`, newDateField);
  };

  const handleViewChange = (newView) => {
    setCalendarView(newView);
    // Save the selected calendar view to local storage for the specific board
    const boardId = context.boardIds[0];
    localStorage.setItem(`calendarView_${boardId}`, newView);
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
                start: moment.utc(event.start).local().toDate(),
                end: moment.utc(event.end).local().toDate(),
                style: event.id === highlightedEventId ? { backgroundColor: 'blue' } : {},
              }))}
              views={['month', 'week', 'day']}
              view={calendarView} // Controlled view from state
              onView={handleViewChange} // Handle view change
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={() => ({
                style: {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              })}
              formats={{
                eventTimeRangeFormat: () => '',
                timeGutterFormat: 'h:mm A',
              }}
              onSelectEvent={handleEventClick}
              style={{ height: '100%' }}
            />
          </div>
        </Col>

        <Col md={3}>
          <Dropdown className="mt-2">
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              Settings
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Form className="px-3">
                <Form.Label>Select columns to display in event details</Form.Label>
                <div style={{ maxHeight: '150px', overflowY: 'scroll' }}>
                  {columns.filter(col => col.title !== 'Name').map(col => (
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
                <Form.Label>Choose the date field for event timing</Form.Label>
                <div style={{ maxHeight: '150px', overflowY: 'scroll' }}>
                  {columns.filter(col => col.title.includes('Date')).map(col => (
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

