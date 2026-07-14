import { useEffect } from "react";
import { createPortal } from "react-dom";
import { css } from "../../../styled-system/css";

/**
 * 재사용 가능한 범용 팝업(모달) 컴포넌트입니다.
 * DailySlotsBoard에서 안내(confirm) / 대기(waiting) / 성공(success) / 실패(failure)
 * 4가지 화면 모두 이 컴포넌트 하나로 만듭니다 (내용물만 다르게 넣어줌).
 *
 * Props
 * - open: 보일지 여부 (false면 아예 렌더링하지 않음)
 * - onClose: 닫기 요청 시 호출 (ESC 키, 배경 클릭, 혹은 버튼에서 직접 호출)
 * - title: 상단 제목
 * - icon: 제목 위에 보여줄 아이콘/이모지 (선택)
 * - children: 본문 내용
 * - footer: 하단 버튼 영역 (선택)
 * - closeOnBackdrop: 어두운 배경을 클릭했을 때 닫히게 할지 여부 (기본 true)
 */
export function Popup({ open, onClose, title, icon, children, footer, closeOnBackdrop = true }) {
  // 팝업이 열려 있는 동안에만 ESC 키를 감지해서 닫히도록 처리.
  // open이 false가 되면 이전 리스너를 정리(return의 cleanup)하고 더 이상 감지하지 않음.
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // 닫혀 있으면 DOM에 아무것도 그리지 않음 (불필요한 렌더링 방지)
  if (!open) return null;

  // createPortal: 이 팝업의 실제 DOM은 부모 컴포넌트 트리 안이 아니라
  // document.body 바로 아래에 붙습니다. 이렇게 하면 부모 요소에 걸린
  // overflow:hidden이나 z-index 문제 없이 화면 최상단에 온전히 표시됩니다.
  return createPortal(
    <div
      className={css({
        position: "fixed",
        inset: 0, // 화면 전체를 덮는 반투명 배경(오버레이)
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 18, 30, 0.5)",
        padding: "4",
      })}
      onClick={(e) => {
        // e.target === e.currentTarget: 클릭한 지점이 "배경 자체"일 때만 닫음.
        // 안쪽 흰색 팝업 박스를 클릭했을 때는 target이 그 박스(자식)가 되므로
        // 이 조건이 false가 되어 실수로 닫히지 않습니다.
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog" // 스크린 리더에게 "이건 모달 대화상자"라고 알려주는 접근성 속성
        aria-modal="true"
        aria-labelledby={title ? "popup-title" : undefined}
        className={css({
          width: "full",
          maxWidth: "sm",
          backgroundColor: "white",
          borderRadius: "2xl",
          boxShadow: "0 20px 60px rgba(15, 18, 30, 0.35)",
          padding: "6",
          display: "flex",
          flexDirection: "column",
          gap: "4",
          alignItems: "center",
          textAlign: "center",
        })}
      >
        {icon}
        {title && (
          <h2 id="popup-title" className={css({ fontSize: "xl", fontWeight: "700", color: "gray.900" })}>
            {title}
          </h2>
        )}
        <div className={css({ color: "gray.600", fontSize: "sm", lineHeight: "1.6" })}>{children}</div>
        {footer && (
          <div className={css({ display: "flex", gap: "2", width: "full", justifyContent: "center" })}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
