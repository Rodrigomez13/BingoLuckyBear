import { BETS, MAX_ROWS, MIN_ROWS, PAYOUT_SCALE, REELS, SOUND_FILES, STORAGE_KEY, SYMBOLS } from './config.mjs'
import { createGameMath } from './math.mjs'
import { AudioManager, createSfx } from './audio.mjs'
import { collectElements, createUi } from './ui.mjs'

const canvas = document.getElementById('slotCanvas')
const ctx = canvas.getContext('2d')
const spriteAtlas = new Image(); spriteAtlas.src = 'assets/golden-bear-symbols.webp'; spriteAtlas.onload = () => draw()
const lbbAtlas = new Image(); lbbAtlas.src = 'assets/lbb-role-symbols.webp'; lbbAtlas.onload = () => draw()
const lbbVariantAtlas = new Image(); lbbVariantAtlas.src = 'assets/lbb-role-variants.webp'; lbbVariantAtlas.onload = () => draw()
const E = collectElements()
const math = createGameMath(SYMBOLS, { reels: REELS, minRows: MIN_ROWS, maxRows: MAX_ROWS, payoutScale: PAYOUT_SCALE })

let cw = 1100, ch = 650, dpr = Math.min(2, devicePixelRatio || 1), grid = [], display = [], winning = new Set(), dropOffsets = new Map(), dropStart = 0, particles = []
let balance = 0, betIndex = 2, lastWin = 0, freeSpins = 0, spinMultiplier = 1, spinning = false, autoSpins = 0, turbo = false, soundOn = true, countFrame = 0, walletReady = false
let stickyWilds = new Set()
let volumeSettings = { master: 0.85, effects: 0.85, music: 0.18 }

const money = value => Math.max(0, Math.round(value)).toLocaleString('es-AR')
const bet = () => BETS[betIndex]
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const audioManager = new AudioManager({ enabled: soundOn, ...volumeSettings })
const sfx = createSfx(audioManager, SOUND_FILES)
const playNamedSound = (key, volume = 1, rate = 1) => audioManager.play(SOUND_FILES[key], volume, rate)
const ui = createUi({ elements: E, money, playSound: playNamedSound, getTurbo: () => turbo })
const { renderPayDetail, pushHistory, clearHistory } = ui
const symbolByKey = new Map(SYMBOLS.map(symbol => [symbol.key, symbol]))
const weightedSymbol = (rng = Math.random) => math.weightedSymbol(rng)
const makeGrid = rowCounts => math.makeGrid(Math.random, rowCounts)
const activeWays = math.activeWays
const hydrateGrid = serialized => serialized.map(reel => reel.map(key => symbolByKey.get(key) || SYMBOLS[0]))

function updateHud(){const b=money(balance),w=money(lastWin);E.balance.textContent=b;E.balanceSide.textContent=b;E.bet.textContent=money(bet());E.lastWin.textContent=w;E.lastWinSide.textContent=w;E.free.textContent=freeSpins;E.spin.textContent="GIRAR";E.sound.textContent=soundOn?"🔊":"🔇";E.mult.textContent=`×${spinMultiplier}`;E.featureState.textContent=freeSpins?`STICKY WILD · ${stickyWilds.size}`:"CASCADAS + FREE SPINS"}
function resize(){const r=canvas.getBoundingClientRect();cw=Math.max(320,Math.floor(r.width));ch=Math.max(330,Math.floor(r.height));canvas.width=Math.floor(cw*dpr);canvas.height=Math.floor(ch*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw()}
function roundRect(x,y,w,h,r){const a=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+a,y);ctx.arcTo(x+w,y,x+w,y+h,a);ctx.arcTo(x+w,y+h,x,y+h,a);ctx.arcTo(x,y+h,x,y,a);ctx.arcTo(x,y,x+w,y,a);ctx.closePath()}

