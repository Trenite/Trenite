import React, { Component } from "react";
import "./oauth2.scss";
import { List, ListItem, Page, Navbar } from "framework7-react";

export default class OAuth2 extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<Page name="home">
				<Navbar title="OAuth2" backLink></Navbar>
				<List>
					<ListItem link="/oauth2/trello" title="Trello" />
					<ListItem link="/oauth2/spotify" title="Spotify" />
				</List>
			</Page>
		);
	}
}
