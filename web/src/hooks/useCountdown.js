import { intervalToDuration, isPast } from 'date-fns'
import { useEffect, useState } from 'react'

export const useCountdown = (date) => {
    const format = ({ days, hours, minutes, seconds }) => `${days}d ${hours}h ${minutes}m ${seconds}s`

    const [ended, setEnded] = useState(isPast(date))
    const [duration, setDuration] = useState(intervalToDuration({
        start: date, 
        end: new Date(),
    }))
    const [formatted, setFormatted] = useState(format(duration))

    useEffect(() => {
        const timer = setInterval(() => {
            const intToDur = intervalToDuration({
                start: date, 
                end: new Date(),
            })
            setDuration(intToDur)
            setFormatted(format(intToDur))
            setEnded(isPast(date))
        }, 1000);

        ended && clearInterval(timer)
        return () => clearInterval(timer);
    }, [])

    return [ formatted, duration ]
}