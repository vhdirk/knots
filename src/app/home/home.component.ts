import { Observable, from as observableFrom, of as observableOf, BehaviorSubject, filter, switchMap, forkJoin, Subject, map } from 'rxjs'
import { Component, ElementRef, HostListener, OnInit, ViewChild, ViewContainerRef } from '@angular/core'
import { Application, Color, Folder, knownFolders } from '@nativescript/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
// import { Mapbox, MapboxViewApi, MapStyle } from '@nativescript-community/ui-mapbox'
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';
import { environment } from '../../environments/environment';
import * as geolocation from '@nativescript/geolocation';
import { CoreTypes } from '@nativescript/core';
import { registerElement } from "@nativescript/angular";
import { EventsService } from '../services/events.service';
import { SettingsService } from '../services/settings.service';
import { PermissionsService, PERMISSIONS } from '../services/permissions.service';
import { NeighbourhoodQuery } from '../services/neighbourhood.query';
import { NeighbourhoodService } from '../services/neighbourhood.service';
import { NeighbourhoodState, Node } from '../neighborhood.types';
import { MapView, Polyline, Position, Circle } from 'nativescript-google-maps-sdk';
import { Route } from '../route.types';
import { LayerFactory, MapboxApi, MapboxViewApi } from '@nativescript-community/ui-mapbox';
import { FeatureCollection } from 'geojson';
import { NeighbourhoodStore } from '../services/neighbourhood.store';

// import * as networkNodes from '~/assets/nodes.json';
// import * as networkRoutes from '~/assets/routes.json';

// Important - must register MapView plugin in order to use in Angular templates
registerElement('MapView', () => MapView);


const documents: Folder = <Folder>knownFolders.currentApp();
const nodecyclerData: Folder = <Folder>documents.getFolder("nodecycler-data");

