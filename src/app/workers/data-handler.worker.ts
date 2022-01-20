/// <reference lib="webworker" />
import "globals";
import { from as observableFrom, of as observableOf, combineLatest, Observable, Subject, ConnectableObservable, connectable, ReplaySubject, forkJoin, zip } from 'rxjs';
import { distinctUntilChanged, filter, flatMap, map, pairwise, publishReplay, scan, share, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Http } from '@nativescript/core'
import * as turf from '@turf/turf';
import { feature, lineDistance, lineSlice, lineString, nearestPointOnLine } from '@turf/turf';
import { Feature, FeatureCollection, LineString, Polygon, Point } from 'geojson';
import { Node, Position } from '../neighborhood.types';
import { Destination, Route } from '../route.types';
import { networkIsCloseEnough } from '../constants';
import { knownFolders, Folder, File } from '@nativescript/core';
import { Viewport } from "@nativescript-community/ui-mapbox";
import { PathFinder } from '../path-finder/path-finder';
import { extendNodeMap, NodeMap, RouteMap } from "../path-finder/node-map";

const context: Worker = self as any;

const documents: Folder = <Folder>knownFolders.currentApp();
const nodecyclerData: Folder = <Folder>documents.getFolder("assets");

function uniqueArray(arrArg: any[]): any[] {
  return arrArg.filter((elem, pos, arr) => {
    return arr.indexOf(elem) == pos;
  });
}

// Create actions stream
const viewports = new Subject<Viewport>();
const paths = new Subject<[string, string]>();

let discoveredNetworks = [];

// keep all loaded nodes and routes in memory. Whatever is not loaded is not taken into consideration while finding the shortest route
let discoveredNodes: NodeMap = {};
let discoveredRoutes: RouteMap = {};

context.onmessage = ({ data }) => {
  switch (data.action) {
    case 'change-viewport': {
      console.log('worker received bounds', data.bounds);
      viewports.next(data);
    }
      break;
    case 'find-path': {
      // find route from start node to destination node
      paths.next([data.start, data.end]);
      break;
    }
  }

};

function fetchObject<T>(filename: string): Observable<T> {
  console.log('fetching', filename);
  let contents = observableFrom(nodecyclerData.getFile(`${filename}.json`).readText())
    .pipe(map(contents => {
      console.log('read length', contents.length)
      return JSON.parse(contents) as T

    }

    ));

  let obs = connectable(contents, {
    connector: () => new ReplaySubject<T>(1),
    resetOnDisconnect: false
  });
  obs.connect();
  return obs;
}

// Fetch network
function fetchNetworks(): Observable<FeatureCollection<Polygon>> {
  return fetchObject<FeatureCollection<Polygon>>('networks');
}

function fetchNodes(networkIds: number[]): Observable<FeatureCollection<Point>[]> {
  return forkJoin(networkIds.map(network => fetchObject<FeatureCollection<Point>>(`nodes_${network}`)));
}

function fetchRoutes(networkIds: number[]): Observable<FeatureCollection<LineString>[]> {
  return forkJoin(networkIds.map(network => fetchObject<FeatureCollection<LineString>>(`routes_${network}`)));
}

function getNetworksInViewport(viewport: Viewport): Observable<number[]> {
  const viewportPolygon = turf.bboxPolygon([viewport.bounds.west, viewport.bounds.south, viewport.bounds.east, viewport.bounds.north]);
  return fetchNetworks()
    .pipe(
      map((networks) => {
        if (viewport.zoomLevel < 10) {
          return [];
        }

        const features = networks.features.filter(feature => feature.geometry.type === 'Polygon') as Feature<Polygon>[];
        const ret = features.filter((feature: Feature<Polygon>) => {
          return turf.booleanOverlap(viewportPolygon, feature) || turf.booleanContains(viewportPolygon, feature);
        }).map(feature => feature.properties.id);
        // console.log('nearby networks', ret);
        return ret;
      }));
}

const viewport$: Observable<Viewport> = viewports.asObservable();

const debouncedViewport$ = viewport$.pipe(
  scan((prev, curr) => {
    if (!prev) {
      return curr;
    }

    const prevCenter = turf.center(turf.bboxPolygon([prev.bounds.west, prev.bounds.south, prev.bounds.east, prev.bounds.north]));
    const currCenter = turf.center(turf.bboxPolygon([curr.bounds.west, curr.bounds.south, curr.bounds.east, curr.bounds.north]));
    const distance = turf.distance(prevCenter, currCenter, { units: 'meters' });

    const zoomDiff = Math.round(prev.zoomLevel * 10) - Math.round(curr.zoomLevel * 10);
    return (distance > 500 || zoomDiff != 0) ? curr : prev;
  }),
  distinctUntilChanged(),
);

const neighborhood$ = debouncedViewport$.pipe(
  switchMap(position => getNetworksInViewport(position).pipe(
    map(networkIds => networkIds.filter(id => !discoveredNetworks.find(fid => fid === id))),
    switchMap(networkIds => zip(fetchNodes(networkIds), fetchRoutes(networkIds), observableOf(networkIds))),
    map(([nodes, routes, networkIds]: [FeatureCollection<Point>[], FeatureCollection<LineString>[], number[]]) => {
      // const nodesCloseBy = nodes.filter(node => turf.distance(node.location, position.coordinate, { units: 'meters' }) < 5000);
      // const connections = [].concat.apply([], nodesCloseBy.map(node => node.connections))
      //   .map(connection => connection.route);
      // const routesConnectingNodesCloseBy = routes.filter(route => connections.includes(route.properties.pid));
      const ret = { nodes, routes, networkIds };
      // console.log('neighborhood', ret);
      return ret;
    }),
  ))
);


// Subscribers to post data back to app
neighborhood$.subscribe(({ nodes, routes, networkIds }) => {
  context.postMessage({ response: 'neighborhood', nodes, routes, networkIds });
  console.log("postMessage", nodes[0])

  // mark networks as discovered
  discoveredNetworks = uniqueArray([...discoveredNetworks, ...networkIds]);

  // add nodes to discovered nodes
  for (const nodeCollection of nodes) {
    for (const node of nodeCollection.features) {
      discoveredNodes[node.properties.id] = node;
    }
  }

  for (const routeCollection of routes) {
    for (const route of routeCollection.features) {
      discoveredRoutes[route.properties.id] = route;
    }
  }

});

const path$: Observable<[string, string]> = paths.asObservable();


const debouncedPath$ = path$.pipe(
  filter(([start, end]) => start !== end),
  distinctUntilChanged(),
);

debouncedPath$.subscribe(([start, end]) => {
  const pathFinder = new PathFinder(discoveredNodes);

  const path = pathFinder.findPath(start, end);
  const nodeIds = path[1];

  // Find the route that lays between each pair of nodes. It's probably better to find the route id based
  const routeIds = nodeIds.length <= 1 ? [] : nodeIds.slice(1, nodeIds.length).map((currNodeId, index) => {
    const prevNodeId = nodeIds[index - 1];
    const currNode = discoveredNodes[currNodeId];
    const connection = currNode.properties.connections.find((connection) => connection.id === prevNodeId);
    return connection.id;
  });


  context.postMessage({
    response: 'path', distance: path[0], nodes: nodeIds, routes: routeIds
  });
})

