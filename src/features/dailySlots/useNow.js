import { useEffect, useState } from "react";

/**
 * "지금 시각(Date)"을 React state로 들고 있으면서, 일정 주기(기본 30초)마다
 * 갱신해주는 훅입니다.
 *
 * 왜 필요한가?
 * ?test= 파라미터 없이 "실시간" 모드로 켜놓은 화면이 있다면, 예를 들어
 * 11:59에 아침 슬롯을 보고 있다가 자동으로 12:00이 되면 점심 슬롯으로
 * 바뀌어야 합니다. 그런데 React는 값이 바뀌지 않으면 다시 렌더링하지
 * 않으므로, 그냥 new Date()를 한 번만 읽으면 시간이 지나도 화면이
 * 갱신되지 않습니다. 그래서 setInterval로 주기적으로 "지금 시각"을
 * 새로 읽어와 state에 넣어줌으로써 리렌더링을 유발시키는 것입니다.
 */
export function useNow(intervalMs = 30000) {
  // useState(() => new Date())처럼 함수로 감싼 이유: 매 렌더링마다 new Date()가
  // 새로 호출되는 것을 막고, 최초 렌더링 시 딱 한 번만 실행되게 하기 위함입니다.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // intervalMs(기본 30초)마다 현재 시각을 다시 읽어서 state를 갱신 -> 리렌더링 트리거
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    // 컴포넌트가 사라지거나 intervalMs가 바뀔 때 이전 타이머를 반드시 정리(clear)해야
    // 타이머가 중복으로 계속 쌓이는 메모리 누수를 막을 수 있습니다.
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
