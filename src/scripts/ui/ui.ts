import { Datacenter, Powersource, PowersourceType, SimulationManager } from '../simulation';
import { DatacenterIcon, MapManager } from "./map";

class UIManager {
  simulationManager: SimulationManager;
  mapManager: MapManager;
  controlPanel: ControlPanel;
  selectedNode: Datacenter | Powersource | null;
  nextTurnButton: HTMLButtonElement;

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
    this.selectedNode = null;
    this.controlPanel = new ControlPanel();
    this.mapManager.onDatacenterPressed = ((datacenter: Datacenter) => this.onDatacenterPressed(datacenter))
    this.mapManager.onPowersourcePressed = ((powersource: Powersource) => this.onPowersourcePressed(powersource));
    this.nextTurnButton = document.getElementById("next-turn-button")! as HTMLButtonElement;
    this.nextTurnButton.onclick = () => this.onNextTurnButtonPressed();
    this.redraw();
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
    this.updateSelection(datacenter);
  }
  onPowersourcePressed(powersource: Powersource) {
    this.controlPanel.headline.innerHTML = powersource.name;
    this.controlPanel.desc.innerHTML = `A source of ${this.getDescriptionForPowerSource(powersource)} power.`;
    this.updateSelection(powersource);
  }

  onNextTurnButtonPressed() {
    this.simulationManager.simulateTurn();
    document.getElementById("time-span")!.innerHTML = this.simulationManager.currentTimeStamp.toString();
    this.redraw();
  }

  updateSelection(newSelection: Powersource | Datacenter) {
    if (this.selectedNode) {
      let prevSelectedIcon = this.mapManager.getIconForNode(this.selectedNode)!;
      if (prevSelectedIcon instanceof DatacenterIcon) {
        prevSelectedIcon.removeConnectionsWithPowerSources();
        prevSelectedIcon.isSelected = false;
      }
    }
    this.selectedNode = newSelection;
    if (newSelection instanceof Datacenter) {
      let icon = this.mapManager.getIconForDatacenter(newSelection)!;
      icon.drawConnectionsWithPowerSources();
      icon.isSelected = true;
    }
  }

  redrawTaskQueue() {
    let taskQueue = document.getElementById("task-queue")!;
    taskQueue.innerHTML = ""; //Clear task queue
    const unscheduledTasks = [{ name: "Webpage", continous: true }, { name: "Crunch numbers", continous: false }, { name: "Minecraft server", continous: true }, { name: "Hackaton Server", continous: true }, { name: "Hackaton Server", continous: true }, { name: "Black Friday Sale", continous: false }, { name: "Research Project", continous: false }, { name: "Matrix Server", continous: true }, { name: "Unnamed Task", continous: false }]; // Replace with simulation API call
    unscheduledTasks.forEach(task => {
      let taskDiv = this.getUnscheduledTaskContainer(task);
      taskQueue.appendChild(taskDiv);
    });
  }

  getUnscheduledTaskContainer(task: { name: string; continous: boolean; }): HTMLDivElement {
    let node = document.createElement("div");
    node.classList.add("unscheduled-task");
    let title = document.createElement("p");
    title.classList.add("unscheduled-task-label");
    title.innerText = task.name;
    node.appendChild(title);
    return node;
  }

  redraw() {
    // TODO: redraw map...
    this.redrawTaskQueue();
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
