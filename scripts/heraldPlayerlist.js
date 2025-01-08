let heraldPlayerlist_listActorCanvas = [];

let hp25 = "#FF0000";
let hp50 = "#FFA500";
let hp75 = "#FFFF00";
let hp100 = "#008000";

let heraldPlayerlist_showPlayerlist = true;
Hooks.on("canvasReady", async () => {
  if (canvas.scene.active == true) {
    await heraldPlayerlist_getListActor();

    heraldPlayerlist_getSettingValue();
  } else {
    await canvas.scene.unsetFlag("world", "heraldPlayerlist");

    const existingBar = document.getElementById("heraldPlayerlist");
    if (existingBar) {
      existingBar.remove();
    }
  }
});

async function heraldPlayerlist_getListActor() {
  let listActorUuid = [];

  if (!canvas || !canvas.scene) {
    console.log("No active scene found.");
    return;
  }
  heraldPlayerlist_listActorCanvas = [];
  const tokens = canvas.tokens.placeables;
  for (let token of tokens) {
    if (token.actor.type == "character") {
      heraldPlayerlist_listActorCanvas.push(token.actor);
      listActorUuid.push(token.actor.uuid);
    }
  }

  await canvas.scene.setFlag("world", "heraldPlayerlist", {
    show: true,
    listActorUuid: listActorUuid,
  });

  heraldPlayerlist_createPlayerList();
}

function heraldPlayerlist_createPlayerList() {
  const existingBar = document.getElementById("heraldPlayerlist");
  if (existingBar) {
    existingBar.remove();
  }
  fetch("/modules/herald-playerlist-beta/templates/herald-playerlist.html")
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;

      div.firstChild.id = "heraldPlayerlist";

      document.body.appendChild(div.firstChild);
      if (heraldPlayerlist_showPlayerlist == true) {
        heraldPlayerlist_renderlistPlayer();
      }
    })
    .catch((err) => {
      console.error("Gagal memuat template hpbar.html:", err);
    });
}

function heraldPlayerlist_renderlistPlayer() {
  console.log("run");
  let listPLayer = ``;
  let divListPlayer = document.getElementById("heraldPlayerlist-listPlayer");
  const heraldPlayerlist = canvas.scene.getFlag("world", "heraldPlayerlist");
  for (let actor of heraldPlayerlist_listActorCanvas) {
    let effectlist = ``;

    let arrEffect = [];

    for (let effect of actor.effects) {
      arrEffect.push(effect);
    }

    for (let item of actor.items) {
      if (item.effects) {
        for (let effect of item.effects) {
          arrEffect.push(effect);
        }
      }
    }
    arrEffect.forEach((effect) => {
      effectlist += `
        <div>
          <img src="${effect.img}" class="heraldPlayerlist-playerEffect" alt="${effect.name}" />
        </div>`;
    });

    if (effectlist == ``) {
      effectlist = `
        <div>
          <div class="heraldPlayerlist-playerEffect" style="opacity: 0;"></div>
        </div>`;
    }

    listPLayer += `
    <div id="heraldPlayerlist-playerActor" class="heraldPlayerlist-playerActor">
        <div id="heraldPlayerlist-playerContainer" class="heraldPlayerlist-playerContainer">
          <div id="heraldPlayerlist-leftContainer" class="heraldPlayerlist-leftActor">
              <img src="${actor.img}" alt="Image" class="heraldPlayerlist-actorImage" />
          </div>
          <div id="heraldPlayerlist-rightContainer" class="heraldPlayerlist-rightContainer">
            <div id="heraldPlayerlist-tokenname" class="heraldPlayerlist-tokenname">
              ${actor.name}
            </div>
            <div id="heraldPlayerlist-hpbarContainer" class="heraldPlayerlist-hpbarContainer">
              <div class="heraldPlayerlist-hpbar" data-actor-id="${actor.uuid}"></div>
              <div class="heraldPlayerlist-tempbartop" data-actor-id="${actor.uuid}"></div>
               <div class="heraldPlayerlist-tempbarbottom" data-actor-id="${actor.uuid}"></div>
              <div class="heraldPlayerlist-tempvalue" data-actor-id="${actor.uuid}"></div>
              <div class="heraldPlayerlist-hpvalue" data-actor-id="${actor.uuid}"></div>
            </div>
          </div>
        </div>
        <div id="heraldPlayerlist-lowerbar" class="heraldPlayerlist-lowerbar" data-actor-id="${actor.uuid}">
         <div class="heraldPlayerlist-tempshield" data-actor-id="${actor.uuid}"></div>
        <div id="heraldPlayerlist-listeffect" class="heraldPlayerlist-listeffect">
          ${effectlist}
        </div>
       
        </div>
      </div>
    </div>`;
  }

  divListPlayer.innerHTML = listPLayer;

  heraldPlayerlist_updateHpActor();
}

