import { Injectable, NgZone } from "@angular/core";
import { NeighborhoodStore } from "./neighborhood.store";
import { Feature, Viewport } from '@nativescript-community/ui-mapbox';
import { PlannerState, PlannerStore } from "./planner.store";
import equal from 'fast-deep-equal/es6';
export { PERMISSIONS } from "nativescript-permissions";

@Injectable({
  providedIn: "root"
})
export class WorkerService {

  worker: Worker;
  constructor(private zone: NgZone,
    protected neighborhoodStore: NeighborhoodStore,
    protected plannerStore: PlannerStore) { }


  setup() {
    this.worker = new Worker('../workers/data-handler.worker');
    this.worker.onerror = (err) => {
      this.zone.run(() => {
        console.error(err);
      });
    };
    this.worker.onmessage = ({ data }) => {
      this.zone.run(() => {
        console.log("received data from worker", data.response);
        if (data.response === 'neighborhood') {
          this.neighborhoodStore.update(state => data);
          this.neighborhoodStore.setLoading(false);
        }

        if (data.response === 'path') {
          if (data.error) {
            this.plannerStore.setError({ 'code': data.error });
          } else {
            console.log('first last node', data.nodes[0].properties.number, data.nodes[data.nodes.length - 1].properties.number);

            const pathState = this.plannerStore.getValue();

            if (pathState.paths?.length > 0 && equal(pathState.paths[pathState.paths.length - 1], data)) {
              return;
            }


            this.plannerStore.update(state => {

              if (state.paths.length == 0) {
                const newState: PlannerState = {
                  start: data.nodes[0],
                  paths: [data]
                }
                return newState;
              }

              const newState: PlannerState = {
                start: state.start,
                paths: [...state.paths, data]
              }
              return newState;
            });
          }
          this.plannerStore.setLoading(false);
        }
      });
      // this.changeDetectorRef.detectChanges();
    };
  }

  setViewport(viewport: Viewport) {
    this.worker.postMessage({ action: 'change-viewport', ...viewport });
  }

  findPath(start: Feature, end: Feature) {
    this.worker.postMessage({ action: 'find-path', start, end });
  }

}


