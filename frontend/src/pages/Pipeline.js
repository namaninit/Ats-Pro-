import React, { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { candidateAPI } from '../hooks/useApi';

const STAGES = [
  { key: 'new',       label: 'New',       color: '#3b82f6' },
  { key: 'screening', label: 'Screening', color: '#f59e0b' },
  { key: 'interview', label: 'Interview', color: '#8b5cf6' },
  { key: 'offered',   label: 'Offered',   color: '#34d399' },
  { key: 'hired',     label: 'Hired',     color: '#10b981' },
  { key: 'rejected',  label: 'Rejected',  color: '#ef4444' },
];

const PAGE_SIZE = 10;

export default function Pipeline() {
  const [columns, setColumns] = useState({});
  const [pages, setPages] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await candidateAPI.getAll({ limit: 1000 });
      const all = r.data.candidates || [];
      const grouped = {};
      const initPages = {};
      STAGES.forEach(s => {
        grouped[s.key] = all.filter(c => c.status === s.key);
        initPages[s.key] = 1;
      });
      setColumns(grouped);
      setPages(initPages);
    } catch {
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const srcKey = source.droppableId;
    const dstKey = destination.droppableId;
    const candidateId = draggableId;

    const candidate = columns[srcKey].find(c => String(c.id) === candidateId);
    if (!candidate) return;

    const newColumns = { ...columns };
    newColumns[srcKey] = newColumns[srcKey].filter(c => String(c.id) !== candidateId);
    newColumns[dstKey] = [{ ...candidate, status: dstKey }, ...newColumns[dstKey]];
    setColumns(newColumns);

    try {
      await candidateAPI.updateStatus(candidateId, dstKey);
      toast.success(`${candidate.name} → ${dstKey}`);
    } catch {
      setColumns(columns); // revert
      toast.error('Failed to update status');
    }
  };

  const setPage = (stageKey, p) => setPages(prev => ({ ...prev, [stageKey]: p }));

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Recruitment Pipeline</h2>
          <p className="page-subtitle">Drag candidates across stages</p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          paddingBottom: 16, alignItems: 'flex-start',
        }}>
          {STAGES.map(stage => {
            const all = columns[stage.key] || [];
            const total = all.length;
            const currentPage = pages[stage.key] || 1;
            const totalPages = Math.ceil(total / PAGE_SIZE);
            const pageItems = all.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

            return (
              <div key={stage.key} style={{
                minWidth: 220, maxWidth: 240, flexShrink: 0,
                background: 'var(--bg-surface)', borderRadius: 12,
                border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Column header */}
                <div style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{stage.label}</span>
                  </div>
                  <span style={{
                    background: stage.color + '20', color: stage.color,
                    borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                  }}>{total}</span>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        padding: 8, flex: 1,
                        minHeight: 80,
                        background: snapshot.isDraggingOver ? stage.color + '08' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      {pageItems.map((c, idx) => (
                        <Draggable key={String(c.id)} draggableId={String(c.id)} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/candidates/${c.id}`)}
                              style={{
                                ...provided.draggableProps.style,
                                background: snapshot.isDragging ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
                                border: `1px solid ${snapshot.isDragging ? stage.color + '60' : 'var(--border)'}`,
                                borderRadius: 8, padding: '9px 10px', marginBottom: 6,
                                cursor: 'grab', boxShadow: snapshot.isDragging ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  background: stage.color + '20', color: stage.color,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                                }}>
                                  {c.name?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.name}
                                  </div>
                                  {c.currentLocation && (
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                                      📍 {c.currentLocation}
                                    </div>
                                  )}
                                  {c.experience > 0 && (
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                      {c.experience} yrs exp
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {pageItems.length === 0 && total === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--text-muted)', fontSize: 11 }}>
                          No candidates
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>

                {/* Column pagination */}
                {totalPages > 1 && (
                  <div style={{
                    padding: '8px 10px', borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 6,
                  }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setPage(stage.key, currentPage - 1)}
                      style={{
                        width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >‹</button>

                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                      {currentPage}/{totalPages}
                    </span>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(stage.key, currentPage + 1)}
                      style={{
                        width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >›</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}