import React, { useState, useEffect } from 'react';
import { useChai } from '../context/ChaiContext';
import { X, Minimize2, Maximize2, Send, Paperclip, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ComposeEmail: React.FC = () => {
  const {
    isComposeOpen,
    setComposeOpen,
    composeInitialTo,
    setComposeInitialTo,
    sendEmail,
    templates,
    addToast
  } = useChai();

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Set initial "To" address if provided
  useEffect(() => {
    if (isComposeOpen) {
      setTo(composeInitialTo);
      setIsMinimized(false);
    }
  }, [isComposeOpen, composeInitialTo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSelectedFile(files[0]);
    e.target.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const defaultTemplates = [
    { id: 'none', name: 'Blank Template', subject: '', content: '' },
    {
      id: 'discovery',
      name: 'Discovery Call Follow-up',
      subject: 'Great connecting today! | Chaibytes',
      content: 'Hi,\n\nIt was great speaking with you on our discovery call today. I loved hearing more about your plans for your project. \n\nI have put together some initial ideas and will send over a formal proposal by tomorrow. In the meantime, feel free to reply with any additional details.\n\nWarm regards,\nFounder, Chaibytes'
    },
    {
      id: 'proposal',
      name: 'Proposal Presentation',
      subject: 'Proposal: Custom Development & Design System',
      content: 'Hi,\n\nI hope you are doing well.\n\nI have uploaded our comprehensive proposal and estimate for the design system project. You can review the breakdown and scope details directly. Let me know if you would like to hop on a quick call to walk through the deliverables.\n\nBest,\nFounder, Chaibytes'
    }
  ];

  const combinedTemplates = [
    ...defaultTemplates,
    ...templates.map(t => ({
      id: t.resend_template_id,
      name: `${t.name} (${t.category})`,
      subject: `${t.name} campaign`,
      content: `Hi,\n\nThis is a template email using the "${t.name}" layout (Resend Template ID: ${t.resend_template_id}).\n\nWarm regards,\nFounder, Chaibytes`
    }))
  ];

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const selected = combinedTemplates.find(t => t.id === id);
    if (selected && id !== 'none') {
      setSubject(selected.subject);
      setContent(selected.content);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !content) {
      setNotification('Please fill in all fields.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    sendEmail(to, subject, content, selectedTemplate, selectedFile || undefined);
    
    // Clear and close
    setTo('');
    setSubject('');
    setContent('');
    setComposeInitialTo('');
    setSelectedTemplate('none');
    setSelectedFile(null);
    
    // Temporary notification of success
    addToast(`Email successfully sent to ${to}!`, 'success');
    setComposeOpen(false);
  };

  const handleAIImprove = () => {
    if (!content) {
      setNotification('Please write some content first.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    // Simple mock AI rewrite
    setContent(prev => `✨ [AI Optimized Draft] ✨\n\n${prev.replace(/Hi|Hey/g, 'Hello').trim()}\n\nLet me know if this works. Looking forward to partnering!`);
  };

  return (
    <AnimatePresence>
      {isComposeOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`fixed right-6 bottom-0 z-40 bg-surface-app border border-border-app rounded-t-xl shadow-2xl transition-all ${
            isMinimized ? 'w-80 h-12' : 'w-[520px] h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-hover-app/60 rounded-t-xl border-b border-border-app">
            <span className="text-sm font-semibold text-text-primary">New Message</span>
            <div className="flex items-center gap-3 text-text-secondary">
              <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-text-primary transition-colors">
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setComposeOpen(false);
                  setComposeInitialTo('');
                }}
                className="hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form */}
          {!isMinimized && (
            <form onSubmit={handleSend} className="flex flex-col h-[calc(100%-48px)] p-4 justify-between">
              <div className="space-y-3.5">
                {notification && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{notification}</span>
                  </div>
                )}
                
                {/* To */}
                <div className="flex items-center border-b border-border-app/60 pb-1.5">
                  <span className="text-xs text-text-secondary w-12 font-medium">To:</span>
                  <input
                    type="email"
                    required
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="recipient@domain.dev"
                    className="w-full bg-transparent border-0 outline-none text-sm text-text-primary"
                  />
                </div>

                {/* Template Selection */}
                <div className="flex items-center border-b border-border-app/60 pb-1.5">
                  <span className="text-xs text-text-secondary w-12 font-medium">Layout:</span>
                  <select
                    value={selectedTemplate}
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="bg-transparent border-0 outline-none text-xs text-text-primary w-full cursor-pointer"
                  >
                    {combinedTemplates.map(t => (
                      <option key={t.id} value={t.id} className="bg-surface-app text-text-primary">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="flex items-center border-b border-border-app/60 pb-1.5">
                  <span className="text-xs text-text-secondary w-12 font-medium">Subject:</span>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Regarding our partnership..."
                    className="w-full bg-transparent border-0 outline-none text-sm text-text-primary"
                  />
                </div>

                 {/* Message Body */}
                <textarea
                  value={content}
                  required
                  onChange={e => setContent(e.target.value)}
                  placeholder="Hey Sarah, loved your product launch..."
                  className="w-full h-44 bg-transparent border-0 outline-none resize-none text-sm text-text-primary font-light placeholder:text-text-secondary/60 focus:ring-0"
                />

                {/* Selected File Attachment */}
                {selectedFile && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-app/40">
                    <div className="flex items-center gap-1.5 bg-hover-app border border-border-app px-2.5 py-1 rounded-lg text-[10px] text-text-primary shadow-sm">
                      <Paperclip className="w-3 h-3 text-text-secondary" />
                      <span className="truncate max-w-[120px] font-mono">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-text-secondary hover:text-red-500 font-bold ml-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-border-app/60 pt-3 bg-surface-app">
                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black font-semibold text-xs px-4 py-2 rounded-lg hover:opacity-90 shadow transition-all"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="p-2 rounded-lg hover:bg-hover-app text-text-secondary transition-colors"
                    title="Attach File"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAIImprove}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-app/20 hover:bg-hover-app text-primary-app font-medium text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent-app" />
                  <span>AI Enhance</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
