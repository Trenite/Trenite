import React, { Component } from "react";
import {
	Page,
	Navbar,
	Block,
	NavLeft,
	NavTitle,
	Link,
	BlockTitle,
	Col,
	Row,
	Card,
	CardContent,
	ListItem,
	Toggle,
} from "framework7-react";
import { connect } from "react-redux";
import "./guild.scss";

class Guild extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		var guild = this.props.guilds.find((x) => x.id === this.props.id);
		if (!guild) return this.props.dispatch({ type: "UNSET_GUILD" });
		this.props.dispatch({ type: "SET_GUILD", payload: guild });
	}

	notFound() {
		return (
			<Page className="docs-command not-found">
				<Navbar sliding>
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>Server not found</NavTitle>
				</Navbar>
				<BlockTitle large>Server not found</BlockTitle>
				<BlockTitle>Sorry, you are not on this server, or doesn' have permissions to access it.</BlockTitle>
			</Page>
		);
	}

	card({ name }) {
		if (name.includes("http")) {
			var img = name.split(" ")[0];
			name = name.split(" ").slice(1).join(" ");
		}
		return (
			<Col key={name} width="100" small="50" medium="50" large="33">
				<Card>
					<CardContent textColor="white" className="display-block">
						<BlockTitle>
							<span>
								{img && <img src={img}></img>}
								{name}
							</span>
							<Toggle defaultChecked></Toggle>
						</BlockTitle>
					</CardContent>
				</Card>
			</Col>
		);
	}

	render() {
		var guild = this.props.guild;
		if (!guild.selected) {
			var title = "Server not found";
		} else if (!guild.added) {
			var title = "You need to add the bot first";
		} else if (!(guild.permissions & (1 << 3))) {
			var title = "No permissions for: " + guild.name;
		} else {
			var title = guild.name;
		}

		return (
			<Page className="guild">
				<Navbar sliding>
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>{title}</NavTitle>
				</Navbar>
				<div className="container">
					<BlockTitle large>{title}</BlockTitle>
					<Row>{this.props.docs.map(this.card)}</Row>
				</div>
			</Page>
		);
	}
}

export default connect((s) => ({ guilds: s.guilds, docs: s.docs, guild: s.guild }))(Guild);

Object.defineProperty(Array.prototype, "chunk", {
	value: function (chunkSize) {
		var R = [];
		for (var i = 0; i < this.length; i += chunkSize) R.push(this.slice(i, i + chunkSize));
		return R;
	},
});
