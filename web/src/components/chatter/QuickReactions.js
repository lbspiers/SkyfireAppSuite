import React, { useState, useRef } from 'react';
import { Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import styles from './QuickReactions.module.css';

/**
 * QuickReactions - Quick reaction bar with common emojis + picker
 *
 * @param {function} onReact - Callback when emoji is selected (emoji) => void
 * @param {array} userReactions - Array of emojis the current user has already reacted with
 * @param {string} size - 'sm' | 'md' - Size variant
 */
const QuickReactions = ({ onReact, userReactions = [], size = 'md' }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerButtonRef = useRef(null);

  // Common quick reactions
  const quickEmojis = ['👍', '❤️', '😂', '🎉', '😮', '😢'];

  const handleQuickReact = (emoji) => {
    onReact(emoji);
  };

  const handleEmojiSelect = (emoji) => {
    onReact(emoji);
  };

  const isUserReacted = (emoji) => {
    return userReactions.includes(emoji);
  };

  return (
    <div className={`${styles.quickReactionsContainer} ${styles[`size-${size}`]}`}>
      {/* Quick Emoji Buttons */}
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          className={`${styles.quickReactionBtn} ${isUserReacted(emoji) ? styles.quickReactionBtnActive : ''}`}
          onClick={() => handleQuickReact(emoji)}
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {/* Emoji Picker Button */}
      <button
        ref={pickerButtonRef}
        className={styles.emojiPickerBtn}
        onClick={() => setShowPicker(!showPicker)}
        title="More reactions"
      >
        <Smile size={size === 'sm' ? 14 : 16} />
      </button>

      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onEmojiSelect={handleEmojiSelect}
        anchorRef={pickerButtonRef}
      />
    </div>
  );
};

export default QuickReactions;
