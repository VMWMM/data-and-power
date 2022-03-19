import * as Leaf from 'leaflet';

class MapManager {
  map: Leaf.Map;
  dataCenterIcons: DataCenterIcon[] | undefined;
  simulation: MockSimulation;
  constructor() {
    this.map = new Leaf.Map('map', {
      center: new Leaf.LatLng(49.023, 13.271),
      zoom: 5,
    });


    const tileServerUrl = "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png";

    Leaf.tileLayer(tileServerUrl, {
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
    }).addTo(this.map);

    this.simulation = new MockSimulation();
    this.initIcons();

    this.map.on("click", (evt) => console.log("Clicked on map ", evt))
  }

  initIcons() {
    this.dataCenterIcons = this.simulation.dataCenters.map(dc => new DataCenterIcon(dc, this));
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
    svgElement.setAttribute("viewBox", "0 0 200 200");

    let icon = await this.getIcon();
    svgElement.innerHTML = icon;
    let svgElementBounds = this.bounds;
    this.overlay = new Leaf.SVGOverlay(svgElement, svgElementBounds, { interactive: true });
    this.overlay.on("click", event => alert(event));

    this.overlay.addTo(this.mapManager.map);
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
  constructor(dataCenter: MockDataCenter, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = dataCenter;

    this.createOverlay();
  }

  get iconPath(): string {
    return "/assets/hex.svg"
  }

}

class MockSimulation {
  dataCenters: MockDataCenter[];
  constructor() {
    this.dataCenters = [
      new MockDataCenter(new Leaf.LatLng(52, 13), "Data Center Berlin"),
      new MockDataCenter(new Leaf.LatLng(48.8, 2.3), "Data Center Paris"),
      new MockDataCenter(new Leaf.LatLng(53.3, -6.6), "Data Center Ireland"),
    ]
  }
}

class MockDataCenter {
  position: Leaf.LatLng;
  name: string;
  constructor(pos: Leaf.LatLng, name: string) {
    this.position = pos;
    this.name = name;
  }
}

class MockEnergySource {
  position: Leaf.LatLng;
  name: string;
  constructor(pos: Leaf.LatLng, name: string) {
    this.position = pos;
    this.name = name;
  }
}

new MapManager();

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
