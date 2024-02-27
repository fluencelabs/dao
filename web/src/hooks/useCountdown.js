import { intervalToDuration, isPast } from "date-fns";
import { useEffect, useState } from "react";

export const useCountdown = (date) => {
  const format = ({ months, days, hours, minutes, seconds }) =>
    `${months}M ${days}d ${hours}h ${minutes}m ${seconds}s`;

  const [ended, setEnded] = useState(isPast(date));
  const [duration, setDuration] = useState(
    intervalToDuration({
      start: date,
      end: Date.now(),
    }),
  );
  const [formatted, setFormatted] = useState(format(duration));

  useEffect(() => {
    const timer = setInterval(() => {
      const intToDur = intervalToDuration({
        start: date,
        end: Date.now(),
      });
      setDuration(intToDur);
      setFormatted(format(intToDur));
      setEnded(isPast(date));
    }, 1000);

    ended && clearInterval(timer);
    return () => clearInterval(timer);
  }, []);

  return [formatted, duration];
};
