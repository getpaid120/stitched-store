// Particle background — floating geometric shapes
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  document.body.prepend(canvas);
  
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.shape = Math.random() > 0.5 ? 'circle' : 'diamond';
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += this.pulseSpeed;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      const s = this.size + Math.sin(this.pulse) * 0.5;
      const o = this.opacity + Math.sin(this.pulse) * 0.1;
      ctx.globalAlpha = Math.max(0, Math.min(1, o));
      ctx.fillStyle = this.shape === 'circle' ? '#6c5ce7' : '#e17055';
      
      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-s, -s, s * 2, s * 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  
  function init() {
    resize();
    particles = [];
    const count = Math.min(50, Math.floor((w * h) / 18000));
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }
  
  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    
    // Draw faint connections
    ctx.strokeStyle = 'rgba(108,92,231,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.globalAlpha = 0.15 * (1 - dist / 120);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', init);
  init();
  animate();
})();