function drawBackground(){
  const t=performance.now()
  const g=ctx.createLinearGradient(0,0,0,ch)
  g.addColorStop(0,"#210009")
  g.addColorStop(.46,"#43040d")
  g.addColorStop(1,"#130005")
  ctx.fillStyle=g
  ctx.fillRect(0,0,cw,ch)

  ctx.save()
  ctx.globalAlpha=.36
  for(let x=-40+(t*.018%34);x<cw+40;x+=34){
    const line=ctx.createLinearGradient(x,0,x+18,0)
    line.addColorStop(0,"rgba(0,0,0,.55)")
    line.addColorStop(.48,"rgba(255,158,44,.1)")
    line.addColorStop(1,"rgba(0,0,0,.32)")
    ctx.fillStyle=line
    ctx.fillRect(x,0,34,ch)
  }
  ctx.globalAlpha=.16
  for(let y=0;y<ch;y+=Math.max(18,ch/22)){
    ctx.fillStyle=y%2?"rgba(255,217,94,.12)":"rgba(0,0,0,.28)"
    ctx.fillRect(0,y,cw,1.4)
  }
  ctx.globalAlpha=1
  const glow=ctx.createRadialGradient(cw*.5,ch*.44,0,cw*.5,ch*.44,Math.max(cw,ch)*.7)
  glow.addColorStop(0,"rgba(255,185,50,.18)")
  glow.addColorStop(.48,"rgba(72,7,12,.08)")
  glow.addColorStop(1,"rgba(0,0,0,.72)")
  ctx.fillStyle=glow
  ctx.fillRect(0,0,cw,ch)

  const shineX=(Math.sin(t/2200)*.5+.5)*cw
  const shine=ctx.createLinearGradient(shineX-cw*.24,0,shineX+cw*.12,ch)
  shine.addColorStop(0,"rgba(255,255,255,0)")
  shine.addColorStop(.5,"rgba(255,232,153,.09)")
  shine.addColorStop(1,"rgba(255,255,255,0)")
  ctx.fillStyle=shine
  ctx.fillRect(0,0,cw,ch)
  ctx.restore()
}
function drawWord(t,x,y,w,h,fill,stroke){
  ctx.fillStyle=fill
  ctx.strokeStyle=stroke
  ctx.lineWidth=Math.max(2,Math.min(w,h)*.035)
  ctx.font=`1000 ${Math.max(12,Math.min(28,w*.2,h*.28))}px Georgia`
  ctx.textAlign="center"
  ctx.textBaseline="middle"
  ctx.strokeText(t,x+w/2,y+h/2)
  ctx.fillText(t,x+w/2,y+h/2)
}

function drawImageCover(image,sx,sy,sw,sh,x,y,w,h){
  const ratio=w/h,sourceRatio=sw/sh
  let cropX=sx,cropY=sy,cropW=sw,cropH=sh
  if(ratio>sourceRatio){cropH=sw/ratio;cropY=sy+(sh-cropH)/2}else{cropW=sh*ratio;cropX=sx+(sw-cropW)/2}
  ctx.drawImage(image,cropX,cropY,cropW,cropH,x,y,w,h)
}

function drawSymbolFrame(x,y,w,h,isWin,color="#ffd45d"){
  const r=Math.max(5,Math.min(w,h)*.08)
  const bg=ctx.createLinearGradient(x,y,x+w,y+h)
  bg.addColorStop(0,"#4b080d")
  bg.addColorStop(.52,"#1a0105")
  bg.addColorStop(1,"#3a0709")
  ctx.fillStyle=bg
  roundRect(x,y,w,h,r)
  ctx.fill()

  const inner=ctx.createRadialGradient(x+w*.5,y+h*.44,0,x+w*.5,y+h*.44,Math.max(w,h)*.58)
  inner.addColorStop(0,isWin?`${color}44`:"rgba(255,177,44,.13)")
  inner.addColorStop(.62,"rgba(52,2,7,.08)")
  inner.addColorStop(1,"rgba(0,0,0,.36)")
  ctx.fillStyle=inner
  roundRect(x+2,y+2,w-4,h-4,Math.max(3,r-2))
  ctx.fill()

  const stroke=ctx.createLinearGradient(x,y,x+w,y+h)
  stroke.addColorStop(0,isWin?"#fff4a8":"#9a4718")
  stroke.addColorStop(.2,"#f4b735")
  stroke.addColorStop(.54,"#5b1b07")
  stroke.addColorStop(.82,"#d7781e")
  stroke.addColorStop(1,isWin?"#fff1a2":"#6c250a")
  ctx.lineWidth=isWin?3.8:2
  ctx.strokeStyle=stroke
  roundRect(x+1,y+1,w-2,h-2,r)
  ctx.stroke()

  const corner=Math.min(w,h)*.18
  ctx.strokeStyle=isWin?"rgba(255,255,188,.96)":"rgba(255,205,82,.62)"
  ctx.lineWidth=Math.max(1.5,Math.min(w,h)*.025)
  for(const [sx2,sy2,dx,dy] of [[x+6,y+6,1,1],[x+w-6,y+6,-1,1],[x+6,y+h-6,1,-1],[x+w-6,y+h-6,-1,-1]]){
    ctx.beginPath()
    ctx.moveTo(sx2,sy2+dy*corner)
    ctx.quadraticCurveTo(sx2,sy2,sx2+dx*corner,sy2)
    ctx.stroke()
  }
}

