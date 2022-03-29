import ContextMenu from '@mturco/context-menu';
import {
  ContinuousTask,
  DataCenter,
  DeadlineTask,
  PowerSource,
  PowerSourceType,
  SimulationManager,
  Task
} from '../simulation';
import { roundToTwo } from '../utils';
import { DataCenterView, PowerSourceView } from './interactive-graphs';
import { DataCenterIcon, MapManager } from './map';

class UIManager {
  simulationManager: SimulationManager;
  mapManager: MapManager;
  controlPanel: ControlPanel;
  selectedNode: DataCenter | PowerSource | null;
  nextTurnButton: HTMLButtonElement;

  dataCenterView: DataCenterView;
  powerSourceView: PowerSourceView;

  taskToShift: Task | null;
  constructor(simulationManager: SimulationManager) {
    this.simulationManager = simulationManager;
    this.mapManager = new MapManager();
    this.mapManager.setComponents(
      this.simulationManager.dataCenters,
      this.simulationManager.powerSources
    );
    this.mapManager.initIcons();
    this.selectedNode = null;
    this.controlPanel = new ControlPanel();
    this.dataCenterView = new DataCenterView(
      this.simulationManager.dataCenters[0],
      this
    );
    this.powerSourceView = new PowerSourceView(this);
    this.mapManager.onDataCenterPressed = (dataCenter: DataCenter) =>
      this.onDataCenterPressed(dataCenter);
    this.mapManager.onPowerSourcePressed = (powerSource: PowerSource) =>
      this.onPowerSourcePressed(powerSource);
    this.nextTurnButton = document.getElementById(
      'next-turn-button'
    )! as HTMLButtonElement;
    this.nextTurnButton.onclick = () => this.onNextTurnButtonPressed();

    this.taskToShift = null;
    this.redraw();
  }

  getDescriptionForPowerSource(powerSource: PowerSource): string {
    switch (powerSource.powerType) {
      case PowerSourceType.HYDRO: {
        return 'hydroelectric';
      }
      case PowerSourceType.SUN: {
        return 'solar';
      }
      case PowerSourceType.WIND: {
        return 'wind';
      }
    }

    return 'INVALID POWER SOURCE';
  }

  onDataCenterPressed(dataCenter: DataCenter) {
    this.controlPanel.headline.innerHTML = dataCenter.name;
    this.controlPanel.desc.innerHTML = `A data center.`;
    this.updateSelection(dataCenter);
    this.controlPanel.info.innerHTML = '';
  }
  onPowerSourcePressed(powerSource: PowerSource) {
    this.controlPanel.headline.innerHTML = powerSource.name;
    this.controlPanel.desc.innerHTML = `A source of ${this.getDescriptionForPowerSource(
      powerSource
    )} power.`;
    this.updateSelection(powerSource);
    this.controlPanel.info.innerHTML = `Power produced in last hour: ${roundToTwo(
      powerSource.powerProduced[this.simulationManager.currentTime - 1]
    )}</br>Power forecasted for last hour: ${roundToTwo(
      powerSource.powerForecasted[this.simulationManager.currentTime - 1]
    )}`;
  }

  onNextTurnButtonPressed() {
    this.simulationManager.simulateTurn();
    document.getElementById('score-span')!.innerHTML = roundToTwo(
      this.simulationManager.points
    ).toString();
    this.dataCenterView.redraw(this.simulationManager.currentTime);
    this.powerSourceView.redraw(this.simulationManager.currentTime);
    this.redraw();
  }

  updateSelection(newSelection: PowerSource | DataCenter) {
    if (this.selectedNode) {
      let prevSelectedIcon = this.mapManager.getIconForNode(this.selectedNode)!;
      if (prevSelectedIcon instanceof DataCenterIcon) {
        prevSelectedIcon.removeConnectionsWithPowerSources();
        prevSelectedIcon.isSelected = false;
      }
    }
    this.selectedNode = newSelection;
    if (newSelection instanceof DataCenter) {
      let icon = this.mapManager.getIconForDataCenter(newSelection)!;
      icon.drawConnectionsWithPowerSources();
      icon.isSelected = true;
      if (this.taskToShift != null) {
        this.taskToShift.assignTask(
          newSelection,
          this.simulationManager.currentTime
        );
        this.taskToShift = null;
      }
      document.getElementById('data-center-view')!.style.display = 'inherit';
      document.getElementById('power-source-view')!.style.display = 'none';
      this.dataCenterView.setToDataCenter(
        newSelection,
        this.simulationManager.currentTime
      );
    } else if (newSelection instanceof PowerSource) {
      document.getElementById('data-center-view')!.style.display = 'none';
      document.getElementById('power-source-view')!.style.display = 'inherit';
      this.powerSourceView.setToPowerSource(
        newSelection,
        this.simulationManager.currentTime
      );
    }
  }

