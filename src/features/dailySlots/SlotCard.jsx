import { css } from "../../../styled-system/css";
import { Button } from "../../components/Button/Button";
import { SLOT_LABELS, SLOT_TIME_RANGES } from "./slotUtils";

// slotUtils.computeSlotViews가 계산한 status 값에 대응하는 한글 안내 문구
const STATUS_TEXT = {
  claimed: "수령 완료",
  available: "참여 가능",
  unavailable: "참여 불가 (만료)",
  upcoming: "대기 중",
};

/**
 * 슬롯 1개(아침/점심/저녁)를 카드 형태로 보여주는 컴포넌트입니다.
 * 표시만 담당하고, 실제 상태 계산은 상위(useDailySlots)에서 받은
 * `view` 객체 { name, status, mode }를 그대로 반영하기만 합니다.
 *
 * @param view    - { name: 'morning'|'lunch'|'dinner', status, mode }
 * @param onClick - 카드 버튼 클릭 핸들러 (DailySlotsBoard.openConfirm 연결)
 * @param loading - 지금 이 슬롯에 대한 외부 페이지 방문이 진행 중인지 (버튼을 "로딩중..." 표시로 전환)
 */
export function SlotCard({ view, onClick, loading }) {
  const { name, status, mode } = view;

  // 'available'(참여 가능) 상태가 아니면 버튼을 눌러도 아무 동작도 못 하게 비활성화
  const disabled = status !== "available";

  // 버튼 색상으로도 상태를 한눈에 구분할 수 있게: 지금 참여 가능한 것만 색을 입히고
  // (정규=primary, 추가기회=accent 색 ghost), 완료/대기/만료는 전부 회색(secondary)으로
  // 통일해서 "지금은 못 누른다"가 한눈에 보이게 합니다.
  const variant = status !== "available" ? "secondary" : mode === "bonus" ? "ghost" : "primary";

  // 이미 수령 완료된 슬롯은 더는 중요하지 않으니 버튼을 한 단계 작게 줄여서
  // 시선이 지금 참여 가능한 슬롯 쪽으로 가도록 합니다.
  const size = status === "claimed" ? "sm" : "lg";

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2",
        padding: "4",
        borderRadius: "xl",
        backgroundColor: "white",
        border: "1px solid",
        borderColor: "gray.200",
        flex: "1",
        minWidth: "40",
      })}
    >
      <span className={css({ fontSize: "xs", color: "gray.400" })}>{SLOT_TIME_RANGES[name]}</span>
      <Button variant={variant} size={size} fullWidth disabled={disabled} loading={loading} onClick={onClick}>
        {SLOT_LABELS[name]}
        {/* 추가 기회로 참여 가능한 경우에만 버튼 라벨에 표시를 덧붙여 구분 */}
        {status === "available" && mode === "bonus" ? " (추가 기회)" : ""}
      </Button>
      <span
        className={css({
          fontSize: "xs",
          fontWeight: "600",
          color: status === "claimed" ? "brand.600" : status === "available" ? "gray.600" : "gray.400",
        })}
      >
        {STATUS_TEXT[status]}
      </span>
    </div>
  );
}
