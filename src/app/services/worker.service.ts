import { Injectable } from "@angular/core";
import { NeighborhoodStore } from "./neighborhood.store";
import { Viewport } from '@nativescript-community/ui-mapbox';
import { PathState, PathStore } from "./path.store";

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
      console.log("received data from worker", data.response);
      if (data.response === 'neighborhood') {
        this.neighborhoodStore.update(state => data);
        this.neighborhoodStore.setLoading(false);
      }

      if (data.response === 'path') {
        if (data.error) {
          this.pathStore.setError({'code': data.error});
        } else {
          console.log('received routes', data.routes.length);
          this.pathStore.setLoading(false);
          this.pathStore.update(state => {
            const newState: PathState = {
              start: state.start,
              paths: [...state.paths, data]
            }
            return newState;
          });
        }
      }
    };
  }

  setViewport(viewport: Viewport) {
    this.worker.postMessage({ action: 'change-viewport', ...viewport});
  }

  findPath(start: string, end: string) {
    this.worker.postMessage({ action: 'find-path', start, end });
  }

}


