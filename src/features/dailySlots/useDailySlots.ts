import { useCallback, useState } from "react";
import {
  SLOT_ORDER,
  computeSlotViews,
  createEmptyDailyState,
  getDateKey,
  resolveCurrentSlotIndex,
  type ClaimMode,
  type DailyState,
  type SlotName,
  type SlotView,
} from "./slotUtils";
import { STORAGE_KEYS, readJSON, writeJSON } from "./storage";
import { useNow } from "./useNow";
import { useTestSlotParam } from "./useTestSlotParam";

/** 4번째 보너스 슬롯의 "화면에 노출되는" 상태. 저장 상태(locked|claimed)와 달리
 *  "available"은 dailyState.fourthSlot에 저장되지 않고 매 렌더마다 계산됩니다. */
export type FourthSlotStatus = "locked" | "available" | "claimed";

export interface UseDailySlotsResult {
  now: Date;
  testParam: SlotName | null;
  setTestParam: (value: SlotName | null) => void;
  currentIndex: number;
  slotViews: SlotView[];
  fourthSlotStatus: FourthSlotStatus;
  bonusUsed: boolean;
  claimSlot: (name: SlotName, mode: ClaimMode) => void;
  claimFourthSlot: () => void;
  resetToday: () => void;
}

/**
 * 앱이 처음 켜질 때(또는 새로고침될 때) localStorage에서 오늘치 상태를 불러옵니다.
 * - localStorage에 저장된 값이 있고, 그 날짜가 "오늘"과 같다면 그대로 사용 (진행 중이던 상태 이어서 사용)
 * - 없거나, 저장된 날짜가 오늘이 아니라면(=다음 날로 넘어감) 새 하루치 초기 상태를 만들어서 저장
 * 이 함수는 컴포넌트 렌더링 중이 아니라 useState의 "초기값 계산 함수"로만 쓰이므로
 * 최초 마운트 시 딱 한 번만 실행됩니다.
 */
function loadDailyState(): DailyState {
  const todayKey = getDateKey(new Date());
  const stored = readJSON<DailyState>(STORAGE_KEYS.dailyState);
  if (stored && stored.date === todayKey) return stored;
  const fresh = createEmptyDailyState(todayKey);
  writeJSON(STORAGE_KEYS.dailyState, fresh);
  return fresh;
}

/**
 * "오늘 하루치 슬롯 보상 상태"를 관장하는 핵심 훅입니다.
 * - 아침/점심/저녁 3개 슬롯 중 무엇을 받았는지
 * - 오늘 "추가 기회(패자부활)"를 이미 썼는지
 * - 4번째 보너스 슬롯이 열렸는지
 * 위 상태들을 들고 있고, localStorage에 "실제 달력 날짜" 기준으로 저장합니다.
 *
 * 왜 ?test= 파라미터가 아니라 "실제 날짜"를 기준으로 저장하나요?
 * -> 테스트 패널에서 아침 -> 점심 -> 저녁으로 ?test= 값을 바꿔가며 케이스를
 *    재현해야 하는데, 그때마다 진행 상황이 초기화되면 테스트가 불가능하기
 *    때문입니다. 즉 "?test= 값을 바꾸는 것"과 "하루가 지나서 리셋되는 것"은
 *    서로 다른 개념이라서 분리했습니다. 진짜로 초기화하고 싶으면 디버그
 *    패널의 "오늘 상태 초기화" 버튼(resetToday)을 누르면 됩니다.
 *
 * 참고: 탭을 켜놓은 채로 실제 자정을 넘기는 경우는 실시간으로 감지하지
 * 않고, 다음 상태 변경(claimSlot 등)이나 새로고침 시점에 반영됩니다.
 * (매초/매분 감시하는 useEffect를 두지 않아 코드를 더 단순하게 유지)
 */
