import React, { useState, useEffect } from 'react';
import { FileText, Send, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { createNote as createNoteAPI, sendNote as sendNoteAPI } from '../../services/devNoteService';
import styles from './FloatingNoteButton.module.css';

/**
 * FloatingNoteButton - Quick access to dev notes from any page
 * Only visible to super admins (eli@skyfiresd.com, logan@skyfiresd.com)
 * Draggable modal for capturing bugs/ideas without leaving current page
 */
const FloatingNoteButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [position, setPosition] = useState({
    x: window.innerWidth - 550,
    y: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const generateNoteTitle = (content) => {
    if (!content || !content.trim()) {
      return `Dev Note - ${new Date().toLocaleString()}`;
    }
    const firstLine = content.trim().split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  };

  const handleSend = async () => {
    if (!noteContent.trim()) {
      toast.error('Note content is required');
      return;
    }

    try {
      setIsSending(true);

      // Create note with auto-generated title
      const autoTitle = generateNoteTitle(noteContent);
      const createResponse = await createNoteAPI({
        title: autoTitle,
        content: noteContent,
      });

      if (createResponse.status === 'SUCCESS') {
        const noteId = createResponse.data.id;
        console.log('[FloatingNoteButton] Note created with ID:', noteId);

        // Send note immediately
        const sendResponse = await sendNoteAPI(noteId);
        console.log('[FloatingNoteButton] Send response:', sendResponse);

        if (sendResponse.status === 'SUCCESS') {
          // Clear and close
          setNoteContent('');
          setIsOpen(false);

          toast.success('Note sent successfully');
        } else {
          console.error('[FloatingNoteButton] Send failed:', sendResponse);
          toast.error('Failed to send note: ' + (sendResponse.message || 'Unknown error'));
        }
      } else {
        console.error('[FloatingNoteButton] Create failed:', createResponse);
        toast.error('Failed to create note: ' + (createResponse.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to send note:', error);
      toast.error('Failed to send note');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend();
    }
    // Close on Escape
    if (e.key === 'Escape') {
      setIsOpen(false);
      setNoteContent('');
    }
  };

  const handleMouseDown = (e) => {
    // Start dragging from anywhere in the modal
    if (e.target.classList.contains(styles.floatingModal) ||
        e.target.classList.contains(styles.floatingTextarea)) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          className={styles.floatingNoteButton}
          onClick={() => setIsOpen(true)}
          title="Quick Dev Note"
        >
          <FileText size={24} />
        </button>
      )}

      {/* Draggable Modal */}
      {isOpen && (
        <div
          className={styles.floatingModal}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
        >
          <button
            className={styles.closeButton}
            onClick={() => {
              setIsOpen(false);
              setNoteContent('');
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Close"
          >
            <X size={18} />
          </button>

          <textarea
            className={styles.floatingTextarea}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe bug, feature, or idea..."
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
          />

          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={isSending || !noteContent.trim()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send size={16} />
                Send
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default FloatingNoteButton;
