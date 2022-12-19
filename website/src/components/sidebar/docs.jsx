import React, { Component } from "react";
import {
	List,
	ListItem,
	AccordionContent,
	ListInput,
	Popover,
	Page,
	Sheet,
	PageContent,
	Block,
	BlockTitle,
	Icon,
} from "framework7-react";
import discordtextchannel from "../../assets/icons/discordtextchannel.svg";
import { connect } from "react-redux";
import "./docs.scss";

class Docs extends Component {
	constructor(props) {
		super(props);

		this.state = { open: false, results: false, selected: 0 };
		this.search = React.createRef();
	}

	componentDidMount() {
		window.addEventListener("keydown", this.keydown.bind(this));
	}

	componentWillUnmount() {
		window.removeEventListener("keydown", this.keydown.bind(this));
	}

	keydown(event) {
		var { results, selected, open } = this.state;

		var cmdCtrl = event.metaKey || event.ctrlKey;
		if (cmdCtrl && event.key === "k") {
			if (open) this.close();
			else this.open();
		}

		if (!open) return;
		else if (event.key === "ArrowDown" && results && results.length) {
			if (selected < results.length - 1) {
				this.setState({ selected: selected + 1 });
			} else {
				this.setState({ selected: 0 });
			}
		} else if (event.key === "ArrowUp" && results && results.length) {
			if (selected > 0) {
				this.setState({ selected: selected - 1 });
			} else {
				this.setState({ selected: results.length - 1 });
			}
		} else if (event.key === "Enter") {
			var command = results[selected];
			if (!command) return;
			if (command.type === "channel") {
				window.router.navigate(`/${this.props.link}/${command.category}/${command.name}`);
			}
			if (command.type === "guild") {
				window.router.navigate(`/guild/${command.id}`);
			}
			this.close();
		}
	}

	open() {
		this.setState({ open: true });
		if (this.search) {
			var input = this.search.current.__reactRefs.inputEl;
			input.focus();
			input.value = "";
		}
	}

	close() {
		if (this.search) {
			this.search.current.__reactRefs.inputEl.value = "";
		}
		this.setState({ open: false, results: false, selected: 0 });
	}

	onInput(event) {
		var { value } = event.target;
		value = value.toLowerCase();
		if (!value) return this.setState({ results: false });
		var { docs } = this.props;
		var commands = docs.map((x) => x.commands.map((c) => (c.category = x.category) && c)).flat();

		var sorted = [];

		if (this.props.guilds) {
			sorted = sorted.concat(
				this.props.guilds
					.filter((x) => x.name.toLowerCase().includes(value) && !!(x.permissions & (1 << 3)) && x.added)
					.map((x) => (x.type = "guild") && x)
					.slice(0, 2)
			);
		}

		sorted = sorted.concat(
			commands
				.sort((a, b) => {
					if (!a.examples || !b.examples) return 0;
					if (a.examples.includes(value)) return -1;
					if (b.examples.includes(value)) return 1;
					return 0;
				})
				.sort((a, b) => {
					if (!a.description || !b.description) return 0;
					if (a.description.toLowerCase().includes(value)) return -1;
					if (b.description.toLowerCase().includes(value)) return 1;
					return 0;
				})
				.sort((a, b) => {
					if (!a.aliases || !b.aliases) return 0;
					if (a.aliases.includes(value)) return -1;
					if (b.aliases.includes(value)) return 1;
					return 0;
				})
				.sort((a, b) => {
					if (a.name.toLowerCase().includes(value)) return -1;
					if (b.name.toLowerCase().includes(value)) return 1;
					return 0;
				})
				.sort((a, b) => {
					if (a.name.toLowerCase() === value) return -1;
					if (b.name.toLowerCase() === value) return 1;
					return 0;
				})
				.filter((x) => {
					var name = x.name.toLowerCase() === value || x.name.toLowerCase().includes(value);

					if (x.description) {
						name =
							name ||
							x.aliases.includes(value) ||
							x.description.toLowerCase().includes(value) ||
							(x.examples || []).includes(value);
					}
					return name;
				})
				.map((x) => (x.type = "channel") && x)
		);

		this.setState({ results: sorted.slice(0, 5), selected: 0 });
	}

