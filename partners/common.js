(function () {
  "use strict";
  function escape(value) { var node = document.createElement("span"); node.textContent = value == null ? "" : String(value); return node.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(value) { return (Number(value || 0) / 100).toLocaleString("ru-RU", {style:"currency",currency:"RUB"}); }
  function date(value) { return new Date(Number(value) * 1000).toLocaleDateString("ru-RU"); }
  function copies(p) { return '<div class="copy-row"><label>Реферальная ссылка<input readonly value="' + escape(p.link) + '"></label><button type="button" data-copy>Скопировать</button></div><div class="copy-row"><label>Промокод<input readonly value="' + escape(p.code) + '"></label><button type="button" data-copy>Скопировать</button></div>'; }
  function summary(p) {
    return '<div class="card"><h2>' + escape(p.name) + '</h2><p>' + (p.active ? "Партнёрство активно" : "Выдача новых скидок и начислений приостановлена") + '</p>' + copies(p) + '<p class="muted">Вознаграждение: ' + escape(p.commissionPercent) + '% от фактически оплаченной суммы. Скидка покупателю: ' + escape(p.discountPercent) + '%. Период: ' + (p.commissionMonths ? escape(p.commissionMonths) + ' мес. с первой оплаты' : 'только первая оплата') + '. Проверка платежей перед выплатой: ' + escape(p.holdDays) + ' дн. Тестовые платежи не учитываются.</p><p class="muted">Пригласивший партнёр закрепляется за аккаунтом. Возвраты отменяют начисления; возврат уже оплаченного вознаграждения вычитается из следующих выплат.</p></div>' +
      '<div class="grid">' + [["Регистрации",p.registrations],["Покупатели",p.buyers],["К выплате",money(p.availableKopecks)],["На проверке",money(p.pendingKopecks)],["Всего начислено",money(p.earnedKopecks)],["Выплачено",money(p.paidKopecks)]].map(function (m) { return '<div class="metric"><span class="muted">' + escape(m[0]) + '</span><strong>' + escape(m[1]) + '</strong></div>'; }).join("") + '</div>';
  }
  function history(p) {
    var statuses = {pending:"На проверке",paid:"Выплачено",void:"Отменено"};
    return '<div class="card"><h2>Начисления</h2><p class="muted">Последние 200 записей. Суммы показаны после скидки покупателю; комиссия платёжного провайдера из базы вознаграждения не вычитается.</p><div class="table-wrap"><table><thead><tr><th>Дата</th><th>Оплата</th><th>Процент</th><th>Вознаграждение</th><th>Статус</th></tr></thead><tbody>' + (p.commissions || []).map(function (c) {return '<tr><td>' + escape(date(c.created_at)) + '</td><td>' + escape(money(c.payment_amount * 100)) + '</td><td>' + escape(c.commission_percent) + '%</td><td>' + escape(money(c.amount_kopecks)) + (c.kind === "reversal" ? ' · возврат' : '') + '</td><td>' + escape(c.status === "pending" && c.available_at <= Date.now()/1000 && (c.kind === "reversal" || c.payment_status === "paid") ? 'К выплате' : statuses[c.status] || c.status) + '</td></tr>';}).join("") + '</tbody></table></div>' + (!(p.commissions || []).length ? '<p class="muted">Начислений пока нет.</p>' : '') + '</div>' +
      '<div class="card"><h2>Выплаты</h2>' + (p.payouts || []).map(function (v) { return '<p>' + escape(date(v.created_at)) + ' · <strong>' + escape(money(v.amount_kopecks)) + '</strong><br><span class="muted" style="overflow-wrap:anywhere">' + escape(v.transfer_reference) + '</span></p>'; }).join("") + (!(p.payouts || []).length ? '<p class="muted">Выплат пока нет.</p>' : '') + '</div>';
  }
  async function request(path, token, options) {
    options = options || {};
    options.headers = Object.assign({"Content-Type":"application/json"},options.headers || {});
    if (token) options.headers.Authorization = "Bearer " + token;
    var api = location.hostname === "gotopvpn.github.io" ? "https://topvpn.site/api/account/v1" : "/api/account/v1";
    var response = await fetch(api + path, options);
    var data = await response.json().catch(function () {return {};});
    if (!response.ok) {var error = new Error(data.message || data.error || "Не удалось выполнить запрос"); error.status = response.status; throw error;}
    return data;
  }
  function notice(node, text, error) { node.hidden = !text; node.className = "notice" + (error ? " error" : ""); node.textContent = text; }
  document.addEventListener("click", async function (event) {
    var button = event.target.closest("[data-copy]");
    if (!button) return;
    var input = button.parentElement.querySelector("input");
    try {await navigator.clipboard.writeText(input.value); button.textContent = "Скопировано";}
    catch (_) {input.focus();input.select();button.textContent = "Выделено — скопируйте";}
  });
  window.TopVPNPartners = {escape:escape,money:money,summary:summary,history:history,request:request,notice:notice};
}());
