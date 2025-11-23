let cat = null,
  catEmoji = null,
  expenses = JSON.parse(localStorage.getItem("expenses")) || [],
  budget = JSON.parse(localStorage.getItem("budget")) || 420000,
  savingGoal = JSON.parse(localStorage.getItem("savingGoal")) || 1200000,
  catChart = null,
  trendChart = null;

function selectCat(c, e) {
  cat = c;
  catEmoji = e;
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.remove("active"));
  event.target.closest(".cat-btn").classList.add("active");
}

function addExpense() {
  const a = parseInt(document.getElementById("amountInput").value);
  if (!cat) {
    alert("Pilih kategori!");
    return;
  }
  if (!a || a <= 0) {
    alert("Input valid!");
    return;
  }
  expenses.push({
    id: Date.now(),
    category: cat,
    emoji: catEmoji,
    amount: a,
    date: new Date().toISOString(),
  });
  localStorage.setItem("expenses", JSON.stringify(expenses));
  document.getElementById("amountInput").value = "";
  update();
}

function deleteExpense(id) {
  expenses = expenses.filter((e) => e.id !== id);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  update();
}

function renderExpenses() {
  const today = new Date().toDateString(),
    list = document.getElementById("expensesList");
  list.innerHTML = expenses
    .filter((e) => new Date(e.date).toDateString() === today)
    .map(
      (e) =>
        `<div class="item"><span>${e.emoji} ${
          e.category
        }</span><span>Rp ${e.amount.toLocaleString(
          "id-ID"
        )}</span><button class="del-btn" onclick="deleteExpense(${
          e.id
        })">Hapus</button></div>`
    )
    .join("");
}

function calcTotals() {
  const today = new Date(),
    week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
    month = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    today: expenses
      .filter((e) => new Date(e.date).toDateString() === today.toDateString())
      .reduce((s, e) => s + e.amount, 0),
    week: expenses
      .filter((e) => new Date(e.date) >= week)
      .reduce((s, e) => s + e.amount, 0),
    month: expenses
      .filter((e) => new Date(e.date) >= month)
      .reduce((s, e) => s + e.amount, 0),
  };
}

function updateStats() {
  const t = calcTotals();
  document.getElementById("todayTotal").textContent =
    "Rp " + t.today.toLocaleString("id-ID");
  document.getElementById("weekTotal").textContent =
    "Rp " + t.week.toLocaleString("id-ID");
  document.getElementById("monthTotal").textContent =
    "Rp " + t.month.toLocaleString("id-ID");
}

function updateBudget() {
  const t = calcTotals(),
    pct = Math.min((t.week / budget) * 100, 100),
    fill = document.getElementById("progressFill");
  fill.style.width = pct + "%";
  fill.textContent = Math.round(pct) + "%";
  fill.classList.remove("warn", "danger");
  if (pct > 80) fill.classList.add("danger");
  else if (pct > 50) fill.classList.add("warn");
  document.getElementById("budgetAmount").textContent =
    "Rp " + (budget - t.week).toLocaleString("id-ID");
}

function setBudget() {
  const b = parseInt(document.getElementById("budgetInput").value);
  if (!b || b <= 0) {
    alert("Input valid!");
    return;
  }
  budget = b;
  localStorage.setItem("budget", JSON.stringify(budget));
  document.getElementById("budgetInput").value = "";
  update();
}

function updateSavings() {
  const t = calcTotals(),
    remaining = Math.max(savingGoal - t.month, 0),
    pct = Math.min((remaining / savingGoal) * 100, 100);
  document.getElementById("savedAmount").textContent =
    "Rp " + remaining.toLocaleString("id-ID");
  document.getElementById("targetAmount").textContent =
    "Rp " + savingGoal.toLocaleString("id-ID");
  document.getElementById("progressPct").textContent = Math.round(pct) + "%";
  document.getElementById("progressCircle").style.strokeDashoffset =
    440 * (1 - pct / 100);
}

function setSavingGoal() {
  const g = parseInt(document.getElementById("savingInput").value);
  if (!g || g <= 0) {
    alert("Input valid!");
    return;
  }
  savingGoal = g;
  localStorage.setItem("savingGoal", JSON.stringify(savingGoal));
  document.getElementById("savingInput").value = "";
  update();
}

function updateCharts() {
  const catData = {};
  expenses.forEach((e) => {
    catData[e.category] = (catData[e.category] || 0) + e.amount;
  });
  const ctx1 = document.getElementById("categoryChart").getContext("2d");
  if (catChart) catChart.destroy();
  catChart = new Chart(ctx1, {
    type: "doughnut",
    data: {
      labels: Object.keys(catData),
      datasets: [
        {
          data: Object.values(catData),
          backgroundColor: [
            "#FF9F43",
            "#2ED573",
            "#6C5CE7",
            "#FF6B6B",
            "#FFD93D",
            "#74B9FF",
            "#A29BFE",
            "#FD79A8",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  const last7 = [],
    trendData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push(d.toLocaleDateString("id-ID", { weekday: "short" }));
    trendData.push(
      expenses
        .filter((e) => new Date(e.date).toDateString() === d.toDateString())
        .reduce((s, e) => s + e.amount, 0)
    );
  }

  const ctx2 = document.getElementById("trendChart").getContext("2d");
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx2, {
    type: "line",
    data: {
      labels: last7,
      datasets: [
        {
          label: "Pengeluaran",
          data: trendData,
          borderColor: "#FF9F43",
          backgroundColor: "rgba(255,159,67,0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: "bottom" } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function update() {
  renderExpenses();
  updateStats();
  updateBudget();
  updateSavings();
  updateCharts();
}

function toggleHemat() {
  document.body.classList.toggle("hemat");
  localStorage.setItem("hemat", document.body.classList.contains("hemat"));
  showTips();
}

function showTips() {
  const tips = [
    "Masak mie 2x",
    "Jangan keseringan nongkrong ",
    "Minum air gratis",
    "Laundry sendiri hemat 50%",
    "Jalan kaki gratis",
  ];
  if (document.body.classList.contains("hemat")) {
    document.getElementById("tips").style.display = "block";
    document.getElementById("tipsList").innerHTML = tips
      .map((t) => `<li>${t}</li>`)
      .join("");
  } else document.getElementById("tips").style.display = "none";
}

function closeTutorial() {
  document.getElementById("tutorialModal").classList.add("hidden");
  localStorage.setItem("tutorialSeen", "true");
}

function startApp() {
  closeTutorial();
  document.querySelector(".cat-btn").click();
}

window.addEventListener("load", () => {
  if (!localStorage.getItem("tutorialSeen"))
    document.getElementById("tutorialModal").classList.remove("hidden");
  if (localStorage.getItem("hemat") === "true")
    document.body.classList.add("hemat");
  update();
  showTips();
});

setInterval(update, 1000);
