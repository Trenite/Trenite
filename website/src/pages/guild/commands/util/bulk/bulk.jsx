import React, { Component } from "react";
import { Page, Navbar, NavLeft, NavTitle, BlockTitle, Link, Toggle } from "framework7-react";
import { connect } from "react-redux";
import Dropdown from "../../../../../components/dropdown";
import "../../command.scss";
import "./bulk.scss";

class Bulk extends Component {
	constructor(props) {
		super(props);
		this.state = {
			type: false,
		};

		var permissions = {
			administrator: "exists",
			create_instant_invite: "exists",
			kick_members: "exists",
			ban_members: "exists",
			manage_channels: "exists",
			manage_guild: "exists",
			add_reactions: "exists",
			view_audit_log: "exists",
			priority_speaker: "exists",
			stream: "exists",
			view_channel: "exists",
			send_messages: "exists",
			send_tts_messages: "exists",
			manage_messages: "exists",
			embed_links: "exists",
			attach_files: "exists",
			read_message_history: "exists",
			mention_everyone: "exists",
			use_external_emojis: "exists",
			view_guild_insights: "exists",
			connect: "exists",
			speak: "exists",
			mute_members: "exists",
			deafen_members: "exists",
			move_members: "exists",
			use_vad: "exists",
			change_nickname: "exists",
			manage_nicknames: "exists",
			manage_roles: "exists",
			manage_webhooks: "exists",
			manage_emojis: "exists",
		};

		this.properties = {
			user: {
				"@all": "exists",
				joinedDate: "time",
				booster: "exists",
				username: "string",
				avatar: "exists",
				bot: "boolean",
				roles: "role",
				createdDate: "time",
				presence: {
					status: ["online", "offline"],
					game_name: "string",
				},
				voice: {
					mute: "exists",
					channel: "channel",
					mute: "exists",
					mute: "exists",
				},
				permissions,
			},
			channel: {
				name: "string",
				id: "channel",
				createdDate: "time",
				category: "category",
				position: "number",
				type: ["text", "voice", "category"],
			},
			role: {
				name: "string",
				id: "role",
				color: "color",
				createdDate: "time",
				position: "number",
				permissions,
			},
			message: {},
		};
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
						Bulk
						<Toggle></Toggle>
					</BlockTitle>
					<Dropdown
						items={["USER", "ROLE", "CHANNEL", "MESSAGE"]}
						onSelect={(x) => this.setState({ type: x })}
					></Dropdown>
					{this.state.type}
				</div>
			</Page>
		);
	}
}

export default connect((s) => ({ guild: s.guild }))(Bulk);
