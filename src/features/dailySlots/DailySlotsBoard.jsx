import { useCallback, useState } from "react";
import { css } from "../../../styled-system/css";
import { Button } from "../../components/Button/Button";
import { Popup } from "../../components/Popup/Popup";
import { DebugPanel } from "./DebugPanel";
import { SlotCard } from "./SlotCard";
import { SLOT_LABELS } from "./slotUtils";
import { useDailySlots } from "./useDailySlots";
import { useVisitSession } from "./useVisitSession";

/**
 * 보상 수령 Flow 전체를 조립/지휘하는 컴포넌트입니다.
 *   1. 슬롯 버튼 클릭 -> 2. 안내 팝업 노출 -> 3. 외부 페이지 랜딩(새 탭) ->
 *   4. 3초 이상 체류 후 복귀 -> 5/6. 조건 충족 시 보상 팝업 / 미충족 시 실패 팝업
 *
 * 상태(state, localStorage)는 useDailySlots가, 외부 페이지 방문/결과 수신은
 * useVisitSession이 담당하고, 이 컴포넌트는 그 둘을 이어붙여서 "지금 어떤
 * 팝업을 보여줘야 하는가"만 결정하는 역할입니다.
 */
export function DailySlotsBoard() {
  const {
    testParam,
    setTestParam,
    slotViews,
    fourthSlotStatus,
    bonusUsed,
    claimSlot,
    claimFourthSlot,
    resetToday,
  } = useDailySlots();

  // 지금 진행 중인 "보상 받기 흐름"의 상태를 담는 단일 객체.
  // null이면 아무 팝업도 떠 있지 않은 평상시 화면입니다.
  //   slot : 어떤 슬롯인지 ('morning' | 'lunch' | 'dinner' | 'fourth')
  //   mode : 어떤 방식으로 참여하는지 ('regular' | 'bonus' | 'fourth')
  //   step : 진행 단계 ('confirm' 안내 팝업 -> 'waiting' 대기(팝업 없음) -> 'success'|'failure' 결과 팝업)
  //   elapsedMs : 결과 팝업에 "몇 초 체류했는지" 보여주기 위한 값
  const [flow, setFlow] = useState(null);

  // 외부 페이지에서 "조건 충족(3초 이상 체류)" 결과가 왔을 때 실행됩니다.
  // 4번째 슬롯이면 claimFourthSlot, 아니면 claimSlot으로 실제 상태를 "수령완료"로
  // 바꾸고, 화면에는 성공 팝업(🎉)을 띄우도록 flow.step을 'success'로 전환합니다.
  const handleSuccess = useCallback(
    (session, result) => {
      if (session.mode === "fourth") claimFourthSlot();
      else claimSlot(session.slot, session.mode);
      setFlow({ slot: session.slot, mode: session.mode, step: "success", elapsedMs: result.elapsedMs });
    },
    [claimSlot, claimFourthSlot]
  );

  // 조건 미달(3초 미만) 결과가 왔을 때 실행됩니다. 슬롯 상태는 건드리지
  // 않으므로(=claimSlot을 호출하지 않으므로), 실패해도 그 슬롯은 여전히
  // "참여 가능" 상태로 남아 다시 도전할 수 있습니다.
  const handleFailure = useCallback((session, result) => {
    setFlow({ slot: session.slot, mode: session.mode, step: "failure", elapsedMs: result?.elapsedMs ?? 0 });
  }, []);

  // 새 탭을 열고 결과를 기다리는 로직은 useVisitSession에 위임.
  // 성공/실패 시 각각 위에서 만든 콜백이 호출되도록 연결합니다.
  const { startVisit } = useVisitSession({ onSuccess: handleSuccess, onFailure: handleFailure });

  // 슬롯 카드(또는 4번째 슬롯 버튼)를 클릭했을 때: 곧바로 외부로 보내지 않고
  // 먼저 "안내 팝업(confirm 단계)"부터 보여줍니다. (Flow 1~2단계)
  function openConfirm(name, mode) {
    setFlow({ slot: name, mode, step: "confirm" });
  }

  // 안내 팝업의 "외부 페이지로 이동" 버튼: 새 탭을 열고 안내 팝업은 닫습니다.
  // 별도의 "대기 중" 팝업은 띄우지 않고(취소했는데 외부 탭은 계속 살아있는
  // 식으로 상태가 꼬이는 걸 막기 위해), flow.step만 'waiting'으로 바꿔서
  // 슬롯 버튼 쪽에 로딩 표시만 해둡니다. 결과는 useVisitSession이 감지해서
  // handleSuccess/handleFailure를 통해 자동으로 결과 팝업을 띄웁니다. (Flow 3단계)
  function handleGoExternal() {
    if (!flow) return;
    startVisit(flow.slot, flow.mode);
    setFlow((prev) => ({ ...prev, step: "waiting" }));
  }

  // 팝업을 닫을 때 공통으로 쓰는 함수 (안내/성공/실패 팝업의 닫기 버튼, ESC, 배경 클릭에서 호출)
  function closeFlow() {
    setFlow(null);
  }

  // 팝업 제목/본문에 쓸 한글 라벨. 4번째 슬롯은 SLOT_LABELS에 없으므로 별도 처리.
  const activeLabel = flow ? (flow.mode === "fourth" ? "4번째 보너스" : SLOT_LABELS[flow.slot]) : "";

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "6", width: "full", maxWidth: "3xl" })}>
      {/* 테스트용 시간대 강제 전환 + 상태 초기화 패널 */}
      <DebugPanel
        testParam={testParam}
        setTestParam={setTestParam}
        bonusUsed={bonusUsed}
        fourthSlotStatus={fourthSlotStatus}
        resetToday={resetToday}
      />

      {/* 아침/점심/저녁 3개 슬롯 카드. 각 카드의 상태(view)는 useDailySlots가 계산해서 내려줌 */}
      <div className={css({ display: "flex", gap: "4", flexWrap: "wrap" })}>
        {slotViews.map((view) => (
          <SlotCard
            key={view.name}
            view={view}
            // 지금 이 슬롯을 위한 외부 페이지 방문이 진행 중이면 버튼을 로딩 상태로 표시
            loading={flow?.slot === view.name && flow?.step === "waiting"}
            onClick={() => openConfirm(view.name, view.mode)}
          />
        ))}
      </div>

      {/* 4번째 보너스 슬롯: locked가 아닐 때만(=3개 다 채웠을 때) 화면에 노출 */}
      {fourthSlotStatus !== "locked" && (
        <div
          className={css({
            padding: "4",
            borderRadius: "xl",
            border: "1px dashed",
            borderColor: "brand.600",
            backgroundColor: "brand.50",
            display: "flex",
            flexDirection: "column",
            gap: "3",
          })}
        >
          <p className={css({ fontSize: "sm", color: "brand.700" })}>
            아침·점심·저녁 보상을 모두 수령해서 4번째 보너스 슬롯이 열렸어요.
          </p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={fourthSlotStatus !== "available"}
            loading={flow?.mode === "fourth" && flow?.step === "waiting"}
            onClick={() => openConfirm("fourth", "fourth")}
          >
            {fourthSlotStatus === "claimed" ? "4번째 슬롯 수령 완료" : "4번째 보너스 슬롯 참여하기"}
          </Button>
        </div>
      )}

      {/* 아래 3개의 Popup은 항상 렌더링되어 있고, open prop으로만 보이고/숨겨짐이
          결정됩니다. flow.step 값에 따라 한 번에 하나만 open=true가 됩니다.
          (waiting 단계는 별도 팝업 없이 슬롯 버튼의 loading 표시로만 나타납니다) */}

      {/* 1단계: 참여 안내 팝업 */}
      <Popup
        open={flow?.step === "confirm"}
        onClose={closeFlow}
        title={`${activeLabel} 슬롯 참여`}
        footer={
          <>
            <Button variant="secondary" onClick={closeFlow}>
              취소
            </Button>
            <Button variant="primary" onClick={handleGoExternal}>
              외부 페이지로 이동
            </Button>
          </>
        }
      >
        {/* 추가 기회로 참여하는 경우에만 별도 안내 문구를 덧붙임 */}
        {flow?.mode === "bonus" && (
          <p className={css({ marginBottom: "2", color: "brand.700", fontWeight: "600" })}>
            놓친 슬롯을 추가 기회로 참여합니다. 오늘 추가 기회는 1회만 사용할 수 있어요.
          </p>
        )}
        외부 페이지로 이동해 3초 이상 머문 뒤 돌아오면 보상을 받을 수 있어요.
      </Popup>

      {/* 2단계: 새 탭에서 결과가 오기를 기다리는 동안은 별도 팝업 없이, 위 슬롯
          버튼의 loading 표시("로딩중...")로만 진행 상태를 보여줍니다. */}

      {/* 3-a단계: 조건 충족 -> 보상 지급 팝업 */}
      <Popup
        open={flow?.step === "success"}
        onClose={closeFlow}
        title="보상 지급 완료"
        icon={<span className={css({ fontSize: "4xl" })}>🎉</span>}
        footer={
          <Button variant="primary" onClick={closeFlow}>
            확인
          </Button>
        }
      >
        {activeLabel} 슬롯 조건을 충족해 보상을 지급했습니다. ({((flow?.elapsedMs ?? 0) / 1000).toFixed(1)}초 체류)
      </Popup>

      {/* 3-b단계: 조건 미충족 -> 보상 없음 팝업 */}
      <Popup
        open={flow?.step === "failure"}
        onClose={closeFlow}
        title="보상 지급 실패"
        icon={<span className={css({ fontSize: "4xl" })}>⚠️</span>}
        footer={
          <Button variant="secondary" onClick={closeFlow}>
            확인
          </Button>
        }
      >
        외부 페이지 체류 시간이 3초 미만이라 보상을 지급하지 못했어요. 다시 시도해 주세요. (
        {((flow?.elapsedMs ?? 0) / 1000).toFixed(1)}초 체류)
      </Popup>
    </div>
  );
}
