import React, { Component } from "react";
import { ListItem, Icon } from "framework7-react";
import { connect } from "react-redux";
import api from "../../js/api";

class GuildItem extends Component {
	constructor(props) {
		super(props);
	}

	inviteGuild(guild) {
		var id = this.props.custombot.id;
		var win = window.open(
			`https://discord.com/oauth2/authorize?client_id=${id}&permissions=8&scope=bot&guild_id=${guild}`,
			"_blank",
			`height=1000,width=600,location=0,menubar=0,resizable=1,scrollbars=1,status=0,toolbar=0`
		);
		api.gateway.once("GUILD_CREATE", () => {
			win.close();
			window.router.navigate(`/guild/${guild}`);
		});
	}

	render() {
		var {
			id,
			name,
			active,
			native,
			className = "",
			icon,
			external = false,
			img,
			link = false,
			panelClose = false,
			added,
			custombot,
		} = this.props;

		return (
			<div
				key={id}
				data-tip={name}
				className={"wrapper " + ((active && "active") || "") + ((added && " added") || "")}
			>
				<div className="pill"></div>
				<ListItem
					key={id}
					className={((native && "native") || "") + (" " + (className || ""))}
					link={id ? added && link : link}
					view=".view-main"
					target="_BLANK"
					external={external}
					onClick={!added && id ? this.inviteGuild.bind(this, id) : null}
					panelClose={panelClose}
				>
					{icon ? <Icon slot="media" f7={icon} /> : img ? <img slot="media" src={img}></img> : ""}
					{!icon && !img ? (
						<span slot="media">
							{name
								.split(" ")
								.map((x) => x.charAt(0))
								.join("")}
						</span>
					) : (
						""
					)}
				</ListItem>
			</div>
		);
	}
}

export default connect((s) => ({
	custombot: s.custombot,
}))(GuildItem);
