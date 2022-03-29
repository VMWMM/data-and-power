import * as Plotly from 'plotly.js';
import { DataCenter, DeadlineTask, PowerSource, Task } from '../simulation';
import { UIManager } from './ui';

class GraphView {
  plotNode: HTMLElement;
  ui: UIManager;
  layout: any;
  config: any;
  constructor(ui: UIManager) {
    this.ui = ui;
    this.plotNode = document.getElementById(this.nodeID)!;
    this.config = {
      responsive: true,
      staticPlot: false,
      displayModeBar: false,
    };
    this.layout = {
      margin: { l: 15, t: 0, b: 30, r: 15 },
      autosize: false,
      xaxis: { fixedrange: true },
      yaxis: { fixedrange: true },
      height: 300,
      width: 300,
      showlegend: false,
      // hovermode: 'closest'
      shapes: [] as any,
    };
  }

  get nodeID(): string {
    throw new Error('Subclass responsibility');
  }

  getMinYDrawn(time: number) {
    return time - 24;
  }

  getMaxYDrawn(time: number) {
    return time + 24;
  }

  redraw(time: number) { }
}

export class DataCenterView extends GraphView {
  shapeToTask: Task[] = [];
  currentDataCenter: DataCenter;

  constructor(initDC: DataCenter, ui: any) {
    super(ui);
    this.currentDataCenter = initDC;

    // //move up maybe?
    // this.plotNode.on('plotly_click', ((data: any) => this.onClickAtGraph(data)));

    // let config = { responsive: true, staticPlot: false, displayModeBar: false };

    this.setToDataCenter(initDC, 0);
  }

  hasRequestedTimeTaskPlacement = true;
  requestTaskTime() {
    //not clean
    this.hasRequestedTimeTaskPlacement = true;
  }
  onClickAtGraph(data: any) {
    console.log('clicked at time ', data.points[0].x + 1);
  }

  onClick(e: any) {
    if (e) {
      if (this.hasRequestedTimeTaskPlacement) {
        this.hasRequestedTimeTaskPlacement = false;
        console.log(
          'clicked at time ',
          Math.floor(e.clientX - e.target.getBoundingClientRect().left)
        );
      } else {
        let rect = e.target.getBoundingClientRect();
        let x = e.clientX - rect.left; //x position within the element.
        let y = e.clientY - rect.top; //y position within the element.
        console.log('Left? : ' + x + ' ; Top? : ' + y + '.');
        //find in which task the click happened
        for (let i = 0; i < this.layout.shapes.length; i++) {
          let shape = this.layout.shapes[i];
          if (
            shape.x0 <= x &&
            shape.x1 >= x &&
            shape.y0 <= y &&
            shape.y1 >= y
          ) {
            console.log('Clicked on task ', shape.task.name);
            this.shiftTask(shape.task);
          }
        }
      }
    }
  }
  shiftTask(t: Task) {
    this.ui.shiftTask(t);
  }

  setToDataCenter(dc: DataCenter | null, time: number) {
    if (dc == null) {
      dc = this.currentDataCenter;
    } else {
      this.currentDataCenter = dc as DataCenter;
      dc = dc as DataCenter;
    }
    this.redraw(time);

    //let config = { responsive: true, staticPlot: false, displayModeBar: false };
  }

  redraw(time: number) {
    let data = this.getPlotPowerData(time);
    this.layout.shapes = [];
    this.shapeToTask = []; //shapeIndex -> taskId

    this.generateTaskShapes(time);
    Plotly.newPlot(this.plotNode, data, this.layout, this.config);
  }

  addRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    isInProgress: boolean,
    task: Task
  ): void {
    let dashType = isInProgress ? 'dot' : 'solid';
    this.layout.shapes.push({
      type: 'rect',
      // x-reference is assigned to the x-values
      // xref: 'x',
      // // y-reference is assigned to the plot paper [0,1]
      // yref: 'paper',
      x0: x,
      y0: y,
      x1: x + w,
      y1: y + h,
      fillcolor: color,
      opacity: 0.2,
      dash: dashType,
      //   line: {
      //     color: 'rgb(55, 128, 191)',
      //     width: 3
      //     //dash: 'dot'
      //   }
    });
    this.shapeToTask.push(task);
  }

  getPlotPowerData(time: number) {
    let dc = this.currentDataCenter;
    this.shapeToTask = [];
    //plot tasks at time
    let yForecasted: number[] = [];
    let yHistory: number[] = [];
    let xForecasted: number[] = [];
    let xHistory: number[] = [];
    for (let timeDelta = 0; timeDelta < 24; timeDelta++) {
      xForecasted.push(time + timeDelta);
      yForecasted.push(
        dc.powerSources.reduce(
          (acc, ps) => acc + ps.powerForecasted[time + timeDelta],
          0
        )
      );
      xHistory.push(time - timeDelta);
      yHistory.push(
        dc.powerSources.reduce(
          (acc, ps) => acc + ps.powerProduced[time - timeDelta],
          0
        )
      );
    }
    return [
      { x: xHistory, y: yHistory },
      { x: xForecasted, y: yForecasted },
    ];
  }

  generateTaskShapes(time: number) {
    let dc = this.currentDataCenter;
    this.layout.shapes = [];
    this.shapeToTask = [];

    let taskLoadSoFar = 0;
    //plot tasks at time
    dc.tasks.forEach((task) => {
      if (task instanceof DeadlineTask) {
        if (task.duration + task.startTime > this.getMinYDrawn(time)) {
          let startInGraph = Math.max(this.getMinYDrawn(time), task.startTime);
          let lengthInGraph = task.duration - (startInGraph - task.startTime);
          this.addRect(
            startInGraph,
            taskLoadSoFar,
            lengthInGraph,
            task.workLoad,
            task.getDisplayColor(),
            task.active,
            task
          );
          taskLoadSoFar += task.workLoad;
        }
      } else {
        this.addRect(
          this.getMinYDrawn(time),
          taskLoadSoFar,
          48,
          task.workLoad,
          task.getDisplayColor(),
          task.active,
          task
        );
        taskLoadSoFar += task.workLoad;
      }
    });
  }

  get nodeID(): string {
    return 'data-center-view';
  }
}

export class PowerSourceView extends GraphView {
  powerSource!: PowerSource;
  setToPowerSource(ps: PowerSource, time: number) {
    this.powerSource = ps;
    this.redraw(time);
  }

  getPowerData(time: number) {
    //plot tasks at time
    let yForecasted: number[] = [];
    let yHistory: number[] = [];
    let xForecasted: number[] = [];
    let xHistory: number[] = [];
    for (let timeDelta = 0; timeDelta < 24; timeDelta++) {
      xForecasted.push(time + timeDelta);
      yForecasted.push(this.powerSource.powerForecasted[time + timeDelta]);
      xHistory.push(time - timeDelta);
      yHistory.push(this.powerSource.powerProduced[time - timeDelta]);
    }
    return [
      { x: xHistory, y: yHistory },
      { x: xForecasted, y: yForecasted },
    ];
  }

  redraw(time: number): void {
    if (!this.powerSource) {
      return;
    }
    let data = this.getPowerData(time);
    Plotly.newPlot(this.plotNode, data, this.layout, this.config);
  }

  get nodeID(): string {
    return 'power-source-view';
  }
}
