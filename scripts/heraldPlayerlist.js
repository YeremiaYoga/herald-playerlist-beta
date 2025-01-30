let heraldPlayerlist_listActorCanvas = [];
let heraldPlayerlist_listNpcCanvas = [];
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

async function heraldPlayerlist_getListNpc() {
  let listNpcUuid = [];

  if (!canvas || !canvas.scene) {
    console.log("No active scene found.");
    return;
  }
  heraldPlayerlist_listNpcCanvas = [];
  const tokens = canvas.tokens.placeables;
  for (let token of tokens) {
    if (token.actor.type == "npc") {
      heraldPlayerlist_listNpcCanvas.push(token.actor);
      listNpcUuid.push(token.actor.uuid);
    }
  }

  await canvas.scene.setFlag("world", "heraldPlayerlist", {
    listNpcUuid: listNpcUuid,
  });
}
let heraldPlayerlist_rendered = false;
async function heraldPlayerlist_toggleShowPlayerlist() {
  if (heraldPlayerlist_rendered) {
    return;
  }

  if (heraldPlayerlist_showPlayerlist == true) {
    heraldPlayerlist_rendered = true;
    heraldPlayerlist_getListActor();
    heraldPlayerlist_getListNpc();
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

      heraldPlayerlist_createCollapseActor(playerlist);
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
function heraldPlayerlist_createCollapseActor(playerlist) {
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

  const collapseButtonNpc = document.createElement("button");
  collapseButtonNpc.id = "heraldPlayerlist-collapseButtonNpc";
  collapseButtonNpc.classList.add("heraldPlayerlist-collapseButtonNpc");
  collapseButtonNpc.textContent = "O";

  collapseContainer.appendChild(collapseButton);
  collapseContainer.appendChild(collapseButtonNpc);
  playerlist.appendChild(collapseContainer);

  collapseButton.addEventListener("click", function () {
    heraldPlayerlist_toggleCollapse();
  });
  collapseButtonNpc.addEventListener("click", function () {
    heraldPlayerlist_toggleCollapseNpc();
  });
}

let heraldPlayerlist_showCollapseNpc = false;
async function heraldPlayerlist_toggleCollapseNpc() {
  const collapseButtonNpc = document.getElementById(
    "heraldPlayerlist-collapseButtonNpc"
  );

  if (heraldPlayerlist_showCollapseNpc) {
    await heraldPlayerlist_renderNpclist();
    heraldPlayerlist_showCollapseNpc = false;
    collapseButtonNpc.style.left = "5%";
    collapseButtonNpc.innerHTML = "O";
    heraldPlayerlist_renderButtonCollapseNpc();
  } else {
    heraldPlayerlist_renderCollapseNpclist();
    heraldPlayerlist_showCollapseNpc = true;
    collapseButtonNpc.style.left = "5%";
    collapseButtonNpc.innerHTML = "O";
  }
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
      <div id="heraldPlayerlist-playerListContainer" class="heraldPlayerlist-playerListContainer">
      <div id="heraldPlayerlist-playerContainer" class="heraldPlayerlist-playerContainer">
            <div id="heraldPlayerlist-collapsePlayerContainer" class="heraldPlayerlist-collapsePlayerContainer">
                <img src="${actor.img}" alt="Image" class="heraldPlayerlist-actorImageCollapse" />
            </div>
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
    let arrClassActor = [];
    for (let item of actor.items) {
      if (item.type === "class") {
        arrClassActor.push(item.name);
      }
    }
    let classActorValue = arrClassActor.join("/");
    const actorTooltip = `
    <div class="heraldPlayerlist-actorTooltip" data-actor-id="${
      actor.uuid
    }" style="display: none;">
        <h3>${actor.name}</h3>
        <div class="heraldPlayerlist-characterStatus">
          <div class="heraldPlayerlist-detailActorHp" data-actor-id="${
            actor.uuid
          }"></div>
          <div class="heraldPlayerlist-detailActorAc" data-actor-id="${
            actor.uuid
          }"></div>
          <div class="heraldPlayerlist-detailActorMovement" data-actor-id="${
            actor.uuid
          }"></div>
          <div class="heraldPlayerlist-detailActorSpeedDc" data-actor-id="${
            actor.uuid
          }"></div>
        </div>
        <div class="heraldPlayerlist-characterStatus2">
          <div class="heraldPlayerlist-actorlevel">
            <div>Level ${actor.system.details?.level || "Unknown"}</div>
            <div> ${classActorValue || "Unknown"}</div>
            <div> - </div>
            <div> ${actor.system.details?.race || "Unknown"}</div>
          </div>
        </div>
    </div>`;

    listPLayer += `
    <div id="heraldPlayerlist-playerActor" class="heraldPlayerlist-playerActor">
      <div id="heraldPlayerlist-playerListContainer" class="heraldPlayerlist-playerListContainer">
        <div id="heraldPlayerlist-playerContainer" class="heraldPlayerlist-playerContainer">
          <div id="heraldPlayerlist-leftContainer" class="heraldPlayerlist-leftContainer">
            <div class="heraldPlayerlist-actorImageContainer">
              <img src="${actor.img}" alt="Image" class="heraldPlayerlist-actorImage" />
               ${actorTooltip}
            </div>
            
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
          <div id="heraldPlayerlist-listeffect" class="heraldPlayerlist-listeffect" data-actor-id="${actor.uuid}"></div>
        </div>
      </div>
      <div id="heraldPlayerlist-npcContainer" class="heraldPlayerlist-npcContainer" data-actor-id="${actor.uuid}">
        <div id="heraldPlayerlist-npcButtonCollapseActor" class="heraldPlayerlist-npcButtonCollapseActor" data-actor-id="${actor.uuid}">
        
        </div>
        <div id="heraldPlayerlist-npclist" class="heraldPlayerlist-npclist" data-actor-id="${actor.uuid}">
        </div>
      </div>
     
    </div>`;
  }

  divListPlayer.innerHTML = listPLayer;
  document
    .querySelectorAll(".heraldPlayerlist-actorImageContainer")
    .forEach((container) => {
      const tooltip = container.querySelector(".heraldPlayerlist-actorTooltip");

      container.addEventListener("mouseenter", () => {
        if (tooltip) tooltip.style.display = "block";
      });

      container.addEventListener("mouseleave", () => {
        if (tooltip) tooltip.style.display = "none";
      });
    });
  setTimeout(async () => {
    await heraldPlayerlist_updateHpActor();
    heraldPlayerlist_updateEffectActor();
    await heraldPlayerlist_renderNpclist();
    heraldPlayerlist_renderButtonCollapseNpc();
  }, 500);
}

function heraldPlayerlist_renderButtonCollapseNpc() {
  const playerList = game.users.filter(
    (user) => user.role === CONST.USER_ROLES.PLAYER
  );

  for (let actor of heraldPlayerlist_listActorCanvas) {
    const npcCollapseButtonActor = document.querySelector(
      `.heraldPlayerlist-npcButtonCollapseActor[data-actor-id="${actor.uuid}"]`
    );
    let npcFound = false;
    for (let user of playerList) {
      if (actor.ownership[user.id] == 3) {
        for (let npc of heraldPlayerlist_listNpcCanvas) {
          if (npc.ownership[user.id] == 3) {
            npcFound = true;
            break;
          }
        }
      }
      if (npcFound == true) {
        break;
      }
    }

    if (npcFound == true) {
      if (npcCollapseButtonActor) {
        npcCollapseButtonActor.innerHTML = ``;

        const collapseNpclistButton = document.createElement("button");
        collapseNpclistButton.classList.add(
          "heraldPlayerlist-collapseNpclistButton"
        );
        collapseNpclistButton.textContent = "X";

        collapseNpclistButton.addEventListener("click", () => {
          heraldPlayerlist_collapseNpclistActor(actor);
        });

        npcCollapseButtonActor.appendChild(collapseNpclistButton);
      }
    }
  }
}

function heraldPlayerlist_collapseNpclistActor(actor) {
  const npcListDiv = document.querySelector(
    `.heraldPlayerlist-npclist[data-actor-id="${actor.uuid}"]`
  );

  if (npcListDiv.innerHTML.trim() === "") {
    heraldPlayerlist_renderNpclistSingleActor(actor);
  } else {
    npcListDiv.innerHTML = "";
  }
}

function heraldPlayerlist_renderNpclistSingleActor(actor) {
  const playerList = game.users.filter(
    (user) => user.role === CONST.USER_ROLES.PLAYER
  );
  const npclistDiv = document.querySelector(
    `.heraldPlayerlist-npclist[data-actor-id="${actor.uuid}"]`
  );
  let npcActorView = ``;
  for (let user of playerList) {
    if (actor.ownership[user.id] == 3) {
      for (let npc of heraldPlayerlist_listNpcCanvas) {
        if (npc.ownership[user.id] == 3) {
          const npcTooltip = `
          <div class="heraldPlayerlist-npcTooltip" data-actor-id="${
            actor.uuid
          }" data-npc-id="${npc.uuid}" style="display: none;">
              <h3>${npc.name}</h3>
              <div class="heraldPlayerlist-npcStatus">
                <div class="heraldPlayerlist-detailNpcHp" data-actor-id="${
                  actor.uuid
                }" data-npc-id="${npc.uuid}"></div>
                <div class="heraldPlayerlist-detailNpcAc" data-actor-id="${
                  actor.uuid
                }" data-npc-id="${npc.uuid}"></div>
                <div class="heraldPlayerlist-detailNpcMovement" data-actor-id="${
                  actor.uuid
                }" data-npc-id="${npc.uuid}"></div>
              </div>
              <div class="heraldPlayerlist-npcStatus2">
                <div class="heraldPlayerlist-npcLevel">
                  <div>CR ${npc.system.details?.cr || "Unknown"}</div>
                  <div> - </div>
                  <div> ${npc.system.details?.type.value || "Unknown"}</div>
                  <div> ${npc.system.details?.type.subtype || ""}</div>
                </div>
              </div>
          </div>`;
          npcActorView += `
          <div class="heraldPlayerlist-npc">
            <div>
              <div id="heraldPlayerlist-npcbar" class="heraldPlayerlist-npcbar">
                  <svg width="50" height="50" viewBox="0 0 100 100" class="heraldPlayerlist-npchpcontainer">
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbackground" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbackground" stroke-dasharray="300" stroke-dashoffset="200" />
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbar" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbar" stroke-dasharray="300" stroke-dashoffset="200" />
                  </svg>
              </div>
              <div class="heraldPlayerlist-npcBarBorderContainer" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}">
                  
              </div>
            </div>
            <div class="heraldPlayerlist-npcWrapper">
                <div class="heraldPlayerlist-npcImageContainer">
                  <img src="${npc.img}" alt="npc" class="heraldPlayerlist-npcimageview">
                </div>
                ${npcTooltip}
             
              </div>
            <div id="heraldPlayelist-npceffectlist"></div>
            <div id="heraldPlayerlist-npcdetails" class="heraldPlayerlist-npcdetails">
              <div class="heraldPlayerlist-npcACContainer" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}">
                  <img src="/modules/herald-playerlist-beta/assets/armor_class.webp" alt="Armor Class" class="heraldPlayerlist-npcACImage" />
                  <div class="heraldPlayerlist-npcACValue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
              </div>
              <div class="heraldPlayerlist-npchpvalue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
              <div class="heraldPlayerlist-npctempvalue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
              <div class="heraldPlayerlist-npctempshield" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
            </div>
          </div>`;
        }
      }
    }
  }

  if (npclistDiv) {
    npclistDiv.innerHTML = npcActorView;
    document
      .querySelectorAll(".heraldPlayerlist-npcWrapper")
      .forEach((wrapper) => {
        const imageContainer = wrapper.querySelector(
          ".heraldPlayerlist-npcImageContainer"
        );
        const tooltip = wrapper.querySelector(".heraldPlayerlist-npcTooltip");

        if (!imageContainer || !tooltip) return;

        imageContainer.addEventListener("mouseenter", () => {
          tooltip.style.display = "block";
        });

        imageContainer.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });
      });
  }
  setTimeout(async () => {
    await heraldPlayerlist_updateDetailNpc();
  }, 500);
}

