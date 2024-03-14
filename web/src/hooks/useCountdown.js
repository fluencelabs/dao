import { intervalToDuration, isPast } from "date-fns";
import { useEffect, useMemo, useState } from "react";

const format = ({ months = 0, days = 0, hours = 0, minutes = 0, seconds = 0 }) =>
  `${months}M ${days}d ${hours}h ${minutes}m ${seconds}s`;

export const useCountdown = (date) => {
  const [duration, setDuration] = useState(
    isPast(date) ? {} : intervalToDuration({
      start: Date.now(),
      end: date,
    }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPast(date)) {
        clearInterval(timer);
        return;
      }

      const intToDur = intervalToDuration({
        start: Date.now(),
        end: date,
      });
      setDuration(intToDur);
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  return useMemo(() => format(duration), [duration]);
};
