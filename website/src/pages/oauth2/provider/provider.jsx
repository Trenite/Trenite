import React, { Component } from "react";
import "./provider.scss";
import trenite from "../../../assets/icons/Trenite_big_white.png";
import discord from "./discord.svg";
import trello from "./trello.png";
import spotify from "./spotify.png";
import { Page, Navbar, NavTitle, NavLeft, Link } from "framework7-react";

export default class Provider extends Component {
	constructor(props) {
		super(props);
		this.state = {
			result: "",
			img: null,
			provider: "",
			colors: {
				normal: "",
				success: "",
				error: "",
			},
		};
	}

	componentDidMount() {
		var url = this.$f7route.url.split("?")[1];

		switch (this.props.provider) {
			case "trello":
				this.setState({
					provider: this.props.provider,
					img: trello,
					colors: { normal: "#0079bf", success: "#70b500", error: "#eb5a46" },
				});
				break;
			case "spotify":
				this.setState({
					provider: this.props.provider,
					img: spotify,
					colors: { normal: "#191414", success: "#1ed760", error: "#eb5a46" },
				});
				break;
			case "discord":
				if (!url) {
					location.replace(`/api/redirect/discord`);
				}
				this.setState({
					provider: this.props.provider,
					img: trenite,
					colors: { normal: "#23272A", success: "#7289DA", error: "#eb5a46" },
				});
				break;
		}

		if (!url) return;

		var query = url.replace(/[\?&]/g, "").split("=");

		if (query[0] === "success") {
			this.setState({ result: `success`, success: true, error: false });
		} else if (query[0] === "error") {
			const error = decodeURIComponent(query[1]);
			this.setState({ result: `error`, success: false, error });
		} else {
			this.setState({ result: "", success: false, error: false });
		}
	}

	render() {
		const { result, success, error, img, colors } = this.state;
		const { provider } = this.props;

		const res = result.split("=");
		const type = res[0];
		const capitalizedProvider = provider.slice(0, 1).toUpperCase() + provider.slice(1);
		const color = type === "error" ? colors.error : success ? colors.success : colors.normal;

		return (
			<Page>
				<Navbar>
					<NavLeft>
						<Link iconIos="f7:menu" panelOpen="left" className="text-color-white" />
					</NavLeft>
					<NavTitle>{capitalizedProvider}</NavTitle>
				</Navbar>
				<div className={`provider center`} style={{ backgroundColor: color }}>
					<div className="images center">
						<img className="providerImg" src={img}></img>
						{(() => {
							if (type === "error") {
								return (
									<div className="error-banmark">
										<div className="ban-icon">
											<span className="icon-line line-long-invert"></span>
											<span className="icon-line line-long"></span>
											<div className="icon-circle"></div>
											<div className="icon-fix"></div>
										</div>
									</div>
								);
							} else if (type === "success") {
								return (
									<div className="success-checkmark">
										<div className="check-icon">
											<span className="icon-line line-tip"></span>
											<span className="icon-line line-long"></span>
											<div className="icon-circle"></div>
											<div className="icon-fix"></div>
										</div>
									</div>
								);
							}
							return (
								<div className="spinner">
									<div className="cube1"></div>
									<div className="cube2"></div>
								</div>
							);
						})()}
						<img className="discordImg" src={discord}></img>
					</div>
					<div className="result">
						{(() => {
							if (type === "error") {
								return (
									<div style={{ textAlign: "center" }}>
										Error authorizing {capitalizedProvider}:
										<br />
										{error}
									</div>
								);
							} else if (type === "success") {
								return `${capitalizedProvider} Authorized`;
							}
							return <div>Authorizing {capitalizedProvider} ...</div>;
						})()}
					</div>
				</div>
			</Page>
		);
	}
}
