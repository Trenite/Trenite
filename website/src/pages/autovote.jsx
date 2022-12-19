import React, { Component, Fragment } from "react";
import { Page, Navbar, NavLeft, NavTitle, Link, BlockTitle, ListInput, List, Block } from "framework7-react";
import api from "../js/api";
import { connect } from "react-redux";

class AutoVote extends Component {
	constructor(props) {
		super(props);

		this.state = {
			connectSid: "",
		};
	}

	componentWillMount() {
		this.componentWillReceiveProps();
	}

	componentWillReceiveProps() {
		if (!this.props.user.loggedin) return;
		this.setState({ connectSid: this.props.user.settings.connectSid });
	}

	async topGGAutoVoter(e) {
		var sid = e.currentTarget.value;
		this.props.user.settings.connectSid = sid;

		if (sid) {
			await api.request.post("/user/autovote", { sid });
		}

		window.app.toast
			.create({
				text: `${sid ? "Enabled" : "Disabled"} autovote`,
				closeTimeout: 1500,
				closeButton: true,
				horizontalPosition: "center",
				position: this.props.device.desktop ? "bottom" : "top",
			})
			.open();
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
								<BlockTitle style={{ marginLeft: 0 }}>
									Auto Vote on{" "}
									<Link href="https://top.gg/bot/689577516150816866" external target="_BLANK">
										top.gg
									</Link>
								</BlockTitle>
								<img src="/assets/images/topGGTutorial.png" style={{ width: "100%" }} />
								<List>
									<ListInput
										onInput={(e) => this.setState({ connectSid: e.currentTarget.value })}
										onBlur={this.topGGAutoVoter.bind(this)}
										value={this.state.connectSid}
										clearButton
										label="top.gg connect.sid cookie"
										placeholder="connect.sid cookie"
									></ListInput>
								</List>
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

export default connect((s) => ({ user: s.user, device: s.device }))(AutoVote);
