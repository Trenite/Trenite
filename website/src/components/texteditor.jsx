import React, { Component, Fragment } from "react";
import { Popover, Link } from "framework7-react";
import { connect } from "react-redux";
import "./texteditor.scss";
import { Picker, Emoji } from "emoji-mart";
import data from "emoji-mart/data/all.json";
import ContentEditable from "react-contenteditable";

class TextEditor extends Component {
	constructor(props) {
		super(props);
		this.contentEditable = React.createRef();

		this.state = {
			value: "",
		};
	}

	addEmoji(emoji) {
		this.setState({ value: this.parseValue(this.state.value + emoji.colons) });
	}

	input(e) {
		this.setState({ value: this.parseValue(e.target.value) });
	}

	parseValue(value) {
		var { guild } = this.props;

		var emojis = value.match(/:\w+:/g) || [];
		emojis.forEach((emoji) => {
			value = value.replace(
				new RegExp(emoji),
				`<span contenteditable="true">${Emoji({
					html: true,
					set: "twitter",
					emoji,
					size: 16,
					fallback(emoji, props) {
						var test = props.emoji;
						var url = guild.emojis.find((x) => x.id === test.slice(1, test.length - 1));
						if (url) url = url.url;
						return emoji
							? `:${emoji.short_names[0]}:`
							: `<span style="width: 16px; height: 16px; display: inline-block; background-image: url(&quot;${url}&quot;); background-size: cover; background-position: 62.5% 12.5%;" aria-label="🚰, potable_water" class="emoji-mart-emoji"></span>`;
					},
				})}</span>&nbsp;`
			);
		});

		return value;
	}

	render() {
		var { tags, guild } = this.props;
		if (!guild.selected) return <div>Select a guild first</div>;
		var { emojis, name } = guild;

		var custom = emojis.map((emoji) => {
			return {
				name: emoji.id,
				short_names: [emoji.id],
				imageUrl: emoji.url,
				text: "",
				emoticons: [],
				keywors: [emoji.name],
			};
		});

		return (
			<Fragment>
				<div className="text-editor text-editor-resizable">
					<div className="my-text-editor-content">
						<ContentEditable
							className="text-editor-content"
							innerRef={this.contentEditable}
							html={this.state.value} // innerHTML of the editable div
							disabled={false} // use true to disable editing
							onChange={this.input.bind(this)} // handle innerHTML change
						></ContentEditable>
						<Link popoverOpen=".emoji-menu" contentEditable={false}>
							<Emoji
								emoji="upside_down_face"
								size={24}
								set="twitter"
								fallback={(emoji, props) => {
									return emoji ? `:${emoji.short_names[0]}:` : props.emoji;
								}}
							></Emoji>
						</Link>
					</div>
				</div>
				<Popover className="emoji-menu" closeOnEscape backdrop={false} closeByOutsideClick closeByBackdropClick>
					<Picker
						notFound={() => (
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									flexDirection: "column",
									height: "100%",
								}}
							>
								<img src="/assets/icons/notfound.svg" />
								<span style={{ margin: "1rem", color: "#72767d" }}>No Emojis found</span>
							</div>
						)}
						include={["custom", "symbols", "objects", "people", "nature", "foods", "activity", "places"]}
						autoFocus
						showSkinTones={false}
						showPreview={false}
						custom={custom}
						set="twitter"
						onSelect={this.addEmoji.bind(this)}
						theme="dark"
						sheetSize={64}
					></Picker>
				</Popover>
			</Fragment>
		);
	}
}

export default connect((s) => ({ device: s.device, guild: s.guild }))(TextEditor);
