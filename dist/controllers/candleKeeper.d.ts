export declare namespace CandleKeeper {
    interface Options {
        period: number;
    }
}
export declare class CandleKeeper {
    private period;
    private max;
    private min;
    private last;
    private first;
    private lastCandle?;
    constructor(options: CandleKeeper.Options);
    static snapTimestamp(ts: number, resolution: number): number;
    add(ts: number, price: number): void;
    get(): {
        ts: number;
        max: number;
        min: number;
        first: number;
        last: number;
    } | undefined;
    getPeriod(): number;
}