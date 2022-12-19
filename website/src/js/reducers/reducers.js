import { custombot } from "./custombot";
import { custombots } from "./custombots";
import { docs } from "./docs";
import { device } from "./device";
import { user } from "./user";
import { users } from "./users";
import { route } from "./route";
import { guilds } from "./guilds";
import { guild } from "./guild";
import { combineReducers } from "redux";

export default combineReducers({ route, docs, user, users, device, guilds, guild, custombot, custombots });
