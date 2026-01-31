import React, { useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import styles from './EmojiPicker.module.css';

/**
 * EmojiPicker - Emoji picker dropdown using emoji-mart
 *
 * @param {boolean} isOpen - Whether the picker is visible
 * @param {function} onClose - Callback to close the picker
 * @param {function} onEmojiSelect - Callback when emoji is selected (emoji) => void
 * @param {object} anchorRef - Ref to the element the picker should position relative to
 */
const EmojiPicker = ({ isOpen, onClose, onEmojiSelect, anchorRef }) => {
  const pickerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiSelect = (emoji) => {
    onEmojiSelect(emoji.native);
    onClose();
  };

  return (
    <div ref={pickerRef} className={styles.emojiPickerContainer}>
      <Picker
        data={data}
        onEmojiSelect={handleEmojiSelect}
        theme="dark"
        previewPosition="none"
        skinTonePosition="search"
        set="native"
        perLine={8}
        maxFrequentRows={2}
      />
    </div>
  );
};

export default EmojiPicker;
