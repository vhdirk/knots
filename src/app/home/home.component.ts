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


@UntilDestroy()
@Component({
  selector: 'Home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

  // MapStyle = MapStyle;
  public mapView: MapboxApi;
  public minZoomLevel = 10;
  public color = '#5e7d50';


  public locationPermission$!: Observable<boolean>;
  public locationPermission: boolean = false;


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
      }
    });
  }

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
        'data': routeCollection,
      });

      await this.mapView.addLayer({
        'id': `${sourceId}-lines`,
        'type': 'line',
        'source': sourceId,
        "minzoom": this.minZoomLevel,
        'paint': {
          'line-color': this.color
        },
        // 'filter': ['==', '$type', 'LineString']
      });

    }
  }

  async drawNodes(nodeCollections: FeatureCollection[], networkIds: number[]) {

    for (let i = 0; i < nodeCollections.length; i++) {
      const nodeCollection = nodeCollections[i];
      const networkId = networkIds[i];

      const radius = 15;

      const sourceId = `nodes-${networkId}`;
      await this.mapView.addSource(sourceId, {
        'type': 'geojson',
        'data': nodeCollection,
        'cluster': {
          'radius': radius,
          'maxZoom': 20,
          'properties': {
            'number': [["coalesce", ["accumulated"], ["get", "number"]], ["get", "number"]],
            'connections': [["coalesce", ["accumulated"], ["get", "connections"]], ["get", "connections"]]
          }
        },
      });


      await this.mapView.addLayer({
        'id': `${sourceId}-circles`,
        'type': 'circle',
        'source': sourceId,
        "minzoom": this.minZoomLevel,
        'paint': {
          'circle-radius': radius,
          'circle-color': '#ffffff',
          'circle-stroke-width': 3,
          'circle-stroke-color': this.color,
        },
        // 'filter': ['==', '$type', 'Point']
      }
      );
      this.mapView.onMapEvent('click', `${sourceId}-circles`, (event) => {
        this.onMapClick(event, networkId);
      } );


      await this.mapView.addLayer({
        'id': `${sourceId}-text`,
        'type': 'symbol',
        'source': sourceId,
        "minzoom": this.minZoomLevel,
        'layout': {
          'text-field': ['get', 'number'],
          'text-allow-overlap': true,
        },

        'paint': {
          'icon-color': this.color,
        }
      }
      );
    }
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>Application.getRootView()
    sideDrawer.showDrawer()
  }


  async onMapReady($event) {
    this.mapView = $event;

  }

  setupLocationControls() {
    if (!this.locationPermission || !this.mapView) {
      return;
    }

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

    // TODO: hide layers based on zoomlevel


    if (viewport.zoomLevel < this.minZoomLevel) {
      return;
    }

    this.neighbourhoodService.setViewport(viewport);
  }

  onMapClick($event, id) {
    console.log("onMapClick:", $event);
  }

  onIndoorBuildingFocused($event) {
    //console.log("onIndoorBuildingFocused:", $event);
  }

  onIndoorLevelActivated($event) {
    //console.log("onIndoorLevelActivated:", $event);
  }




}




