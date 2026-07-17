// localStorage에서 쓰는 키 이름을 한 곳에 모아둔 것입니다. (오타 방지 + 검색 용이)
export const STORAGE_KEYS = {
  // 오늘 하루치 슬롯 참여 상태 (아침/점심/저녁 수령 여부, 추가기회 사용 여부 등)
  dailyState: "pandacss-task:dailySlots",
  // 지금 "외부 페이지로 이동해서 결과를 기다리는 중"인 세션 정보 (참고용, 현재 화면 갱신에는 사용 안 함)
  pendingVisit: "pandacss-task:pendingVisit",
  // 목업 외부 페이지(새 탭)가 "나 3초 이상 있었어요 / 아니에요" 결과를 써 넣는 키의 접두사.
  // 실제 키는 `visitResultPrefix + sessionId` 형태로, 세션마다 다른 키를 씁니다.
  visitResultPrefix: "pandacss-task:visitResult:",
} as const;

/**
 * localStorage에서 JSON을 읽어옵니다. 호출부에서 `readJSON<DailyState>(key)`처럼
 * 제네릭으로 원하는 타입을 지정합니다 (런타임 검증은 하지 않으므로, 저장할 때 쓴
 * writeJSON<T>의 T와 같은 타입을 지정한다는 신뢰를 전제로 합니다).
 * 시크릿 모드 등 localStorage를 못 쓰는 환경에서도 앱이 죽지 않도록
 * try/catch로 감싸고, 실패하면 그냥 null을 반환합니다.
 */
export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** 객체를 JSON 문자열로 바꿔 localStorage에 저장합니다. (실패해도 조용히 무시) */
export function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage를 쓸 수 없는 환경(예: 시크릿 모드) - 데모 목적상 조용히 무시
  }
}

/** localStorage에서 특정 키를 지웁니다. */
export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 무시
  }
}

/**
 * "외부 페이지 방문 1회"를 구분하기 위한 고유 ID를 생성합니다.
 * 새 탭(목업 외부 페이지)과 원래 탭이 같은 세션인지 매칭할 때 사용합니다.
 * 시각(Date.now())과 랜덤 문자열을 합쳐서 충돌 가능성을 낮췄습니다.
 */
export function createSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
