import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App";
import store from "./store";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// Import Inter font from Google Fonts
import WebFont from "webfontloader";

WebFont.load({
  google: {
    families: ["Inter:300,400,500,600,700", "sans-serif"],
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
