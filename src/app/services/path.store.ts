import { Injectable } from "@angular/core";
import { EntityStore, Store, StoreConfig } from '@datorama/akita';
import { FeatureCollection, LineString, Point } from 'geojson';


export interface Path {
  distance: number;
  nodes: string[];
  routes: string[];
}

export interface PathState {
  start: string | null;
  paths: Path[];
}

export function createInitialState(): PathState {
  return {
    start: null,
    paths: []
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'path',
  resettable: true,
})
export class PathStore extends Store<PathState>{
  constructor() {
    super(createInitialState());
  }
}
