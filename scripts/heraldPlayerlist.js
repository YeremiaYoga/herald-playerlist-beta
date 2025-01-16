let heraldPlayerlist_listActorCanvas = [];
let hp0 = "#8B0000";
let hp25 = "#bc3c04";
let hp50 = "#c47404";
let hp75 = "#8c9c04";
let hp100 = "#389454";
let hpgradient = "#302c2c";

let heraldPlayerlist_showPlayerlist = true;

Hooks.on("canvasReady", async () => {
  if (canvas.scene.active == true) {
    await heraldPlayerlist_toggleShowPlayerlist();
    // heraldPlayerlist_getListActor();
    // heraldPlayerlist_getSettingValue();
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

  // for (let actor of heraldPlayerlist_listActorCanvas) {
  //   const allUsers = game.users;
  //   for (let user of allUsers) {
  //     console.log(user.id);
  //   }
  //   console.log(allUsers);
  //   console.log(actor);
  // }
  heraldPlayerlist_createPlayerList();
  // heraldPlayerlist_renderCollapseButton();
}
let heraldPlayerlist_rendered = false;
async function heraldPlayerlist_toggleShowPlayerlist() {
  if (heraldPlayerlist_rendered) {
    return;
  }

  if (heraldPlayerlist_showPlayerlist == true) {
    heraldPlayerlist_rendered = true;
    heraldPlayerlist_getListActor();
    heraldPlayerlist_getSettingValue();
  } else {
    const existingBar = document.getElementById("heraldPlayerlist");
    if (existingBar) {
      heraldPlayerlist_rendered = false;
      existingBar.remove();
    }
  }
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
      const playerlist = div.firstChild;
      playerlist.id = "heraldPlayerlist";

      heraldPlayerlist_createCollapseButton(playerlist);
      heraldPlayerlist_createHtmlPlayerlist(playerlist);
      document.body.appendChild(playerlist);
      heraldPlayerlist_renderlistPlayer();
    })
    .catch((err) => {
      console.error("Gagal memuat template hpbar.html:", err);
    });
}

function heraldPlayerlist_createHtmlPlayerlist(playerlist) {
  const containerDiv = document.createElement("div");
  containerDiv.id = "heraldPlayerlist-container";
  containerDiv.classList.add("heraldPlayerlist-container");

  const listPlayerDiv = document.createElement("div");
  listPlayerDiv.id = "heraldPlayerlist-listPlayer";
  listPlayerDiv.classList.add("heraldPlayerlist-listPlayer");

  containerDiv.appendChild(listPlayerDiv);
  playerlist.appendChild(containerDiv);
}
function heraldPlayerlist_createCollapseButton(playerlist) {
  const user = game.user;
  let ownerActor = false;
  for (let actor of heraldPlayerlist_listActorCanvas) {
    if (actor.ownership[user.id]) {
      if (actor.ownership[user.id] == 3) {
        ownerActor = true;
      }
    }
  }

  if (ownerActor == false) {
    return;
  }

  const collapseContainer = document.createElement("div");
  collapseContainer.id = "heraldPlayerlist-collapseContainer";

  const collapseButton = document.createElement("button");
  collapseButton.id = "heraldPlayerlist-collapseButton";
  collapseButton.classList.add("heraldPlayerlist-collapseButton");
  collapseButton.textContent = "v";

  collapseContainer.appendChild(collapseButton);
  playerlist.appendChild(collapseContainer);

  collapseButton.addEventListener("click", function () {
    heraldPlayerlist_toggleCollapse();
  });
}

let heraldPlayerlist_showCollapse = false;
function heraldPlayerlist_toggleCollapse() {
  const collapseButton = document.getElementById(
    "heraldPlayerlist-collapseButton"
  );
  if (heraldPlayerlist_showCollapse) {
    heraldPlayerlist_renderlistPlayer();
    heraldPlayerlist_showCollapse = false;
    collapseButton.style.marginBottom = "5px";
    collapseButton.innerHTML = "v";
    heraldPlayerlist_getSettingActor();
  } else {
    heraldPlayerlist_renderCollapselist();
    heraldPlayerlist_showCollapse = true;
    collapseButton.style.marginBottom = "0";
    collapseButton.innerHTML = ">";
  }
}

