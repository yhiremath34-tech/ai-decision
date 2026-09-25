import React from 'react';
import { DecisionStatus } from '../../types/index.js';
import { Badge } from '../ui/Badge.js';

export const DecisionStatusBadge: React.FC<{ status: DecisionStatus }> = ({ status }) => {
  switch (status) {
    case 'draft':
      return <Badge variant="slate">Draft</Badge>;
    case 'analysis_ready':
      return <Badge variant="brand">Ready for Analysis</Badge>;
    case 'analyzing':
      return <Badge variant="purple" className="animate-pulse">Analyzing...</Badge>;
    case 'analyzed':
      return <Badge variant="purple">Analyzed</Badge>;
    case 'reviewed':
      return <Badge variant="brand">Reviewed</Badge>;
    case 'decided':
      return <Badge variant="success">Decided</Badge>;
    case 'archived':
      return <Badge variant="slate">Archived</Badge>;
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};
