import { useSelector } from "react-redux"
import { useCountdown } from "../../hooks/useCountdown"
import DefinitionList from "../DefinitionList/DefinitionList"

const TimeUntilReduce = () => {
    const { nextHalvePeriod } = useSelector(state => state.distributor)
    const [ timer ] = useCountdown(nextHalvePeriod || 0)

    // loading
    if (!nextHalvePeriod) {
        return <DefinitionList dd={'...'} dt="Time until reducing amount" colorT="black" colorD="black" />
    }

    return <DefinitionList dd={timer} dt="Time until reducing amount" colorT="black" colorD="black" />
}

export default TimeUntilReduce