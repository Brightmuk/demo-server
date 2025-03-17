import {useEffect } from "react";
import SignupForm from './SignUpForm';

// function App() {

//   useEffect(() => {
//     const backButton = document.getElementById("back");

//     if (backButton) {
//       backButton.addEventListener("click", () => {
        
//         if (window.FlutterChannel) {
//           const message={'purchase_order_id': 'A2QS34', status:'PAID'};
          
//           window.FlutterChannel.postMessage(JSON.stringify(message));
//         } else {
//           console.error("FlutterChannel is not available!");
//         }
//       });
//     }

//     return () => {
//       if (backButton) {
//         backButton.removeEventListener("click", () => {});
//       }
//     };
//   }, []);


//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <h2>Payment was successful!</h2>
//       <button id="back" style={{ padding: "10px", backgroundColor: "red", color: "white" }}>Go Back</button>
//     </div>
//   );
// }
function App() {
  return (
    <div className="App">
      <SignupForm />
    </div>
  );
}

export default App;
 