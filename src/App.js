import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment';
import 'moment-timezone'; 
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
<<<<<<< HEAD
import { Modal, Form, Container, Row, Col } from 'react-bootstrap'; 
=======
import { Modal, Form, Container, Row, Col } from 'react-bootstrap'; // Ensure Modal is imported here
>>>>>>> ce6cd5244b2b423a914f902f83a5878d163107fd
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

// Component to handle multiple events on the same day (expand in place on "+ more" click)
const CustomDayComponent = ({ events = [], onSelectEvent }) => {
  const [isExpanded, setIsExpanded] = useState(false); // To control the expanded state
  const maxVisibleEvents = 2; // Show up to 2 events initially
  const visibleEvents = isExpanded ? events : events.slice(0, maxVisibleEvents);
  const extraEvents = events.length - maxVisibleEvents;

  return (
    <div>
      {visibleEvents.map(event => (
        <div
          key={event.id}
          onClick={() => onSelectEvent(event)} // Handle event click
          style={{ cursor: 'pointer', backgroundColor: '#133d2d', color: 'white', padding: '3px', marginBottom: '2px' }}
        >
          {event.title}
        </div>
      ))}
      {extraEvents > 0 && !isExpanded && (
        <div 
          onClick={() => setIsExpanded(true)} // Expand to show more events on click
          style={{ cursor: 'pointer', color: 'blue', marginTop: '2px' }}>
          + {extraEvents} more
        </div>
      )}
      {isExpanded && (
        <div onClick={() => setIsExpanded(false)} style={{ cursor: 'pointer', color: 'blue', marginTop: '2px' }}>
          Show less
        </div>
      )}
    </div>
  );
};



const App = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]); // Event data
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
<<<<<<< HEAD
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
=======
  const [dateFields, setDateFields] = useState([]); // Now an array to allow selecting up to two dates
  const [calendarView, setCalendarView] = useState('month'); // Default view to 'month'
  const [dayEvents, setDayEvents] = useState([]); // Store events for a day
  const [showDayModal, setShowDayModal] = useState(false); // To control the modal
  const [highlightedEventId, setHighlightedEventId] = useState(null);

>>>>>>> ce6cd5244b2b423a914f902f83a5878d163107fd

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

  // Handle selecting/deselecting columns for event details display
const handleColumnSelect = (columnId) => {
  setSelectedColumns(prevColumns => {
    let updatedColumns;
    if (prevColumns.includes(columnId)) {
      // If the column is already selected, deselect it
      updatedColumns = prevColumns.filter(col => col !== columnId);
    } else if (prevColumns.length < 2) {
      // If less than 2 columns are selected, add the new column
      updatedColumns = [...prevColumns, columnId];
    } else {
      // Don't allow selecting more than 2 columns
      return prevColumns;
    }
    const boardId = context.boardIds[0];
    localStorage.setItem(`selectedColumns_${boardId}`, JSON.stringify(updatedColumns));
    return updatedColumns;
  });
};


const handleDateFieldChange = (fieldTitle) => {
  setDateFields(prevFields => {
    let updatedFields;
    if (prevFields.includes(fieldTitle)) {
      // If the date field is already selected, deselect it
      updatedFields = prevFields.filter(f => f !== fieldTitle);
    } else if (prevFields.length < 2) {
      // If less than 2 date fields are selected, add the new date field
      updatedFields = [...prevFields, fieldTitle];
    } else {
      // Don't allow selecting more than 2 date fields
      return prevFields;
    }
    const boardId = context.boardIds[0];
    localStorage.setItem(`dateFields_${boardId}`, JSON.stringify(updatedFields));
    return updatedFields;
  });
};


  const transformItemsToEvents = (items) => {
    const events = [];
<<<<<<< HEAD

    items.forEach((item) => {
      dateFields.forEach((dateFieldId) => {
        const dateColumn = item.column_values.find((col) => col.id === dateFieldId); // Match by ID
=======
    items.forEach(item => {
      dateFields.forEach(dateField => {
        const dateColumn = item.column_values.find(col => col.column.title === dateField);
>>>>>>> ce6cd5244b2b423a914f902f83a5878d163107fd
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
<<<<<<< HEAD
          id: `${item.id}-${dateFieldId}`, // Unique ID for each date field
          title: eventTitle || 'No Title',
=======
          id: `${item.id}-${dateField}`,
          title: eventTitle || "No Title",
>>>>>>> ce6cd5244b2b423a914f902f83a5878d163107fd
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

  const handleShowMoreEvents = (dayEvents) => {
    setDayEvents(dayEvents);
    setShowDayModal(true); // Display modal for all day events
  };
  
  const handleSelectEvent = (event) => {
    // Expand and display task details within the same calendar day section
    setHighlightedEventId(event.id); // Set the event ID to highlight/display its details inline
  };
  
  

  const handleModalClose = () => {
<<<<<<< HEAD
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
=======
    setDayEvents([]);
    setShowDayModal(false);
>>>>>>> ce6cd5244b2b423a914f902f83a5878d163107fd
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
<<<<<<< HEAD
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
=======
<Calendar
  localizer={localizer}
  events={events.map(event => ({
    ...event,
    start: moment.utc(event.start).toDate(),  // Ensure the start time is treated as UTC
    end: moment.utc(event.end).toDate(),      // Ensure the end time is treated as UTC
  }))}
  views={['month', 'week', 'day']}
  view={calendarView} // Controlled view from state
  onView={handleViewChange} // Handle view change
  startAccessor="start"
  endAccessor="end"
  eventPropGetter={() => ({
    style: {
      backgroundColor: '#133d2d', // Set consistent color for all events
      color: 'white', // Ensure text is readable
    }
  })} // Keep the event color as dark green for all events
  components={{
    month: {
      dateCellWrapper: CustomDayComponent, // Use the custom day component to handle "+ more"
    },
    event: CustomEvent,  // Use the custom event component
  }}
  onSelectEvent={(event) => handleSelectEvent(event)} // Handle event click
  style={{ height: '100%' }}
/>



>>>>>>> ce6cd5244b2b423a914f902f83a5878d163107fd
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
<<<<<<< HEAD
                  checked={dateFields.includes(col.id)}
                  onChange={() => handleDateFieldChange(col.id)}
                  disabled={dateFields.length >= 2 && !dateFields.includes(col.id)}
=======
                  checked={dateFields.includes(col.title)}
                  onChange={() => handleDateFieldChange(col.title)}
                  disabled={dateFields.length >= 2 && !dateFields.includes(col.title)}
>>>>>>> ce6cd5244b2b423a914f902f83a5878d163107fd
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

      {/* Modal to Show Events on a Selected Day */}
      <Modal show={showDayModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Events for the Day</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dayEvents.length === 0 ? (
            <p>No events scheduled for this day.</p>
          ) : (
            <ul>
              {dayEvents.map(event => (
                <li key={event.id}>
                  <strong>{event.title}</strong>
                  <br />
                  Start: {moment(event.start).format('MMMM Do YYYY, h:mm:ss a')}
                  <br />
                  End: {moment(event.end).format('MMMM Do YYYY, h:mm:ss a')}
                </li>
              ))}
            </ul>
          )}
        </Modal.Body>
      </Modal>

      {selectedTask && (
        <Modal show={true} onHide={() => setSelectedTask(null)}>
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

