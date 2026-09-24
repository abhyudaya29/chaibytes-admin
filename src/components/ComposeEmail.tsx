import React, { useEffect, useRef, useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { AlertCircle, Paperclip, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [selectedTemplate, setSelectedTemplate] = useState('none');
  const [notification, setNotification] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ filename: string; content: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isComposeOpen) {
      setTo(composeInitialTo);
      setNotification(null);
    }
  }, [isComposeOpen, composeInitialTo]);

  const templateOptions = [
    { id: 'none', name: 'No template', subject: '', content: '' },
    {
      id: 'discovery',
      name: 'Discovery follow-up',
      subject: 'Following up on your inquiry',
      content: 'Hi,\n\nThanks for reaching out. I wanted to follow up and see if you would like to schedule a consultation.\n\nBest,\nChaibytes'
    },
    {
      id: 'proposal',
      name: 'Proposal follow-up',
      subject: 'Proposal follow-up',
      content: 'Hi,\n\nI am checking in on the proposal shared earlier. Happy to answer any questions or adjust scope if needed.\n\nBest,\nChaibytes'
    },
    ...templates.map(t => ({
      id: t.resend_template_id,
      name: t.name,
      subject: `${t.name}`,
      content: `This email references Resend template ${t.resend_template_id}. For automated CRM sends, use Email Messages or the Leads page.`
    }))
  ];

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const selected = templateOptions.find(t => t.id === id);
    if (selected && id !== 'none') {
      setSubject(selected.subject);
      setContent(selected.content);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = loadEvent => {
        const result = loadEvent.target?.result as string;
        setAttachments(prev => [...prev, { filename: file.name, content: result.split(',')[1] }]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!to || !subject || !content) {
      setNotification('Recipient, subject, and message are required.');
      return;
    }

    sendEmail(to, subject, content, selectedTemplate, attachments);
    addToast(`Email sent to ${to}`, 'success');
    setTo('');
    setSubject('');
    setContent('');
    setSelectedTemplate('none');
    setAttachments([]);
    setComposeInitialTo('');
    setComposeOpen(false);
  };

  const close = () => {
    setComposeOpen(false);
    setComposeInitialTo('');
    setNotification(null);
  };

  return (
    <AnimatePresence>
      {isComposeOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            className="w-full max-w-2xl bg-surface-app border border-border-app rounded-lg shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border-app px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Send manual email</h2>
                <p className="text-xs text-text-secondary mt-1">For automated Resend templates, use Leads or Email Messages.</p>
              </div>
              <button onClick={close} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-hover-app">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-5 space-y-4">
              {notification && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{notification}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-text-secondary">Recipient</span>
                  <input
                    type="email"
                    required
                    value={to}
                    onChange={event => setTo(event.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full rounded-lg border border-border-app bg-hover-app/30 px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-app"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-text-secondary">Starter Template</span>
                  <select
                    value={selectedTemplate}
                    onChange={event => handleTemplateChange(event.target.value)}
                    className="w-full rounded-lg border border-border-app bg-hover-app/30 px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-app"
                  >
                    {templateOptions.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-text-secondary">Subject</span>
                <input
                  required
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                  placeholder="Subject"
                  className="w-full rounded-lg border border-border-app bg-hover-app/30 px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-app"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-semibold text-text-secondary">Message</span>
                <textarea
                  required
                  rows={9}
                  value={content}
                  onChange={event => setContent(event.target.value)}
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-lg border border-border-app bg-hover-app/30 px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-app"
                />
              </label>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={`${file.filename}-${index}`} className="flex items-center gap-2 rounded-lg border border-border-app bg-hover-app px-2.5 py-1.5 text-xs text-text-primary">
                      <Paperclip className="w-3.5 h-3.5 text-text-secondary" />
                      <span className="max-w-[180px] truncate">{file.filename}</span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-text-secondary hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border-app pt-4">
                <div className="flex items-center gap-2">
                  <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-primary-app px-4 py-2 text-xs font-semibold text-white hover:opacity-95">
                    <Send className="w-3.5 h-3.5" />
                    Send email
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-border-app px-3 py-2 text-xs font-semibold text-text-primary hover:bg-hover-app"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach
                  </button>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                </div>
                <button type="button" onClick={close} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-hover-app hover:text-text-primary">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
