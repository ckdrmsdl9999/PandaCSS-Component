import { useEffect, useRef, useState } from "react";
import { css } from "../../styled-system/css";
import { Button } from "../components/Button/Button";
import { MIN_DWELL_MS } from "../features/dailySlots/constants";
import { SLOT_LABELS } from "../features/dailySlots/slotUtils";
import { STORAGE_KEYS, writeJSON } from "../features/dailySlots/storage";

/**
 * 슬롯 팝업에서 "외부 페이지로 이동" 버튼을 눌렀을 때 새 탭으로 열리는,
 * 광고 페이지를 흉내 낸 목업 페이지입니다.
 * 이 앱의 `/external` 경로가 바로 이 컴포넌트로 렌더링됩니다 (App.jsx 참고).
 *
 * 사용자가 이 페이지에서 MIN_DWELL_MS(3초) 이상 머물렀는지를 스스로 측정하고,
 * "탭을 닫거나(X 버튼) / 다른 곳으로 이동하는" 시점에 그 결과를
 * localStorage에 기록해서 원래 탭(useVisitSession)에 알려줍니다.
 * 두 탭은 서로 다른 JS 실행 컨텍스트라 직접 함수 호출로 통신할 수 없기
 * 때문에, localStorage를 "우편함"처럼 씁니다.
 */
export function MockExternalPage() {
  // 새 탭을 열 때 useVisitSession.startVisit()이 URL에 붙여준 쿼리 파라미터를 읽음
  const params = new URLSearchParams(window.location.search);
  const slot = params.get("slot"); // 어느 슬롯(아침/점심/저녁/4번째)을 위한 방문인지
  const sessionId = params.get("session"); // 원래 탭과 결과를 짝짓기 위한 고유 ID

  // 이 페이지에 "도착한 시각". useRef를 쓰는 이유는 렌더링마다 값이 바뀌면
  // 안 되고(리렌더링을 유발하지 않으면서) 이벤트 핸들러에서 최신 값을
  // 읽을 수 있어야 하기 때문입니다. (state로 하면 렌더링 중 Date.now()를
  // 부르는 게 되어 "순수하지 않은 렌더링"이 되므로 피함)
  const startedAtRef = useRef(null);
  // 결과를 이미 한 번 기록했는지 표시하는 플래그. pagehide와 beforeunload가
  // 동시에 발생할 수 있어서, 중복으로 두 번 기록되는 것을 막기 위함입니다.
  const resolvedRef = useRef(false);
  // 화면에 "N.N초 체류" 숫자를 실시간으로 보여주기 위한 state (100ms마다 갱신)
  const [elapsed, setElapsed] = useState(0);

  // 마운트 시점에 "도착 시각"을 기록하고, 그 이후로 0.1초마다 경과 시간을 계산해서
  // 화면에 표시되는 타이머 숫자를 갱신합니다.
  useEffect(() => {
    startedAtRef.current = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - startedAtRef.current), 100);
    return () => window.clearInterval(id);
  }, []);

  // 사용자가 이 탭을 떠날 때(닫기, 뒤로가기, 다른 주소 입력 등) 결과를 기록하는 로직.
  // "돌아가기 버튼을 눌러야만 성공 처리"가 아니라, 실제로 떠나는 모든 경우를
  // 다 잡아서 그 순간의 체류 시간으로 성공/실패를 판정합니다. 이렇게 하면
  // 실제 외부 사이트(우리가 만들지 않은 페이지)를 흉내 낼 때도 자연스럽게 동작합니다.
  useEffect(() => {
    if (!sessionId) return undefined;

    function reportResult() {
      if (resolvedRef.current) return; // 이미 기록했으면 중복 방지
      resolvedRef.current = true;
      const elapsedMs = Date.now() - startedAtRef.current;
      writeJSON(STORAGE_KEYS.visitResultPrefix + sessionId, {
        ok: elapsedMs >= MIN_DWELL_MS, // 3초 이상 머물렀는지가 곧 "조건 충족" 여부
        elapsedMs,
      });
    }

    // pagehide: 탭이 실제로 닫히거나 다른 페이지로 이동할 때 (bfcache 대응 포함, 더 안정적)
    // beforeunload: 구형 브라우저 호환을 위한 보조 이벤트. 둘 다 등록해서 최대한 놓치지 않게 함
    window.addEventListener("pagehide", reportResult);
    window.addEventListener("beforeunload", reportResult);
    return () => {
      window.removeEventListener("pagehide", reportResult);
      window.removeEventListener("beforeunload", reportResult);
    };
  }, [sessionId]);

  // 화면 표시용 파생 값: 3초를 채웠는지, 채우려면 몇 초 더 남았는지
  const ready = elapsed >= MIN_DWELL_MS;
  const secondsLeft = Math.max(0, Math.ceil((MIN_DWELL_MS - elapsed) / 1000));

  return (
    <div
      className={css({
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4",
        padding: "6",
        textAlign: "center",
        backgroundColor: "gray.50",
      })}
    >
      <p className={css({ fontSize: "sm", fontWeight: "600", color: "brand.700", letterSpacing: "wide" })}>
        행운 도장 이벤트
      </p>
      <h1 className={css({ fontSize: "2xl", fontWeight: "800", color: "gray.900" })}>
        {SLOT_LABELS[slot] ?? "이벤트"} 슬롯 참여 페이지
      </h1>
      <p className={css({ color: "gray.600", maxWidth: "sm" })}>
        이 페이지에{" "}
        <strong>{(MIN_DWELL_MS / 1000).toFixed(0)}초 이상</strong> 머무른 뒤 돌아가면 보상 조건이 충족됩니다.
      </p>
      <p
        className={css({
          fontSize: "3xl",
          fontWeight: "800",
          color: ready ? "brand.600" : "gray.800",
          fontVariantNumeric: "tabular-nums",
        })}
      >
        {(elapsed / 1000).toFixed(1)}초 체류
      </p>
      <p className={css({ color: "gray.500", fontSize: "sm" })}>
        {ready ? "조건을 충족했습니다. 이제 탭을 닫고 돌아가도 됩니다." : `${secondsLeft}초 후 조건이 충족됩니다.`}
      </p>
      <Button variant="secondary" onClick={() => window.close()}>
        닫고 원래 페이지로 돌아가기
      </Button>
    </div>
  );
}
