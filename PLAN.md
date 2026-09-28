# PLAN — 진원이 송별회 초대장 + RSVP 사이트

## Context
- 2026-10-01(목) 송별회 참석 여부를 받는 모바일 초대장. 링크를 단톡방에 공유 → 대부분 **카카오톡 인앱 브라우저**(iOS WKWebView / Android WebView)로 열림.
- 오늘 2026-09-28, D-3. 단순·확실하게 동작하는 것이 최우선.
- 폴더(`bakjinwon/`)에는 `진원이 송별회 RSVP 사이트.pdf`와 원본 사진 5장만 있음. HTML/CSS 초안은 붙여넣은 텍스트에만 있으므로 **초안을 그대로 파일로 만든 뒤** TODO를 구현한다(구조·클래스 유지).
- 시간·장소 미정 → `config.js`에 빈 값으로 두고, 확정되면 그 파일만 고친다.
- 환경: python/magick/node 없음 → 이미지 처리는 PowerShell 5.1 + System.Drawing. git, curl.exe, Chrome, Edge(x86 경로) 있음.
- 이 계획은 3개 관점(백엔드 / 카톡 인앱·모바일 / 요구사항·디자인 충실도) 검토와 반박 검증을 거쳐 확정했다.

## 확정된 결정 (사용자 선택)
1. 미정 값 → "추후 공지"로 표시하고, 값이 없으면 의미 없는 요소(주소 복사·지도 앱 버튼·지도·연락처 등)는 숨김.
2. 지도 → `CONFIG.mapEmbedUrl`(구글 지도 '지도 퍼가기' iframe의 src)이 있으면 iframe, 없으면 지도 박스 숨김.
3. 캘린더 → 구글 캘린더 템플릿 링크 1개. 시작 시간이 비면 종일 일정.
4. 카톡 미리보기 → index.html에 OG 태그 + `images/og.jpg`. og:image는 절대 URL 필요 → 배포 주소가 정해지면 교체(README에 위치 표시).

## 사진
| 원본 | 픽셀 | EXIF 회전 | 표시 | 출력 |
|---|---|---|---|---|
| 단체사진.jpg | 4032x3024 | 6 → Rotate90FlipNone | 세로 | images/group.jpg (+ og.jpg) |
| 고기 굽는 진원이.jpg | 3024x4032 | 1 | 세로 | images/grill.jpg |
| 등산 가는 진원이.jpg | 3088x2316 | 6 → Rotate90FlipNone | 세로 | images/hike.jpg |
| 야구 진원.jpg | 4032x3024 | 3 → Rotate180FlipNone | 가로 | images/baseball.jpg |
| 고기 굽는 진원이와 규철이.jpg | 4284x5712 | 1 | 세로 | images/grill2.jpg |
- 5장 모두 GPS 태그 15개와 Display P3 ICC 프로필이 들어 있음 → GPS/EXIF는 제거하고 ICC(0x8773)만 유지.
- hero: 세로 3:4 사진을 390/346 박스에 넣으면 보이는 범위는 사진 높이의 66.5%. `50% 80%`면 무릎이 잘리고 천장이 많이 보임 → **`50% 95%`**(31.8~98.3%, 전원이 프레임 안에 들어옴).

## 파일 구조 (루트)
```
PLAN.md  README.md  .gitignore(/*.jpg, /*.pdf → 루트 원본·PDF 제외)
index.html  rsvp.html  done.html  admin.html  style.css
config.js      ← 미정 값 + apiUrl (사람이 고치는 유일한 파일)
common.js      ← fmtTime / fmtDate / fmtDotDate / ddayLabel / copyText (~40줄)
apps-script/Code.gs
images/{group,grill,hike,baseball,grill2,og}.jpg
```

## 단계

### 0. 준비
- 이 계획을 루트 `PLAN.md`로 저장.
- `git init` → 붙여넣은 초안 5개 파일을 **원문 그대로** 만들고 `draft as provided`로 커밋(이후 변경을 초안 대비 diff로 확인). 이후 커밋·push는 하지 않고 작업 결과는 diff로 남긴다.

