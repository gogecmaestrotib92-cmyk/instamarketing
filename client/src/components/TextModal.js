import React, { useEffect, useState } from "react";
import { FiType, FiX, FiPlus, FiTrash2, FiClock } from "react-icons/fi";
import "./TextModal.css";

/**
 * TextModal - Modal for adding overlay text and timed captions
 * 
 * Props:
 * - open: boolean - whether modal is open
 * - durationSeconds: number - video duration (for validation)
 * - initialConfig: { overlayText: string, captions: CaptionSegment[] }
 * - onApply: (config) => void
 * - onClose: () => void
 * 
 * CaptionSegment: { id, text, start, end }
 */

const createEmptyConfig = () => ({
  overlayText: "",
  captions: []
});

const TextModal = ({
  open,
  durationSeconds = 60,
  initialConfig,
  onApply,
  onClose
}) => {
  // State
  const [overlayText, setOverlayText] = useState("");
  const [captions, setCaptions] = useState([]);
  const [newText, setNewText] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [error, setError] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      const cfg = initialConfig ?? createEmptyConfig();
      setOverlayText(cfg.overlayText ?? "");
      setCaptions(cfg.captions ?? []);
      setNewText("");
      setNewStart("");
      setNewEnd("");
      setError(null);
    }
  }, [initialConfig, open]);

  if (!open) return null;

  // Formatiranje vremena za prikaz
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return mins > 0 ? `${mins}:${secs.padStart(4, '0')}` : `${secs}s`;
  };

  // Dodavanje novog titla
  const handleAddCaption = () => {
    setError(null);

    if (!newText.trim()) {
      setError("Enter caption text.");
      return;
    }

    const start = parseFloat(newStart);
    const end = parseFloat(newEnd);

    if (isNaN(start) || isNaN(end)) {
      setError("Start and end must be numbers (seconds).");
      return;
    }

    if (start < 0) {
      setError("Start time must be a positive number.");
      return;
    }

    if (end <= start) {
      setError("End time must be greater than start time.");
      return;
    }

    if (durationSeconds && (start > durationSeconds || end > durationSeconds)) {
      setError(`Caption must be within video duration (0–${durationSeconds}s).`);
      return;
    }

    const segment = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: newText.trim(),
      start,
      end
    };

    setCaptions((prev) => [...prev, segment].sort((a, b) => a.start - b.start));
    setNewText("");
    setNewStart("");
    setNewEnd("");
  };

  // Uklanjanje titla
  const handleRemoveCaption = (id) => {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
  };

  // Primena konfiguracije
  const handleApply = () => {
    const config = {
      overlayText: overlayText.trim(),
      captions
    };
    onApply(config);
    onClose();
  };

  // Ukloni sve
  const handleRemoveAll = () => {
    onApply(null);
    onClose();
  };

  const hasContent = overlayText.trim() || captions.length > 0;

  // Keyboard handler za Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCaption();
    }
  };

  return (
    <div className="text-modal__overlay" onClick={onClose}>
      <div className="text-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="text-modal__header">
          <div className="text-modal__title-row">
            <span className="text-modal__icon">
              <FiType />
            </span>
            <h2 className="text-modal__title">Add Text and Captions</h2>
          </div>
          <button
            type="button"
            className="text-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </header>

        {/* Overlay tekst sekcija */}
        <section className="text-modal__section">
          <h3 className="text-modal__section-title">
            Overlay text (displayed throughout entire video)
          </h3>
          <textarea
            className="text-modal__textarea"
            placeholder="Enter text to display on video..."
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            rows={3}
          />
        </section>

        {/* Divider */}
        <div className="text-modal__divider">
          <span>Timed captions</span>
        </div>

        {/* Form za novi titl */}
        <section className="text-modal__section">
          <div className="text-modal__row">
            <div className="text-modal__field text-modal__field--wide">
              <label className="text-modal__label">Caption text</label>
              <input
                className="text-modal__input"
                placeholder="Enter caption text..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="text-modal__field text-modal__field--small">
              <label className="text-modal__label">
                <FiClock size={12} /> Start (sek)
              </label>
              <input
                className="text-modal__input"
                type="number"
                min={0}
                step={0.1}
                placeholder="0"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="text-modal__field text-modal__field--small">
              <label className="text-modal__label">
                <FiClock size={12} /> End (sek)
              </label>
              <input
                className="text-modal__input"
                type="number"
                min={0}
                step={0.1}
                placeholder="3"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="text-modal__field text-modal__field--button">
              <button
                type="button"
                className="text-modal__add-btn"
                onClick={handleAddCaption}
              >
                <FiPlus /> Add
              </button>
            </div>
          </div>

          {error && <p className="text-modal__error">{error}</p>}
        </section>

        {/* Lista titlova */}
        <section className="text-modal__section text-modal__captions-section">
          <div className="text-modal__captions-header">
            <h3 className="text-modal__section-title">
              Titlovi ({captions.length})
            </h3>
          </div>

          {captions.length === 0 ? (
            <div className="text-modal__empty">
              <FiType className="text-modal__empty-icon" />
              <p>No captions added yet</p>
              <p className="text-modal__empty-hint">
                Add captions with time stamps above
              </p>
            </div>
          ) : (
            <ul className="text-modal__captions-list">
              {captions.map((c) => (
                <li key={c.id} className="text-modal__caption-item">
                  <div className="text-modal__caption-main">
                    <span className="text-modal__caption-text">{c.text}</span>
                    <span className="text-modal__caption-time">
                      {formatTime(c.start)} → {formatTime(c.end)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-modal__caption-remove"
                    onClick={() => handleRemoveCaption(c.id)}
                    aria-label="Remove caption"
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer */}
        <footer className="text-modal__footer">
          <button
            type="button"
            className="text-modal__btn text-modal__btn--danger"
            onClick={handleRemoveAll}
          >
            Remove all
          </button>
          <div className="text-modal__footer-right">
            <button
              type="button"
              className="text-modal__btn text-modal__btn--ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="text-modal__btn text-modal__btn--primary"
              onClick={handleApply}
              disabled={!hasContent}
            >
              ✓ Apply
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TextModal;
