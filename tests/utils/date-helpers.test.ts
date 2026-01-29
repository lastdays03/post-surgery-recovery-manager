import { describe, it, expect } from 'vitest';
import { getLastMonday, getLastSunday, getThisMonday } from '@/lib/utils/date-helpers';

describe('Date Helpers', () => {
    it('getLastMonday returns a Monday', () => {
        const lastMonday = getLastMonday();
        const date = new Date(lastMonday);
        expect(date.getDay()).toBe(1); // 1 = Monday
    });

    it('getLastSunday returns a Sunday', () => {
        const lastSunday = getLastSunday();
        const date = new Date(lastSunday);
        expect(date.getDay()).toBe(0); // 0 = Sunday
    });

    it('getLastSunday is 6 days after getLastMonday', () => {
        const lastMonday = getLastMonday();
        const lastSunday = getLastSunday();

        const mondayDate = new Date(lastMonday);
        const sundayDate = new Date(lastSunday);

        const diffDays = (sundayDate.getTime() - mondayDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBe(6);
    });

    it('getThisMonday returns current week Monday', () => {
        const thisMonday = getThisMonday();
        const date = new Date(thisMonday);
        expect(date.getDay()).toBe(1);
    });
});
