import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Framework7 from "framework7/framework7-lite.esm.bundle.js";
import Framework7React from "framework7-react";
import "framework7/css/framework7.bundle.css";
import "bootstrap/dist/css/bootstrap-grid.min.css";
import "emoji-mart/css/emoji-mart.css";
import "../css/icons.css";
import "../css/app.scss";
import isMobile from "./isMobile";
import CONSTANTS from "./constants";
import App from "../components/app.jsx";
import store from "./store";
import client from "./client";

client.init();

Framework7.use(Framework7React);

if (window.chrome) console.log("%c ", CONSTANTS.CONSOLE_LOGO);
else console.log(CONSTANTS.ASCII_LOGO);

console.log("%cSTOP", CONSTANTS.CONSOLE_STOP);
console.log("%cEntering any text will gain ATTACKERS access to your Account", CONSTANTS.CONSOLE_STOP_DESCRIPTION);

store.dispatch({ type: "DEVICE", payload: isMobile.any() });

ReactDOM.render(
	<Provider store={store}>
		<App></App>
	</Provider>,
	document.getElementById("app")
);

String.prototype.escapeHTML = function () {
	var text = document.createTextNode(this);
	var p = document.createElement("p");
	p.appendChild(text);
	return p.innerHTML;
};
