import React, { Component, Fragment } from "react";
import { Page, Navbar, NavLeft, NavTitle, Link, BlockTitle, ListInput, List, Block } from "framework7-react";
import api from "../js/api";
import { connect } from "react-redux";

class Settings extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	componentWillMount() {
		this.componentWillReceiveProps();
	}

	componentWillReceiveProps() {
		if (!this.props.user.loggedin) return;
	}

	render() {
		return (
			<Page>
				<Navbar sliding className="homeNavbar">
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>Settings</NavTitle>
				</Navbar>
				<div className="container">
					{this.props.user.loggedin ? (
						<Fragment>
							<Block>
								<BlockTitle large>Settings</BlockTitle>
							</Block>
						</Fragment>
					) : (
						<BlockTitle large>Login to change settings</BlockTitle>
					)}
				</div>
			</Page>
		);
	}
}

export default connect((s) => ({ user: s.user, device: s.device }))(Settings);
