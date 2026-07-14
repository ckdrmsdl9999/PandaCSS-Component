# PandaCSS 행운 도장 컴포넌트

개발Ide:vscode

## 실행 방법

```bash
git clone https://github.com/ckdrmsdl9999/PandaCSS-Component.git  이후
cd PandaCSS-Component
npm install   # postinstall(prepare)에서 panda codegen이 자동 실행됩니다
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 시간대 테스트

URL 쿼리 파라미터로 판정 시간대를 강제할 수 있습니다.

- `http://localhost:5173/?test=morning`
- `http://localhost:5173/?test=lunch`
- `http://localhost:5173/?test=dinner`

페이지 상단의 "테스트 패널"에서도 버튼으로 전환할 수 있고, "오늘 상태 초기화" 버튼으로
로컬 저장된 하루치 참여 상태를 즉시 리셋할 수 있습니다. (상태는 `localStorage`에 실제 캘린더
날짜 기준으로 저장되므로, `?test=` 값을 바꿔도 그날 진행 상황은 유지됩니다 — 케이스를
이어서 재현하기 위한 의도된 동작입니다.)

## 보상 수령 Flow

1. 슬롯 버튼 클릭 → 안내 팝업
2. "외부 페이지로 이동" 클릭 → 안내 팝업은 닫히고 새 탭에서 목업 외부 페이지(`/external`)로 이동
   (별도의 "대기 중" 팝업은 없고, 기다리는 동안 해당 슬롯 버튼이 "로딩중..." 표시로 바뀝니다)
3. 목업 페이지에서 **3초 이상** 머문 뒤 탭을 닫거나 돌아오면
4. 원래 탭이 자동으로 감지해 조건 충족 시 보상 팝업, 3초 미만이면 실패 팝업을 띄웁니다

(연결할 실제 광고주 URL이 없어서, 외부 페이지는 동일 앱 내 `/external` 라우트로 목업 처리했습니다.
두 탭 간 통신은 `localStorage` + `storage` 이벤트로 구현했습니다.)

## 추가 기회 규칙

- 현재 시간대 슬롯은 항상 "정규" 참여 가능 (미참여 시)
- 지나간 시간대 중 **가장 최근에 미참여한 슬롯 1개**만 "추가 기회"로 복구 가능
- 그보다 더 이전에 놓친 슬롯은 그날 영구적으로 참여 불가
- 추가 기회는 하루 1회만 사용 가능 (사용 후에는 다른 슬롯도 복구 불가)
- 아침·점심·저녁 3개 슬롯을 모두 수령하면 4번째 보너스 슬롯이 열리며, 기본 Flow와 동일하게 동작

## 구조

```
src/
  components/
    Button/Button.jsx    variant · size · disabled · loading 지원 재사용 버튼
    Popup/Popup.jsx      오버레이 모달 (안내/성공/실패 공용)
  features/dailySlots/
    slotUtils.js          시간대 계산 + 추가 기회 규칙
    constants.js          3초 체류 기준값 등 공용 상수
    useDailySlots.js       일자별 슬롯 상태 (localStorage)
    useNow.js              실시간 모드에서 시간대 자동 갱신
    useTestSlotParam.js    ?test= 쿼리 파라미터 읽기/쓰기
    useVisitSession.js     외부 페이지 방문 세션 관리
    SlotCard.jsx           슬롯 1개 카드 UI
    DebugPanel.jsx         테스트용 시간대 강제 전환 패널
    DailySlotsBoard.jsx    전체 Flow 오케스트레이션
  pages/
    HomePage.jsx
    MockExternalPage.jsx  목업 "외부" 페이지 (/external)
  theme/recipes/button.recipe.js  PandaCSS 버튼 레시피
```

## 스택

React 19 (JS, no TypeScript) · Vite · PandaCSS
