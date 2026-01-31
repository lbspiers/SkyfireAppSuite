import React, { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { useEditor, EditorContent, TiptapBubbleMenu as BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  LinkIcon,
  Undo,
  Redo,
  Paperclip,
  X
} from 'lucide-react';
import styles from '../../styles/Chatter.module.css';

// Create lowlight instance
const lowlight = createLowlight();

const RichTextEditor = forwardRef(({
  content = '',
  onChange,
  onSubmit,
  placeholder = 'Type your message...',
  maxLength = 10000,
  disabled = false,
  mentionSuggestions = [],
  onAttachmentClick,
  uploadingFiles = false,
  onCancel
}, ref) => {
  // Use a ref to track current mention suggestions
  // This ensures the Mention extension always has the latest value
  const mentionSuggestionsRef = useRef(mentionSuggestions);

  // Keep ref updated when prop changes
  useEffect(() => {
    mentionSuggestionsRef.current = mentionSuggestions;
    console.log('[RichTextEditor] Updated mentionSuggestionsRef:', mentionSuggestions);
  }, [mentionSuggestions]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
        // Disable Link from StarterKit since we configure it separately below
        link: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: styles.editorLink,
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: styles.editorMention,
        },
        suggestion: {
          items: ({ query }) => {
            // Read from ref to get the latest suggestions
            const suggestions = mentionSuggestionsRef.current || [];
            console.log('[RichTextEditor] Mention triggered with query:', query);
            console.log('[RichTextEditor] Available suggestions from ref:', suggestions);
            const filtered = suggestions
              .filter(user => user.name.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5);
            console.log('[RichTextEditor] Filtered results:', filtered);
            return filtered;
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: props => {
                component = document.createElement('div');
                component.className = styles.mentionList;
                component.style.position = 'fixed';
                component.style.zIndex = '1000';

                if (props.items.length === 0) {
                  const emptyMsg = document.createElement('div');
                  emptyMsg.className = styles.mentionItem;
                  emptyMsg.textContent = 'No users found';
                  emptyMsg.style.opacity = '0.6';
                  emptyMsg.style.cursor = 'default';
                  component.appendChild(emptyMsg);
                } else {
                  props.items.forEach((item, index) => {
                    const button = document.createElement('button');
                    button.className = styles.mentionItem;
                    button.innerHTML = `<div>${item.name}</div><div style="font-size: 0.75rem; opacity: 0.7;">${item.role || 'Team Member'}</div>`;
                    button.onclick = () => props.command({ id: item.id, label: item.name });
                    if (index === props.selectedIndex) {
                      button.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                    component.appendChild(button);
                  });
                }

                document.body.appendChild(component);
                popup = component;

                // Position the dropdown above the cursor
                const { clientRect } = props;
                if (clientRect) {
                  const rect = clientRect();
                  const dropdownHeight = component.offsetHeight;
                  // Position above the text, with some margin
                  component.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                  component.style.left = `${rect.left}px`;
                  component.style.top = 'auto';
                }
              },
              onUpdate(props) {
                if (!component) return;

                component.innerHTML = '';

                if (props.items.length === 0) {
                  const emptyMsg = document.createElement('div');
                  emptyMsg.className = styles.mentionItem;
                  emptyMsg.textContent = 'No users found';
                  emptyMsg.style.opacity = '0.6';
                  emptyMsg.style.cursor = 'default';
                  component.appendChild(emptyMsg);
                } else {
                  props.items.forEach((item, index) => {
                    const button = document.createElement('button');
                    button.className = styles.mentionItem;
                    button.innerHTML = `<div>${item.name}</div><div style="font-size: 0.75rem; opacity: 0.7;">${item.role || 'Team Member'}</div>`;
                    button.onclick = () => props.command({ id: item.id, label: item.name });
                    if (index === props.selectedIndex) {
                      button.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                    component.appendChild(button);
                  });
                }

                // Update position - position above the text
                const { clientRect } = props;
                if (clientRect) {
                  const rect = clientRect();
                  const dropdownHeight = component.offsetHeight;
                  // Position above the text, with some margin
                  component.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                  component.style.left = `${rect.left}px`;
                  component.style.top = 'auto';
                }
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  if (popup) {
                    popup.remove();
                    popup = null;
                  }
                  return true;
                }
                return false;
              },
              onExit() {
                if (popup) {
                  popup.remove();
                  popup = null;
                }
              },
            };
          },
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: styles.editorCodeBlock,
        },
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      if (onChange) {
        onChange(html, text);
      }
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
      handleKeyDown: (view, event) => {
        // Submit on Ctrl+Enter or Cmd+Enter
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          if (onSubmit) {
            onSubmit();
          }
          return true;
        }
        return false;
      },
    },
  });

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() || '',
    getText: () => editor?.getText() || '',
    clear: () => editor?.commands.clearContent(),
    focus: () => editor?.commands.focus(),
    setContent: (content) => editor?.commands.setContent(content),
  }));

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const charCount = editor.getText().length;
  const isOverLimit = charCount > maxLength;

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className={styles.richTextEditor}>
      {/* Toolbar */}
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.toolbarButtonActive : ''}`}
            title="Bold (Ctrl+B)"
            disabled={disabled}
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.toolbarButtonActive : ''}`}
            title="Italic (Ctrl+I)"
            disabled={disabled}
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`${styles.toolbarButton} ${editor.isActive('strike') ? styles.toolbarButtonActive : ''}`}
            title="Strikethrough"
            disabled={disabled}
          >
            <Strikethrough size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`${styles.toolbarButton} ${editor.isActive('code') ? styles.toolbarButtonActive : ''}`}
            title="Inline Code"
            disabled={disabled}
          >
            <Code size={16} />
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.toolbarButtonActive : ''}`}
            title="Bullet List"
            disabled={disabled}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.toolbarButtonActive : ''}`}
            title="Numbered List"
            disabled={disabled}
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${styles.toolbarButton} ${editor.isActive('blockquote') ? styles.toolbarButtonActive : ''}`}
            title="Blockquote"
            disabled={disabled}
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`${styles.toolbarButton} ${editor.isActive('codeBlock') ? styles.toolbarButtonActive : ''}`}
            title="Code Block"
            disabled={disabled}
          >
            <Code size={16} />
          </button>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={toggleLink}
            className={`${styles.toolbarButton} ${editor.isActive('link') ? styles.toolbarButtonActive : ''}`}
            title="Add Link"
            disabled={disabled}
          >
            <LinkIcon size={16} />
          </button>
          {onAttachmentClick && (
            <button
              type="button"
              onClick={onAttachmentClick}
              className={styles.toolbarButton}
              title="Attach file"
              disabled={disabled || uploadingFiles}
            >
              <Paperclip size={16} />
            </button>
          )}
        </div>

        <div className={styles.toolbarSpacer} />

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            className={styles.toolbarButton}
            title="Undo (Ctrl+Z)"
            disabled={!editor.can().undo() || disabled}
          >
            <Undo size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            className={styles.toolbarButton}
            title="Redo (Ctrl+Y)"
            disabled={!editor.can().redo() || disabled}
          >
            <Redo size={16} />
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.toolbarButton}
              title="Cancel"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Bubble Menu - appears when text is selected */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className={styles.bubbleMenu}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${styles.bubbleButton} ${editor.isActive('bold') ? styles.bubbleButtonActive : ''}`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${styles.bubbleButton} ${editor.isActive('italic') ? styles.bubbleButtonActive : ''}`}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`${styles.bubbleButton} ${editor.isActive('strike') ? styles.bubbleButtonActive : ''}`}
          >
            <Strikethrough size={14} />
          </button>
          <button
            type="button"
            onClick={toggleLink}
            className={`${styles.bubbleButton} ${editor.isActive('link') ? styles.bubbleButtonActive : ''}`}
          >
            <LinkIcon size={14} />
          </button>
        </div>
      </BubbleMenu>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
