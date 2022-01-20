import { Injectable } from "@angular/core";
import { NeighborhoodStore } from "./neighborhood.store";
import { Feature, Viewport } from '@nativescript-community/ui-mapbox';
import { PathStore } from "./path.store";

export { PERMISSIONS } from "nativescript-permissions";

@Injectable({
  providedIn: "root"
})
export class WorkerService {

  worker: Worker;
  constructor(protected neighborhoodStore: NeighborhoodStore,
              protected pathStore: PathStore) { }


  setup() {
    this.worker = new Worker('../workers/data-handler.worker');
    this.worker.onerror = (err) => {
      console.error(err);
    };
    this.worker.onmessage = ({ data }) => {
      console.log("received data from worker");
      if (data.response === 'neighborhood') {
        this.neighborhoodStore.update(state => data);
        this.neighborhoodStore.setLoading(false);
      }

      if (data.response === 'path') {
        this.pathStore.update(state => data);
        this.pathStore.setLoading(false);
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

  findPath(start: string, end: string) {
    this.worker.postMessage({ action: 'find-path', start, end });
  }

}