function drawSymbol(s,x,y,w,h,isWin){
  ctx.save()
  ctx.shadowColor=isWin?"#fff36f":"rgba(0,0,0,.62)"
  ctx.shadowBlur=isWin?30:8
  ctx.shadowOffsetY=isWin?0:5
  drawSymbolFrame(x,y,w,h,isWin,s.color)
  const r=Math.max(5,Math.min(w,h)*.08)
  roundRect(x+2,y+2,w-4,h-4,Math.max(4,r-2))
  ctx.clip()
  const roleAtlas=s.lbbSet===1?lbbVariantAtlas:lbbAtlas
  const artPad=Math.max(4,Math.min(w,h)*.06)
  if(Array.isArray(s.lbb)&&roleAtlas.complete&&roleAtlas.naturalWidth){
    const sw=roleAtlas.naturalWidth/5,sh=roleAtlas.naturalHeight/3,sx=s.lbb[0]*sw,sy=s.lbb[1]*sh
    const artX=x+artPad,artY=y+artPad,artW=w-artPad*2,artH=h-artPad*2
    drawImageCover(roleAtlas,sx,sy,sw,sh,artX,artY,artW,artH)
    ctx.shadowBlur=0
    if(s.wild)drawWord("WILD",x,y+h*.61,w,h*.35,"#fff2a0","#512000")
    if(s.bonus)drawWord("BONUS",x,y+h*.61,w,h*.35,"#fff45c","#6c1500")
  }else if(Number.isInteger(s.atlas)&&spriteAtlas.complete&&spriteAtlas.naturalWidth){
    const sw=spriteAtlas.naturalWidth/3,sh=spriteAtlas.naturalHeight/2
    const sx=(s.atlas%3)*sw,sy=Math.floor(s.atlas/3)*sh
    drawImageCover(spriteAtlas,sx,sy,sw,sh,x+artPad*.55,y+artPad*.55,w-artPad*1.1,h-artPad*1.1)
    ctx.shadowBlur=0
    if(s.wild)drawWord("WILD",x,y+h*.62,w,h*.34,"#fff0a0","#512000")
    if(s.bonus)drawWord("BONUS",x,y+h*.62,w,h*.34,"#fff45c","#6c1500")
  }else if(s.type==="letter"){
    const bg=ctx.createRadialGradient(x+w*.5,y+h*.38,0,x+w*.5,y+h*.48,Math.max(w,h)*.54)
    bg.addColorStop(0,`${s.color}44`)
    bg.addColorStop(.42,"rgba(65,4,11,.88)")
    bg.addColorStop(1,"rgba(13,0,4,.96)")
    ctx.fillStyle=bg
    roundRect(x+artPad,y+artPad,w-artPad*2,h-artPad*2,Math.max(4,r-3))
    ctx.fill()
    ctx.shadowColor=s.color
    ctx.shadowBlur=isWin?28:12
    ctx.fillStyle=s.color
    ctx.strokeStyle="#ffd86b"
    ctx.lineWidth=Math.max(2.4,Math.min(w,h)*.035)
    ctx.font=`1000 ${Math.max(34,Math.min(94,w*.62,h*.72))}px Georgia`
    ctx.textAlign="center"
    ctx.textBaseline="middle"
    ctx.strokeText(s.label,x+w/2,y+h/2+2)
    ctx.fillText(s.label,x+w/2,y+h/2+2)
  }
  ctx.restore()

  ctx.save()
  if(isWin){
    ctx.globalAlpha=.9
    ctx.strokeStyle="rgba(255,255,171,.8)"
    ctx.lineWidth=2
    roundRect(x-2,y-2,w+4,h+4,Math.max(6,r+2))
    ctx.stroke()
  }
  ctx.restore()
}
function drawReels(){
  if(!display.length)return;
  const t=performance.now();
  const pad=Math.max(10,Math.min(cw,ch)*.022),gap=Math.max(4,Math.min(cw,ch)*.01),columnGap=Math.max(5,Math.min(cw,ch)*.012);
  const area=ch-pad*2,gridW=cw-pad*2,rw=(gridW-columnGap*(REELS-1))/REELS,gridX=pad,gridY=pad;
  const cascadeDuration=turbo?260:500;
  const rawProgress=dropStart?Math.max(0,Math.min(1,(t-dropStart)/cascadeDuration)):1;
  const eased=1-Math.pow(1-rawProgress,3);

  ctx.save();
  const outer=ctx.createLinearGradient(gridX,gridY,gridX+gridW,gridY+area);
  outer.addColorStop(0,"rgba(255,218,99,.54)");outer.addColorStop(.5,"rgba(91,28,5,.22)");outer.addColorStop(1,"rgba(255,202,72,.48)");
  ctx.strokeStyle=outer;ctx.lineWidth=Math.max(3,Math.min(cw,ch)*.008);
  roundRect(gridX-6,gridY-6,gridW+12,area+12,10);ctx.stroke();
  ctx.restore();

  for(let r=0;r<REELS;r++){
    const reel=display[r]||[],rows=Math.max(MIN_ROWS,reel.length),x=gridX+r*(rw+columnGap),cellH=(area-gap*(rows-1))/rows,step=cellH+gap;
    ctx.save();
    roundRect(x,gridY,rw,area,8);
    ctx.clip();
    const reelBg=ctx.createLinearGradient(x,gridY,x+rw,gridY+area);
    reelBg.addColorStop(0,"rgba(79,7,13,.86)");
    reelBg.addColorStop(.48,"rgba(21,0,5,.76)");
    reelBg.addColorStop(1,"rgba(83,16,8,.84)");
    ctx.fillStyle=reelBg;
    ctx.fillRect(x,gridY,rw,area);
    const reelShine=ctx.createLinearGradient(x,gridY,x+rw,gridY);
    reelShine.addColorStop(0,"rgba(0,0,0,.45)");
    reelShine.addColorStop(.5,"rgba(255,223,118,.09)");
    reelShine.addColorStop(1,"rgba(0,0,0,.48)");
    ctx.fillStyle=reelShine;ctx.fillRect(x,gridY,rw,area);
    for(let y=gridY+cellH;y<gridY+area-1;y+=step){ctx.fillStyle="rgba(255,173,63,.16)";ctx.fillRect(x+3,y+gap*.44,rw-6,1.2)}

    reel.forEach((s,i)=>{
      const key=`${r}-${i}`;
      const isWinning=winning.has(key);
      const pulse=isWinning?1+Math.sin(t/70+r)*.04:1;
      const fall=(dropOffsets.get(key)||0)*(1-eased);
      const bounce=dropOffsets.has(key)&&rawProgress<1?Math.sin(rawProgress*Math.PI)*Math.min(22,cellH*.16):0;
      const y=gridY+i*step-step*fall+bounce;
      const inset=Math.max(3,Math.min(rw,cellH)*.04),baseW=rw-inset*2,baseH=cellH-inset*2;
      const symbolW=baseW*pulse,symbolH=baseH*pulse;
      const sx=x+inset+(baseW-symbolW)/2,sy=y+inset+(baseH-symbolH)/2;
      drawSymbol(s,sx,sy,symbolW,symbolH,isWinning);
    });
    ctx.restore();

    const rail=ctx.createLinearGradient(x,gridY,x,gridY+area);
    rail.addColorStop(0,"#b96a22");rail.addColorStop(.18,"#ffd564");rail.addColorStop(.5,"#3a1005");rail.addColorStop(.82,"#c76f22");rail.addColorStop(1,"#5c1b04");
    ctx.fillStyle=rail;ctx.fillRect(x-2,gridY,3,area);ctx.fillRect(x+rw-1,gridY,3,area);
    ctx.strokeStyle="rgba(255,223,118,.4)";ctx.lineWidth=1.2;roundRect(x,gridY,rw,area,8);ctx.stroke();
  }
}
function drawParticles(){
  const now=performance.now();
  particles=particles.filter(p=>now-p.start<p.life);
  for(const p of particles){
    const age=(now-p.start)/p.life;
    p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity??.045;
    const alpha=1-age;
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(p.x,p.y);
    ctx.rotate((p.rot||0)+age*(p.spin||0));
    ctx.fillStyle=p.color;
    ctx.shadowColor=p.color;
    ctx.shadowBlur=p.kind==="coin"?16:12;
    if(p.kind==="coin"){
      ctx.beginPath();
      ctx.ellipse(0,0,p.size*1.25,p.size*.82,0,0,Math.PI*2);
      ctx.fill();
      ctx.lineWidth=1.5;
      ctx.strokeStyle="#6d3205";
      ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.42)";
      ctx.beginPath();ctx.arc(-p.size*.35,-p.size*.22,p.size*.22,0,Math.PI*2);ctx.fill();
    }else if(p.kind==="gem"){
      ctx.beginPath();
      ctx.moveTo(0,-p.size*1.45);
      ctx.lineTo(p.size*1.15,-p.size*.2);
      ctx.lineTo(0,p.size*1.45);
      ctx.lineTo(-p.size*1.15,-p.size*.2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.52)";
      ctx.lineWidth=1.2;
      ctx.stroke();
    }else if(p.kind==="spark"){
      ctx.beginPath();
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,rad=i%2===0?p.size*1.6:p.size*.45;
        ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
      }
      ctx.closePath();ctx.fill();
    }else{
      ctx.beginPath();ctx.arc(0,0,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}
function draw(){ctx.clearRect(0,0,cw,ch);drawBackground();drawReels();drawParticles()}
function loop(){draw();requestAnimationFrame(loop)}

function burst(n=55, mode="mixed"){
  const colors=["#ffd45d","#fff2ad","#45f2a7","#ff8121","#75e7ff","#2378ff"];
  for(let i=0;i<n;i++){
    const coin=mode==="coins" || (mode==="mixed" && Math.random()<.34);
    const gem=!coin && Math.random()<.18;
    const spark=!coin && !gem && Math.random()<.55;
    particles.push({
      x:cw*(.2+Math.random()*.6),
      y:ch*(.22+Math.random()*.55),
      vx:(Math.random()-.5)*(coin?8:7),
      vy:-2-Math.random()*(coin?7:6),
      gravity:coin?.075:gem?.035:.045,
      size:coin?3+Math.random()*4:gem?4+Math.random()*4:2+Math.random()*4,
      color:coin?"#ffd45d":colors[Math.floor(Math.random()*colors.length)],
      kind:coin?"coin":gem?"gem":spark?"spark":"dot",
      rot:Math.random()*Math.PI,
      spin:(Math.random()-.5)*7,
      start:performance.now(),
      life:(coin?1150:900)+Math.random()*(coin?1000:800)
    })
  }
}
async function animateReels(target){
  const duration=turbo?520:1280,start=performance.now(),placeholder=target.map(r=>r.map(()=>weightedSymbol()));
  display=placeholder;
  const stopped=Array(REELS).fill(false);
  while(performance.now()-start<duration){
    const elapsed=performance.now()-start;
    for(let r=0;r<REELS;r++){
      const stopAt=duration-((REELS-1-r)*(turbo?36:95));
      if(elapsed<stopAt){
        if(Math.random()>.28)display[r]=display[r].map(()=>weightedSymbol());
      }else{
        if(!stopped[r]){stopped[r]=true;sfx.reelStop(r)}
        display[r]=target[r];
      }
    }
    draw();
    await wait(turbo?24:38);
  }
  display=target;
  draw();
}
function animateCount(from,to,duration=800){cancelAnimationFrame(countFrame);const start=performance.now();return new Promise(resolve=>{function step(now){const t=Math.min(1,(now-start)/duration),v=from+(to-from)*(1-Math.pow(1-t,3));E.winAmount.textContent=`$ ${money(v)}`;if(t<1)countFrame=requestAnimationFrame(step);else resolve()}countFrame=requestAnimationFrame(step)})}
async function showWin(total,stake,brief=false){
  const ratio=total/stake,type=ratio>=100?"SÚPER MEGA WIN":ratio>=40?"MEGA WIN":ratio>=15?"BIG WIN":ratio>=5?"GRAN PREMIO":"PREMIO";
  E.winType.textContent=type;E.winAmount.textContent="$ 0";
  E.winLayer.classList.add("show");
  const screen=document.querySelector(".screen");screen?.classList.remove("win-flash");void screen?.offsetWidth;screen?.classList.add("win-flash");
  sfx.win(ratio);
  burst(ratio>=15?90:36,"mixed");burst(ratio>=15?70:24,"coins");
  await animateCount(0,total,brief?420:Math.min(2400,740+ratio*18));
  await wait(brief?240:ratio>=15?1200:560);
  E.winLayer.classList.remove("show")
}
async function requestRound(stake) {
  const response = await fetch('/api/games/golden-bear/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stake, roundId: crypto.randomUUID() }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'No se pudo resolver la ronda.')
  return payload
}

async function openBonus(spin) {
  freeSpins = spin.awardedFreeSpins
  E.ticker.textContent = `¡${spin.scatters} BONUS! Ganaste ${spin.awardedFreeSpins} giros gratis.`
  pushHistory('bonus', `${spin.scatters} BONUS · ${spin.awardedFreeSpins} FS`, 0, `×${Math.max(2, spin.finalMultiplier)}`)
  playNamedSound('free', 0.7)
  sfx.bonus()
  updateHud()
  E.bonusModal.classList.add('show')
  await new Promise(resolve => {
    E.bonusClose.onclick = () => {
      sfx.click()
      E.bonusModal.classList.remove('show')
      resolve()
    }
  })
}

async function animateResolvedSpin(spin, creditWin) {
  E.machine.classList.toggle('free-spin-mode', spin.free)
  freeSpins = spin.free ? spin.freeSpinsRemaining : spin.awardedFreeSpins
  stickyWilds = new Set(spin.stickyWilds || [])
  spinMultiplier = spin.cascades[0]?.multiplier ?? (spin.free ? 2 : 1)
  updateHud()
  renderPayDetail(0, [], 0, spinMultiplier)
  E.ticker.textContent = spin.free ? `Giro gratis en curso · quedan ${freeSpins}` : 'Buena suerte · los carretes están girando'
  sfx.spin()

  grid = hydrateGrid(spin.initialGrid)
  await animateReels(grid)
  sfx.stop()
  E.ways.textContent = money(activeWays(grid))

  for (let index = 0; index < spin.cascades.length; index++) {
    const cascade = spin.cascades[index]
    winning = new Set(cascade.cells)
    display = grid
    draw()
    const credited = creditWin(cascade.win)
    lastWin += credited
    balance += credited
    spinMultiplier = cascade.multiplier
    updateHud()

    E.machine.classList.remove('hit')
    void E.machine.offsetWidth
    E.machine.classList.add('hit')
    E.ticker.textContent = `Cascada ${index + 1}: ${cascade.details.map(detail => `${detail.symbol} ×${detail.reels}`).join(' · ')} · +$ ${money(credited)}`
    renderPayDetail(index + 1, cascade.details, credited, spinMultiplier)
    pushHistory('win', `Cascada ${index + 1}`, credited, `${cascade.details.length} pagos`)
    sfx.explode()
    burst(52, 'mixed')
    sfx.cascade()
    await wait(turbo ? 330 : 620)

    grid = hydrateGrid(cascade.nextGrid)
    dropOffsets = new Map(cascade.offsets)
    dropStart = performance.now()
    winning.clear()
    display = grid.map(reel => reel.slice())
    spinMultiplier = cascade.nextMultiplier
    sfx.drop()
    E.cascade.textContent = `Cascada ${index + 2} · multiplicador ×${spinMultiplier}`
    E.cascade.classList.add('show')
    E.mult.classList.remove('bump')
    void E.mult.offsetWidth
    E.mult.classList.add('bump')
    sfx.multiplier()
    updateHud()
    await wait(turbo ? 210 : 420)
    sfx.stop()
    dropOffsets.clear()
    E.cascade.classList.remove('show')
  }

  display = hydrateGrid(spin.finalGrid)
  grid = display
  winning.clear()
  dropOffsets.clear()
  stickyWilds = new Set(spin.stickyWilds || [])
  spinMultiplier = spin.finalMultiplier

  if (spin.free && spin.awardedFreeSpins > 0) {
    E.ticker.textContent = `¡RETRIGGER! +${spin.awardedFreeSpins} giros gratis`
    pushHistory('bonus', `Retrigger · +${spin.awardedFreeSpins} giros`, 0, `×${spinMultiplier}`)
    sfx.bonus()
  } else if (!spin.cascades.length && spin.scatters < 3) {
    E.ticker.textContent = spin.scatters === 2 ? 'Dos BONUS... faltó uno para activar los free spins.' : 'Sin premio. El oso ya está preparando el próximo giro.'
    sfx.lose()
  }
}

async function startSpin() {
  if (spinning || !walletReady) return
  const stake = bet()
  if (balance < stake) {
    E.ticker.textContent = 'Saldo insuficiente. Cargá saldo desde Mi cuenta para seguir jugando.'
    sfx.lose()
    return
  }

  audioManager.startMusic()
  spinning = true
  E.spin.disabled = true
  E.down.disabled = true
  E.up.disabled = true
  E.machine.classList.add('spinning')
  E.winLayer.classList.remove('show')
  winning.clear()
  dropOffsets.clear()
  lastWin = 0
  freeSpins = 0
  stickyWilds.clear()
  spinMultiplier = 1
  E.ticker.textContent = 'Validando ronda y saldo...'
  updateHud()

  try {
    const settled = await requestRound(stake)
    const outcome = settled.outcome
    balance = Number(settled.balanceBefore) - stake
    const payout = Number(settled.payout)
    let creditedTotal = 0
    const creditWin = amount => {
      const credited = Math.max(0, Math.min(Number(amount), payout - creditedTotal))
      creditedTotal += credited
      return credited
    }

    for (let index = 0; index < outcome.spins.length; index++) {
      if (index === 1 && outcome.spins[0].awardedFreeSpins > 0) await openBonus(outcome.spins[0])
      await animateResolvedSpin(outcome.spins[index], creditWin)
    }

    balance = Number(settled.balanceAfter)
    lastWin = payout
    freeSpins = 0
    stickyWilds.clear()
    E.machine.classList.remove('free-spin-mode')
    if (payout > 0) {
      pushHistory('win', 'Premio total de ronda', payout, `apuesta $${money(stake)}`)
      E.ticker.textContent = `Premio total $ ${money(payout)} · acreditado en tu saldo`
      await showWin(payout, stake, turbo)
    } else {
      pushHistory('loss', 'Ronda sin premio', 0, `apuesta $${money(stake)}`)
    }
  } catch (error) {
    E.ticker.textContent = error instanceof Error ? error.message : 'No se pudo completar la ronda.'
    autoSpins = 0
    E.auto.innerHTML = 'Auto<br>×10'
    E.auto.classList.remove('active')
    sfx.lose()
    await loadWallet()
  } finally {
    E.machine.classList.remove('spinning', 'free-spin-mode')
    spinning = false
    E.spin.disabled = !walletReady
    E.down.disabled = false
    E.up.disabled = false
    freeSpins = 0
    updateHud()
    persist()
  }

  if (autoSpins > 0) {
    autoSpins--
    E.auto.innerHTML = autoSpins ? `Auto<br>×${autoSpins}` : 'Auto<br>×10'
  }
  if (autoSpins === 0) E.auto.classList.remove('active')
  if (autoSpins > 0) setTimeout(startSpin, turbo ? 260 : 650)
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ betIndex, soundOn, turbo, volumeSettings }))
  } catch {}
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!saved) return
    betIndex = Math.max(0, Math.min(BETS.length - 1, saved.betIndex || 0))
    soundOn = saved.soundOn !== false
    turbo = Boolean(saved.turbo)
    if (saved.volumeSettings) volumeSettings = { ...volumeSettings, ...saved.volumeSettings }
  } catch {}
}

