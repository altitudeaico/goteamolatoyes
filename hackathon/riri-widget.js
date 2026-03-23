/**
 * Riri Widget — standalone chat bubble for resource pages
 * Usage: include this script, then call initRiri({ context, greeting, suggestions })
 */

const RIRI_SUPABASE_URL = 'https://pwpxachynrhmkeowxmhg.supabase.co/functions/v1/riri';
const RIRI_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3cHhhY2h5bnJobWtlb3d4bWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODM4NTMsImV4cCI6MjA4OTA1OTg1M30.vMzH379AZ--rY-YJljDDOwJ5xpNnJcq4dH_WfX8Yy4U';

const RIRI_BASE_SYSTEM = `You are Riri, the AI guide and coach for Code Quest — a coding hackathon for the Olatoye family children (ages 8–14).

Your personality:
- Warm, fun, encouraging — like a cool older sister who is also really smart
- You use emojis naturally but not excessively
- You speak simply — your audience is 8 to 14 year olds
- SHORT answers (2-4 sentences) unless a detailed explanation is needed
- You never make kids feel stupid for asking anything
- Always end with a clear action or follow-up question to keep them engaged

The kids: Elsie (9, Gravesend), Emma (Gravesend), Hannah (12, Middleton), Sophia (Middleton), Theodore (New York), Ezekiel (Middleton), Arthur (New York).

The hackathon is Saturday 4th April 2026 at 6:30pm. Teams: Girls (Elsie, Hannah, Sophia) vs Boys (Theodore, Ezekiel, Arthur).`;

