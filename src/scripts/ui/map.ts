import * as Leaf from 'leaflet';
import { antPath } from 'leaflet-ant-path';

export class MapManager {
  map: Leaf.Map;
  dataCenterIcons!: DataCenterIcon[];
  powerSourceIcons!: PowerSourceIcon[];
  simulation: MockSimulation;
  onDataCenterPressed: Function | undefined;
  onPowerSourcePressed: Function | undefined;
  constructor() {
    this.map = new Leaf.Map('map', {
      center: new Leaf.LatLng(49.023, 13.271),
      zoom: 5,
    });


    const tileServerUrl = "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png";

    Leaf.tileLayer(tileServerUrl, {
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
    }).addTo(this.map);

    this.dataCenterIcons = [];
    this.simulation = new MockSimulation();
    this.initIcons();
    this.map.on("click", event => console.log(event))
  }

  initIcons() {
    this.dataCenterIcons = this.simulation.dataCenters.map(dc => new DataCenterIcon(dc, this));
    this.powerSourceIcons = this.simulation.powerSources.map(es => new PowerSourceIcon(es, this));
    this.dataCenterIcons.forEach(dci => dci.connect());
  }
}

abstract class MapIcon {

  marker: Leaf.Marker | undefined;
  overlay: Leaf.SVGOverlay | undefined;
  modelObject!: MockDataCenter | MockPowerSource;

  mapManager: MapManager;
  constructor(mapManager: MapManager) {
    this.mapManager = mapManager;
  }

  get iconPath(): string {
    return "subclass responsibility!";
  }

  async getIcon(): Promise<string> {
    return await ajax(this.iconPath);
  }

  get width() {
    return 2;
  }

  get height() {
    return 2;
  }

  get bounds() {
    let corner1 = new Leaf.LatLng(this.modelObject.position.lat - this.width / 2, this.modelObject.position.lng - this.height / 2);
    let corner2 = new Leaf.LatLng(this.modelObject.position.lat + this.width / 2, this.modelObject.position.lng + this.height / 2);
    return new Leaf.LatLngBounds(corner1, corner2);
  }

  async createOverlay() {
    let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgElement.setAttribute("viewBox", "0 0 250 220");

    let icon = await this.getIcon();
    svgElement.innerHTML = icon;
    let svgElementBounds = this.bounds;
    this.overlay = new Leaf.SVGOverlay(svgElement, svgElementBounds, { interactive: true });

    this.overlay.setZIndex(10);
    this.addNodeSpecificLines();
    this.overlay.addTo(this.mapManager.map);
    this.createEventListeners();
  }

  addNodeSpecificLines() {

  }

  createEventListeners() {
    throw new Error("Subclass responsibility")
  }

  generateMarker() {
    if (this.marker) {
      this.marker.remove();
    }

    this.marker = new Leaf.Marker(this.modelObject.position, { opacity: 0.001 });
    this.marker.bindTooltip(this.modelObject.name, { permanent: true, className: "data-center-tooltip" });
    this.marker.addTo(this.mapManager.map);
  }
}

class DataCenterIcon extends MapIcon {
  lines: Leaf.Polyline[] | undefined;
  powerLines!: Leaf.Polyline[];
  declare modelObject: MockDataCenter;
  constructor(dataCenter: MockDataCenter, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = dataCenter;

    this.createOverlay();
  }

  createEventListeners() {
    if (this.overlay) {
      this.overlay.on("click", event => { Leaf.DomEvent.stopPropagation(event); if (this.mapManager.onDataCenterPressed) this.mapManager.onDataCenterPressed(this.modelObject) });
      this.overlay.on("mouseover", () => this.drawConnectionsWithPowerSources());
      this.overlay.on("mouseout", () => this.removeConnectionsWithPowerSources());
    }
  }

  get iconPath(): string {
    return "/assets/datacenter.svg"
  }

