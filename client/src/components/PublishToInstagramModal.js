import React, { useState, useEffect } from 'react';
import { FiInstagram, FiCalendar, FiX, FiSend, FiLoader, FiHash, FiAlertCircle } from 'react-icons/fi';
import './PublishToInstagramModal.css';

/**
 * PublishToInstagramModal Component
 * Modal for publishing or scheduling video to Instagram
 * 
 * @param {boolean} open - Whether modal is open
 * @param {"now" | "schedule"} mode - Publish now or schedule
 * @param {Object} video - The video to publish
 * @param {Array} accounts - Available Instagram accounts
 * @param {Function} onClose - Close handler
 * @param {Function} onSubmit - Submit handler (receives payload)
 */
const PublishToInstagramModal = ({
  open,
  mode,
  video,
  accounts = [],
  onClose,
  onSubmit,
}) => {
  const [accountId, setAccountId] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setCaption('');
      setHashtagsInput('#ai #reels #viral');
      setScheduledAt('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, accounts]);

  if (!open || !video) return null;

  // Parse hashtags from input string
  const parseHashtags = (input) => {
    return input
      .split(/[\s,]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag.slice(1) : tag);
  };

  // Validate form
  const validate = () => {
    if (!accountId) {
      setError('Izaberite Instagram nalog');
      return false;
    }
    if (!caption.trim() || caption.trim().length < 3) {
      setError('Caption mora imati najmanje 3 karaktera');
      return false;
    }
    if (mode === 'schedule' && !scheduledAt) {
      setError('Izaberite datum i vreme za zakazivanje');
      return false;
    }
    if (mode === 'schedule') {
      const selectedDate = new Date(scheduledAt);
      const now = new Date();
      if (selectedDate <= now) {
        setError('Datum zakazivanja mora biti u budućnosti');
        return false;
      }
    }
    return true;
  };

  // Handle form submit
  const handleSubmit = async () => {
    setError(null);

    if (!validate()) return;

    const payload = {
      videoId: video.id,
      videoUrl: video.videoUrl,
      accountId,
      caption: caption.trim(),
      hashtags: parseHashtags(hashtagsInput),
      mode,
      ...(mode === 'schedule' && { scheduledAt: new Date(scheduledAt).toISOString() }),
    };

    setSubmitting(true);

    try {
      await onSubmit(payload);
      // Success - modal will be closed by parent
    } catch (err) {
      setError(err.message || 'Greška pri slanju na Instagram');
      setSubmitting(false);
    }
  };

  // Get minimum datetime for scheduler (now + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="publish-modal-overlay" onClick={onClose}>
      <div className="publish-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="publish-modal__header">
          <div className="publish-modal__title">
            {mode === 'now' ? (
              <>
                <FiInstagram className="publish-modal__icon publish-modal__icon--instagram" />
                Objavi na Instagram odmah
              </>
            ) : (
              <>
                <FiCalendar className="publish-modal__icon publish-modal__icon--schedule" />
                Zakaži objavu na Instagramu
              </>
            )}
          </div>
          <button className="publish-modal__close" onClick={onClose} disabled={submitting}>
            <FiX />
          </button>
        </div>

        {/* Video Info */}
        <div className="publish-modal__video-info">
          <div className="publish-modal__video-thumb">
            <video src={video.videoUrl} muted />
          </div>
          <div className="publish-modal__video-meta">
            <div className="publish-modal__video-title">{video.title || 'AI Video'}</div>
            <div className="publish-modal__video-duration">{video.durationSeconds || 5}s • {video.createdAt}</div>
          </div>
        </div>

        {/* Form */}
        <div className="publish-modal__form">
          {/* Account Select */}
          <div className="publish-modal__field">
            <label className="publish-modal__label">
              <FiInstagram /> Instagram Nalog
            </label>
            {accounts.length > 0 ? (
              <select
                className="publish-modal__select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={submitting}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    @{acc.username} - {acc.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="publish-modal__no-accounts">
                <FiAlertCircle /> Nema povezanih Instagram naloga.
                <a href="/settings" className="publish-modal__link">Povežite nalog</a>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="publish-modal__field">
            <label className="publish-modal__label">
              Caption
            </label>
            <textarea
              className="publish-modal__textarea"
              placeholder="Napišite opis za vaš Reel..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              maxLength={2200}
              disabled={submitting}
            />
            <div className="publish-modal__char-count">
              {caption.length} / 2200
            </div>
          </div>

          {/* Hashtags */}
          <div className="publish-modal__field">
            <label className="publish-modal__label">
              <FiHash /> Hashtags
            </label>
            <input
              type="text"
              className="publish-modal__input"
              placeholder="#ai #reels #viral #instagram"
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              disabled={submitting}
            />
            <div className="publish-modal__hint">
              Odvojite hashtagove razmakom ili zarezom
            </div>
          </div>

          {/* Schedule Date/Time */}
          {mode === 'schedule' && (
            <div className="publish-modal__field">
              <label className="publish-modal__label">
                <FiCalendar /> Datum i vreme objave
              </label>
              <input
                type="datetime-local"
                className="publish-modal__input"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={getMinDateTime()}
                disabled={submitting}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="publish-modal__error">
              <FiAlertCircle /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="publish-modal__footer">
          <button
            className="publish-modal__btn publish-modal__btn--cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Otkaži
          </button>
          <button
            className="publish-modal__btn publish-modal__btn--submit"
            onClick={handleSubmit}
            disabled={submitting || accounts.length === 0}
          >
            {submitting ? (
              <>
                <FiLoader className="publish-modal__spinner" />
                {mode === 'now' ? 'Objavljujem...' : 'Zakažujem...'}
              </>
            ) : (
              <>
                <FiSend />
                {mode === 'now' ? 'Objavi odmah' : 'Zakaži objavu'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishToInstagramModal;
