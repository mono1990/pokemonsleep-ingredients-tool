import './index.css';

let recipes = {};
const categories = ["カレー・シチュー", "サラダ", "ドリンク・デザート"];

document.addEventListener("DOMContentLoaded", () => {
  fetch("/recipes.json")
    .then(res => res.json())
    .then(data => {
      recipes = data;
      initUI();
      createRecommendationPopup();
    });
});

function initUI() {
  categories.forEach(cat => {
    addRecipeInput(cat);

    const btn = document.getElementById(`add-btn-${toId(cat)}`);
    if (btn) {
      btn.addEventListener("click", () => addRecipeInput(cat));
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

function addRecipeInput(category) {
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

  const recipeList = recipes[category];
  Object.entries(recipeList)
    .sort((a, b) => b[1].エナジー - a[1].エナジー)
    .forEach(([name, data]) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `${name}（${data.エナジー}）`;
      select.appendChild(opt);
    });

  removeBtn.textContent = "✖";
  removeBtn.type = "button";
  removeBtn.classList.add('btn-icon', 'bg-red-400', 'text-white');
  removeBtn.onclick = () => container.removeChild(div);

  div.appendChild(select);
  div.appendChild(input);
  div.appendChild(removeBtn);
  container.appendChild(div);
}

function calculateAll() {
  const summaryTable = document.querySelector("#ingredient-comparison tbody");
  summaryTable.innerHTML = "";

  const allIngredients = {};
  const maxPerItem = {};

  categories.forEach((category) => {
    const container = document.querySelector(`#input-${toId(category)}`);
    const rows = container.querySelectorAll(".input-row");
    const result = {};
    let totalEnergy = 0;

    rows.forEach((row) => {
      const name = row.querySelector("select").value;
      const count = parseInt(row.querySelector("input").value);
      const data = recipes[category][name];

      for (let item in data.食材) {
        const total = data.食材[item] * count;
        result[item] = (result[item] || 0) + total;
        maxPerItem[item] = Math.max(maxPerItem[item] || 0, total);
      }

      totalEnergy += data.エナジー * count;
    });

    const catId = toId(category);
    const ul = document.getElementById(`result-${catId}`);
    ul.innerHTML = "";
    for (let item in result) {
      const li = document.createElement("li");
      li.textContent = `${item}：${result[item]}個`;
      ul.appendChild(li);
    }
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
      row.innerHTML = `<td${isShared ? ' style="font-weight:bold; color:#d22"' : ''}>${item}</td>` +
        categories.map(cat => `<td>${perCategory[cat] || 0}</td>`).join('') +
        `<td>${maxPerItem[item] || 0}</td>`;
      summaryTable.appendChild(row);
    });
}

window.showRecommendations = showRecommendations;
window.calculateAll = calculateAll;
window.addRecipeInput = addRecipeInput;
window.createRecommendationPopup = createRecommendationPopup;
