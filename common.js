// 여러 페이지에서 함께 쓰는 헬퍼 (설정값은 config.js에서 고친다)

// '19:00' → '오후 7:00'
function fmtTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + String(m).padStart(2, '0');
}

// '2026-09-30' → '9월 30일 (수)'
function fmtDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return m + '월 ' + d + '일 (' + '일월화수목금토'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] + ')';
}

// '2026-09-30' → '2026.09.30'
function fmtDotDate(ymd) {
  return ymd.replace(/-/g, '.');
}

// D-day (한국 시간 기준): 'D-3' | 'D-DAY' | '' (지난 경우)
function ddayLabel() {
  const target = new Date(CONFIG.eventDate + 'T00:00:00+09:00');
  const now = new Date();
  const todayKst = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) + 'T00:00:00+09:00');
  const diff = Math.round((target - todayKst) / 86400000);
  if (diff > 0) return 'D-' + diff;
  if (diff === 0) return 'D-DAY';
  return '';
}

// 복사 후 버튼에 '복사되었습니다'를 잠깐 보여준다.
// 카톡 인앱 브라우저에는 navigator.clipboard가 없어서 execCommand를 먼저 쓴다.
async function copyText(text, btn) {
  if (btn.dataset.copied) return false;

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:absolute;left:-9999px;top:' + window.scrollY + 'px;font-size:16px;';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();

  if (!ok && navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {}
  }
  if (!ok) {
    window.prompt('아래 내용을 길게 눌러 복사해 주세요.', text);
    return false;
  }

  const original = btn.innerHTML;
  btn.dataset.copied = '1';
  btn.textContent = '복사되었습니다';
  setTimeout(() => { btn.innerHTML = original; delete btn.dataset.copied; }, 1500);
  return true;
}
