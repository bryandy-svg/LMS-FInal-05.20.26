(function () {
  'use strict';

  var TAB_ID = 'mechanicCurrentWorkTab';
  var STYLE_ID = 'mechanicCurrentWorkTabStyle';
  var NOTICE_ID = 'mechanicCurrentWorkNotice';

  function bodyText() {
    return document.body ? document.body.innerText || '' : '';
  }

  function mechanicPage() {
    return /My Work Orders/i.test(bodyText());
  }

  function activeWo() {
    var activeCardNumber = document.querySelector('.mechanic-card-list > .mechanic-card.active .mechanic-card-head strong');
    if (activeCardNumber) return (activeCardNumber.getAttribute('data-wo-no') || activeCardNumber.textContent || '').trim();
    var match = bodyText().match(/(?:Still\s+(?:logged|clocked)\s+in\s+on|clocked\s+in\s+on)\s+([^\s]+)/i);
    return match ? match[1] : '';
  }

  function findButton(pattern) {
    var all = Array.prototype.slice.call(document.querySelectorAll('button'));
    for (var i = 0; i < all.length; i += 1) {
      if (pattern.test((all[i].textContent || '').trim())) return all[i];
    }
    return null;
  }

  function tabButtons() {
    return {
      open: findButton(/^Open Work Orders/i),
      closed: findButton(/^Closed Work Orders/i)
    };
  }

  function findSearchInput() {
    var mechanicSearch = document.getElementById('mechanicWoSearch');
    if (mechanicSearch) return mechanicSearch;
    var inputs = Array.prototype.slice.call(document.querySelectorAll('input[type="search"], input'));
    for (var i = 0; i < inputs.length; i += 1) {
      var input = inputs[i];
      var hint = ((input.placeholder || '') + ' ' + (input.getAttribute('aria-label') || '')).toLowerCase();
      if (hint.indexOf('wo') >= 0 || hint.indexOf('work order') >= 0 || hint.indexOf('asset') >= 0 || hint.indexOf('issue') >= 0) {
        return input;
      }
    }
    return null;
  }

  function showOnlyCurrentCard(wo) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.mechanic-card-list > .mechanic-card'));
    var visible = 0;
    cards.forEach(function (card) {
      var number = card.querySelector('.mechanic-card-head strong');
      var cardWo = number ? (number.getAttribute('data-wo-no') || number.textContent || '').trim() : '';
      var isCurrent =
        card.classList.contains('active') ||
        (cardWo && cardWo.toLowerCase() === wo.toLowerCase());
      card.style.display = isCurrent ? '' : 'none';
      if (isCurrent) visible += 1;
    });
    return visible;
  }

  function setInputValue(input, value) {
    if (!input) return false;
    var descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function setActive(tab) {
    Array.prototype.slice.call(document.querySelectorAll('.mechanic-current-tab-active')).forEach(function (node) {
      node.classList.remove('mechanic-current-tab-active');
    });
    if (tab) tab.classList.add('mechanic-current-tab-active');
  }

  function notice(message, kind) {
    var tab = document.getElementById(TAB_ID);
    var host = tab ? tab.closest('.card, section, main, .module-panel') || tab.parentElement : document.querySelector('main') || document.body;
    var el = document.getElementById(NOTICE_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = NOTICE_ID;
      el.className = 'mechanic-current-notice';
      host.insertBefore(el, host.children[1] || null);
    }
    el.textContent = message;
    el.dataset.kind = kind || 'info';
  }

  function resetNotice() {
    var el = document.getElementById(NOTICE_ID);
    if (el) el.remove();
    setActive(null);
  }

  function showCurrent() {
    var wo = activeWo();
    var tab = document.getElementById(TAB_ID);
    var buttons = tabButtons();

    if (!wo) {
      setActive(tab);
      setInputValue(findSearchInput(), '__no_current_work_order__');
      notice('No work order is currently clocked in.', 'empty');
      return;
    }

    if (buttons.open) buttons.open.click();
    window.setTimeout(function () {
      setInputValue(findSearchInput(), wo);
      showOnlyCurrentCard(wo);
      setActive(tab);
      notice('Showing currently working on ' + wo + '.', 'active');
    }, 80);
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#mechanicCurrentWorkTab { white-space: normal; min-height: 44px; }',
      '#mechanicCurrentWorkTab.mechanic-current-tab-active { border-color: #60717d; background: #e7edf1; color: #20303a; box-shadow: inset 0 0 0 1px #60717d; }',
      '.mechanic-current-notice { margin: 12px 0; padding: 12px 14px; border: 1px solid #cfd8df; border-radius: 8px; background: #f7fafb; color: #253540; font-weight: 700; }',
      '.mechanic-current-notice[data-kind="empty"] { background: #fff8ed; border-color: #e5c78c; }',
      '@media (max-width: 760px) { #mechanicCurrentWorkTab { width: 100%; font-size: 15px; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function installTab() {
    if (!mechanicPage()) return;

    var buttons = tabButtons();
    if (!buttons.open || !buttons.closed || !buttons.closed.parentElement) return;

    installStyle();

    var tab = document.getElementById(TAB_ID);
    if (!tab) {
      tab = buttons.open.cloneNode(true);
      tab.id = TAB_ID;
      tab.type = 'button';
      buttons.closed.parentElement.insertBefore(tab, buttons.closed);
      tab.addEventListener('click', function (event) {
        event.preventDefault();
        showCurrent();
      });
      buttons.open.addEventListener('click', resetNotice, true);
      buttons.closed.addEventListener('click', resetNotice, true);
    }

    var wo = activeWo();
    tab.textContent = wo ? 'Currently Working On ' + wo : 'Currently Working On 0';
  }

  function boot() {
    installTab();
    window.setTimeout(installTab, 300);
    window.setTimeout(installTab, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.addEventListener('hashchange', boot);
  window.addEventListener('popstate', boot);
  window.setInterval(installTab, 2000);
})();
