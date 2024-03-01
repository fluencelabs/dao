import "./globals";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "./index.css";
import App from "./components/App/App";
import reportWebVitals from "./reportWebVitals";
import rootReducer from "./store/reducers/root";
import { applyMiddleware, compose, createStore } from "redux";
import { thunk } from "redux-thunk";
import { Web3ContextProvider } from "./context/web3Context";

const composeEnhancers =
  (process.env.NODE_ENV === "development"
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : null) || compose;

const enhancer = composeEnhancers(applyMiddleware(thunk));

// const store = createStore(rootReducer, applyMiddleware(thunk))
const store = createStore(rootReducer, enhancer);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Web3ContextProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Web3ContextProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
