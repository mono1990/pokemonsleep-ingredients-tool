import './index.css';

let recipes = {};
const categories = ["カレー・シチュー", "サラダ", "ドリンク・デザート"];
// 保存キーは localStorage に slot付きで保存
const SAVE_PREFIX = "pokesleep-cook-slot-"; // + 1, 2, 3


document.addEventListener("DOMContentLoaded", () => {
  fetch("./recipes.json")
    .then(res => res.json())
    .then(data => {
      recipes = data;
      initUI();
      createRecommendationPopup();
    });
});

document.addEventListener("DOMContentLoaded", () => {
  initUI();

  const clearBtn = document.getElementById("clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("本当にすべての入力をクリアしますか？")) {
        clearAllInputs();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("slot-menu");
  const panel = document.getElementById("slot-panel");
  let hoverTimeout;

  menu.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimeout);
    panel.classList.add("visible");
  });
  
  menu.addEventListener("mouseleave", () => {
    hoverTimeout = setTimeout(() => {
      panel.classList.remove("visible");
    }, 100);
  });
});


function initUI() {
  loadInputsFromStorage(); // ← 最初に復元
  
  categories.forEach(cat => {
    const btn = document.getElementById(`add-btn-${toId(cat)}`);
    if (btn) {
      btn.addEventListener("click", () => {addRecipeInput(cat);calculateAll();});
    }
  });
}

function toId(str) {
  return str.replace(/[\/\s]/g, "_");
}

function createRecommendationPopup() {
  const popup = document.createElement("div");
  popup.id = "recommend-popup";
  popup.classList.add("recommend-popup");
  popup.style.zIndex = 1000;
  popup.style.maxHeight = "70vh";
  popup.style.overflowY = "auto";
  popup.style.display = "none";
  popup.innerHTML = `
    <h3 id="popup-title"></h3>
    <ul id="popup-list"></ul>
    <button onclick="document.getElementById('recommend-popup').style.display='none'">閉じる</button>
  `;
  document.body.appendChild(popup);
}

