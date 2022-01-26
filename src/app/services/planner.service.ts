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

  getNodes(state: PlannerState): Feature[] {
    if (state?.paths?.length) {
      return state.paths.map(p => p.nodes).flat();
    }

    if (state?.start) {
      return [state.start];
    }

    return [];
  }

  getKeyNodes(state: PlannerState): Feature[] {
    if (state?.paths?.length) {
      return [state.start, ...state.paths.map(p => {
        return p.nodes[p.nodes.length - 1];

      })]
    }

    if (state?.start) {
      return [state.start];
    }

    return [];
  }

  getRoutes(state: PlannerState): Feature[] {
    if (state?.paths?.length) {
      return state.paths.map(p => p.routes).flat();
    }
    return [];
  }

  addDestination(destination: Feature) {
    const plannerState = this.plannerStore.getValue();
    const destinationId = <string>(<any>destination.properties).id;
    if (<string>(<any>plannerState.start?.properties)?.id === destinationId) {
      return;
    }

    if (plannerState.start === null) {
      this.plannerStore.update({ start: destination });
      return;
    }

    if (plannerState.start === destination) {
      return;
    }


    if (!plannerState?.paths?.length) {
      this.plannerStore.setLoading(true);
      this.worker.findPath(plannerState.start, destination);
      return;
    }

    const lastPath = lastElement(plannerState.paths);
    const lastNode = lastElement(lastPath.nodes);

    if (lastNode === destination) {
      return;
    }

    this.plannerStore.setLoading(true);
    this.worker.findPath(lastNode, destination);
  }

  removeLastDestination() {
    const plannerState = this.plannerStore.getValue();
    if (plannerState.start === null) {
      // Nothing to do
      return;
    }

    if (!plannerState.paths.length) {
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

  deletePath() {
    this.plannerStore.update({ start: null, paths: [] });
  }


}

