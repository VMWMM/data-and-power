import * as Plotly from 'plotly.js';
import { Datacenter, DeadlineTask, Task } from '../simulation';


class DataCenterView {
  plotEl: any;
  layout: any;
  shapeToTask: Task[] = [];

  currentStartHour = 0;

  currentDataCenter: Datacenter;

  constructor(initDC: Datacenter) {
    this.currentDataCenter = initDC;
    this.plotEl = document.getElementById('plotly')! as any;
    // layout.shapes.push();
    this.layout = {
      margin: { t: 0 },
      xaxis: { fixedrange: true },
      yaxis: { fixedrange: true },
      showlegend: false,
      // hovermode: 'closest'
      //shapes??
      shapes: [] as any
    };
    // //move up maybe?
    // (this.plotEl as any).on('plotly_click', ((data: any) => this.onClickAtGraph(data)));

    // var config = { responsive: true, staticPlot: false, displayModeBar: false };
    // var plot = Plotly.newPlot(this.plotEl, [{
    //   x: [1, 2, 3, 4, 5],
    //   y: [1, 2, 4, 8, 16]
    // }], this.layout, config);

    //mouse click down in general
    this.plotEl.onclick = ((e: any) => this.onClick(e));

    this.setToDatacenter(initDC, 0);
  }

  hasRequestedTimeTaskPlacement = true;
  requestTaskTime() {//not clean
    this.hasRequestedTimeTaskPlacement = true;
  }
  // onClickAtGraph(data: any) {
  //   console.log("clicked at time ", data.points[0].x + 1);
  // }
  onClick(e: any) {
    if (e) {
      if (this.hasRequestedTimeTaskPlacement) {
        this.hasRequestedTimeTaskPlacement = false;
        console.log("clicked at time ", Math.floor(e.clientX - e.target.getBoundingClientRect().left) + this.currentStartHour);
      } else {
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left; //x position within the element.
        var y = e.clientY - rect.top;  //y position within the element.
        console.log("Left? : " + x + " ; Top? : " + y + ".");
        //find in which task the click happened
        for (let i = 0; i < this.layout.shapes.length; i++) {
          let shape = this.layout.shapes[i];
          if (shape.x0 <= x && shape.x1 >= x && shape.y0 <= y && shape.y1 >= y) {
            console.log("Clicked on task ", shape.task.name);
          }
        }
      }

    }
  }
  setToDatacenter(dc: Datacenter | null, time: number) {
    if (dc == null) {
      dc = this.currentDataCenter;
    } else {
      this.currentDataCenter = dc as Datacenter;
      dc = dc as Datacenter;
    }

    this.layout.shapes = [];
    this.shapeToTask = []; //shapeIndex -> taskId

    this.plotTasks(dc, time);

    var config = { responsive: true, staticPlot: false, displayModeBar: false };
    var plot = Plotly.newPlot(this.plotEl, [{
      x: [1, 2, 3, 4, 5],
      y: [1, 2, 4, 8, 16]
    }], this.layout, config);
  }

  addRect(x: number, y: number, w: number, h: number, color: string, isInProgress: boolean, task: Task): void {
    let dashType = isInProgress ? 'dot' : 'solid';
    this.layout.shapes.push(
      {
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
        dash: dashType
        //   line: {
        //     color: 'rgb(55, 128, 191)',
        //     width: 3
        //     //dash: 'dot'
        //   }

      });
    this.shapeToTask.push(task);
  }


  plotTasks(dc: Datacenter, time: number) {
    this.layout.shapes = [];
    this.shapeToTask = [];
    //plot tasks at time
    for (let i = 0; i < dc.tasks.length; i++) {
      if (dc.tasks[i] instanceof DeadlineTask) {
        var task = dc.tasks[i] as DeadlineTask;
        if (task.startTime >= time && task.duration + task.startTime < time) {
          this.addRect(task.startTime, 0, task.duration, task.workLoad, '#ff0000', task.active, task);
        } else {
          this.addRect(0, 0, 24, dc.tasks[i].workLoad, '#ff0000', dc.tasks[i].active, dc.tasks[i]);
        }
      }
    }
  }
}
export { DataCenterView };

