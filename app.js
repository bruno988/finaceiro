import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.FINANCE_CONFIG;
const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
let supabase;
let currentUser;
let transactions = [];
let investments = [];

function showAuthMessage(message, error = true) {
  const target = $("#auth-message");
  target.textContent = message;
  target.style.color = error ? "var(--red)" : "var(--green)";
}

function monthRange() {
  const value = $("#reference-month").value;
  const [year, month] = value.split("-").map(Number);
  const start = `${value}-01`;
  const end = new Date(year, month, 1).toISOString().slice(0, 10);
  return { start, end };
}

function updateDashboard() {
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const investmentTotal = investments.reduce((sum, item) => sum + Number(item.current_value), 0);
  $("#income-total").textContent = money.format(income);
  $("#expense-total").textContent = money.format(expense);
  $("#balance-total").textContent = money.format(income - expense);
  $("#investment-total").textContent = money.format(investmentTotal);

  const expensesByCategory = Object.entries(transactions.filter(t => t.type === "expense").reduce((map, t) => ({ ...map, [t.category]: (map[t.category] || 0) + Number(t.amount) }), {})).sort((a,b) => b[1]-a[1]);
  const maximum = expensesByCategory[0]?.[1] || 1;
  $("#categories").innerHTML = expensesByCategory.length ? expensesByCategory.map(([category, value]) => `<div class="bar-row"><span>${escapeHtml(category)}</span><div class="bar-track"><div class="bar-fill" style="width:${value / maximum * 100}%"></div></div><strong>${money.format(value)}</strong></div>`).join("") : "<p class='muted'>Ainda não há despesas neste mês.</p>";
  const tips = [];
  if (!transactions.length) tips.push("Comece registrando suas receitas e despesas para receber análises personalizadas.");
  if (income && expense > income) tips.push(`Suas despesas estão ${money.format(expense - income)} acima das receitas neste mês. Vale revisar os maiores gastos.`);
  else if (income && expense) tips.push(`Você preservou ${money.format(income - expense)} das receitas neste mês. Considere transformar uma parte em aporte.`);
  if (expensesByCategory[0] && expense) tips.push(`${expensesByCategory[0][0]} é sua maior categoria: ${money.format(expensesByCategory[0][1])}, ou ${Math.round(expensesByCategory[0][1] / expense * 100)}% das despesas.`);
  if (!investments.length) tips.push("Você ainda não cadastrou investimentos. Comece anotando o valor atual de cada aplicação para acompanhar seu patrimônio.");
  $("#insights").innerHTML = tips.map(tip => `<div class="insight">${tip}</div>`).join("");
  $("#transactions-list").innerHTML = transactions.length ? transactions.map(t => recordHtml(t, "transaction")).join("") : "<p class='muted'>Nenhum lançamento no período.</p>";
  $("#investment-list").innerHTML = investments.length ? investments.map(i => recordHtml(i, "investment")).join("") : "<p class='muted'>Nenhum investimento cadastrado.</p>";
}

function recordHtml(item, kind) {
  const isTransaction = kind === "transaction";
  const title = isTransaction ? item.category : item.name;
  const detail = isTransaction ? `${new Date(`${item.transaction_date}T12:00`).toLocaleDateString("pt-BR")}${item.description ? ` · ${item.description}` : ""}` : item.asset_class;
  const value = isTransaction ? Number(item.amount) : Number(item.current_value);
  const className = isTransaction ? item.type : "";
  return `<div class="record"><div><div class="record-title">${escapeHtml(title)}</div><small>${escapeHtml(detail)}</small></div><div><strong class="amount ${className}">${isTransaction && item.type === "expense" ? "−" : ""}${money.format(value)}</strong><button class="delete" data-kind="${kind}" data-id="${item.id}" aria-label="Excluir ${escapeHtml(title)}">Excluir</button></div></div>`;
}

function escapeHtml(text = "") { return String(text).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char])); }

async function loadData() {
  if (!currentUser) return;
  const { start, end } = monthRange();
  const [transactionsResult, investmentsResult] = await Promise.all([
    supabase.from("transactions").select("*").gte("transaction_date", start).lt("transaction_date", end).order("transaction_date", { ascending: false }),
    supabase.from("investments").select("*").order("name")
  ]);
  if (transactionsResult.error || investmentsResult.error) return showAuthMessage(transactionsResult.error?.message || investmentsResult.error?.message);
  transactions = transactionsResult.data;
  investments = investmentsResult.data;
  updateDashboard();
}

async function initialize() {
  if (!config?.supabaseUrl || config.supabaseUrl.includes("SEU-PROJETO") || !config?.supabaseAnonKey) {
    showAuthMessage("Configure o arquivo config.js com a URL e a chave pública ANON do Supabase.");
    return;
  }
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data: { session } } = await supabase.auth.getSession();
  await setSession(session);
  supabase.auth.onAuthStateChange((_event, sessionValue) => setSession(sessionValue));
}

async function setSession(session) {
  currentUser = session?.user;
  $("#auth-screen").hidden = Boolean(currentUser);
  $("#app").hidden = !currentUser;
  if (currentUser) { $("#user-email").textContent = currentUser.email; await loadData(); }
}

$("#auth-form").addEventListener("submit", async event => {
  event.preventDefault(); if (!supabase) return;
  const { error } = await supabase.auth.signInWithPassword({ email: $("#email").value, password: $("#password").value });
  if (error) showAuthMessage(error.message);
});
$("#logout-button").addEventListener("click", () => supabase.auth.signOut());
$("#reference-month").addEventListener("change", loadData);
$("#refresh-button").addEventListener("click", loadData);
$("#transaction-form").addEventListener("submit", async event => {
  event.preventDefault(); const { error } = await supabase.from("transactions").insert({ user_id: currentUser.id, type: $("#transaction-type").value, amount: $("#transaction-amount").value, category: $("#transaction-category").value.trim(), transaction_date: $("#transaction-date").value, description: $("#transaction-description").value.trim() || null });
  if (error) return showAuthMessage(error.message); event.target.reset(); $("#transaction-date").value = new Date().toISOString().slice(0, 10); await loadData();
});
$("#investment-form").addEventListener("submit", async event => {
  event.preventDefault(); const { error } = await supabase.from("investments").insert({ user_id: currentUser.id, name: $("#investment-name").value.trim(), asset_class: $("#investment-class").value, current_value: $("#investment-value").value });
  if (error) return showAuthMessage(error.message); event.target.reset(); await loadData();
});
document.addEventListener("click", async event => { const button = event.target.closest(".delete"); if (!button || !supabase) return; const table = button.dataset.kind === "transaction" ? "transactions" : "investments"; const { error } = await supabase.from(table).delete().eq("id", button.dataset.id); if (error) return showAuthMessage(error.message); await loadData(); });

const now = new Date();
const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
$("#reference-month").value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
$("#transaction-date").value = localDate;
initialize();
