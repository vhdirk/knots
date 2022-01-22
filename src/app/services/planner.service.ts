import { Injectable } from '@angular/core';
import { WorkerService } from './worker.service';
import { Feature } from '@nativescript-community/ui-mapbox';
import { PlannerState, PlannerStore } from './planner.store';


export function lastElement(arr: any[]) {
  return arr[arr.length - 1];
}

@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  constructor(protected worker: WorkerService, protected plannerStore: PlannerStore) {
  }

  addDestination(destination: Feature) {
    console.log('destination',  destination)

    const pathState = this.plannerStore.getValue();
    const destinationId = <string>(<any>destination.properties).id;
    if (<string>(<any>pathState.start?.properties)?.id === destinationId) {
      return;
    }

    if (pathState.start === null) {
      this.plannerStore.update({ start: destination });
      return;
    }

    if (pathState.start === destination) {
      return;
    }

    this.plannerStore.setLoading(true);

    if (!pathState?.paths?.length) {
      this.worker.findPath(pathState.start, destination);
      return;
    }

    const lastPath = lastElement(pathState.paths);
    const lastNode = lastElement(lastPath.nodes);

    if (lastNode === destination) {
      this.plannerStore.setLoading(false);
      return;
    }

    this.worker.findPath(lastNode, destination);
  }

  removeLastDestination() {
    const pathState = this.plannerStore.getValue();
    if (pathState.start === null) {
      // Nothing to do
      return;
    }

    if (!pathState.paths.length) {
      this.plannerStore.update({ start: null });
      return;
    }

    this.plannerStore.update(state => {
      const newState: PlannerState = {
        start: state.start,
        paths: state.paths.slice(0, -1)
      }
      return newState;
    });
  }

}

