const escape = value => String(value ?? '').replace(/[&<>"']/g, x => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[x]));
const name = provider => provider === 'outlook' ? 'Outlook / Microsoft 365' : 'Gmail';
const pdfs = new Map();
export function rememberEmailPdf(url, fileName, content) {
  pdfs.set(url, { name: fileName, content });
  if (pdfs.size > 10) pdfs.delete(pdfs.keys().next().value);
}
async function api(fetcher, action, body) {
  const response = await fetcher('/api/email?action=' + action, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Email is temporarily unavailable.');
  return data;
}
async function connect(fetcher, provider) {
  const popup = window.open('about:blank', '_blank');
  try {
    const result = await api(fetcher, 'connect', { provider });
    if (!popup) throw new Error('Allow pop-ups to connect your email account. Your draft remains open.');
    popup.opener = null; popup.location.href = result.url;
  } catch (error) { popup?.close(); throw error; }
}
export async function openEmailSettings(fetcher) {
  document.getElementById('connectedEmailSettings')?.remove();
  const dialog = document.createElement('dialog'); dialog.id = 'connectedEmailSettings';
  dialog.style.cssText = 'width:min(760px,92vw);max-height:85vh;overflow:auto;border:1px solid #cbd5e1;border-radius:12px;padding:24px';
  dialog.innerHTML = '<h2>My email accounts</h2><p>Connect your own Outlook or Gmail account. LMS sends only when you click Send Email.</p><div data-accounts>Loading…</div><p data-error role="status"></p><button data-refresh>Refresh connections</button> <button data-log>Email activity</button> <button data-close>Close</button><div data-history></div>';
  document.body.append(dialog); dialog.showModal();
  const error = dialog.querySelector('[data-error]');
  const load = async () => {
    try {
      const data = await api(fetcher, 'status'); error.textContent = '';
      dialog.querySelector('[data-accounts]').innerHTML = data.providers.map(p => {
        const account = data.accounts.find(a => a.provider === p.provider);
        return `<p><strong>${name(p.provider)}</strong> — ${account ? escape(account.email) : p.configured ? 'Not connected' : 'Administrator setup needed'}<br><button data-connect="${p.provider}" ${p.configured ? '' : 'disabled'}>${account ? 'Reconnect' : 'Connect'}</button> ${account ? `<button data-disconnect="${p.provider}">Disconnect</button>` : ''}</p>`;
      }).join('');
      dialog.querySelectorAll('[data-connect]').forEach(button => button.onclick = async () => { try { await connect(fetcher, button.dataset.connect); error.textContent = 'Complete sign-in in the new tab, then select Refresh connections.'; } catch(e) { error.textContent = e.message; } });
      dialog.querySelectorAll('[data-disconnect]').forEach(button => button.onclick = async () => {
        if (!confirm('Disconnect this mailbox from LMS? You can reconnect later.')) return;
        try { await api(fetcher, 'disconnect', { provider: button.dataset.disconnect }); await load(); } catch(e) { error.textContent = e.message; }
      });
    } catch(e) { error.textContent = e.message; }
  };
  dialog.querySelector('[data-refresh]').onclick = load;
  dialog.querySelector('[data-log]').onclick = async () => {
    try {
      const data = await api(fetcher, 'log');
      dialog.querySelector('[data-history]').innerHTML = '<h3>Last 50 send requests</h3><p>Accepted means your provider accepted the email; it is not a delivery receipt. For Sending or Unknown, check Sent Items before trying again.</p>' + (data.entries.map(e => `<p><strong>${escape(e.status)}</strong> · ${escape(new Date(e.created_at).toLocaleString())}<br>${escape(e.sender)} → ${escape(e.recipients.join(', '))}<br>${escape(e.subject)}</p>`).join('') || '<p>No emails sent from LMS yet.</p>');
    } catch(e) { error.textContent = e.message; }
  };
  dialog.querySelector('[data-close]').onclick = () => { dialog.close(); dialog.remove(); };
  await load();
}
export function mountEmailDelivery({ host, saveButton, fetcher, messageText = '' }) {
  const panel = document.createElement('div'); panel.className = 'notice';
  panel.innerHTML = '<label>Send using <select data-provider><option value="">Email app (open draft)</option></select></label> <button type="button" data-settings>Connect / manage email</button> <button type="button" data-refresh>Refresh accounts</button><div data-attachments hidden><label>Attach PDFs (2 MB total) <input type="file" accept="application/pdf,.pdf" multiple data-files></label><div data-generated></div></div><p data-status role="status"></p>';
  host.append(panel);
  const select = panel.querySelector('[data-provider]'), status = panel.querySelector('[data-status]');
  const generated = [...pdfs.entries()].filter(([url]) => messageText.includes(url)).map(([,a]) => a);
  panel.querySelector('[data-generated]').innerHTML = generated.map((a, i) => `<label style="display:block"><input type="checkbox" data-pdf="${i}" checked> ${escape(a.name)}</label>`).join('');
  let busy = false, submitted = null;
  const change = () => {
    saveButton.textContent = select.value ? 'Send Email' : 'Open Email Draft';
    panel.querySelector('[data-attachments]').hidden = !select.value;
  };
  const load = async () => {
    try {
      const previous = select.value, data = await api(fetcher, 'status');
      if (!host.contains(panel) || submitted) return;
      select.innerHTML = '<option value="">Email app (open draft)</option>' + data.accounts.map(a => `<option value="${escape(a.provider)}">${escape(a.email)} (${name(a.provider)})</option>`).join('');
      if (data.accounts.some(a => a.provider === previous)) select.value = previous;
      status.textContent = data.accounts.length ? 'Select your mailbox to send directly, or use your email app.' : 'Connect your email account to send from LMS. Your draft stays here.';
      change();
    } catch(e) { if (host.contains(panel)) status.textContent = e.message + ' You can still open a draft in your email app.'; }
  };
  select.onchange = change;
  panel.querySelector('[data-settings]').onclick = () => openEmailSettings(fetcher);
  panel.querySelector('[data-refresh]').onclick = load;
  load();
  return {
    async send(values) {
      if (!select.value) return false;
      if (busy) return true;
      busy = true; saveButton.disabled = true;
      try {
        if (!submitted) {
          const attachments = [...panel.querySelectorAll('[data-pdf]:checked')].map(input => generated[Number(input.dataset.pdf)]);
          for (const file of panel.querySelector('[data-files]').files) {
            if (file.size > 2000000) throw new Error('PDF attachments must be under 2 MB total.');
            const bytes = new Uint8Array(await file.arrayBuffer()); let binary = '';
            for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
            attachments.push({ name: file.name, content: btoa(binary) });
          }
          if (attachments.reduce((sum,a) => sum + a.content.length * 0.75, 0) > 2000000) throw new Error('PDF attachments must be under 2 MB total. Use the secure PDF links or fewer attachments.');
          if (!confirm(`Send this email to ${values.to}${values.cc ? '\nCC: ' + values.cc : ''}?`)) return true;
          submitted = { ...values, provider: select.value, attachments, requestId: crypto.randomUUID() };
          panel.querySelectorAll('input,select,button').forEach(control => control.disabled = true);
        }
        const data = await api(fetcher, 'send', submitted);
        if (data.status === 'Accepted') {
          status.textContent = 'Email accepted by your provider. Check Sent Items for the sent message.';
          saveButton.textContent = 'Email submitted';
        } else {
          status.textContent = data.status === 'Rejected' ? 'Your provider rejected this email. Reconnect if needed, then open a new email to retry.' : 'Delivery is not confirmed. Check your mailbox Sent Items before opening a new email. This request will not be sent twice.';
        }
        saveButton.disabled = true;
      } catch(e) {
        status.textContent = e.message + (submitted ? ' Retry checks the same request without sending a duplicate.' : '');
        saveButton.disabled = false;
      } finally { busy = false; if (!submitted) saveButton.disabled = false; }
      return true;
    },
  };
}
