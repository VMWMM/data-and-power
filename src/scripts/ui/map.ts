import * as Leaf from 'leaflet';

export class MapManager {
  map: Leaf.Map;
  dataCenterIcons!: DataCenterIcon[];
  energySourceIcons!: EnergySourceIcon[];
  simulation: MockSimulation;
  onDataCenterPressed: Function | undefined;
  onEnergySourcePressed: Function | undefined;
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
    this.energySourceIcons = this.simulation.energySources.map(es => new EnergySourceIcon(es, this));
    this.dataCenterIcons.forEach(dci => dci.connect());
  }
}

abstract class MapIcon {

  marker: Leaf.Marker | undefined;
  overlay: Leaf.SVGOverlay | undefined;
  modelObject!: MockDataCenter | MockEnergySource;

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

    this.overlay.addTo(this.mapManager.map);
    this.createEventListeners();
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
  powerLines: Leaf.Polyline[] | undefined;
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
        new Leaf.Polyline([dataCenterIcon.modelObject.position, this.modelObject.position], { color: "#0088AA" })
      );
    this.lines.forEach(line => line.addTo(this.mapManager.map));
  }

  drawConnectionsWithPowerSources() {
    this.powerLines = this.modelObject.energySources.map(powerSource => new Leaf.Polyline([powerSource.position, this.modelObject.position], { color: "#00AA00" }));
    this.powerLines.forEach(line => line.addTo(this.mapManager.map));
  }

  removeConnectionsWithPowerSources() {
    if (this.powerLines) {
      this.powerLines.forEach(powerLine => powerLine.remove());
      this.powerLines = [];
    }
  }
}

class EnergySourceIcon extends MapIcon {
  declare modelObject: MockEnergySource;
  constructor(energySource: MockEnergySource, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = energySource;

    this.createOverlay();

  }

  createEventListeners(): void {
    if (this.overlay) {
      this.overlay.on("click", event => {
        Leaf.DomEvent.stopPropagation(event);
        if (this.mapManager.onEnergySourcePressed) this.mapManager.onEnergySourcePressed(this.modelObject)
      })
    }
  }

  get iconPath(): string {
    switch (this.modelObject.type) {
      case EnergySourceTypes.SUN: {

        return "/assets/sun.svg"
      }
      case EnergySourceTypes.WIND: {

        return "/assets/wind.svg"
      }
      case EnergySourceTypes.HYDRO: {

        return "/assets/hydro.svg"
      }
    }
  }
}

class MockSimulation {
  dataCenters: MockDataCenter[];
  energySources: MockEnergySource[];
  constructor() {
    this.energySources = [
      new MockEnergySource(new Leaf.LatLng(54.6, 7.2), "German Bay Offshore Wind Park", EnergySourceTypes.WIND),
      new MockEnergySource(new Leaf.LatLng(47.3, 10.1), "Alpine Dams", EnergySourceTypes.HYDRO),
      new MockEnergySource(new Leaf.LatLng(61.9, 7.1), "Norwegian Hydropower", EnergySourceTypes.HYDRO),
      new MockEnergySource(new Leaf.LatLng(45.3, 1.6), "French Solar", EnergySourceTypes.SUN),
      new MockEnergySource(new Leaf.LatLng(53.9, -3.57), "Walney Offshore Wind Farm", EnergySourceTypes.WIND),
    ]
    this.dataCenters = [
      new MockDataCenter(new Leaf.LatLng(52, 13), "Data Center Berlin", [this.energySources[2], this.energySources[0]]),
      new MockDataCenter(new Leaf.LatLng(48.8, 2.3), "Data Center Paris", [this.energySources[1], this.energySources[3]]),
      new MockDataCenter(new Leaf.LatLng(53.3, -6.6), "Data Center Ireland", [this.energySources[4]]),
    ]

  }
}

export class MockDataCenter {
  position: Leaf.LatLng;
  name: string;
  energySources: MockEnergySource[];
  constructor(pos: Leaf.LatLng, name: string, energySources: MockEnergySource[]) {
    this.position = pos;
    this.name = name;
    this.energySources = energySources;
  }
}

export enum EnergySourceTypes {
  SUN,
  WIND,
  HYDRO
}

export class MockEnergySource {
  position: Leaf.LatLng;
  name: string;
  type: EnergySourceTypes;
  constructor(pos: Leaf.LatLng, name: string, type: EnergySourceTypes) {
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
