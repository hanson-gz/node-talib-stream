export namespace CandleKeeper {
  export interface Options {
    period: number;
    shiftMs?: number;
    includesVolume?: boolean;
    onNewCandle?: (candle: CandleKeeper.Candle) => any;
    exchange?: string;
    symbol?: string;
  }
  export interface Candle {
    ts: number;
    max: number;
    min: number;
    first: number;
    last: number;
    buy_volume?: number;
    sell_volume?: number;
    buy_cost?: number;
    sell_cost?: number;
    exchange?: string;
    pairDb?: string;
    avg?: number;
    buy_times?: number;
    sell_times?: number;
    len?: number;
  }
}

export class CandleKeeper {
  private period: number;
  private max = 0;
  private min = 0;
  private last = 0;
  private first = 0;
  private buy_volume = 0;
  private sell_volume = 0;
  private buy_cost = 0;
  private sell_cost = 0;
  private buy_times = 0;
  private sell_times = 0;
  private shiftMs = 0;
  private len = 0;
  private lastCandle?: CandleKeeper.Candle;
  private onNewCandle?: (candle: CandleKeeper.Candle) => any;
  private includesVolume = false;

  exchange?: string;
  symbol?: string;

  constructor(options: CandleKeeper.Options) {
    this.period = options.period;
    if (options.shiftMs && options.shiftMs > 0) {
      throw new Error(`shiftMs must be < 0`);
    }
    this.shiftMs = options.shiftMs || 0;
    this.onNewCandle = options.onNewCandle;
    this.includesVolume = options.includesVolume || false;

    this.exchange = options.exchange;
    this.symbol = options.symbol;
  }

  setOnNewCandle(onNewCandle: CandleKeeper.Options['onNewCandle']) {
    this.onNewCandle = onNewCandle;
  }

  // snap timestamp to resolution.
  // e.g. 10:01:00 should snap tp 10:00:00 for 14400 resolution
  // special if it is already the exact time, it will return the same time back.
  // be aware not to create infinite loops
  static snapTimestamp(ts: number, resolution: number, shiftMs: number = 0): number {
    if (!resolution) throw new Error('invalid resolution in snapTimestamp');
    let newEpoch = ts - (ts % (resolution * 1000)) + shiftMs;
    if (shiftMs) {
      if (ts - newEpoch > resolution * 1000) {
        newEpoch += resolution * 1000;
      }
    }
    return newEpoch;
  }

  addTrade(tradeV2: number[]) {
    const [ts, side, r, a] = tradeV2;
    this.add(ts, r, side, a);
  }

  resetCandle() {
    if (!this.lastCandle) return;
    this.lastCandle.buy_volume = 0;
    this.lastCandle.sell_volume = 0;
    this.lastCandle.buy_cost = 0;
    this.lastCandle.sell_cost = 0;
    this.lastCandle.buy_times = 0;
    this.lastCandle.sell_times = 0;
  }

