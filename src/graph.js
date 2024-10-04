import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import moment from 'moment'; 
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css'; 

const monday = mondaySdk(); 
const localizer = momentLocalizer(moment); 

const App = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    monday.listen("context", (res) => {
      console.log("Context received from Monday.com:", res);
      setContext(res.data);
      if (res.data.boardIds && res.data.boardIds.length > 0) {
        fetchBoardData(res.data.boardIds[0]); 
      }
    });
  }, []);

  const fetchBoardData = async () => {
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
      console.log("Fetched items:", newItems);

      // Convert items to calendar events
      const transformedEvents = newItems.map(item => {
        const dateColumn = item.column_values.find(col => col.column.title === 'Tenure End Period');
        const locationColumn = item.column_values.find(col => col.column.title === 'Location'); 

        if (dateColumn && dateColumn.value) {
          const parsedValue = JSON.parse(dateColumn.value); // Assuming the time and date are stored as JSON
          const eventStartTime = `${parsedValue.date}T${parsedValue.time}`;
          const startTime = new Date(eventStartTime);

          return {
            id: item.id,
            title: item.name,
            location: locationColumn ? locationColumn.text : "No Location", 
            start: startTime,  // Event start time
            end: startTime,    // Single point event, end same as start
            allDay: false      // Specific times, so not an all-day event
          };
        } else {
          console.log(`Invalid or missing date for item ${item.name}: `, dateColumn);
        }
        return null;
      }).filter(event => event !== null);

      console.log("Transformed events:", transformedEvents);

      setEvents(transformedEvents);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching board data:", error);
      setLoading(false);
    }
  };

  // Custom event rendering to display the event title and location
  const EventComponent = ({ event }) => (
    <div>
      <span style={{ color: 'white', fontWeight: 'bold', display: 'block' }}>
        {event.title}
      </span>
      <span style={{ color: 'white', display: 'block'}}>
        {event.location}
      </span>
    </div>
  );

  return (
    <div>
      <h1>Board View with Calendar</h1>
      <div style={{ height: '500px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          min={new Date(2024, 9, 2, 0, 0)} // Start calendar day at 12:00 AM
          max={new Date(2024, 9, 2, 23, 59)} // End calendar day at 11:59 PM
          components={{
            event: EventComponent 
          }}
        />
      </div>
      {loading && <p>Loading board data...</p>}
    </div>
  );
};

export default App;
