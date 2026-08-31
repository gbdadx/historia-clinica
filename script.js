(function(){
  // ---- Accordion: elegir scores a mostrar ----
  const accBtn = document.getElementById('accToggleBtn');
  const accPanel = document.getElementById('accPanel');
  accBtn.addEventListener('click', ()=>{
    accBtn.classList.toggle('open');
    accPanel.classList.toggle('open');
  });
  document.querySelectorAll('#accPanel input[type=checkbox]').forEach(chk=>{
    chk.addEventListener('change', ()=>{
      const tabBtn = document.querySelector(`.tab-btn[data-view="${chk.dataset.tab}"]`);
      tabBtn.classList.toggle('hidden-tab', !chk.checked);
      // Si se oculta la pestaña activa, volver a la Ficha
      if(!chk.checked && tabBtn.classList.contains('active')){
        tabBtn.classList.remove('active');
        document.getElementById('view-'+chk.dataset.tab).classList.remove('active');
        document.querySelector('.tab-btn[data-view="hc"]').classList.add('active');
        document.getElementById('view-hc').classList.add('active');
      }
    });
  });

  // ---- Tabs ----
  const tabBtns = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.view');
  tabBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabBtns.forEach(b=>b.classList.remove('active'));
      views.forEach(v=>v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-'+btn.dataset.view).classList.add('active');
    });
  });

  // ---- Generic score param selector ----
  function wireParams(rootId, onChange){
    const root = document.getElementById(rootId);
    root.querySelectorAll('.param').forEach(param=>{
      param.querySelectorAll('.opt').forEach(opt=>{
        opt.addEventListener('click', ()=>{
          param.querySelectorAll('.opt').forEach(o=>o.classList.remove('selected'));
          opt.classList.add('selected');
          onChange();
        });
      });
    });
  }

  function getSelected(rootId){
    const root = document.getElementById(rootId);
    const groups = root.querySelectorAll('.param');
    const values = {};
    let allSelected = true;
    groups.forEach(g=>{
      const sel = g.querySelector('.opt.selected');
      if(sel){ values[g.dataset.group] = parseInt(sel.dataset.val,10); }
      else { allSelected = false; }
    });
    return {values, allSelected, count:groups.length};
  }

  // ---- Glasgow ----
  function updateGlasgow(){
    const {values, allSelected} = getSelected('view-glasgow');
    const total = Object.values(values).reduce((a,b)=>a+b,0);
    const totalEl = document.getElementById('glasgow_total');
    const badge = document.getElementById('glasgow_badge');
    if(Object.keys(values).length===0){
      totalEl.textContent = '—'; badge.textContent='Incompleto'; badge.className='badge neutral'; return;
    }
    totalEl.textContent = total + (allSelected? '/15' : '/15*');
    if(!allSelected){ badge.textContent='Faltan ítems'; badge.className='badge neutral'; return; }
    if(total>=13){ badge.textContent='TCE leve'; badge.className='badge ok'; }
    else if(total>=9){ badge.textContent='TCE moderado'; badge.className='badge mid'; }
    else { badge.textContent='TCE grave'; badge.className='badge warn'; }
  }
  wireParams('view-glasgow', updateGlasgow);

  // ---- CRAMP ----
  function updateCramp(){
    const {values, allSelected} = getSelected('view-cramp');
    const total = Object.values(values).reduce((a,b)=>a+b,0);
    const totalEl = document.getElementById('cramp_total');
    const badge = document.getElementById('cramp_badge');
    if(Object.keys(values).length===0){
      totalEl.textContent = '—'; badge.textContent='Incompleto'; badge.className='badge neutral'; return;
    }
    totalEl.textContent = total + (allSelected? '/10' : '/10*');
    if(!allSelected){ badge.textContent='Faltan ítems'; badge.className='badge neutral'; return; }
    if(total>=9){ badge.textContent='Trauma leve'; badge.className='badge ok'; }
    else { badge.textContent='Trauma grave — CRAMP ≤ 8'; badge.className='badge warn'; }
  }
  wireParams('view-cramp', updateCramp);

  // ---- Quemados: Regla de los 9 ----
  const regions = [
    {id:'cabeza', label:'Cabeza y cuello', adult:9, child:18},
    {id:'msd', label:'Miembro superior derecho', adult:9, child:9},
    {id:'msi', label:'Miembro superior izquierdo', adult:9, child:9},
    {id:'tronco_ant', label:'Tronco anterior', adult:18, child:18},
    {id:'tronco_post', label:'Tronco posterior', adult:18, child:18},
    {id:'mid', label:'Miembro inferior derecho', adult:18, child:13.5},
    {id:'mii', label:'Miembro inferior izquierdo', adult:18, child:13.5},
    {id:'perine', label:'Periné / genitales', adult:1, child:1},
  ];
  let scqMode = 'adult';
  let palmCount = 0;
  const regionList = document.getElementById('regionList');
  regions.forEach(r=>{
    const btn = document.createElement('button');
    btn.className = 'region-opt';
    btn.dataset.id = r.id;
    btn.type = 'button';
    btn.innerHTML = `<span>${r.label}</span><span class="pts">${r[scqMode]}%</span>`;
    btn.addEventListener('click', ()=>{
      btn.classList.toggle('selected');
      updateQuemados();
    });
    regionList.appendChild(btn);
  });

  document.querySelectorAll('#edadSwitch .segbtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#edadSwitch .segbtn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      scqMode = btn.dataset.mode;
      regionList.querySelectorAll('.region-opt').forEach(opt=>{
        const r = regions.find(x=>x.id===opt.dataset.id);
        opt.querySelector('.pts').textContent = r[scqMode] + '%';
      });
      updateQuemados();
    });
  });

  function updateQuemados(){
    let total = 0;
    const selected = [];
    regionList.querySelectorAll('.region-opt.selected').forEach(opt=>{
      const r = regions.find(x=>x.id===opt.dataset.id);
      total += r[scqMode];
      selected.push(`${r.label} (${r[scqMode]}%)`);
    });
    total += palmCount;
    document.getElementById('scq_total').textContent = (Math.round(total*10)/10) + '%';
    const badge = document.getElementById('scq_badge');
    if(selected.length===0 && palmCount===0){ badge.textContent='—'; badge.className='badge neutral'; return; }
    const umbralGrave = scqMode==='adult' ? 25 : 10;
    if(total >= umbralGrave){ badge.textContent='Gran quemado'; badge.className='badge warn'; }
    else if(total >= (scqMode==='adult'?15:10)){ badge.textContent='Moderado'; badge.className='badge mid'; }
    else { badge.textContent='Leve'; badge.className='badge ok'; }
  }

  document.getElementById('palmMinus').addEventListener('click', ()=>{
    if(palmCount>0){ palmCount--; document.getElementById('palmCount').textContent = palmCount; updateQuemados(); }
  });
  document.getElementById('palmPlus').addEventListener('click', ()=>{
    palmCount++; document.getElementById('palmCount').textContent = palmCount; updateQuemados();
  });

  // ---- Fecha/hora actual ----
  document.getElementById('btnAhora').addEventListener('click', ()=>{
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    document.getElementById('f_fecha').value = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;
    document.getElementById('f_hora').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  // ---- Resumen ----
  const glasgowLabels = {ocular:'Apertura ocular', verbal:'Respuesta verbal', motora:'Respuesta motora'};
  const crampLabels = {circulacion:'Circulación', respiracion:'Respiración', abdomen:'Abdomen/tórax', motor:'Motor', palabra:'Palabra'};

  function scoreLines(rootId, labels){
    const root = document.getElementById(rootId);
    const lines = [];
    root.querySelectorAll('.param').forEach(g=>{
      const sel = g.querySelector('.opt.selected');
      if(sel){
        const text = sel.childNodes[0].textContent.trim();
        lines.push(`  - ${labels[g.dataset.group]}: ${text} (${sel.dataset.val} pts)`);
      }
    });
    return lines;
  }

  function generarResumen(){
    const v = id => document.getElementById(id).value.trim();
    let out = '';
    out += `HISTORIA CLÍNICA\n`;
    out += `Fecha/hora: ${v('f_fecha')} ${v('f_hora')}\n`;
    out += `Paciente: ${v('f_nombre')}   Edad: ${v('f_edad')}\n\n`;
    out += `MOTIVO DE CONSULTA\n${v('f_motivo') || '-'}\n\n`;
    out += `ANTECEDENTES\n${v('f_antecedentes') || '-'}\n\n`;
    out += `MEDICACIÓN HABITUAL\n${v('f_medicacion') || '-'}\n\n`;
    out += `ALERGIAS\n${v('f_alergias') || '-'}\n\n`;
    out += `EXAMEN FÍSICO\n${v('f_examen') || '-'}\n\n`;
    out += `DIAGNÓSTICO PRESUNTIVO\n${v('f_diagnostico') || '-'}\n\n`;
    out += `PLAN / CONDUCTA\n${v('f_plan') || '-'}\n`;

    const gTotalTxt = document.getElementById('glasgow_total').textContent;
    if(gTotalTxt !== '—'){
      out += `\nESCALA DE GLASGOW: ${gTotalTxt}  (${document.getElementById('glasgow_badge').textContent})\n`;
      out += scoreLines('view-glasgow', glasgowLabels).join('\n') + '\n';
    }
    const cTotalTxt = document.getElementById('cramp_total').textContent;
    if(cTotalTxt !== '—'){
      out += `\nESCALA CRAMP: ${cTotalTxt}  (${document.getElementById('cramp_badge').textContent})\n`;
      out += scoreLines('view-cramp', crampLabels).join('\n') + '\n';
    }

    const scqTotal = document.getElementById('scq_total').textContent;
    const scqSelected = [];
    document.querySelectorAll('#regionList .region-opt.selected').forEach(opt=>{
      const r = regions.find(x=>x.id===opt.dataset.id);
      scqSelected.push(`  - ${r.label}: ${r[scqMode]}%`);
    });
    const quemNotas = v('f_quemNotas');
    if(scqTotal !== '0%' || quemNotas){
      out += `\nQUEMADOS — SCT (${scqMode==='adult'?'adulto':'pediátrico'}): ${scqTotal}  (${document.getElementById('scq_badge').textContent})\n`;
      if(scqSelected.length) out += scqSelected.join('\n') + '\n';
      if(palmCount>0) out += `  - Palma de la mano x${palmCount}: ${palmCount}%\n`;
      if(quemNotas) out += `  Profundidad/localización: ${quemNotas}\n`;
    }
    document.getElementById('resumenBox').value = out;
  }
  document.getElementById('btnGenerar').addEventListener('click', generarResumen);

  document.getElementById('btnCopiar').addEventListener('click', async ()=>{
    const box = document.getElementById('resumenBox');
    const msg = document.getElementById('copyMsg');
    if(!box.value){ generarResumen(); }
    try{
      box.select();
      box.setSelectionRange(0, 999999);
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(box.value);
      } else {
        document.execCommand('copy');
      }
      msg.textContent = 'Copiado ✓';
      setTimeout(()=>{msg.textContent='';}, 2000);
    }catch(e){
      msg.textContent = 'No se pudo copiar automáticamente, seleccioná y copiá el texto manualmente.';
    }
  });

  document.getElementById('btnCompartir').addEventListener('click', async ()=>{
    const box = document.getElementById('resumenBox');
    if(!box.value){ generarResumen(); }
    if(navigator.share){
      try{ await navigator.share({text: box.value}); }catch(e){}
    } else {
      document.getElementById('copyMsg').textContent = 'Compartir no disponible en este navegador; usá "Copiar".';
    }
  });

  document.getElementById('btnLimpiar').addEventListener('click', ()=>{
    if(!confirm('¿Borrar todos los campos y scores?')) return;
    ['f_nombre','f_edad','f_fecha','f_hora','f_motivo','f_antecedentes','f_medicacion','f_alergias','f_examen','f_diagnostico','f_plan'].forEach(id=>{
      document.getElementById(id).value='';
    });
    document.querySelectorAll('.opt.selected').forEach(o=>o.classList.remove('selected'));
    document.querySelectorAll('.region-opt.selected').forEach(o=>o.classList.remove('selected'));
    palmCount = 0;
    document.getElementById('palmCount').textContent = '0';
    document.getElementById('f_quemNotas').value = '';
    updateGlasgow(); updateCramp(); updateQuemados();
    document.getElementById('resumenBox').value='';
  });
})();