function showRecommendations(category) {
  const list = document.getElementById("popup-list");
  const title = document.getElementById("popup-title");
  const popup = document.getElementById("recommend-popup");
  list.innerHTML = "";
  title.textContent = `${category}のおすすめ料理（エナジー降順）`;

  const sorted = Object.entries(recipes[category])
    .map(([name, data]) => {
      const totalIngredients = Object.values(data.食材).reduce((a, b) => a + b, 0);
      const efficiency = data.エナジー / totalIngredients;
      return isNaN(efficiency) ? null : { name, energy: data.エナジー, efficiency };
    })
    .filter(x => x)
    .sort((a, b) => b.energy - a.energy);

  sorted.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}：${entry.energy}エナジー（効率: ${entry.efficiency.toFixed(1)}）`;
    list.appendChild(li);
  });

  popup.style.display = "block";
}

function addRecipeInput(category, defaultName = null, defaultCount = 1) {
  const container = document.getElementById(`input-${toId(category)}`);
  const div = document.createElement("div");
  div.className = "input-row";

  const select = document.createElement("select");
  const input = document.createElement("input");
  const removeBtn = document.createElement("button");

  input.type = "number";
  input.min = "1";
  input.value = "1";
  input.classList.add("count-input");
  input.value = defaultCount;

  const recipeList = recipes[category];
  Object.entries(recipeList)
    .sort((a, b) => b[1].エナジー - a[1].エナジー)
    .forEach(([name, data]) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `${name}（${data.エナジー}）`;
      select.appendChild(opt);
    });

    // select の初期値
    if (defaultName) select.value = defaultName;

    select.addEventListener("change", () => {
      calculateAll();
      saveInputsToStorage();
    });
    input.addEventListener("change", () => {
      calculateAll();
      saveInputsToStorage();
    });
    
  removeBtn.textContent = "✕";
  removeBtn.type = "button";
  removeBtn.classList.add('btn-icon', 'bg-red-400', 'text-white');
  removeBtn.onclick = () => {
    container.removeChild(div);
    calculateAll(); // ← 再計算を追加！
    saveInputsToStorage();
  };  

  div.appendChild(select);
  div.appendChild(input);
  div.appendChild(removeBtn);
  container.appendChild(div);

  calculateAll();
  saveInputsToStorage(); // 追加時にも保存
}

function calculateAll() {
  console.log("✅ calculateAll が呼ばれました！");

  const summaryTable = document.querySelector("#ingredient-comparison tbody");
  summaryTable.innerHTML = "";

  const allIngredients = {};
  const maxPerItem = {};

  categories.forEach((category) => {
    const container = document.querySelector(`#input-${toId(category)}`);
    const rows = container.querySelectorAll(".input-row");
    console.log(`📦 [${category}] rows:`, rows.length);
  
    const result = {};
    let totalEnergy = 0;
  
    rows.forEach((row) => {
      const name = row.querySelector("select").value;
      const count = parseInt(row.querySelector("input").value);
      const data = recipes[category][name];
  
      console.log("🥘 選択:", name);
      if (!data) {
        console.warn("⚠️ レシピが見つかりません:", name, "in", category);
        return;
      }
  
      for (let item in data.食材) {
        const total = data.食材[item] * count;
        result[item] = (result[item] || 0) + total;
        maxPerItem[item] = Math.max(maxPerItem[item] || 0, total);
      }
  
      totalEnergy += data.エナジー * count;
    });
  
    console.log("🧾 結果:", result);
  
    const catId = toId(category);
    const resultWrapper = document.getElementById(`result-${catId}`);
    console.log("📌 表示先:", resultWrapper);
    resultWrapper.innerHTML = "";
  
    const table = document.createElement("table");
    table.className = "min-w-full text-sm table-auto";
    const tbody = document.createElement("tbody");
  
    for (let item in result) {
      const tr = document.createElement("tr");
  
      const tdName = document.createElement("td");
      tdName.appendChild(createIconWithName(item));
      tdName.className = "pr-2 whitespace-nowrap";
  
      const tdQty = document.createElement("td");
      tdQty.textContent = `${result[item]}個`;
      tdQty.className = "text-right font-mono";
  
      tr.appendChild(tdName);
      tr.appendChild(tdQty);
      tbody.appendChild(tr);
    }
  
    table.appendChild(tbody);
    console.log("📋 table ready:", table.outerHTML);
    resultWrapper.appendChild(table);
  
    document.getElementById(`energy-${catId}`).textContent = `${totalEnergy} エナジー`;
  
    for (let item in result) {
      if (!allIngredients[item]) allIngredients[item] = {};
      allIngredients[item][category] = result[item];
    }
  });
  
  Object.entries(allIngredients)
    .sort((a, b) => (maxPerItem[b[0]] || 0) - (maxPerItem[a[0]] || 0))
    .forEach(([item, perCategory]) => {
      const row = document.createElement("tr");
      const isShared = categories.filter(cat => perCategory[cat]).length > 1;
      const tdItem = document.createElement("td");
      if (isShared) tdItem.style = "font-weight:bold; color:#d22";
      tdItem.appendChild(createIconWithName(item));
      row.appendChild(tdItem);
      for (let cat of categories) {
        const td = document.createElement("td");
        td.textContent = perCategory[cat] || 0;
        row.appendChild(td);
      }
      const tdMax = document.createElement("td");
      tdMax.textContent = maxPerItem[item] || 0;
      row.appendChild(tdMax);
      
      summaryTable.appendChild(row);
    });
}

function saveInputsToStorage() {
  const data = {};

  categories.forEach((category) => {
    const container = document.getElementById(`input-${toId(category)}`);
    const rows = container.querySelectorAll(".input-row");

    data[category] = Array.from(rows).map(row => {
      const name = row.querySelector("select").value;
      const count = parseInt(row.querySelector("input").value);
      return { name, count };
    });
  });

  localStorage.setItem("pokesleep-cook-inputs", JSON.stringify(data));
  console.log("💾 入力を保存しました");
}