async function loadWallet() {
  E.spin.disabled = true
  try {
    const response = await fetch('/api/customer/wallet', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok || !payload.user || !payload.wallet) throw new Error(payload.error || 'Iniciá sesión para jugar.')
    balance = Number(payload.wallet.total_balance ?? payload.wallet.general_balance ?? 0)
    walletReady = true
    E.ticker.textContent = 'Saldo sincronizado. Presioná GIRAR para comenzar.'
  } catch (error) {
    walletReady = false
    E.ticker.textContent = error instanceof Error ? error.message : 'No se pudo sincronizar el saldo.'
  }
  E.spin.disabled = !walletReady
  updateHud()
}

function buildPaytable() {
  E.payGrid.innerHTML = ''
  for (const symbol of SYMBOLS) {
    const item = document.createElement('div')
    item.className = 'pay-item'
    item.dataset.symbol = symbol.key.toLowerCase()
    const icon = symbol.type === 'bear' ? '🐻' : symbol.type === 'fox' ? '🦊' : symbol.type === 'eagle' ? '🦅' : symbol.type === 'horse' ? '🐴' : symbol.type === 'honey' ? '🍯' : symbol.wild ? 'W' : symbol.bonus ? 'B' : symbol.label
    const value = symbol.wild ? 'Sustituye' : symbol.bonus ? '3 = 8 FS' : `6 = ×${symbol.pay[6]}`
    item.innerHTML = `<div class="pay-symbol pay-symbol-${symbol.key.toLowerCase()}">${icon}</div><span>${symbol.name}</span><strong>${value}</strong>`
    E.payGrid.appendChild(item)
  }
}

