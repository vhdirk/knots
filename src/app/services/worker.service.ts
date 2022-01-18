import { Injectable } from "@angular/core";
import { NeighborhoodStore } from "./neighborhood.store";
import { Viewport } from '@nativescript-community/ui-mapbox';
import { NeighborhoodQuery } from "./neighborhood.query";

export { PERMISSIONS } from "nativescript-permissions";

@Injectable({
  providedIn: "root"
})
export class WorkerService {

  worker: Worker;
  constructor(protected neighborhoodStore: NeighborhoodStore, protected neighborhoodQuery: NeighborhoodQuery) { }


  setup() {
    this.worker = new Worker('../workers/data-handler.worker');
    this.worker.onerror = (err) => {
      console.error(err);
    };
    this.worker.onmessage = ({ data }) => {
      console.log("received data from worker");
      if (data.hasOwnProperty('nodes')) {
        this.neighborhoodStore.update(state => data);
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

  setViewport(viewport: Viewport) {
    console.log('setViewport', viewport);
    this.worker.postMessage({ action: 'change-viewport', ...viewport});
  }
}


