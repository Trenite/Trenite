import React, { Component } from "react";
import { Page, List, ListItem, Icon, Popover, Sheet, PageContent, BlockTitle, Link } from "framework7-react";
import ReactTooltip from "react-tooltip";
import GuildItem from "./guilditem";
import "./sidebar.scss";
import discordhome from "../../assets/icons/discordhome.svg";
import { connect } from "react-redux";
import Docs from "./docs";
import commands from "./commands.json";

class Sidebar extends Component {
	constructor(props) {
		super(props);
		this.state = { custombotPopup: false };
	}

	componentDidUpdate() {
		ReactTooltip.rebuild();
	}

	selectBot(e) {
		var id = e.currentTarget.parentElement.id.replace("botSelection", "");
		var bot = this.props.custombots.find((x) => x.id === id);
		if (!bot) return;
		this.props.dispatch({ type: "SELECT_CUSTOMBOT", payload: bot });
	}

	render() {
		var { device, guilds } = this.props;
		if (this.props.route) {
			if (this.props.route.route.path.includes("/guild/:id")) {
				var id = this.props.route.params.id;
			}
		}

		return (
			<Page className="mySidebarPage">
				<div className="guildsSelectorPage noselect">
					<List>
						<GuildItem name="Home" img={discordhome} className="home" link="/"></GuildItem>
						<GuildItem
							name="Invite"
							external
							native
							icon="plus"
							link="https://invite.trenite.tk/"
						></GuildItem>
						<GuildItem
							name="Support Server"
							native
							external
							icon="question"
							link="https://support.trenite.tk/"
						></GuildItem>
						<div className="guildSeperator wrapper"></div>
						{guilds
							.filter((x) => x.permissions & (1 << 3))
							.map((guild) => {
								return (
									<GuildItem
										added={guild.added}
										link={`/guild/${guild.id}`}
										key={guild.id}
										active={id === guild.id}
										id={guild.id}
										name={guild.name}
										className={"enabled"}
										img={guild.icon}
									></GuildItem>
								);
							})}
					</List>
					<ReactTooltip
						backgroundColor="#000000"
						className="guildTooltip"
						type="dark"
						place="right"
						effect="solid"
					></ReactTooltip>
				</div>
				<List className="channels">
					<ListItem
						id="custombot-selection-button"
						popoverOpen={device.desktop && ".custombot-selection"}
						className="text-color-white"
						title={this.props.custombot.name}
						link="#"
						sheetOpen={device.mobile && ".custombot-selection-sheet"}
						noChevron={this.state.custombotPopup}
					>
						{this.state.custombotPopup ? <Icon size="14px" f7="xmark"></Icon> : ""}
					</ListItem>
					<div className="channelsdiv">
						{!this.props.route.route.path.includes("/guild/") ? (
							<Docs key="guildDocs" link="docs" user={this.props.user} docs={this.props.docs}></Docs>
						) : (
							<Docs
								key="guildCommands"
								link={`guild/${id}`}
								user={this.props.user}
								docs={commands}
							></Docs>
						)}
						{this.props.user.loggedin ? (
							<ListItem
								id="user-selection-button"
								className="text-color-white"
								title={this.props.user.username}
								footer={"#" + this.props.user.discriminator}
							>
								<Link slot="media" popoverOpen={device.desktop && ".user-selection"}>
									<img src={this.props.user.avatar} />
								</Link>
								<Link href="/settings" view=".view-main">
									<Icon slot="after" f7 className="pointer">
										gear_alt_fill
									</Icon>
								</Link>
								{this.props.user.role === "dev" && (
									<Link href="/developer" view=".view-main">
										<Icon slot="after" f7 className="pointer">
											lock
										</Icon>
									</Link>
								)}
							</ListItem>
						) : (
							<ListItem
								id="user-selection-button"
								className="text-color-white"
								title="Login"
								href="/oauth2/discord"
								view=".view-main"
							></ListItem>
						)}
					</div>
				</List>
				<Popover id="userTooltip" backdrop={false} className="user-selection" closeOnEscape>
					<List>
						{this.props.users.map((x) => {
							return (
								<ListItem
									onClick={this.selectUser.bind(this)}
									key={x.id}
									id={"userSelection" + x.id}
									link="#"
									popoverClose
								>
									{x.name}
									<img slot="media" src={x.logo}></img>
								</ListItem>
							);
						})}
						<ListItem link="#" popoverClose>
							Add User Account
							<Icon slot="media" f7="plus"></Icon>
						</ListItem>
					</List>
				</Popover>
				<Popover
					id="guildTooltip"
					onPopoverOpen={() => this.setState({ custombotPopup: true })}
					onPopoverClose={() => this.setState({ custombotPopup: false })}
					backdrop={false}
					className="custombot-selection"
					closeOnEscape
				>
					<List>
						{this.props.custombots.map((x) => {
							return (
								<ListItem
									onClick={this.selectBot.bind(this)}
									key={x.id}
									id={"botSelection" + x.id}
									link="#"
									popoverClose
								>
									{x.name}
									<img slot="media" src={x.logo}></img>
								</ListItem>
							);
						})}
						<ListItem link="#" popoverClose>
							Custombot
							<Icon slot="media" f7="plus"></Icon>
						</ListItem>
					</List>
				</Popover>
				<Sheet backdrop swipeToClose className="custombot-selection-sheet">
					<PageContent>
						<BlockTitle large>Choose your bot</BlockTitle>
						<List inset>
							{this.props.custombots.map((x) => {
								return (
									<ListItem
										onClick={this.selectBot.bind(this)}
										key={x.id}
										id={"botSelection" + x.id}
										link="#"
										sheetClose
									>
										{x.name}
										<img slot="media" src={x.logo}></img>
									</ListItem>
								);
							})}
							<ListItem link="#" sheetClose>
								Custombot
								<Icon slot="media" f7="plus"></Icon>
							</ListItem>
						</List>
					</PageContent>
				</Sheet>
			</Page>
		);
	}
}

export default connect((s) => ({
	device: s.device,
	guilds: s.guilds,
	custombot: s.custombot,
	custombots: s.custombots,
	docs: s.docs,
	user: s.user,
	route: s.route,
	users: s.users,
}))(Sidebar);
