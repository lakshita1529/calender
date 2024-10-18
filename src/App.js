import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment';
import 'moment-timezone'; 
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal, Form, Container, Row, Col } from 'react-bootstrap'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import TaskDetails from './Taskdetails';
import './App.css';

const monday = mondaySdk();
moment.tz.setDefault('UTC'); // Set default timezone to UTC
const localizer = momentLocalizer(moment);

const CustomEvent = ({ event }) => (
  <div style={{ whiteSpace: 'pre-wrap' }}>
    {event.title}
  </div>
);

const App = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [dateFields, setDateFields] = useState([]);
  const [highlightedEventId, setHighlightedEventId] = useState(null);
  const [calendarView, setCalendarView] = useState('month');

  // Set default width style for the calendar
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .rbc-day-slot {
        min-width: 120px !important;
      }
      .rbc-header {
        min-width: 120px !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    monday.listen('context', (res) => {
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
      localStorage.setItem(`events_${boardId}`, JSON.stringify(transformedEvents));
    } catch (error) {
      console.error('Error fetching board data:', error);
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
        }
      }
    }`;

    try {
      const response = await monday.api(query);
      setColumns(response.data.boards[0].columns);
      const savedColumns = JSON.parse(localStorage.getItem(`selectedColumns_${boardId}`)) || [];
      const validColumns = savedColumns.filter(colId =>
        response.data.boards[0].columns.some(col => col.id === colId)
      );
      setSelectedColumns(validColumns);
    } catch (error) {
      console.error('Error fetching board columns:', error);
    }
  };

  const transformItemsToEvents = (items) => {
    const events = [];

    items.forEach((item) => {
      dateFields.forEach((dateFieldId) => {
        const dateColumn = item.column_values.find((col) => col.id === dateFieldId); // Match by ID
        if (!dateColumn || !dateColumn.text) return;

        const eventDate = moment.utc(dateColumn.text, 'YYYY-MM-DDTHH:mm:ss').toDate();
        let eventTitle = item.name;

        if (selectedColumns.length > 0) {
          const selectedDetails = selectedColumns
            .map((colId) => {
              const columnValue = item.column_values.find((col) => col.id === colId)?.text;
              return columnValue || '';
            })
            .filter(Boolean)
            .join('\n'); // Join details with a new line

          if (selectedDetails) {
            eventTitle = `${item.name}\n${selectedDetails}`; // Append selected details in a new line
          }
        }

        // Push an event for each valid date
        events.push({
          id: `${item.id}-${dateFieldId}`, // Unique ID for each date field
          title: eventTitle || 'No Title',
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
    setSelectedColumns((prevColumns) => {
      let updatedColumns;
      if (prevColumns.includes(column)) {
        updatedColumns = prevColumns.filter((col) => col !== column);
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

  const handleDateFieldChange = (fieldId) => {
    setDateFields((prevFields) => {
      let updatedFields;
      if (prevFields.includes(fieldId)) {
        updatedFields = prevFields.filter((f) => f !== fieldId);
      } else if (prevFields.length < 2) {
        updatedFields = [...prevFields, fieldId];
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
        <Col md={9}>
          {/* Add Calendar Heading */}
          <h2 className="calendar-heading">Calendar</h2>
          <div style={{ position: 'relative', height: '600px', marginTop: '20px' }}>
            {loading && (
              <div className="calendar-loading">
                <p>Loading board data...</p>
              </div>
            )}
            <Calendar
              localizer={localizer}
              events={events.map((event) => ({
                ...event,
                start: moment.utc(event.start).toDate(), // Ensure the start time is treated as UTC
                end: moment.utc(event.end).toDate(), // Ensure the end time is treated as UTC
                style: event.id === highlightedEventId ? { backgroundColor: '#133d2d' } : {},
              }))}
              views={['month', 'week', 'day']}
              view={calendarView} // Controlled view from state
              onView={handleViewChange} // Handle view change
              popup={true} // Enables popup for "+ more" events
              startAccessor="start"
              endAccessor="end"
              eventPropGetter={() => ({
                style: {
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  background: '#133d2d',
                },
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

        {/* Settings Sidebar on the Right */}
        <Col md={3} className="settings-sidebar">
          <div className="sidebar-header">
            <h3>Settings</h3>
          </div>
          <Form className="settings-form px-3">
            {/* Column Selection */}
            <Form.Label>Select Columns to Display in Event Details</Form.Label>
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

            {/* Date Fields Selection */}
            <Form.Label>Select Up to 2 Date Fields for Event Timing</Form.Label>
            <div style={{ maxHeight: '150px', overflowY: 'scroll' }}>
              {columns.filter(col => col.title.includes('Date')).map(col => (
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

            <hr />

            {/* View Selection */}
            <Form.Label>Select Calendar View</Form.Label>
            <Form.Control
              as="select"
              value={calendarView}
              onChange={(e) => handleViewChange(e.target.value)}
            >
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </Form.Control>
          </Form>
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

