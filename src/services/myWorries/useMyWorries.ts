import { useEffect, useState } from 'react';
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
import { selectMyWorries } from './prdPolicy';
import type { MyWorryListItem, PrdWorryDoc } from './types';

function toPrdWorryDocs(snapshot: QuerySnapshot<DocumentData>): PrdWorryDoc[] {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrdWorryDoc));
}

export function useMyWorries(params: {
  user: { uid: string } | null;
  firestore?: Firestore;
}) {
  const { user, firestore = db } = params;
  const [myWorries, setMyWorries] = useState<MyWorryListItem[]>([]);
  const [isLoadingMyWorries, setIsLoadingMyWorries] = useState(false);
  const [myWorriesError, setMyWorriesError] = useState<string | undefined>();

  useEffect(() => {
    if (!user) {
      setMyWorries([]);
      setIsLoadingMyWorries(false);
      setMyWorriesError(undefined);
      return;
    }

    let latestWorries: PrdWorryDoc[] = [];
    setIsLoadingMyWorries(true);
    setMyWorriesError(undefined);

    function recompute() {
      setMyWorries(selectMyWorries({
        worries: latestWorries,
        userUid: user.uid,
      }));
    }

    const unsubscribeWorries = onSnapshot(
      query(collection(firestore, 'worries'), where('authorUid', '==', user.uid)),
      snapshot => {
        latestWorries = toPrdWorryDocs(snapshot);
        recompute();
        setIsLoadingMyWorries(false);
        setMyWorriesError(undefined);
      },
      error => {
        logFirestoreListenerError('My worries listener error:', error);
        setMyWorries([]);
        setIsLoadingMyWorries(false);
        setMyWorriesError('작성한 고민을 불러오지 못했습니다.');
      }
    );

    return () => {
      unsubscribeWorries();
    };
  }, [firestore, user]);

  return { myWorries, isLoadingMyWorries, myWorriesError };
}
