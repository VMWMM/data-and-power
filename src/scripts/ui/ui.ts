import { Datacenter, Powersource, PowersourceType, SimulationManager } from '../simulation';
import { MapManager } from "./map";

class UIManager {
  simulationManager: SimulationManager;
  mapManager: MapManager;
  controlPanel: ControlPanel;

  constructor(
    simulationManager: SimulationManager
  ) {
    this.simulationManager = simulationManager;
    this.mapManager = new MapManager();
    this.mapManager.setComponents(
      this.simulationManager.datacenters,
      this.simulationManager.powersources
    );
    this.mapManager.initIcons();
    this.controlPanel = new ControlPanel();
    this.mapManager.onDatacenterPressed = ((datacenter: Datacenter) => this.onDatacenterPressed(datacenter))
    this.mapManager.onPowersourcePressed = ((powersource: Powersource) => this.onPowersourcePressed(powersource))
  }

  getDescriptionForPowerSource(powerSource: Powersource): string {
    switch (powerSource.powerType) {
      case PowersourceType.HYDRO: {
        return "hydroelectric"
      }
      case PowersourceType.SUN: {
        return "solar"
      }
      case PowersourceType.WIND: {
        return "wind"
      }
    }

    return "INVALID POWER SOURCE";
  }

  onDatacenterPressed(datacenter: Datacenter) {
    this.controlPanel.headline.innerHTML = datacenter.name;
    this.controlPanel.desc.innerHTML = `A data center.`;
  }
  onPowersourcePressed(powersource: Powersource) {
    this.controlPanel.headline.innerHTML = powersource.name;
    this.controlPanel.desc.innerHTML = `A source of ${this.getDescriptionForPowerSource(powersource)} power.`;
  }
}

class ControlPanel {
  headline: HTMLElement;
  desc: HTMLElement;
  constructor() {
    this.headline = document.getElementById("control-bar-headline")!;
    this.desc = document.getElementById("control-bar-desc")!;
  }
}

export { UIManager };
