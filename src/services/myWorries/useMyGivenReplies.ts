import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Firestore,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db, logFirestoreListenerError } from '../../firebase';
import {
  composeReplyReadModel,
  selectMyGivenReplies,
} from './prdPolicy';
import type { PrdFeedbackDoc, PrdReplyDoc, PrdWorryDoc, ReplyReadModelItem } from './types';

function toPrdReplyDocs(snapshot: QuerySnapshot<DocumentData>): PrdReplyDoc[] {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrdReplyDoc));
}

function toPrdFeedbackDocs(snapshot: QuerySnapshot<DocumentData>): PrdFeedbackDoc[] {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrdFeedbackDoc));
}

function toPrdWorryDocs(snapshot: QuerySnapshot<DocumentData>): PrdWorryDoc[] {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrdWorryDoc));
}

export function useMyGivenReplies(params: {
  user: { uid: string } | null;
  firestore?: Firestore;
}) {
  const { user, firestore = db } = params;
  const [prdReplyDocs, setPrdReplyDocs] = useState<PrdReplyDoc[]>([]);
  const [worriesById, setWorriesById] = useState(new Map<string, PrdWorryDoc>());
  const [feedbacksByReplyId, setFeedbacksByReplyId] = useState(new Map<string, PrdFeedbackDoc>());
  const [isLoadingMyGivenReplies, setIsLoadingMyGivenReplies] = useState(false);

  useEffect(() => {
    if (!user) {
      setPrdReplyDocs([]);
      setIsLoadingMyGivenReplies(false);
      return;
    }
    setIsLoadingMyGivenReplies(true);

    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'replies'),
        where('replierUid', '==', user.uid),
        where('status', '==', 'active')
      ),
      snapshot => {
        const docs = toPrdReplyDocs(snapshot);
        setPrdReplyDocs(docs);
        setIsLoadingMyGivenReplies(false);
      },
      error => {
        logFirestoreListenerError('My given replies listener error:', error);
        setPrdReplyDocs([]);
        setIsLoadingMyGivenReplies(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, user]);

  useEffect(() => {
    if (!user || prdReplyDocs.length === 0) {
      setWorriesById(new Map());
      return;
    }

    const worryIds = [...new Set(prdReplyDocs.map(reply => reply.worryId).filter((id): id is string => typeof id === 'string' && id.length > 0))];
    if (worryIds.length === 0) {
      setWorriesById(new Map());
      return;
    }

    const unsubscriptions = worryIds.map(worryId => onSnapshot(
      query(collection(firestore, 'worries'), where(documentId(), '==', worryId)),
      snapshot => {
        setWorriesById(prev => {
          const next = new Map(prev);
          for (const worry of toPrdWorryDocs(snapshot)) {
            next.set(worry.id, worry);
          }
          if (snapshot.empty) next.set(worryId, { id: worryId, status: 'deleted' });
          return next;
        });
      },
      error => {
        logFirestoreListenerError('My given reply source worry listener error:', error);
        setWorriesById(prev => {
          const next = new Map(prev);
          next.set(worryId, { id: worryId, status: 'deleted' });
          return next;
        });
      }
    ));

    return () => unsubscriptions.forEach(unsubscribe => unsubscribe());
  }, [firestore, prdReplyDocs, user]);

  useEffect(() => {
    if (!user) {
      setFeedbacksByReplyId(new Map());
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'feedbacks'),
        where('replierUid', '==', user.uid),
        where('type', '==', 'like')
      ),
      snapshot => {
        setFeedbacksByReplyId(new Map(
          toPrdFeedbackDocs(snapshot).map(feedback => [feedback.replyId ?? feedback.id, feedback])
        ));
      },
      error => {
        logFirestoreListenerError('My feedback listener error:', error);
        setFeedbacksByReplyId(new Map());
      }
    );

    return () => unsubscribe();
  }, [firestore, user]);

  const myGivenReplies = useMemo(() => {
    const sourceWorryIds = [...new Set(prdReplyDocs.map(reply => reply.worryId).filter((id): id is string => typeof id === 'string' && id.length > 0))];
    const sourceWorriesReady = sourceWorryIds.length === 0 || sourceWorryIds.every(worryId => worriesById.has(worryId));

    return composeReplyReadModel({
      prdReplies: selectMyGivenReplies({
        replies: prdReplyDocs,
        userUid: user?.uid ?? '',
        feedbacksByReplyId,
        worriesById: sourceWorriesReady ? worriesById : undefined,
      }),
      mode: 'given_by_me',
    });
  }, [feedbacksByReplyId, prdReplyDocs, user?.uid, worriesById]);

  return { myGivenReplies, isLoadingMyGivenReplies };
}
