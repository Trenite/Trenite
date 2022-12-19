import { createStore, compose } from "redux";
import allReducers from "./reducers/reducers";
import { custombot } from "./reducers/custombot";
import { custombots } from "./reducers/custombots";

const composeEnhancers =
	typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
		? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
				trace: true,
		  })
		: compose;

try {
	var persistedState = localStorage.getItem("store");
	persistedState = JSON.parse(persistedState);
	var store = createStore(allReducers, persistedState, composeEnhancers());
} catch (error) {
	console.error(error);
	var store = createStore(allReducers, composeEnhancers());
}

window.store = store;

window.onbeforeunload = function () {
	try {
		localStorage.setItem("store", JSON.stringify(store.getState()));
	} catch (error) {}
};

window.onunload = window.onbeforeunload;

export default store;
