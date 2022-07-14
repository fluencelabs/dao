import { useSubgraph } from "thegraph-react";
import { useSelector } from 'react-redux';
import { testAccsQuery } from '../../utils/graphQueries';

export default function TestSubgraph() {
    const { fluence } = useSelector(state => state.graph)
    const { useQuery } = useSubgraph(fluence);
    const { error, loading, data } = useQuery(testAccsQuery);
    return (
      <div>
        <div>{(error || loading) ? 'Loading...' : JSON.stringify(data)}</div>
      </div>
    );
  }