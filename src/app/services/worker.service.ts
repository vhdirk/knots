import { Observable, of as observableOf, from as observableFrom } from "rxjs";
import { Injectable } from "@angular/core";
import { hasPermission, requestPermission } from "nativescript-permissions";
import { NeighbourhoodStore } from "./neighbourhood.store";
import { Position } from "../neighborhood.types";
import { Viewport } from '@nativescript-community/ui-mapbox';
import { NeighbourhoodService } from "./neighbourhood.service";
import { NeighbourhoodQuery } from "./neighbourhood.query";

export { PERMISSIONS } from "nativescript-permissions";

@Injectable({
  providedIn: "root"
})
export class WorkerService {

  worker: Worker;
  constructor(protected neighbourhoodStore: NeighbourhoodStore, protected neighbourhoodQuery: NeighbourhoodQuery) { }


  setup() {
    this.worker = new Worker('../workers/data-handler.worker');
    // this.worker.postMessage({ action: 'load'});
    this.worker.onerror = (err) => {
      console.error(err);
    };
    this.worker.onmessage = ({ data }) => {
      console.log("received data from worker");
      if (data.hasOwnProperty('nodes')) {
        // this.neighbourhoodStore.upsertMany;
        this.neighbourhoodStore.update(state => data);
        // this.neighbourhoodQuery.neighbourhoods$.next(data);
      }
      // if (data.hasOwnProperty('position')) {
      //   this.store.dispatch(setPosition({ position: data.position }));
      // }
      // if (data.hasOwnProperty('activeRoute')) {
      //   this.store.dispatch(setActiveRoute({ route: data.activeRoute }));
      // }
      // if (data.hasOwnProperty('destinationNode')) {
      //   this.store.dispatch(setDestination({ destination: data.destinationNode }));
      // }
    };


    // this.geo.position$.subscribe((location) => {
    //   worker.postMessage(location);
    // });

  }

  setPosition(position: Position) {
    this.worker.postMessage({ action: 'change-position', ...position});
  }

  setViewport(viewport: Viewport) {
    console.log('setViewport', viewport);
    this.worker.postMessage({ action: 'change-viewport', ...viewport});
  }
}