  redrawTaskQueue() {
    let taskQueue = document.getElementById('task-queue')!;
    taskQueue.innerHTML = ''; //Clear task queue
    const unscheduledTasks = this.simulationManager.tasks.filter(
      (t) => !t.scheduled
    );
    unscheduledTasks.forEach((task) => {
      let taskDiv = this.getUnscheduledTaskContainer(task);
      taskQueue.appendChild(taskDiv);
    });
    let taskToSchedule;

    const menu = new ContextMenuUp(
      'div .unscheduled-task',
      this.simulationManager.dataCenters.map((dataCenter) => {
        return {
          name: `Assign to ${dataCenter.name}`,
          fn: (node: any) => {
            let unscheduledTaskNode = node as HTMLDivElement;
            let task = this.unscheduledTaskNodeMap.get(unscheduledTaskNode)!;
            if (task instanceof DeadlineTask) {
              if (
                task.assignDeadlineTask(
                  dataCenter,
                  this.simulationManager.currentTime
                )
              ) {
                unscheduledTaskNode.remove();
                taskToSchedule = task;
              } else {
                alert("Can't assign to this dataCenter!");
              }
            } else if (task instanceof ContinuousTask) {
              if (
                task.assignTask(dataCenter, this.simulationManager.currentTime)
              ) {
                unscheduledTaskNode.remove();
                taskToSchedule = task;
              } else alert("Can't assign to this dataCenter!");
            }
          },
        };
      })
    );
  }

  unscheduledTaskNodeMap!: Map<HTMLDivElement, Task>;

  shiftTask(task: Task) {
    this.taskToShift = task;
  }

  getUnscheduledTaskContainer(task: Task): HTMLDivElement {
    let node = document.createElement('div');
    if (!this.unscheduledTaskNodeMap) {
      this.unscheduledTaskNodeMap = new Map();
    }
    node.classList.add('unscheduled-task');
    node.classList.add(
      task instanceof ContinuousTask
        ? 'unscheduled-task-continuous'
        : 'unscheduled-task-deadline'
    );
    let title = document.createElement('p');
    title.classList.add('unscheduled-task-label');
    title.innerText = task.name;
    node.appendChild(title);
    this.unscheduledTaskNodeMap.set(node, task);
    return node;
  }

  redraw() {
    // TODO: redraw UI...
    this.redrawTaskQueue();
    this.mapManager.terminator.setTime(
      this.simulationManager.getDateFromSimTime()
    );
    let simDate = this.simulationManager.getDateFromSimTime();
    this.dataCenterView.setToDataCenter(
      null,
      this.simulationManager.currentTime
    );
    document.getElementById('time-span')!.innerHTML = simDate.toLocaleString();
    if (this.selectedNode instanceof PowerSource) {
      this.controlPanel.info.innerHTML = `Power produced in last hour: ${roundToTwo(
        this.selectedNode.powerProduced[this.simulationManager.currentTime - 1]
      )}</br>Power forecasted for last hour: ${roundToTwo(
        this.selectedNode.powerForecasted[
        this.simulationManager.currentTime - 1
        ]
      )}`;
    }
  }
}

/*
Subclassing is used here to move the context menu up, as it wouldn't otherwise be visible because it would be clipped by the page bottom.
*/
class ContextMenuUp extends ContextMenu {
  constructor(
    selector: string,
    items: { name: string; fn: (node: any) => void }[],
    options = {
      className: '',
      minimalStyling: false,
    }
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
  info: HTMLElement;
  constructor() {
    this.headline = document.getElementById('control-bar-headline')!;
    this.desc = document.getElementById('control-bar-desc')!;
    this.info = document.getElementById('control-bar-info')!;
  }
}

export { UIManager };
