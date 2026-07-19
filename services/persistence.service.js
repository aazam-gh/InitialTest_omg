const fs = require('fs/promises');
const path = require('path');
const { Blockchain } = require('../models/blockchain');

class PersistenceService {
  /**
   * Persist versioned blockchain snapshots using serialized atomic writes.
   *
   * @param {string} statePath file used to restore and save ledger state
   */
  constructor(statePath) {
    this.statePath = statePath;
    this.writeQueue = Promise.resolve();
  }

  /**
   * Restore and fully validate the saved ledger, preserving invalid input under
   * a diagnostic backup name instead of silently replacing it.
   *
   * @returns {Promise<Blockchain|null>} restored chain or null when no state exists
   */
  async load() {
    try {
      const raw = await fs.readFile(this.statePath, 'utf8');
      return Blockchain.fromJSON(JSON.parse(raw));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      const backupPath = `${this.statePath}.invalid-${Date.now()}.json`;
      try { await fs.rename(this.statePath, backupPath); } catch { /* preserve original error */ }
      throw new Error(`Blockchain state could not be restored: ${error.message}`);
    }
  }

  /**
   * Queue an atomic snapshot write so concurrent mutations cannot interleave.
   *
   * @param {Blockchain} blockchain canonical ledger to serialize
   * @returns {Promise<void>} completion of this queued write
   */
  save(blockchain) {
    const payload = JSON.stringify(blockchain.toJSON(), null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.statePath), { recursive: true });
      const temporaryPath = `${this.statePath}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(temporaryPath, payload, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(temporaryPath, this.statePath);
    });
    return this.writeQueue;
  }
}

module.exports = { PersistenceService };
