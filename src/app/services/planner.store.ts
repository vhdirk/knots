import { Injectable } from "@angular/core";
import { EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Feature } from "@nativescript-community/ui-mapbox";
import { FeatureCollection, LineString, Point } from 'geojson';


export interface Path {
  distance: number;
  nodes: Feature[];
  routes: Feature[];
}

export interface PlannerState {
  start: Feature | null;
  paths: Path[];
}

export function createInitialState(): PlannerState {
  return {
    start: null,
    paths: []
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'planner',
  resettable: true,
})
export class PlannerStore extends Store<PlannerState>{
  constructor() {
    super(createInitialState());
  }
}
