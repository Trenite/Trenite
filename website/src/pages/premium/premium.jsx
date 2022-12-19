import React, { Component, Fragment } from "react";
import { Page, Navbar, NavLeft, NavTitle, Link, BlockTitle, ListInput, List, Block, ListItem } from "framework7-react";
import api from "../../js/api";
import { connect } from "react-redux";

class Premium extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	render() {
		return (
			<Page>
				<Navbar sliding className="homeNavbar">
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>Premium</NavTitle>
				</Navbar>
				<div className="container">
					<BlockTitle>Perks</BlockTitle>
					<List>
						<ListItem>- Custombots (Own bot with custom profile picture and name)</ListItem>
						<ListItem>- 24/7 Music</ListItem>
						<ListItem>- Fortnite custom games without member limit</ListItem>
						<ListItem>- Multiple YouTube Sub Counter</ListItem>
						<ListItem>- Change message look</ListItem>
						<ListItem>- Support the developers to host the bot</ListItem>
					</List>
					{this.props.user.loggedin ? <div></div> : <BlockTitle>Login to buy premium</BlockTitle>}
				</div>
			</Page>
		);
	}
}

export default connect((s) => ({ user: s.user, device: s.device }))(Premium);
