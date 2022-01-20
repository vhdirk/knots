import { Feature } from "@turf/turf";
import { FeatureCollection, LineString, Point } from "geojson";
import { PathFinderOptions } from "./options";


export interface NodeProperties {
  [neighborId: string]: number // distance to neighbor
}

export interface NodeMap {
  [nodeId: string]: Feature<Point>
}

export interface RouteMap {
  [nodeId: string]: Feature<LineString>
}


export function extendNodeMap(nodeMap: NodeMap, nodes: FeatureCollection<Point>, opts?: PathFinderOptions): NodeMap {

  for (const node of nodes.features) {

    // if (nodeMap[node.properties.id]) {
    //   console.log('node already exists', node.properties.id);
    //   // none of these situations are ideal and should be prevented.
    //   if (Object.keys(nodeMap[node.properties.id]) >= node.properties.connections) {
    //     // node already processed. skipping
    //     continue;
    //   }
    // }

    nodeMap[node.properties.id] = node;
  }

  return nodeMap;
}
