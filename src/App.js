import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment';
import 'moment-timezone'; // Import moment-timezone for timezone control
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dropdown, Modal, Form, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaCog } from 'react-icons/fa'; // Import the settings icon
import TaskDetails from './Taskdetails';
import './App.css';

const monday = mondaySdk();
moment.tz.setDefault('UTC'); // Set default timezone to UTC globally
const localizer = momentLocalizer(moment);

const CustomEvent = ({ event }) => {
  return (
    <div style={{ whiteSpace: 'pre-wrap' }}> {/* Ensure newlines are respected */}
      {event.title}
    </div>
  );
};

const App = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [dateFields, setDateFields] = useState([]); // Now an array to allow selecting up to two dates
  const [highlightedEventId, setHighlightedEventId] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // Default view to 'month'

  useEffect(() => {
    monday.listen("context", (res) => {
      const { boardIds } = res.data;
      setContext(res.data);
      if (boardIds && boardIds.length > 0) {
        const boardId = boardIds[0];
        loadBoardSettings(boardId);
        fetchBoardData(boardId);
        fetchBoardColumns(boardId);
      }
    });
  }, []);

  const loadBoardSettings = (boardId) => {
    const savedColumns = JSON.parse(localStorage.getItem(`selectedColumns_${boardId}`)) || [];
    const savedDateFields = JSON.parse(localStorage.getItem(`dateFields_${boardId}`)) || [];
    const savedCalendarView = localStorage.getItem(`calendarView_${boardId}`) || 'month';
    const savedEvents = JSON.parse(localStorage.getItem(`events_${boardId}`)) || [];

    setSelectedColumns(savedColumns);
    setDateFields(savedDateFields);
    setCalendarView(savedCalendarView);
    setEvents(savedEvents);
  };

  useEffect(() => {
    if (context?.boardIds) {
      fetchBoardData(context.boardIds[0]);
    }
  }, [selectedColumns, dateFields]);

  const fetchBoardData = async (boardId) => {
    setLoading(true);
    const query = `query {
           boards(ids: ${boardId}) {
         id
              name
              items_page(limit: 500) {
                cursor
                items {
                  id
                  name
                  column_values {
                    id
                    text
                    value
                    column {
                      title
                      type
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
      localStorage.setItem(`events_${boardId}`, JSON.stringify(transformedEvents));
    } catch (error) {
      console.error("Error fetching board data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardColumns = async (boardId) => {
    const query = `query {
      boards(ids: ${boardId}) {
        columns {
          id
          title
          type
        }
      }
    }`;

    try {
      const response = await monday.api(query);
      setColumns(response.data.boards[0].columns);
      const savedColumns = JSON.parse(localStorage.getItem(`selectedColumns_${boardId}`)) || [];
      const validColumns = savedColumns.filter(colId => response.data.boards[0].columns.some(col => col.id === colId));
      setSelectedColumns(validColumns);
    } catch (error) {
      console.error("Error fetching board columns:", error);
    }
  };

  const transformItemsToEvents = (items) => {
    const events = [];
    items.forEach(item => {
      dateFields.forEach(dateFieldId => {
        const dateColumn = item.column_values.find(col => col.id === dateFieldId);
        if (!dateColumn || !dateColumn.text) return;

        // Ensure the event date is in UTC and static
        const eventDate = moment.utc(dateColumn.text, "YYYY-MM-DDTHH:mm:ss").toDate();

        let eventTitle = item.name;
        if (selectedColumns.length > 0) {
          const selectedDetails = selectedColumns.map(colId => {
            const columnValue = item.column_values.find(col => col.id === colId)?.text;
            return columnValue || '';
          }).filter(Boolean).join('\n'); // Join details with a new line
          if (selectedDetails) {
            eventTitle = `${item.name}\n${selectedDetails}`; // Append selected details in a new line
          }
        }

        events.push({
          id: `${item.id}-${dateFieldId}`,
          title: eventTitle || "No Title",
          originalTitle: item.name,
          start: eventDate,
          end: eventDate,
          allDay: false,
          column_values: item.column_values,
        });
      });
    });
    return events;
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
    setSelectedColumns(prevColumns => {
      let updatedColumns;
      if (prevColumns.includes(column)) {
        updatedColumns = prevColumns.filter(col => col !== column);
      } else if (prevColumns.length < 2) {
        updatedColumns = [...prevColumns, column];
      } else {
        return prevColumns;
      }
      const boardId = context.boardIds[0];
      localStorage.setItem(`selectedColumns_${boardId}`, JSON.stringify(updatedColumns));
      return updatedColumns;
    });
  };

  const handleDateFieldChange = (field) => {
    setDateFields(prevFields => {
      let updatedFields;
      if (prevFields.includes(field)) {
        updatedFields = prevFields.filter(f => f !== field);
      } else if (prevFields.length < 2) {
        updatedFields = [...prevFields, field];
      } else {
        return prevFields;
      }
      const boardId = context.boardIds[0];
      localStorage.setItem(`dateFields_${boardId}`, JSON.stringify(updatedFields));
      return updatedFields;
    });
  };

  const handleViewChange = (newView) => {
    setCalendarView(newView);
    const boardId = context.boardIds[0];
    localStorage.setItem(`calendarView_${boardId}`, newView);
  };

  return (
    <Container fluid>
      <Row>
        <Col md={12}>
          <div className="calendar-header">
            <h1 className="calendar-heading">Calendar</h1>
            <Dropdown className="settings-icon">
              <Dropdown.Toggle variant="link" className="settings-icon">
                <FaCog /> {/* Settings icon without dropdown arrow */}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Form className="px-3">
                  <Form.Label>Select columns to display in event details</Form.Label>
                  <div style={{ maxHeight: '150px', overflowY: 'scroll' }}>
                    {columns.filter(col => col.type !== 'name').map(col => (
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
                  <Form.Label>Select up to 2 date fields for event timing</Form.Label>
                  <div style={{ maxHeight: '150px', overflowY: 'scroll' }}>
                    {columns.filter(col => col.type === 'date').map(col => (
                      <Form.Check
                        key={col.id}
                        type="checkbox"
                        label={col.title}
                        checked={dateFields.includes(col.id)}
                        onChange={() => handleDateFieldChange(col.id)}
                        disabled={dateFields.length >= 2 && !dateFields.includes(col.id)}
                      />
                    ))}
                  </div>
                </Form>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Col>

        <Col md={12}>
          <div style={{ position: 'relative', height: '600px', marginTop: '20px' }}>
            {loading && (
              <div className="calendar-loading">
                                <p>Loading board data...</p>
              </div>
            )}
            <Calendar
              localizer={localizer}
              events={events.map(event => ({
                ...event,
                start: moment.utc(event.start).toDate(),  // Ensure the start time is treated as UTC
                end: moment.utc(event.end).toDate(),      // Ensure the end time is treated as UTC
                style: event.id === highlightedEventId ? { backgroundColor: 'blue' } : {},
              }))}
              views={['month', 'week', 'day']}
              view={calendarView} // Controlled view from state
              onView={handleViewChange} // Handle view change
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={() => ({
                style: {
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              })}
              formats={{
                eventTimeRangeFormat: () => '',  // Custom format to hide time range in events
                timeGutterFormat: 'h:mm A',      // Time gutter format to show time in 12-hour format with AM/PM
                dayFormat: (date, culture, localizer) => localizer.format(moment.utc(date).toDate(), 'ddd DD/MM', culture), // Format day cells in UTC
                monthHeaderFormat: (date, culture, localizer) => localizer.format(moment.utc(date).toDate(), 'MMMM YYYY', culture), // Format month header in UTC
                agendaHeaderFormat: (range, culture, localizer) =>
                  localizer.format(moment.utc(range.start).toDate(), 'MMM DD', culture) +
                  ' - ' +
                  localizer.format(moment.utc(range.end).toDate(), 'MMM DD', culture), // Format agenda header in UTC
                agendaDateFormat: (date, culture, localizer) => localizer.format(moment.utc(date).toDate(), 'DD/MM', culture), // Format for dates in agenda view in UTC
                agendaTimeFormat: (date, culture, localizer) => localizer.format(moment.utc(date).toDate(), 'h:mm A', culture), // Time format in agenda view in UTC
                agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
                  localizer.format(moment.utc(start).toDate(), 'h:mm A', culture) + ' - ' + localizer.format(moment.utc(end).toDate(), 'h:mm A', culture), // Time range format in agenda in UTC
              }}
              components={{
                event: CustomEvent,  // Use the custom event component here
              }}
              onSelectEvent={handleEventClick}
              style={{ height: '100%' }}
            />
          </div>
        </Col>
      </Row>

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

