'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, Search } from 'lucide-react';
import { BriefCard } from '@/components/research';
import { Button, Card, Input, Modal } from '@/components/ui';
import { useStrategy } from '@/context';

export default function ResearchPage() {
  const { drafts, deleteDraft } = useStrategy();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter drafts by search query
  const filteredDrafts = drafts.filter(
    (draft) =>
      draft.marketQuestion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.sedaPost?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteDraft(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={28} className="text-bullish" />
          <h1 className="text-3xl font-bold text-text-primary">Research</h1>
        </div>
        <p className="text-text-secondary">
          Your saved market briefs and Seda posts. {drafts.length} draft
          {drafts.length !== 1 ? 's' : ''} saved.
        </p>
      </motion.div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your research..."
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* Drafts list */}
      {filteredDrafts.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredDrafts.map((draft, index) => (
            <motion.div
              key={draft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <BriefCard
                draft={draft}
                onDelete={(id) => setDeleteConfirmId(id)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card padding="lg" className="text-center">
          <FileText size={48} className="mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {searchQuery ? 'No matching drafts' : 'No research saved yet'}
          </h3>
          <p className="text-text-secondary mb-4">
            {searchQuery
              ? 'Try a different search term'
              : 'Generate AI briefs and save Seda posts from market pages to see them here.'}
          </p>
          {!searchQuery && (
            <a href="/">
              <Button variant="primary">Explore Markets</Button>
            </a>
          )}
        </Card>
      )}

      {/* Tips section */}
      {drafts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <Card padding="md" className="bg-bullish/5 border-bullish/20">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              💡 Seda Post Tips
            </h3>
            <ul className="text-sm text-text-secondary space-y-1">
              <li>
                • Include specific evidence and data points to spark quality debates
              </li>
              <li>• Frame your thesis clearly but acknowledge uncertainty</li>
              <li>
                • Use debate prompts that invite diverse perspectives
              </li>
              <li>
                • Don&apos;t forget the{' '}
                <span className="font-mono text-bullish">#nexhacks</span> tag!
              </li>
            </ul>
          </Card>
        </motion.div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Draft?"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          Are you sure you want to delete this research draft? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            className="flex-1 bg-bearish hover:bg-bearish-hover"
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
