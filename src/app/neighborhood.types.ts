import { Feature, Point } from 'geojson';

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

export interface Position {
  coordinate: [number, number],
  zoomLevel: number //TODO 0 - 21 (21 is zoomed in)
};

