// *******************************************************************************************************************************************
                                          // Code to Retrive value from board beyond 500
// ******************************************************************************************************************************************

// import React, { useEffect, useState } from 'react';
// import mondaySdk from 'monday-sdk-js';


// const monday = mondaySdk(); 

// const App = () => {
//   const [context, setContext] = useState(null);
//   const [boardData, setBoardData] = useState([]); 
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     monday.listen("context", (res) => {
//       console.log("Context received from Monday.com:", res);
//       setContext(res.data);
//       if (res.data.boardIds && res.data.boardIds.length > 0) {
//         fetchBoardData(res.data.boardIds[0], null); 
//       }
//     });
//   }, []);

//   const fetchBoardData = async (boardId, cursor = null) => {
//     setLoading(true);

//     let query;


//     if (cursor) {
//       query = `query {
//         next_items_page(cursor: "${cursor}") {
//           cursor
//           items {
//             id
//             name
//             column_values {
//               id
//               text
//               value
//               column {
//                 title
//               }
//             }
//           }
//         }
//       }`;
//     } else {
    
//       query = `query {
//         boards(ids: 7557291696) {
//           id
//           name
//           items_page(limit: 500) {
//             cursor
//             items {
//               id
//               name
//               column_values {
//                 id
//                 text
//                 value
//                 column {
//                   title
//                 }
//               }
//             }
//           }
//         }
//       }`;
//     }

//     try {
//       const response = await monday.api(query);

//       let newItems, newCursor;

//       if (cursor) {
//         newItems = response.data.next_items_page.items;
//         newCursor = response.data.next_items_page.cursor;
//       } else {
//         newItems = response.data.boards[0].items_page.items;
//         newCursor = response.data.boards[0].items_page.cursor;
//       }

// console.log(newItems)
//       setBoardData((prevData) => [...prevData, ...newItems]);

   
//       if (newCursor) {
//         fetchBoardData(boardId, newCursor); 
//       } else {
//         setLoading(false); 
//       }
//     } catch (error) {
//       console.error("Error fetching board data:", error);
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <h1>Custom Board View</h1>
//       <h3>Board Name: {boardData.length > 0 ? boardData[0].name : "Loading..."}</h3>
//       <h3>Items:</h3>
//       <ul>
//         {boardData.map((item) => (
//           <li key={item.id}>
//             <strong>{item.name}</strong>
//             <ul>
//               {item.column_values.map((colValue) => (
//                 <li key={colValue.id}>
//                   <strong>{colValue.column.title}: </strong>
//                   {colValue.text || colValue.value}
//                 </li>
//               ))}
//             </ul>
//           </li>
//         ))}
//       </ul>
//       {loading && <p>Loading more items...</p>}
//     </div>
//   );
// };

// export default App;

// ***********************************************************************************************************************************************
// ***********************************************************************************************************************************************



// ************************************************************************************************************************************************
                                                  //  Code For Calender - graph .js
// ************************************************************************************************************************************************
import React from 'react'
import Graph from './graph'

function App() {
  return (
    <div>
      <Graph/>


    </div>
  )
}

export default App

// ************************************************************************************************************************************************
// ************************************************************************************************************************************************