### 1. config.js / common.js
- `config.js`: `const CONFIG = { eventDate:'2026-10-01', firstTime:'', firstPlace:'', firstAddress:'', mapUrl:'', mapEmbedUrl:'', secondPlace:'', secondTime:'', rsvpDeadline:'', hostContact:'', apiUrl:'' };` 항목마다 한 줄 주석(시간 'HH:MM' 24시간, 날짜 'YYYY-MM-DD', mapUrl은 네이버/카카오 지도 '공유 → 링크 복사' 주소, mapEmbedUrl은 iframe의 src 값만, apiUrl은 `/exec`로 끝나는 주소이며 `/dev`는 쓰지 않음).
- `common.js`: `fmtTime('19:00')→'오후 7:00'`, `fmtDate→'9월 30일 (수)'`, `fmtDotDate→'2026.09.30'`, `ddayLabel()`(초안 로직을 그대로 옮겨 '' / 'D-DAY' / 'D-n' 반환. 09-28=D-3, 10-01=D-DAY, 10-02='' 확인), `copyText(text)`는 boolean을 반환하고 다음 순서로 시도: ① textarea(readonly, 16px, top=scrollY) + `execCommand('copy')`를 동기 실행 ② 실패하면 `navigator.clipboard?.writeText` ③ 그것도 안 되면 `prompt()`. 카톡 웹뷰에는 navigator.clipboard가 없음.
- 각 페이지 스크립트는 **이벤트 연결과 reveal 옵저버를 먼저, CONFIG 렌더링을 마지막에** 둔다(config.js 오타가 나도 버튼·사진 애니메이션은 동작).

### 2. apps-script/Code.gs
- 시트에 바인딩된 스크립트 → `SpreadsheetApp.getActiveSpreadsheet()`.
- 헬퍼: `out_(o)`(ContentService JSON), `sheet_()`(`responses` 시트가 없으면 헤더와 함께 생성, doPost·doGet 공용), `txt_(s)`(비어 있지 않은 name·message 앞에 `'`를 붙여 수식 실행과 숫자·날짜 자동 변환 방지. getValues는 `'` 없이 돌려줌), `norm_(v)`(`String(v).replace(/\s+/g,'').toLowerCase()`).
- `doPost`: 본문 전체를 try/catch로 감싸 **항상 JSON 반환**(예외가 나면 HTML 오류 페이지가 가서 브라우저에서 CORS 실패로 보이기 때문). 잠그기 전에 파싱·검증: 이름은 trim 후 비면 `invalid`, 30자로 자름. first ∈ yes/no/maybe. second는 first=yes일 때만 yes/no, 그 외 ''. 메시지는 300자. → `getScriptLock().tryLock(10000)`, 실패하면 `busy` → `findIndex(norm_ 일치)`: 있으면 6열 전체 setValues(createdAt 유지, updatedAt=now), 없으면 appendRow → `SpreadsheetApp.flush()` → `{ok:true}` → finally에서 `releaseLock()`.
- `doGet`: 스크립트 속성 `ADMIN_KEY`가 없거나 `e.parameter.key`와 다르면 `{ok:false,error:'unauthorized'}`. 맞으면 이름이 빈 행은 거르고 `{ok:true,responses:[{name:String,first,second,message:String,createdAt:ISO,updatedAt:ISO}]}`.
- 프론트 호출 규칙: `fetch(apiUrl,{method:'POST',body:JSON.stringify(payload)})`로 보낸다. Content-Type을 지정하지 않으므로 text/plain 단순 요청이 되고 preflight가 없다. `mode:'no-cors'`는 쓰지 않는다. 응답은 항상 200이므로 성공 여부는 `json.ok`로 판단한다.

### 3. index.html
- `config.js`, `common.js` 연결. hero에 `object-position: 50% 95%` 적용.
- 일시: `fmtTime(firstTime)+' 1차 시작'`, 비면 '시간 추후 공지'.
- 장소: firstPlace, 비면 '장소 추후 공지'. 주소가 없으면 주소 줄과 '주소 복사'를 숨김.
- 지도: mapEmbedUrl이 있으면 `.map` 안에 iframe(border 0, 100%, `.map`에 overflow:hidden). 없으면 박스를 숨김. mapUrl이 없으면 '지도 앱' 버튼을 숨기고, 두 버튼이 모두 없으면 `.row`도 숨김.
- 특이사항: `2차 · 장소 / 시간`, 비면 `2차 · 장소·시간 추후 공지`.
- CTA: 마감일이 있으면 'n월 n일 (요일)까지 참석 여부를 알려주세요.', 없으면 '참석 여부를 알려주세요.'. 연락처가 없으면 캡션을 숨김.
- 복사·공유:
  - 링크 복사·공유는 `location.origin + location.pathname`을 쓴다.
  - 공유는 `navigator.share(...).catch(()=>{})`로 부른다. 취소해도 복사로 넘어가지 않는다. share가 없으면 링크 복사.
  - '복사되었습니다'는 복사에 성공했을 때만 보여준다. 원래 라벨은 `btn.dataset.label`에 한 번만 저장하고, 피드백이 떠 있는 동안 다시 누르면 무시한다(초안의 두 번 탭 버그 수정).
