(function () {
  "use strict";
  var ui = window.TopVPNPartners;
  var key = "topvpn_account_token", token = localStorage.getItem(key) || "";
  var login = document.getElementById("partnerLogin"), work = document.getElementById("partnerWork"), notice = document.getElementById("partnerNotice");
  async function load() {
    if (!token) { login.hidden=false;work.hidden=true;return; }
    try {
      var data=await ui.request("/partner",token);
      document.getElementById("partnerSummary").innerHTML=ui.summary(data.partner)+ui.history(data.partner);
      login.hidden=true;work.hidden=false;ui.notice(notice,"");
    } catch (error) {
      ui.notice(notice,error.message,true);
      login.hidden=false;work.hidden=true;
      if(error.status===401) {token="";localStorage.removeItem(key);}
    }
  }
  login.addEventListener("submit",async function(event){
    event.preventDefault();var button=login.querySelector("button");button.disabled=true;
    try {var data=await ui.request("/sessions","",{method:"POST",body:JSON.stringify({username:document.getElementById("partnerUsername").value.trim(),password:document.getElementById("partnerPassword").value})});
      token=data.token;localStorage.setItem(key,token);document.getElementById("partnerPassword").value="";await load();
    } catch(error) {ui.notice(notice,error.message,true);} finally {button.disabled=false;}
  });
  document.getElementById("partnerRefresh").addEventListener("click",load);
  document.getElementById("partnerLogout").addEventListener("click",function(){localStorage.removeItem(key);token="";document.getElementById("partnerSummary").replaceChildren();load();});
  document.getElementById("partnerChangePassword").addEventListener("submit",async function(event){
    event.preventDefault();var form=event.currentTarget,button=form.querySelector("button");button.disabled=true;
    try {await ui.request("/account/password",token,{method:"PATCH",body:JSON.stringify({currentPassword:form.elements.currentPassword.value,newPassword:form.elements.newPassword.value})});form.reset();ui.notice(notice,"Пароль сохранён");}
    catch(error){ui.notice(notice,error.message,true);}finally{button.disabled=false;}
  });
  load();
}());