function heraldPlayerlist_getSettingActor() {
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

  const hpGradientColor = game.settings.get(
    "herald-playerlist-beta",
    "heraldplayerlist_hpGradientColor"
  );
  hpgradient = hpGradientColor;

  const hp0Color = game.settings.get(
    "herald-playerlist-beta",
    "heraldplayerlist_hp0Color"
  );
  hp0 = hp0Color;
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
}

function heraldPlayerlist_renderCollapselist() {
  let listPLayer = ``;
  let divListPlayer = document.getElementById("heraldPlayerlist-listPlayer");
  for (let actor of heraldPlayerlist_listActorCanvas) {
    listPLayer += `
    <div id="heraldPlayerlist-playerActor" class="heraldPlayerlist-playerActor">
        <div id="heraldPlayerlist-playerContainer" class="heraldPlayerlist-playerContainer">
          <div id="heraldPlayerlist-collapsePlayerContainer" class="heraldPlayerlist-collapsePlayerContainer">
              <img src="${actor.img}" alt="Image" class="heraldPlayerlist-actorImageCollapse" />
          </div>
        </div>
    </div>`;
  }
  divListPlayer.innerHTML = listPLayer;
}
function heraldPlayerlist_renderlistPlayer() {
  let listPLayer = ``;
  let divListPlayer = document.getElementById("heraldPlayerlist-listPlayer");
  const heraldPlayerlist = canvas.scene.getFlag("world", "heraldPlayerlist");
  for (let actor of heraldPlayerlist_listActorCanvas) {
    listPLayer += `
    <div id="heraldPlayerlist-playerActor" class="heraldPlayerlist-playerActor">
        <div id="heraldPlayerlist-playerContainer" class="heraldPlayerlist-playerContainer">
          <div id="heraldPlayerlist-leftContainer" class="heraldPlayerlist-leftContainer">
              <img src="${actor.img}" alt="Image" class="heraldPlayerlist-actorImage" />
          </div>
          <div id="heraldPlayerlist-rightContainer" class="heraldPlayerlist-rightContainer">
            <div id="heraldPlayerlist-tokenname" class="heraldPlayerlist-tokenname">
              ${actor.name}
            </div>
            <div id="heraldPlayerlist-hpbarContainer" class="heraldPlayerlist-hpbarContainer">
              <div class="heraldPlayerlist-hpbarBackground" data-actor-id="${actor.uuid}">
                <div class="heraldPlayerlist-hpbar" data-actor-id="${actor.uuid}"></div>
                <div class="heraldPlayerlist-tempbartop" data-actor-id="${actor.uuid}"></div>
                <div class="heraldPlayerlist-tempbarbottom" data-actor-id="${actor.uuid}"></div>
                <div class="heraldPlayerlist-tempvalue" data-actor-id="${actor.uuid}"></div>
                <div class="heraldPlayerlist-hpattributesvalue">
                  <div class="heraldPlayerlist-hpvalue" data-actor-id="${actor.uuid}"></div>
                  <div class="heraldPlayerlist-tempmaxhp" data-actor-id="${actor.uuid}"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="heraldPlayerlist-lowerbar" class="heraldPlayerlist-lowerbar" data-actor-id="${actor.uuid}">
        <div class="heraldPlayerlist-armorclass" data-actor-id="${actor.uuid}">
           <img src="/modules/herald-playerlist-beta/assets/armor_class.webp" alt="Armor Class" class="heraldPlayerlist-armorclassimage" />
           <div class="heraldPlayerlist-armorclassvalue" data-actor-id="${actor.uuid}"></div>
        </div>
         <div class="heraldPlayerlist-tempshield" data-actor-id="${actor.uuid}"></div>
        <div id="heraldPlayerlist-listeffect" class="heraldPlayerlist-listeffect" data-actor-id="${actor.uuid}">
        </div>
       
        </div>
      </div>
    </div>`;
  }

  divListPlayer.innerHTML = listPLayer;

  heraldPlayerlist_updateHpActor();
  heraldPlayerlist_updateEffectActor();
}

