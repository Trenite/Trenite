import React, { Fragment } from "react";
import { createStore, combineReducers, applyMiddleware } from "redux";
import {
	App,
	Panel,
	View,
	Popup,
	Page,
	Navbar,
	NavRight,
	Link,
	Block,
	BlockTitle,
	List,
	ListItem,
} from "framework7-react";
import { connect } from "react-redux";
import routes from "../js/routes";
import PWAPrompt from "react-ios-pwa-prompt";
import Sidebar from "./sidebar/sidebar";
import store from "../js/store";

class MyApp extends React.Component {
	constructor() {
		super();

		this.state = {
			f7params: {
				name: "Trenite",
				theme: "ios",
				routes: routes,
				statusbar: {
					iosOverlaysWebView: true,
				},
				serviceWorker: {
					path: process.env.NODE_ENV === "development" ? null : "/service-worker.js",
				},
				panel: {
					swipe: "left",
				},
			},
		};
	}

	$f7view(view) {
		view.on("routeChange", function (route) {
			store.dispatch({ type: "CHANGE_ROUTE", payload: route });
		});
		window.view = view;
		window.router = view.router;
		window.app = view.app;
	}

	render() {
		return (
			<Fragment>
				<PWAPrompt
					timesToShow={3}
					permanentlyHideOnDismiss={true}
					delay={60000}
					copyTitle={"Install Trenite App"}
					copyBody={"The Trenite App adds better Navigation and offline support"}
				/>

				<App params={this.state.f7params} themeDark>
					<Panel
						backdrop={false}
						// swipe
						swipeThreshold={100}
						swipeActiveArea={100}
						left
						reveal
						themeDark
						visibleBreakpoint={960}
					>
						<View>
							<Sidebar className="mySidebar"></Sidebar>
						</View>
					</Panel>
					<View
						main
						className="safe-areas"
						loadInitialPage
						pushState
						pushStateOnLoad
						pushStateRoot=""
						onViewInit={this.$f7view.bind(this)}
						animate={false}
						pushStateSeparator={window.location.origin}
					/>
				</App>
			</Fragment>
		);
	}
}

export default connect((s) => ({}))(MyApp);
