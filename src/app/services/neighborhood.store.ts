import { Injectable } from "@angular/core";
import { Store, StoreConfig } from '@datorama/akita';
import { FeatureCollection, LineString, Point } from 'geojson';


export interface NeighborhoodState {
  networkIds: number[];
  nodes: FeatureCollection<Point>[];
  routes: FeatureCollection<LineString>[];
}


export function createInitialState(): NeighborhoodState {
  return {
    networkIds: [],
    nodes: [],
    routes: [],
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'neighborhood',
  resettable: true,
})
export class NeighborhoodStore extends Store<NeighborhoodState>{
  constructor() {
    super(createInitialState());
  }
}