async function heraldPlayerlist_updateHpActor() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    const hp = actor.system.attributes.hp.value;
    const maxHp = actor.system.attributes.hp.max;
    const tempHp = actor.system.attributes.hp.temp || 0;

    const tempmaxhp = actor.system.attributes.hp.tempmax;
    const totalMaxHp = maxHp + tempmaxhp;
    const hpPercent = (hp / totalMaxHp) * 100;

    let tempPercentage = (tempHp / maxHp) * 100;
    if (tempPercentage > 100) {
      tempPercentage = 100;
    }
    const hpvalue = document.querySelector(
      `.heraldPlayerlist-hpvalue[data-actor-id="${actor.uuid}"]`
    );
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
    const tempMaxHpDiv = document.querySelector(
      `.heraldPlayerlist-tempmaxhp[data-actor-id="${actor.uuid}"]`
    );

    const armorClassDiv = document.querySelector(
      `.heraldPlayerlist-armorclassvalue[data-actor-id="${actor.uuid}"]`
    );
    if (hpBar) {
      if (hp > 0) {
        hpBar.style.width = `${hpPercent}%`;
        if (hpPercent < 0) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp0} 98%)`;
        } else if (hpPercent <= 25) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp25} 98%)`;
        } else if (hpPercent <= 50) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp50} 98%)`;
        } else if (hpPercent <= 75) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp75} 98%)`;
        } else {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp100} 98%)`;
        }
        if (hpvalue) {
          hpvalue.innerText = hp + "/" + totalMaxHp;
        }
      } else {
        let temphpValue = hp;
        let negativeBlockMax = hp + totalMaxHp;
        if (negativeBlockMax < 0) {
          temphpValue = totalMaxHp * -1;

          await actor.update({
            "system.attributes.hp.value": temphpValue,
          });
        }
        const negativeHpPercent = (temphpValue / totalMaxHp) * -100;
        hpBar.style.width = `${negativeHpPercent}%`;
        if (negativeHpPercent < 0) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp0} 98%)`;
        } else if (negativeHpPercent <= 25) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp25} 98%)`;
        } else if (negativeHpPercent <= 50) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp50} 98%)`;
        } else if (negativeHpPercent <= 75) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp75} 98%)`;
        } else {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp100} 98%)`;
        }
        if (hpvalue) {
          hpvalue.innerText = temphpValue + "/" + totalMaxHp;
        }
      }
    }

    if (tempMaxHpDiv) {
      if (tempmaxhp) {
        if (tempmaxhp > 0) {
          tempMaxHpDiv.innerText = `(+${tempmaxhp})`;
          tempMaxHpDiv.style.color = "#05b4ff";
        } else {
          tempMaxHpDiv.innerText = `(${tempmaxhp})`;
          tempMaxHpDiv.style.color = "#b0001d";
        }
      }
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
        tempHpBarTop.style.width = `${tempPercentage + 8}%`;
        tempHpBarBottom.style.width = `${tempPercentage + 8}%`;
      }
    } else {
      tempHpBarTop.style.width = "";
      tempHpBarBottom.style.width = ``;
      tempValue.innerText = "";
      tempShield.innerHTML = ``;
    }

    if (armorClassDiv) {
      const acValue = actor.system.attributes.ac.value;
      armorClassDiv.innerText = acValue;
    }
  }
}

