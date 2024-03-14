import { intervalToDuration, isPast } from "date-fns";
import { useEffect, useMemo, useState } from "react";

const format = ({ months = 0, days = 0, hours = 0, minutes = 0, seconds = 0 }) =>
  `${months}M ${days}d ${hours}h ${minutes}m ${seconds}s`;

export const useCountdown = (date) => {
  const [duration, setDuration] = useState({});

  useEffect(() => {
    setDuration(isPast(date) ? {} : intervalToDuration({
      start: Date.now(),
      end: date,
    }));

    const timer = setInterval(() => {
      if (isPast(date)) {
        clearInterval(timer);
        setDuration({});
        return;
      }

      setDuration(intervalToDuration({
        start: Date.now(),
        end: date,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  return useMemo(() => format(duration), [duration]);
};
