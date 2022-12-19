import React, { Component } from "react";
import {
	Page,
	Navbar,
	NavLeft,
	NavTitle,
	NavRight,
	Link,
	Row,
	Col,
	Button,
	Menu,
	MenuDropdown,
	MenuItem,
	Icon,
	MenuDropdownItem,
} from "framework7-react";
import { connect } from "react-redux";
import "./home.scss";
import logo from "../assets/icons/512x512.png";

class Home extends Component {
	constructor(props) {
		super(props);
	}

	invite(permissions) {
		var id = this.props.custombot ? this.props.custombot.id : "689577516150816866";
		var win = window.open(
			`https://discord.com/oauth2/authorize?client_id=${id}&permissions=${permissions}&scope=bot`,
			"_blank",
			`height=1000,width=600,location=0,menubar=0,resizable=1,scrollbars=1,status=0,toolbar=0`
		);
	}

	render() {
		var { loggedin, username, avatar } = this.props.user;

		return (
			<Page name="home">
				<Navbar sliding className="homeNavbar">
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>Trenite Discord Bot</NavTitle>
					<NavRight sliding>
						{!loggedin && (
							<Link
								href="/oauth2/discord"
								noLinkClass
								className="text-color-white button button-fill button-raised"
							>
								Login
							</Link>
						)}
					</NavRight>
				</Navbar>
				<div className="center-all">
					<div className="wrapper">
						<h1>Trenite the only Discord Bot you'll ever need</h1>
						<h3 className="text-color-gray">
							Configure moderation, leveling, Twitch alerts, and much more with the most easy-to-use
							dashboard!
						</h3>
						<img className="logo" src={logo} alt="logo"></img>

						<Row className="noselect">
							<Col width="33">
								{this.props.user.loggedin ? (
									<Button large panelOpen="left" raised fill href="">
										Dashboard
									</Button>
								) : (
									<Button large raised fill href="/oauth2/discord">
										Login
									</Button>
								)}
							</Col>
							<Col width="33" className="docs-flex">
								<Button onClick={this.invite.bind(this, 8)} className="docs" large raised>
									Invite
								</Button>
								<MenuItem iconOnly dropdown>
									<Icon f7>chevron_down</Icon>
									<MenuDropdown left>
										<MenuDropdownItem onClick={this.invite.bind(this, 8)} text="Administrator" />
										<MenuDropdownItem
											onClick={this.invite.bind(this, 2146958807)}
											text="Moderator"
										/>
										<MenuDropdownItem onClick={this.invite.bind(this, 37080128)} text="User" />
										<MenuDropdownItem onClick={this.invite.bind(this, 0)} text="No Permissions" />
									</MenuDropdown>
								</MenuItem>
							</Col>
						</Row>
					</div>
				</div>
			</Page>
		);
	}
}

export default connect((s) => ({ user: s.user, custombot: s.custombot }))(Home);
