import { Feature, FeatureCollection, Point } from "geojson";
import { defaultOptions, PathFinderAlgorithm, PathFinderOptions } from './options';
import { dijkstra } from './dijkstra';
import { NodeMap } from './node-map';

export class PathFinder {

  protected options: PathFinderOptions;

  constructor(protected graph: NodeMap, opts?: PathFinderOptions) {
    this.options = defaultOptions(opts);
  }

  findPath(start: string, end: string) {
    switch (this.options.algorithm) {
      case PathFinderAlgorithm.DIJKSTRA:
      default:
        return dijkstra(this.graph, start, end);
    }
  }

}

// 'use strict';

// import { Preprocessor } from './preprocessor';
// import { defaultOptions, PathFinderOptions } from './options';
// import { roundCoord } from './round-coord';
// import { dijkstra } from './dijkstra';
// import { Compactor } from './compactor';


// export class PathFinder {

//   protected graph: any
//   protected options: PathFinderOptions;
//   protected preprocessor: Preprocessor;
//   protected compactor: Compactor;

//   constructor(graph, opts?: PathFinderOptions) {
//     this.options = defaultOptions(opts);

//     this.compactor = new Compactor(this.options);
//     this.preprocessor = new Preprocessor(graph, this.compactor, this.options);

//     if (!graph.compactedVertices) {
//       graph = this.preprocessor.preprocess();
//     }

//     this.graph = graph;

//     if (Object.keys(this.graph.compactedVertices).filter((k) => k !== 'edgeData').length === 0) {
//       throw new Error('Compacted graph contains no forks (topology has no intersections).');
//     }
//   }

//   findPath(a, b) {
//     const start = this.options.keyFn(roundCoord(a.geometry.coordinates, this.options.precision));
//     const finish = this.options.keyFn(roundCoord(b.geometry.coordinates, this.options.precision));

//     if (start === finish) {
//       return {
//         'path': [],
//       };
//     }

//     // We can't find a path if start or finish isn't in the
//     // set of non-compacted vertices
//     if (!this.graph.vertices[start] || !this.graph.vertices[finish]) {
//       return null;
//     }

//     const phantomStart = this.createPhantom(start);
//     const phantomEnd = this.createPhantom(finish);

//     let path = dijkstra(this.graph.compactedVertices, start, finish);

//     if (!path) {
//       return null;
//     }

//     const weight = path[0];

//     let edgeDatas = null;
//     if (this.graph.compactedEdges) {
//       path.reduce((eds, v, i, vs) => {
//         if (i > 0) {
//           eds.push({
//             reducedEdge: this.graph.compactedEdges[vs[i - 1]][v]
//           });
//         }

//         return eds;
//       }, []);
//     }

//     const finalPath = path[1].reduce((cs, v, i, vs) => {
//       if (i > 0) {
//         cs = cs.concat(this.graph.compactedCoordinates[vs[i - 1]][v]);
//       }

//       return cs;
//     }, []).concat([this.graph.sourceVertices[finish]]);

//     this.removePhantom(phantomStart);
//     this.removePhantom(phantomEnd);

//     return {
//       path: finalPath,
//       weight,
//       edgeDatas
//     };
//   }


//   public serialize() {
//     return this.graph;
//   }

//   protected createPhantom(n) {
//     if (this.graph.compactedVertices[n]) {
//       return null;
//     }

//     const phantom = this.compactor.compactNode(n, this.graph.vertices, this.graph.compactedVertices, this.graph.sourceVertices, this.graph.edgeData, true);
//     this.graph.compactedVertices[n] = phantom.edges;
//     this.graph.compactedCoordinates[n] = phantom.coordinates;

//     if (this.graph.compactedEdges) {
//       this.graph.compactedEdges[n] = phantom.reducedEdges;
//     }

//     Object.keys(phantom.incomingEdges).forEach((neighbor) =>{
//       this.graph.compactedVertices[neighbor][n] = phantom.incomingEdges[neighbor];
//       this.graph.compactedCoordinates[neighbor][n] = [this.graph.sourceVertices[neighbor]].concat(phantom.incomingCoordinates[neighbor].slice(0, -1));
//       if (this.graph.compactedEdges) {
//         this.graph.compactedEdges[neighbor][n] = phantom.reducedEdges[neighbor];
//       }
//     });

//     return n;
//   }

//   protected removePhantom(n): void {
//     if (!n) {
//       return;
//     }

//     Object.keys(this.graph.compactedVertices[n]).forEach((neighbor) => {
//       delete this.graph.compactedVertices[neighbor][n];
//     });
//     Object.keys(this.graph.compactedCoordinates[n]).forEach((neighbor) => {
//       delete this.graph.compactedCoordinates[neighbor][n];
//     });
//     if (this.graph.compactedEdges) {
//       Object.keys(this.graph.compactedEdges[n]).forEach((neighbor) => {
//         delete this.graph.compactedEdges[neighbor][n];
//       });
//     }

//     delete this.graph.compactedVertices[n];
//     delete this.graph.compactedCoordinates[n];

//     if (this.graph.compactedEdges) {
//       delete this.graph.compactedEdges[n];
//     }
//   }
// };
