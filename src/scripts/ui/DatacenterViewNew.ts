import * as Plotly from 'plotly.js';
import { Datacenter, DeadlineTask, Task } from '../simulation';


class DataCenterView {
  plotEl: any;
  layout: any;
  shapeToTask: Task[] = [];
  constructor() {
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
    //move up maybe?
    this.plotEl.on('plotly_click', function (data: any) {
      // do something;
      // (this as DataCenterView).clickedAtTime(data.points[0].x);
      console.log("clicked at time ", data.points[0].x);

    });

    //mouse click down in general
    this.plotEl.onclick = function (e: any) {
      if (e) {
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
    };
  }
  reset(dc: Datacenter, time: number) {
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

