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
    await heraldPlayerlist_renderHtml();
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
      heraldPlayerlist_listActorCanvas.push({
        playerlistId: Math.random().toString(36).substr(2, 6),
        data: token.actor,
      });
      listActorUuid.push(token.actor.uuid);
    }
  }
  heraldPlayerlist_listActorCanvas.sort((a, b) =>
    a.data.name.localeCompare(b.data.name)
  );
  await canvas.scene.setFlag("world", "heraldPlayerlist", {
    show: true,
    listActorUuid: listActorUuid,
  });
  await heraldPlayerlist_createPlayerList();
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

Hooks.on("createToken", async (token) => {
  await heraldPlayerlist_getListActor();
  await heraldPlayerlist_getListNpc();
  await heraldPlayerlist_getSettingValue();
});

Hooks.on("deleteToken", async (token) => {
  await heraldPlayerlist_getListActor();
  await heraldPlayerlist_getListNpc();
  await heraldPlayerlist_getSettingValue();
});

let heraldPlayerlist_rendered = false;
async function heraldPlayerlist_toggleShowPlayerlist() {
  if (heraldPlayerlist_rendered) {
    return;
  }
  if (heraldPlayerlist_showPlayerlist == true) {
    heraldPlayerlist_rendered = true;
    setTimeout(async () => {
      heraldPlayerlist_getListActor();
      heraldPlayerlist_getListNpc();
      await heraldPlayerlist_getSettingValue();
    }, 1000);
  } else {
    const existingBar = document.getElementById("heraldPlayerlist");
    if (existingBar) {
      heraldPlayerlist_rendered = false;
      existingBar.remove();
    }
  }
}

async function heraldPlayerlist_renderHtml() {
  try {
    const response = await fetch(
      "/modules/herald-playerlist-beta/templates/herald-playerlist.html"
    );
    const html = await response.text();

    const div = document.createElement("div");
    div.innerHTML = html;
    const playerlist = div.firstChild;
    playerlist.id = "heraldPlayerlist";

    // await heraldPlayerlist_createCollapseActor(playerlist);
    // await heraldPlayerlist_createHtmlPlayerlist(playerlist);
    document.body.appendChild(playerlist);
  } catch (err) {
    console.error("Failed to load template herald-playerlist.html:", err);
  }
}
let collapseActorCreated = false;
let HtmlPlayerlistCreated = false;
async function heraldPlayerlist_createPlayerList() {
  try {
    const playerlist = document.getElementById("heraldPlayerlist");
    if (!playerlist) {
      console.error(
        "Playerlist HTML not found. Please call heraldPlayerlist_renderHtml first."
      );
      return;
    }
    if (!collapseActorCreated) {
      await heraldPlayerlist_createCollapseActor(playerlist);
      collapseActorCreated = true;
    }
    if (!HtmlPlayerlistCreated) {
      await heraldPlayerlist_createHtmlPlayerlist(playerlist);
      HtmlPlayerlistCreated = true;
    }

    await heraldPlayerlist_renderlistPlayer();
  } catch (err) {
    console.error("Failed to create player list:", err);
  }
}

