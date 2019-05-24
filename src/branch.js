export class Branch {
  constructor() {
    this.tree = null;
    this.id = "";
    this.label = null;
    this.angle = 0;
    this.children = [];
    this.minX = 0;
    this.maxX = 0;
    this.minY = 0;
    this.maxY = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.startX = 0;
    this.startY = 0;
    this.parent = null;
    this.length = 0;
    this.totalLength = 0;
    this.totalChildren = 0;
    this.leaf = true;
    this.radius = 1;
  }
  getRadius() {
    return this.leaf
      ? this.tree.baseNodeSize * this.radius
      : this.tree.baseNodeSize / this.radius;
  }
  getTotalLength() {
    const fSize = 20;
    this.tree.ctx.font = `${fSize}pt sans-serif`;
    const length =
      this.getRadius() * 3 + this.tree.ctx.measureText(this.label).width;

    return length;
  }
  drawNode() {
    const radius = this.getRadius();
    const theta = radius;
    const centerX = this.leaf
      ? theta * Math.cos(this.angle) + this.centerX
      : this.centerX;
    const centerY = this.leaf
      ? theta * Math.sin(this.angle) + this.centerY
      : this.centerY;
    this.setDimensions(centerX, centerY, radius);
    if (this.leaf) {
      this.tree.ctx.save();
      this.tree.ctx.translate(this.centerX, this.centerY);
      this.tree.ctx.rotate(this.angle);

      this.drawLeaf();
      this.drawLabel();

      this.tree.ctx.restore();
    }
  }
  drawLeaf() {
    this.drawLabelConnector();
    const area = Math.pow(this.getRadius() * Math.sqrt(2), 2);
    const scaledRadius = Math.sqrt(area / Math.PI);
    const ctx = this.tree.ctx;
    ctx.beginPath();
    // ctx.moveTo(0, 0);
    // ctx.lineTo(this.getRadius() - scaledRadius, 0);
    ctx.arc(this.getRadius(), 0, scaledRadius, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }
  setDimensions(centerX, centerY, radius) {
    const boundedR =
      radius * this.tree.zoom < 5 || !this.leaf ? 5 / this.tree.zoom : radius;
    this.minX = centerX - boundedR;
    this.maxX = centerX + boundedR;
    this.minY = centerY - boundedR;
    this.maxY = centerY + boundedR;
  }
  getBounds() {
    const nodeSize = this.getRadius();
    const length = this.getTotalLength();
    const minX = this.centerX - nodeSize;
    const minY = this.centerY - nodeSize;
    const maxX = this.centerX + length * Math.cos(this.angle);
    const maxY = this.centerY + length * Math.sin(this.angle);
    const step = this.tree.getStep() / 2;
    console.log(this.centerX)
    return {
      minX: Math.min(minX, maxX, this.centerX - step),
      minY: Math.min(minY, maxY, this.centerY - step),
      maxX: Math.max(minX, maxX, this.centerX + step),
      maxY: Math.max(minY, maxY, this.centerY + step)
    };
  }
  drawLabel() {
    const fSize = 20;
    const label = this.label || "";
    this.tree.ctx.font = `${fSize}pt sans-serif`;
    this.labelWidth = this.tree.ctx.measureText(label).width;
    const tx = this.getRadius() * 2;
    const labelOffset = Math.abs(
      this.tree.farthestNodeFromRootX - this.centerX
    );
    this.tree.ctx.beginPath();
    this.tree.ctx.fillText(
      label.toUpperCase(),
      tx + labelOffset + 25,
      fSize / 2
    );
    this.tree.ctx.closePath();
  }
  drawLabelConnector() {
    const ctx = this.tree.ctx;

    ctx.save();
    ctx.lineWidth = ctx.lineWidth / 4;
    ctx.strokeStyle = "#add8e6";
    ctx.beginPath();
    ctx.moveTo(this.getRadius(), 0);
    ctx.lineTo(
      Math.abs(this.tree.farthestNodeFromRootX - this.centerX) +
        this.getRadius() * 2,
      0
    );
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
  addChild(node) {
    node.parent = this;
    node.tree = this.tree;
    this.leaf = false;
    this.children.push(node);
  }
  storeChildren() {
    for (let child of this.children) {
      this.tree.storeNode(child);
      child.storeChildren();
    }
  }
  static generateId() {
    return `${this.lastId++}`;
  }
  setTotalLength() {
    if (this.parent) {
      this.totalLength = this.parent.totalLength + this.length;
      if (this.totalLength > this.tree.maxBranchLength) {
        this.tree.maxBranchLength = this.totalLength;
      }
    } else {
      this.totalLength = this.length;
      this.tree.maxBranchLength = this.totalLength;
    }
    this.children.forEach(c => c.setTotalLength());
  }
}

export default Branch;
