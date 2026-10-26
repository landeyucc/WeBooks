declare module 'lunar-javascript' {
  export class Solar {
    constructor(y: number, m: number, d: number)
    static fromDate(date: Date): Solar
    getLunar(): Lunar
  }

  export class Lunar {
    getYearInGanZhiExact(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getJieQi(): string
    getYearShengXiaoExact(): string
    toString(): string
  }
}
