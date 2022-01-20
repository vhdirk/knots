import Queue from 'tinyqueue';
import { NodeMap } from './node-map';

type Item = [number, string[], string];

export function dijkstra(nodeMap: NodeMap, start: string, end: string): [number, string[]] | null {
  const costs = {};
  costs[start] = 0;
  const initialState: Item = [0, [start], start];
  const queue = new Queue<Item>([initialState], (a, b) => { return a[0] - b[0]; });

  while (queue.length) {
    const state = queue.pop();
    const cost = state[0];
    const node = state[2];

    if (node === end) {
      return [cost, state[1]];
    }

    if (!nodeMap[node]) {
      // node not in map, skip
      continue;
    }

    const neighbors = nodeMap[node].properties.connections;
    neighbors.forEach((n) => {
      const newCost = cost + n.distance;
      if (!(n.id in costs) || newCost < costs[n.id]) {
        costs[n.id] = newCost;
        const newState: Item = [newCost, state[1].concat([n.id]), n.id];
        queue.push(newState);
      }
    });
  }

  return null;
}
