import { constants } from 'src/configs/constants.config';

export function getTimeRange(daysAgo = 15) {
  const maxDay = constants.MAX_TIME_INTERVAL_ORDERS;
  const dayInSeconds = constants.DAY_IN_SECONDS;

  if (daysAgo > maxDay) daysAgo = maxDay;

  const now = Math.floor(Date.now() / 1000);
  const timestampFrom = now - daysAgo * dayInSeconds;
  const timestampTo = now;

  return { timestampFrom, timestampTo };
}
