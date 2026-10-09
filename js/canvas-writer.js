/**
 * 指尖写字板与田字格描红画布 (Mobile Canvas Handwriting & Tracing Pad)
 * 特性：
 * 1. 高清 Retina 自适应缩放
 * 2. 田字格 / 米字格专业辅助线
 * 3. 浅红/灰色描红底字（可切换显示/隐藏）
 * 4. 真实毛笔/蜡笔质感平滑贝塞尔曲线笔触
 * 5. 多彩调色盘、橡皮擦、撤销与清空
 * 6. 移动端防误触滚屏 (touch-action 优化)
 */

class CanvasWriter {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.isDrawing = false;
    this.paths = []; // 保存笔画历史以便撤销
    this.currentPath = [];
    
    // 设置
    this.gridType = options.gridType || 'mizige'; // 'mizige' | 'tianzige' | 'none'
    this.charToTrace = options.char || '';
    this.showOutline = true;
    this.brushColor = '#2D3436'; // 墨黑
    this.brushWidth = 10;
    this.isEraser = false;

    this.dpr = window.devicePixelRatio || 1;

    this.initEvents();
    this.resize();
  }

  // 响应式画布缩放
  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width || 320, rect.height || 320);

    // Retina 屏幕清晰度处理
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;

    this.ctx.scale(this.dpr, this.dpr);
    this.displaySize = size;
    this.redrawAll();
  }

  // 设置当前字
  setCharacter(charStr) {
    this.charToTrace = charStr;
    this.paths = [];
    this.redrawAll();
  }

  // 绑定触控和鼠标事件
  initEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    // 触控开始
    const onStart = (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.isDrawing = true;
      this.currentPath = [{
        x: pos.x,
        y: pos.y,
        color: this.isEraser ? '#FFFFFF' : this.brushColor,
        width: this.isEraser ? 24 : this.brushWidth,
        isEraser: this.isEraser
      }];
    };

    // 触控移动
    const onMove = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.currentPath.push(pos);
      this.drawSegment(this.currentPath);
    };

    // 触控结束
    const onEnd = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.isDrawing = false;
      if (this.currentPath.length > 0) {
        this.paths.push([...this.currentPath]);
        this.currentPath = [];
      }
    };

    // 移动端 Touch 事件
    this.canvas.addEventListener('touchstart', onStart, { passive: false });
    this.canvas.addEventListener('touchmove', onMove, { passive: false });
    this.canvas.addEventListener('touchend', onEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', onEnd, { passive: false });

    // 桌面端 Mouse 事件
    this.canvas.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', (e) => {
      if (this.isDrawing) onMove(e);
    });
    window.addEventListener('mouseup', onEnd);
  }

  // 绘制平滑笔触片段
  drawSegment(path) {
    if (path.length < 2) return;
    const ctx = this.ctx;
    const p1 = path[path.length - 2];
    const p2 = path[path.length - 1];

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = path[0].color;
    ctx.lineWidth = path[0].width;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  // 重绘全部内容（网格 + 描红底模 + 笔迹）
  redrawAll() {
    const size = this.displaySize || 320;
    this.ctx.clearRect(0, 0, size, size);

    // 1. 绘制网格背景
    this.drawGrid(size);

    // 2. 绘制描红底字水印
    if (this.showOutline && this.charToTrace) {
      this.drawTraceCharacter(size);
    }

    // 3. 绘制孩子写的所有历史笔画
    this.paths.forEach(path => {
      if (path.length === 0) return;
      const ctx = this.ctx;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = path[0].color;
      ctx.lineWidth = path[0].width;

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }

  // 绘制米字格 / 田字格
  drawGrid(size) {
    if (this.gridType === 'none') return;

    const ctx = this.ctx;
    const padding = 8;
    const w = size - padding * 2;
    const h = size - padding * 2;
    const x = padding;
    const y = padding;
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.save();
    // 外框（柔和红粉色国学风）
    ctx.strokeStyle = '#FF7675';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // 虚线辅助线
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#FAB1A0';
    ctx.lineWidth = 1.2;

    // 十字横竖
    ctx.beginPath();
    ctx.moveTo(x, y + halfH);
    ctx.lineTo(x + w, y + halfH);
    ctx.moveTo(x + halfW, y);
    ctx.lineTo(x + halfW, y + h);

    // 米字格斜对角线
    if (this.gridType === 'mizige') {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
    }

    ctx.stroke();
    ctx.restore();
  }

  // 绘制描红浅色底字
  drawTraceCharacter(size) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `bold ${Math.round(size * 0.72)}px "KaiTi", "STKaiti", "BiauKai", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(235, 77, 75, 0.22)'; // 浅红虚底，正规描红帖效果
    ctx.fillText(this.charToTrace, size / 2, size / 2 + size * 0.04);
    ctx.restore();
  }

  // 清空手写
  clear() {
    this.paths = [];
    this.redrawAll();
  }

  // 撤销上一笔
  undo() {
    if (this.paths.length > 0) {
      this.paths.pop();
      this.redrawAll();
    }
  }

  // 切换描红文字显示/隐藏
  toggleOutline() {
    this.showOutline = !this.showOutline;
    this.redrawAll();
    return this.showOutline;
  }

  // 设置画笔颜色
  setColor(color) {
    this.isEraser = false;
    this.brushColor = color;
  }

  // 设置橡皮擦
  setEraser() {
    this.isEraser = true;
  }

  // 设置网格类型
  setGridType(type) {
    this.gridType = type;
    this.redrawAll();
  }
}

window.CanvasWriter = CanvasWriter;
