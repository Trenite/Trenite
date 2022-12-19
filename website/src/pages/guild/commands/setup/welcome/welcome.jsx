import React, { Component } from "react";
import { Page, Navbar, NavLeft, NavTitle, BlockTitle, Link, Toggle } from "framework7-react";
import { connect } from "react-redux";
import ChannelList from "../../../../../components/channelList";
import RoleList from "../../../../../components/roleList";
import TextEditor from "../../../../../components/texteditor";
import api from "../../../../../js/api";
import "../../command.scss";
import "./welcome.scss";

class Welcome extends Component {
	constructor(props) {
		super(props);
	}

	get settings() {
		if (!this.props.guild.selected) return {};

		return ({ welcomeChannel, welcomeText, welcomePrivate, welcomeRoles } = this.props.guild.settings);
	}

	roleChange(role) {
		console.log("role changed", role);
	}

	async save() {
		return api.request.post("/api/bot/commands/setup/welcome", {});
	}

	render() {
		return (
			<Page className="command">
				<Navbar sliding>
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>{this.props.guild.name}</NavTitle>
				</Navbar>
				<div className="container">
					<BlockTitle className="title" large>
						Welcome
						<Toggle></Toggle>
					</BlockTitle>
					<ChannelList type="text"></ChannelList>
					<br />
					<RoleList
						onSelect={this.roleChange}
						multiple
						selected={["683027063808327745", "689887835800469509"]}
					></RoleList>
					<TextEditor></TextEditor>
				</div>
			</Page>
		);
	}
}

export default connect((s) => ({ guild: s.guild }))(Welcome);