const historyCard = E.history?.closest('.history-card')
if (E.historyModalBody && E.lineDetailCard && historyCard) E.historyModalBody.append(E.lineDetailCard, historyCard)

function syncVolumeControls() {
  const controls = [
    [E.masterVolume, E.masterValue, 'master'],
    [E.effectsVolume, E.effectsValue, 'effects'],
    [E.musicVolume, E.musicValue, 'music'],
  ]
  controls.forEach(([input, output, key]) => {
    if (!input || !output) return
    input.value = String(Math.round(volumeSettings[key] * 100))
    output.value = `${input.value}%`
    input.oninput = () => {
      volumeSettings[key] = Number(input.value) / 100
      output.value = `${input.value}%`
      audioManager.setVolumes(volumeSettings)
      if (key === 'music' && volumeSettings.music > 0 && soundOn) audioManager.startMusic()
      persist()
    }
  })
}

E.spin.onclick = () => { playNamedSound('button', 0.6); sfx.click(); startSpin() }
E.down.onclick = () => { if (!spinning) { sfx.click(); betIndex = Math.max(0, betIndex - 1); updateHud(); persist() } }
E.up.onclick = () => { if (!spinning) { sfx.click(); betIndex = Math.min(BETS.length - 1, betIndex + 1); updateHud(); persist() } }
E.auto.onclick = () => {
  sfx.click()
  if (!walletReady) return
  if (autoSpins) {
    autoSpins = 0
    E.auto.innerHTML = 'Auto<br>×10'
    E.auto.classList.remove('active')
  } else {
    autoSpins = 10
    E.auto.innerHTML = 'Auto<br>×10'
    E.auto.classList.add('active')
    if (!spinning) startSpin()
  }
}
if (E.historyClear) E.historyClear.onclick = () => { sfx.click(); clearHistory() }
E.turbo.onclick = () => { sfx.click(); playNamedSound('turbo', 0.45); turbo = !turbo; E.turbo.classList.toggle('active', turbo); persist() }
E.sound.onclick = () => {
  if (soundOn) sfx.click()
  soundOn = !soundOn
  audioManager.setEnabled(soundOn)
  if (soundOn) { audioManager.startMusic(); sfx.click() }
  updateHud()
  persist()
}
E.settings.onclick = () => { sfx.click(); playNamedSound('modal', 0.48); E.settingsModal.classList.add('show') }
E.historyBtn.onclick = () => { sfx.click(); playNamedSound('modal', 0.48); E.historyModal.classList.add('show') }
E.info.onclick = () => { sfx.click(); playNamedSound('modal', 0.48); E.infoModal.classList.add('show') }
E.full.onclick = async () => { sfx.click(); try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen() } catch {} }

