import React from "react";
import { Page, Navbar, Block, NavLeft, NavTitle, Link } from "framework7-react";

import "./404.scss";

export default () => (
	<Page>
		<Navbar sliding>
			<NavLeft sliding>
				<Link iconF7="bars" panelOpen="left" className="text-color-white" />
			</NavLeft>
			<NavTitle sliding>Not found</NavTitle>
		</Navbar>
		<div className="error-page">
			<div>
				<h1 data-h1="404">404</h1>
				<p data-p="NOT FOUND">NOT FOUND</p>
			</div>
		</div>
	</Page>
);
