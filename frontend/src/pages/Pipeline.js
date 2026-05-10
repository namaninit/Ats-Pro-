import React, { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { candidateAPI } from '../hooks/useApi';

const COLUMNS = [
  { key: 'new', label: 'New', color: '#3b82f6' },
  { key: 'screening', label: 'Screening', color: '#f59e0b' },
  { key: 'interview', label: 'Interview', color: '#8b5cf6' },
  { key: 'offered', label: 'Offered', color: '#34d399' },
  { key: 'hired', label: 'Hired', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];

export default function Pipeline() {
  const [columns, setColumns] = useState(() => Object.fromEntries(COLUMNS.map(c => [c.key, []])));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await candidateAPI.getAll({ limit: 200 });
      const grouped = Object.fromEntries(COLUMNS.map(c => [c.key, []]));
      r.data.candidates.forEach(c => { if (grouped[c.status]) grouped[c.status].push(c); });
      setColumns(grouped);
    } catch { toast.error('Failed to load pipeline'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;

    // Optimistically update
    const card = columns[srcCol][source.index];
    const newCols = { ...columns };
    newCols[srcCol] = [...columns[srcCol]];
    newCols[srcCol].splice(source.index, 1);
    newCols[dstCol] = [...columns[dstCol]];
    newCols[dstCol].splice(destination.index, 0, { ...card, status: dstCol });
    setColumns(newCols);

    try {
      await candidateAPI.updateStatus(draggableId, dstCol);
      toast.success(`Moved to ${dstCol}`);
    } catch {
      toast.error('Failed to update status');
      load(); // revert
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="page-title">Recruitment Pipeline</h2>
          <p className="page-subtitle">Drag candidates across stages</p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map(col => (
            <div key={col.key} className="kanban-column">
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
                </div>
                <span className="kanban-col-count">{columns[col.key].length}</span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    className="kanban-cards"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ background: snapshot.isDraggingOver ? 'rgba(99,102,241,0.05)' : undefined, minHeight: 80 }}
                  >
                    {columns[col.key].map((c, index) => (
                      <Draggable key={String(c.id)} draggableId={String(c.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            className="kanban-card"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.85 : 1,
                              boxShadow: snapshot.isDragging ? '0 8px 32px rgba(99,102,241,0.3)' : undefined,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{c.name[0]}</div>
                              <div className="kanban-card-name" style={{ fontSize: 13 }}>{c.name}</div>
                            </div>
                            <div className="kanban-card-meta">
                              {c.experience > 0 && <span>⏱ {c.experience} yrs exp</span>}
                              {c.job && <span>💼 {c.job.title}</span>}
                              {c.expectedCTC && <span>💰 ₹{c.expectedCTC} LPA</span>}
                              {Array.isArray(c.skills) && c.skills.length > 0 && (
                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                                  {c.skills.slice(0, 2).map(s => (
                                    <span key={s} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-light)', borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {columns[col.key].length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: 12 }}>
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
