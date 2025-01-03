import * as herald_playerlist from "./heraldPlayerlist.js";

Hooks.on("ready", () => {
  setTimeout(() => {
    herald_playerlist.heraldPlayerlist_getListActor();
    herald_playerlist.heraldPlayerlist_universalChecker();
  }, 1000);
  setTimeout(() => {
    herald_playerlist.heraldPlayerlist_getSettingValue();
  }, 1200);
});

Hooks.on("init", () => {
  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_toggleShow",
    {
      name: "Display Player List",
      hint: "Toggle the display of Player List",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      category: "",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_updateSettingValue("toggleShow", value);
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_leftDistance",
    {
      name: "Left Distance Player List",
      hint: "setting left distance player list",
      scope: "world",
      config: true,
      type: Number,
      default: 35,
      category: "",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_updateSettingValue("leftDistance", value);
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_fontSize",
    {
      name: "Font Size Token Name",
      hint: "setting font size token name",
      scope: "world",
      config: true,
      type: Number,
      default: 12,
      category: "",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_updateSettingValue("fontSize", value);
      },
    }
  );
});
