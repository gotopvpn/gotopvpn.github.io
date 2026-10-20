(function () {
  "use strict";
  var ui = window.TopVPNPartners, root = document.getElementById("partnersPanel"), selected = null;
  if (!root) return;
  function token() {return sessionStorage.getItem("topvpn_support_admin") || "";}
  function terms() {return '<div class="grid"><label>Вознаграждение, %<input name="commissionPercent" type="number" min="0" max="100" step="1" value="0" required></label><label>Скидка покупателю, %<input name="discountPercent" type="number" min="0" max="90" step="1" value="0" required></label><label>Начислять с продлений, месяцев<input name="commissionMonths" type="number" min="0" max="120" step="1" value="12" required></label></div><p class="muted">Срок начинается с первой реальной оплаты. 0 месяцев — вознаграждение только за первую оплату. Условия уже созданных платежей и начавшийся срок начислений сохраняются.</p><label><input type="checkbox" name="active" checked>Принимать новых клиентов, применять скидки и начислять вознаграждения</label>';}
  root.innerHTML = '<div id="partnersNotice" role="status" hidden></div><div id="partnerCredentials" class="card" hidden></div><form id="partnerCreate" class="card"><h2>Добавить партнёра</h2><div class="grid"><label>Имя партнёра<input name="name" required maxlength="80" placeholder="Например, Иван — канал о технологиях"></label><label>Имя аккаунта TopVPN<input name="accountUsername" required pattern="[a-z][a-z0-9_]{2,23}" maxlength="24" placeholder="ivan_partner"></label><label>Промокод и код ссылки<input name="code" required pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" maxlength="32" placeholder="IVAN"></label></div><p class="muted">Если такого аккаунта нет, он будет создан, а временный пароль появится один раз после сохранения. Если аккаунт существует, его пароль сохранится. Код после создания не меняется.</p>' + terms() + '<button>Создать партнёра</button></form><div class="card"><h2>Партнёры</h2><button id="partnersRefresh" type="button" class="secondary">Обновить</button><div id="partnerList" class="partner-list"></div></div><div id="partnerDetails"></div>';
  var notice = document.getElementById("partnersNotice");
  async function request(path,options) {return ui.request("/admin/partners"+path,token(),options);}
  function readTerms(form) {return {name:form.elements.name.value.trim(),commissionPercent:Number(form.elements.commissionPercent.value),discountPercent:Number(form.elements.discountPercent.value),commissionMonths:Number(form.elements.commissionMonths.value),active:form.elements.active.checked};}
  async function select(id) {
    var data = await request("/"+encodeURIComponent(id));selected = data.partner;
    var detail=document.getElementById("partnerDetails");
    detail.innerHTML=ui.summary(selected)+'<form id="partnerEdit" class="card"><h2>Условия партнёра @'+ui.escape(selected.accountUsername)+'</h2><label>Имя партнёра<input name="name" required maxlength="80"></label>'+terms()+'<button>Сохранить условия</button></form><form id="partnerPayout" class="card"><h2>Записать выполненную выплату</h2><p>К выплате: <strong>'+ui.escape(ui.money(selected.availableKopecks))+'</strong></p><p class="muted">Перевод выполняется вами отдельно. Эта форма только записывает его и списывает доступные начисления. Суммы учёта — в рублях; курс и сумму USDT можно сохранить вместе с хешем перевода.</p><label>Хеш транзакции / идентификатор и сумма перевода<input name="reference" minlength="8" maxlength="200" required></label><label><input name="confirmed" type="checkbox" required>Перевод партнёру уже выполнен, сумма соответствует балансу выше</label><button '+(selected.availableKopecks<=0?'disabled':'')+'>Подтвердить выполненную выплату</button></form>'+ui.history(selected);
    var edit=document.getElementById("partnerEdit");edit.elements.name.value=selected.name;
    ["commissionPercent","discountPercent","commissionMonths"].forEach(function(key){edit.elements[key].value=selected[key];});edit.elements.active.checked=selected.active;
    edit.addEventListener("submit",async function(event){event.preventDefault();var button=edit.querySelector("button");button.disabled=true;try{await request("/"+encodeURIComponent(id),{method:"PATCH",body:JSON.stringify(readTerms(edit))});await load();ui.notice(notice,"Условия сохранены");}catch(error){ui.notice(notice,error.message,true);}finally{button.disabled=false;}});
    var payout=document.getElementById("partnerPayout");
    payout.addEventListener("submit",async function(event){event.preventDefault();var button=payout.querySelector("button");button.disabled=true;try{await request("/"+encodeURIComponent(id)+"/payouts",{method:"POST",body:JSON.stringify({transferReference:payout.elements.reference.value.trim(),confirmed:payout.elements.confirmed.checked,amountKopecks:selected.availableKopecks})});await load();ui.notice(notice,"Выплата записана");}catch(error){ui.notice(notice,error.message,true);}finally{button.disabled=false;}});
  }
  async function load() {
    try {
      var data=await request("");
      var list=document.getElementById("partnerList");list.replaceChildren();
      data.partners.forEach(function(p){var button=document.createElement("button");button.type="button";button.textContent=p.name+" · "+p.code+(p.active?"":" · приостановлен");button.addEventListener("click",function(){select(p.id).catch(function(error){ui.notice(notice,error.message,true);});});list.appendChild(button);});
      if(!data.partners.length){var empty=document.createElement("p");empty.className="muted";empty.textContent="Партнёров пока нет. Создайте первого в форме выше.";list.appendChild(empty);}
      if(selected) await select(selected.id);
    }catch(error){ui.notice(notice,error.message,true);}
  }
  document.getElementById("partnersRefresh").addEventListener("click",load);
  document.getElementById("partnerCreate").addEventListener("submit",async function(event){
    event.preventDefault();var form=event.currentTarget,button=form.querySelector("button");button.disabled=true;
    try {
      var body=readTerms(form);body.code=form.elements.code.value.trim().toUpperCase();body.accountUsername=form.elements.accountUsername.value.trim();
      var data=await request("",{method:"POST",body:JSON.stringify(body)});selected=data.partner;form.reset();
      var credentials=document.getElementById("partnerCredentials");credentials.hidden=false;
      credentials.innerHTML='<h2>Доступ партнёра создан</h2><p>Кабинет: <a href="/partners/">'+ui.escape(location.origin+'/partners/')+'</a></p><p>Имя аккаунта: <strong>'+ui.escape(data.partner.accountUsername)+'</strong></p>'+(data.temporaryPassword?'<div class="copy-row"><label>Временный пароль — сохраните и передайте партнёру<input readonly value="'+ui.escape(data.temporaryPassword)+'"></label><button type="button" data-copy>Скопировать</button></div><p class="muted">После входа партнёр сможет сменить пароль. Повторно показать этот пароль нельзя.</p>':'<p class="muted">Аккаунт уже существовал. Партнёр входит со своим текущим паролем.</p>')+ui.summary(data.partner);
      await load();ui.notice(notice,"Партнёр создан. Сохраните данные доступа из блока выше.");
    }catch(error){ui.notice(notice,error.message,true);}finally{button.disabled=false;}
  });
  window.TopVPNPartnersAdmin={load:load};
}());