document.querySelectorAll('[data-close]').forEach(button => {
  button.onclick = () => document.getElementById(button.dataset.close)?.classList.remove('show')
})
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', event => {
  if (event.target === modal && !spinning) modal.classList.remove('show')
}))
addEventListener('keydown', event => {
  if (event.code === 'Space' && !/INPUT|BUTTON/.test(document.activeElement.tagName)) { event.preventDefault(); startSpin() }
  if (event.key.toLowerCase() === 'm') E.sound.click()
  if (event.key.toLowerCase() === 't') E.turbo.click()
  if (event.key.toLowerCase() === 'a') E.auto.click()
  if (event.key === 'Escape' && !spinning) document.querySelectorAll('.modal.show').forEach(modal => modal.classList.remove('show'))
})
addEventListener('resize', resize)
document.addEventListener('visibilitychange', () => { if (document.hidden) audioManager.stopMusic(); else if (soundOn) audioManager.startMusic() })

restore()
audioManager.setEnabled(soundOn)
audioManager.setVolumes(volumeSettings)
audioManager.preload(SOUND_FILES)
syncVolumeControls()
grid = makeGrid()
display = grid
buildPaytable()
E.ways.textContent = money(activeWays(grid))
E.turbo.classList.toggle('active', turbo)
updateHud()
resize()
requestAnimationFrame(loop)
function hideLoader() {
  E.loader?.classList.add('hide')
}

addEventListener('error', hideLoader)
addEventListener('unhandledrejection', hideLoader)
setTimeout(hideLoader, 900)
loadWallet()
