/**
 * 지난주 월요일 날짜 반환 (YYYY-MM-DD)
 */
export function getLastMonday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0(일) ~ 6(토)

    // 지난주 월요일까지의 일수 계산
    // 오늘이 일요일(0)이면 6일 전이 지난주 월요일(X) -> 아님. 
    // 오늘이 일요일(0) -> 이번주는 월~일. 지난주는 저번주 월~일.
    // 보통 "지난주"라 함은, 오늘이 속한 주의 '이전 주'를 의미함.
    // ISO 기준(월요일 시작)으로 생각하거나, 일요일 시작으로 생각하거나...
    // 여기서는 '지난주 월요일' = (오늘 날짜 - 요일값 - 7) + 1  <- 이런식이 복잡함.

    // 간단 로직:
    // 1. 이번주 월요일을 구한다.
    // 2. 거기서 7일을 뺀다.

    const thisMonday = new Date(today);

    // dayOfWeek: 0(Sun), 1(Mon), ..., 6(Sat)
    // 한국/ISO 기준 한 주는 월~일 이라고 가정하면:
    // 일요일(0)은 이번주의 마지막 날. -> 월요일로부터 6일 뒤.
    // 월요일(1)은 이번주의 첫 날. -> 월요일로부터 0일 뒤.

    // 즉, 이번주 월요일 = Today - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    thisMonday.setDate(today.getDate() - daysFromMonday);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);

    return lastMonday.toISOString().split('T')[0];
}

/**
 * 지난주 일요일 날짜 반환 (YYYY-MM-DD)
 */
export function getLastSunday(): string {
    const lastMondayStr = getLastMonday();
    const lastMonday = new Date(lastMondayStr);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    return lastSunday.toISOString().split('T')[0];
}

/**
 * 이번 주 월요일 날짜 반환 (YYYY-MM-DD)
 */
export function getThisMonday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // 일요일(0)이면 6일 전이 월요일
    // 월요일(1)이면 0일 전
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysFromMonday);

    return thisMonday.toISOString().split('T')[0];
}
