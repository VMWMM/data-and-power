import * as Plotly from 'plotly.js';
import { Datacenter, DeadlineTask, Task } from '../simulation';
import { UIManager } from './ui';

class DataCenterView {
  plotNode: any;
  layout: any;
  shapeToTask: Task[] = [];

  currentStartHour = 0;

  currentDataCenter: Datacenter;
  ui: UIManager;
  constructor(initDC: Datacenter, ui: any) {
    this.ui = ui;
    this.currentDataCenter = initDC;
    this.plotNode = document.getElementById('plotly')! as any;
    // layout.shapes.push();
    this.layout = {
      margin: { l: 15, t: 0, b: 30, r: 15 },
      autosize: true,
      xaxis: { fixedrange: true },
      yaxis: { fixedrange: true },
      showlegend: false,
      // hovermode: 'closest'
      //shapes??
      shapes: [] as any,
    };
    // //move up maybe?
    // this.plotNode.on('plotly_click', ((data: any) => this.onClickAtGraph(data)));

    var config = { responsive: true, staticPlot: false, displayModeBar: false };
    var plot = Plotly.newPlot(
      this.plotNode,
      [
        {
          x: [1, 2, 3, 4, 5],
          y: [1, 2, 4, 8, 16],
        },
      ],
      this.layout,
      config
    );
    // this.plotNode.onclick = ((e: any) => this.onClick(e));
    // var plot = Plotly.newPlot(this.plotNode, [{
    //   x: [1, 2, 3, 4, 5],
    //   y: [1, 2, 4, 8, 16]
    // }], this.layout, config);

    //mouse click down in general

    this.setToDatacenter(initDC, 0);
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
          Math.floor(e.clientX - e.target.getBoundingClientRect().left) +
          this.currentStartHour
        );
      } else {
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left; //x position within the element.
        var y = e.clientY - rect.top; //y position within the element.
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

  setToDatacenter(dc: Datacenter | null, time: number) {
    if (dc == null) {
      dc = this.currentDataCenter;
    } else {
      this.currentDataCenter = dc as Datacenter;
      dc = dc as Datacenter;
    }
    this.redraw(time);

    var config = { responsive: true, staticPlot: false, displayModeBar: false };
  }

  redraw(time: number) {
    let data = this.getPlotPowerData(this.currentDataCenter, time);
    this.layout.shapes = [];
    this.shapeToTask = []; //shapeIndex -> taskId

    this.generateTaskShapes(this.currentDataCenter, time);
    Plotly.newPlot(this.plotNode, data, this.layout);
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
  getPlotPowerData(dc: Datacenter, time: number) {
    this.shapeToTask = [];
    //plot tasks at time
    let yForecasted: number[] = [];
    let yHistory: number[] = [];
    let xForecasted: number[] = [];
    let xHistory: number[] = [];
    for (let timeDelta = 0; timeDelta < 24; timeDelta++) {
      xForecasted.push(time + timeDelta);
      yForecasted.push(dc.powersources.reduce((acc, ps) => acc + ps.powerForecasted[time + timeDelta], 0));
      xHistory.push(time - timeDelta);
      yHistory.push(dc.powersources.reduce((acc, ps) => acc + ps.powerProduced[time - timeDelta], 0));
    }
    return [{ x: xHistory, y: yHistory }, { x: xForecasted, y: yForecasted }];
  }

  generateTaskShapes(dc: Datacenter, time: number) {
    this.layout.shapes = [];
    this.shapeToTask = [];

    let taskLoadSoFar = 0;
    //plot tasks at time
    dc.tasks.forEach(task => {
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

  getMinYDrawn(time: number) {
    return time - 24;
  }

  getMaxYDrawn(time: number) {
    return time + 24;
  }
}
export { DataCenterView };

// TESTER = document.getElementById('tester');

// Plotly.newPlot(TESTER, [{

//   x: [1, 2, 3, 4, 5],

//   y: [1, 2, 4, 8, 16]
// }], {

//   margin: { t: 0 }
// });
