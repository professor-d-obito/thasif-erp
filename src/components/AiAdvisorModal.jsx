import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Package, 
  Users, 
  X 
} from 'lucide-react';
import { playChime, playSuccess } from '../utils/audio';

export default function AiAdvisorModal({ 
  isOpen, 
  onClose, 
  inventory, 
  invoices, 
  transactions, 
  operatives, 
  tasks, 
  companyConfig 
}) {
  const [messages, setMessages] = useState([
    {
      sender: 'kiri',
      text: `Greetings, Supreme Mastermind ${companyConfig.leader}! I am Kiri-AI, your Tactical Shinobi Advisor. All dimensional nodes are calibrated. How can I assist with ERP intelligence today?`
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const handleQuery = (queryType) => {
    playChime();
    let responseText = '';

    if (queryType === 'inventory') {
      const lowStock = inventory.filter(i => i.stock <= i.reorderLevel);
      const totalVal = inventory.reduce((acc, curr) => acc + (curr.stock * curr.sellingPrice), 0);
      if (lowStock.length > 0) {
        responseText = `⚠️ Armory Alert: You have ${lowStock.length} items below safety thresholds (${lowStock.map(i => i.name).join(', ')}). Total armory valuation is ${companyConfig.currency}${totalVal.toLocaleString('en-US')}. I recommend immediate restocking!`;
      } else {
        responseText = `✅ Armory is fully stocked! All ${inventory.length} SKUs exceed minimum safety margins. Total valuation: ${companyConfig.currency}${totalVal.toLocaleString('en-US')}.`;
      }
    } else if (queryType === 'finance') {
      const income = transactions.filter(t => t.type === 'Income').reduce((a, b) => a + b.amount, 0);
      const expense = transactions.filter(t => t.type === 'Expense').reduce((a, b) => a + b.amount, 0);
      const surplus = income - expense;
      responseText = `📊 Treasury Telemetry: Total inflow is ${companyConfig.currency}${income.toFixed(2)} with operational outflow at ${companyConfig.currency}${expense.toFixed(2)}. Net dimensional surplus stands at ${companyConfig.currency}${surplus.toFixed(2)} (${income > 0 ? ((surplus/income)*100).toFixed(1) : 0}% margin). Capital reserves are optimal!`;
    } else if (queryType === 'invoices') {
      const pending = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue');
      const pendingSum = pending.reduce((a, b) => a + b.total, 0);
      responseText = `🧾 Billing Dispatch: You have ${pending.length} pending receivables totaling ${companyConfig.currency}${pendingSum.toFixed(2)}. The largest outstanding invoice is for ${pending[0]?.client || 'N/A'}.`;
    } else if (queryType === 'operatives') {
      const onMission = operatives.filter(o => o.status === 'On Mission').length;
      responseText = `🥷 Operative Readiness: ${operatives.length} elite specialists enlisted. ${onMission} currently deployed on high-priority field missions. Zero security breaches detected in Kamui sector!`;
    }

    setMessages(prev => [
      ...prev,
      { sender: 'user', text: `Run ${queryType} diagnostics.` },
      { sender: 'kiri', text: responseText }
    ]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    playSuccess();

    const userQ = inputVal.trim();
    setInputVal('');

    let aiReply = `Understood, Mastermind ${companyConfig.leader}. Processing directive regarding: "${userQ}". Current telemetry confirms all subsystems within optimal parameters.`;

    const lower = userQ.toLowerCase();
    if (lower.includes('stock') || lower.includes('inventory') || lower.includes('armory')) {
      const low = inventory.filter(i => i.stock <= i.reorderLevel);
      aiReply = `Armory contains ${inventory.length} active SKUs with ${low.length} items flagged for restock. Would you like me to prepare purchase orders?`;
    } else if (lower.includes('money') || lower.includes('cash') || lower.includes('finance') || lower.includes('treasury')) {
      const income = transactions.filter(t => t.type === 'Income').reduce((a, b) => a + b.amount, 0);
      aiReply = `Treasury reports a gross inflow of ${companyConfig.currency}${income.toLocaleString('en-US')}. Vault Alpha liquidity is secure.`;
    } else if (lower.includes('obito') || lower.includes('professor') || lower.includes('kamui')) {
      aiReply = `Professor D Obito's Crimson Protocol is active with 100% quantum synchronization. The Kamui dimension stands ready.`;
    }

    setMessages(prev => [
      ...prev,
      { sender: 'user', text: userQ },
      { sender: 'kiri', text: aiReply }
    ]);
  };

  return (
    <div className="modal-overlay" id="ai-advisor-modal" style={{ zIndex: 120 }}>
      <div className="modal-content" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', height: 'min(620px, 88vh)', maxHeight: '88vh' }}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src="/anime/ai_advisor.jpg" 
              alt="Kiri AI Mascot" 
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: '#ffffff' }}>
                  Kiri-AI Tactical Advisor
                </h3>
                <span className="status-badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', fontSize: '10px' }}>
                  ONLINE
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Neural companion for {companyConfig.leader}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Quick query buttons */}
        <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6, overflowX: 'auto' }}>
          <button 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
            onClick={() => handleQuery('inventory')}
          >
            <Package size={12} /> Armory Health
          </button>
          <button 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
            onClick={() => handleQuery('finance')}
          >
            <TrendingUp size={12} /> Treasury Status
          </button>
          <button 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
            onClick={() => handleQuery('invoices')}
          >
            🧾 Receivables
          </button>
          <button 
            className="btn-secondary" 
            style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
            onClick={() => handleQuery('operatives')}
          >
            <Users size={12} /> Clan Readout
          </button>
        </div>

        {/* Chat message stream */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, idx) => {
            const isKiri = msg.sender === 'kiri';

            return (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignSelf: isKiri ? 'flex-start' : 'flex-end',
                  maxWidth: '85%'
                }}
              >
                {isKiri && (
                  <img 
                    src="/anime/ai_advisor.jpg" 
                    alt="Kiri" 
                    style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', marginTop: 2 }}
                  />
                )}
                <div style={{
                  background: isKiri ? 'var(--bg-input)' : 'linear-gradient(135deg, var(--accent-crimson) 0%, var(--accent-crimson-dark) 100%)',
                  color: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isKiri ? '1px solid var(--border-subtle)' : 'none',
                  fontSize: '13px',
                  lineHeight: 1.45,
                  boxShadow: isKiri ? 'none' : '0 2px 10px var(--accent-crimson-glow)'
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
          <input 
            type="text" 
            placeholder="Ask Kiri-AI about inventory, revenue, missions..." 
            className="form-control"
            style={{ flex: 1 }}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn-primary"
            style={{ padding: '0 16px' }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
