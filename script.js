const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const brl = value => Number(value).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
const today = new Date();
const isoDate = (date) => { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dateOffset = n => { const d = new Date(); d.setDate(d.getDate()+n); return isoDate(d); };
const seedTransactions = [
 {id:1,description:'Salário mensal',category:'Salário',member:'Mariana',date:dateOffset(-2),type:'income',amount:4200},
 {id:2,description:'Mercado da semana',category:'Alimentação',member:'Rafael',date:dateOffset(-1),type:'expense',amount:485.70},
 {id:3,description:'Conta de energia',category:'Moradia',member:'Mariana',date:dateOffset(-3),type:'expense',amount:198.40},
 {id:4,description:'Mesada do Lucas',category:'Mesada',member:'Lucas',date:dateOffset(-4),type:'income',amount:100},
 {id:5,description:'Lanche com amigos',category:'Lazer',member:'Lucas',date:dateOffset(-1),type:'expense',amount:28},
 {id:6,description:'Transporte escolar',category:'Transporte',member:'Rafael',date:dateOffset(-5),type:'expense',amount:160},
 {id:7,description:'Aulas de inglês',category:'Educação',member:'Sofia',date:dateOffset(-2),type:'expense',amount:140},
 {id:8,description:'Freelance',category:'Renda extra',member:'Rafael',date:dateOffset(-6),type:'income',amount:800},
 {id:9,description:'Farmácia',category:'Saúde',member:'Mariana',date:dateOffset(-3),type:'expense',amount:85.90},
 {id:10,description:'Cinema',category:'Lazer',member:'Sofia',date:dateOffset(-1),type:'expense',amount:42},
 {id:11,description:'Internet residencial',category:'Moradia',member:'Mariana',date:dateOffset(-7),type:'expense',amount:119.90},
 {id:12,description:'Venda de item usado',category:'Renda extra',member:'Rafael',date:dateOffset(-8),type:'income',amount:250},
 {id:13,description:'Compra de material escolar',category:'Educação',member:'Sofia',date:dateOffset(-9),type:'expense',amount:75},
 {id:14,description:'Mesada da Sofia',category:'Mesada',member:'Sofia',date:dateOffset(-6),type:'income',amount:80},
 {id:15,description:'Feira e hortifruti',category:'Alimentação',member:'Rafael',date:dateOffset(-10),type:'expense',amount:220},
 {id:16,description:'Água',category:'Moradia',member:'Mariana',date:dateOffset(-12),type:'expense',amount:78},
 {id:17,description:'Bônus',category:'Renda extra',member:'Mariana',date:dateOffset(-14),type:'income',amount:1250},
 {id:18,description:'Farmácia',category:'Saúde',member:'Rafael',date:dateOffset(-15),type:'expense',amount:62}
];
const defaultGoals = [
 {id:1,title:'Viagem em família',description:'Férias e novas memórias juntos',current:2400,target:5000,icon:'⌂'},
 {id:2,title:'Reserva de emergência',description:'Mais tranquilidade para imprevistos',current:1850,target:6000,icon:'◈'},
 {id:3,title:'Novo computador',description:'Tecnologia para estudar e aprender',current:650,target:2500,icon:'▣'}
];
const budgetDefaults = [
 {category:'Alimentação',icon:'◉',limit:1000},{category:'Moradia',icon:'⌂',limit:1200},{category:'Transporte',icon:'↗',limit:550},{category:'Educação',icon:'▤',limit:500},{category:'Lazer',icon:'✦',limit:350},{category:'Saúde',icon:'＋',limit:400},{category:'Outros',icon:'◈',limit:800}
];
function load(key, fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch{return fallback}}
let transactions = load('ff_transactions',seedTransactions);
let goals = load('ff_goals',defaultGoals);
let budgets = load('ff_budgets',budgetDefaults);
function persist(){localStorage.setItem('ff_transactions',JSON.stringify(transactions));localStorage.setItem('ff_goals',JSON.stringify(goals));localStorage.setItem('ff_budgets',JSON.stringify(budgets))}
function moneyDate(date){return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','')}
function iconFor(category){return ({'Alimentação':'◉','Moradia':'⌂','Transporte':'↗','Educação':'▤','Lazer':'✦','Saúde':'＋','Mesada':'♧','Salário':'↙','Renda extra':'✧','Outros':'◈'})[category]||'◈'}
function monthTransactions(){const now=new Date();return transactions.filter(t=>{const d=new Date(`${t.date}T12:00:00`);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()})}
function totals(list){return list.reduce((a,t)=>{a[t.type]+=Number(t.amount);return a},{income:0,expense:0})}
function currentMonthExpenses(){return monthTransactions().filter(t=>t.type==='expense')}
function renderDashboard(){
 const mt=monthTransactions(), total=totals(mt), balance=total.income-total.expense;
 $('#incomeValue').textContent=brl(total.income);$('#expenseValue').textContent=brl(total.expense);$('#balanceValue').textContent=brl(balance);
 const saved=Math.max(0,balance);$('#savedValue').textContent=brl(saved);$('#expenseProgress').style.width=`${Math.min(100,total.income?total.expense/total.income*100:0)}%`;$('#savingsProgress').style.width=`${Math.min(100,saved/1000*100)}%`;
 $('#chartPeriod').dispatchEvent(new Event('render-chart'));renderCategoryChart();renderRecent();renderBudget();renderGoals();renderChildren();
}
function drawBars(){
 const period=$('#chartPeriod').value;let labels,values;
 if(period==='week'){
   labels=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
   values=labels.map((_,i)=>{const day=new Date();day.setDate(day.getDate()-((day.getDay()+6)%7)+(i));const date=isoDate(day);return totals(transactions.filter(t=>t.date===date))});
 }else{
   labels=['Sem. 1','Sem. 2','Sem. 3','Sem. 4'];
   values=labels.map((_,i)=>{const now=new Date(), start=new Date(now.getFullYear(),now.getMonth(),i*7+1),end=new Date(now.getFullYear(),now.getMonth(),i*7+8);return totals(monthTransactions().filter(t=>{const d=new Date(`${t.date}T12:00:00`);return d>=start&&d<end}))});
 }
 const max=Math.max(1000,...values.map(v=>Math.max(v.income,v.expense)));$('#barChart').innerHTML=values.map((v,i)=>`<div class="bar-group"><div class="bars"><div class="bar income" style="height:${Math.max(v.income?2:0,v.income/max*100)}%" data-value="${brl(v.income)}"></div><div class="bar expense" style="height:${Math.max(v.expense?2:0,v.expense/max*100)}%" data-value="${brl(v.expense)}"></div></div><span class="bar-label">${labels[i]}</span></div>`).join('');
 const sum=values.reduce((a,v)=>({income:a.income+v.income,expense:a.expense+v.expense}),{income:0,expense:0});
 $('#chartSaved').textContent=brl(sum.income-sum.expense);$('#chartInsight').textContent=sum.income>=sum.expense?'Suas receitas estão acima das despesas. Continue assim!':'As despesas superaram as receitas no período selecionado. Revise seu orçamento.';
}
function renderCategoryChart(){
 const expenses=currentMonthExpenses(), total=expenses.reduce((a,t)=>a+t.amount,0);const cats={};expenses.forEach(t=>cats[t.category]=(cats[t.category]||0)+t.amount);
 const colors=['#647432','#b9d362','#e3c080','#9e95c6','#dce4c5','#7c9aa1','#d9a078'];const sorted=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,5);
 let start=0;const segments=sorted.map(([name,value],i)=>{const end=start+(total?value/total*100:0);const s=`${colors[i]} ${start}% ${end}%`;start=end;return s});
 $('#donutChart').style.background=`conic-gradient(${segments.length?segments.join(','):'#e9ecdf 0 100%'})`;$('#donutTotal').textContent=brl(total).replace(',00','');
 $('#categoryLegend').innerHTML=sorted.length?sorted.map(([name,value],i)=>`<div class="legend-item"><i style="background:${colors[i]}"></i><span>${name}</span><strong>${Math.round(value/(total||1)*100)}%</strong></div>`).join(''):'<span class="legend-item">Sem despesas</span>';
}
function transactionRow(t){return `<div class="transaction-row"><div class="transaction-main"><span class="transaction-icon ${t.type==='income'?'income':t.category==='Lazer'?'lazer':''}">${iconFor(t.category)}</span><div><strong>${escapeHtml(t.description)}</strong><small>${escapeHtml(t.category)} · ${moneyDate(t.date)}</small></div></div><div class="transaction-amount ${t.type}">${t.type==='income'?'+':'−'} ${brl(t.amount)}<small>${escapeHtml(t.member)}</small></div></div>`}
function renderRecent(){$('#recentTransactions').innerHTML=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(transactionRow).join('')||'<div class="empty-state">Nenhuma movimentação registrada.</div>'}
function renderTransactions(){
 const search=($('#transactionSearch')?.value||'').toLowerCase(),type=$('#typeFilter')?.value||'all',member=$('#memberFilter')?.value||'all';
 const filtered=[...transactions].filter(t=>(`${t.description} ${t.category} ${t.member}`.toLowerCase().includes(search))&&(type==='all'||t.type===type)&&(member==='all'||t.member===member)).sort((a,b)=>b.date.localeCompare(a.date));
 $('#allTransactions').innerHTML=filtered.length?filtered.map(t=>`<tr><td>${escapeHtml(t.description)}</td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(t.member)}</td><td>${moneyDate(t.date)}</td><td><span class="type-pill ${t.type}">${t.type==='income'?'Receita':'Despesa'}</span></td><td style="font-weight:700;color:${t.type==='income'?'#7b963d':'#505642'}">${t.type==='income'?'+':'−'} ${brl(t.amount)}</td></tr>`).join(''):'<tr><td colspan="6" class="empty-state">Nenhuma movimentação encontrada.</td></tr>';
}
function renderBudget(){
 const expenses=currentMonthExpenses(),spent=expenses.reduce((a,t)=>a+t.amount,0),limit=budgets.reduce((a,b)=>a+b.limit,0);
 $('#budgetSpent').textContent=brl(spent);$('#budgetRemaining').textContent=brl(limit-spent);
 $('#budgetList').innerHTML=budgets.map(b=>{const value=expenses.filter(t=>t.category===b.category).reduce((a,t)=>a+t.amount,0),pct=value/(b.limit||1)*100;return `<div class="budget-row"><div class="budget-category"><i>${b.icon||iconFor(b.category)}</i>${escapeHtml(b.category)}</div><div><div class="budget-bar"><i class="${pct>100?'over':''}" style="width:${Math.min(100,pct)}%"></i></div></div><div class="budget-values"><strong>${brl(value)} / ${brl(b.limit)}</strong><small>${pct>100?'Limite ultrapassado':`${Math.round(pct)}% utilizado`}</small></div></div>`}).join('');
}
function renderGoals(){$('#goalCards').innerHTML=goals.map(g=>`<article class="goal-tile"><div class="goal-tile-icon">${g.icon||'◎'}</div><h3>${escapeHtml(g.title)}</h3><p>${escapeHtml(g.description||'Objetivo da família')}</p><div class="goal-numbers"><strong>${brl(g.current)}</strong><span>de ${brl(g.target)}</span></div><div class="progress-line goal-progress"><i style="width:${Math.min(100,g.current/g.target*100)}%"></i></div><div class="goal-bottom"><span>${Math.min(100,Math.round(g.current/g.target*100))}% concluído</span><button class="outline-btn contribute-goal" data-id="${g.id}">＋ Adicionar</button></div></article>`).join('');$('#goalCurrent').textContent=brl(goals[0]?.current||0);$('#goalProgress').style.width=`${Math.min(100,(goals[0]?.current||0)/(goals[0]?.target||1)*100)}%`;$('#goalPercent').textContent=`${Math.min(100,Math.round((goals[0]?.current||0)/(goals[0]?.target||1)*100))}% concluído`;}
function childExpenses(name){return transactions.filter(t=>t.member===name&&t.type==='expense').sort((a,b)=>b.date.localeCompare(a.date))}
function renderChildren(){
 const kids=[{name:'Lucas',age:14,allowance:100,color:'',emoji:'L'},{name:'Sofia',age:11,allowance:80,color:'sofia',emoji:'S'}];
 $('#childCards').innerHTML=kids.map(k=>{const all=transactions.filter(t=>t.member===k.name),expenses=all.filter(t=>t.type==='expense'),spent=expenses.reduce((a,t)=>a+t.amount,0),income=all.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0),remaining=income-spent;return `<article class="child-card ${k.color}"><div class="child-head"><div class="child-avatar ${k.color}">${k.emoji}</div><div><h3>${k.name}</h3><p>${k.age} anos · Conta acompanhada</p></div><div class="child-allowance"><small>Saldo estimado</small><strong>${brl(remaining)}</strong></div></div><div class="child-stats"><div class="child-stat"><small>Gastos registrados</small><strong>${brl(spent)}</strong></div><div class="child-stat"><small>Entradas / mesada</small><strong>${brl(income)}</strong></div></div><div class="child-progress"><i style="width:${Math.min(100,spent/(income||1)*100)}%"></i></div><div class="child-foot"><span>${expenses.length} gastos registrados</span><span>${income?Math.round(spent/income*100):0}% utilizado</span></div></article>`}).join('');
 const filter=$('#childFilter')?.value||'all';const items=transactions.filter(t=>(t.member==='Lucas'||t.member==='Sofia')&&(filter==='all'||t.member===filter)).sort((a,b)=>b.date.localeCompare(a.date));
 $('#childTransactions').innerHTML=items.length?items.map(t=>`<div class="child-transaction">${transactionRow(t)}</div>`).join(''):'<div class="empty-state">Nenhuma movimentação para este filtro.</div>';
}
function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let toastTimer;function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}
function navigate(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));$$('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const active=$(`.nav-item[data-view="${view}"]`);$('#pageCrumb').textContent=active?active.textContent.trim().replace(/\s+/g,' '):'Visão geral';if(view==='transactions')renderTransactions();if(view==='budget')renderBudget();if(view==='goals')renderGoals();if(view==='children')renderChildren();window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-view]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.view)));
$('#chartPeriod').addEventListener('change',drawBars);
$('#chartPeriod').addEventListener('render-chart',drawBars);
$('#transactionSearch').addEventListener('input',renderTransactions);$('#typeFilter').addEventListener('change',renderTransactions);$('#memberFilter').addEventListener('change',renderTransactions);$('#childFilter').addEventListener('change',renderChildren);
function openModal(id){$(`#${id}`).hidden=false}function closeModal(id){$(`#${id}`).hidden=true}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$$('.modal-backdrop').forEach(back=>back.addEventListener('click',e=>{if(e.target===back)back.hidden=true}));
function openTransaction(){const form=$('#transactionForm');form.reset();form.elements.date.value=isoDate(new Date());openModal('transactionModal')}
$('#quickAdd').addEventListener('click',openTransaction);$('#addTransaction').addEventListener('click',openTransaction);
$('#transactionForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),amount=Number(f.get('amount'));if(!Number.isFinite(amount)||amount<=0)return toast('Informe um valor válido.');transactions.push({id:Date.now(),description:f.get('description').trim(),type:f.get('type'),amount,category:f.get('category'),member:f.get('member'),date:f.get('date')});persist();closeModal('transactionModal');renderDashboard();renderTransactions();toast('Movimentação registrada com sucesso!')});
function genericModal(title,fields,handler){$('#genericTitle').textContent=title;$('#genericFields').innerHTML=fields;$('#genericForm').onsubmit=e=>{e.preventDefault();handler(new FormData(e.currentTarget));closeModal('genericModal');e.currentTarget.reset();persist();renderDashboard();toast('Informações salvas!')};openModal('genericModal')}
$('#newGoal').addEventListener('click',()=>genericModal('Criar meta',`<label>Nome da meta<input name="title" required placeholder="Ex.: Bicicleta nova"></label><label>Descrição<input name="description" placeholder="Qual é o objetivo?"></label><div class="form-row"><label>Valor desejado (R$)<input name="target" type="number" min="1" step=".01" required></label><label>Já economizado (R$)<input name="current" type="number" min="0" step=".01" value="0" required></label></div>`,f=>goals.push({id:Date.now(),title:f.get('title'),description:f.get('description'),target:Number(f.get('target')),current:Number(f.get('current')),icon:'◎'})));
$('#addAllowance').addEventListener('click',()=>genericModal('Registrar mesada',`<label>Filho(a)<select name="member"><option>Lucas</option><option>Sofia</option></select></label><label>Valor da mesada (R$)<input name="amount" type="number" min=".01" step=".01" required></label><label>Data<input name="date" type="date" value="${isoDate(new Date())}" required></label>`,f=>transactions.push({id:Date.now(),description:'Mesada',category:'Mesada',member:f.get('member'),amount:Number(f.get('amount')),date:f.get('date'),type:'income'})));
$('#editBudget').addEventListener('click',()=>genericModal('Ajustar limites',budgets.map((b,i)=>`<label>${escapeHtml(b.category)} (R$)<input name="budget${i}" type="number" min="0" step=".01" value="${b.limit}" required></label>`).join(''),f=>budgets=budgets.map((b,i)=>({...b,limit:Number(f.get(`budget${i}`))}))));
$$('.learn-more').forEach(b=>b.addEventListener('click',()=>{const content={consumo:['Consumo consciente','Antes de comprar, pergunte: eu preciso disso agora? Existe uma alternativa mais econômica? Qual objetivo ficará para depois se eu gastar esse dinheiro? Essa reflexão é um exemplo de custo de oportunidade: toda escolha envolve abrir mão de outra possibilidade.'],juros:['Juros e descontos','Juros são o custo de usar dinheiro emprestado ou a remuneração por emprestar/investir. Para comparar uma compra parcelada, multiplique o valor da parcela pelo número de parcelas e compare com o preço à vista. Confira também taxas e condições do contrato.'],poupanca:['Reserva e poupança','Uma reserva financeira ajuda a lidar com imprevistos sem recorrer imediatamente a dívidas. Defina um valor possível, mesmo pequeno, e guarde com regularidade. O valor ideal depende da renda, das despesas e da realidade de cada família.']}[b.dataset.topic];$('#learningModal').hidden=false;$('#learningModal').innerHTML=`<h3>${content[0]}</h3><p>${content[1]}</p>`;$('#learningModal').scrollIntoView({behavior:'smooth',block:'nearest'})}));
$('#calculate').addEventListener('click',()=>{const cash=Number($('#cashPrice').value),n=Number($('#installments').value),each=Number($('#installmentValue').value);if(cash<=0||n<1||each<=0)return toast('Preencha valores maiores que zero.');const total=n*each,diff=total-cash,pct=diff/cash*100;$('#simulationResult').style.display='block';$('#simulationResult').innerHTML=`Total parcelado: <strong>${brl(total)}</strong><br>${diff>=0?'Diferença':'Economia'}: <strong>${brl(Math.abs(diff))} (${Math.abs(pct).toLocaleString('pt-BR',{maximumFractionDigits:1})}%)</strong> ${diff>=0?'a mais':'a menos'} que à vista.`});
$('#resetData').addEventListener('click',()=>{if(confirm('Restaurar os dados de demonstração? Isso substituirá os registros deste protótipo.')){transactions=seedTransactions.map(t=>({...t}));goals=defaultGoals.map(g=>({...g}));budgets=budgetDefaults.map(b=>({...b}));persist();renderDashboard();renderTransactions();toast('Dados de demonstração restaurados.')}});
$('#noticeClose')?.addEventListener('click',()=>$('.notice').remove());$('.notice-close').addEventListener('click',()=>$('.notice').remove());
renderDashboard();renderTransactions();drawBars();
