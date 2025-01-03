let heraldPlayerlist_listActorCanvas = [];

let heraldPlayerlist_showPlayerlist = true;

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
              <div class="heraldPlayerlist-hpvalue" data-actor-id="${actor.uuid}"></div>
            </div>
          </div>
        </div>
        <div id="heraldPlayerlist-lowerbar" class="heraldPlayerlist-lowerbar" data-actor-id="${actor.uuid}">
         ${effectlist}
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

    const hpBar = document.querySelector(
      `.heraldPlayerlist-hpbar[data-actor-id="${actor.uuid}"]`
    );
    if (hpBar) {
      hpBar.style.width = `${hpPercent}%`;
      if (hpPercent <= 10) {
        hpBar.style.backgroundColor = "red";
      } else if (hpPercent <= 30) {
        hpBar.style.backgroundColor = "orange";
      } else if (hpPercent <= 50) {
        hpBar.style.backgroundColor = "yellow";
      } else {
        hpBar.style.backgroundColor = "green";
      }
    }
    const hpvalue = document.querySelector(
      `.heraldPlayerlist-hpvalue[data-actor-id="${actor.uuid}"]`
    );
    if (hpvalue) {
      hpvalue.innerText = hp + "/" + maxHp;
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
    const lowerbar = document.querySelector(
      `.heraldPlayerlist-lowerbar[data-actor-id="${actor.uuid}"]`
    );
    if (lowerbar) {
      lowerbar.innerHTML = effectlist;
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

function heraldPlayerlist_updateSettingValue(nameSetting, value) {
  if (nameSetting == "toggleShow") {
    heraldPlayerlist_showPlayerlist = value;

    heraldPlayerlist_createPlayerList();
  }

  if (nameSetting == "leftDistance") {
    const leftDistanceDiv = document.getElementById("heraldPlayerlist");
    if (leftDistanceDiv) {
      leftDistanceDiv.style.left = value + "vw";
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

function heraldPlayerlist_getSettingValue() {
  const toggleShow = game.settings.get(
    "herald-playerlist-beta",
    "heraldplayerlist_toggleShow"
  );
  heraldPlayerlist_updateSettingValue("toggleShow", toggleShow);

  const leftDistance = game.settings.get(
    "herald-playerlist-beta",
    "heraldplayerlist_leftDistance"
  );
  heraldPlayerlist_updateSettingValue("leftDistance", leftDistance);

  setTimeout(() => {
    const fontSize = game.settings.get(
      "herald-playerlist-beta",
      "heraldplayerlist_fontSize"
    );
    heraldPlayerlist_updateSettingValue("fontSize", fontSize);
  }, 500);

  console.log("value");
}

export {
  heraldPlayerlist_getListActor,
  heraldPlayerlist_universalChecker,
  heraldPlayerlist_getSettingValue,
  heraldPlayerlist_updateSettingValue,
};
