import { distinctUntilChanged, Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { PlannerState, PlannerStore } from './planner.store';
import { PlannerService } from './planner.service';
import { Feature, LineString, Point } from 'geojson';


export interface NodeItem {
  node: Feature<Point>,
  keyNode: boolean
}

export interface PlannerSegment {
  node: Feature<Point>,
  route?: Feature<LineString>;
  distance: number;
  cumulativeDistance: number;
}


@Injectable({
  providedIn: 'root'
})
export class PlannerQuery extends Query<PlannerState>{
  start$: Observable<Feature<Point>> = this.select('start') as Observable<Feature<Point>>;

  nodes$: Observable<NodeItem[]> = this.select((state) => {
    const nodes = this.plannerService.getNodes(state) as Feature<Point>[];
    const keyNodes = this.plannerService.getKeyNodes(state).map(node => (<Feature<Point>>node).properties.id);
    return nodes.map((node, pos, arr) => {
      let keyNode = false;
      if (pos === 0) {
        keyNode = true;
      } else {
        keyNode = keyNodes.includes(node.properties.id);

        if (!keyNode && node.properties.number === arr[pos - 1].properties.number) {
          keyNode = keyNodes.includes(arr[pos - 1].properties.id);
        }
      }

      return { node, keyNode }
    }).filter((node, pos, arr) => {

      // Always keep the 0th element as there is nothing before it
      if (pos === 0) {
        return true;
      }
      // If the previous one is the same, then remove it
      if (node.node.properties.number === arr[pos - 1].node.properties.number) {
        return false;
      }

      // if nothing else matches, keep it
      return true;
    });
  });

  segments$: Observable<PlannerSegment[]> = this.select((state) => {
    const nodes = this.plannerService.getNodes(state) as Feature<Point>[];
    const routes = this.plannerService.getRoutes(state) as Feature<LineString>[];

    const removedConnections = [];
    const filteredNodes = nodes.filter((node, pos, arr) => {
      // Always keep the 0th element as there is nothing before it
      if (pos === 0) {
        return true;
      }
      // If the previous one is the same, then remove it
      if (node.properties.number === arr[pos - 1].properties.number) {
        removedConnections.push(`${arr[pos - 1].properties.id}-${node.properties.id}`);
        removedConnections.push(`${node.properties.id}-${arr[pos - 1].properties.id}`);
        return false;
      }

      // if nothing else matches, keep it
      return true;
    });

    const filteredRoutes = routes.filter((route, pos, arr) => {
      return removedConnections.indexOf(route.properties.pid) === -1;
    });

    let cumulativeDistance = 0;
    return filteredNodes.map((node, pos) => {
      if (pos === 0) {
        return { node, distance: 0, cumulativeDistance: 0 };
      }

      const route = filteredRoutes[pos-1];
      cumulativeDistance += route.properties.distance;

      return { node: node as Feature<Point>, route: route as Feature<LineString>, distance: route.properties.distance as number, cumulativeDistance };
    });
  });

  constructor(protected store: PlannerStore, protected plannerService: PlannerService) {
    super(store);
  }
}

