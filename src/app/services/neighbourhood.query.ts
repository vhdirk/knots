import { Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Query, QueryEntity } from '@datorama/akita';
import { map, withLatestFrom } from 'rxjs/operators';
import { nearestPointOnLine } from '@turf/turf';
import { Route } from '../route.types';
import { NearestPointOnLine } from '@turf/nearest-point-on-line';
import { NeighbourhoodStore } from './neighbourhood.store';
import { NeighbourhoodState } from '../neighborhood.types';

// const selectNodes = (state: AppState) => state.neighborhood.nodes;
// const selectRoutes = (state: AppState) => state.neighborhood.routes;

// export interface ClosestRoute {
//   route: Route;
//   point: NearestPointOnLine;
// }

// function getClosestRoute(routes: Route[], coords: Coords): ClosestRoute {
//   return routes
//     .map(feature => {
//       return {
//         route: feature,
//         point: nearestPointOnLine(feature.geometry, coords, { units: 'meters' }),
//       };
//     })
//     .sort((a, b) => a.point.properties.dist - b.point.properties.dist)
//     .shift();
// }


@Injectable({
  providedIn: 'root'
})
export class NeighbourhoodQuery extends Query<NeighbourhoodState>{
  neighbourhoods$ = new Subject<NeighbourhoodState>();

  constructor(protected store: NeighbourhoodStore) {
    super(store);
  }
}
