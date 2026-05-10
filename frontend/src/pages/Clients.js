import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { clientAPI } from '../hooks/useApi';

const INDUSTRIES = ['IT Services','IT Consulting','Digital Agency','Finance','Healthcare','Manufacturing','Education','Retail','Real Estate','Other'];

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client || { companyName:'', industry:'', website:'', contactPerson:'', contactEmail:'', contactPhone:'', address:'', status:'active', notes:'' });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (client?.id) await clientAPI.update(client.id, form);
      else await clientAPI.create(form);
      toast.success(client?.id ? 'Client updated!' : 'Client added!');
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{client?.id ? '✏️ Edit Client' : '🏢 Add Client'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Company Name *</label><input className="form-input" name="companyName" value={form.companyName} onChange={handle} required autoFocus /></div>
              <div className="form-group"><label className="form-label">Industry</label>
                <select className="form-input form-select" name="industry" value={form.industry} onChange={handle}>
                  <option value="">-- Select --</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Website</label><input className="form-input" name="website" value={form.website} onChange={handle} placeholder="https://..." /></div>
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" name="address" value={form.address} onChange={handle} placeholder="City, State" /></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: '16px 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Person</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="contactPerson" value={form.contactPerson} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" name="contactEmail" value={form.contactEmail} onChange={handle} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" name="contactPhone" value={form.contactPhone} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-input form-select" name="status" value={form.status} onChange={handle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" name="notes" value={form.notes} onChange={handle} rows={2} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Client'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list | grid
  const [showAll, setShowAll] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [colFilter, setColFilter] = useState({ companyName:'', contactEmail:'', address:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await clientAPI.getAll({ status: showAll ? '' : 'active' });
      setClients(r.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [showAll]);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !s || c.companyName?.toLowerCase().includes(s) || c.contactEmail?.toLowerCase().includes(s) || c.address?.toLowerCase().includes(s);
    const matchCol = (!colFilter.companyName || c.companyName?.toLowerCase().includes(colFilter.companyName.toLowerCase()))
      && (!colFilter.contactEmail || c.contactEmail?.toLowerCase().includes(colFilter.contactEmail.toLowerCase()))
      && (!colFilter.address || c.address?.toLowerCase().includes(colFilter.address.toLowerCase()));
    return matchSearch && matchCol;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page-1)*pageSize, page*pageSize);

  const handleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const handleSelectAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(c=>c.id));

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    try { await clientAPI.delete(id); toast.success('Deleted'); setSelected(p=>p.filter(x=>x!==id)); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !window.confirm(`Delete ${selected.length} clients?`)) return;
    try { await Promise.all(selected.map(id=>clientAPI.delete(id))); toast.success(`${selected.length} clients deleted`); setSelected([]); load(); }
    catch { toast.error('Bulk delete failed'); }
  };

  const avatarColor = (name) => {
    const colors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#ec4899','#14b8a6'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };



  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Clients</h2>
          <p className="page-subtitle">{filtered.length} companies</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {selected.length > 0 && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => { const emails = clients.filter(c=>selected.includes(c.id)).map(c=>c.contactEmail).filter(Boolean).join(','); window.open(`mailto:${emails}`); }}>
                ✉️ Send Email ({selected.length})
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑️ Delete ({selected.length})</button>
            </>
          )}
         
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* Show Active / Show All */}
          <div style={{ display:'flex', background:'var(--bg-elevated)', borderRadius:8, padding:3, gap:2 }}>
            <button onClick={() => { setShowAll(false); setPage(1); }} style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontFamily:'var(--font-body)', fontWeight:500, background:!showAll ? 'var(--accent)' : 'transparent', color:!showAll ? '#fff' : 'var(--text-secondary)', transition:'all 0.2s' }}>Show Active</button>
            <button onClick={() => { setShowAll(true); setPage(1); }} style={{ padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontFamily:'var(--font-body)', fontWeight:500, background:showAll ? 'var(--accent)' : 'transparent', color:showAll ? '#fff' : 'var(--text-secondary)', transition:'all 0.2s' }}>Show All</button>
          </div>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:14 }}>🔍</span>
            <input className="form-input" style={{ paddingLeft:34, width:220 }} placeholder="Search clients..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {/* View Toggle + Add Client */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {/* List/Grid toggle */}
          <div style={{ display:'flex', background:'var(--bg-elevated)', borderRadius:8, padding:3, gap:2 }}>
            <button onClick={() => setViewMode('list')} title="List View"
              style={{ padding:'6px 12px', borderRadius:6, border:'none', cursor:'pointer', background:viewMode==='list' ? 'var(--accent)' : 'transparent', color:viewMode==='list' ? '#fff' : 'var(--text-secondary)', fontSize:16, transition:'all 0.2s' }}>☰</button>
            <button onClick={() => setViewMode('grid')} title="Grid View"
              style={{ padding:'6px 12px', borderRadius:6, border:'none', cursor:'pointer', background:viewMode==='grid' ? 'var(--accent)' : 'transparent', color:viewMode==='grid' ? '#fff' : 'var(--text-secondary)', fontSize:16, transition:'all 0.2s' }}>⊞</button>
          </div>
          <button className="btn btn-primary" onClick={() => setModal({})}>+ Add Client</button>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div style={{ background:'var(--accent-dim)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:8, padding:'10px 16px', marginBottom:12, display:'flex', alignItems:'center', gap:12, fontSize:13 }}>
          <span style={{ color:'var(--accent-light)', fontWeight:600 }}>{selected.length} selected</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Deselect All</button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑️ Delete</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { const emails=clients.filter(c=>selected.includes(c.id)).map(c=>c.contactEmail).filter(Boolean).join(','); window.open(`mailto:${emails}`); }}>✉️ Send Email</button>
        </div>
      )}

      {loading ? <div className="loading"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🏢</div><h3>No clients found</h3><button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => setModal({})}>+ Add Client</button></div>
      ) : viewMode === 'list' ? (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width:40 }}>
                    <input type="checkbox" checked={selected.length===paginated.length && paginated.length>0} onChange={handleSelectAll} style={{ width:16, height:16, accentColor:'var(--accent)', cursor:'pointer' }} />
                  </th>
                  <th>
                    <div>Client Name</div>
                    <input className="form-input" style={{ fontSize:11, padding:'3px 8px', marginTop:4, width:'100%' }} placeholder="Filter by..." value={colFilter.companyName} onChange={e => setColFilter(p=>({...p,companyName:e.target.value}))} />
                  </th>
                  <th>Contact Name</th>
                  <th>
                    <div>Contact Email</div>
                    <input className="form-input" style={{ fontSize:11, padding:'3px 8px', marginTop:4, width:'100%' }} placeholder="Filter..." value={colFilter.contactEmail} onChange={e => setColFilter(p=>({...p,contactEmail:e.target.value}))} />
                  </th>
                  <th>Phone</th>
                  <th>Created Date</th>
                  <th>Website</th>
                  <th>
                    <div>Location</div>
                    <input className="form-input" style={{ fontSize:11, padding:'3px 8px', marginTop:4, width:'100%' }} placeholder="Filter..." value={colFilter.address} onChange={e => setColFilter(p=>({...p,address:e.target.value}))} />
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => (
                  <ClientRow key={c.id} c={c} selected={selected.includes(c.id)} onSelect={handleSelect} onEdit={setModal} onDelete={handleDelete} avatarColor={avatarColor} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, fontSize:13, color:'var(--text-secondary)' }}>
            <div>{(page-1)*pageSize+1}–{Math.min(page*pageSize,filtered.length)} of {filtered.length}</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).map((p,i,arr) => (
                <React.Fragment key={p}>
                  {i>0 && arr[i-1]!==p-1 && <span>...</span>}
                  <button className={`btn btn-sm ${p===page?'btn-primary':'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                </React.Fragment>
              ))}
              <button className="btn btn-secondary btn-sm" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
              <select className="form-input form-select" style={{ width:70, padding:'4px 8px', fontSize:12 }} value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setPage(1); }}>
                {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ fontSize:12 }}>{selected.length} records selected</div>
          </div>
        </>
      ) : (
        // Grid View
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {paginated.map(c => (
            <div key={c.id} className="card" style={{ transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:avatarColor(c.companyName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', flexShrink:0 }}>{c.companyName?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{c.companyName}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.industry||'—'}</div>
                  </div>
                </div>
                <span className={`badge badge-${c.status}`}>{c.status}</span>
              </div>
              {c.contactPerson && <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:3 }}>👤 {c.contactPerson}</div>}
              {c.contactEmail && <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:3 }}>✉️ {c.contactEmail}</div>}
              {c.contactPhone && <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:3 }}>📞 {c.contactPhone}</div>}
              {c.address && <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:3 }}>📍 {c.address}</div>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{c.jobs?.length||0} jobs</span>
                <div style={{ display:'flex', gap:6 }}>
                  {c.contactEmail && <a href={`mailto:${c.contactEmail}`} className="btn btn-ghost btn-sm btn-icon" title="Send Email">✉️</a>}
                  {c.contactPhone && <a href={`tel:${c.contactPhone}`} className="btn btn-ghost btn-sm btn-icon" title="Call">📞</a>}
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(c)}>✏️</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && <ClientModal client={modal?.id ? modal : undefined} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
    </div>
  );
}

// Client Row Component
function ClientRow({ c, selected, onSelect, onEdit, onDelete, avatarColor }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <tr style={{ background: selected ? 'var(--accent-dim)' : undefined }}>
      <td><input type="checkbox" checked={selected} onChange={() => onSelect(c.id)} style={{ width:16, height:16, accentColor:'var(--accent)', cursor:'pointer' }} /></td>
      <td>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:avatarColor(c.companyName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', flexShrink:0 }}>{c.companyName?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight:600, fontSize:13 }}>{c.companyName}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{c.industry||''}</div>
          </div>
        </div>
      </td>
      <td style={{ fontSize:13 }}>{c.contactPerson||'—'}</td>
      <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{c.contactEmail||'—'}</td>
      <td style={{ fontSize:13 }}>{c.contactPhone||'—'}</td>
      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}</td>
      <td style={{ fontSize:12 }}>{c.website ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color:'var(--accent-light)' }}>{c.website.replace('https://','').slice(0,20)}</a> : '—'}</td>
      <td style={{ fontSize:13 }}>{c.address||'—'}</td>
      <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
      <td>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          {c.contactPhone && <a href={`tel:${c.contactPhone}`} className="btn btn-ghost btn-sm btn-icon" title="Call">📞</a>}
          {c.contactEmail && <a href={`mailto:${c.contactEmail}`} className="btn btn-ghost btn-sm btn-icon" title="Email">✉️</a>}
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(c)} title="Edit">✏️</button>
          <div style={{ position:'relative' }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowMenu(!showMenu)}>⋯</button>
            {showMenu && (
              <div style={{ position:'absolute', right:0, top:'100%', background:'var(--bg-surface)', border:'1px solid var(--border-light)', borderRadius:8, zIndex:10, minWidth:150, boxShadow:'var(--shadow)', padding:4 }}
                onMouseLeave={() => setShowMenu(false)}>
                <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', fontSize:13, padding:'8px 12px' }} onClick={() => { onEdit(c); setShowMenu(false); }}>✏️ Edit</button>
                <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', fontSize:13, padding:'8px 12px', color:'var(--red)' }} onClick={() => { onDelete(c.id); setShowMenu(false); }}>🗑️ Delete</button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}