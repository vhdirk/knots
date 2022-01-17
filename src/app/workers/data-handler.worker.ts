/// <reference lib="webworker" />
import "globals";
import { from as observableFrom, of as observableOf, combineLatest, Observable, Subject, ConnectableObservable, connectable, ReplaySubject, forkJoin, zip } from 'rxjs';
import { distinctUntilChanged, filter, flatMap, map, pairwise, publishReplay, scan, share, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Http } from '@nativescript/core'
import * as turf from '@turf/turf';
import { feature, lineDistance, lineSlice, lineString, nearestPointOnLine } from '@turf/turf';
import { Feature, FeatureCollection, LineString, Polygon } from 'geojson';
import { Node, Position } from '../neighborhood.types';
import { Destination, Route } from '../route.types';
import { networkIsCloseEnough } from '../constants';

import { knownFolders, Folder, File } from '@nativescript/core';
import { Viewport } from "@nativescript-community/ui-mapbox";

const context: Worker = self as any;

const documents: Folder = <Folder>knownFolders.currentApp();
const nodecyclerData: Folder = <Folder>documents.getFolder("nodecycler-data");

// Create actions stream
const positions = new Subject<Position>();
const viewports = new Subject<Viewport>();

let sentNetworks = [];
// addEventListener('message', ({ data }) => {
//   positions.next(data);
// });

loadData();