  connect() {
    this.lines = this.mapManager.dataCenterIcons
      .filter(dcI => dcI != this)
      .map(dataCenterIcon =>
        antPath([dataCenterIcon.modelObject.position, this.modelObject.position], { color: "#0088AA" })
      );
    this.lines.forEach(line => line.addTo(this.mapManager.map));
  }

  addNodeSpecificLines(): void {
    this.powerLines = this.modelObject.powerSources.map(powerSource => new Leaf.Polyline([powerSource.position, this.modelObject.position], { color: "#00AA00", interactive: false, opacity: 0 }));
    this.powerLines.forEach(line => line.addTo(this.mapManager.map));
  }

  drawConnectionsWithPowerSources() {
    this.powerLines.forEach(powerLine => powerLine.setStyle({ opacity: 1 }));
  }

  removeConnectionsWithPowerSources() {
    this.powerLines.forEach(powerLine => powerLine.setStyle({ opacity: 0 }));
  }
}

class PowerSourceIcon extends MapIcon {
  declare modelObject: MockPowerSource;
  constructor(powerSource: MockPowerSource, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = powerSource;

    this.createOverlay();

  }

  createEventListeners(): void {
    if (this.overlay) {
      this.overlay.on("click", event => {
        Leaf.DomEvent.stopPropagation(event);
        if (this.mapManager.onPowerSourcePressed) this.mapManager.onPowerSourcePressed(this.modelObject)
      })
    }
  }

  get iconPath(): string {
    switch (this.modelObject.type) {
      case PowerSourceTypes.SUN: {

        return "/assets/sun.svg"
      }
      case PowerSourceTypes.WIND: {

        return "/assets/wind.svg"
      }
      case PowerSourceTypes.HYDRO: {

        return "/assets/hydro.svg"
      }
    }
  }
}

class MockSimulation {
  dataCenters: MockDataCenter[];
  powerSources: MockPowerSource[];
  constructor() {
    this.powerSources = [
      new MockPowerSource(new Leaf.LatLng(54.6, 7.2), "German Bay Offshore Wind Park", PowerSourceTypes.WIND),
      new MockPowerSource(new Leaf.LatLng(47.3, 10.1), "Alpine Dams", PowerSourceTypes.HYDRO),
      new MockPowerSource(new Leaf.LatLng(61.9, 7.1), "Norwegian Hydropower", PowerSourceTypes.HYDRO),
      new MockPowerSource(new Leaf.LatLng(45.3, 1.6), "French Solar", PowerSourceTypes.SUN),
      new MockPowerSource(new Leaf.LatLng(53.9, -3.57), "Walney Offshore Wind Farm", PowerSourceTypes.WIND),
    ]
    this.dataCenters = [
      new MockDataCenter(new Leaf.LatLng(52, 13), "Data Center Berlin", [this.powerSources[2], this.powerSources[0]]),
      new MockDataCenter(new Leaf.LatLng(48.8, 2.3), "Data Center Paris", [this.powerSources[1], this.powerSources[3]]),
      new MockDataCenter(new Leaf.LatLng(53.3, -6.6), "Data Center Ireland", [this.powerSources[4]]),
    ]

  }
}

export class MockDataCenter {
  position: Leaf.LatLng;
  name: string;
  powerSources: MockPowerSource[];
  constructor(pos: Leaf.LatLng, name: string, powerSources: MockPowerSource[]) {
    this.position = pos;
    this.name = name;
    this.powerSources = powerSources;
  }
}

export enum PowerSourceTypes {
  SUN,
  WIND,
  HYDRO
}

export class MockPowerSource {
  position: Leaf.LatLng;
  name: string;
  type: PowerSourceTypes;
  constructor(pos: Leaf.LatLng, name: string, type: PowerSourceTypes) {
    this.position = pos;
    this.name = name;
    this.type = type;
  }
}

async function ajax(path: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(this.responseText);
    };
    xhr.onerror = reject;
    xhr.open("GET", path);
    xhr.send();
  });
}
