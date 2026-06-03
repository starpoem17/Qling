import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { ReportUserScreen } from './ReportUserScreen';

export interface ReportUserContainerProps {
  user: FirebaseUser | null;
  targetUid: string;
  targetNickname: string;
  chatId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function ReportUserContainer({
  user,
  targetUid,
  targetNickname,
  chatId,
  onBack,
  onSuccess,
}: ReportUserContainerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (reason: string, description: string) => {
    if (!user) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUid: targetUid,
          chatId,
          reason,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit report');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Report submission error:', error);
      setSubmitError(error.message || '신고 접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ReportUserScreen
      onBack={onBack}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      targetNickname={targetNickname}
    />
  );
}