function initRiri({ context, greeting, suggestions = [] }) {
  // Inject styles
  if (!document.getElementById('riri-widget-styles')) {
    const style = document.createElement('style');
    style.id = 'riri-widget-styles';
    style.textContent = `
      #riri-widget-btn {
        position: fixed;
        bottom: 24px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ec4899, #f97316);
        border: none;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 6px 20px rgba(236,72,153,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        transition: transform 0.2s;
        animation: riri-bob 3s ease-in-out infinite;
        font-family: sans-serif;
      }
      /* ASK RIRI label */
      #riri-widget-btn::before {
        content: 'ASK RIRI';
        position: absolute;
        top: -22px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.65);
        color: white;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.5px;
        padding: 3px 8px;
        border-radius: 100px;
        white-space: nowrap;
        font-family: 'Nunito', sans-serif;
      }
      @keyframes riri-bob {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      #riri-widget-btn:hover { transform: scale(1.1) !important; animation: none; }
      #riri-widget-notif {
        position: absolute;
        top: -3px; right: -3px;
        width: 16px; height: 16px;
        background: #fbbf24;
        border-radius: 50%;
        border: 2px solid white;
        display: none;
      }
      #riri-widget-notif.show { display: block; }

      #riri-widget-panel {
        position: fixed;
        bottom: 96px;
        right: 16px;
        width: calc(100vw - 32px);
        max-width: 360px;
        background: white;
        border-radius: 24px;
        box-shadow: 0 12px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 9998;
        max-height: 70vh;
        opacity: 0;
        transform: translateY(16px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.2s, transform 0.2s;
      }
      #riri-widget-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }
      .riri-panel-header {
        background: linear-gradient(135deg, #ec4899, #f97316);
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .riri-panel-avatar {
        width: 38px; height: 38px;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
      }
      .riri-panel-info { flex: 1; }
      .riri-panel-info strong { display: block; color: white; font-size: 15px; font-weight: 900; font-family: 'Nunito', sans-serif; }
      .riri-panel-info span { color: rgba(255,255,255,0.8); font-size: 12px; font-family: 'Nunito', sans-serif; }
      .riri-panel-close {
        background: rgba(255,255,255,0.2);
        border: none; color: white;
        width: 30px; height: 30px;
        border-radius: 50%; cursor: pointer;
        font-size: 16px; font-family: sans-serif;
        display: flex; align-items: center; justify-content: center;
      }
      .riri-panel-close:hover { background: rgba(255,255,255,0.35); }

      .riri-suggestions-row {
        display: flex;
        gap: 6px;
        padding: 10px 12px 4px;
        overflow-x: auto;
        scrollbar-width: none;
        flex-shrink: 0;
        background: #fdf2f8;
        border-bottom: 1px solid #fce7f3;
      }
      .riri-suggestions-row::-webkit-scrollbar { display: none; }
      .riri-suggestion-chip {
        background: white;
        border: 1.5px solid #f9a8d4;
        color: #be185d;
        border-radius: 100px;
        padding: 5px 12px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        font-family: 'Nunito', sans-serif;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      .riri-suggestion-chip:hover { background: #fdf2f8; }

      .riri-msgs {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #fafafa;
        min-height: 160px;
      }
      .riri-msg { display: flex; gap: 8px; align-items: flex-end; }
      .riri-msg.user { flex-direction: row-reverse; }
      .riri-msg-avatar {
        width: 26px; height: 26px;
        border-radius: 50%;
        background: linear-gradient(135deg,#ec4899,#f97316);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; flex-shrink: 0;
      }
      .riri-bubble {
        max-width: 82%;
        padding: 9px 13px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.5;
        font-family: 'Nunito', sans-serif;
        font-weight: 600;
        word-break: break-word;
      }
      .riri-msg:not(.user) .riri-bubble {
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .riri-msg.user .riri-bubble {
        background: linear-gradient(135deg,#ec4899,#f97316);
        color: white;
        border-bottom-right-radius: 4px;
      }
      .riri-typing {
        display: flex; gap: 4px; align-items: center;
        padding: 10px 14px;
        background: white;
        border-radius: 18px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        width: fit-content;
      }
      .riri-typing span {
        width: 7px; height: 7px;
        background: #f9a8d4;
        border-radius: 50%;
        animation: riri-dot 1.2s ease-in-out infinite;
      }
      .riri-typing span:nth-child(2) { animation-delay: 0.2s; }
      .riri-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes riri-dot {
        0%,60%,100% { transform: translateY(0); opacity:0.4; }
        30% { transform: translateY(-6px); opacity:1; }
      }

      /* Markdown in riri bubble */
      .riri-bubble strong { font-weight: 900; }
      .riri-bubble em { font-style: italic; }
      .riri-bubble ul { padding-left: 16px; margin: 4px 0; }
      .riri-bubble li { margin: 2px 0; }
      .riri-bubble code {
        background: #f3f4f6;
        border-radius: 4px;
        padding: 1px 5px;
        font-family: monospace;
        font-size: 12px;
        color: #4f46e5;
      }

      .riri-input-row {
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        background: white;
        border-top: 1px solid #f3f4f6;
        flex-shrink: 0;
      }
      .riri-input {
        flex: 1;
        border: 2px solid #fce7f3;
        border-radius: 100px;
        padding: 9px 16px;
        font-family: 'Nunito', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        outline: none;
        background: #fdf2f8;
      }
      .riri-input:focus { border-color: #ec4899; background: white; }
      .riri-input::placeholder { color: #f9a8d4; }
      .riri-send {
        width: 38px; height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg,#ec4899,#f97316);
        border: none; color: white; font-size: 16px;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: transform 0.1s;
      }
      .riri-send:active { transform: scale(0.9); }
      .riri-send:disabled { opacity: 0.4; }
    `;
    document.head.appendChild(style);
  }

  // Inject HTML
  const btn = document.createElement('button');
  btn.id = 'riri-widget-btn';
  btn.innerHTML = `👧🏾<div id="riri-widget-notif"></div>`;
  btn.onclick = toggleRiriWidget;
  document.body.appendChild(btn);

  const suggestionsHtml = suggestions.map(s =>
    `<button class="riri-suggestion-chip" onclick="ririWidgetSuggest(this)">${s}</button>`
  ).join('');

  const panel = document.createElement('div');
  panel.id = 'riri-widget-panel';
  panel.innerHTML = `
    <div class="riri-panel-header">
      <div class="riri-panel-avatar">👧🏾</div>
      <div class="riri-panel-info">
        <strong>Riri</strong>
        <span>Your Code Quest guide 🚀</span>
      </div>
      <button class="riri-panel-close" onclick="toggleRiriWidget()">✕</button>
    </div>
    ${suggestions.length ? `<div class="riri-suggestions-row">${suggestionsHtml}</div>` : ''}
    <div class="riri-msgs" id="riri-widget-msgs"></div>
    <div class="riri-input-row">
      <input class="riri-input" id="riri-widget-input" placeholder="Ask Riri anything..."
        onkeydown="if(event.key==='Enter') ririWidgetSend()">
      <button class="riri-send" id="riri-widget-send" onclick="ririWidgetSend()">➤</button>
    </div>
  `;
  document.body.appendChild(panel);

  // State
  window._ririWidgetOpen = false;
  window._ririWidgetHistory = [];
  window._ririWidgetSystem = RIRI_BASE_SYSTEM + '\n\n## Current page context\n' + context;
  window._ririWidgetGreeted = false;

  // Notification dot after delay
  setTimeout(() => {
    if (!window._ririWidgetOpen) {
      document.getElementById('riri-widget-notif').classList.add('show');
    }
  }, 4000);

  // Auto-greeting after 5s
  setTimeout(() => {
    if (!window._ririWidgetGreeted) {
      ririWidgetAddMsg('riri', greeting);
      window._ririWidgetGreeted = true;
    }
  }, 5000);
}

