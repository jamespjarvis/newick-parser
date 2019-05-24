import Branch from "./branch";
import parser from "./parser";
function getBackingStorePixelRatio(context) {
  return (
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    1
  );
}
export default class Tree {
  constructor(element, str, options = {}) {
    this.container =
      typeof element === "string" ? document.querySelector(element) : element;
    const canvas = document.createElement("canvas");
    canvas.width = this.container.offsetWidth || 400;
    canvas.height = this.container.offsetHeight || 400;
    this.ctx = canvas.getContext("2d");
    this.container.appendChild(canvas);

    this.startX = null;
    this.startY = null;

    this.offsetX = this.ctx.canvas.width / 2;
    this.offsetY = this.ctx.canvas.height / 2;

    this.totalChildren = 0;


    this.branches = {};
    this.leaves = [];

    this.root = false;

    this.maxBranchLength = 0;

    this.farthestNodeFromRootX = 0;
    this.farthestNodeFromRootY = 0;

    this.baseNodeSize = 10;
    this.padding = 50;
    this.labelPadding = 25;
    this.fSize = 20;
    this.font = `${this.fSize}pt sans-serif`;

    this.lineWidth = 2;
    this.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }
  setSize(width, height) {
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
    const ratio = window.devicePixelRatio / getBackingStorePixelRatio(this.ctx);
    this.ctx.canvas.style.height = `${this.ctx.canvas.height}px`;
    this.ctx.canvas.style.width = `${this.ctx.canvas.width}px`;
    if (ratio > 1) {
      this.ctx.canvas.width *= ratio;
      this.ctx.canvas.height *= ratio;
    }
  }
  init(str) {
    this.str = str.replace(/\s/g, '');
    Branch.lastId = 0;

    const root = new Branch();
    root.id = "root";
    root.tree = this;
    this.branches.root = root;
    this.root = root;

    parser.parse({ str: this.str, root: this.root }, () => {
      this.storeNode(this.root);
      this.root.storeChildren();
      this.root.length = 0;
      this.maxLength = 0;
      this.root.setTotalLength();
      this.draw();
      window.addEventListener('resize', () => {
        this.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.draw();
      })
      //   this.root.computeTotalChildren();
    });
  }
  drawBranch(node) {
    const length = node.length * this.getScale();
    node.angle = 0;

    if (node.parent) {
      node.centerX = node.startX + length;
    }

    this.ctx.beginPath();

    this.ctx.moveTo(node.startX, node.startY);
    this.ctx.lineTo(node.startX, node.centerY);
    this.ctx.lineTo(node.centerX, node.centerY);

    this.ctx.stroke();
    this.ctx.closePath();

    node.drawNode();

    node.children.forEach(branch => {
      branch.startX = node.centerX;
      branch.startY = node.centerY;
      this.drawBranch(branch);
    });
  }
  storeNode(node) {
    if (!node.id) {
      node.id = Branch.generateId();
    }
    this.branches[node.id] = node;

    if (node.leaf) {
      this.leaves.push(node);
    }
  }
  getStep() {
    // return Math.max(
    //   (this.ctx.canvas.height / this.leaves.length,
    //   this.leaves[0].getRadius() * 2 + this.labelPadding)
    // );
    return (this.ctx.canvas.height / this.leaves.length) + (this.labelPadding);
  }
  getScale() {
    return this.ctx.canvas.width / this.maxBranchLength;
  }
  calculate(step) {
    const scale = this.getScale();
    this.leaves.forEach((leaf, i) => {
      leaf.angle = 0;
      leaf.centerY = i > 0 ? this.leaves[i - 1].centerY + step : 0;
      leaf.centerX = this.leaves[i].totalLength * scale;

    
      if (leaf.centerX > this.farthestNodeFromRootX) {
        this.farthestNodeFromRootX = leaf.centerX;
      }
      if (leaf.centerY > this.farthestNodeFromRootY) {
        this.farthestNodeFromRootY = leaf.centerY;
      }

      for (let branch = leaf; branch.parent; branch = branch.parent) {
        branch.parent.centerY =
          (branch.parent.children[0].centerY +
            branch.parent.children[branch.parent.children.length - 1].centerY) /
          2;
      }
    });
  }
  getNumLeaves(node) {
    let total = 0;
    const queue = [node];
    while (queue.length) {
      const n = queue.pop();
      n.children.forEach(child => {
        if (child.children.length) {
          queue.push(child);
        } else {
          total += 1;
        }
      });
    }
    return total;
  }
  scaleBranchLengths(n, m) {
    return ((n / m) * this.ctx.canvas.width) / 2;
  }
  scaleBranchHeights(n, m) {
    return (n / m) * this.ctx.canvas.height;
  }
  getBounds(leaves = this.leaves) {
    const { startX, startY } = leaves === this.leaves ? this.root : leaves[0];
    return leaves.reduce(
      (a, c) => {
        const { minX, maxX, minY, maxY } = c.getBounds();
        a.minX = Math.min(a.minX, minX);
        a.maxX = Math.max(a.maxX, maxX);
        a.minY = Math.min(a.minY, minY);
        a.maxY = Math.max(a.maxY, maxY);
        return a;
      },
      { minX: startX, maxX: startX, minY: startY, maxY: startY }
    );
  }
  draw() {
    this.zoom = 1;
    // const numLeaves = this.getNumLeaves(node);
    // const availHeight = this.scaleBranchHeights(numLeaves, this.leaves);
    // const move = availHeight / node
    // this.ctx.beginPath();
    // this.ctx.moveTo(startX, startY - (availHeight / 2));
    // this.ctx.lineTo(startX, startY + (availHeight / 2));
    // this.ctx.closePath();
    // this.ctx.strokeStyle = '#000';
    // this.ctx.stroke();

    const step = this.getStep();
    this.root.startX = 0;
    this.root.startY = 0;
    this.root.centerX = 0;
    this.root.centerY = 0;
    this.farthestNodeFromRootX = 0;
    this.farthestNodeFromRootY = 0;
    this.calculate(step);
    
    this.root.startX = this.root.centerX;
    this.root.startY = this.root.centerY;

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "blue";

    this.ctx.save();

    const { minX, maxX, minY, maxY } = this.getBounds();

    const { width, height } = this.ctx.canvas;
    const canvasSize = [width - this.padding * 2, height - this.padding * 2];
    const treeSize = [maxX - minX, maxY - minY];
    console.log(maxY)

    const pr = window.devicePixelRatio / getBackingStorePixelRatio(this.ctx);
    const xz = canvasSize[0] / treeSize[0];
    const yz = canvasSize[1] / treeSize[1];

    this.zoom = Math.min(xz, yz);

    this.offsetX = -1 * minX * this.zoom;
    this.offsetY = -1 * minY * this.zoom;

    if (xz > yz) {
      this.offsetX +=
        this.padding + (canvasSize[0] - treeSize[0] * this.zoom) / 2;
      this.offsetY += this.padding;
    } else {
      this.offsetX += this.padding;
      this.offsetY +=
        this.padding + (canvasSize[1] - treeSize[1] * this.zoom) / 2;
    }

    this.offsetX = this.offsetX / pr;
    this.offsetY = this.offsetY / pr;

    this.ctx.lineWidth = this.lineWidth / this.zoom;
    this.ctx.translate(this.offsetX * pr, this.offsetY * pr);
    this.ctx.scale(this.zoom, this.zoom);

    this.drawBranch(this.root);

    this.ctx.restore();
  }
}
