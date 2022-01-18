import { Injectable } from "@angular/core";
import { Store, StoreConfig } from '@datorama/akita';
import { FeatureCollection, LineString, Point } from 'geojson';


export interface NeighbourhoodState {
  networkIds: number[];
  nodes: FeatureCollection<Point>[];
  routes: FeatureCollection<LineString>[];
}


export function createInitialState(): NeighbourhoodState {
  return {
    networkIds: [],
    nodes: null,
    routes: null,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'neighbourhood',
  resettable: true,
})
export class NeighbourhoodStore extends Store<NeighbourhoodState>{
  constructor() {
    super(createInitialState());
  }
}