async function heraldPlayerlist_createHtmlPlayerlist(playerlist) {
  const containerDiv = document.createElement("div");
  containerDiv.id = "heraldPlayerlist-container";
  containerDiv.classList.add("heraldPlayerlist-container");

  const listPlayerDiv = document.createElement("div");
  listPlayerDiv.id = "heraldPlayerlist-listPlayer";
  listPlayerDiv.classList.add("heraldPlayerlist-listPlayer");

  containerDiv.appendChild(listPlayerDiv);
  playerlist.appendChild(containerDiv);
}
async function heraldPlayerlist_createCollapseActor(playerlist) {
  heraldPlayerlist_listActorCanvas.sort((a, b) =>
    a.data.name.localeCompare(b.data.name)
  );
  const user = game.user;
  let ownerActor = false;
  for (let actor of heraldPlayerlist_listActorCanvas) {
    if (actor.data.ownership[user.id]) {
      if (actor.data.ownership[user.id] == 3) {
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
  collapseButton.innerHTML =
    '<i class="fa-solid fa-caret-down" style="margin-left:2px;"></i>';

  const collapseButtonNpc = document.createElement("button");
  collapseButtonNpc.id = "heraldPlayerlist-collapseButtonNpc";
  collapseButtonNpc.classList.add("heraldPlayerlist-collapseButtonNpc");
  collapseButtonNpc.innerHTML =
    '<i class="fa-solid fa-users-viewfinder" style=""></i>';

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
    collapseButtonNpc.innerHTML = `<i class="fa-solid fa-users-viewfinder" style=""></i>`;
    heraldPlayerlist_renderButtonCollapseNpc();
  } else {
    heraldPlayerlist_renderCollapseNpclist();
    heraldPlayerlist_showCollapseNpc = true;
    collapseButtonNpc.innerHTML = `<i class="fa-solid fa-expand"></i>`;
  }
}

let heraldPlayerlist_showCollapse = false;
async function heraldPlayerlist_toggleCollapse() {
  const collapseButton = document.getElementById(
    "heraldPlayerlist-collapseButton"
  );

  if (heraldPlayerlist_showCollapse) {
    await heraldPlayerlist_renderlistPlayer();
    heraldPlayerlist_showCollapse = false;
    collapseButton.style.marginBottom = "5px";
    collapseButton.innerHTML =
      '<i class="fa-solid fa-caret-down" style="margin-left:2px;"></i>';

    heraldPlayerlist_getSettingActor();
  } else {
    heraldPlayerlist_renderCollapselist();
    heraldPlayerlist_showCollapse = true;
    collapseButton.style.marginBottom = "0";

    collapseButton.innerHTML =
      '<i class="fa-solid fa-caret-up" style="margin-left:2px;"></i>';
  }
}

function heraldPlayerlist_getSettingActor() {
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
                <img src="${actor.data.img}" alt="Image" class="heraldPlayerlist-actorImageCollapse" />
            </div>
          </div>
      </div>
       
    </div>`;
  }
  divListPlayer.innerHTML = listPLayer;
}
async function heraldPlayerlist_renderlistPlayer() {
  let listPLayer = ``;
  let divListPlayer = document.getElementById("heraldPlayerlist-listPlayer");
  const heraldPlayerlist = canvas.scene.getFlag("world", "heraldPlayerlist");
  heraldPlayerlist_listActorCanvas.sort((a, b) =>
    a.data.name.localeCompare(b.data.name)
  );
  for (let actor of heraldPlayerlist_listActorCanvas) {
    let arrClassActor = [];
    for (let item of actor.data.items) {
      if (item.type === "class") {
        arrClassActor.push(item.name);
      }
    }
    let classActorValue = arrClassActor.join("/");
    const actorTooltip = `
    <div class="heraldPlayerlist-actorTooltip" data-playerlist-id="${
      actor.playerlistId
    }" data-actor-id="${actor.data.uuid}" style="display: none;">
        <h3>${actor.data.name}</h3>
        <div class="heraldPlayerlist-actorStatusTop">
          <div class="heraldPlayerlist-actorStatusLeft">
              <div class="heraldPlayerlist-detailActorHp" data-playerlist-id="${
                actor.playerlistId
              }" data-actor-id="${actor.data.uuid}"></div>
            <div class="heraldPlayerlist-detailActorAc"  data-playerlist-id="${
              actor.playerlistId
            }" data-actor-id="${actor.data.uuid}"></div>
            <div class="heraldPlayerlist-detailActorMovement"  data-playerlist-id="${
              actor.playerlistId
            }" data-actor-id="${actor.data.uuid}"></div>
            <div class="heraldPlayerlist-detailActorSpeedDc" data-playerlist-id="${
              actor.playerlistId
            }" data-actor-id="${actor.data.uuid}"></div>
          </div>
          <div class="heraldPlayerlist-actorStatusRight">
            <div class="heraldPlayerlist-detailActorPrc" data-playerlist-id="${
              actor.playerlistId
            }" data-actor-id="${actor.data.uuid}"></div>
            <div class="heraldPlayerlist-detailActorInv" data-playerlist-id="${
              actor.playerlistId
            }" data-actor-id="${actor.data.uuid}"></div>
            <div class="heraldPlayerlist-detailActorIns" data-playerlist-id="${
              actor.playerlistId
            }" data-actor-id="${actor.data.uuid}"></div>
          </div>
        </div>
        <div class="heraldPlayerlist-actorStatusBottom">
          <div class="heraldPlayerlist-detailActorInspiration" data-playerlist-id="${
            actor.playerlistId
          }" data-actor-id="${actor.data.uuid}"></div>
          <div class="heraldPlayerlist-actorDetailStatusBottom">
            <div>Level ${actor.data.system.details?.level || "Unknown"}</div>
            <div> ${classActorValue || "Unknown"}</div>
            <div> - </div>
            <div>
              <div> ${actor.data.system.details?.race || "Unknown"}</div>
            </div>
          </div>
        </div>
    </div>`;

    listPLayer += `
    <div id="heraldPlayerlist-playerActor" class="heraldPlayerlist-playerActor">
      <div id="heraldPlayerlist-playerListContainer" class="heraldPlayerlist-playerListContainer">
        <div id="heraldPlayerlist-playerContainer" class="heraldPlayerlist-playerContainer">
          <div id="heraldPlayerlist-leftContainer" class="heraldPlayerlist-leftContainer">
            <div class="heraldPlayerlist-actorImageContainer" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
              <div class="heraldPlayerlist-actorImageDiv" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
                <img src="${actor.data.img}" alt="Image" class="heraldPlayerlist-actorImage" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" />
                  ${actorTooltip}
              </div>
            </div>
          </div>
          <div id="heraldPlayerlist-rightContainer" class="heraldPlayerlist-rightContainer">
            <div id="heraldPlayerlist-tokenname" class="heraldPlayerlist-tokenname">
              ${actor.data.name}
            </div>
            <div id="heraldPlayerlist-hpbarContainer" class="heraldPlayerlist-hpbarContainer">
              <div class="heraldPlayerlist-hpbarBackground" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
                <div class="heraldPlayerlist-hpbar" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
                <div class="heraldPlayerlist-tempbartop" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
                <div class="heraldPlayerlist-tempbarbottom" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
                <div class="heraldPlayerlist-tempvalue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
                <div class="heraldPlayerlist-hpattributesvalue">
                  <div class="heraldPlayerlist-hpvalue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
                  <div class="heraldPlayerlist-tempmaxhp" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="heraldPlayerlist-lowerbar" class="heraldPlayerlist-lowerbar" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
          <div class="heraldPlayerlist-armorclass" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
            <img src="/modules/herald-playerlist-beta/assets/armor_class.webp" alt="Armor Class" class="heraldPlayerlist-armorclassimage" />
            <div class="heraldPlayerlist-armorclassvalue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
          </div>
          <div class="heraldPlayerlist-tempshield" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
          <div id="heraldPlayerlist-listeffect" class="heraldPlayerlist-listeffect" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}"></div>
        </div>
      </div>
      <div id="heraldPlayerlist-npcContainer" class="heraldPlayerlist-npcContainer" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
        <div id="heraldPlayerlist-npcButtonCollapseActor" class="heraldPlayerlist-npcButtonCollapseActor" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
        
        </div>
        <div id="heraldPlayerlist-npclist" class="heraldPlayerlist-npclist" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}">
        </div>
      </div>
     
    </div>`;
  }

  divListPlayer.innerHTML = listPLayer;
  document
    .querySelectorAll(".heraldPlayerlist-actorImageContainer")
    .forEach((container) => {
      const image = container.querySelector(".heraldPlayerlist-actorImage");
      const tooltip = container.querySelector(".heraldPlayerlist-actorTooltip");

      container.addEventListener("mouseenter", () => {
        if (tooltip) tooltip.style.display = "block";
      });

      container.addEventListener("mouseleave", () => {
        if (tooltip) tooltip.style.display = "none";
      });
      container.addEventListener("dblclick", async (event) => {
        const actorId = container.getAttribute("data-actor-id");

        const token = await fromUuid(actorId);

        if (token) {
          token.sheet.render(true);
        } else {
          console.warn("Token not found on the current scene.");
        }
      });
      container.addEventListener("click", async (event) => {
        const actorId = container.getAttribute("data-actor-id");
        const actor = await fromUuid(actorId);
        if (actor) {
          const token = canvas.tokens.placeables.find(
            (t) => t.actor?.id === actor.id
          );

          if (token) {
            token.control({ releaseOthers: true });
            canvas.pan({ x: token.x, y: token.y });
          }
        }
      });
    });
  await heraldPlayerlist_updateHpActor();
  await heraldPlayerlist_updateEffectActor();
  await heraldPlayerlist_renderNpclist();
  heraldPlayerlist_renderButtonCollapseNpc();
}

function heraldPlayerlist_renderButtonCollapseNpc() {
  const playerList = game.users.filter(
    (user) => user.role === CONST.USER_ROLES.PLAYER
  );

  for (let actor of heraldPlayerlist_listActorCanvas) {
    const npcCollapseButtonActor = document.querySelector(
      `.heraldPlayerlist-npcButtonCollapseActor[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    let npcFound = false;
    for (let user of playerList) {
      if (actor.data.ownership[user.id] == 3) {
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
        collapseNpclistButton.innerHTML = `<i class="fa-solid fa-xmark" style="margin-left:3px;"></i>`;

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
    `.heraldPlayerlist-npclist[data-playerlist-id="${actor.playerlistId}"][data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
  );

  if (npcListDiv.innerHTML.trim() === "") {
    heraldPlayerlist_renderNpclistSingleActor(actor);
  } else {
    npcListDiv.innerHTML = "";
  }
}

async function heraldPlayerlist_renderNpclistSingleActor(actor) {
  const playerList = game.users.filter(
    (user) => user.role === CONST.USER_ROLES.PLAYER
  );
  const npclistDiv = document.querySelector(
    `.heraldPlayerlist-npclist[data-playerlist-id="${actor.playerlistId}"][data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
  );
  let npcActorView = ``;
  for (let user of playerList) {
    if (actor.data.ownership[user.id] == 3) {
      for (let npc of heraldPlayerlist_listNpcCanvas) {
        if (npc.ownership[user.id] == 3) {
          const npcTooltip = `
          <div class="heraldPlayerlist-npcTooltip" data-playerlist-id="${
            actor.playerlistId
          }" data-actor-id="${actor.data.uuid}" data-npc-id="${
            npc.uuid
          }" style="display: none;">
              <h3>${npc.name}</h3>
              <div class="heraldPlayerlist-npcStatus">
                <div class="heraldPlayerlist-npcStatusLeft">
                  <div class="heraldPlayerlist-detailNpcHp" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
            npc.uuid
          }"></div>
                  <div class="heraldPlayerlist-detailNpcAc" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
            npc.uuid
          }"></div>
                  <div class="heraldPlayerlist-detailNpcMovement" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
            npc.uuid
          }"></div>
                </div>
                <div class="heraldPlayerlist-npcStatusRight">
                 <div class="heraldPlayerlist-detailNpcPrc" data-playerlist-id="${
                   actor.playerlistId
                 }" data-actor-id="${actor.data.uuid}" data-npc-id="${
            npc.uuid
          }"></div>
                  <div class="heraldPlayerlist-detailNpcInv" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
            npc.uuid
          }"></div>
                  <div class="heraldPlayerlist-detailNpcIns" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
            npc.uuid
          }"></div>
                </div>
              </div>
              <div class="heraldPlayerlist-npcStatus2">
                <div class="heraldPlayerlist-npcLevel">
                  <div>CR ${npc.system.details?.cr || "Unknown"}</div>
                  <div> - </div>
                  <div> ${
                    npc.system.details?.type.value
                      ? npc.system.details.type.value.charAt(0).toUpperCase() +
                        npc.system.details.type.value.slice(1)
                      : "Unknown"
                  }</div>
                   <div> ${
                     npc.system.details?.type?.subtype
                       ? `(${npc.system.details.type.subtype})`
                       : ""
                   } </div>
                </div>
              </div>
          </div>`;
          npcActorView += `
          <div class="heraldPlayerlist-npc">
            <div>
              <div id="heraldPlayerlist-npcbar" class="heraldPlayerlist-npcbar">
                  <svg width="50" height="50" viewBox="0 0 100 100" class="heraldPlayerlist-npchpcontainer">
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbackground" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbackground" stroke-dasharray="300" stroke-dashoffset="200" />
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbar" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbar" stroke-dasharray="300" stroke-dashoffset="200" />
                  </svg>
              </div>
              <div class="heraldPlayerlist-npcBarBorderContainer" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}">
                  
              </div>
            </div>
            <div class="heraldPlayerlist-npcWrapper">
                <div class="heraldPlayerlist-npcImageContainer" data-npc-id="${npc.uuid}">
                  <img src="${npc.img}" alt="npc" class="heraldPlayerlist-npcimageview">
                </div>
                ${npcTooltip}
             
              </div>
            <div id="heraldPlayelist-npceffectlist"></div>
            <div id="heraldPlayerlist-npcdetails" class="heraldPlayerlist-npcdetails">
              <div class="heraldPlayerlist-npcACContainer" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}">
                  <img src="/modules/herald-playerlist-beta/assets/armor_class.webp" alt="Armor Class" class="heraldPlayerlist-npcACImage" />
                  <div class="heraldPlayerlist-npcACValue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
              </div>
              <div class="heraldPlayerlist-npchpvalue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
              <div class="heraldPlayerlist-npctempvalue"  data-playerlist-id="${actor.playerlistId}"data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
              <div class="heraldPlayerlist-npctempshield" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
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

        imageContainer.addEventListener("dblclick", async (event) => {
          const npcUuid = imageContainer.getAttribute("data-npc-id"); // Ensure this is the correct UUID

          const token = await fromUuid(npcUuid);

          if (token) {
            token.sheet.render(true);
          } else {
            console.warn("Token not found on the current scene.");
          }
        });

        imageContainer.addEventListener("click", async (event) => {
          const npcUuid = imageContainer.getAttribute("data-npc-id"); // Ensure this is the correct UUID

          const token = await fromUuid(npcUuid);

          if (token) {
            token.control({ releaseOthers: true });
            canvas.pan({ x: token.x, y: token.y });
          }
        });
      });
  }
  await heraldPlayerlist_updateDetailNpc();
}

function heraldPlayerlist_renderCollapseNpclist() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    const npclistDiv = document.querySelector(
      `.heraldPlayerlist-npclist[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const npcCollapseButtonDiv = document.querySelector(
      `.heraldPlayerlist-npcButtonCollapseActor[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
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
      `.heraldPlayerlist-npclist[data-actor-id="${actor.data.uuid}"]`
    );
    let npcActorView = ``;
    for (let user of playerList) {
      if (actor.data.ownership[user.id] == 3) {
        for (let npc of heraldPlayerlist_listNpcCanvas) {
          if (npc.ownership[user.id] == 3) {
            const npcTooltip = `
            <div class="heraldPlayerlist-npcTooltip" data-playerlist-id="${
              actor.playerlistId
            }" data-actor-id="${actor.data.uuid}" data-npc-id="${
              npc.uuid
            }" style="display: none;">
                <h3>${npc.name}</h3>
               <div class="heraldPlayerlist-npcStatus">
                <div class="heraldPlayerlist-npcStatusLeft">
                  <div class="heraldPlayerlist-detailNpcHp" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
              npc.uuid
            }"></div>
                  <div class="heraldPlayerlist-detailNpcAc" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
              npc.uuid
            }"></div>
                  <div class="heraldPlayerlist-detailNpcMovement" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
              npc.uuid
            }"></div>
                </div>
                <div class="heraldPlayerlist-npcStatusRight">
                 <div class="heraldPlayerlist-detailNpcPrc" data-playerlist-id="${
                   actor.playerlistId
                 }" data-actor-id="${actor.data.uuid}" data-npc-id="${
              npc.uuid
            }"></div>
                  <div class="heraldPlayerlist-detailNpcInv" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
              npc.uuid
            }"></div>
                  <div class="heraldPlayerlist-detailNpcIns" data-playerlist-id="${
                    actor.playerlistId
                  }" data-actor-id="${actor.data.uuid}" data-npc-id="${
              npc.uuid
            }"></div>
                </div>
              </div>

                <div class="heraldPlayerlist-npcStatus2">
                  <div class="heraldPlayerlist-npcLevel">
                    <div>CR ${npc.system.details?.cr || "Unknown"}</div>
                    <div> - </div>
                    <div> ${
                      npc.system.details?.type.value
                        ? npc.system.details.type.value
                            .charAt(0)
                            .toUpperCase() +
                          npc.system.details.type.value.slice(1)
                        : "Unknown"
                    }</div>
                    <div> ${
                      npc.system.details?.type?.subtype
                        ? `(${npc.system.details.type.subtype})`
                        : ""
                    } </div>
                  </div>
                </div>
            </div>`;
            npcActorView += `
            <div class="heraldPlayerlist-npc">
              <div>
                <div id="heraldPlayerlist-npcbar" class="heraldPlayerlist-npcbar">
                  <svg width="50" height="50" viewBox="0 0 100 100" class="heraldPlayerlist-npchpcontainer">
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbackground" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbackground" stroke-dasharray="300" stroke-dashoffset="200" />
                    <circle cx="50" cy="50" r="45" id="heraldPlayerlist-npchpbar" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}" class="heraldPlayerlist-npchpbar" stroke-dasharray="300" stroke-dashoffset="200" />
                  </svg>
                </div>
                <div class="heraldPlayerlist-npcBarBorderContainer" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
              </div>
              <div class="heraldPlayerlist-npcWrapper">
                <div class="heraldPlayerlist-npcImageContainer" data-npc-id="${npc.uuid}">
                  <img src="${npc.img}" alt="npc" class="heraldPlayerlist-npcimageview">
                </div>
                ${npcTooltip}
             
              </div>
              <div id="heraldPlayelist-npceffectlist"></div>
              <div id="heraldPlayerlist-npcdetails" class="heraldPlayerlist-npcdetails">
                <div class="heraldPlayerlist-npcACContainer" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}">
                    <div class="heraldPlayerlist-npcACValue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
                    <img src="/modules/herald-playerlist-beta/assets/armor_class.webp" alt="Armor Class" class="heraldPlayerlist-npcACImage" />  
                </div>
                <div class="heraldPlayerlist-npchpvalue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
                <div class="heraldPlayerlist-npctempvalue" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
                <div class="heraldPlayerlist-npctempshield" data-playerlist-id="${actor.playerlistId}" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}"></div>
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
          imageContainer.addEventListener("dblclick", async (event) => {
            const npcUuid = imageContainer.getAttribute("data-npc-id"); // Ensure this is the correct UUID

            const token = await fromUuid(npcUuid);

            if (token) {
              token.sheet.render(true);
            } else {
              console.warn("Token not found on the current scene.");
            }
          });
        });
    }
  }
  await heraldPlayerlist_updateDetailNpc();
}

