import { Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Query, QueryEntity } from '@datorama/akita';
import { map, withLatestFrom } from 'rxjs/operators';
import { nearestPointOnLine } from '@turf/turf';
import { Route } from '../route.types';
import { NearestPointOnLine } from '@turf/nearest-point-on-line';
import { PathState, PathStore } from './path.store';


@Injectable({
  providedIn: 'root'
})
export class PathQuery extends Query<PathState>{
  start$ = this.select('start');


  constructor(protected store: PathStore) {
    super(store);
  }
}

