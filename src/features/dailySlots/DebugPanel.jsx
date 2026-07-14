import { css } from "../../../styled-system/css";
import { Button } from "../../components/Button/Button";


// value가 null이면 "실시간(자동)" = ?test= 파라미터를 아예 안 붙이는 모드
const TEST_OPTIONS = [
  { value: null, label: "실시간" },
  { value: "morning", label: "아침" },
  { value: "lunch", label: "점심" },
  { value: "dinner", label: "저녁" },
];

/**
 * 시간대를 강제로 바꿔가며 테스트할 수 있게 도와주는 보조 패널입니다.
 * 실제 서비스라면 없어도 되지만, 추가 기회 케이스들을 실제 자정~아침까지
 * 기다리지 않고 바로 확인할 수 있도록 만들었습니다.
 *
 * 버튼으로 ?test= 값을 즉시 바꾸고, 추가 기회 사용 여부와 4번째 슬롯
 * 상태를 함께 보여줍니다.
 */
export function DebugPanel({ testParam, setTestParam, bonusUsed, fourthSlotStatus, resetToday }) {
  return (
    <div
      className={css({
        padding: "4",
        borderRadius: "xl",
        backgroundColor: "gray.900",
        color: "gray.100",
        fontSize: "sm",
        display: "flex",
        flexDirection: "column",
        gap: "3",
      })}
    >
      <div className={css({ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "2" })}>
        
        {/* localStorage에 저장된 오늘치 진행 상태를 통째로 초기 상태로 되돌림 (useDailySlots.resetToday) */}
        <Button variant="secondary" size="sm" onClick={resetToday}>
          오늘 상태 초기화
        </Button>
      </div>

      {/* 4개 버튼 중 지금 선택된 것(testParam과 값이 같은 것)만 primary 색으로 강조 */}
      <div className={css({ display: "flex", gap: "2", flexWrap: "wrap" })}>
        {TEST_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            size="sm"
            variant={testParam === opt.value ? "primary" : "secondary"}
            onClick={() => setTestParam(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* 지금 판정 결과 요약: 어떤 슬롯이 "현재"인지, 추가 기회를 이미 썼는지, 4번째 슬롯 상태 */}
      <div className={css({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "2", color: "gray.300" })}>

        <span>
          추가 기회 사용: <b className={css({ color: "white" })}>{bonusUsed ? "사용함" : "미사용"}</b>
        </span>
        <span>
          4번째 슬롯: <b className={css({ color: "white" })}>{fourthSlotStatus}</b>
        </span>
      </div>
      
    </div>
  );
}
