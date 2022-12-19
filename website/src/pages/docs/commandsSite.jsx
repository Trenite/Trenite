import React, { Component, Fragment } from "react";
import {
	Page,
	Navbar,
	Block,
	BlockTitle,
	NavLeft,
	Link,
	NavTitle,
	Icon,
	Card,
	CardHeader,
	CardContent,
	CardFooter,
	List,
} from "framework7-react";
import { connect } from "react-redux";
import commands from "../../components/sidebar/commands.json";
import GuildItem from "../../components/sidebar/guilditem";

import "./commandsSite.scss";

class CommandsSite extends Component {
	constructor(props) {
		super(props);
	}

	notFound() {
		return (
			<Page className="docs-command not-found">
				<Navbar sliding>
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>Command not found</NavTitle>
				</Navbar>
				<BlockTitle large>Command not found</BlockTitle>
				<BlockTitle>Sorry that command doesn't exist</BlockTitle>
			</Page>
		);
	}

	render() {
		var { name, category } = this.props;
		var docsCategory = this.props.docs.find((x) => x.category === category);
		var commandCategory = commands.find((x) => x.category === category);
		if (!docsCategory) return this.notFound();
		var command = docsCategory.commands.find((x) => x.name === name);
		if (!command) return this.notFound();
		if (commandCategory) {
			var commandDashboard = commandCategory.commands.find((x) => x.name === name);
		}
		var {
			description,
			examples,
			guildOnly,
			devOnly,
			ownerOnly,
			args,
			nsfw,
			throttling,
			userPermissions,
			aliases,
		} = command;
		examples = examples || [];
		userPermissions = userPermissions || [];
		if (ownerOnly) userPermissions.push("BOT_OWNER");
		if (devOnly) userPermissions.push("BOT_DEVELOPER");
		var categoryName = docsCategory.name.split(" • ")[1] || docsCategory.name;

		var capitalName = name
			.split("-")
			.map((name) => name.charAt(0).toUpperCase() + name.slice(1))
			.join("-");

		return (
			<Page className={"docs-command " + name}>
				<Navbar sliding>
					<NavLeft sliding>
						<Link iconF7="bars" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle sliding>{categoryName}</NavTitle>
				</Navbar>
				<Block>
					<Card>
						<CardHeader>
							{capitalName}
							{guildOnly && <Icon f7="cube_fill" tooltip="Server only"></Icon>}
							{ownerOnly && <Icon f7="person_crop_circle_fill" tooltip="Custombot Owner only"></Icon>}
							{devOnly && <Icon f7="device_laptop" tooltip="Dev only"></Icon>}
							{nsfw && <Icon tooltip="NSFW">🍆</Icon>}
						</CardHeader>
						<CardContent>
							<BlockTitle>Usage:</BlockTitle>
							<div className="usage">
								<Icon tooltip="Default prefix is !">!</Icon>
								<Icon tooltip={aliases.length ? `Aliases:\n` + aliases.map((x) => "<br/>" + x) : name}>
									{name}
								</Icon>
								&nbsp;
								{args.map((x) => {
									var tooltip = `<strong>${x.prompt
										.replace(/\n/g, "<br />")
										.replace(/\*/g, "")
										.replace(/(``)(\w+)(``)/g, '<i class="light">$2</i>')}</strong><br />`;
									tooltip += `type: ${x.type.id}<br />`;
									tooltip += x.default ? "[optional]" : "&lt;required&gt;";
									return (
										<Fragment key={x.label}>
											<Icon tooltip={tooltip}>{x.default ? `[${x.label}]` : `<${x.label}>`}</Icon>
											<span>&nbsp;</span>
										</Fragment>
									);
								})}
							</div>
							<BlockTitle>Description:</BlockTitle>
							{description}
							<BlockTitle>Examples:</BlockTitle>
							{examples.map((x) => (
								<div key={x}>{x.split(/\n/g).map((x) => [x, <br />])}</div>
							))}
							<BlockTitle>
								User permissions: <Icon f7="lock_circle"></Icon>
							</BlockTitle>
							{userPermissions.length ? userPermissions.map((x) => <div key={x}>{x}</div>) : "-"}
							<BlockTitle>
								{commandDashboard
									? "Select a server to use/setup the command"
									: "This command can't be used on the dashboard"}
							</BlockTitle>
							{commandDashboard && (
								<div className="guildsSelectorPage noselect">
									<List>
										{this.props.guilds
											.filter((x) => x.permissions & (1 << 3))
											.map((guild) => {
												return (
													<GuildItem
														added={guild.added}
														link={`/guild/${guild.id}/${category}/${name}`}
														key={guild.id}
														active={false}
														id={guild.id}
														name={guild.name}
														className={"enabled"}
														img={guild.icon}
													></GuildItem>
												);
											})}
									</List>
								</div>
							)}
						</CardContent>
					</Card>
				</Block>
			</Page>
		);
	}
}

export default connect((s) => ({
	docs: s.docs,
	guilds: s.guilds,
}))(CommandsSite);