function heraldPlayerlist_renderCollapseNpclist() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    const npclistDiv = document.querySelector(
      `.heraldPlayerlist-npclist[data-actor-id="${actor.uuid}"]`
    );
    const npcCollapseButtonDiv = document.querySelector(
      `.heraldPlayerlist-npcButtonCollapseActor[data-actor-id="${actor.uuid}"]`
    );
    if (npclistDiv) {
      npclistDiv.innerHTML = ``;
    }

    if (npcCollapseButtonDiv) {
      npcCollapseButtonDiv.innerHTML = ``;
    }
  }
}

async function heraldPlayerlist_renderNpclist() {
  const playerList = game.users.filter(
    (user) => user.role === CONST.USER_ROLES.PLAYER
  );
  for (let actor of heraldPlayerlist_listActorCanvas) {
    const npclistDiv = document.querySelector(
      `.heraldPlayerlist-npclist[data-actor-id="${actor.uuid}"]`
    );
    let npcActorView = ``;
    for (let user of playerList) {
      if (actor.ownership[user.id] == 3) {
        for (let npc of heraldPlayerlist_listNpcCanvas) {
          if (npc.ownership[user.id] == 3) {
            const npcTooltip = `
            <div class="heraldPlayerlist-npcTooltip" data-actor-id="${
              actor.uuid
            }" data-npc-id="${npc.uuid}" style="display: none;">
                <h3>${npc.name}</h3>
                <div class="heraldPlayerlist-npcStatus">
                  <div class="heraldPlayerlist-detailNpcHp" data-actor-id="${
                    actor.uuid
                  }" data-npc-id="${npc.uuid}"></div>
                  <div class="heraldPlayerlist-detailNpcAc" data-actor-id="${
                    actor.uuid
                  }" data-npc-id="${npc.uuid}"></div>
                  <div class="heraldPlayerlist-detailNpcMovement" data-actor-id="${
                    actor.uuid
                  }" data-npc-id="${npc.uuid}"></div>
                        <div class="heraldPlayerlist-detailNpcSpeedDc" data-actor-id="${
                          actor.uuid
                        }" data-npc-id="${npc.uuid}"></div>
                </div>

                <div class="heraldPlayerlist-npcStatus2">
                  <div class="heraldPlayerlist-npcLevel">
                    <div>CR ${npc.system.details?.cr || "Unknown"}</div>
                    <div> - </div>
                    <div> ${npc.system.details?.type.value || "Unknown"}</div>
                    <div> ${npc.system.details?.type?.subtype ? `(${npc.system.details.type.subtype})` : ""} </div>
                  </div>
                </div>
            </div>`;
            npcActorView += `
            <div class="heraldPlayerlist-npc">
              <div>
                <div id="heraldPlayerlist-npcbar" class="heraldPlayerlist-npcbar">
                  <svg width="50" height="50" viewBox="0 0 100 100" class="heraldPlayerlist-npchpcontainer">
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbackground" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbackground" stroke-dasharray="300" stroke-dashoffset="200" />
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbar" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbar" stroke-dasharray="300" stroke-dashoffset="200" />
                  </svg>
                </div>
                <div class="heraldPlayerlist-npcBarBorderContainer" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
              </div>
              <div class="heraldPlayerlist-npcWrapper">
                <div class="heraldPlayerlist-npcImageContainer">
                  <img src="${npc.img}" alt="npc" class="heraldPlayerlist-npcimageview">
                </div>
                ${npcTooltip}
             
              </div>
              <div id="heraldPlayelist-npceffectlist"></div>
              <div id="heraldPlayerlist-npcdetails" class="heraldPlayerlist-npcdetails">
                <div class="heraldPlayerlist-npcACContainer" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}">
                    <div class="heraldPlayerlist-npcACValue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
                    <img src="/modules/herald-playerlist-beta/assets/armor_class.webp" alt="Armor Class" class="heraldPlayerlist-npcACImage" />  
                </div>
                <div class="heraldPlayerlist-npchpvalue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
                <div class="heraldPlayerlist-npctempvalue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
                <div class="heraldPlayerlist-npctempshield" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
              </div>
            </div>`;
          }
        }
      }
    }
    if (npclistDiv) {
      npclistDiv.innerHTML = npcActorView;
      document
        .querySelectorAll(".heraldPlayerlist-npcWrapper")
        .forEach((wrapper) => {
          const imageContainer = wrapper.querySelector(
            ".heraldPlayerlist-npcImageContainer"
          );
          const tooltip = wrapper.querySelector(".heraldPlayerlist-npcTooltip");

          if (!imageContainer || !tooltip) return;

          imageContainer.addEventListener("mouseenter", () => {
            tooltip.style.display = "block";
          });

          imageContainer.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
          });
        });
    }
  }

  setTimeout(async () => {
    await heraldPlayerlist_updateDetailNpc();
  }, 500);
}




