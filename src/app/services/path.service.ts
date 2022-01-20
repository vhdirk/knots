import { Injectable } from '@angular/core';
import { WorkerService } from './worker.service';
import { Feature } from '@nativescript-community/ui-mapbox';
import { PathStore } from './path.store';


export function lastElement(arr: any[]) {
  return arr[arr.length - 1];
}

@Injectable({
  providedIn: 'root'
})
export class PathService {
  constructor(protected worker: WorkerService, protected pathStore: PathStore) {
  }

  addDestination(destination: Feature) {
    const pathState = this.pathStore.getValue();
    const destinationId = <string>(<any>destination.properties).id;
    if (pathState.start === destinationId) {
      return;
    }

    if (pathState.start === null) {
      this.pathStore.update({ start: destinationId });
      return;
    }

    this.pathStore.setLoading(true);

    if (!pathState.paths.length) {
      this.worker.findPath(pathState.start, destinationId);
      return;
    }

    const lastPath = lastElement(pathState.paths);
    const lastNode = lastElement(lastPath.nodes);
    console.log('last node', lastNode);
    this.worker.findPath(lastNode?.properties?.id, destinationId);
  }

}

