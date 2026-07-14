// 슬롯의 순서. 배열의 인덱스(0,1,2)가 곧 "시간 순서"를 의미합니다.
// 아래 로직 전체에서 "인덱스가 더 작다 = 더 이른 시간대"라는 전제로 비교합니다.
export const SLOT_ORDER = ["morning", "lunch", "dinner"];

// 화면에 보여줄 한글 라벨
export const SLOT_LABELS = {
  morning: "아침",
  lunch: "점심",
  dinner: "저녁",
};

// 화면/디버그 패널에 보여줄 시간대 범위 텍스트 (실제 판정 로직에는 사용하지 않음)
export const SLOT_TIME_RANGES = {
  morning: "00:00 ~ 11:59",
  lunch: "12:00 ~ 17:59",
  dinner: "18:00 ~ 23:59",
};

/**
 * 24시간제 "시(hour)" 값을 받아 어느 슬롯에 속하는지 인덱스로 반환합니다.
 * 시간대 정의(2.1)를 그대로 코드로 옮긴 것입니다.
 *   00:00~11:59 -> 아침(0)
 *   12:00~17:59 -> 점심(1)
 *   18:00~23:59 -> 저녁(2)
 */
export function getSlotIndexFromHour(hour) {
  if (hour < 12) return 0; // 0~11시
  if (hour < 18) return 1; // 12~17시
  return 2; // 18~23시
}

/**
 * "지금 현재 슬롯"의 인덱스를 결정합니다.
 *
 * 요구사항: "?test=" 쿼리 파라미터가 있으면 실제 시계 대신 그 값을 기준으로
 * 판정해야 합니다(예: ?test=morning). 그래서 testParam이 유효한 값이면 그걸
 * 무조건 우선 사용하고, 없을 때만 실제 Date 객체의 시(hour)로 계산합니다.
 * 이렇게 하면 실제로 자정~아침까지 기다리지 않고도 각 시간대 화면을 즉시 확인할 수 있습니다.
 */
export function resolveCurrentSlotIndex(testParam, now = new Date()) {
  if (testParam && SLOT_ORDER.includes(testParam)) {
    return SLOT_ORDER.indexOf(testParam);
  }
  return getSlotIndexFromHour(now.getHours());
}

/**
 * "YYYY-MM-DD" 형태의 오늘 날짜 키를 만듭니다.
 * localStorage에 하루치 진행 상태를 저장할 때 이 값을 키로 사용해서,
 * 날짜가 바뀌면(자정이 지나면) 이전 진행 상태를 새 상태로 초기화할 수 있게 합니다.
 * (?test= 파라미터를 바꾸는 것과는 무관하게, "실제 달력 날짜"만 기준으로 삼습니다.)
 */
export function getDateKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 새로운 하루가 시작될 때 사용할 초기 상태 객체를 만듭니다.
 * - slots: 아침/점심/저녁 3개 슬롯 각각의 수령 여부(status)와,
 *   수령했다면 "어떻게" 수령했는지(claimedVia: 'regular' | 'bonus')
 * - bonusUsed: 오늘 "추가 기회"를 이미 한 번 썼는지 여부 (하루 1회 제한용)
 * - fourthSlot: 3개 슬롯을 모두 채웠을 때 열리는 4번째 보너스 슬롯의 상태
 */
export function createEmptyDailyState(dateKey) {
  return {
    date: dateKey,
    slots: {
      morning: { status: "pending", claimedVia: null },
      lunch: { status: "pending", claimedVia: null },
      dinner: { status: "pending", claimedVia: null },
    },
    bonusUsed: false,
    fourthSlot: { status: "locked", claimedVia: null },
  };
}

