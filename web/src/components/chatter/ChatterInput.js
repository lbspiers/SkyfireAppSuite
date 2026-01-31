import React, { useState, useRef, useEffect } from 'react';
import logger from '../../services/devLogger';
import RichTextEditor from './RichTextEditor';
import { SendButton } from '../ui';
import styles from '../../styles/Chatter.module.css';
import * as chatterService from '../../services/chatterService';
import documentService from '../../services/documentService';
import { Paperclip, X } from 'lucide-react';

/**
 * ChatterInput - Message composition with @mention support
 *
 * @param {string} projectUuid - The project UUID
 * @param {function} onSend - Callback function when message is sent
 * @param {string} placeholder - Input placeholder text
 * @param {object} replyingTo - Message being replied to (if any)
 * @param {function} onCancelReply - Callback to cancel reply
 * @param {function} onCancel - Callback to cancel new thread creation
 */
const ChatterInput = ({
  projectUuid,
  onSend,
  placeholder = 'Write a note... (@ to mention)',
  replyingTo = null,
  onCancelReply,
  onCancel,
}) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [mentions, setMentions] = useState([]);
  const [users, setUsers] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch mentionable users for this project
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('[ChatterInput] Fetching mentionable users for project:', projectUuid);
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const currentUserUuid = userData.uuid;

        // Fetch project-based mentionable users (includes team + Skyfire admins)
        const mentionableUsers = await chatterService.getMentionableUsers(projectUuid);
        console.log('[ChatterInput] Fetched mentionable users:', mentionableUsers);

        // Create current user object with isSelf flag
        const currentUser = mentionableUsers.find(u => u.uuid === currentUserUuid);
        if (currentUser) {
          currentUser.isSelf = true;
        }

        // Filter out current user from the list to avoid duplicates
        const otherUsers = mentionableUsers.filter(u => u.uuid !== currentUserUuid);

        // Sort users: Skyfire admins first, then alphabetically
        const sortedUsers = otherUsers.sort((a, b) => {
          // Skyfire admins first
          if (a.isSkyfireAdmin && !b.isSkyfireAdmin) return -1;
          if (!a.isSkyfireAdmin && b.isSkyfireAdmin) return 1;

          // Then alphabetically by first name
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });

        // Place current user at top of list
        const finalUsers = currentUser
          ? [currentUser, ...sortedUsers]
          : sortedUsers;

        console.log('[ChatterInput] Final users list:', finalUsers);
        setUsers(finalUsers);
      } catch (error) {
        console.error('[ChatterInput] Failed to fetch users:', error);
        logger.error('ChatterInput', 'Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, [projectUuid]);

  // Handle editor content changes
  const handleEditorChange = (html, text) => {
    setHtmlContent(html);
    setTextContent(text);

    // Extract mentions from text (simple @Name pattern detection)
    const mentionPattern = /@([A-Z][a-z]+ [A-Z][a-z]+)/g;
    const extractedMentions = [];
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
      const fullName = match[1];
      const user = users.find(u => `${u.firstName} ${u.lastName}` === fullName);
      if (user && !extractedMentions.find(m => m.uuid === user.uuid)) {
        extractedMentions.push({ uuid: user.uuid, name: fullName });
      }
    }

    setMentions(extractedMentions);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadedAttachments = [];

      for (const file of files) {
        logger.log('ChatterInput', 'Uploading file:', file.name);
        const result = await documentService.documents.upload(
          projectUuid,
          file,
          { documentType: 'chatter' } // Document type for chatter attachments
        );

        // Result is the document object directly from documentsApi
        if (result && result.id) {
          uploadedAttachments.push({
            id: result.id,
            fileName: result.file_name || result.fileName || file.name,
            url: result.url,
            mimeType: result.mime_type || result.mimeType || file.type,
            fileSize: result.file_size || result.fileSize || file.size
          });
        }
      }

      setAttachments(prev => [...prev, ...uploadedAttachments]);
      logger.log('ChatterInput', 'Files uploaded successfully:', uploadedAttachments);
    } catch (error) {
      logger.error('ChatterInput', 'Failed to upload files:', error);
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSend = async () => {
    if (!textContent.trim() && attachments.length === 0) return;

    try {
      // Send the HTML content as the message content
      await onSend(htmlContent, mentions, attachments);

      // Clear editor
      editorRef.current?.clear();
      setHtmlContent('');
      setTextContent('');
      setMentions([]);
      setAttachments([]);

      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      logger.error('Chatter', 'Failed to send message:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Prepare mention suggestions for TipTap
  const mentionSuggestions = users.map(user => ({
    id: user.uuid,
    name: `${user.firstName} ${user.lastName}`,
    role: user.isSkyfireAdmin ? 'Skyfire Admin' : user.role || 'Team Member'
  }));
  console.log('[ChatterInput] Prepared mention suggestions:', mentionSuggestions);

  return (
    <div className={styles.chatterInputContainer}>
      {replyingTo && (
        <div className={styles.replyingTo}>
          <span>Replying to {replyingTo.user.firstName}...</span>
          <button
            onClick={onCancelReply}
            className={styles.replyingToCancelBtn}
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className={styles.attachmentChips}>
          {attachments.map(attachment => (
            <div key={attachment.id} className={styles.attachmentChip}>
              <Paperclip size={12} />
              <span className={styles.attachmentChipName}>{attachment.fileName}</span>
              <span className={styles.attachmentChipSize}>({formatFileSize(attachment.fileSize)})</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(attachment.id)}
                className={styles.attachmentChipRemove}
                title="Remove attachment"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rich Text Editor */}
      <RichTextEditor
        ref={editorRef}
        content={htmlContent}
        onChange={handleEditorChange}
        onSubmit={handleSend}
        placeholder={placeholder}
        maxLength={10000}
        disabled={uploadingFiles}
        mentionSuggestions={mentionSuggestions}
        onAttachmentClick={() => fileInputRef.current?.click()}
        uploadingFiles={uploadingFiles}
        onCancel={onCancel}
      />

      {/* File attachment input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {/* Send button row below editor */}
      <div className={styles.chatterInputSendRow}>
        <SendButton
          onClick={handleSend}
          disabled={(!textContent.trim() && attachments.length === 0) || uploadingFiles}
          compact={true}
        />
      </div>
    </div>
  );
};

export default ChatterInput;
