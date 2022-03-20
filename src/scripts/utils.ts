export async function ajax(path: string): Promise<string> {
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


export function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
