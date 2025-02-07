import {useEffect } from "react";

function App() {

  useEffect(() => {
    const backButton = document.getElementById("back");

    if (backButton) {
      backButton.addEventListener("click", () => {
        if (window.FlutterChannel) {
          window.FlutterChannel.postMessage("back_button_clicked");
        } else {
          console.error("FlutterChannel is not available!");
        }
      });
    }

    return () => {
      if (backButton) {
        backButton.removeEventListener("click", () => {});
      }
    };
  }, []);


  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Payment was successful!</h2>
      <button id="back" style={{ padding: "10px", backgroundColor: "red", color: "white" }}>Go Back</button>
    </div>
  );
}

export default App;
 