- OG: `og:title`, `og:description`('2026년 10월 1일(목) · 참석 여부를 알려주세요'), `og:image`(절대 URL 자리 표시). og:url은 넣지 않는다.
- `.link-sub`: `display:inline-flex; align-items:center; min-height:44px`.

### 4. rsvp.html → done.html
- rsvp:
  - localStorage `rsvp`가 있으면 이름·선택·메시지를 채우고, aria-pressed와 2차 영역 표시를 맞춘다(저장된 second가 ''이면 기본 'yes').
  - `#name`에 maxlength=30. 이름을 입력하면 에러 표시를 지운다. 마감 문구는 config에서 읽고, 없으면 '응답은 행사 전까지 수정할 수 있습니다.'.
  - payload에서 createdAt은 뺀다(서버 시간 사용). 전송은 AbortController + setTimeout 20초(AbortSignal.timeout은 iOS 16+에서만 동작해서 쓰지 않음).
  - `json.ok`이면 localStorage에 저장한 뒤 done으로 이동한다. 실패·busy·타임아웃·apiUrl 없음이면 alert를 띄우고 버튼을 되살린다.
  - `pageshow`에서 `e.persisted`이면 버튼을 다시 켠다(뒤로 가기 캐시로 돌아왔을 때 '보내는 중…'에 멈추는 문제 방지).
- done:
  - localStorage `rsvp`를 읽는다(초안의 sessionStorage를 이것으로 바꿈, 리다이렉트는 없음).
  - 캘린더 링크: `https://calendar.google.com/calendar/render?` + URLSearchParams(action=TEMPLATE, text, dates, ctz=Asia/Seoul, location=장소+주소, details=초대장 URL).
  - dates: 시간이 없으면 `20261001/20261002`(종일). 있으면 `new Date(eventDate+'T'+firstTime+':00+09:00')`부터 3시간(done.html에 고정값)을 `toISOString()` 기반 `YYYYMMDDTHHMMSSZ`로 만든다.
  - 카톡 UA(`/KAKAOTALK/i`)이면 `kakaotalk://web/openExternal?url=`로 감싸서 로그인된 외부 브라우저로 연다. 비공식 스킴이라 실기기에서 확인하고, 안 되면 일반 링크로 되돌린다. 카톡이 아니면 `target=_blank rel=noopener`.

### 5. admin.html
- `?key=`를 읽어 `apiUrl+'?key='+encodeURIComponent(key)`로 GET. 불러오는 동안 `#empty`에 '불러오는 중…'. 키가 없거나 틀리거나 네트워크 오류이면 그 이유를 `#empty`에 표시.
- '응답 일시'는 updatedAt을 쓰고 최신순으로 정렬한다. CSV에도 같은 기준을 적용한다. 초안의 escapeHtml은 행 렌더링에 그대로 유지한다(XSS 방지).
- 부제는 `10. 1 (목) · D-n · 회신 마감 YYYY.MM.DD`로, PDF를 따른다. D-day나 마감일이 비면 그 부분은 뺀다.
- copy-invite는 `copyText(new URL('index.html', location.href).href)`를 쓴다(key가 빠진 주소가 복사됨).
- PDF 반영: 헤더 버튼에 링크·다운로드 아이콘, 검색창에 돋보기 아이콘(인라인 SVG). '초대장 편집' 버튼과 페이지네이션은 기능이 없고 인원이 적어서 제외한다. 통계 단위는 초안대로(전체 '건', 나머지 '명').
- 한마디 열: `td.msg`의 max-width가 표 셀에서는 먹지 않아 표가 한없이 넓어짐 → 셀 안에 div를 두고 거기에 max-width 360px + 말줄임을 준다(초안 의도 유지, 전체 문장은 title과 CSV로 확인).
- 모바일:
  - 좁은 화면에서는 헤더를 줄바꿈하고 검색창을 100% 폭으로(900px media query에 추가).
  - `@media (pointer:coarse){ .btn-sm, .filter, .search { min-height:44px } }`로 터치 영역만 키운다. 데스크톱 픽셀은 PDF 그대로.
  - 가로 스크롤은 `.table-wrap`에서만 생기게 하고, 페이지 전체가 옆으로 밀리지 않는지 확인한다.

