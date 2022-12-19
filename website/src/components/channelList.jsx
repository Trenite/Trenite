import React, { Component } from "react";
import { Menu, MenuItem, MenuDropdownItem, MenuDropdown, List, ListItem } from "framework7-react";
import { connect } from "react-redux";
import "./channelList.scss";
import discordtextchannel from "../assets/icons/discordtextchannel.svg";
import discordvoicechannel from "../assets/icons/discordvoicechannel.svg";

function Channel({ type, name, active, id }) {
	return (
		<MenuDropdownItem id={id} divider={type === "category"} className={(active && "active") || ""} text={name}>
			{type === "text" ? (
				<img src={discordtextchannel}></img>
			) : type === "voice" ? (
				<img src={discordvoicechannel}></img>
			) : null}
		</MenuDropdownItem>
	);
}

class ChannelList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			active: this.props.default || null,
		};
	}

	get channels() {
		var channels = [{ name: "No-Channel", id: null, parent: null }].concat(this.props.guild.channels);
		channels = channels.filter((x) => x.type === this.props.type || x.type === "category" || x.id === null);
		var newChannels = [];
		for (var i = 0; i < channels.length - 1; i++) {
			if (!(channels[i].type === "category" && channels[i + 1].type === "category" && channels[i].id !== null)) {
				newChannels.push(channels[i]);
			}
		}
		return newChannels;
	}

	select(id) {
		this.setState({ active: id });
		var channel = this.channels.find((x) => x.id === id);
		if (!channel) return;

		var text = "Channel was removed";
		if (channel.id !== null) text = `Channel set to #${channel.name}`;

		app.toast
			.create({
				text: text.escapeHTML(),
				closeTimeout: 1500,
				closeButton: true,
				horizontalPosition: "center",
				position: this.props.device.desktop ? "bottom" : "top",
			})
			.open();

		if (this.props.onSelect) {
			this.props.onSelect(channel);
		}
	}

	onMenu(menu) {
		if (!menu.target.classList.contains("menu-dropdown-item")) return;
		var id = menu.target.id;
		if (!id) id = null;
		this.select(id);
	}

	onSelect(event) {
		var id = event.target.value;
		if (id === "null") id = null;
		this.select(id);
	}

	render() {
		if (!this.props.guild || !this.props.guild.channels) return <div></div>;
		var channels = this.channels;
		var active = channels.find((x) => x.id === this.state.active);
		if (!active) active = channels[0];

		if (this.props.device.desktop) {
			return (
				<Menu className="channeldropdown noselect">
					<MenuItem onClick={this.onMenu.bind(this)} text={active.name} dropdown>
						<MenuDropdown left contentHeight="200px">
							{channels.map((x) => (
								<Channel key={x.id} active={x.id === this.state.active} {...x}></Channel>
							))}
						</MenuDropdown>
					</MenuItem>
				</Menu>
			);
		}

		var categories = channels.filter((x) => x.type === "category");
		categories.forEach((category) => {
			category.channels = channels.filter((x) => x.parent === category.id);
		});

		return (
			<div className="menu channeldropdown noselect">
				<div className="menu-inner">
					<div className="menu-item menu-item-dropdown">
						<select onChange={this.onSelect.bind(this)} className="menu-item-content">
							<option value="null" selected={null === this.state.active}>
								No-Channel
							</option>
							{categories.map((category) => {
								return (
									<optgroup label={category.name.toUpperCase()}>
										{category.channels.map((x) => (
											<option value={x.id} selected={x.id === this.state.active}>
												{x.type === "text" && "#"}
												{x.type === "voice" && "🔈"}
												{x.name}
											</option>
										))}
									</optgroup>
								);
							})}
						</select>
					</div>
				</div>
			</div>
		);
	}
}

export default connect((s) => ({ guild: s.guild, device: s.device }))(ChannelList);
