// 송별회 설정 — 이 파일만 고치면 모든 페이지에 반영됩니다.
// 값이 빈 문자열('')이면 초대장에 '추후 공지'로 나오거나 해당 항목이 숨겨집니다.
// 고칠 때 작은따옴표('')와 줄 끝 쉼표(,)를 지워지지 않게 주의하세요.
const CONFIG = {
  eventDate: '2026-10-01',  // 행사 날짜 'YYYY-MM-DD' (D-day·캘린더 계산용)

  firstTime: '',            // 1차 시작 시간, 24시간 'HH:MM' (예: '19:00')
  firstPlace: '',           // 1차 장소 이름 (예: '○○고기집 역삼점')
  firstAddress: '',         // 1차 상세 주소 (주소 복사·캘린더에 사용)
  mapUrl: '',               // '지도 앱으로 보기' 링크: 네이버/카카오 지도 앱의 공유 → 링크 복사 주소 (예: 'https://naver.me/xxxx')
  mapEmbedUrl: '',          // 지도 영역: 구글 지도 > 공유 > 지도 퍼가기 코드에서 src="..." 안의 주소만

  secondPlace: '',          // 2차 장소 이름
  secondTime: '',           // 2차 시작 시간, 24시간 'HH:MM'

  rsvpDeadline: '',         // 회신 마감일 'YYYY-MM-DD' (예: '2026-09-30')
  hostContact: '',          // 문의처 (예: '홍길동 · 010-1234-5678')

  apiUrl: 'https://script.google.com/macros/s/AKfycbx6KxcPvRPr8vmazr_wsqKjHY_y6obnM_bhIsY0txrx41r9Z4BF1xtHlfT_N_idk9wmOg/exec' // Apps Script 웹 앱 주소 ('/exec'로 끝나는 주소. '/dev' 주소는 안 됨)
};
