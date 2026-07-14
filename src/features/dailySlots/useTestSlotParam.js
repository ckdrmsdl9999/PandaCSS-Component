import { useCallback, useState } from "react";
import { SLOT_ORDER } from "./slotUtils";

/**
 * `?test=morning|lunch|dinner` 쿼리 파라미터를 읽고 쓰는 훅입니다.
 * 실제 시계가 몇 시든 상관없이, 이 값이 있으면 그 시간대를 "현재"로 취급하도록
 * (slotUtils.js의 resolveCurrentSlotIndex에서) 사용됩니다.
 *
 * 페이지를 새로고침하지 않고도 값을 바꿀 수 있도록, react-router 같은 라이브러리
 * 없이 window.history.replaceState로 직접 URL만 바꿔치기합니다.
 * (replaceState를 쓰는 이유: pushState를 쓰면 브라우저 "뒤로가기" 히스토리가
 * 계속 쌓여서 테스트 패널 버튼을 누를 때마다 뒤로가기 목록이 지저분해지기 때문)
 */
export function useTestSlotParam() {
  // 최초 렌더링 시 한 번만 실행되는 초기값 계산 함수(lazy initializer).
  // 현재 주소창의 ?test= 값을 읽어서, 유효한 슬롯 이름(morning/lunch/dinner)일 때만 사용합니다.
  const [testParam, setTestParamState] = useState(() => {
    const value = new URLSearchParams(window.location.search).get("test");
    return SLOT_ORDER.includes(value) ? value : null;
  });

  // 테스트 패널에서 "아침/점심/저녁/실시간(자동)" 버튼을 누르면 호출되는 함수.
  // 1) 주소창 URL의 ?test= 파라미터를 갱신하고 (value가 null이면 파라미터 자체를 삭제)
  // 2) React state도 같이 갱신해서 화면이 즉시 다시 그려지도록 합니다.
  const setTestParam = useCallback((value) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("test", value);
    } else {
      url.searchParams.delete("test"); // null 전달 시 = "실시간(자동)" 모드로 전환
    }
    window.history.replaceState({}, "", url);
    setTestParamState(value || null);
  }, []);

  return [testParam, setTestParam];
}