context.onmessage = ({ data }) => {
  console.log('worker received', data, data.action == 'load');

  switch (data.action) {

    case 'load': {
      loadData();
    }
      break;
    case 'change-viewport': {
      console.log('worker received bounds', data.bounds);
      viewports.next(data);
    }
      break;
    case 'change-position': {
      positions.next(data);
    }
      break;


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

function loadData() {
  //fetchObject<FeatureCollection>('routes.json'),
  forkJoin([fetchObject<FeatureCollection>('routes'), fetchObject<FeatureCollection>('nodes')]).pipe(
    map(res => {
      console.log('loaded routes', Object.keys(res));
      return { routes: res[0], nodes: res[1] };
    }
    )).subscribe(data => {
      console.log("loaded data", Object.keys(data));
      context.postMessage(data);
    });
}

// Fetch network
function fetchNetworks(): Observable<FeatureCollection> {
  return fetchObject<FeatureCollection>('networks');
}

function fetchNodes(networkIds: number[]): Observable<FeatureCollection[]> {
  return forkJoin(networkIds.map(network => fetchObject<FeatureCollection>(`nodes_${network}`)));
  // .pipe(map(results => [].concat.apply([], results)));
}

function fetchRoutes(networkIds: number[]): Observable<FeatureCollection[]> {
  return forkJoin(networkIds.map(network => fetchObject<FeatureCollection>(`routes_${network}`)));
  // .pipe(map(results => [].concat.apply([], results.map(col => col.features))));
}

function getNearbyNetworks(position: Position): Observable<number[]> {
  return fetchNetworks()
    .pipe(
      map((networks) => {
        const features = networks.features.filter(feature => feature.geometry.type === 'Polygon') as Feature<Polygon>[];
        const ret = features.filter((feature: Feature<Polygon>) => {
          if (turf.booleanPointInPolygon(position.coordinate, feature)) {
            return true;
          }
          const vertices = turf.explode(feature);
          const closestVertex = turf.nearest(position.coordinate, vertices);
          const distance = turf.distance(position.coordinate, closestVertex, { units: 'meters' });
          return distance < networkIsCloseEnough;// * (( 40 - position.zoomLevel) * 0.2);
        }).map(feature => feature.properties.id);
        // console.log('nearby networks', ret);
        return ret;
      }));
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


function getActiveRoute(routes: Route[], position: Position): Route {
  const result = routes
    .map(feature => {
      return {
        route: feature,
        point: nearestPointOnLine(feature.geometry, position.coordinate, { units: 'meters' }),
      };
    })
    .sort((a, b) => a.point.properties.dist - b.point.properties.dist)
    .shift();
  return result && result.point.properties.dist < 20 ? result.route : null;
}

function calculateRouteProgress(route: Feature<LineString>, position: Position) {
  if (!route || !position) {
    return null;
  }
  const slicedLine = lineSlice(route.geometry.coordinates[0], position.coordinate, lineString(route.geometry.coordinates));
  return lineDistance(slicedLine, { units: 'meters' });
}

function calculateDestinationAndProgress(route: Route, prevCoords: Position, nextCoords: Position): [string, number] {
  const prevProgress = calculateRouteProgress(route, prevCoords);
  const nextProgress = calculateRouteProgress(route, nextCoords);
  if (!prevProgress || !nextProgress) {
    return null;
  }
  if (prevProgress < nextProgress) {
    return [route.properties.end_geoid, nextProgress];
  } else {
    return [route.properties.begin_geoid, route.properties.distance - nextProgress];
  }
}

const position$: Observable<Position> = positions.asObservable();
const viewport$: Observable<Viewport> = viewports.asObservable();

const debouncedPosition$ = position$.pipe(
  scan((prev, curr) => {
    if (!prev) {
      return curr;
    }
    const distance = turf.distance(prev.coordinate, curr.coordinate, { units: 'meters' });
    const zoomDiff = Math.round(prev.zoomLevel * 10) - Math.round(curr.zoomLevel * 10);
    return (distance > 500 || zoomDiff != 0) ? curr : prev;
  }),
  distinctUntilChanged(),
);

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

// const neighborhood$ = debouncedPosition$.pipe(
//   switchMap(position => getNearbyNetworks(position).pipe(
//     switchMap(networkIds => zip(fetchNodes(networkIds), fetchRoutes(networkIds), observableOf(networkIds))),
//     map(([nodes, routes, networkIds]: [Node[], Route[], number[]]) => {
//       const nodesCloseBy = nodes.filter(node => turf.distance(node.location, position.coordinate, { units: 'meters' }) < 5000);
//       const connections = [].concat.apply([], nodesCloseBy.map(node => node.connections))
//         .map(connection => connection.route);
//       const routesConnectingNodesCloseBy = routes.filter(route => connections.includes(route.properties.pid));
//       const ret = { nodes: nodesCloseBy, routes: routesConnectingNodesCloseBy, networkIds };
//       // console.log('neighborhood', ret);
//       return ret;
//     }),
//   ))
// );

const neighborhood$ = debouncedViewport$.pipe(
  switchMap(position => getNetworksInViewport(position).pipe(
    map(networkIds => networkIds.filter(id => !sentNetworks.find(fid => fid === id))),
    switchMap(networkIds => zip(fetchNodes(networkIds), fetchRoutes(networkIds), observableOf(networkIds))),
    map(([nodes, routes, networkIds]: [FeatureCollection[], FeatureCollection[], number[]]) => {
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

// const activeRoute$: Observable<Route> = combineLatest([position$, neighborhood$]).pipe(
//   map(([position, { routes }]) => getActiveRoute(routes, position)),
//   distinctUntilChanged((prev, curr) => {
//     const prevPid = prev ? prev.properties.pid : null;
//     const currPid = curr ? curr.properties.pid : null;
//     return prevPid === currPid;
//   }),
// );

// const destinationNode$ = position$.pipe(
//   pairwise(),
//   withLatestFrom(activeRoute$),
//   map(([[prevPosition, currPosition], route]) => calculateDestinationAndProgress(route, prevPosition, currPosition)),
//   withLatestFrom(neighborhood$),
//   map(([result, { nodes }]): Destination => {
//     if (!result) {
//       return null;
//     }
//     return {
//       node: nodes.find(node => node.id === result[0]),
//       progress: result[1]
//     };
//   }),
//   distinctUntilChanged((prev, curr) => {
//     if (!prev || !curr) {
//       return prev === curr;
//     }
//     const prevPid = prev ? prev.node.id : null;
//     const currPid = curr ? curr.node.id : null;
//     return prevPid === currPid && prev.progress === curr.progress;
//   }),
// );

// const improvedPosition$ = combineLatest([position$, activeRoute$]).pipe(
//   map(([position, activeRoute]) => {
//     if (!activeRoute) {
//       return position;
//     }
//     return nearestPointOnLine(activeRoute, position.coordinate).geometry.coordinates;
//   }),
// );

// Subscribers to post data back to app
neighborhood$.subscribe(({ nodes, routes, networkIds }) => {
  context.postMessage({ nodes, routes, networkIds });
  console.log("postMessage", nodes[0])
  sentNetworks = [...sentNetworks, ...networkIds];
});

// activeRoute$.subscribe(activeRoute => {
//   context.postMessage({ activeRoute });
// });
// destinationNode$.subscribe(destinationNode => {
//   context.postMessage({ destinationNode });
// });
// improvedPosition$.subscribe((position) => {
//   context.postMessage({ position });
// });

