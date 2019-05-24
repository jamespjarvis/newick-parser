export default {
    getStep(tree) {
        return tree.ctx.canvas.width / tree.leaves.length;
    }
}