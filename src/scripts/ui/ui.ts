import { Datacenter, Powersource, SimulationManager } from '../simulation';
import { MapManager } from "./map";

class UIManager {
  simulationManager: SimulationManager;
  mapManager: MapManager;
  controlPanel: ControlPanel;
  constructor(
      simulationManager: SimulationManager
    ) {
      this.simulationManager = simulationManager;
      console.log(this.simulationManager.datacenters);
      this.mapManager = new MapManager(
        this.simulationManager.datacenters, 
        this.simulationManager.powersources
      );
      this.controlPanel = new ControlPanel();
      this.mapManager.onDatacenterPressed = ((datacenter: Datacenter) => this.onDataCenterPressed(datacenter))
      this.mapManager.onPowersourcePressed = ((powersource: Powersource) => this.onPowersourcePressed(powersource))
  }
  onDataCenterPressed(datacenter: Datacenter) {
    this.controlPanel.headline.innerHTML = datacenter.name;
  }
  onPowersourcePressed(energySource: Powersource) {
    this.controlPanel.headline.innerHTML = energySource.name;
  }
}

class ControlPanel {
  headline: HTMLElement;
  constructor() {
    this.headline = document.getElementById("control-bar-headline")!;

  }
}

export { UIManager };