/**
 * 아침/점심/저녁 3개 슬롯 각각의 "화면에 표시할 상태"를 계산합니다.
 * 이 함수가 "추가 기회 Flow"(2.3) 규칙을 구현하는 핵심 로직입니다.
 *
 * 규칙 정리:
 * 1) 지금 현재 시간대에 해당하는 슬롯은, 아직 수령하지 않았다면 언제나
 *    "정규(regular)" 참여가 가능합니다.
 * 2) 지나간(과거) 시간대 중에서 "아직 못 받은" 슬롯이 여러 개 있어도,
 *    그중 "가장 최근에" 놓친 슬롯 딱 1개만 "추가 기회(bonus)"로 복구할 수
 *    있습니다. 그보다 더 오래전에 놓친 슬롯은 그날 다시는 받을 수 없습니다.
 *    (예: 아침·점심을 둘 다 놓치고 저녁이 된 경우 -> 점심만 복구 가능, 아침은 영구 소멸)
 * 3) "추가 기회"는 하루에 1번만 쓸 수 있습니다. 한 번 사용했다면
 *    (bonusUsed === true) 그 이후로는 아무리 "가장 최근에 놓친 슬롯"이라도
 *    다시 열어주지 않습니다.
 * 4) 아직 도래하지 않은 미래의 시간대 슬롯은 그냥 "대기 중(upcoming)"이며
 *    클릭할 수 없습니다.
 *
 * @param {object} slots        - useDailySlots가 들고 있는 슬롯별 상태 { morning, lunch, dinner }
 * @param {number} currentIndex - 지금 현재로 판정된 슬롯의 인덱스 (0=아침, 1=점심, 2=저녁)
 * @param {boolean} bonusUsed   - 오늘 추가 기회를 이미 사용했는지 여부
 * @returns 슬롯 순서(SLOT_ORDER)대로 정렬된 뷰 모델 배열.
 *   각 원소: { name, index, status, mode }
 *   - status: 'claimed'(수령완료) | 'available'(참여가능) | 'unavailable'(영구불가) | 'upcoming'(대기중)
 *   - mode: status가 'available'일 때만 의미 있음. 'regular'(정규) | 'bonus'(추가기회)
 */
export function computeSlotViews({ slots, currentIndex, bonusUsed }) {
  // 1단계: "가장 최근에 놓친 과거 슬롯"이 몇 번 인덱스인지 먼저 찾아둡니다.
  // currentIndex 바로 이전 슬롯부터 거꾸로(최신 -> 과거) 훑으면서,
  // 아직 claimed가 아닌(=놓친) 첫 번째 슬롯을 찾으면 그게 "가장 최근에 놓친 슬롯"입니다.
  // 예) 아침·점심 둘 다 미참여 + 지금은 저녁(index=2)이라면
  //     j=1(점심)부터 검사 -> 점심이 미참여이므로 mostRecentMissedIndex=1(점심)에서 멈춤.
  //     즉 아침(j=0)까지는 내려가지 않으므로 아침은 대상에서 제외됩니다.
  let mostRecentMissedIndex = -1;
  for (let j = currentIndex - 1; j >= 0; j -= 1) {
    if (slots[SLOT_ORDER[j]]?.status !== "claimed") {
      mostRecentMissedIndex = j;
      break; // 가장 가까운(최근) 미참여 슬롯 하나만 찾으면 바로 멈춘다
    }
  }

  // 2단계: 슬롯 3개를 순서대로 돌면서 각각의 상태를 판정합니다.
  return SLOT_ORDER.map((name, index) => {
    const slot = slots[name] ?? { status: "pending", claimedVia: null };

    // 이미 수령했다면 더 볼 것도 없이 "완료" 상태
    if (slot.status === "claimed") {
      return { name, index, status: "claimed", mode: slot.claimedVia ?? "regular" };
    }

    // 지금 현재 시간대와 같은 슬롯이면, 아직 안 받았으니 정규로 참여 가능
    if (index === currentIndex) {
      return { name, index, status: "available", mode: "regular" };
    }

    // 현재 시간대보다 이전(과거) 슬롯인 경우
    if (index < currentIndex) {
      // 이 슬롯이 "가장 최근에 놓친 슬롯" 그 자체이고, 아직 오늘 추가 기회를
      // 안 썼다면 -> 추가 기회로 참여 가능
      if (index === mostRecentMissedIndex && !bonusUsed) {
        return { name, index, status: "available", mode: "bonus" };
      }
      // 그 외의 과거 미참여 슬롯(더 오래전에 놓쳤거나, 추가 기회를 이미 소진함)은
      // 영구적으로 참여 불가 처리
      return { name, index, status: "unavailable", mode: null };
    }

    // 현재 시간대보다 나중(미래) 슬롯 -> 아직 시간이 안 됐으니 대기 상태
    return { name, index, status: "upcoming", mode: null };
  });
}
