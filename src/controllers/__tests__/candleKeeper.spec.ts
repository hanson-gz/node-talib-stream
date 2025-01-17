// import { CandleKeeper } from '../candleKeeper';
//
// // https://math.stackexchange.com/questions/595541/rolling-standard-deviations
// describe('CandleKeeper', () => {
//   it('should work', () => {
//     const candleKeeper = new CandleKeeper({ period: 300 });
//     candleKeeper.add(1000, 1250);
//     expect(candleKeeper.get()).toEqual({
//       ts: 0,
//       max: 1250,
//       min: 1250,
//       first: 1250,
//       last: 1250,
//     });
//
//     candleKeeper.add(1100, 1251);
//     candleKeeper.add(1101, 1249);
//     candleKeeper.add(1103, 1252);
//     candleKeeper.add(1103, 1253);
//
//     candleKeeper.add(300103, 1253);
//
//     expect(candleKeeper.get()).toEqual({
//       ts: 300000,
//       max: 1253,
//       min: 1249,
//       first: 1250,
//       last: 1253,
//     });
//     candleKeeper.add(300104, 1251);
//
//     candleKeeper.add(600104, 1952);
//     expect(candleKeeper.get()).toEqual({
//       ts: 600000,
//       max: 1253,
//       min: 1251,
//       first: 1253,
//       last: 1251,
//     });
//   });
//
//   it('should work with backfill empty candles', () => {
//     const onNewCandle = jest.fn();
//     const candleKeeper = new CandleKeeper({ period: 300, onNewCandle });
//     candleKeeper.add(1000, 1250);
//     expect(candleKeeper.get()).toEqual({
//       ts: 0,
//       max: 1250,
//       min: 1250,
//       first: 1250,
//       last: 1250,
//     });
//
//     candleKeeper.add(1100, 1251);
//     candleKeeper.add(1101, 1249);
//     candleKeeper.add(1103, 1252);
//     candleKeeper.add(1103, 1253);
//
//     candleKeeper.add(1000103, 1257);
//     expect(onNewCandle).toHaveBeenCalledTimes(3);
//     expect(candleKeeper.get()).toEqual({
//       ts: 900000,
//       max: 1253,
//       min: 1253,
//       first: 1253,
//       last: 1253,
//     });
//     expect(candleKeeper.getTempCandle(1000105)).toEqual({
//       ts: 900000,
//       max: 1257,
//       min: 1257,
//       first: 1257,
//       last: 1257,
//     });
//   });
//
//   it('should work with shiftMs', () => {
//     const candleKeeper = new CandleKeeper({ period: 300, shiftMs: -5000 });
//     candleKeeper.add(8993000, 1250);
//     expect(candleKeeper.get()).toEqual({
//       ts: 8695000,
//       max: 1250,
//       min: 1250,
//       first: 1250,
//       last: 1250,
//     });
//
//     candleKeeper.add(8996000, 1251);
//     candleKeeper.add(8996001, 1249);
//     candleKeeper.add(8996002, 1252);
//     candleKeeper.add(8996003, 1253);
//     candleKeeper.add(8996003 + 300000, 1253);
//
//     expect(candleKeeper.get()).toEqual({
//       ts: 9295000,
//       max: 1253,
//       min: 1249,
//       first: 1251,
//       last: 1253,
//     });
//
//     candleKeeper.add(8996003 + 300000 + 6000, 1251);
//     candleKeeper.add(8996003 + 300000 + 7000, 1952);
//     candleKeeper.add(8996003 + 600000 + 3000, 1952);
//
//     expect(candleKeeper.get()).toEqual({ ts: 9595000, max: 1952, min: 1251, first: 1253, last: 1952 });
//   });
//
//   it('should work with volume and cost', () => {
//     const candleKeeper = new CandleKeeper({ period: 300, includesVolume: true });
//     candleKeeper.add(1000, 1250, 0, 30.5);
//     expect(candleKeeper.get()).toEqual({
//       ts: 0,
//       max: 1250,
//       min: 1250,
//       first: 1250,
//       last: 1250,
//       buy_cost: 0,
//       sell_cost: 0,
//       buy_volume: 0,
//       sell_volume: 0,
//     });
//
//     candleKeeper.add(1100, 1251, 0, 21);
//     candleKeeper.add(1101, 1249, 1, 22);
//     candleKeeper.add(1103, 1252, 0, 12);
//     candleKeeper.add(1103, 1253, 1, 88);
//
//     candleKeeper.add(300103, 1253, 0, 10);
//
//     expect(candleKeeper.get()).toEqual({
//       ts: 300000,
//       max: 1253,
//       min: 1249,
//       first: 1250,
//       last: 1253,
//       buy_volume: 21 + 12 + 30.5,
//       sell_volume: 22 + 88,
//       buy_cost: 79420,
//       sell_cost: 22 * 1249 + 88 * 1253,
//     });
//   });
// });
