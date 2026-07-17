# PandaCSS 행운 도장 컴포넌트


## 실행 방법

```bash
git clone https://github.com/ckdrmsdl9999/PandaCSS-Component.git
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
    Button/Button.tsx    variant · size · disabled · loading 지원 재사용 버튼 (TS)
    Popup/Popup.jsx      오버레이 모달 (안내/성공/실패 공용)
  features/dailySlots/
    slotUtils.ts          시간대 계산 + 추가 기회 규칙 + 도메인 타입 (TS)
    constants.ts          3초 체류 기준값 등 공용 상수 (TS)
    storage.ts             localStorage 제네릭 read/write 헬퍼 (TS)
    useDailySlots.ts       일자별 슬롯 상태 (localStorage) (TS)
    useNow.ts              실시간 모드에서 시간대 자동 갱신 (TS)
    useTestSlotParam.ts    ?test= 쿼리 파라미터 읽기/쓰기 (TS)
    useVisitSession.js     외부 페이지 방문 세션 관리
    SlotCard.jsx           슬롯 1개 카드 UI
    DebugPanel.jsx         테스트용 시간대 강제 전환 패널
    DailySlotsBoard.jsx    전체 Flow 오케스트레이션
  pages/
    HomePage.jsx
    MockExternalPage.jsx  목업 "외부" 페이지 (/external)
  theme/recipes/button.recipe.js  PandaCSS 버튼 레시피
```

## TypeScript 전환

프로젝트 전체가 아니라, **핵심 로직 → 상태 관리 hook → 컴포넌트**로 이어지는 한 흐름만 골라
TypeScript로 변환했습니다.

- 변환한 파일: `slotUtils.ts`, `constants.ts`, `storage.ts`, `useNow.ts`, `useTestSlotParam.ts`, `useDailySlots.ts`, `Button.tsx`
- 그대로 둔 파일: 나머지 `.jsx`/`.js` (`tsconfig.json`에서 `allowJs: true`로 설정해 같은 빌드 안에서 공존)

이 7개 파일끼리는 서로를 불러와서(import) 씁니다. 반면 나머지 `.jsx` 파일은 이 7개를 불러다 쓸 뿐,
이 7개는 나머지 `.jsx`를 부르지 않습니다. 예를 들어 `useDailySlots.ts`는 `slotUtils.ts`,
`storage.ts`를 불러오지만 `DailySlotsBoard.jsx`는 부르지 않고, 반대로 `DailySlotsBoard.jsx`가
`useDailySlots.ts`를 불러다 씁니다. 그래서 `useDailySlots.ts`만 TypeScript로 바꿔도
`DailySlotsBoard.jsx`는 코드를 고칠 필요 없이 그대로 동작합니다.

### 타입 설계 예시

슬롯 하나의 화면 상태(`slotUtils.ts`의 `SlotView`)는 `status` 값에 따라 `mode`가 있어야 할 때와
없어야 할 때가 나뉩니다. 참여 가능(`available`)/완료(`claimed`) 상태면 `mode`가 `"regular"` 또는
`"bonus"` 중 하나여야 하고, 대기(`upcoming`)/불가(`unavailable`) 상태면 `mode`는 항상 `null`이어야
합니다.

기존 JS 코드에는 이 규칙이 문서화되어 있지 않아서, `status: "upcoming"`인데 실수로
`mode: "regular"`를 넣는 값도 얼마든지 만들어질 수 있었습니다. 아래처럼 `status` 값마다 `mode`의
타입이 달라지는 유니온 타입으로 표현하면, 이런 잘못된 조합을 만드는 순간 컴파일 에러가 납니다.

```ts
type SlotView =
  | { status: "claimed";     mode: ClaimMode } // mode 필수
  | { status: "available";   mode: ClaimMode } // mode 필수
  | { status: "unavailable"; mode: null }       // mode는 항상 null
  | { status: "upcoming";    mode: null };      // mode는 항상 null
```

그 외에 적용한 타입 설계:

- 슬롯 이름처럼 값이 정해진 문자열(`"morning" | "lunch" | "dinner"`)은 유니온 타입으로 제한해 오타를 방지
- `Record<SlotName, T>`로 아침/점심/저녁 3개 키를 항상 다 채우도록 강제
- `storage.ts`의 `readJSON`/`writeJSON`은 제네릭(`<T>`)으로 만들어, 저장하는 데이터 종류가 늘어나도
  함수를 새로 만들지 않고 호출부에서 타입만 지정하도록 설계
- `Button.tsx`는 리액트가 제공하는 `ButtonHTMLAttributes` 타입을 확장해, 기존 `<button>` 태그가
  받는 모든 속성(`onClick`, `id` 등)을 그대로 받을 수 있게 함

검증: `npm run typecheck`(`tsc --noEmit`), `npm run lint`, `npm run build` 모두 통과했습니다.

## 스택

React 19 · Vite · PandaCSS · TypeScript (일부 핵심 로직/컴포넌트)
