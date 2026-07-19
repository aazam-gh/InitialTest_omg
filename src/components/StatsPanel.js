import React from 'react';
import './StatsPanel.css';

const StatsPanel = ({ stats, account, onMine }) => {
  if (!stats) return null;

  return (
    <section className="stats-panel" aria-labelledby="chain-stats-title">
      <div className="panel-heading"><span className="eyebrow">Network overview</span><h2 id="chain-stats-title" className="panel-title">Blockchain stats</h2></div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Chain Length</div>
          <div className="stat-value">{stats.chainLength}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Pending tx</div>
          <div className="stat-value">{stats.pendingTransactions}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Difficulty</div>
          <div className="stat-value">{stats.difficulty}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-label">Mining Reward</div>
          <div className="stat-value">{stats.miningReward}</div>
        </div>
        
        <div className={`stat-item status ${stats.isValid ? 'is-valid' : 'is-invalid'}`}>
          <div className="stat-label">Chain status</div>
          <div className={`stat-value ${stats.isValid ? 'valid' : 'invalid'}`}>
            <span aria-hidden="true">{stats.isValid ? '●' : '●'}</span> {stats.isValid ? 'Valid' : 'Invalid'}
          </div>
        </div>
        {account && <>
          <div className="stat-item"><div className="stat-label">Confirmed balance</div><div className="stat-value">{account.confirmedBalance}</div></div>
          <div className="stat-item"><div className="stat-label">Available balance</div><div className="stat-value">{account.availableBalance}</div></div>
        </>}
      </div>
      
      <button className="mine-button" onClick={onMine}>
        <span aria-hidden="true">⚒</span> Mine block
      </button>
      <p className="mine-note">Rewards go to the selected local wallet.</p>
    </section>
  );
};

export default StatsPanel;
