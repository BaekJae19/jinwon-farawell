// 진원이 송별회 RSVP 백엔드 (Google Apps Script 웹 앱)
// 시트 'responses': name | first | second | message | createdAt | updatedAt
// 배포 방법은 README.md 참고.

const SHEET_NAME = 'responses';
const HEADERS = ['name', 'first', 'second', 'message', 'createdAt', 'updatedAt'];

// 응답 저장: 같은 이름(공백·대소문자 무시)이 있으면 그 행을 수정, 없으면 새 행 추가
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse(e.postData.contents);
    const name = String(body.name || '').trim().slice(0, 30);
    const first = ['yes', 'no', 'maybe'].indexOf(body.first) >= 0 ? body.first : '';
    if (!name || !first) return out_({ ok: false, error: 'invalid' });
    const second = first === 'yes' && (body.second === 'yes' || body.second === 'no') ? body.second : '';
    const message = String(body.message || '').trim().slice(0, 300);

    if (!lock.tryLock(10000)) return out_({ ok: false, error: 'busy' });
    const sheet = sheet_();
    const rows = sheet.getDataRange().getValues();
    const i = rows.findIndex((r, k) => k > 0 && norm_(r[0]) === norm_(name));
    const now = new Date();
    if (i > 0) {
      sheet.getRange(i + 1, 1, 1, HEADERS.length).setValues([[txt_(name), first, second, txt_(message), rows[i][4], now]]);
    } else {
      sheet.appendRow([txt_(name), first, second, txt_(message), now, now]);
    }
    SpreadsheetApp.flush(); // 잠금을 풀기 전에 기록을 확정해야 동시 제출 때 중복 행이 안 생긴다
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 응답 목록 조회: ?key= 가 스크립트 속성 ADMIN_KEY와 같을 때만
function doGet(e) {
  try {
    const adminKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
    if (!adminKey || !e || !e.parameter || e.parameter.key !== adminKey) {
      return out_({ ok: false, error: 'unauthorized' });
    }
    const responses = sheet_().getDataRange().getValues().slice(1)
      .filter((r) => String(r[0]).trim())
      .map((r) => ({
        name: String(r[0]),
        first: r[1],
        second: r[2],
        message: String(r[3]),
        createdAt: iso_(r[4]),
        updatedAt: iso_(r[5])
      }));
    return out_({ ok: true, responses: responses });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

// 예외가 나도 항상 JSON으로 답해야 브라우저에서 CORS 오류로 보이지 않는다
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 이름·메시지 앞에 '를 붙여 수식이나 숫자·날짜로 바뀌지 않게 저장한다 (읽으면 '가 빠진 값이 나온다)
function txt_(s) {
  return s ? "'" + s : '';
}

function norm_(v) {
  return String(v).replace(/\s+/g, '').toLowerCase();
}

function iso_(v) {
  return v instanceof Date ? v.toISOString() : String(v);
}
