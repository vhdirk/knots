import { point } from '@turf/helpers'
import distance from '@turf/distance';

export enum PathFinderAlgorithm {
  DIJKSTRA
}

export interface PathFinderOptions {
  algorithm?: PathFinderAlgorithm;
  keyFn?: any;
  precision?: number;
  weightFn?: any;
  edgeDataReduceFn?: any;
  edgeDataSeed?: any;
  compact?: boolean;
}

export function defaultOptions(options?: PathFinderOptions): PathFinderOptions {
  const opts = options || {};
  return {
    keyFn: opts.keyFn ? opts.keyFn : (c) => c.join(','),
    weightFn: opts.weightFn ? opts.weightFn : (a, b) => distance(point(a), point(b)),
    precision: opts.precision ? opts.precision : 1e-5,
    edgeDataReduceFn: opts.edgeDataReduceFn ? opts.edgeDataReduceFn : null,
    edgeDataSeed: opts.edgeDataSeed ? opts.edgeDataSeed : {},
    compact: opts.compact ? opts.compact : false,
    algorithm: opts.algorithm ? opts.algorithm : PathFinderAlgorithm.DIJKSTRA,
  };
}
