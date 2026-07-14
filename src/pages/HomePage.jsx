import { css } from "../../styled-system/css";
import { DailySlotsBoard } from "../features/dailySlots/DailySlotsBoard";

/**
 * 메인 화면. 제목/설명 같은 레이아웃 껍데기만 담당하고,
 * 실제 기능(슬롯 상태·팝업 Flow 등)은 전부 DailySlotsBoard에 위임합니다.
 */
export function HomePage() {
  return (
    <div
      className={css({
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "8",
        gap: "6",
        backgroundColor: "gray.50",
      })}
    >
      <header className={css({ textAlign: "center", display: "flex", flexDirection: "column", gap: "1" })}>
        <h1 className={css({ fontSize: "2xl", fontWeight: "800", color: "gray.900" })}>행운 도장 받기 이벤트</h1>
        <p className={css({ color: "gray.500", fontSize: "sm" })}>
          아침 · 점심 · 저녁 슬롯에 참여하고 보상을 받아보세요.
        </p>
      </header>
      <DailySlotsBoard />
    </div>
  );
}
