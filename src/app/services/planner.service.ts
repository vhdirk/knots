import { Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { map, withLatestFrom } from 'rxjs/operators';
import { nearestPointOnLine } from '@turf/turf';
import { Route } from '../route.types';
import { NearestPointOnLine } from '@turf/nearest-point-on-line';
import { NeighborhoodState, NeighborhoodStore } from './neighborhood.store';
import { Position } from '../neighborhood.types';
import {WorkerService} from './worker.service';
import { Viewport } from '@nativescript-community/ui-mapbox';
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
export class PlannerService {
  constructor(protected worker: WorkerService) {
  }

}