function loadInputsFromStorage() {
  const raw = localStorage.getItem("pokesleep-cook-inputs");
  if (!raw) return;

  const data = JSON.parse(raw);
  categories.forEach(category => {
    const container = document.getElementById(`input-${toId(category)}`);
    container.innerHTML = ""; // 既存をクリア

    if (data[category]) {
      data[category].forEach(({ name, count }) => {
        addRecipeInput(category, name, count);
      });
    }
  });

  calculateAll();
  console.log("🔁 入力を復元しました");
}

function clearAllInputs() {
  categories.forEach(category => {
    const container = document.getElementById(`input-${toId(category)}`);
    container.innerHTML = ""; // 入力欄を空に

    // 食材・エナジー表示もリセット
    const result = document.getElementById(`result-${toId(category)}`);
    if (result) result.innerHTML = "";

    const energy = document.getElementById(`energy-${toId(category)}`);
    if (energy) energy.textContent = "0";
  });

  // サマリテーブルもリセット
  const summaryTable = document.querySelector("#ingredient-comparison tbody");
  if (summaryTable) summaryTable.innerHTML = "";

  // 保存も削除
  localStorage.removeItem("pokesleep-cook-inputs");

  console.log("🧹 入力をすべてクリアしました");
}

function getCurrentInputData() {
  const data = {};
  categories.forEach(category => {
    const container = document.getElementById(`input-${toId(category)}`);
    const rows = container.querySelectorAll(".input-row");
    data[category] = Array.from(rows).map(row => {
      const name = row.querySelector("select").value;
      const count = parseInt(row.querySelector("input").value);
      return { name, count };
    });
  });
  return data;
}

function saveToSlot(slot) {
  const data = getCurrentInputData();
  localStorage.setItem(`${SAVE_PREFIX}${slot}`, JSON.stringify(data));
  alert(`スロット${slot}に保存しました！`);
}

function loadFromSlot(slot) {
  const raw = localStorage.getItem(`${SAVE_PREFIX}${slot}`);
  if (!raw) {
    alert(`スロット${slot}は空です`);
    return;
  }

  const data = JSON.parse(raw);
  categories.forEach(category => {
    const container = document.getElementById(`input-${toId(category)}`);
    container.innerHTML = "";
    if (data[category]) {
      data[category].forEach(({ name, count }) => {
        addRecipeInput(category, name, count);
      });
    }
  });
  calculateAll();
}

function deleteSlot(slot) {
  localStorage.removeItem(`${SAVE_PREFIX}${slot}`);
  alert(`スロット${slot}を削除しました`);
}



const foodIconMap = {
  'ふといながねぎ': 'food-icon-negi',
  'あじわいキノコ': 'food-icon-kinoko',
  'とくせんエッグ': 'food-icon-egg',
  'ほっこりポテト': 'food-icon-potato',
  'とくせんリンゴ': 'food-icon-apple',
  'げきからハーブ': 'food-icon-herb',
  'マメミート': 'food-icon-meat',
  'モーモーミルク': 'food-icon-milk',
  'あまいミツ': 'food-icon-honey',
  'ピュアなオイル': 'food-icon-oil',
  'あったかジンジャー': 'food-icon-ginger',
  'あんみんトマト': 'food-icon-tomato',
  'リラックスカカオ': 'food-icon-cacao',
  'おいしいシッポ': 'food-icon-tail',
  'ワカクサ大豆': 'food-icon-bean',
  'ワカクサコーン': 'food-icon-corn',
  'めざましコーヒー': 'food-icon-coffee',
};

function createIconWithName(name, quantityText = '') {
  const wrapper = document.createElement('span');
  wrapper.className = 'inline-flex items-center gap-1';
  
  const icon = document.createElement('span');
  icon.className = `food-icon ${foodIconMap[name] || ''}`;
  icon.title = name;
  
  const label = document.createElement('span');
  label.textContent = `${name}${quantityText}`;
  
  wrapper.appendChild(icon);
  wrapper.appendChild(label);
  return wrapper;
}


window.showRecommendations = showRecommendations;
window.calculateAll = calculateAll;
window.addRecipeInput = addRecipeInput;
window.createRecommendationPopup = createRecommendationPopup;

window.getCurrentInputData = getCurrentInputData;
window.saveToSlot = saveToSlot;
window.loadFromSlot = loadFromSlot;
window.deleteSlot = deleteSlot;