function heraldPlayerlist_updateEffectActor() {
  heraldPlayerlist_listActorCanvas = [];
  const tokens = canvas.tokens.placeables;
  for (let token of tokens) {
    if (token.actor.type == "character") {
      heraldPlayerlist_listActorCanvas.push(token.actor);
    }
  }
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
      if (effect.target !== actor) {
        return;
      }

      let stackDiv = "";
      if (/\(\d+\)/.test(effect.name)) {
        const match = effect.name.match(/\((\d+)\)/);
        if (match) {
          const number = parseInt(match[1], 10);
          stackDiv = `<div class="heraldPlayerlist-stackeffect">${number}</div>`;
        }
      }

      let durationDiv = "";
      if (effect.duration.rounds > 0) {
        durationDiv = `
              <div class="heraldplayerlist-detaileffectduration">
                ${effect.duration.rounds} rounds
              </div>`;
      }

      const effectDetailDiv = `
            <div class="heraldPlayerlist-effectdetail" style="display: none;">
              <div class="heraldPlayerlist-effecttooltip">
                <h3>${effect.name}</h3>
                <div>
                  <div>${effect.description}</div>
                </div>
                <div id="heraldPlayerlist-detaileffectbot" class="heraldPlayerlist-detaileffectbot">
                  <div id="heraldPlayerlist-detaileffecttype" class="heraldPlayerlist-detaileffecttype">
                    ${effect.isTemporary ? "Temporary" : "Passive"}
                  </div>
                  ${durationDiv}
                </div>
              </div>
            </div>`;
      effectlist += `
            <div class="heraldPlayerlist-effectitem" data-effect-id="${effect.id}" data-actor-id="${actor.uuid}">
              <div class="heraldPlayerlist-effectcontainer">
                <img src="${effect.img}" alt="${effect.name}" class="heraldPlayerlist-playerEffect" />
                ${stackDiv}
              </div>
              ${effectDetailDiv}
            </div>`;
    });

    if (effectlist == ``) {
      effectlist = `
        <div>
          <div class="heraldPlayerlist-playerEffect" style="opacity: 0;"></div>
        </div>`;
    }

    const listeffect = document.querySelector(
      `.heraldPlayerlist-listeffect[data-actor-id="${actor.uuid}"]`
    );
    if (listeffect) {
      listeffect.innerHTML = effectlist;
      document
        .querySelectorAll(".heraldPlayerlist-effectitem")
        .forEach((item) => {
          const detailDiv = item.querySelector(
            ".heraldPlayerlist-effectdetail"
          );
          item.addEventListener("mouseenter", () => {
            if (detailDiv) detailDiv.style.display = "block";
          });
          item.addEventListener("mouseleave", () => {
            if (detailDiv) detailDiv.style.display = "none";
          });
        });

      document
        .querySelectorAll(".heraldPlayerlist-effectitem")
        .forEach((item) => {
          item.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            const effectId = this.getAttribute("data-effect-id");
            const actorUuid = this.getAttribute("data-actor-id");
            heraldPlayerlist_deleteEffectActor(effectId, actorUuid);
          });
        });
    }
  }
}
let heraldPlayerlist_dialogDeleteEffect = false;
function heraldPlayerlist_deleteEffectActor(effectId, actorUuid) {
  if (heraldPlayerlist_dialogDeleteEffect) {
    console.log("Dialog already open, preventing duplicate.");
    return;
  }
  const actor = canvas.tokens.placeables.find(
    (token) => token.actor.uuid === actorUuid
  ).actor;
  const effectToDelete = actor.effects.find((effect) => effect.id === effectId);

  if (!effectToDelete) {
    console.error("Effect not found");
    return;
  }
  heraldPlayerlist_dialogDeleteEffect = true;
  const dialog = new Dialog({
    title: "Delete Effect Player",
    content: `
      <p>Are you sure you want to delete the effect <b>${effectToDelete.name}</b> from actor <b>${actor.name}</b>?</p>
    `,
    buttons: {
      delete: {
        label: "Delete",
        callback: () => {
          effectToDelete.delete();
          heraldPlayerlist_updateEffectActor();
          heraldPlayerlist_dialogDeleteEffect = false;
        },
      },
      cancel: {
        label: "Cancel",
        callback: () => {
          heraldPlayerlist_dialogDeleteEffect = false;
          console.log("Effect deletion canceled");
        },
      },
    },
    default: "cancel",
    close: () => {
      console.log("Dialog closed");
    },
  });

  dialog.render(true);
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

    heraldPlayerlist_toggleShowPlayerlist();
    heraldPlayerlist_rendered = false;
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
  if (nameSetting == "hpgradient") {
    hpgradient = value;
    heraldPlayerlist_updateHpActor();
  }
  if (nameSetting == "hp0Color") {
    hp0 = value;
    heraldPlayerlist_updateHpActor();
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

    const hpGradientColor = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_hpGradientColor"
    );
    hpgradient = hpGradientColor;

    const hp0Color = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_hp0Color"
    );
    hp0 = hp0Color;
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
