import { EntityState } from '@datorama/akita';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import {Route} from './route.types';

export interface NodeConnection {
  id: string;
  number: string;
  location: [number, number];
  distance: number;
  route: string;
}

export interface Node {
  id: string;

}

export interface Node extends Feature<Point> {
  properties: {
    number: string;
    distance?: number;
    connections: NodeConnection[];
    location: [number, number];
  };
}

export interface NeighbourhoodState {
  networkIds: number[];
  nodes: FeatureCollection<Point>[];
  routes: FeatureCollection<LineString>[];
}


export interface Position {
  coordinate: [number, number],
  zoomLevel: number //TODO 0 - 21 (21 is zoomed in)
};

