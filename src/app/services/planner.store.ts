import { Injectable } from "@angular/core";
import { EntityStore, Store, StoreConfig } from '@datorama/akita';
import { FeatureCollection, LineString, Point } from 'geojson';


export interface SegmentState {
  segment: string[]
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'planner',
  resettable: true,
})
export class PlannerStore extends EntityStore<SegmentState>{
  constructor() {
    super();
  }
}
