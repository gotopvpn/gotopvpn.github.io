(function () {
  "use strict";
  var key = "topvpn_referral_v1";
  var code = "";
  try {
    var saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved && Number.isFinite(saved.at) && saved.at <= Date.now() && Date.now() - saved.at < 30 * 86400000 && /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(saved.code)) code = saved.code;
    else localStorage.removeItem(key);
    var incoming = (new URLSearchParams(location.search).get("ref") || "").trim().toUpperCase();
    if (!code && /^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(incoming)) {
      code = incoming;
      localStorage.setItem(key, JSON.stringify({ code: code, at: Date.now() }));
    }
  } catch (_) {}
  window.TopVPNReferral = { code: code };
}());