function toggleRiriWidget() {
  window._ririWidgetOpen = !window._ririWidgetOpen;
  document.getElementById('riri-widget-panel').classList.toggle('open', window._ririWidgetOpen);
  document.getElementById('riri-widget-notif').classList.remove('show');

  if (window._ririWidgetOpen && !window._ririWidgetGreeted) {
    window._ririWidgetGreeted = true;
    // Greeting already set via setTimeout, trigger immediately if opened early
    const greeting = document.getElementById('riri-widget-panel').dataset.greeting;
    if (greeting) ririWidgetAddMsg('riri', greeting);
  }
  if (window._ririWidgetOpen) {
    setTimeout(() => document.getElementById('riri-widget-input')?.focus(), 200);
  }
}

function ririWidgetRenderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function ririWidgetAddMsg(from, text) {
  const msgs = document.getElementById('riri-widget-msgs');
  const typing = document.getElementById('riri-widget-typing');
  if (typing) typing.remove();
  const div = document.createElement('div');
  div.className = `riri-msg ${from === 'user' ? 'user' : ''}`;
  const rendered = from === 'riri' ? ririWidgetRenderMarkdown(text) : text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  div.innerHTML = from === 'riri'
    ? `<div class="riri-msg-avatar">👧🏾</div><div class="riri-bubble">${rendered}</div>`
    : `<div class="riri-bubble">${rendered}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function ririWidgetShowTyping() {
  const msgs = document.getElementById('riri-widget-msgs');
  const div = document.createElement('div');
  div.className = 'riri-msg';
  div.id = 'riri-widget-typing';
  div.innerHTML = `<div class="riri-msg-avatar">👧🏾</div><div class="riri-typing"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function ririWidgetSuggest(btn) {
  document.getElementById('riri-widget-input').value = btn.textContent;
  ririWidgetSend();
}

async function ririWidgetSend() {
  const input = document.getElementById('riri-widget-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  // Open panel if not open
  if (!window._ririWidgetOpen) toggleRiriWidget();

  ririWidgetAddMsg('user', msg);
  window._ririWidgetHistory.push({ role: 'user', content: msg });

  const sendBtn = document.getElementById('riri-widget-send');
  sendBtn.disabled = true;
  ririWidgetShowTyping();

  try {
    const res = await fetch(RIRI_SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + RIRI_ANON_KEY
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: window._ririWidgetSystem,
        messages: window._ririWidgetHistory
      })
    });
    const data = await res.json();
    const reply = data.content?.[0]?.text || "Hmm, I couldn't think of a reply! Try asking me again 😅";
    ririWidgetAddMsg('riri', reply);
    window._ririWidgetHistory.push({ role: 'assistant', content: reply });
    if (window._ririWidgetHistory.length > 20) window._ririWidgetHistory = window._ririWidgetHistory.slice(-20);
  } catch(e) {
    ririWidgetAddMsg('riri', "Connection hiccup — try again in a sec! 😅");
  }

  sendBtn.disabled = false;
  input.focus();
}
