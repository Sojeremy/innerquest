/**
 * Storage - InnerQuest
 * Gestion de la persistance des donn�es (localStorage)
 */

import config from './config.js';
import Player from './player.js';
import { errorHandler, logger } from './utils.js';

export default class Storage {
  constructor() {
    this.saveKey = config.STORAGE.SAVE_KEY;
    this.settingsKey = config.STORAGE.SETTINGS_KEY;
    this.version = config.STORAGE.VERSION;
  }

  /**
   * Sauvegarde l'�tat du joueur
   * @param {Player} player - Instance du joueur
   * @returns {boolean} True si succ�s
   */
  save(player) {
    try {
      const saveData = {
        version: this.version,
        timestamp: Date.now(),
        player: player.serialize()
      };

      localStorage.setItem(this.saveKey, JSON.stringify(saveData));
      logger.log('Game saved successfully');

      // �mettre �v�nement
      window.dispatchEvent(new CustomEvent('storage:saved'));

      return true;
    } catch (error) {
      errorHandler.handle('Failed to save game', error);
      return false;
    }
  }

  /**
   * Charge l'�tat du joueur
   * @returns {string|null} Donn�es du joueur (JSON) ou null si aucune sauvegarde
   */
  load() {
    try {
      const raw = localStorage.getItem(this.saveKey);

      if (!raw) {
        logger.log('No save found');
        return null;
      }

      const saveData = JSON.parse(raw);

      // V�rifier compatibilit� version
      if (saveData.version !== this.version) {
        logger.warn(`Save version mismatch: ${saveData.version} vs ${this.version}`);
        return this.migrate(saveData);
      }

      logger.log('Game loaded successfully');
      return saveData.player;
    } catch (error) {
      errorHandler.handle('Failed to load game', error);
      return null;
    }
  }

  /**
   * V�rifie si une sauvegarde existe
   * @returns {boolean} True si une sauvegarde existe
   */
  hasSave() {
    return localStorage.getItem(this.saveKey) !== null;
  }

  /**
   * Supprime la sauvegarde
   * @returns {boolean} True si succ�s
   */
  deleteSave() {
    try {
      localStorage.removeItem(this.saveKey);
      logger.log('Save deleted');

      // �mettre �v�nement
      window.dispatchEvent(new CustomEvent('storage:deleted'));

      return true;
    } catch (error) {
      errorHandler.handle('Failed to delete save', error);
      return false;
    }
  }

