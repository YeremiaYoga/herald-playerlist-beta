import * as herald_playerlist from "./heraldPlayerlist.js";

Hooks.on("ready", () => {
  setTimeout(() => {
    herald_playerlist.heraldPlayerlist_getListActor();
    herald_playerlist.heraldPlayerlist_universalChecker();
  }, 1000);
  setTimeout(() => {
    herald_playerlist.heraldPlayerlist_getSettingValue();
  }, 1500);
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
        herald_playerlist.heraldPlayerlist_universalSettingValue(
          "toggleShow",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_widthDistance",
    {
      name: "Left Distance Player List",
      hint: "setting left distance player list (in % of viewport width)",
      scope: "world",
      config: true,
      type: Number,
      default: 15,
      category: "",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_universalSettingValue(
          "widthDistance",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_heightDistance",
    {
      name: "Top Distance Player List",
      hint: "setting top distance player list (in % of viewport height)",
      scope: "world",
      config: true,
      type: Number,
      default: 22,
      category: "",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_universalSettingValue(
          "heightDistance",
          value
        );
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
      default: 10,
      category: "",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_universalSettingValue(
          "fontSize",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_actorNameColor",
    {
      name: "Actor Name Color",
      hint: "Set actor name color (e.g., '#ffb8b3')",
      scope: "world",
      config: true,
      type: String,
      default: "#ffffff",
      category: "Color",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_colorSettingValue(
          "actorNameColor",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_tempHpColor",
    {
      name: "Temporary Hp Color",
      hint: "Set temporary hp color (e.g., '#018AE6')",
      scope: "world",
      config: true,
      type: String,
      default: "#018AE6",
      category: "Color",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_colorSettingValue(
          "tempHpColor",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_hp0Color",
    {
      name: "Hp Color at bellow 0%",
      hint: "Set hp color at bellow 0% (e.g., '#8B0000')",
      scope: "world",
      config: true,
      type: String,
      default: "#8B0000",
      category: "Color",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_colorSettingValue(
          "hp0Color",
          value
        );
      },
    }
  );
  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_hp25Color",
    {
      name: "Hp Color at 0% - 25%",
      hint: "Set hp color at 0% - 25% (e.g., '#bc3c04')",
      scope: "world",
      config: true,
      type: String,
      default: "#bc3c04",
      category: "Color",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_colorSettingValue(
          "hp25Color",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_hp50Color",
    {
      name: "Hp Color at 26% - 50%",
      hint: "Set hp color at 26% - 50% (e.g., '#c47404')",
      scope: "world",
      config: true,
      type: String,
      default: "#c47404",
      category: "Color",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_colorSettingValue(
          "hp50Color",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_hp75Color",
    {
      name: "Hp Color at 51% - 75%",
      hint: "Set hp color at 51% - 75% (e.g., '#8c9c04')",
      scope: "world",
      config: true,
      type: String,
      default: "#8c9c04",
      category: "Color",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_colorSettingValue(
          "hp75Color",
          value
        );
      },
    }
  );

  game.settings.register(
    "herald-playerlist-beta",
    "heraldplayerlist_hp100Color",
    {
      name: "Hp Color at 76% - 100%",
      hint: "Set hp color at 76% - 100% (e.g., '#389454')",
      scope: "world",
      config: true,
      type: String,
      default: "#389454",
      category: "Color",
      onChange: (value) => {
        herald_playerlist.heraldPlayerlist_colorSettingValue(
          "hp100Color",
          value
        );
      },
    }
  );
});
