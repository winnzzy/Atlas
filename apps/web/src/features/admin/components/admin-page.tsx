'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@atlas/ui';

export type AdminPageProps = {
  readonly title: string;
  readonly description: string;
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
};

export function AdminPage({ title, description, actions, children }: AdminPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-5"
    >
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </motion.div>
  );
}