export function useDailySlots(): UseDailySlotsResult {
  // ?test= 쿼리 파라미터 (morning/lunch/dinner/없음)
  const [testParam, setTestParam] = useTestSlotParam();
  // 30초마다 갱신되는 "지금 시각" (실시간 모드일 때 슬롯 자동 전환용)
  const now = useNow();
  // 오늘 하루치 상태. 최초 1회는 localStorage에서 불러온 값으로 초기화됨
  const [dailyState, setDailyState] = useState<DailyState>(loadDailyState);

  // state를 바꿀 때마다 localStorage에도 같이 써주는 헬퍼.
  // (React state만 바꾸면 새로고침했을 때 사라지므로, 항상 localStorage와 같이 갱신)
  const persist = useCallback((next: DailyState) => {
    writeJSON(STORAGE_KEYS.dailyState, next);
    setDailyState(next);
  }, []);

  // 지금 "현재"로 판정되는 슬롯의 인덱스 (0=아침, 1=점심, 2=저녁)
  const currentIndex = resolveCurrentSlotIndex(testParam, now);

  // 3개 슬롯 각각의 화면 표시 상태(참여가능/완료/불가/대기)를 계산.
  // 실제 규칙(추가 기회 판정 등)은 slotUtils.computeSlotViews에 모두 들어있음
  const slotViews = computeSlotViews({
    slots: dailyState.slots,
    currentIndex,
    bonusUsed: dailyState.bonusUsed,
  });

  // 4번째 보너스 슬롯 노출 조건: 아침·점심·저녁을 "모두" 수령했는가?
  const allThreeClaimed = SLOT_ORDER.every((name) => dailyState.slots[name].status === "claimed");
  const fourthSlotStatus: FourthSlotStatus = dailyState.fourthSlot.status === "claimed"
    ? "claimed" // 이미 4번째까지 받음
    : allThreeClaimed
      ? "available" // 3개 다 채웠으니 지금부터 4번째 참여 가능
      : "locked"; // 아직 3개를 다 못 채워서 4번째 슬롯 자체가 숨겨진 상태

  /**
   * 슬롯 하나를 "수령 완료" 처리합니다.
   *
   * mode가 'bonus'였다면 bonusUsed를 true로 바꿔서, 오늘은 더 이상
   * 다른 슬롯을 추가 기회로 복구할 수 없게 만듭니다(하루 1회 제한).
   * setDailyState에 함수를 넘기는 "함수형 업데이트"를 쓰는 이유는,
   * 클릭이 빠르게 여러 번 일어나도 항상 최신 prev 상태를 기준으로
   * 안전하게 갱신하기 위해서입니다.
   */
  const claimSlot = useCallback((name: SlotName, mode: ClaimMode) => {
    setDailyState((prev) => {
      const nextSlots = {
        ...prev.slots,
        [name]: { status: "claimed" as const, claimedVia: mode },
      };
      const next: DailyState = {
        ...prev,
        slots: nextSlots,
        // 이미 true였다면 계속 true, 이번에 bonus로 받았다면 true로 전환
        bonusUsed: prev.bonusUsed || mode === "bonus",
      };
      writeJSON(STORAGE_KEYS.dailyState, next); // localStorage에도 즉시 반영
      return next;
    });
  }, []);

  /** 4번째 보너스 슬롯을 "수령 완료" 처리합니다. (기본 Flow와 동일하게 동작하므로 mode 구분 없음) */
  const claimFourthSlot = useCallback(() => {
    setDailyState((prev) => {
      const next: DailyState = { ...prev, fourthSlot: { status: "claimed", claimedVia: "regular" } };
      writeJSON(STORAGE_KEYS.dailyState, next);
      return next;
    });
  }, []);

  /** 디버그 패널의 "오늘 상태 초기화" 버튼에서 호출. 오늘 진행 상황을 전부 새 상태로 덮어씀 */
  const resetToday = useCallback(() => {
    const fresh = createEmptyDailyState(getDateKey(new Date()));
    persist(fresh);
  }, [persist]);

  return {
    now,
    testParam,
    setTestParam,
    currentIndex,
    slotViews,
    fourthSlotStatus,
    bonusUsed: dailyState.bonusUsed,
    claimSlot,
    claimFourthSlot,
    resetToday,
  };
}