function heraldPlayerlist_updateHpActor() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    const hp = actor.system.attributes.hp.value;
    const maxHp = actor.system.attributes.hp.max;
    const tempHp = actor.system.attributes.hp.temp || 0;
    const hpPercent = (hp / maxHp) * 100;
    let tempPercentage = (tempHp / maxHp) * 100;
    if (tempPercentage > 100) {
      tempPercentage = 100;
    }

    const hpBar = document.querySelector(
      `.heraldPlayerlist-hpbar[data-actor-id="${actor.uuid}"]`
    );

    const tempHpBarTop = document.querySelector(
      `.heraldPlayerlist-tempbartop[data-actor-id="${actor.uuid}"]`
    );
    const tempHpBarBottom = document.querySelector(
      `.heraldPlayerlist-tempbarbottom[data-actor-id="${actor.uuid}"]`
    );
    const tempValue = document.querySelector(
      `.heraldPlayerlist-tempvalue[data-actor-id="${actor.uuid}"]`
    );
    const tempShield = document.querySelector(
      `.heraldPlayerlist-tempshield[data-actor-id="${actor.uuid}"]`
    );
    if (hpBar) {
      hpBar.style.width = `${hpPercent}%`;
      if (hpPercent <= 25) {
        hpBar.style.backgroundColor = hp25;
      } else if (hpPercent <= 50) {
        hpBar.style.backgroundColor = hp50;
      } else if (hpPercent <= 75) {
        hpBar.style.backgroundColor = hp75;
      } else {
        hpBar.style.backgroundColor = hp100;
      }
    }
    const hpvalue = document.querySelector(
      `.heraldPlayerlist-hpvalue[data-actor-id="${actor.uuid}"]`
    );
    if (hpvalue) {
      hpvalue.innerText = hp + "/" + maxHp;
    }
    if (tempHp) {
      if (tempHp > 0) {
        tempHpBarTop.style.width = `${tempPercentage}%`;
        tempHpBarBottom.style.width = `${tempPercentage}%`;
        tempValue.innerText = "+" + tempHp;
        tempShield.innerHTML = `
        <img src="/modules/herald-playerlist-beta/assets/temp_shield.png" alt="shield" class="heraldPlayerlist-imgtempshield" />
        `;
      }
      if (tempPercentage < 10) {
        console.log("cek");
        tempHpBarTop.style.width = "10%";
        tempHpBarBottom.style.width = `${tempPercentage + 1}%`;
      }
    } else {
      tempHpBarTop.style.width = "";
      tempHpBarBottom.style.width = ``;
      tempValue.innerText = "";
      tempShield.innerHTML = ``;
    }
  }
}

function heraldPlayerlist_updateEffectActor() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    let effectlist = ``;
    actor.effects.forEach((effect) => {
      effectlist += `
        <div>
          <img src="${effect.img}" class="heraldPlayerlist-playerEffect" alt="${effect.name}" />
        </div>`;
    });

    if (effectlist == ``) {
      effectlist = `
        <div>
          <div class="heraldPlayerlist-playerEffect" style="opacity: 0;"></diiv>
        </div>`;
    }
    const listeffect = document.querySelector(
      `.heraldPlayerlist-listeffect[data-actor-id="${actor.uuid}"]`
    );
    if (listeffect) {
      listeffect.innerHTML = effectlist;
    }
  }
}

function heraldPlayerlist_universalChecker() {
  setInterval(() => {
    const heraldPlayerlist = canvas.scene.getFlag("world", "heraldPlayerlist");
    if (heraldPlayerlist) {
      heraldPlayerlist_updateEffectActor();
    }
  }, 1000);
}

