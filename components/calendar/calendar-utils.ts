export const MONTHS_NL = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

export const DAYS_NL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
export const SHORT_DAYS_NL = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

export function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

export function isToday(d: Date): boolean {
    return isSameDay(d, new Date());
}

export function formatNL(date: Date, options?: { includeTime?: boolean }): string {
    const day = date.getDate();
    const month = MONTHS_NL[date.getMonth()];
    const ret = `${day} ${month}`;
    if (options?.includeTime) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${ret}, ${hours}:${minutes}`;
    }
    return ret;
}

export function getMonthGrid(year: number, month: number) {
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month); // 0 = Sun

    // Adjust for Monday start (NL standard)
    // NL: Mon=0, Tue=1, ... Sun=6
    // JS: Sun=0, Mon=1
    // Conversion: (day + 6) % 7
    const startDayNL = (startDay + 6) % 7;

    const grid: (Date | null)[] = [];

    // Pad start
    for (let i = 0; i < startDayNL; i++) {
        grid.push(null);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push(new Date(year, month, i));
    }

    return grid;
}
