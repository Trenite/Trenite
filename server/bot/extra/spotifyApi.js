"use strict";
const SpotifyWebApi = require("spotify-web-api-node");
const { clientId, clientSecret } = require("../../../config.json").infos.spotify;

var spotifyApi = new SpotifyWebApi({
	clientId,
	clientSecret,
});

module.exports = {
	spotifyApi,
	parser: (inputUrl) => {
		if (inputUrl.includes("/track/")) {
			return "song";
		} else if (inputUrl.includes("/playlist/")) {
			return "playlist";
		} else if (inputUrl.includes("/album/")) {
			return "album";
		} else {
			return new Error(`Invalid spotify URL, or not supported`);
		}
	},
	setup: async function () {
		return spotifyApi.clientCredentialsGrant().then(
			(data) => {
				async function auth(api) {
					var data = await api.clientCredentialsGrant();
					api.setAccessToken(data.body["access_token"]);

					setTimeout(auth.bind(this, api), data.body["expires_in"] * 999);
				}
				setTimeout(auth.bind(this, spotifyApi), data.body["expires_in"] * 999);

				return data.body["access_token"];
			},
			(err) => {
				console.error("Something went wrong when retrieving an access token :", err.message);
				throw err;
			}
		);
	},
	setToken: async function (token) {
		spotifyApi.setAccessToken(token);
	},
	removeQuery: function (url) {
		for (let i = 0; i < url.length; i++) {
			if (i > 15) {
				if (url[i] == "?") {
					url = url.slice(0, i);
				}
			}
		}
		return url;
	},
	extractTrack: async function (trackId) {
		return spotifyApi.getTrack(trackId).then(function (data) {
			var details = {
				name: "",
				artists: [],
				album_name: "",
				release_date: "",
				cover_url: "",
			};
			details.name = data.body.name;
			data.body.artists.forEach((artist) => {
				details.artists.push(artist.name);
			});
			details.album_name = data.body.album.name;
			details.release_date = data.body.album.release_date;
			details.cover_url = data.body.album.images[0].url;
			return details;
		});
	},
	// I have no idea why limit is not working
	extractPlaylist: async function (playlistId) {
		return spotifyApi.getPlaylist(playlistId, { pageSize: 200, limit: 200 }).then(function (data) {
			var details = {
				name: "",
				total_tracks: 0,
				tracks: [],
			};
			details.name = data.body.name + " - " + data.body.owner.display_name;
			details.total_tracks = data.body.tracks.total;
			data.body.tracks.items.forEach((item) => {
				details.tracks.push(item.track.id);
			});
			return details;
		});
	},
	extractAlbum: async function (albumId) {
		return spotifyApi.getAlbum(albumId, { limit: 200 }).then(function (data) {
			var details = {
				name: "",
				total_tracks: 0,
				tracks: [],
			};
			details.name = data.body.name + " - " + data.body.label;
			details.total_tracks = data.body.tracks.total;
			data.body.tracks.items.forEach((item) => {
				details.tracks.push(item.id);
			});
			return details;
		});
	},
	searchTracks: async function (search) {
		return spotifyApi.searchTracks(search).then((data) => data.body);
	},
};
