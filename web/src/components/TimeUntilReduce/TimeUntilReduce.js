import { useSelector } from "react-redux";
import { useCountdown } from "../../hooks/useCountdown";
import DefinitionList from "../DefinitionList/DefinitionList";

const TimeUntilReduce = () => {
  const { nextHalvePeriod } = useSelector((state) => state.distributor);
  const timer = useCountdown(nextHalvePeriod || 0);

  return (
    <DefinitionList
      dd={nextHalvePeriod ? timer : "..."}
      dt="Time until reducing amount"
      colorT="black"
      colorD="black"
    />
  );
};

export default TimeUntilReduce;
