import React, { Component } from "react";
import { Menu, MenuItem, MenuDropdownItem, MenuDropdown, List, ListItem, Link, Popover } from "framework7-react";
import { connect } from "react-redux";
import "./rolelist.scss";

class RoleList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			active: this.props.default || null,
			selected: [],
			opened: false,
		};
	}

	componentDidMount() {
		this.UNSAFE_componentWillReceiveProps();
	}

	UNSAFE_componentWillReceiveProps() {
		var roles = this.roles;
		var selected = this.props.selected.map((x) => roles.find((r) => r.id === x)).filter((x) => !!x);
		this.setState({ selected });
	}

	get roles() {
		var roles = (this.props.guild.roles || [])
			.sort((a, b) => b.rawPosition - a.rawPosition)
			.map((role) => {
				if (role.color === "#000000") role.color = "rgb(185, 187, 190)";
				return role;
			});
		if (this.props.one) roles.unshift({ id: null, color: "rgb(185, 187, 190)", name: "No-Role" });
		return roles;
	}

	open() {
		this.setState({ opened: true });
	}

	close() {
		this.setState({ opened: false });
	}

	oneOnMenu(menu) {
		if (!menu.target.classList.contains("menu-dropdown-item")) return;
		var id = menu.target.id;
		if (!id) id = null;
		this.oneSelect(id);
	}

	oneSelect(id) {
		var role = this.roles.find((x) => x.id === id);
		if (!role) return;
		this.setState({ active: id });

		var text = "Role was removed";
		if (role.id !== null) text = `Role set to <span style="color: ${role.color}">${role.name.escapeHTML()}</span>`;

		app.toast
			.create({
				text: text,
				closeTimeout: 1500,
				horizontalPosition: "center",
				closeButton: true,
			})
			.open();

		if (this.props.onSelect) {
			this.props.onSelect(role);
		}
	}

	oneOnSelect(event) {
		var id = event.target.value;
		if (id === "null") id = null;
		this.oneSelect(id);
	}

	selectRole(event) {
		var change = event.currentTarget.checked;
		var id = event.currentTarget.parentElement.parentElement.id;

		if (change) {
			var role = this.roles.find((x) => x.id === id);
			if (!role) return;

			var selected = [...this.state.selected, role];
		} else {
			var selected = this.state.selected.filter((x) => x.id !== id);
		}

		this.setState({ selected });

		if (this.props.onSelect) {
			this.props.onSelect(selected);
		}
	}

	remove(event) {
		var id = event.currentTarget.parentElement.id;
		var selected = this.state.selected.filter((x) => x.id !== id);
		this.setState({ selected });
	}

	render() {
		if (!this.props.guild || !this.props.guild.roles) return <div></div>;
		var { guild, multiple, one } = this.props;

		var roles = this.roles;

		var active = roles.find((role) => role.id === this.state.active);
		if (!active) active = roles[0];

		if (one) {
			if (this.props.device.desktop) {
				return (
					<Menu className="channeldropdown noselect">
						<MenuItem
							onClick={this.oneOnMenu.bind(this)}
							text={active.name}
							style={{ color: active.color }}
							dropdown
						>
							<MenuDropdown left contentHeight="200px">
								{roles.map((x) => (
									<MenuDropdownItem
										key={x.id}
										id={x.id}
										className={(x.id === this.state.active && "active") || ""}
										text={x.name}
										style={{ color: x.color }}
									></MenuDropdownItem>
								))}
							</MenuDropdown>
						</MenuItem>
					</Menu>
				);
			}

			return (
				<div className="menu channeldropdown noselect">
					<div className="menu-inner">
						<div className="menu-item menu-item-dropdown">
							<select onChange={this.oneOnSelect.bind(this)} className="menu-item-content">
								{roles.map((x) => (
									<option
										key={x.id || "null"}
										value={x.id || "null"}
										selected={x.id === this.state.active}
									>
										{x.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
			);
		}

		return [
			<div className="roledropdown noselect">
				{this.state.selected
					.sort((a, b) => b.rawPosition - a.rawPosition)
					.map((role) => {
						return (
							<span key={role.id} id={role.id} className="role" style={{ color: role.color }}>
								<span onClick={this.remove.bind(this)} className="circle">
									<svg
										aria-hidden="true"
										className="hover"
										width="12"
										height="12"
										viewBox="0 0 12 12"
									>
										<g fill="none" fillRule="evenodd">
											<path d="M0 0h12v12H0"></path>
											<path
												className="fill"
												fill="#2f3136"
												d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6"
											></path>
										</g>
									</svg>
								</span>
								<span className="text">{role.name}</span>
							</span>
						);
					})}
				<Link
					popoverOpen={".roleListPopover"}
					onClick={this.open.bind(this)}
					className="role pointer"
					style={{ color: "#4f545c" }}
				>
					<svg width="7" height="7" viewBox="0 5 7 7">
						<g fill="#b9bbbe">
							<path d="M3 5h1v7H3z"></path>
							<path d="M0 8h7v1H0z"></path>
						</g>
					</svg>
				</Link>
			</div>,
			<Popover
				opened={this.state.opened}
				onPopoverClosed={this.close.bind(this)}
				className="roleListPopover noselect"
				closeByOutsideClick
				closeOnEscape
				closeByBackdropClick
				backdrop={false}
			>
				<List>
					{roles.map((role) => (
						<ListItem
							id={role.id}
							key={role.id}
							onChange={this.selectRole.bind(this)}
							checkbox
							title={role.name}
							name="rolelist-popover"
							checked={!!this.state.selected.find((x) => x.id === role.id)}
						></ListItem>
					))}
				</List>
			</Popover>,
			,
		];
	}
}

export default connect((s) => ({ guild: s.guild, device: s.device }))(RoleList);
