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


@Injectable({
  providedIn: 'root'
})
export class NeighborhoodService {
  constructor(protected worker: WorkerService, protected neighborhoodStore: NeighborhoodStore) {
  }

  setViewport(viewport: Viewport) {
    this.neighborhoodStore.setLoading(false);
    this.worker.setViewport(viewport);
  }
}

