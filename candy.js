
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie(cname) {
  return getCookie(cname) !== "";
}



const COOKIE_NAME = "sweetPixelGarden";
const WITHER_PER_HOUR = 4;


const FLOWER_SPRITES = [
  "images/flower1.png",
  "images/flower2.png",
  "images/flower3.png",
  "images/flower4.png",
];


const PLANT_TYPES = [
  {
    type: "macha",
    stages: [
      "images/seed1.png",    
      "images/growing seed2.png",  
      "images/macha1.png",     
      "images/macha.png"     
    ]
  },
  {
    type: "bushy",
    stages: [
      "images/seed2.png",
      "images/growing seed1.png",
      "images/bushy.png",
      "images/bushy.png"

    ]
  },
  {
    type: "pop",
    stages: [

      "images/pop1.png",
      "images/pop2.png",
      "images/pop3.png",
      "images/candz.png"
    ]
  },

   {
    type: "mush",
    stages: [

      "images/mush1.png",
      "images/mush2.png",
      "images/mush2.png",
      "images/mush2.png"
  
    ]
  },
  
];


let gardenState = {
  lastVisit: Date.now(),
  plants: []
};



function loadGarden() {
  let loaded = false;

 
  if (checkCookie(COOKIE_NAME)) {
    try {
      const raw = getCookie(COOKIE_NAME);
      console.log("cookie raw:", raw);
      gardenState = JSON.parse(raw);
      loaded = true;
    } catch (e) {
      console.error("cookie parse error", e);
    }
  }

  
  if (!loaded) {
    try {
      const rawLS = localStorage.getItem(COOKIE_NAME);
      if (rawLS) {
        console.log("localStorage raw:", rawLS);
        gardenState = JSON.parse(rawLS);
        loaded = true;
      }
    } catch (e) {
      console.error("localStorage parse error", e);
    }
  }


  if (!loaded) {
    gardenState = {
      lastVisit: Date.now(),
      plants: []
    };
  }

  if (!Array.isArray(gardenState.plants)) {
    gardenState.plants = [];
  }

  applyTimeEffect();
  renderPlants();
}

function saveGarden() {
  gardenState.lastVisit = Date.now();
  const json = JSON.stringify(gardenState);


  setCookie(COOKIE_NAME, json, 365);

 
  try {
    localStorage.setItem(COOKIE_NAME, json);
  } catch (e) {
    console.warn("localStorage save error:", e);
  }
}

function applyTimeEffect() {
  const now = Date.now();
  const last = gardenState.lastVisit || now;
  const hoursPassed = (now - last) / (1000 * 60 * 60);

  if (hoursPassed > 0) {
    gardenState.plants.forEach((p) => {
      p.growth -= hoursPassed * WITHER_PER_HOUR;
    });
  }

  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = `last visit: ${hoursPassed.toFixed(1)}h ago`;
  }
}



function getLevelAndDead(growth) {
  if (growth <= 0) return { level: 0, dead: true };
  if (growth < 30) return { level: 0, dead: false };
  if (growth < 55) return { level: 1, dead: false };
  if (growth < 80) return { level: 2, dead: false };
  return { level: 3, dead: false };
}



function waterPlant(id) {
  const plant = gardenState.plants.find((p) => p.id === id);
  if (!plant) return;


  plant.growth += 15;
  if (plant.growth > 100) plant.growth = 100;

  if (plant.clicks == null) plant.clicks = 0;
  if (plant.clicks < 3) {
    plant.clicks += 1;
  }

  const el = document.querySelector(`.plant[data-id="${id}"]`);
  if (el) {
    el.classList.remove("watering");
    void el.offsetWidth; // reflow
    el.classList.add("watering");
  }

  renderPlants();
  saveGarden();
}


function plantNewAt(xPercent, yPercent) {
  const randomType =
    PLANT_TYPES[Math.floor(Math.random() * PLANT_TYPES.length)];
  const id =
    randomType.type +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(16).slice(2);

  gardenState.plants.push({
    id,
    type: randomType.type, 
    x: xPercent,
    y: yPercent,
    growth: 40, 
    clicks:0,          
  });

  renderPlants();
  saveGarden();
}



function sprayFlowersAt(layer, xPx, yPx) {
  const spray = document.createElement("div");
  spray.className = "spray";
  const SHIFT_X = -30; 
  spray.style.left = xPx + "px";
  spray.style.top  = yPx + "px";

  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.className = "spray-flower";
    img.src =
      FLOWER_SPRITES[Math.floor(Math.random() * FLOWER_SPRITES.length)];

    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 10;

    img.style.left = offsetX + "px";
    img.style.top  = offsetY + "px";

    spray.appendChild(img);
  }

  layer.appendChild(spray);

  setTimeout(() => spray.remove(), 800);
}


function renderPlants() {
  const layer = document.getElementById("plantsLayer");
  layer.innerHTML = "";

  gardenState.plants.forEach((p) => {
    const { level, dead } = getLevelAndDead(p.growth);

    const typeDef = PLANT_TYPES.find((t) => t.type === p.type);
    if (!typeDef) return;

    const stages = typeDef.stages || [];

    const stageIndex = Math.min(level, stages.length - 1);
    const sprite = stages[stageIndex];

    const plant = document.createElement("div");
    plant.className = `plant level-${level}` + (dead ? " dead" : "");
    plant.dataset.id = p.id;
    plant.style.left = p.x + "%";
    plant.style.top  = p.y + "%";

    const img = document.createElement("img");
    img.src = sprite;
    img.alt = p.type;

    plant.appendChild(img);
    layer.appendChild(plant);
  });
}



window.addEventListener("DOMContentLoaded", () => {
  const layer = document.getElementById("plantsLayer");

  console.log("script loaded, layer:", layer); 


  layer.addEventListener("click", (e) => {
    const rect = layer.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;


    const plantEl = e.target.closest(".plant");

    if (plantEl) {
      
      const id = plantEl.dataset.id;
      waterPlant(id);
      return;
    }


    const xPercent = (xPx / rect.width) * 100;
    const yPercent = (yPx / rect.height) * 100;

    sprayFlowersAt(layer, xPx, yPx);

    setTimeout(() => {
      plantNewAt(xPercent, yPercent);
    }, 500);
  });

  loadGarden();
});

window.addEventListener("beforeunload", saveGarden);
