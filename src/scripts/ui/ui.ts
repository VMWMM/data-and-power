import ContextMenu from '@mturco/context-menu';
import { ContinuousTask, Datacenter, DeadlineTask, Powersource, PowersourceType, SimulationManager, Task } from '../simulation';
import { roundToTwo } from "../utils";
import { DataCenterView } from "./DataCenterView";
import { DatacenterIcon, MapManager } from "./map";


class UIManager {
  simulationManager: SimulationManager;
  mapManager: MapManager;
  controlPanel: ControlPanel;
  selectedNode: Datacenter | Powersource | null;
  nextTurnButton: HTMLButtonElement;


  dataCenterView: DataCenterView;

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
    this.dataCenterView = new DataCenterView(this.simulationManager.datacenters[0]);
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
    document.getElementById("score-span")!.innerHTML = roundToTwo(this.simulationManager.points).toString();
    this.dataCenterView.setToDatacenter(null, this.simulationManager.currentTime);
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
      this.dataCenterView.setToDatacenter(newSelection, this.simulationManager.currentTime);
    }
  }

  redrawTaskQueue() {
    let taskQueue = document.getElementById("task-queue")!;
    taskQueue.innerHTML = ""; //Clear task queue
    const unscheduledTasks = this.simulationManager.tasks.filter(t => !t.scheduled);
    unscheduledTasks.forEach(task => {
      let taskDiv = this.getUnscheduledTaskContainer(task);
      taskQueue.appendChild(taskDiv);
    });


    const menu = new ContextMenuUp('div .unscheduled-task',
      this.simulationManager.datacenters.map(datacenter => {
        return {
          name: `Assign to ${datacenter.name}`,
          fn: (node: any) => {
            let unscheduledTaskNode = node as HTMLDivElement;
            let task = this.unscheduledTaskNodeMap.get(unscheduledTaskNode)!;
            if (task instanceof DeadlineTask) {
              if (task.assignDeadlineTask(
                datacenter,
                this.simulationManager.currentTime)
              ) {
                unscheduledTaskNode.remove();
              } else {
                alert("Can't assign to this datacenter!")
              }
            } else if (task instanceof ContinuousTask) {
              if (task.assignTask(datacenter))
                unscheduledTaskNode.remove();
              else
                alert("Can't assign to this datacenter!")
            }
          }
        }
      }));
  }

  unscheduledTaskNodeMap!: Map<HTMLDivElement, Task>;

  getUnscheduledTaskContainer(task: Task): HTMLDivElement {
    let node = document.createElement("div");
    if (!this.unscheduledTaskNodeMap) {
      this.unscheduledTaskNodeMap = new Map();
    }
    node.classList.add("unscheduled-task");
    node.classList.add(task instanceof ContinuousTask ? "unscheduled-task-continuous" : "unscheduled-task-deadline")
    let title = document.createElement("p");
    title.classList.add("unscheduled-task-label");
    title.innerText = task.name;
    node.appendChild(title);
    this.unscheduledTaskNodeMap.set(node, task);
    return node;
  }

  redraw() {
    // TODO: redraw UI...
    this.redrawTaskQueue();
    this.mapManager.terminator.setTime(this.simulationManager.getDateFromSimTime());
    let simDate = this.simulationManager.getDateFromSimTime();
    document.getElementById("time-span")!.innerHTML = simDate.toLocaleString();
  }
}

/*
Subclassing is used here to move the context menu up, as it wouldn't otherwise be visible because it would be clipped by the page bottom.
*/
class ContextMenuUp extends ContextMenu {
  constructor(
    selector: string,
    items: { name: string; fn: (node: any) => void; }[],
    options = {
      className: '',
      minimalStyling: false,
    },
  ) {
    super(selector, items, options);
  }

  show(e: any) {
    super.show(e);
    this.menu.style.left = `${e.pageX}px`;
    this.menu.style.top = `${e.pageY - this.menu.clientHeight}px`;
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