  /**
   * Exporte la sauvegarde vers un fichier JSON t�l�chargeable
   * @param {Player} player - Instance du joueur
   */
  exportSave(player) {
    try {
      const saveData = {
        version: this.version,
        timestamp: Date.now(),
        player: player.serialize(),
        exported: true
      };

      const blob = new Blob([JSON.stringify(saveData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `innerquest-save-day${player.day}-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);

      logger.log('Save exported');

      // �mettre �v�nement
      window.dispatchEvent(new CustomEvent('storage:exported'));

      return true;
    } catch (error) {
      errorHandler.handle('Failed to export save', error);
      return false;
    }
  }

  /**
   * Importe une sauvegarde depuis un fichier JSON
   * @param {File} file - Fichier JSON
   * @returns {Promise<string|null>} Donn�es du joueur ou null si erreur
   */
  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const saveData = JSON.parse(e.target.result);

          // V�rifier structure minimale
          if (!saveData.player) {
            throw new Error('Invalid save file structure');
          }

          // V�rifier version
          if (saveData.version !== this.version) {
            logger.warn('Imported save has different version, attempting migration');
            const migrated = this.migrate(saveData);
            resolve(migrated);
          } else {
            resolve(saveData.player);
          }

          logger.log('Save imported successfully');

          // �mettre �v�nement
          window.dispatchEvent(new CustomEvent('storage:imported'));
        } catch (error) {
          errorHandler.handle('Failed to import save', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        errorHandler.handle('Failed to read file', reader.error);
        reject(reader.error);
      };

      reader.readAsText(file);
    });
  }

  /**
   * Migre une sauvegarde d'une ancienne version
   * @param {Object} oldSave - Ancienne sauvegarde
   * @returns {string} Donn�es migr�es
   */
  migrate(oldSave) {
    logger.warn(`Migrating save from version ${oldSave.version} to ${this.version}`);

    // Pour l'instant, simple passthrough
    // Dans le futur, ajouter logique de migration selon versions
    try {
      const player = Player.deserialize(oldSave.player);

      // Mise � jour de la version
      const migratedSave = {
        version: this.version,
        timestamp: Date.now(),
        player: player.serialize()
      };

      // Sauvegarder la version migr�e
      localStorage.setItem(this.saveKey, JSON.stringify(migratedSave));

      return migratedSave.player;
    } catch (error) {
      errorHandler.handle('Migration failed', error);
      return null;
    }
  }

  /**
   * Sauvegarde les param�tres utilisateur
   * @param {Object} settings - Objet des param�tres
   * @returns {boolean} True si succ�s
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      logger.log('Settings saved');
      return true;
    } catch (error) {
      errorHandler.handle('Failed to save settings', error);
      return false;
    }
  }

  /**
   * Charge les param�tres utilisateur
   * @returns {Object|null} Param�tres ou null
   */
  loadSettings() {
    try {
      const raw = localStorage.getItem(this.settingsKey);
      if (!raw) return null;

      return JSON.parse(raw);
    } catch (error) {
      errorHandler.handle('Failed to load settings', error);
      return null;
    }
  }

  /**
   * R�cup�re les param�tres par d�faut
   * @returns {Object} Param�tres par d�faut
   */
  getDefaultSettings() {
    return {
      locale: config.I18N.DEFAULT_LOCALE,
      theme: config.UI.DEFAULT_THEME,
      fontSize: config.UI.DEFAULT_FONT_SIZE,
      animationsEnabled: config.UI.ANIMATIONS_ENABLED,
      musicEnabled: config.AUDIO.MUSIC_ENABLED,
      sfxEnabled: config.AUDIO.SFX_ENABLED,
      musicVolume: config.AUDIO.DEFAULT_VOLUME,
      sfxVolume: config.AUDIO.DEFAULT_VOLUME,
      highContrast: false,
      reduceMotion: false
    };
  }

  /**
   * Charge les param�tres ou retourne les valeurs par d�faut
   * @returns {Object} Param�tres
   */
  getSettings() {
    const saved = this.loadSettings();
    const defaults = this.getDefaultSettings();

    // Merge saved with defaults (pour nouvelles propri�t�s)
    return saved ? { ...defaults, ...saved } : defaults;
  }

  /**
   * Cr�er une sauvegarde de backup
   * @returns {boolean} True si succ�s
   */
  createBackup() {
    try {
      const saveData = localStorage.getItem(this.saveKey);
      if (saveData) {
        localStorage.setItem(`${this.saveKey}_backup`, saveData);
        logger.log('Backup created');
        return true;
      }
      return false;
    } catch (error) {
      errorHandler.handle('Failed to create backup', error);
      return false;
    }
  }

  /**
   * Restaurer depuis le backup
   * @returns {boolean} True si succ�s
   */
  restoreBackup() {
    try {
      const backup = localStorage.getItem(`${this.saveKey}_backup`);
      if (backup) {
        localStorage.setItem(this.saveKey, backup);
        logger.log('Backup restored');

        // �mettre �v�nement
        window.dispatchEvent(new CustomEvent('storage:backup-restored'));

        return true;
      }
      return false;
    } catch (error) {
      errorHandler.handle('Failed to restore backup', error);
      return false;
    }
  }

  /**
   * Obtient des informations sur la sauvegarde
   * @returns {Object|null} Infos ou null
   */
  getSaveInfo() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return null;

      const saveData = JSON.parse(raw);
      const playerData = typeof saveData.player === 'string'
        ? JSON.parse(saveData.player)
        : saveData.player;

      return {
        version: saveData.version,
        timestamp: saveData.timestamp,
        day: playerData.day,
        phase: playerData.phase,
        globalBalance: (
          (playerData.stats.energie +
            playerData.stats.mental +
            playerData.stats.emotionnel +
            playerData.stats.spiritualite) /
          4
        ).toFixed(1)
      };
    } catch (error) {
      errorHandler.handle('Failed to get save info', error);
      return null;
    }
  }

  /**
   * Efface toutes les donn�es (sauvegarde + settings)
   * @returns {boolean} True si succ�s
   */
  clearAll() {
    try {
      localStorage.removeItem(this.saveKey);
      localStorage.removeItem(this.settingsKey);
      localStorage.removeItem(`${this.saveKey}_backup`);

      logger.log('All data cleared');

      // �mettre �v�nement
      window.dispatchEvent(new CustomEvent('storage:cleared'));

      return true;
    } catch (error) {
      errorHandler.handle('Failed to clear data', error);
      return false;
    }
  }
}
