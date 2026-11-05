// The finger-drawing pad on writing cards.

/** Turn a <canvas> into a drawing pad. Adds cv.clear() to wipe it; setting cv.dataset.locked stops drawing.
 *  If set, cv.onStrokeStart and cv.onStrokeEnd are called as each stroke starts and finishes.
 *  cv.strokes lists the strokes drawn so far, each a list of [x,y] points as fractions of the box (0 to 1). */
export function setupCanvas(cv){
  const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  cv.width=r.width*dpr;cv.height=r.height*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=Math.max(6,r.width*0.04);
  ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()||'#1C2333';
  let drawing=false;cv.strokes=[];
  const pt=e=>{const b=cv.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top];};
  cv.addEventListener('pointerdown',e=>{if(cv.dataset.locked)return;drawing=true;cv.setPointerCapture(e.pointerId);if(cv.onStrokeStart)cv.onStrokeStart();const [x,y]=pt(e);cv.strokes.push([[x/r.width,y/r.height]]);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.01,y+.01);ctx.stroke();});
  cv.addEventListener('pointermove',e=>{if(!drawing)return;const [x,y]=pt(e);cv.strokes[cv.strokes.length-1].push([x/r.width,y/r.height]);ctx.lineTo(x,y);ctx.stroke();});
  const end=()=>{if(drawing&&cv.onStrokeEnd)cv.onStrokeEnd();drawing=false;};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  cv.clear=()=>{ctx.clearRect(0,0,cv.width,cv.height);cv.strokes=[];};
}