@UntilDestroy()
@Component({
  selector: 'Home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

  // MapStyle = MapStyle;
  public mapView: MapboxApi;
  public minZoomLevel = 10;


  public locationPermission$!: Observable<boolean>;
  public locationPermission: boolean = false;

  // public nodeMarkers = [];
  // public routeMarkers = [];
  public color = '#5e7d50';

  mapReady = new Subject<boolean>();

  constructor(public events: EventsService,
    public settingsService: SettingsService,
    public permissionsService: PermissionsService,
    public neighbourhoodQuery: NeighbourhoodQuery,
    public neighbourhoodService: NeighbourhoodService) {
    // Use the component constructor to inject providers.


    // const routesFile = nodecyclerData.getFile('routes.json');
    // // const nodesFile = nodecyclerData.getFile('nodes.json');
    // let routesText = routesFile.readTextSync();
    // routes = JSON.parse(routesText);

  }

  ngOnInit(): void {
    // Init your component properties here.
    console.log("home: onInit");


    this.locationPermission$ = this.permissionsService.requestPermission(PERMISSIONS.LOCATION, "We use this permission to show you your current location and to give you the ability to track your rides.");

    this.locationPermission$.pipe(untilDestroyed(this)).subscribe(permission => {
      this.locationPermission = permission;
      this.setupLocationControls();
    });

    // for (const marker of this.routeMarkers) {
    //   this.mapView.removeShape(marker);
    // }

    // this.neighbourhoodQuery.select().pipe(
    //   untilDestroyed(this)
    // ).subscribe(neighbourhood => {
    //   console.log('got neighbourhood', Object.keys(neighbourhood));
    //   if (neighbourhood.nodes && neighbourhood.routes && this.mapView) {
    //     this.drawAll(neighbourhood.routes, neighbourhood.nodes);
    //   }
    // });

    this.neighbourhoodQuery.select().pipe(untilDestroyed(this)).subscribe(neighbourhood => {
      if (this.mapView) {
        this.drawNeighbourhood(neighbourhood);
        // for (const marker of this.nodeMarkers) {
        //   this.mapView.removeShape(marker);
        // }


        // this.drawNetworks(neighbourhood.networkIds);//.then(() => {
        //   // this.drawNodes(neighbourhood.nodes);
        // });


      }
    });
  }

  // async drawAll(routes: FeatureCollection, nodes: FeatureCollection) {

  //   console.log('drawing all', Object.keys(routes), Object.keys(nodes));

  //   await this.mapView.addSource('routes', {
  //     'type': 'geojson',
  //     'data': routes
  //   }).then((res) => console.log("loaded routes", res))
  //     .catch((err) => console.log("error loading routes", err));

  //   await this.mapView.addSource('nodes', {
  //     'type': 'geojson',
  //     'data': nodes
  //   }).then((res) => console.log("loaded nodes", res))
  //     .catch((err) => console.log("error loading nodes", err));




  //   await this.mapView.addLayer({
  //     'id': `node-circles`,
  //     'type': 'circle',
  //     'source': `nodes`,
  //     'paint': {
  //       'circle-radius': 10,
  //       'circle-color': '#ffffff',
  //       'circle-stroke-width': 2,
  //       'circle-stroke-color': this.color,
  //     },
  //     // 'filter': ['==', '$type', 'Point']
  //   });
  //   // await this.mapView.addSource('routes', {
  //   //   'type': 'geojson',
  //   //   'data': `asset://files/app/nodecyclesr-data/routes.json` //`${routesFile.path}`
  //   // }).then((res) => console.log("loaded routes", res))
  //   //   .catch((err) => console.log("error loading routes", err));

  //   // await this.mapView.addSource('nodes', {
  //   //   'type': 'geojson',
  //   //   'data': `${nodesFile.path}`
  //   // })


  //   await this.mapView.addLayer({
  //     'id': 'route-lines',
  //     'type': 'line',
  //     'source': 'routes',
  //     'paint': {
  //       'line-color': this.color
  //     },
  //     // 'filter': ['==', '$type', 'LineString']
  //   }).then((res) => console.log("layer routes", res))
  //     .catch((err) => console.log("error layer routes", err));
  // }

  // async drawNetworks(networkIds: number[]) {
  //   for (const networkId of networkIds) {

  //     if (!this.routeMarkers.find(id => networkId === id)) {

  //       const routesFile = nodecyclerData.getFile(`routes_${networkId}.json`);
  //       let routesText = await routesFile.readText();
  //       let routes = JSON.parse(routesText);

  //       await this.mapView.addSource(`routes-${networkId}`, {
  //         'type': 'geojson',
  //         'data': `asset://routes_${networkId}.json`,
  //       })

  //       const nodesFile = nodecyclerData.getFile(`nodes_${networkId}.json`);
  //       // let nodesText = await nodesFile.readText();
  //       // let nodes = JSON.parse(nodesText);

  //       await this.mapView.addSource(`nodes-${networkId}`, {
  //         'type': 'geojson',
  //         'data': `file://${nodesFile.path}`,
  //       })

  //       await this.mapView.addLayer({
  //         'id': `routes-${networkId}-lines`,
  //         'type': 'line',
  //         'source': `routes-${networkId}`,
  //         'paint': {
  //           'line-color': this.color
  //         },
  //         // 'filter': ['==', '$type', 'LineString']
  //       });

  //       await this.mapView.addLayer({
  //         'id': `nodes-${networkId}-circles`,
  //         'type': 'circle',
  //         'source': `nodes-${networkId}`,
  //         'paint': {
  //           'circle-radius': 10,
  //           'circle-color': '#ffffff',
  //           'circle-stroke-width': 2,
  //           'circle-stroke-color': this.color,
  //         },
  //         // 'filter': ['==', '$type', 'Point']
  //       });

  //       // await this.mapView.addLayer({
  //       //   'id': `nodes-${networkId}-text`,
  //       //   'type': 'symbol',
  //       //   'source': `nodes-${networkId}`,
  //       //   'layout': {
  //       //     'text-field': ['get', 'number'],
  //       //     'text-allow-overlap': true,
  //       //   },
  //       //   'paint': {
  //       //     'icon-color': this.color,
  //       //   }
  //       // });

  //       this.routeMarkers.push(networkId);
  //     }
  //   }
  // }

  async drawNeighbourhood(neighbourhood: NeighbourhoodState) {
    await this.drawRoutes(neighbourhood.routes, neighbourhood.networkIds);
    await this.drawNodes(neighbourhood.nodes, neighbourhood.networkIds);
  }

  async drawRoutes(routeCollections: FeatureCollection[], networkIds: number[]) {
    for (let i = 0; i < routeCollections.length; i++) {
      const routeCollection = routeCollections[i];
      const networkId = networkIds[i];
      const sourceId = `routes-${networkId}`;

      await this.mapView.addSource(sourceId, {
        'type': 'geojson',
        'data': routeCollections,
      });

      await this.mapView.addLayer({
        'id': `${sourceId}-lines`,
        'type': 'line',
        'source': sourceId,
        'paint': {
          'line-color': this.color
        },
        // 'filter': ['==', '$type', 'LineString']
      });

    }
  }

  async drawNodes(nodeCollections: FeatureCollection[], networkIds: number[]) {

    console.log('drawing nodes', networkIds);

    for (let i = 0; i < nodeCollections.length; i++) {
      const nodeCollection = nodeCollections[i];
      const networkId = networkIds[i];

      const sourceId = `nodes-${networkId}`;
      await this.mapView.addSource(sourceId, {
        'type': 'geojson',
        'data': nodeCollection,
      });

      await this.mapView.addLayer({
        'id': `${sourceId}-text`,
        'type': 'symbol',
        'source': sourceId,
        'layout': {
          'text-field': ['get', 'number'],
          'text-allow-overlap': true,
        },
        'paint': {
          'icon-color': this.color,
        }
      }, `routes-${networkId}-lines`
      );

      await this.mapView.addLayer({
        'id': `${sourceId}-circles`,
        'type': 'circle',
        'source': sourceId,
        'paint': {
          'circle-radius': 10,
          'circle-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-stroke-color': this.color,
        },
        // 'filter': ['==', '$type', 'Point']
      }, `${sourceId}-text`);




    }
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>Application.getRootView()
    sideDrawer.showDrawer()
  }


  async onMapReady($event) {
    this.mapView = $event;

    this.mapReady.next(true);

    const neighbourhood = this.neighbourhoodQuery.getValue();
    if (neighbourhood.nodes && neighbourhood.routes) {
      // this.drawAll(neighbourhood.routes, neighbourhood.nodes);
    }

    // console.log('routesFile.path', routesFile.path);

    // await this.mapView.addSource('routes', {
    //   'type': 'geojson',
    //   'data': routes
    // }).then((res) => console.log("loaded routes", res))
    // .catch((err) => console.log("error loading routes", err));

    // await this.mapView.addSource('routes', {
    //   'type': 'geojson',
    //   'data': `asset://files/app/nodecyclesr-data/routes.json` //`${routesFile.path}`
    // }).then((res) => console.log("loaded routes", res))
    //   .catch((err) => console.log("error loading routes", err));

    // await this.mapView.addSource('nodes', {
    //   'type': 'geojson',
    //   'data': `${nodesFile.path}`
    // })


    // await this.mapView.addLayer({
    //   'id': 'route-lines',
    //   'type': 'line',
    //   'source': 'routes',
    //   'paint': {
    //     'line-color': this.color
    //   },
    //     'filter': ['==', '$type', 'LineString']
    // }).then((res) => console.log("layer routes", res))
    //   .catch((err) => console.log("error layer routes", err));


    // await this.mapView.addLayer({
    //   'id': 'nodeCircles',
    //   'type': 'circle',
    //   'source': 'nodes',
    //   'paint': {
    //     'circle-radius': 10,
    //     'circle-color': '#ffffff',
    //     'circle-stroke-width': 2,
    //     'circle-stroke-color': this.color,
    //   }
    // });

    // await this.mapView.addLayer({
    //   'id': `nodeLabels`,
    //   'type': 'symbol',
    //   'source': 'nodes',
    //   'layout': {
    //     // 'text-field': node.number,
    //     'text-allow-overlap': true,
    //   },
    //   'paint': {
    //     'icon-color': this.color,
    //   }
    // });

  }

  setupLocationControls() {
    if (!this.locationPermission || !this.mapView) {
      return;
    }

    // this.mapView.settings.myLocationButtonEnabled = true;
    // this.mapView.gMap.setMyLocationEnabled(true);

    // geolocation.enableLocationRequest(true);

    const currentLocation = observableFrom(geolocation.getCurrentLocation({
      desiredAccuracy: CoreTypes.Accuracy.high,
      maximumAge: 5000,
      timeout: 20000
    })).pipe(filter(location => location !== null)).subscribe();
  }


  onMyLocationTapped($event) {
    //console.log("onMyLocationTapped:", $event);
  }

  onCoordinateTapped($event) {
    //console.log("onCoordinateTapped:", $event);
  }

  onCoordinateLongPress($event) {
    //console.log("onCoordinateLongPress:", $event);
  }

  onMarkerSelect($event) {
    //console.log("onMarkerSelect:", $event);
  }

  onMarkerBeginDragging($event) {
    //console.log("onMarkerBeginDragging:", $event);
  }

  onMarkerEndDragging($event) {
    //console.log("onMarkerEndDragging:", $event);
  }

  onMarkerDrag($event) {
    //console.log("onMarkerDrag:", $event);
  }

  onMarkerInfoWindowTapped($event) {
    //console.log("onMarkerInfoWindowTapped:", $event);
  }

  onMarkerInfoWindowClosed($event) {
    //console.log("onMarkerInfoWindowClosed:", $event);
  }

  onShapeSelect($event) {
    //console.log("onShapeSelect:", $event);
  }

  async onCameraChanged($event) {
    let viewport = await this.mapView.getViewport();

    if (viewport.zoomLevel < this.minZoomLevel) {
      return;
    }

    this.neighbourhoodService.setViewport(viewport);
  }

  onCameraMove($event) {
    // //console.log("onCameraMove:", $event);
  }

  onIndoorBuildingFocused($event) {
    //console.log("onIndoorBuildingFocused:", $event);
  }

  onIndoorLevelActivated($event) {
    //console.log("onIndoorLevelActivated:", $event);
  }




}




