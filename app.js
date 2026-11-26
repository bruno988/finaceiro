const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const storageKey = "meu-fluxo-dados-v1";
let transactions = [];
let investments = [];

function makeId() { return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function escapeHtml(text = "") { return String(text).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }
function localIsoDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function saveData() { localStorage.setItem(storageKey, JSON.stringify({ version: 1, transactions, investments })); }

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    transactions = Array.isArray(saved.transactions) ? saved.transactions : [];
    investments = Array.isArray(saved.investments) ? saved.investments : [];
  } catch { transactions = []; investments = []; }
  updateDashboard();
}

function updateDashboard() {
  const month = $("#reference-month").value;
  const visible = transactions.filter(t => t.transaction_date?.startsWith(month));
  const income = visible.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = visible.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const invested = investments.reduce((sum, item) => sum + Number(item.current_value), 0);
  $("#income-total").textContent = money.format(income);
  $("#expense-total").textContent = money.format(expense);
  $("#balance-total").textContent = money.format(income - expense);
  $("#investment-total").textContent = money.format(invested);

  const byCategory = Object.entries(visible.filter(t => t.type === "expense").reduce((map, t) => ({ ...map, [t.category]: (map[t.category] || 0) + Number(t.amount) }), {})).sort((a, b) => b[1] - a[1]);
  const maximum = byCategory[0]?.[1] || 1;
  $("#categories").innerHTML = byCategory.length ? byCategory.map(([category, value]) => `<div class="bar-row"><span>${escapeHtml(category)}</span><div class="bar-track"><div class="bar-fill" style="width:${value / maximum * 100}%"></div></div><strong>${money.format(value)}</strong></div>`).join("") : "<p class='muted'>Ainda não há despesas neste mês.</p>";
  const tips = [];
  if (!visible.length) tips.push("Comece registrando suas receitas e despesas para receber análises personalizadas.");
  if (income && expense > income) tips.push(`Suas despesas estão ${money.format(expense - income)} acima das receitas neste mês. Vale revisar os maiores gastos.`);
  else if (income && expense) tips.push(`Você preservou ${money.format(income - expense)} das receitas neste mês. Considere transformar uma parte em aporte.`);
  if (byCategory[0] && expense) tips.push(`${byCategory[0][0]} é sua maior categoria: ${money.format(byCategory[0][1])}, ou ${Math.round(byCategory[0][1] / expense * 100)}% das despesas.`);
  if (!investments.length) tips.push("Você ainda não cadastrou investimentos. Comece anotando o valor atual de cada aplicação para acompanhar seu patrimônio.");
  $("#insights").innerHTML = tips.map(tip => `<div class="insight">${tip}</div>`).join("");
  $("#transactions-list").innerHTML = visible.length ? [...visible].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).map(t => recordHtml(t, "transaction")).join("") : "<p class='muted'>Nenhum lançamento no período.</p>";
  $("#investment-list").innerHTML = investments.length ? investments.map(i => recordHtml(i, "investment")).join("") : "<p class='muted'>Nenhum investimento cadastrado.</p>";
}

function recordHtml(item, kind) {
  const transaction = kind === "transaction";
  const title = transaction ? item.category : item.name;
  const detail = transaction ? `${new Date(`${item.transaction_date}T12:00`).toLocaleDateString("pt-BR")}${item.description ? ` · ${item.description}` : ""}` : item.asset_class;
  const value = transaction ? Number(item.amount) : Number(item.current_value);
  return `<div class="record"><div><div class="record-title">${escapeHtml(title)}</div><small>${escapeHtml(detail)}</small></div><div><strong class="amount ${transaction ? item.type : ""}">${transaction && item.type === "expense" ? "−" : ""}${money.format(value)}</strong><button class="delete" data-kind="${kind}" data-id="${item.id}">Excluir</button></div></div>`;
}

$("#reference-month").addEventListener("change", updateDashboard);
$("#refresh-button").addEventListener("click", loadData);
$("#transaction-form").addEventListener("submit", event => {
  event.preventDefault();
  transactions.push({ id: makeId(), type: $("#transaction-type").value, amount: Number($("#transaction-amount").value), category: $("#transaction-category").value.trim(), transaction_date: $("#transaction-date").value, description: $("#transaction-description").value.trim() });
  saveData(); event.target.reset(); $("#transaction-date").value = localIsoDate(); updateDashboard();
});
$("#investment-form").addEventListener("submit", event => {
  event.preventDefault();
  investments.push({ id: makeId(), name: $("#investment-name").value.trim(), asset_class: $("#investment-class").value, current_value: Number($("#investment-value").value) });
  saveData(); event.target.reset(); updateDashboard();
});
document.addEventListener("click", event => {
  const button = event.target.closest(".delete"); if (!button) return;
  if (button.dataset.kind === "transaction") transactions = transactions.filter(item => item.id !== button.dataset.id);
  else investments = investments.filter(item => item.id !== button.dataset.id);
  saveData(); updateDashboard();
});
$("#export-button").addEventListener("click", () => {
  const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), transactions, investments }, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: `meu-fluxo-backup-${localIsoDate()}.json` });
  link.click(); URL.revokeObjectURL(link.href);
});
$("#import-input").addEventListener("change", async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (!Array.isArray(backup.transactions) || !Array.isArray(backup.investments)) throw new Error();
    transactions = backup.transactions; investments = backup.investments; saveData(); updateDashboard(); alert("Backup importado com sucesso.");
  } catch { alert("Não foi possível importar esse arquivo de backup."); }
  event.target.value = "";
});

const now = new Date();
$("#reference-month").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
$("#transaction-date").value = localIsoDate(now);
loadData();