	render() {
		var { docs, user, link, route, device } = this.props;
		var { path } = route;

		return [
			<List key="channellist" accordionList accordionOpposite className="channellist">
				<ListItem className="pointer search noselect" onClick={this.open.bind(this)} title="Search"></ListItem>
				{docs.map((docs) => {
					var name = docs.name;
					if (name.includes("http")) {
						var img = name.split(" ")[0];
						name = name.split(" ").slice(1).join(" ");
					}
					return (
						<ListItem
							key={docs.category}
							accordionItem
							title={name}
							media={img}
							className={path.includes(docs.category) ? "accordion-item-opened" : ""}
						>
							<AccordionContent>
								<List>
									{docs.commands
										.filter((x) => (user.role === "dev" ? true : !x.devOnly))
										.map((command) => {
											var href = `/${link}/${docs.category}/${command.name}`;
											var active = false;
											if (path.includes(href)) {
												active = true;
											}
											return (
												<ListItem
													className={active ? "active" : ""}
													panelClose
													href={href}
													view=".view-main"
													key={command.name}
													title={command.name}
													noChevron={true}
												>
													<img slot="content-start" src={discordtextchannel} />
												</ListItem>
											);
										})}
								</List>
							</AccordionContent>
						</ListItem>
					);
				})}
			</List>,
			<Popover
				key="searchModal"
				onPopoverClosed={this.close.bind(this)}
				opened={this.state.open && device.desktop}
				closeByBackdropClick
				closeByOutsideClick
				closeOnEscape
				backdrop
				className="searchModal"
			>
				<div className="background">
					<List className="search">
						<ListInput
							ref={this.search}
							floatingLabel
							type="text"
							placeholder="Search"
							onInput={this.onInput.bind(this)}
						></ListInput>
					</List>

					<List className="results">
						{this.state.results &&
							(this.state.results.length > 0 ? (
								this.state.results.map((result, i) => {
									return (
										<ListItem
											className={(i === this.state.selected && "active") || ""}
											key={result.id || result.name}
											type="text"
										>
											{result.type === "guild" &&
												(result.icon ? (
													<img slot="content-start" src={result.icon}></img>
												) : (
													<div slot="content-start" className="img">
														{result.name
															.split(" ")
															.map((x) => x.charAt(0))
															.join("")}
													</div>
												))}
											{result.type === "channel" && (
												<img slot="content-start" src={discordtextchannel}></img>
											)}
											<div className="item-title">{result.name}</div>
										</ListItem>
									);
								})
							) : (
								<ListItem title="Nothing found" />
							))}
						<div className="protip">
							<hr></hr>
							<span className="pro">Protip:</span>&nbsp;
							<span className="tip">You can search servers and commands</span>
						</div>
					</List>
				</div>
			</Popover>,
			<Sheet
				onSheetClosed={this.close.bind(this)}
				opened={this.state.open && device.mobile}
				className="searchSheet"
				swipeToClose
				backdrop
				push
				closeOnEscape
				closeByOutsideClick
				closeByBackdropClick
				key="searchSheet"
			>
				<PageContent>
					<List className="search">
						<ListInput
							ref={this.search}
							floatingLabel
							type="text"
							placeholder="Search"
							onInput={this.onInput.bind(this)}
						>
							<Icon slot="media" icon="search"></Icon>
						</ListInput>
					</List>
					<List className="results">
						{this.state.results &&
							(this.state.results.length > 0 ? (
								this.state.results.map((result, i) => {
									return (
										<ListItem
											className={(i === this.state.selected && "active") || ""}
											key={result.id || result.name}
											type="text"
										>
											{result.type === "guild" &&
												(result.icon ? (
													<img slot="content-start" src={result.icon}></img>
												) : (
													<div slot="content-start" className="img">
														{result.name
															.split(" ")
															.map((x) => x.charAt(0))
															.join("")}
													</div>
												))}
											{result.type === "channel" && (
												<img slot="content-start" src={discordtextchannel}></img>
											)}
											<div className="item-title">{result.name}</div>
										</ListItem>
									);
								})
							) : (
								<ListItem title="Nothing found" />
							))}
						<div className="protip">
							<hr></hr>
							<span className="pro">Protip:</span>&nbsp;
							<span className="tip">You can search servers and commands</span>
						</div>
					</List>
				</PageContent>
			</Sheet>,
		];
	}
}

export default connect((s) => ({
	guilds: s.guilds,
	route: s.route,
	device: s.device,
}))(Docs);