async function heraldPlayerlist_updateDetailNpc() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    for (let npc of heraldPlayerlist_listNpcCanvas) {
      const hp = npc.system.attributes.hp.value;
      const maxHp = npc.system.attributes.hp.max;
      let tempHp = npc.system.attributes.hp.temp || 0;

      const tempmaxhp = npc.system.attributes.hp.tempmax || 0;

      const totalMaxHp = maxHp + tempmaxhp;
      const hpPercent = (hp / totalMaxHp) * 100;
      const tempPercent = (tempHp / totalMaxHp) * 100;

      if (tempHp > totalMaxHp) {
        tempHp = totalMaxHp;
        npc.update({
          "system.attributes.hp.temp": totalMaxHp,
        });
      }

      let acValue = npc.system.attributes.ac.value;

      const npcHpBarCircle = document.querySelector(
        `.heraldPlayerlist-npchpbar[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcHpValueDiv = document.querySelector(
        `.heraldPlayerlist-npchpvalue[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcACValueDiv = document.querySelector(
        `.heraldPlayerlist-npcACValue[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcTempHpValueDiv = document.querySelector(
        `.heraldPlayerlist-npctempvalue[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcTempBarDiv = document.querySelector(
        `.heraldPlayerlist-npcBarBorderContainer[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const npcTempShieldDiv = document.querySelector(
        `.heraldPlayerlist-npctempshield[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
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
                <circle cx="50" cy="50" r="45" class="heraldPlayerlist-npcBorderTop" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}" stroke-dasharray="300" stroke-dashoffset="200" />
              </svg>
            </div>
            <div class="heraldPlayerlist-npcBarBorderBottom">
              <svg width="42" height="42" viewBox="0 0 100 100" class="heraldPlayerlist-npchpcontainer">
                <circle cx="50" cy="50" r="45" class="heraldPlayerlist-npcBorderBottom" data-actor-id="${actor.data.uuid}" data-npc-id="${npc.uuid}" stroke-dasharray="300" stroke-dashoffset="200" />
              </svg>
            </div>`;
        }

        const npcTempBarTopDiv = document.querySelector(
          `.heraldPlayerlist-npcBorderTop[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
        );

        const npcTempBarBottomDiv = document.querySelector(
          `.heraldPlayerlist-npcBorderBottom[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
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

      let speedDcValue = actor.data.system.attributes.spelldc;

      const detailNpcHpDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcHp[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );
      const detailNpcAcDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcAc[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const detailNpcSpeedDcDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcSpeedDc[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
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
          <i class="fa-solid fa-hill-rockslide" style="margin-right: 5px;"></i> ${
            npc.system.attributes.movement.climb || 0
          } ${movementUnits}.
        </div>`;
      }
      if (npc.system.attributes.movement.fly) {
        if (movementHover) {
          movementFlyValue = `
          <div>
             <i class="fa-solid fa-dove" style="margin-right: 5px;"></i> ${
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
        `.heraldPlayerlist-detailNpcMovement[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const detailNpcTooltip = document.querySelector(
        `.heraldPlayerlist-npcTooltip[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
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

      const detailNpcPerceptionDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcPrc[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      const detailNpcInvestigationDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcInv[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );
      const detailNpcInsightDiv = document.querySelector(
        `.heraldPlayerlist-detailNpcIns[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"][data-npc-id="${npc.uuid}"]`
      );

      let perceptionValue = npc.system.skills.prc.passive;
      let investigationValue = npc.system.skills.inv.passive;
      let insightValue = npc.system.skills.ins.passive;

      if (detailNpcPerceptionDiv) {
        detailNpcPerceptionDiv.innerHTML = `<i class="fa-solid fa-eye" style="margin-right: 5px;"></i> ${
          perceptionValue || 0
        }`;
      }
      if (detailNpcInvestigationDiv) {
        detailNpcInvestigationDiv.innerHTML = `<i class="fa-solid fa-magnifying-glass" style="margin-right: 5px;"></i> ${
          investigationValue || 0
        }`;
      }

      if (detailNpcInsightDiv) {
        detailNpcInsightDiv.innerHTML = `<i class="fa-solid fa-brain" style="margin-right: 5px;"></i> ${
          insightValue || 0
        } `;
      }
    }
  }
}

async function heraldPlayerlist_updateHpActor() {
  for (let actor of heraldPlayerlist_listActorCanvas) {
    const hp = actor.data.system.attributes.hp.value;
    const maxHp = actor.data.system.attributes.hp.max;
    const tempHp = actor.data.system.attributes.hp.temp || 0;

    const tempmaxhp = actor.data.system.attributes.hp.tempmax;
    const totalMaxHp = maxHp + tempmaxhp;
    const hpPercent = (hp / totalMaxHp) * 100;

    let tempPercentage = (tempHp / maxHp) * 100;
    if (tempPercentage > 100) {
      tempPercentage = 100;
    }
    const hpvalue = document.querySelector(
      `.heraldPlayerlist-hpvalue[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const hpBar = document.querySelector(
      `.heraldPlayerlist-hpbar[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    const tempHpBarTop = document.querySelector(
      `.heraldPlayerlist-tempbartop[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const tempHpBarBottom = document.querySelector(
      `.heraldPlayerlist-tempbarbottom[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const tempValue = document.querySelector(
      `.heraldPlayerlist-tempvalue[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const tempShield = document.querySelector(
      `.heraldPlayerlist-tempshield[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const tempMaxHpDiv = document.querySelector(
      `.heraldPlayerlist-tempmaxhp[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    const armorClassDiv = document.querySelector(
      `.heraldPlayerlist-armorclassvalue[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    //detail actor

    let acValue = actor.data.system.attributes.ac.value;
    let movementBurrowValue = ``;
    let movementClimbValue = ``;
    let movementFlyValue = ``;
    let movementSwimValue = ``;
    let movementWalkValue = ``;
    let movementUnits = actor.data.system.attributes.movement.units;
    let movementHover = actor.data.system.attributes.movement.hover;

    if (actor.data.system.attributes.movement.burrow) {
      movementBurrowValue = `
      <div>
         <i class="fa-solid fa-shovel" style="margin-right: 5px;"></i> ${
           actor.data.system.attributes.movement.burrow || 0
         } ${movementUnits}.
      </div>`;
    }
    if (actor.data.system.attributes.movement.climb) {
      movementClimbValue = `
      <div>
        <i class="fa-solid fa-hill-rockslide" style="margin-right: 5px;"></i> ${
          actor.data.system.attributes.movement.climb || 0
        } ${movementUnits}.
      </div>`;
    }
    if (actor.data.system.attributes.movement.fly) {
      if (movementHover) {
        movementFlyValue = `
        <div>
           <i class="fa-solid fa-dove" style="margin-right: 5px;"></i> ${
             actor.data.system.attributes.movement.fly || 0
           } ${movementUnits}. (Hover)
        </div>`;
      } else {
        movementFlyValue = `
        <div>
           <i class="fa-brands fa-fly" style="margin-right: 5px;"></i> ${
             actor.data.system.attributes.movement.fly || 0
           } ${movementUnits}.
        </div>`;
      }
    }
    if (actor.data.system.attributes.movement.swim) {
      movementSwimValue = `
      <div>
         <i class="fa-solid fa-person-swimming" style="margin-right: 5px;"></i> ${
           actor.data.system.attributes.movement.swim || 0
         } ${movementUnits}.
      </div>`;
    }
    if (actor.data.system.attributes.movement.walk) {
      movementWalkValue = `
      <div>
         <i class="fas fa-shoe-prints" style="margin-right: 5px;"></i> ${
           actor.data.system.attributes.movement.walk || 0
         } ${movementUnits}.
      </div>`;
    }
    const detailActorMovementDiv = document.querySelector(
      `.heraldPlayerlist-detailActorMovement[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    const actorDetailTooltipDiv = document.querySelector(
      `.heraldPlayerlist-actorTooltip[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    let actorTooltipWidth = 300;
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

    if (actorDetailTooltipDiv) {
      actorDetailTooltipDiv.style.width = `${widthTooltip}px`;
      actorDetailTooltipDiv.style.height = `${heightTooltip}px`;
    }

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

    let speedDcValue = actor.data.system.attributes.spelldc;

    const detailActorHpDiv = document.querySelector(
      `.heraldPlayerlist-detailActorHp[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const detailActorAcDiv = document.querySelector(
      `.heraldPlayerlist-detailActorAc[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    const detailActorSpeedDcDiv = document.querySelector(
      `.heraldPlayerlist-detailActorSpeedDc[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
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

    const detailActorPerceptionDiv = document.querySelector(
      `.heraldPlayerlist-detailActorPrc[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    const detailActorInvestigationDiv = document.querySelector(
      `.heraldPlayerlist-detailActorInv[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );
    const detailActorInsightDiv = document.querySelector(
      `.heraldPlayerlist-detailActorIns[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    const detailActorInspirationDiv = document.querySelector(
      `.heraldPlayerlist-detailActorInspiration[data-playerlist-id="${actor.playerlistId}"][data-actor-id="${actor.data.uuid}"]`
    );

    let inspirationValue = actor.data.system.attributes.inspiration;
    let perceptionValue = actor.data.system.skills.prc.passive;
    let investigationValue = actor.data.system.skills.inv.passive;
    let insightValue = actor.data.system.skills.ins.passive;

    if (detailActorInspirationDiv) {
      if (inspirationValue) {
        detailActorInspirationDiv.innerHTML = `<i class="fa-brands fa-phoenix-squadron" style="font-size: 24px; color: orange;"></i>`;
      } else {
        detailActorInspirationDiv.innerHTML = ``;
      }
    }

    if (detailActorPerceptionDiv) {
      detailActorPerceptionDiv.innerHTML = `<i class="fa-solid fa-eye" style="margin-right: 5px;"></i> ${
        perceptionValue || 0
      }`;
    }
    if (detailActorInvestigationDiv) {
      detailActorInvestigationDiv.innerHTML = `<i class="fa-solid fa-magnifying-glass" style="margin-right: 5px;"></i> ${
        investigationValue || 0
      }`;
    }

    if (detailActorInsightDiv) {
      detailActorInsightDiv.innerHTML = `<i class="fa-solid fa-brain" style="margin-right: 5px;"></i> ${
        insightValue || 0
      } `;
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

          await actor.data.update({
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
    if (tempHp && tempHp > 0) {
      if (tempHpBarTop) tempHpBarTop.style.width = `${tempPercentage}%`;
      if (tempHpBarBottom) tempHpBarBottom.style.width = `${tempPercentage}%`;
      if (tempValue) tempValue.innerText = `+${tempHp}`;
      if (tempShield) {
        tempShield.innerHTML = `<img src="/modules/herald-playerlist-beta/assets/temp_shield.png" alt="shield" class="heraldPlayerlist-imgtempshield" />`;
      }

      if (tempPercentage < 10) {
        const adjustedWidth = tempPercentage + 8;
        if (tempHpBarTop) tempHpBarTop.style.width = `${adjustedWidth}%`;
        if (tempHpBarBottom) tempHpBarBottom.style.width = `${adjustedWidth}%`;
      }
    } else {
      if (tempHpBarTop) tempHpBarTop.style.width = "";
      if (tempHpBarBottom) tempHpBarBottom.style.width = "";
      if (tempValue) tempValue.innerText = "";
      if (tempShield) tempShield.innerHTML = "";
    }

    if (armorClassDiv) {
      const acValue = actor.data.system.attributes.ac.value;
      armorClassDiv.innerText = acValue;
    }
  }
}

async function heraldPlayerlist_updateEffectActor() {
  heraldPlayerlist_listActorCanvas = [];
  const tokens = canvas.tokens.placeables;
  for (let token of tokens) {
    if (token.actor.type == "character") {
      heraldPlayerlist_listActorCanvas.push({
        playerlistId: Math.random().toString(36).substr(2, 6),
        data: token.actor,
      });
    }
  }
  for (let actor of heraldPlayerlist_listActorCanvas) {
    let effectlist = ``;
    let arrEffect = [];
    for (let effect of actor.data.effects) {
     
      arrEffect.push(effect);
    }
    for (let item of actor.data.items) {
      if (item.effects) {
        for (let effect of item.effects) {
          arrEffect.push(effect);
        }
      }
    }
    let activeEffect = ``;
    let disableEffect = ``;
    arrEffect.forEach((effect) => {
      if (effect.target !== actor.data) {
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
              }" data-actor-id="${actor.data.uuid}">
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
              }" data-actor-id="${actor.data.uuid}">
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
      `.heraldPlayerlist-listeffect[data-actor-id="${actor.data.uuid}"]`
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

  const arrEffect = [];

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

  const effectToDelete = arrEffect.find((effect) => effect.id === effectId);

  if (!effectToDelete) {
    console.error("Effect not found");
    ui.notifications.error(
      "This effect originates from an item. Please delete the item to remove this effect."
    );
    return;
  }

  heraldPlayerlist_dialogDeleteEffect = true;

  const isDisabled = effectToDelete.disabled;
  const isTemporary = effectToDelete.isTemporary;

  const dialogContent = `
    <p>What would you like to do with the effect <b>${effectToDelete.name}</b> on actor <b>${actor.name}</b>?</p>
  `;

  const buttons = {};

  if (isTemporary) {
    buttons.delete = {
      label: "Delete",
      callback: () => {
        effectToDelete.delete();
        ui.notifications.info(
          `Effect "${effectToDelete.name}" has been deleted.`
        );
        heraldPlayerlist_updateEffectActor();
        heraldPlayerlist_dialogDeleteEffect = false;
      },
    };
  }

  buttons.disableEnable = {
    label: isDisabled ? "Enable" : "Disable",
    callback: () => {
      effectToDelete.update({ disabled: !isDisabled });
      const action = isDisabled ? "enabled" : "disabled";
      ui.notifications.info(
        `Effect "${effectToDelete.name}" has been ${action}.`
      );
      heraldPlayerlist_updateEffectActor();
      heraldPlayerlist_dialogDeleteEffect = false;
    },
  };

  buttons.cancel = {
    label: "Cancel",
    callback: () => {
      heraldPlayerlist_dialogDeleteEffect = false;
    },
  };

  const dialog = new Dialog({
    title: "Manage Effect",
    content: dialogContent,
    buttons: buttons,
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

async function heraldPlayerlist_getSettingValue() {
  // const toggleShow = game.settings.get(
  //   "herald-playerlist-beta",
  //   "heraldplayerlist_toggleShow"
  // );
  // heraldPlayerlist_universalSettingValue("toggleShow", toggleShow);

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