### 6. 이미지
- PowerShell 인라인 스크립트로 처리(절대 경로 + `-LiteralPath` 사용, `images\` 폴더 먼저 생성):
  1. 파일마다 위 표대로 RotateFlip을 적용하고, 회전 후의 Width/Height를 기준으로 삼는다.
  2. `Bitmap(1080,h)`에 HighQualityBicubic으로 다시 그린다.
  3. 원본의 0x8773(ICC)만 `SetPropertyItem`으로 복사한다.
  4. JPEG 품질 80(`[long]80`)으로 저장하고, finally에서 Dispose.
- og.jpg: 단체사진에서 사람이 있는 구간(높이 49~95%)을 1200x630으로 잘라낸다.
- 결과 확인:
  - 각 출력이 가로 1080(og는 1200)인지, GPS와 0x0112가 없는지, ICC가 남았는지 확인한다.
  - ICC가 빠졌으면 `FromFile($p,$true)` 방식(sRGB로 변환)으로 바꾼다.
  - 원본과 나란히 놓고 방향과 색을 눈으로 비교한다.

### 7. README.md
- **Apps Script**:
  1. 개인 gmail로 시트를 만들고 파일 > 설정 > 시간대를 '서울'로 둔다.
  2. 확장 프로그램 > Apps Script에서 Code.gs를 붙여 넣고 저장한다.
  3. 프로젝트 설정 > 스크립트 속성에 `ADMIN_KEY`를 추가한다(영문과 숫자만, 16자 이상, 예시값 하나 제시).
  4. 배포 > 새 배포 > 웹 앱을 고르고, 실행: 나, 액세스: **'모든 사용자'**로 둔다('Google 계정이 있는 모든 사용자'가 아님).
  5. '확인되지 않은 앱' 화면이 나오면 고급 → 이동 → 허용.
  6. `/exec` URL을 config.js의 apiUrl에 넣는다.
  7. 코드를 고친 뒤에는 배포 관리 > 편집 > **새 버전**으로 올린다(URL이 유지됨). 실수로 '새 배포'를 눌렀다면 새 URL을 config.js에 넣는다.
- **config.js**: 수정한 뒤 push하고 index와 rsvp에서 값이 반영됐는지 확인한다. GitHub Pages 캐시 때문에 최대 약 10분 걸릴 수 있고, 급하면 `?v=2`를 붙여 연다.
- **GitHub Pages**: git으로 push한 뒤 Settings > Pages > main / root. Netlify 폴더 드래그 배포는 .gitignore를 무시해서 GPS가 든 원본 사진까지 올라가므로 쓰지 않는다.
- **OG**:
  - 링크를 처음 공유하기 **전에** og:image를 절대 URL로 바꾼다.
  - 미리보기가 옛날 것으로 남으면 `developers.kakao.com/tool/clear/og`에서 초기화한다.
- **관리자**:
  - 주소는 `.../admin.html?key=...` 형식이다.
  - 카톡 인앱이 아닌 일반 브라우저로 연다(카톡에서는 CSV 다운로드가 안 됨).
  - 동명이인은 한 사람으로 합쳐지므로 이름 뒤에 구분 표시를 붙이라고 안내한다.
- **캘린더**: 구글 캘린더에만 추가되고, 시간이 확정되기 전에 추가한 일정은 종일 일정으로 남는다는 한계를 적는다.
- **실기기 체크리스트**(아래 검증 B).

## 하지 않을 것
- 프레임워크, 빌드 도구, .ics, 페이지네이션, '초대장 편집', 스토리지 try/catch, D-day 로직 재작성, calendarHours 설정. 디자인 값(색·간격·모서리) 변경. admin key 하드코딩.
- 확정 콘텐츠(날짜 문구, 인사말, 캡션)는 HTML에 그대로 둔다.

## 검증
**A. 로컬에서 에이전트가 직접 확인 (산출물은 scratchpad에만)**
1. 사이트 전체를 scratchpad로 복사하고, 복사본의 config.js에 테스트 값과 `apiUrl=http://localhost:<port>/api`를 넣는다. 원본 config.js는 건드리지 않는다.
2. PowerShell HttpListener를 띄운다. 정적 파일을 서빙하고, 가짜 `/api`를 둔다. 가짜 API는 Apps Script와 같은 JSON을 돌려주고, 메모리에서 이름 기준으로 upsert하며, `ACAO:*` 헤더를 붙인다.
3. 같은 출처의 iframe 테스트 러너 페이지와 Chrome headless(`--user-data-dir` scratchpad, `--dump-dom`, `--virtual-time-budget`)로 다음을 확인한다:
   - 이름 없이 제출하면 인라인 에러가 뜬다.
   - 제출하면 done으로 가고 요약이 맞다.
   - 같은 이름으로 다시 내도 1건이다(createdAt 유지, updatedAt 갱신).
   - rsvp를 다시 열면 값이 채워져 있다.
   - 1차가 불참이면 2차가 숨겨지고 저장값은 ''이다.
   - admin의 통계, 필터, 검색, 키 오류 문구가 맞다.
   - 캘린더 URL의 dates가 종일/시간 지정 두 경우 모두 맞다.
4. Code.gs 로직을 테스트한다. 브라우저에서 SpreadsheetApp, LockService, ContentService, PropertiesService를 가짜 객체로 바꿔 끼우고 upsert, 검증 거부, 키 미설정·불일치, 예외 시 JSON 반환을 확인한다.
5. 스크린샷을 찍는다. `.reveal`에 is-visible을 강제로 붙이고 전체 페이지 캡처를 한다. 크기는 index/rsvp/done 390px, admin 1280px과 390px. config를 비운 버전과 채운 버전 두 가지로 PDF 4페이지와 비교한다. 이 스크린샷은 레이아웃 확인용으로만 본다.

**B. 배포 후 사용자 실기기 체크리스트 (README + 작업 완료 보고)**
- Pages URL을 카톡 '나와의 채팅'으로 보내고 iPhone 1대, Android 1대의 카톡 인앱 브라우저에서 확인한다:
  1. 미리보기 카드가 제대로 뜨는지, D-day와 사진 페이드인이 보이는지
  2. 주소 복사·링크 복사 후 채팅 입력창에 붙여넣기
  3. 공유
  4. '테스트' 이름으로 참석 + 함께해요 제출 → done 요약 확인 → 뒤로 가기 후 다시 제출 가능한지
  5. rsvp를 다시 열어 값이 채워졌는지 확인 → 불참으로 바꿔 제출 → 시트에 행이 1개이고 second는 비었으며 updatedAt이 바뀌었는지
  6. 캘린더에 추가(외부 브라우저로 열리는지)
  7. 한마디를 입력하는 중 키보드가 올라와도 하단 바가 글을 가리지 않는지, 입력창을 누를 때 화면이 확대되지 않는지
  8. 지도 앱으로 보기
- admin을 올바른 키와 틀린 키로 열어 숫자가 시트와 같은지 확인한다.
- iPhone Safari와 Android Chrome에서도 제출 → done을 한 번씩 해 본다.
- 마지막으로 테스트 행을 삭제한다.

---

## 진행 상황 (2026-09-28)
- [x] 0~7단계 구현 완료 (초안 기준 커밋 `draft as provided` 대비 변경은 `git diff`로 확인)
- [x] 검증 A: 흐름 테스트 99/99, Code.gs 목(mock) 테스트 28/28, 390px 가로 넘침 없음, 초대장 터치 영역 44px 이상, 스크린샷을 PDF와 비교
- 계획과 다르게 구현한 부분
  - `copyText(text, btn)`: 초안의 함수 형태를 유지하고 복사 피드백까지 맡김. 두 번 탭은 `data-copied` 표시로 막음
  - 공유: 초안의 `try { await navigator.share } catch {}`가 이미 취소 시 복사로 넘어가지 않아 그대로 둠
  - README는 공개되므로 ADMIN_KEY 예시값은 넣지 않음
  - 테스트는 Edge 대신 Chrome headless로, 결과는 --dump-dom 대신 테스트 서버로 받음(virtual time이 iframe 흐름을 기다리지 않음)
- [ ] 남은 일(사용자): Apps Script 배포 → `config.js`의 `apiUrl` 입력 → GitHub Pages 배포 → og:image 절대 주소 교체 → README 5장 실기기 체크리스트
