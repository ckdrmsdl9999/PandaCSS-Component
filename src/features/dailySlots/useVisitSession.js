import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS, createSessionId, readJSON, removeKey, writeJSON } from "./storage";

/**
 * 보상 Flow의 3~4단계("외부 페이지 랜딩" -> "3초 이상 체류 후 복귀")를 담당하는 훅입니다.
 *
 * 실제 서비스라면 "외부 URL"은 진짜 3rd-party 사이트겠지만, 여기서는 그런 URL이
 * 없으므로 같은 앱 안의 `/external` 경로(MockExternalPage)를 "새 탭"으로 열어
 * 진짜 외부 페이지처럼 흉내 냅니다. 새 탭은 원래 탭과 완전히 분리된 JS
 * 실행 환경이라서 함수 호출로 직접 결과를 주고받을 수 없기 때문에,
 * 두 탭이 공유하는 유일한 통로인 **localStorage**를 우편함처럼 사용합니다.
 * (새 탭이 결과를 localStorage에 쓰면 -> 원래 탭이 'storage' 이벤트로 감지)
 *
 * @param {Object} handlers
 * @param {(session, result) => void} handlers.onSuccess - 3초 이상 체류 조건을 만족했을 때 호출
 * @param {(session, result) => void} handlers.onFailure - 조건 미달(3초 미만)일 때 호출
 */
export function useVisitSession({ onSuccess, onFailure }) {
  // 지금 "외부 페이지 확인 대기 중"인 세션 정보. null이면 대기 중인 게 없다는 뜻.
  // { slot, mode, sessionId, startedAt }
  const [pending, setPending] = useState(null);

  // pending은 state라서 이벤트 리스너(클로저) 안에서는 "그 시점의 값"만 보게 되는
  // stale closure 문제가 생길 수 있습니다. 항상 "최신 pending 값"을 참조하기
  // 위해 ref에도 동기화해서 들고 있습니다.
  const pendingRef = useRef(null);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  /**
   * 결과(result)가 도착했을 때 공통으로 처리하는 함수.
   * - 더 이상 필요 없는 localStorage 키들을 정리(cleanup)하고
   * - pending을 비우고
   * - 성공/실패에 맞는 콜백을 호출합니다.
   */
  const resolveResult = useCallback(
    (result) => {
      const current = pendingRef.current;
      if (!current) return; // 이미 처리됐거나 취소된 세션이면 무시 (중복 처리 방지)
      removeKey(STORAGE_KEYS.visitResultPrefix + current.sessionId);
      removeKey(STORAGE_KEYS.pendingVisit);
      setPending(null);
      if (result?.ok) onSuccess(current, result);
      else onFailure(current, result);
    },
    [onSuccess, onFailure]
  );

  // [경로 1: 탭 간 통신] 목업 외부 페이지(다른 탭)가 localStorage에 결과를 쓰면
  // 브라우저가 "다른 탭에서" 변경이 일어났다는 'storage' 이벤트를 이 탭에 쏴줍니다.
  // (같은 탭에서 쓴 변경은 이 이벤트가 발생하지 않는 것이 표준 동작입니다 -
  //  그래서 아래에 focus 기반의 보조 수단을 하나 더 둡니다.)
  useEffect(() => {
    function handleStorage(event) {
      const current = pendingRef.current;
      if (!current) return;
      // 내가 기다리는 세션의 결과 키가 아니면 무시
      if (event.key !== STORAGE_KEYS.visitResultPrefix + current.sessionId) return;
      const result = readJSON(event.key);
      if (result) resolveResult(result);
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [resolveResult]);

  // [경로 2: 보조 수단] 혹시라도 storage 이벤트가 타이밍상 못 잡히는 경우를 대비해,
  // 사용자가 새 탭에서 돌아왔을 때 localStorage를
  // 한 번 더 직접 확인합니다. 이미 처리된 세션이면 pendingRef.current가 null이라
  // 아무 일도 일어나지 않으므로 중복 처리 걱정은 없습니다.
  useEffect(() => {
    function handleFocus() {
      const current = pendingRef.current;
      if (!current) return;
      const result = readJSON(STORAGE_KEYS.visitResultPrefix + current.sessionId);
      if (result) resolveResult(result);
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [resolveResult]);

  /**
   * "외부 페이지로 이동" 버튼을 눌렀을 때 호출됩니다.
   * 1) 이번 방문을 식별할 고유 sessionId를 만들고
   * 2) 새 탭으로 /external?slot=...&session=... 을 엽니다.
   * 3) pending 상태를 채워서, 이후 결과가 오길 기다리는 중임을 표시합니다.
   */
  const startVisit = useCallback((slot, mode) => {
    const sessionId = createSessionId();
    const record = { slot, mode, sessionId, startedAt: Date.now() };
    writeJSON(STORAGE_KEYS.pendingVisit, record);
    setPending(record);

    const url = new URL(`${window.location.origin}/external`);
    url.searchParams.set("slot", slot);
    url.searchParams.set("session", sessionId);
    // "noopener": 새 탭에서 window.opener로 원래 탭을 조작하지 못하게 막는
    // 보안 관례. 실제 외부 사이트로 이동할 때 특히 중요합니다.
    window.open(url.toString(), "_blank", "noopener");
  }, []);

  return { pending, startVisit };
}
