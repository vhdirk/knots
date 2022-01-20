import { Folder, knownFolders } from "@nativescript/core";
import { FeatureCollection, Point } from "geojson";
import { extendNodeMap } from "./node-map";
import { PathFinder } from "./path-finder";

const documents: Folder = <Folder>knownFolders.currentApp();
const nodecyclerData: Folder = <Folder>documents.getFolder("assets");


async function fetchObject<T>(filename: string): Promise<T> {
  console.log('fetching', filename);
  return nodecyclerData.getFile(`${filename}.json`).readText().then(contents => {
    return JSON.parse(contents) as T
  });
}


describe("Path finder", () => {
  it("contains spec with an expectation", async () => {

    let nodes = await fetchObject<FeatureCollection<Point>>('nodes_8410');
    let nodeMap = extendNodeMap({}, nodes);
    // console.log(nodeMap)

    let pathFinder = new PathFinder(nodeMap);

    console.log('start node', nodes.features[0].properties.id);
    console.log('end node', nodes.features[1].properties.id);

    let path = pathFinder.findPath(nodes.features[0].properties.id as string, nodes.features[1].properties.id as string);
    expect(path).toBeTruthy();
    expect(path[1].length).toEqual(2); // includes start and end node
    expect(path[0]).toEqual(2274);
    console.log('distance', path[1].length);

  });
});
