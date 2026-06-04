import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Firestore,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db, logFirestoreListenerError } from '../../firebase';
import {
  selectUnreadReplyCountForMyWorries,
  summarizeMyWorryActivity,
} from './prdPolicy';
import type { MyWorryListItem, PrdReplyDoc, ReplyReadStateDoc } from './types';

function toPrdReplyDocs(snapshot: QuerySnapshot<DocumentData>): PrdReplyDoc[] {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrdReplyDoc));
}

function toReplyReadStateDocs(snapshot: QuerySnapshot<DocumentData>): ReplyReadStateDoc[] {
  return snapshot.docs.map(doc => ({ replyId: doc.id, ...doc.data() } as ReplyReadStateDoc));
}

export function useMyWorryActivitySummary(params: {
  user: { uid: string } | null;
  worries: readonly MyWorryListItem[];
  firestore?: Firestore;
}) {
  const { user, worries, firestore = db } = params;
  const [replyDocs, setReplyDocs] = useState<PrdReplyDoc[]>([]);
  const [readStatesByReplyId, setReadStatesByReplyId] = useState(new Map<string, ReplyReadStateDoc>());

  useEffect(() => {
    if (!user) {
      setReplyDocs([]);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(firestore, 'replies'),
        where('authorUid', '==', user.uid),
        where('publisherVisible', '==', true),
        where('status', '==', 'active')
      ),
      snapshot => {
        setReplyDocs(toPrdReplyDocs(snapshot));
      },
      error => {
        logFirestoreListenerError('My worry activity replies listener error:', error);
        setReplyDocs([]);
      }
    );

    return () => unsubscribe();
  }, [firestore, user]);

  useEffect(() => {
    if (!user) {
      setReadStatesByReplyId(new Map());
      return;
    }

    const unsubscribe = onSnapshot(
      collection(firestore, 'users', user.uid, 'replyReadStates'),
      snapshot => {
        setReadStatesByReplyId(new Map(
          toReplyReadStateDocs(snapshot).map(readState => [readState.replyId ?? '', readState])
        ));
      },
      error => {
        logFirestoreListenerError('My worry activity read-state listener error:', error);
        setReadStatesByReplyId(new Map());
      }
    );

    return () => unsubscribe();
  }, [firestore, user]);

  return useMemo(() => {
    const visibleWorryIds = new Set(worries.map(worry => worry.id));
    const unreadReplyCount = user
      ? selectUnreadReplyCountForMyWorries({
        replies: replyDocs,
        userUid: user.uid,
        visibleWorryIds,
        readStatesByReplyId,
      })
      : 0;

    return summarizeMyWorryActivity({ worries, unreadReplyCount });
  }, [readStatesByReplyId, replyDocs, user, worries]);
}
