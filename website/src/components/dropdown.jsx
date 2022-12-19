import React, { Component } from "react";
import { Menu, MenuItem, MenuDropdownItem, MenuDropdown, List, ListItem } from "framework7-react";
import { connect } from "react-redux";
import "./dropdown.scss";

class Dropdown extends Component {
	constructor(props) {
		super(props);

		this.state = {
			active: this.props.default || null,
		};
	}

	select(id) {
		this.setState({ active: id });
		var item = this.props.items.find((x) => x === id);
		if (!item) return;

		var text = "Selected none";
		if (item !== null) text = `Selected ${item}`;

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
			this.props.onSelect(item);
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
		var items = this.props.items;
		var active = items.find((x) => x === this.state.active);
		if (!active) active = items[0];

		if (this.props.device.desktop) {
			return (
				<Menu className="dropdown noselect">
					<MenuItem onClick={this.onMenu.bind(this)} text={active} dropdown>
						<MenuDropdown left contentHeight="200px">
							{items.map((x) => (
								<MenuDropdownItem id={x} className={(x === active && "active") || ""} text={x} />
							))}
						</MenuDropdown>
					</MenuItem>
				</Menu>
			);
		}

		return (
			<div className="menu dropdown noselect">
				<div className="menu-inner">
					<div className="menu-item menu-item-dropdown">
						<select onChange={this.onSelect.bind(this)} className="menu-item-content">
							{items.map((x) => (
								<option value={x} selected={x === this.state.active}>
									{x}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>
		);
	}
}

export default connect((s) => ({ device: s.device }))(Dropdown);
