'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Check, ShieldAlert } from 'lucide-react';

const USE_MOCK = process.env['NEXT_PUBLIC_USE_MOCK'] === 'true';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill, CHK_STATUS } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { TaskDrawer } from './TaskDrawer';
import { LicensingRoadmap } from './LicensingRoadmap';
import type { RoadmapStep } from './LicensingRoadmap';
import { daysUntil, fmtDate, uid } from '@/lib/date-helpers';
import { CHK_STATUS_OPTS, CHK_SORT_ORDER } from '@/lib/types';
import type { ChecklistTask } from '@/lib/types';
import { clientFetch } from '@/lib/client-fetch';
import { emitAudit } from '@/lib/audit';
import { mockTaskStore } from '@/lib/mock-store';
import { useChecklist, CHECKLIST_KEY } from '@/hooks/use-checklist';

type DrawerState = { kind:'closed' } | { kind:'edit'; id:string } | { kind:'new' };

export function ComplianceSection() {
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading, isError } = useChecklist();
  const [drawer, setDrawer] = useState<DrawerState>({ kind:'closed' });
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<string|null>(null);

  const counts = tasks.reduce<Record<string,number>>((acc,c)=>{ acc[c.status]=(acc[c.status]??0)+1; return acc; }, {});
  const done = counts['done']??0;
  const pct  = tasks.length ? Math.round((done/tasks.length)*100) : 0;

  const q = query.trim().toLowerCase();
  const filtered = tasks
    .filter(c=>(!filter||c.status===filter)&&(!q||c.task.toLowerCase().includes(q)||c.group.toLowerCase().includes(q)))
    .sort((a,b)=>{
      const sd=(CHK_SORT_ORDER[a.status]??9)-(CHK_SORT_ORDER[b.status]??9);
      if(sd!==0)return sd;
      return (daysUntil(a.date)??Infinity)-(daysUntil(b.date)??Infinity);
    });

  const closeDrawer = ()=>setDrawer({kind:'closed'});

  const saveTask = async (task: ChecklistTask) => {
    const isCreating = !tasks.some(c=>c.id===task.id);
    if (USE_MOCK) {
      isCreating ? mockTaskStore.add(task) : mockTaskStore.update(task.id, task);
    } else {
      await clientFetch(
        isCreating?'/compliance':`/compliance/${task.id}`,
        { method:isCreating?'POST':'PATCH', body:JSON.stringify(task) },
      );
      emitAudit({ action:isCreating?'create':'update', entity:'task', entityId:task.id, label:`Task "${task.task}" ${isCreating?'added':'saved'}`, tenantId:'session' });
    }
    await queryClient.invalidateQueries({ queryKey: CHECKLIST_KEY });
    if (isCreating) { closeDrawer(); } else { setDrawer({ kind:'edit', id:task.id }); }
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find(c=>c.id===id);
    if (USE_MOCK) {
      mockTaskStore.remove(id);
    } else {
      await clientFetch(`/compliance/${id}`, { method:'DELETE' });
      emitAudit({ action:'delete', entity:'task', entityId:id, label:`Task "${task?.task??id}" deleted`, tenantId:'session' });
    }
    await queryClient.invalidateQueries({ queryKey: CHECKLIST_KEY });
    closeDrawer();
  };

  const quickToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find(c=>c.id===id);
    const nextStatus: ChecklistTask['status'] = task?.status === 'done' ? 'progress' : 'done';
    if (USE_MOCK) {
      mockTaskStore.update(id, { status: nextStatus });
    } else {
      await clientFetch(`/compliance/${id}`, { method:'PATCH', body:JSON.stringify({ status:nextStatus }) });
      emitAudit({ action:'toggle', entity:'task', entityId:id, label:`Task "${task?.task??id}" marked ${nextStatus==='done'?'done':'in progress'}`, tenantId:'session' });
    }
    await queryClient.invalidateQueries({ queryKey: CHECKLIST_KEY });
  };

  const createFromRoadmap = async (step: RoadmapStep) => {
    const newTask: ChecklistTask = {
      id: uid(),
      task: step.label,
      group: step.group,
      status: 'notstarted' as const,
      date: step.date,
      owner: '',
      requirements: [],
      documents: [],
      notes: '',
    };
    if (USE_MOCK) {
      mockTaskStore.add(newTask);
    } else {
      await clientFetch('/compliance', { method: 'POST', body: JSON.stringify(newTask) });
      emitAudit({ action: 'create', entity: 'task', entityId: newTask.id, label: `Task "${step.label}" added from roadmap`, tenantId: 'session' });
    }
    await queryClient.invalidateQueries({ queryKey: CHECKLIST_KEY });
  };

  const editingTask = drawer.kind==='edit' ? tasks.find(c=>c.id===drawer.id)??null : null;

  if (isLoading) return <LoadingState />;
  if (isError)   return <LoadingState error message="Could not load compliance tasks." />;

  return (
    <div>
      <SectionHeader
        title="Compliance & setup"
        desc="Entity, banking, HIPAA, and insurance readiness — each task with its own checklist of sub-steps and documents."
        actions={
          <div className="lic-toolbar">
            <div className="lic-search">
              <Search size={15}/>
              <input placeholder="Find a task…" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search tasks"/>
            </div>
            <button type="button" className="btn primary" onClick={()=>setDrawer({kind:'new'})}>
              <Plus size={15}/> Add task
            </button>
          </div>
        }
      />

      <div className="dash-grid" style={{ marginBottom:'var(--gap-grid)' }}>
        <div className="col-3">
          <div className="card kpi">
            <span className="kpi-label">Readiness</span>
            <div className="kpi-value" style={{ margin:'10px 0 8px' }}>{pct}%</div>
            <div className="progress"><span style={{ width:`${pct}%` }}/></div>
            <div className="kpi-sub" style={{ marginTop:7 }}>{done} of {tasks.length} complete</div>
          </div>
        </div>
        {CHK_STATUS_OPTS.map(([key,label])=>{
          const isSelected=filter===key;
          const s=CHK_STATUS[key]!;
          return (
            <div key={key} className="col-3">
              <div className={`card kpi stat-card${isSelected?' sel':''}`}
                onClick={()=>setFilter(isSelected?null:key)}
                role="button" tabIndex={0} aria-pressed={isSelected}
                onKeyDown={e=>e.key==='Enter'&&setFilter(isSelected?null:key)}>
                <div className="stat-mini"><StatusPill variant={s.variant} label={label}/></div>
                <div className="kpi-value" style={{ margin:'10px 0 2px' }}>{counts[key]??0}</div>
                <div className="kpi-sub">{isSelected?'Filtering · tap to clear':'tap to filter'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-grid">
        <div className="col-12">
          <Card title="Tasks"
            desc={filter?`Filtered: ${CHK_STATUS_OPTS.find(o=>o[0]===filter)?.[1]??''}`:'Tick the box to complete · click a row to open its checklist'}>
            {filtered.length===0 ? (
              <EmptyState Icon={ShieldAlert} title="No matching tasks"
                desc="Add setup and compliance tasks — entity, banking, HIPAA, insurance."/>
            ) : (
              <div className="check-list">
                {filtered.map(c=>{
                  const dUntil=daysUntil(c.date);
                  const soon=dUntil!=null&&dUntil<=14&&c.status!=='done';
                  const subDone=c.requirements.filter(r=>r.done).length;
                  const sInfo=CHK_STATUS[c.status]??CHK_STATUS['notstarted']!;
                  return (
                    <div key={c.id} className="check-item" style={{ cursor:'pointer' }}
                      onClick={()=>setDrawer({kind:'edit',id:c.id})} role="button" tabIndex={0}
                      onKeyDown={e=>e.key==='Enter'&&setDrawer({kind:'edit',id:c.id})}>
                      <span className={`check-box ${c.status}`} role="checkbox" aria-checked={c.status==='done'}
                        tabIndex={0} onClick={e=>quickToggle(c.id,e)} title="Toggle complete"
                        onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.stopPropagation();quickToggle(c.id,e as any);}}}>
                        {c.status==='done'&&<Check size={13}/>}
                        {c.status==='progress'&&<span style={{ fontSize:11,fontWeight:700 }}>·</span>}
                      </span>
                      <div style={{ flex:1 }}>
                        <span className={`check-task${c.status==='done'?' done':''}`}>{c.task}</span>
                        {c.requirements.length>0&&(
                          <div style={{ fontSize:11,color:'var(--ink-3)',fontFamily:'var(--font-mono)' }}>
                            {subDone}/{c.requirements.length} sub-steps
                          </div>
                        )}
                      </div>
                      <span className="check-meta">
                        <span className="tag">{c.group}</span>
                        {c.status!=='done'&&c.date&&<span className={`check-due${soon?' soon':''}`}>due {fmtDate(c.date)}</span>}
                        <StatusPill variant={sInfo.variant} label={sInfo.label}/>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <LicensingRoadmap tasks={tasks} onCreateTask={createFromRoadmap} />

      {drawer.kind!=='closed'&&(
        <TaskDrawer key={drawer.kind==='edit'?drawer.id:'__new__'}
          task={editingTask} onSave={saveTask} onDelete={deleteTask} onClose={closeDrawer}/>
      )}
    </div>
  );
}
