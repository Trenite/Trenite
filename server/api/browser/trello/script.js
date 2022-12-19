const boardEl = document.getElementById("board");

const scriptSrc = window.customElements ? "/card.min.js" : "/card-polyfilled.min.js";
const cardJs = document.createElement("script");
cardJs.crossOrigin = "anonymous";
cardJs.src = "https://p.trellocdn.com" + scriptSrc;

async function loadCard({ list, card, id }) {
	// const resp = await fetch(
	// 	`https://api.trello.com/1/card/${id}?fields=name,closed,url,badges,idAttachmentCover,labels&attachments=cover&customFields=true&customFieldItems=true&members=true&stickers=true&token=${token}&key=${key}`
	// );
	// var card = await resp.json();

	const cardEl = document.createElement("trello-card");

	cardEl.card = card;
	cardEl.className = "card";

	if (id) {
		id = id.id;
		if (card.id === id) {
			console.log(id);
			cardEl.classList.add("highlight");
		}
	}

	list.appendChild(cardEl);
}

async function loadList({ id, list, cards, card }) {
	cards
		.filter((car) => car.idList === id)
		.forEach((car) => {
			loadCard({ card: car, list, id: card });
		});
}

async function loadBoard({ id, token, key, card }) {
	boardEl.innerHTML = "";
	const board = await (
		await fetch(
			`https://api.trello.com/1/boards/${id}?token=${token}&key=${key}&cards=open&fields=id,name,prefs&lists=open&card_fields=id,idMembers,idList,labels,cover,attachments,customFieldItems,due,dueComplete,badges,name&card_attachments=true&card_customFieldItems=true&members=all&card_members=true`
		)
	).json();

	board.cards = board.cards.map((card) => {
		card.members = card.idMembers.map((id) => board.members.find((member) => member.id === id));
		return card;
	});

	document.body.style = `background-image: url("${board.prefs.backgroundImage}")`;

	board.lists.forEach((list) => {
		var el = document.createElement("div");
		el.id = list.id;
		el.className = "list";
		var title = document.createElement("h2");
		title.innerHTML = list.name;
		title.className = "title";
		el.appendChild(title);
		boardEl.appendChild(el);
		loadList({ id: list.id, list: el, cards: board.cards, card });
	});
}

document.head.appendChild(cardJs);
