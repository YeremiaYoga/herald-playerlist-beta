import * as herald_playerlist from "./heraldPlayerlist.js";

Hooks.on("ready", () => {
  setTimeout(() => {
    herald_playerlist.heraldPlayerlist_getListActor();
  }, 1000);
});