async function heraldPlayerlist_updateDetailNpc() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    for (let npc of heraldPlayerlist_listNpcCanvas) {
      const hp = npc.system.attributes.hp.value;
      const maxHp = npc.system.attributes.hp.max;
      const tempHp = npc.system.attributes.hp.temp || 0;

      const tempmaxhp = npc.system.attributes.hp.tempmax;
      const totalMaxHp = maxHp + tempmaxhp;
      const hpPercent = (hp / totalMaxHp) * 100;
      const tempPercent = (tempHp / totalMaxHp) * 100;

      let acValue = npc.system.attributes.ac.value;

      const npcHpBarCircle = document.querySelector(
        `.heraldPlayerlist-npchpbar[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcHpValueDiv = document.querySelector(
        `.heraldPlayerlist-npchpvalue[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcACValueDiv = document.querySelector(
        `.heraldPlayerlist-npcACValue[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcTempHpValueDiv = document.querySelector(
        `.heraldPlayerlist-npctempvalue[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcTempBarDiv = document.querySelector(
        `.heraldPlayerlist-npcBarBorderContainer[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcTempShieldDiv = document.querySelector(
        `.heraldPlayerlist-npctempshield[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      if (npcHpBarCircle) {
        let npchpvaluebar = 0;

        npchpvaluebar = 300 - hpPercent;

        npcHpBarCircle.style.strokeDashoffset = npchpvaluebar;
      }

      if (npcHpValueDiv) {
        npcHpValueDiv.innerText = hp + "/" + totalMaxHp;
      }

      if (npcACValueDiv) {
        npcACValueDiv.innerText = acValue;
      }

      if (tempHp > 0) {
        if (npcTempHpValueDiv) {
          npcTempHpValueDiv.innerText = `+${tempHp}`;
        }
      }

      if (tempHp > 0) {
        if (npcTempBarDiv) {
          npcTempBarDiv.innerHTML = `
            <div class="heraldPlayerlist-npcBarBorderTop">
              <svg width="54" height="54" viewBox="0 0 100 100" class="heraldPlayerlist-npchpcontainer">
                <circle cx="50" cy="50" r="45" class="heraldPlayerlist-npcBorderTop" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}" stroke-dasharray="300" stroke-dashoffset="200" />
              </svg>
            </div>
            <div class="heraldPlayerlist-npcBarBorderBottom">
              <svg width="42" height="42" viewBox="0 0 100 100" class="heraldPlayerlist-npchpcontainer">
                <circle cx="50" cy="50" r="45" class="heraldPlayerlist-npcBorderBottom" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}" stroke-dasharray="300" stroke-dashoffset="200" />
              </svg>
            </div>`;
        }

        const npcTempBarTopDiv = document.querySelector(
          `.heraldPlayerlist-npcBorderTop[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
        );

        const npcTempBarBottomDiv = document.querySelector(
          `.heraldPlayerlist-npcBorderBottom[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
        );
        let npcTempValuebar = 0;
        npcTempValuebar = 300 - tempPercent;
        if (npcTempBarTopDiv) {
          npcTempBarTopDiv.style.strokeDashoffset = npcTempValuebar;
        }
        if (npcTempBarBottomDiv) {
          npcTempBarBottomDiv.style.strokeDashoffset = npcTempValuebar;
        }
      }

      if (tempHp > 0) {
        if (npcTempShieldDiv) {
          npcTempShieldDiv.innerHTML = `<img src="/modules/herald-playerlist-beta/assets/temp_shield.png" alt="shield" class="heraldPlayerlist-npcimgtempshield" />`;
        }
      }
      // detail npc

      let speedDcValue = actor.system.attributes.spelldc;

      const detailNpcHpDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcHp[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );
      const detailNpcAcDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcAc[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const detailNpcSpeedDcDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcSpeedDc[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      if (detailNpcAcDiv) {
        detailNpcAcDiv.innerHTML = `<i class="fas fa-shield-alt" style="margin-right: 5px;"></i> ${
          acValue || 0
        } AC`;
      }

      if (detailNpcSpeedDcDiv) {
        detailNpcSpeedDcDiv.innerHTML = `<i class="fas fa-magic" style="margin-right: 5px;"></i> ${
          speedDcValue || 0
        } Spell Save DC`;
      }

      if (detailNpcHpDiv) {
        let tempmaxhptext = "";
        if (tempmaxhp) {
          if (tempmaxhp > 0) {
            tempmaxhptext = `(+${tempmaxhp})`;
          } else {
            tempmaxhptext = `(${tempmaxhp})`;
          }
        }

        detailNpcHpDiv.innerHTML = `<i class="fas fa-heart" style="margin-right: 5px;"></i>  ${hp}/${totalMaxHp} ${tempmaxhptext} HP`;
      }

      let movementBurrowValue = ``;
      let movementClimbValue = ``;
      let movementFlyValue = ``;
      let movementSwimValue = ``;
      let movementWalkValue = ``;
      let movementUnits = npc.system.attributes.movement.units;
      let movementHover = npc.system.attributes.movement.hover;

      if (npc.system.attributes.movement.burrow) {
        movementBurrowValue = `
        <div>
           <i class="fa-solid fa-shovel" style="margin-right: 5px;"></i> ${
             npc.system.attributes.movement.burrow || 0
           } ${movementUnits}.
        </div>`;
      }
      if (npc.system.attributes.movement.climb) {
        movementClimbValue = `
        <div>
           <i class="fa-sharp fa-solid fa-hand-back-fist" style="margin-right: 5px;"></i> ${
             npc.system.attributes.movement.climb || 0
           } ${movementUnits}.
        </div>`;
      }
      if (npc.system.attributes.movement.fly) {
        if (movementHover) {
          movementFlyValue = `
          <div>
             <i class="fa-brands fa-fly" style="margin-right: 5px;"></i> ${
               npc.system.attributes.movement.fly || 0
             } ${movementUnits}. (Hover)
          </div>`;
        } else {
          movementFlyValue = `
          <div>
             <i class="fa-brands fa-fly" style="margin-right: 5px;"></i> ${
               npc.system.attributes.movement.fly || 0
             } ${movementUnits}.
          </div>`;
        }
      }
      if (npc.system.attributes.movement.swim) {
        movementSwimValue = `
        <div>
           <i class="fa-solid fa-person-swimming" style="margin-right: 5px;"></i> ${
             npc.system.attributes.movement.swim || 0
           } ${movementUnits}.
        </div>`;
      }
      if (npc.system.attributes.movement.walk) {
        movementWalkValue = `
        <div>
           <i class="fas fa-shoe-prints" style="margin-right: 5px;"></i> ${
             npc.system.attributes.movement.walk || 0
           } ${movementUnits}.
        </div>`;
      }
      const detailNpcMovementDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcMovement[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const detailNpcTooltip = document.querySelector(
        `.heraldPlayerlist-npcTooltip[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      let npcTooltipWidth = 275;
      let npcTooltipheight = 175;
      let widthIncrementTooltip = 10;
      let heightIncrementTooltip = 15;

      const movementValues = [
        movementBurrowValue,
        movementClimbValue,
        movementFlyValue,
        movementSwimValue,
        movementWalkValue,
      ].filter((value) => value.trim() !== "").length;

      const widthTooltip =
        npcTooltipWidth + (movementValues - 1) * widthIncrementTooltip;
      const heightTooltip =
        npcTooltipheight + (movementValues - 1) * heightIncrementTooltip;

      if (detailNpcTooltip) {
        detailNpcTooltip.style.width = `${widthTooltip}px`;
        detailNpcTooltip.style.height = `${heightTooltip}px`;
      }

      if (detailNpcMovementDiv) {
        detailNpcMovementDiv.innerHTML = `
        <div>
        ${movementBurrowValue}
        ${movementClimbValue}
        ${movementFlyValue}
        ${movementSwimValue}
        ${movementWalkValue}
        </div>`;
      }
    }
  }
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

    //detail actor

    let acValue = actor.system.attributes.ac.value;
    let movementBurrowValue = ``;
    let movementClimbValue = ``;
    let movementFlyValue = ``;
    let movementSwimValue = ``;
    let movementWalkValue = ``;
    let movementUnits = actor.system.attributes.movement.units;
    let movementHover = actor.system.attributes.movement.hover;

    if (actor.system.attributes.movement.burrow) {
      movementBurrowValue = `
      <div>
         <i class="fa-solid fa-shovel" style="margin-right: 5px;"></i> ${
           actor.system.attributes.movement.burrow || 0
         } ${movementUnits}.
      </div>`;
    }
    if (actor.system.attributes.movement.climb) {
      movementClimbValue = `
      <div>
         <i class="fa-sharp fa-solid fa-hand-back-fist" style="margin-right: 5px;"></i> ${
           actor.system.attributes.movement.climb || 0
         } ${movementUnits}.
      </div>`;
    }
    if (actor.system.attributes.movement.fly) {
      if (movementHover) {
        movementFlyValue = `
        <div>
           <i class="fa-brands fa-fly" style="margin-right: 5px;"></i> ${
             actor.system.attributes.movement.fly || 0
           } ${movementUnits}. (Hover)
        </div>`;
      } else {
        movementFlyValue = `
        <div>
           <i class="fa-brands fa-fly" style="margin-right: 5px;"></i> ${
             actor.system.attributes.movement.fly || 0
           } ${movementUnits}.
        </div>`;
      }
    }
    if (actor.system.attributes.movement.swim) {
      movementSwimValue = `
      <div>
         <i class="fa-solid fa-person-swimming" style="margin-right: 5px;"></i> ${
           actor.system.attributes.movement.swim || 0
         } ${movementUnits}.
      </div>`;
    }
    if (actor.system.attributes.movement.walk) {
      movementWalkValue = `
      <div>
         <i class="fas fa-shoe-prints" style="margin-right: 5px;"></i> ${
           actor.system.attributes.movement.walk || 0
         } ${movementUnits}.
      </div>`;
    }
    const detailActorMovementDiv = document.querySelector(
      `.heraldPlayerlist-detailActorMovement[data-actor-id="${actor.uuid}"]`
    );

    const actorDetailTooltipDiv = document.querySelector(
      `.heraldPlayerlist-actorTooltip[data-actor-id="${actor.uuid}"]`
    );

    let actorTooltipWidth = 275;
    let actorTooltipheight = 175;
    let widthIncrementTooltip = 10;
    let heightIncrementTooltip = 15;

    const movementValues = [
      movementBurrowValue,
      movementClimbValue,
      movementFlyValue,
      movementSwimValue,
      movementWalkValue,
    ].filter((value) => value.trim() !== "").length;

    const widthTooltip =
      actorTooltipWidth + (movementValues - 1) * widthIncrementTooltip;
    const heightTooltip =
      actorTooltipheight + (movementValues - 1) * heightIncrementTooltip;

    actorDetailTooltipDiv.style.width = `${widthTooltip}px`;
    actorDetailTooltipDiv.style.height = `${heightTooltip}px`;

    if (detailActorMovementDiv) {
      detailActorMovementDiv.innerHTML = `
      <div>
      ${movementBurrowValue}
      ${movementClimbValue}
      ${movementFlyValue}
      ${movementSwimValue}
      ${movementWalkValue}
      </div>`;
    }

    let speedDcValue = actor.system.attributes.spelldc;

    const detailActorHpDiv = document.querySelector(
      `.heraldPlayerlist-detailActorHp[data-actor-id="${actor.uuid}"]`
    );
    const detailActorAcDiv = document.querySelector(
      `.heraldPlayerlist-detailActorAc[data-actor-id="${actor.uuid}"]`
    );

    const detailActorSpeedDcDiv = document.querySelector(
      `.heraldPlayerlist-detailActorSpeedDc[data-actor-id="${actor.uuid}"]`
    );

    if (detailActorAcDiv) {
      detailActorAcDiv.innerHTML = `<i class="fas fa-shield-alt" style="margin-right: 5px;"></i> ${
        acValue || 0
      } AC`;
    }

    if (detailActorSpeedDcDiv) {
      detailActorSpeedDcDiv.innerHTML = `<i class="fas fa-magic" style="margin-right: 5px;"></i> ${
        speedDcValue || 0
      } Spell Save DC`;
    }

    if (detailActorHpDiv) {
      let tempmaxhptext = "";
      if (tempmaxhp) {
        if (tempmaxhp > 0) {
          tempmaxhptext = `(+${tempmaxhp})`;
        } else {
          tempmaxhptext = `(${tempmaxhp})`;
        }
      }

      detailActorHpDiv.innerHTML = `<i class="fas fa-heart" style="margin-right: 5px;"></i>  ${hp}/${totalMaxHp} ${tempmaxhptext} HP`;
    }
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
        if (negativeHpPercent > 0) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp0} 98%)`;
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
    let activeEffect = ``;
    let disableEffect = ``;
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
      let effectDisabled = "";

      if (effect.disabled) {
        effectDisabled = `<div class="heraldplayerlist-detaileffectdisable">Disabled</div>`;
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
                  ${effectDisabled}
                </div>
              </div>
            </div>`;

      if (!effect.disabled) {
        activeEffect += `
              <div class="heraldPlayerlist-effectitem" data-effect-id="${
                effect.id
              }" data-actor-id="${actor.uuid}">
                <div class="heraldPlayerlist-effectcontainer">
                  <img src="${effect.img}" alt="${
          effect.name
        }" class="heraldPlayerlist-playerEffect" ${
          effect.disabled
            ? 'style="filter: brightness(85%); opacity: 0.7;"'
            : ""
        } />
                  ${stackDiv}
                </div>
                ${effectDetailDiv}
              </div>`;
      } else {
        disableEffect += `
              <div class="heraldPlayerlist-effectitem" data-effect-id="${
                effect.id
              }" data-actor-id="${actor.uuid}">
                <div class="heraldPlayerlist-effectcontainer">
                  <img src="${effect.img}" alt="${
          effect.name
        }" class="heraldPlayerlist-playerEffect" ${
          effect.disabled
            ? 'style="filter: brightness(85%); opacity: 0.7;"'
            : ""
        } />
                  ${stackDiv}
                </div>
                ${effectDetailDiv}
              </div>`;
      }
    });
    effectlist = activeEffect + disableEffect;
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

          if (!item.hasAttribute("data-hover-listener")) {
            item.addEventListener("mouseenter", () => {
              if (detailDiv) detailDiv.style.display = "block";
            });
            item.addEventListener("mouseleave", () => {
              if (detailDiv) detailDiv.style.display = "none";
            });
            item.setAttribute("data-hover-listener", "true");
          }

          if (!item.hasAttribute("data-contextmenu-listener")) {
            item.addEventListener("contextmenu", function (event) {
              event.preventDefault();
              const effectId = this.getAttribute("data-effect-id");
              const actorUuid = this.getAttribute("data-actor-id");
              heraldPlayerlist_deleteEffectActor(effectId, actorUuid);
            });
            item.setAttribute("data-contextmenu-listener", "true");
          }
        });
    }
  }
}

let heraldPlayerlist_dialogDeleteEffect = false;
async function heraldPlayerlist_deleteEffectActor(effectId, actorUuid) {
  if (heraldPlayerlist_dialogDeleteEffect) {
    console.log("Dialog already open, preventing duplicate.");
    return;
  }

  const actor = canvas.tokens.placeables.find(
    (token) => token.actor.uuid === actorUuid
  )?.actor;

  if (!actor) {
    console.error("Actor not found");
    ui.notifications.error("Actor not found. Please check the actor ID.");
    return;
  }

  const effectToDelete = actor.effects.find((effect) => effect.id === effectId);

  if (!effectToDelete) {
    console.error("Effect not found");
    ui.notifications.error(
      "This effect originates from an item. Please delete the item to remove this effect."
    );
    return;
  }

  heraldPlayerlist_dialogDeleteEffect = true;

  const dialog = new Dialog({
    title: "Manage Effect",
    content: `
      <p>What would you like to do with the effect <b>${effectToDelete.name}</b> on actor <b>${actor.name}</b>?</p>
    `,
    buttons: {
      disable: {
        label: "Disable",
        callback: () => {
          effectToDelete.update({ disabled: true });
          ui.notifications.info(
            `Effect "${effectToDelete.name}" has been disabled.`
          );
          heraldPlayerlist_updateEffectActor();
          heraldPlayerlist_dialogDeleteEffect = false;
        },
      },
      delete: {
        label: "Delete",
        callback: () => {
          effectToDelete.delete();
          ui.notifications.info(
            `Effect "${effectToDelete.name}" has been deleted.`
          );
          heraldPlayerlist_updateEffectActor();
          heraldPlayerlist_dialogDeleteEffect = false;
        },
      },
      cancel: {
        label: "Cancel",
        callback: () => {

          heraldPlayerlist_dialogDeleteEffect = false;
        },
      },
    },
    default: "cancel",
    close: () => {
      heraldPlayerlist_dialogDeleteEffect = false;
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
    await heraldPlayerlist_updateDetailNpc();
    heraldPlayerlist_updateHpActor();
    heraldPlayerlist_updateEffectActor();
  }
});

Hooks.on("createToken", async () => {
  await heraldPlayerlist_getListActor();
  heraldPlayerlist_getListNpc();
  heraldPlayerlist_getSettingValue();
});

Hooks.on("deleteToken", async () => {
  await heraldPlayerlist_getListActor();
  heraldPlayerlist_getListNpc();
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
  heraldPlayerlist_universalChecker,
  heraldPlayerlist_getSettingValue,
  heraldPlayerlist_universalSettingValue,
  heraldPlayerlist_colorSettingValue,
};