Hooks.on("updateActor", async (actor, data) => {
  const heraldPlayerlist = canvas.scene.getFlag("world", "heraldPlayerlist");
  if (heraldPlayerlist) {
    heraldPlayerlist_updateHpActor();
    heraldPlayerlist_updateEffectActor();
  }
});

Hooks.on("createToken", async () => {
  heraldPlayerlist_getListActor();
  heraldPlayerlist_getSettingValue();
});

Hooks.on("deleteToken", async () => {
  heraldPlayerlist_getListActor();
  heraldPlayerlist_getSettingValue();
});

function heraldPlayerlist_universalSettingValue(nameSetting, value) {
  if (nameSetting == "toggleShow") {
    heraldPlayerlist_showPlayerlist = value;

    heraldPlayerlist_createPlayerList();
  }

  if (nameSetting == "widthDistance") {
    const widthDistanceDiv = document.getElementById("heraldPlayerlist");
    if (widthDistanceDiv) {
      widthDistanceDiv.style.left = value + "vw";
    }
  }

  if (nameSetting == "heightDistance") {
    const heightDistanceDiv = document.getElementById("heraldPlayerlist");
    if (heightDistanceDiv) {
      heightDistanceDiv.style.top = value + "vh";
      console.timeLog(heightDistanceDiv);
    }
  }

  if (nameSetting == "fontSize") {
    const fontSizeDiv = document.querySelectorAll(
      ".heraldPlayerlist-tokenname"
    );
    if (fontSizeDiv.length > 0) {
      fontSizeDiv.forEach((element) => {
        element.style.fontSize = value + "px";
      });
    }
  }
}

function heraldPlayerlist_colorSettingValue(nameSetting, value) {
  if (nameSetting == "actorNameColor") {
    const actorNameColor = document.querySelectorAll(
      ".heraldPlayerlist-tokenname"
    );
    if (actorNameColor.length > 0) {
      actorNameColor.forEach((element) => {
        element.style.color = value;
      });
    }
  }
  if (nameSetting == "tempHpColor") {
    const tempHpColor = document.querySelectorAll(".heraldPlayerlist-tempbar");
    if (tempHpColor.length > 0) {
      tempHpColor.forEach((element) => {
        element.style.color = value;
      });
    }
  }
  if (nameSetting == "hp25Color") {
    hp25 = value;
    heraldPlayerlist_updateHpActor();
  }
  if (nameSetting == "hp50Color") {
    hp50 = value;
    heraldPlayerlist_updateHpActor();
  }
  if (nameSetting == "hp75Color") {
    hp75 = value;
    heraldPlayerlist_updateHpActor();
  }
  if (nameSetting == "hp100Color") {
    hp100 = value;
    heraldPlayerlist_updateHpActor();
  }
}

function heraldPlayerlist_getSettingValue() {
  const toggleShow = game.settings.get(
    "herald-playerlist-beta",
    "heraldplayerlist_toggleShow"
  );
  heraldPlayerlist_universalSettingValue("toggleShow", toggleShow);

  setTimeout(() => {
    const widthDistance = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_widthDistance"
    );
    heraldPlayerlist_universalSettingValue("widthDistance", widthDistance);

    const heightDistance = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_heightDistance"
    );
    heraldPlayerlist_universalSettingValue("heightDistance", heightDistance);

    const fontSize = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_fontSize"
    );
    heraldPlayerlist_universalSettingValue("fontSize", fontSize);

    const actorNameColor = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_actorNameColor"
    );
    heraldPlayerlist_colorSettingValue("actorNameColor", actorNameColor);

    const tempHpColor = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_tempHpColor"
    );
    heraldPlayerlist_colorSettingValue("tempHpColor", tempHpColor);

    const hp25Color = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_hp25Color"
    );

    hp25 = hp25Color;
    const hp50Color = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_hp50Color"
    );
    hp50 = hp50Color;
    const hp75Color = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_hp75Color"
    );
    hp75 = hp75Color;
    const hp100Color = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_hp100Color"
    );
    hp100 = hp100Color;

    heraldPlayerlist_updateHpActor();
  }, 500);
}

export {
  heraldPlayerlist_getListActor,
  heraldPlayerlist_universalChecker,
  heraldPlayerlist_getSettingValue,
  heraldPlayerlist_universalSettingValue,
  heraldPlayerlist_colorSettingValue,
};
