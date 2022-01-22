import { distinctUntilChanged, Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { PlannerState, PlannerStore } from './planner.store';
import { Feature } from '@nativescript-community/ui-mapbox';


@Injectable({
  providedIn: 'root'
})
export class PlannerQuery extends Query<PlannerState>{
  start$ = this.select('start');

  keyNodes$: Observable<Feature[]> = this.select(state => {
    if (state?.paths?.length) {
      return [state.start, ...state.paths.map(p => {
        return p.nodes[p.nodes.length-1];

      })]
    }

    if (state?.start) {
      return [state.start];
    }

    return [];
  }).pipe(distinctUntilChanged());

  constructor(protected store: PlannerStore) {
    super(store);
  }
}