  add(ts: number, price: number, side: number = 0, amount: number = 0) {
    const shiftMs = this.shiftMs;
    if (!this.lastCandle) {
      this.lastCandle = {
        exchange: this.exchange,
        pairDb: this.symbol,
        ts: CandleKeeper.snapTimestamp(ts, this.period, shiftMs),
        max: price,
        min: price,
        first: price,
        last: price,
      };
      if (this.includesVolume) {
        this.lastCandle.buy_volume = this.buy_volume;
        this.lastCandle.sell_volume = this.sell_volume;
        this.lastCandle.buy_cost = this.buy_cost;
        this.lastCandle.sell_cost = this.sell_cost;
        this.lastCandle.buy_times = this.buy_times;
        this.lastCandle.sell_times = this.sell_times;
      }
    } else if (ts - this.lastCandle.ts >= this.period * 1000) {
      if (ts - this.lastCandle.ts >= 2 * this.period * 1000) {
        // maybe there are some gap in these trades, backfill empty candles.
        let currentTmpCandleTs = this.lastCandle.ts + this.period * 1000;
        while (currentTmpCandleTs < ts - this.period * 1000) {
          const lastCandlePrice: number = this.last;
          this.lastCandle = {
            exchange: this.exchange,
            pairDb: this.symbol,
            ts: CandleKeeper.snapTimestamp(currentTmpCandleTs, this.period, shiftMs),
            max: lastCandlePrice,
            min: lastCandlePrice,
            first: lastCandlePrice,
            last: lastCandlePrice,
          };
          if (this.includesVolume) {
            this.resetCandle();
          }
          this.max = lastCandlePrice;
          this.min = lastCandlePrice;
          this.first = lastCandlePrice;
          this.last = lastCandlePrice;
          this.onNewCandle && this.onNewCandle(this.get());
          currentTmpCandleTs += this.period * 1000;
        }
      }
      // generate new candle
      this.lastCandle = {
        exchange: this.exchange,
        pairDb: this.symbol,
        ts: CandleKeeper.snapTimestamp(ts, this.period, shiftMs),
        max: this.max,
        min: this.min,
        first: this.first,
        last: this.last,
      };
      if (this.includesVolume) {
        this.lastCandle.buy_volume = this.buy_volume;
        this.lastCandle.sell_volume = this.sell_volume;
        this.lastCandle.buy_cost = this.buy_cost;
        this.lastCandle.sell_cost = this.sell_cost;
        this.lastCandle.buy_times = this.buy_times;
        this.lastCandle.sell_times = this.sell_times;
      }
      this.onNewCandle && this.onNewCandle(this.get());
      this.first = 0;
    }
    // new candle, reset all data
    if (!this.first) {
      this.first = price;
      this.max = price;
      this.min = price;
      if (this.includesVolume) {
        this.resetCandle();
      }
    }

    this.max = Math.max(price, this.max);
    this.min = Math.min(price, this.min);
    this.last = price;

    if (this.includesVolume) {
      if (side === 0) {
        this.buy_volume += amount;
        this.buy_cost += amount * price;
        this.buy_times++;
      } else {
        this.sell_volume += amount!;
        this.sell_cost += amount * price;
        this.sell_times++;
      }
    }
  }

  get(): CandleKeeper.Candle {
    if (!this.lastCandle) {
      console.error(`CandleKeeper no last candle ${this.exchange} ${this.symbol}`);
      return {
        exchange: this.exchange,
        pairDb: this.symbol,
        ts: 0,
        max: 0,
        min: 0,
        first: 0,
        last: 0,
        len: 0,
        buy_times: 0,
        sell_times: 0,
        buy_cost: 0,
        sell_cost: 0,
        buy_volume: 0,
        sell_volume: 0,
        avg: 0,
      };
    } else {
      const candle = {
        ...this.lastCandle,
      };
      const len = this.lastCandle!.buy_times! + this.lastCandle!.sell_times!;
      if (this.includesVolume && len) {
        candle.avg =
          (this.lastCandle.buy_cost! + this.lastCandle.sell_cost!) /
          (this.lastCandle!.buy_volume! + this.lastCandle!.sell_volume!);
        candle.len = len;
      }
      return candle;
    }
  }

  getTempCandle(ts: number) {
    const shiftMs = this.shiftMs;
    const tmpCandle: CandleKeeper.Candle = {
      exchange: this.exchange,
      pairDb: this.symbol,
      ts: CandleKeeper.snapTimestamp(ts, this.period, shiftMs),
      max: this.max,
      min: this.min,
      first: this.first,
      last: this.last,
    };
    if (this.includesVolume) {
      tmpCandle.buy_volume = this.buy_volume;
      tmpCandle.sell_volume = this.sell_volume;
      tmpCandle.buy_cost = this.buy_cost;
      tmpCandle.sell_cost = this.sell_cost;
    }
    return tmpCandle;
  }

  getPeriod() {
    return this.period;
  }
}
